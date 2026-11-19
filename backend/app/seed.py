"""Idempotent seed: system accounts plus realistic catalog and operations data."""

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.financing_calculator import (
    calculate_financed_amount,
    calculate_price_installment,
)
from app.core.notification_status import NotificationStatus
from app.core.notification_types import NotificationType
from app.core.payment_methods import PaymentMethod
from app.core.payment_status import PaymentStatus
from app.core.roles import UserRole
from app.core.sale_status import SaleStatus
from app.core.security import hash_password
from app.core.test_drive_status import TestDriveStatus
from app.core.vehicle_status import VehicleStatus
from app.database.connection import SessionLocal
from app.models.cliente import Cliente
from app.models.colaborador import Colaborador
from app.models.notificacao import Notificacao
from app.models.pagamento import Pagamento
from app.models.simulacao_financiamento import SimulacaoFinanciamento
from app.models.test_drive import TestDrive
from app.models.usuario import Usuario
from app.models.veiculo import Veiculo
from app.models.venda import Venda

SEED_CLIENT_CPF = "39053344705"
DEMO_MARKER_EMAIL = "ana.souza@example.com"


def _now() -> datetime:
    return datetime.now(UTC)


def _days_ago(days: int, hours: int = 10) -> datetime:
    return _now() - timedelta(days=days, hours=hours)


def _cpf_from_base(base9: str) -> str:
    def digit(base: str, weights: list[int]) -> str:
        total = sum(int(base[i]) * weights[i] for i in range(len(weights)))
        remainder = total % 11
        return "0" if remainder < 2 else str(11 - remainder)

    first = digit(base9, list(range(10, 1, -1)))
    second = digit(base9 + first, list(range(11, 1, -1)))
    return base9 + first + second


def _user_exists(db: Session, email: str) -> bool:
    return db.scalar(select(Usuario.id).where(Usuario.email == email)) is not None


def _client_by_email(db: Session, email: str) -> Cliente | None:
    return db.scalar(select(Cliente).where(Cliente.email == email))


def _vehicle_by_key(db: Session, marca: str, modelo: str, ano: int) -> Veiculo | None:
    return db.scalar(
        select(Veiculo).where(
            Veiculo.marca == marca,
            Veiculo.modelo == modelo,
            Veiculo.ano == ano,
        )
    )


def _seed_client(db: Session) -> Cliente:
    email = settings.seed_client_email
    existing = _client_by_email(db, email)
    if existing is not None:
        if not _user_exists(db, email):
            db.add(
                Usuario(
                    email=email,
                    password_hash=hash_password(settings.seed_client_password),
                    role=UserRole.CLIENT,
                    cliente_id=existing.id,
                )
            )
        return existing

    cliente = Cliente(
        nome="Marina Alves",
        cpf_cnpj=SEED_CLIENT_CPF,
        email=email,
        telefone="11987654321",
        endereco="Rua das Palmeiras, 120 - Jardins, São Paulo/SP",
        data_cadastro=_days_ago(120),
    )
    db.add(cliente)
    db.flush()

    db.add(
        Usuario(
            email=email,
            password_hash=hash_password(settings.seed_client_password),
            role=UserRole.CLIENT,
            cliente_id=cliente.id,
        )
    )
    return cliente


def _seed_employee(
    db: Session,
    *,
    email: str,
    password: str,
    role: UserRole,
    nome: str,
    cargo: str,
    telefone: str,
) -> None:
    if _user_exists(db, email):
        return

    colaborador = Colaborador(
        nome=nome,
        email=email,
        telefone=telefone,
        cargo=cargo,
        ativo=True,
    )
    db.add(colaborador)
    db.flush()

    db.add(
        Usuario(
            email=email,
            password_hash=hash_password(password),
            role=role,
            colaborador_id=colaborador.id,
        )
    )


def _get_or_create_client(
    db: Session,
    *,
    nome: str,
    cpf_cnpj: str,
    email: str,
    telefone: str,
    endereco: str,
    data_cadastro: datetime,
) -> Cliente:
    existing = _client_by_email(db, email)
    if existing is not None:
        return existing

    cliente = Cliente(
        nome=nome,
        cpf_cnpj=cpf_cnpj,
        email=email,
        telefone=telefone,
        endereco=endereco,
        data_cadastro=data_cadastro,
    )
    db.add(cliente)
    db.flush()
    return cliente


def _get_or_create_vehicle(
    db: Session,
    *,
    marca: str,
    modelo: str,
    ano: int,
    cor: str,
    quilometragem: int,
    preco: str,
    status: VehicleStatus,
    descricao: str,
) -> Veiculo:
    existing = _vehicle_by_key(db, marca, modelo, ano)
    if existing is not None:
        return existing

    vehicle = Veiculo(
        marca=marca,
        modelo=modelo,
        ano=ano,
        cor=cor,
        quilometragem=quilometragem,
        preco=Decimal(preco),
        status=status,
        descricao=descricao,
    )
    db.add(vehicle)
    db.flush()
    return vehicle


def _sale_exists(db: Session, cliente_id, veiculo_id) -> bool:
    return (
        db.scalar(
            select(Venda.id).where(
                Venda.cliente_id == cliente_id,
                Venda.veiculo_id == veiculo_id,
            )
        )
        is not None
    )


def _create_sale(
    db: Session,
    *,
    cliente: Cliente,
    veiculo: Veiculo,
    status: SaleStatus,
    forma_pagamento: PaymentMethod,
    data_venda: datetime,
    observacoes: str | None,
) -> Venda | None:
    if _sale_exists(db, cliente.id, veiculo.id):
        return db.scalar(
            select(Venda).where(
                Venda.cliente_id == cliente.id,
                Venda.veiculo_id == veiculo.id,
            )
        )

    sale = Venda(
        cliente_id=cliente.id,
        veiculo_id=veiculo.id,
        data_venda=data_venda,
        valor_total=veiculo.preco,
        status=status,
        forma_pagamento=forma_pagamento,
        observacoes=observacoes,
    )
    db.add(sale)
    db.flush()
    return sale


def _payment_exists(db: Session, venda_id, status: PaymentStatus, observacoes: str | None) -> bool:
    statement = select(Pagamento.id).where(
        Pagamento.venda_id == venda_id,
        Pagamento.status == status,
    )
    if observacoes is None:
        statement = statement.where(Pagamento.observacoes.is_(None))
    else:
        statement = statement.where(Pagamento.observacoes == observacoes)
    return db.scalar(statement) is not None


def _create_payment(
    db: Session,
    *,
    venda: Venda,
    tipo: PaymentMethod,
    valor: Decimal,
    status: PaymentStatus,
    data_pagamento: datetime,
    observacoes: str | None,
) -> None:
    if _payment_exists(db, venda.id, status, observacoes):
        return

    db.add(
        Pagamento(
            venda_id=venda.id,
            tipo=tipo,
            valor=valor,
            data_pagamento=data_pagamento,
            status=status,
            observacoes=observacoes,
        )
    )


def _test_drive_exists(db: Session, cliente_id, veiculo_id, status: TestDriveStatus) -> bool:
    return (
        db.scalar(
            select(TestDrive.id).where(
                TestDrive.cliente_id == cliente_id,
                TestDrive.veiculo_id == veiculo_id,
                TestDrive.status == status,
            )
        )
        is not None
    )


def _create_test_drive(
    db: Session,
    *,
    cliente: Cliente,
    veiculo: Veiculo,
    data_agendamento: datetime,
    status: TestDriveStatus,
    observacoes: str | None,
    data_realizacao: datetime | None = None,
) -> None:
    if _test_drive_exists(db, cliente.id, veiculo.id, status):
        return

    db.add(
        TestDrive(
            cliente_id=cliente.id,
            veiculo_id=veiculo.id,
            data_agendamento=data_agendamento,
            data_realizacao=data_realizacao,
            status=status,
            observacoes=observacoes,
        )
    )


def _simulation_exists(db: Session, cliente_id, veiculo_id) -> bool:
    return (
        db.scalar(
            select(SimulacaoFinanciamento.id).where(
                SimulacaoFinanciamento.cliente_id == cliente_id,
                SimulacaoFinanciamento.veiculo_id == veiculo_id,
            )
        )
        is not None
    )


def _create_simulation(
    db: Session,
    *,
    cliente: Cliente,
    veiculo: Veiculo,
    valor_entrada: Decimal,
    prazo_meses: int,
    data_simulacao: datetime,
) -> None:
    if _simulation_exists(db, cliente.id, veiculo.id):
        return

    taxa = settings.financing_monthly_interest_rate
    financed = calculate_financed_amount(veiculo.preco, valor_entrada)
    parcela = calculate_price_installment(financed, taxa, prazo_meses)
    db.add(
        SimulacaoFinanciamento(
            cliente_id=cliente.id,
            veiculo_id=veiculo.id,
            valor_veiculo=veiculo.preco,
            valor_entrada=valor_entrada,
            prazo_meses=prazo_meses,
            taxa_juros=taxa,
            valor_parcela=parcela,
            data_simulacao=data_simulacao,
        )
    )


def _notification_exists(db: Session, cliente_id, mensagem: str) -> bool:
    return (
        db.scalar(
            select(Notificacao.id).where(
                Notificacao.cliente_id == cliente_id,
                Notificacao.mensagem == mensagem,
            )
        )
        is not None
    )


def _create_notification(
    db: Session,
    *,
    cliente: Cliente,
    tipo: NotificationType,
    mensagem: str,
    status: NotificationStatus,
    data_envio: datetime,
) -> None:
    if _notification_exists(db, cliente.id, mensagem):
        return

    db.add(
        Notificacao(
            cliente_id=cliente.id,
            tipo=tipo,
            mensagem=mensagem,
            data_envio=data_envio,
            status=status,
        )
    )


def _seed_demo_data(db: Session, account_client: Cliente) -> None:
    ana = _get_or_create_client(
        db,
        nome="Ana Souza",
        cpf_cnpj=_cpf_from_base("529982247"),
        email=DEMO_MARKER_EMAIL,
        telefone="11984561234",
        endereco="Av. Paulista, 1578 - Bela Vista, São Paulo/SP",
        data_cadastro=_days_ago(90),
    )
    bruno = _get_or_create_client(
        db,
        nome="Bruno Lima",
        cpf_cnpj=_cpf_from_base("153509460"),
        email="bruno.lima@example.com",
        telefone="21998877665",
        endereco="Rua Voluntários da Pátria, 88 - Botafogo, Rio de Janeiro/RJ",
        data_cadastro=_days_ago(75),
    )
    carla = _get_or_create_client(
        db,
        nome="Carla Mendes",
        cpf_cnpj=_cpf_from_base("111444777"),
        email="carla.mendes@example.com",
        telefone="31991234567",
        endereco="Av. Afonso Pena, 4000 - Funcionários, Belo Horizonte/MG",
        data_cadastro=_days_ago(40),
    )
    diego = _get_or_create_client(
        db,
        nome="Diego Rocha Comércio Ltda",
        cpf_cnpj="11444777000161",
        email="diego.rocha@example.com",
        telefone="41997771234",
        endereco="Rua XV de Novembro, 650 - Centro, Curitiba/PR",
        data_cadastro=_days_ago(20),
    )

    corolla = _get_or_create_vehicle(
        db,
        marca="Toyota",
        modelo="Corolla Cross",
        ano=2024,
        cor="Branco Pérola",
        quilometragem=12800,
        preco="148900.00",
        status=VehicleStatus.DISPONIVEL,
        descricao="SUV compacto com pacote XRE, único dono, revisões na concessionária.",
    )
    civic = _get_or_create_vehicle(
        db,
        marca="Honda",
        modelo="Civic",
        ano=2023,
        cor="Cinza Graphite",
        quilometragem=22150,
        preco="132500.00",
        status=VehicleStatus.DISPONIVEL,
        descricao="Touring 1.5 turbo, teto solar, bancos em couro e sensor de estacionamento.",
    )
    onix = _get_or_create_vehicle(
        db,
        marca="Chevrolet",
        modelo="Onix Plus",
        ano=2022,
        cor="Prata Switchblade",
        quilometragem=35400,
        preco="78900.00",
        status=VehicleStatus.DISPONIVEL,
        descricao="Premier 1.0 turbo automático, MyLink e câmera de ré.",
    )
    tcross = _get_or_create_vehicle(
        db,
        marca="Volkswagen",
        modelo="T-Cross",
        ano=2024,
        cor="Azul Cosmos",
        quilometragem=8900,
        preco="139990.00",
        status=VehicleStatus.DISPONIVEL,
        descricao="Highline 250 TSI, teto panorâmico e pacote de segurança completo.",
    )
    compass = _get_or_create_vehicle(
        db,
        marca="Jeep",
        modelo="Compass",
        ano=2021,
        cor="Preto Carbon",
        quilometragem=48200,
        preco="118000.00",
        status=VehicleStatus.DISPONIVEL,
        descricao="Limited 2.0 diesel 4x4, ideal para uso misto cidade e estrada.",
    )
    hb20 = _get_or_create_vehicle(
        db,
        marca="Hyundai",
        modelo="HB20",
        ano=2023,
        cor="Vermelho Fiery",
        quilometragem=18750,
        preco="72900.00",
        status=VehicleStatus.DISPONIVEL,
        descricao="Platinum 1.0 turbo, baixo consumo e garantia de fábrica vigente.",
    )
    ranger = _get_or_create_vehicle(
        db,
        marca="Ford",
        modelo="Ranger",
        ano=2022,
        cor="Branco Ártico",
        quilometragem=41000,
        preco="189900.00",
        status=VehicleStatus.RESERVADO,
        descricao="Limited 3.2 diesel, cabine dupla, preparada para uso comercial.",
    )
    kicks = _get_or_create_vehicle(
        db,
        marca="Nissan",
        modelo="Kicks",
        ano=2023,
        cor="Laranja Energetic",
        quilometragem=16300,
        preco="109500.00",
        status=VehicleStatus.RESERVADO,
        descricao="Exclusive CVT, painel digital e assistente de faixa.",
    )
    creta = _get_or_create_vehicle(
        db,
        marca="Hyundai",
        modelo="Creta",
        ano=2024,
        cor="Cinza Silk",
        quilometragem=6200,
        preco="154900.00",
        status=VehicleStatus.VENDIDO,
        descricao="Limited 1.0 turbo, vendido com nota fiscal e histórico completo.",
    )
    tracker = _get_or_create_vehicle(
        db,
        marca="Chevrolet",
        modelo="Tracker",
        ano=2023,
        cor="Azul Midnight",
        quilometragem=19800,
        preco="127400.00",
        status=VehicleStatus.VENDIDO,
        descricao="Premier 1.2 turbo, já transferido ao comprador.",
    )
    _get_or_create_vehicle(
        db,
        marca="Fiat",
        modelo="Pulse",
        ano=2022,
        cor="Verde Jungle",
        quilometragem=27500,
        preco="86900.00",
        status=VehicleStatus.INDISPONIVEL,
        descricao="Aguardando peça de funilaria após sinistro leve. Fora de venda.",
    )
    polo = _get_or_create_vehicle(
        db,
        marca="Volkswagen",
        modelo="Polo",
        ano=2024,
        cor="Branco Puro",
        quilometragem=4100,
        preco="98900.00",
        status=VehicleStatus.DISPONIVEL,
        descricao="Highline 200 TSI, seminovo de vitrine com km baixa.",
    )

    sale_creta = _create_sale(
        db,
        cliente=ana,
        veiculo=creta,
        status=SaleStatus.CONCLUIDA,
        forma_pagamento=PaymentMethod.PIX,
        data_venda=_days_ago(18),
        observacoes="Cliente quitou à vista via PIX após test drive.",
    )
    sale_tracker = _create_sale(
        db,
        cliente=bruno,
        veiculo=tracker,
        status=SaleStatus.CONCLUIDA,
        forma_pagamento=PaymentMethod.FINANCIAMENTO,
        data_venda=_days_ago(32),
        observacoes="Financiamento aprovado em 48x. Documentação enviada ao banco.",
    )
    sale_ranger = _create_sale(
        db,
        cliente=carla,
        veiculo=ranger,
        status=SaleStatus.EM_PROCESSAMENTO,
        forma_pagamento=PaymentMethod.CARTAO,
        data_venda=_days_ago(3),
        observacoes="Aguardando confirmação das parcelas no cartão corporativo.",
    )
    sale_kicks = _create_sale(
        db,
        cliente=account_client,
        veiculo=kicks,
        status=SaleStatus.PENDENTE,
        forma_pagamento=PaymentMethod.TRANSFERENCIA,
        data_venda=_days_ago(1, hours=4),
        observacoes="Proposta aberta pela cliente autenticada. Transferência a confirmar.",
    )
    sale_cancelled = _create_sale(
        db,
        cliente=diego,
        veiculo=hb20,
        status=SaleStatus.CANCELADA,
        forma_pagamento=PaymentMethod.DINHEIRO,
        data_venda=_days_ago(12),
        observacoes="Cancelada a pedido do cliente; veículo retornou ao estoque.",
    )

    if sale_creta is not None:
        _create_payment(
            db,
            venda=sale_creta,
            tipo=PaymentMethod.PIX,
            valor=creta.preco,
            status=PaymentStatus.APROVADO,
            data_pagamento=_days_ago(17, hours=8),
            observacoes="PIX recebido e conciliado.",
        )
    if sale_tracker is not None:
        _create_payment(
            db,
            venda=sale_tracker,
            tipo=PaymentMethod.FINANCIAMENTO,
            valor=tracker.preco,
            status=PaymentStatus.APROVADO,
            data_pagamento=_days_ago(30),
            observacoes="Liberação do banco confirmada.",
        )
    if sale_ranger is not None:
        _create_payment(
            db,
            venda=sale_ranger,
            tipo=PaymentMethod.CARTAO,
            valor=ranger.preco,
            status=PaymentStatus.PENDENTE,
            data_pagamento=_days_ago(2),
            observacoes="Autorização do cartão em análise.",
        )
    if sale_kicks is not None:
        _create_payment(
            db,
            venda=sale_kicks,
            tipo=PaymentMethod.TRANSFERENCIA,
            valor=Decimal("20000.00"),
            status=PaymentStatus.PENDENTE,
            data_pagamento=_days_ago(1, hours=2),
            observacoes="Sinal via TED. Saldo pendente.",
        )
    if sale_cancelled is not None:
        _create_payment(
            db,
            venda=sale_cancelled,
            tipo=PaymentMethod.DINHEIRO,
            valor=Decimal("5000.00"),
            status=PaymentStatus.CANCELADO,
            data_pagamento=_days_ago(12, hours=6),
            observacoes="Sinal estornado após cancelamento da venda.",
        )
        _create_payment(
            db,
            venda=sale_cancelled,
            tipo=PaymentMethod.DINHEIRO,
            valor=Decimal("5000.00"),
            status=PaymentStatus.RECUSADO,
            data_pagamento=_days_ago(13),
            observacoes="Tentativa anterior recusada na conferência de caixa.",
        )

    _create_test_drive(
        db,
        cliente=account_client,
        veiculo=corolla,
        data_agendamento=_now() + timedelta(days=2, hours=3),
        status=TestDriveStatus.AGENDADO,
        observacoes="Cliente pediu avaliação do SUV para uso familiar.",
    )
    _create_test_drive(
        db,
        cliente=ana,
        veiculo=civic,
        data_agendamento=_now() + timedelta(days=1, hours=5),
        status=TestDriveStatus.CONFIRMADO,
        observacoes="Confirmado com o vendedor. Chegada prevista às 14h.",
    )
    _create_test_drive(
        db,
        cliente=bruno,
        veiculo=tracker,
        data_agendamento=_days_ago(35, hours=6),
        status=TestDriveStatus.REALIZADO,
        data_realizacao=_days_ago(35, hours=5),
        observacoes="Test drive realizado antes da compra.",
    )
    _create_test_drive(
        db,
        cliente=carla,
        veiculo=tcross,
        data_agendamento=_days_ago(4),
        status=TestDriveStatus.CANCELADO,
        observacoes="Remarcação solicitada; cliente preferiu avaliar a Ranger.",
    )
    _create_test_drive(
        db,
        cliente=diego,
        veiculo=polo,
        data_agendamento=_days_ago(8, hours=3),
        status=TestDriveStatus.NAO_COMPARECEU,
        observacoes="Cliente não compareceu e não retornou o contato.",
    )

    _create_simulation(
        db,
        cliente=account_client,
        veiculo=corolla,
        valor_entrada=Decimal("30000.00"),
        prazo_meses=48,
        data_simulacao=_days_ago(2),
    )
    _create_simulation(
        db,
        cliente=bruno,
        veiculo=tracker,
        valor_entrada=Decimal("25000.00"),
        prazo_meses=48,
        data_simulacao=_days_ago(33),
    )
    _create_simulation(
        db,
        cliente=carla,
        veiculo=ranger,
        valor_entrada=Decimal("40000.00"),
        prazo_meses=36,
        data_simulacao=_days_ago(5),
    )
    _create_simulation(
        db,
        cliente=ana,
        veiculo=tcross,
        valor_entrada=Decimal("20000.00"),
        prazo_meses=60,
        data_simulacao=_days_ago(10),
    )

    _create_notification(
        db,
        cliente=account_client,
        tipo=NotificationType.VENDA,
        mensagem="Sua proposta do Nissan Kicks foi registrada e está pendente de pagamento.",
        status=NotificationStatus.ENVIADA,
        data_envio=_days_ago(1, hours=3),
    )
    _create_notification(
        db,
        cliente=account_client,
        tipo=NotificationType.TEST_DRIVE,
        mensagem="Test drive do Toyota Corolla Cross agendado. Compareça com CNH original.",
        status=NotificationStatus.PENDENTE,
        data_envio=_days_ago(0, hours=1),
    )
    _create_notification(
        db,
        cliente=ana,
        tipo=NotificationType.PAGAMENTO,
        mensagem="Pagamento via PIX do Hyundai Creta foi aprovado. Obrigado pela compra.",
        status=NotificationStatus.ENVIADA,
        data_envio=_days_ago(17),
    )
    _create_notification(
        db,
        cliente=bruno,
        tipo=NotificationType.FINANCIAMENTO,
        mensagem="Simulação do Chevrolet Tracker disponível na sua área do cliente.",
        status=NotificationStatus.ENVIADA,
        data_envio=_days_ago(33),
    )
    _create_notification(
        db,
        cliente=carla,
        tipo=NotificationType.PAGAMENTO,
        mensagem="Há um pagamento em cartão aguardando aprovação para a Ford Ranger.",
        status=NotificationStatus.PENDENTE,
        data_envio=_days_ago(2),
    )
    _create_notification(
        db,
        cliente=diego,
        tipo=NotificationType.GERAL,
        mensagem="Não foi possível enviar o lembrete de test drive. Verifique o contato cadastrado.",
        status=NotificationStatus.FALHOU,
        data_envio=_days_ago(8),
    )
    _create_notification(
        db,
        cliente=diego,
        tipo=NotificationType.VENDA,
        mensagem="A venda do Hyundai HB20 foi cancelada e o veículo voltou ao estoque.",
        status=NotificationStatus.ENVIADA,
        data_envio=_days_ago(12),
    )


def run_seed() -> None:
    db = SessionLocal()
    try:
        account_client = _seed_client(db)
        _seed_employee(
            db,
            email=settings.seed_seller_email,
            password=settings.seed_seller_password,
            role=UserRole.SELLER,
            nome="Paulo Ferreira",
            cargo="SELLER",
            telefone="11994001002",
        )
        _seed_employee(
            db,
            email=settings.seed_manager_email,
            password=settings.seed_manager_password,
            role=UserRole.MANAGER,
            nome="Helena Castro",
            cargo="MANAGER",
            telefone="11994001003",
        )
        _seed_employee(
            db,
            email=settings.seed_finance_email,
            password=settings.seed_finance_password,
            role=UserRole.FINANCE,
            nome="Ricardo Nogueira",
            cargo="FINANCE",
            telefone="11994001004",
        )
        _seed_employee(
            db,
            email=settings.seed_admin_email,
            password=settings.seed_admin_password,
            role=UserRole.ADMIN,
            nome="Sofia Martins",
            cargo="ADMIN",
            telefone="11994001005",
        )
        _seed_demo_data(db, account_client)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
    print("Seed completed.")
    print("Accounts (emails/passwords from backend/.env):")
    print(f"  CLIENT  {settings.seed_client_email}")
    print(f"  SELLER  {settings.seed_seller_email}")
    print(f"  MANAGER {settings.seed_manager_email}")
    print(f"  FINANCE {settings.seed_finance_email}")
    print(f"  ADMIN   {settings.seed_admin_email}")
    print("Demo data: vehicles, extra clients, sales, payments, test drives,")
    print("financing simulations and notifications (idempotent).")
