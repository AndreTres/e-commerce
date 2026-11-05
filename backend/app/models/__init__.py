from app.models.cliente import Cliente
from app.models.colaborador import Colaborador
from app.models.usuario import Usuario
from app.models.veiculo import Veiculo
from app.models.notificacao import Notificacao
from app.models.pagamento import Pagamento
from app.models.simulacao_financiamento import SimulacaoFinanciamento
from app.models.test_drive import TestDrive
from app.models.venda import Venda

__all__ = [
    "Cliente",
    "Colaborador",
    "Notificacao",
    "Pagamento",
    "SimulacaoFinanciamento",
    "TestDrive",
    "Usuario",
    "Veiculo",
    "Venda",
]
