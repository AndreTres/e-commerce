# AutoHub - E-commerce de veiculos

Projeto full-stack para catalogo, vendas, test drives, financiamento, financeiro,
clientes, notificacoes e relatórios de uma concessionaria.

## Arquitetura

- **Frontend:** React 19, TypeScript e Vite.
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy e Alembic.
- **Banco:** PostgreSQL 16 em Docker.
- **Acesso:** API REST em `http://127.0.0.1:8000`; frontend em `http://localhost:5173`.

Estrutura principal:

```text
backend/   API, migrations, modelos e dados demonstrativos
frontend/  interface web
```

## Requisitos

- Windows 10/11 com PowerShell.
- Docker Desktop com Docker Compose.
- Python 3.11 ou superior.
- Node.js 20 ou superior e npm.
- Git.

## Configuracao local

Todos os comandos abaixo devem ser executados na raiz do repositorio
(`C:\Projetos\e-commerce`).

### 1. Iniciar PostgreSQL

```powershell
docker compose up -d postgres
docker compose ps
```

O banco fica exposto em `localhost:5433`, com estes dados:

| Item | Valor |
|---|---|
| Banco | `ecommerce` |
| Usuario | `ecommerce` |
| Senha | `ecommerce` |
| Porta local | `5433` |

### 2. Configurar o backend

```powershell
cd backend
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Se o arquivo `.env` ja existir, ajuste `DATABASE_URL` para a porta do Docker:

```dotenv
DATABASE_URL=postgresql+psycopg2://ecommerce:ecommerce@localhost:5433/ecommerce
```

O arquivo [backend/.env.example](backend/.env.example) usa a porta de banco correta
apenas como referencia; o arquivo real [backend/.env](backend/.env) ja pode estar
configurado no ambiente local.

Altere `JWT_SECRET_KEY` para um valor aleatorio antes de usar em ambiente compartilhado.

### 3. Criar as tabelas e carregar dados demonstrativos

Com o ambiente virtual ativo e na pasta `backend`:

```powershell
alembic upgrade head
python -m app.seed
```

O seed cria contas, clientes, veiculos, vendas, pagamentos, test drives,
simulacoes de financiamento e notificacoes. Ele e idempotente; executar novamente
nao duplica os dados existentes.

### 4. Iniciar o backend

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verificacoes:

- API: <http://127.0.0.1:8000/>
- Documentacao: <http://127.0.0.1:8000/docs>
- Health check: <http://127.0.0.1:8000/health>

O health check deve retornar `{"status":"ok"}`.

### 5. Configurar e iniciar o frontend

Em outro terminal, na raiz:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

O [frontend/.env.example](frontend/.env.example) deixa `VITE_API_BASE_URL` vazio.
Nesse modo, o Vite encaminha `/api` para `http://127.0.0.1:8000`.

Acesse <http://localhost:5173>.

### Reiniciar ou limpar o ambiente

```powershell
docker compose stop
docker compose start
docker compose down
docker compose down -v
```

Use `docker compose down -v` somente quando quiser apagar todos os dados locais
do banco PostgreSQL.

## Contas demonstrativas

As credenciais sao obtidas de `backend/.env`. Os valores locais padrao sao:

| Perfil | E-mail | Senha |
|---|---|---|
| Cliente | `client@example.com` | `change-me-client` |
| Vendedor | `seller@example.com` | `change-me-seller` |
| Gerente | `manager@example.com` | `change-me-manager` |
| Financeiro | `finance@example.com` | `change-me-finance` |
| Administrador | `admin@example.com` | `change-me-admin` |

O login usa o mesmo formulario para todos os perfis.

## Permissoes por perfil

| Perfil | Modulos administrativos autorizados |
|---|---|
| `SELLER` | Painel, veiculos, clientes, vendas e test drives |
| `MANAGER` | Painel, veiculos, clientes, vendas, test drives e relatorios |
| `FINANCE` | Painel e financeiro |
| `ADMIN` | Todos os modulos administrativos |
| `CLIENT` | Catalogo, perfil, compras, test drives e financiamento |

Ao tentar acessar uma rota nao permitida, o sistema redireciona para a tela de
acesso negado.

## Guia de testes pela interface

Use navegacao normal, formulários, filtros e mensagens de sucesso/erro. Em cada
fluxo, registre o status inicial, os dados enviados e o resultado esperado.

### 0. Preparacao

1. Confirme que PostgreSQL, backend e frontend estao ativos.
2. Abra `http://localhost:5173` em uma janela anonima.
3. Reexecute `python -m app.seed` no backend, se quiser restaurar os dados de
   demonstracao.
4. Use o menu Sair entre perfis.

### 1. Autenticacao

**Login valido**

1. Acesse `/login`.
2. Informe o e-mail e a senha de uma conta demonstrativa.
3. Confirme que o perfil correto abre no painel ou na area do cliente.
4. Verifique no menu que o e-mail e a funcao aparecem.
5. Use Sair e confirme o retorno para a area publica.

**Login invalido**

1. Informe um e-mail valido ou invalido com senha incorreta.
2. Confirme a mensagem “E-mail ou senha invalidos.”
3. Confirme que nenhuma sessao privada foi criada.

**Protecao de rotas**

1. Sem autenticar, tente abrir `/account` ou `/admin`.
2. Confirme o redirecionamento para login.
3. Entre como cliente e tente abrir uma rota `/admin`.
4. Confirme o acesso negado.
5. Entre com perfis diferentes e confirme que apenas os itens permitidos aparecem
   na barra lateral.

### 2. Catalogo publico e detalhes

1. Abra Inicio ou `Veiculos`.
2. Confirme que os veiculos disponiveis aparecem no catalogo.
3. Teste marca/modelo, ano, faixa de preco, quilometragem e status suportados pelos
   filtros da tela.
4. Limpe os filtros e confirme que a listagem completa volta.
5. Abra um veiculo e confira marca, modelo, ano, cor, preco, quilometragem, status
   e descricao.
6. Confira que a ficha informa que compra, test drive e financiamento exigem conta
   de cliente.
7. Para veiculo sem acesso por listagem, tente abrir o `/vehicles/:vehicleId` de um
   ID conhecido e confirme que status nao permitido pelo catalogo nao e anunciado
   como apenas disponivel.

### 3. Perfil do cliente

Entre como `CLIENT`.

1. Abra Minha conta > Meu perfil.
2. Confirme que os dados da conta demonstrativa sao carregados.
3. Altere nome, telefone ou endereco e selecione Salvar alteracoes.
4. Confirme a mensagem de sucesso e recarregue a pagina para validar a persistencia.
5. Informe um CPF/CNPJ ja usado por outro cliente e tente salvar.
6. Confirme que a tela mostra que o documento ja esta cadastrado.
7. Teste email invalido ou telefone fora do formato aceito e confirme a validacao.

### 4. Compras do cliente

Entre como `CLIENT`.

1. Abra Minha conta > Minhas compras.
2. Confira a listagem de vendas vinculadas ao cliente.
3. Filtre por Pendente, Em processamento, Concluida e Cancelada.
4. Abra uma venda concluida ou em andamento e confira cliente, veiculo, valor,
   pagamento e observacoes.
5. Confirme que o cliente nao consegue ver vendas de outro perfil/cliente.

O frontend nao possui cadastro publico de vendas nesta versao. Cadastros adicionais
e pagamentos podem ser preparados pela API de desenvolvimento em `/docs`.

### 5. Test drives

**Como cliente**

1. Entre como `CLIENT`.
2. Abra Minha conta > Meus test drives.
3. Selecione um veiculo, uma data/hora futura e observacoes.
4. Confirme que o agendamento aparece na lista com status AGENDADO.
5. Clique em cancelar em um agendamento permitido e confirme a caixa de dialogo.
6. Confirme que o status muda para CANCELADO.
7. Tente filtrar por cada status disponivel.
8. Tente agendar com veiculo vendido ou indisponivel e confirme a mensagem de erro.

**Como vendedor, gerente ou administrador**

1. Entre em Painel administrativo > Test drives.
2. Filtre por status, cliente ou veiculo nos campos suportados pela tela.
3. Abra um agendamento.
4. Enquanto nao estiver finalizado, altere data/hora e observacoes e salve.
5. Tente o ciclo AGENDADO -> CONFIRMADO -> REALIZADO.
6. Em outro agendamento AGENDADO, teste CONFIRMADO -> NAO_COMPARECEU.
7. Teste CANCELADO a partir de AGENDADO ou CONFIRMADO.
8. Confirme que agendamentos finalizados nao podem ser editados nem avancar de status.
9. Confirme que um conflito de horario confirmado bloqueia o agendamento.

### 6. Simulacao de financiamento

Entre como `CLIENT`.

1. Abra Minha conta > Financiamento.
2. Selecione um veiculo e informe entrada menor que o preco.
3. Informe prazo entre 1 e 120 meses e simule.
4. Confira entrada, valor financiado, prazo, taxa mensal e parcela calculados pelo
   servidor.
5. Confirme que o resultado aparece no historico.
6. Tente entrada negativa, entrada igual ao preco ou maior que o preco.
7. Confirme que o sistema bloqueia o formulario e informa os limites.
8. Tente prazo 0, maior que 120 ou vazio.
9. Confirme que uma simulacao nao cria venda nem aprova credito.

Somente cliente e administrador podem consultar simulacoes pela API; o frontend
administrativo nao oferece tela propria para este modulo.

### 7. Gestao de veiculos

Entre como `SELLER`, `MANAGER` ou `ADMIN`.

1. Abra Veiculos no painel administrativo.
2. Cadastre um veiculo com marca, modelo, ano, cor, quilometragem, preco e descricao.
3. Confirme que o novo cadastro nasce DISPONIVEL.
4. Abra o veiculo criado e confira os dados na tela publica pela opcao
   Ver ficha publica.
5. Edite os dados e selecione Salvar alteracoes.
6. Teste valores invalidos: ano fora do formato aceito, quilometragem negativa,
   preco zero ou negativo.
7. Aplique os filtros de marca/modelo, status, ano e faixa de preco.
8. Use apenas uma faixa de preco valida; confirme que preco minimo maior que o
   maximo gera erro.
9. Teste os status DISPONIVEL, RESERVADO e INDISPONIVEL.
10. Confirme que um veiculo vendido nao pode ser alterado para outro status.

Observacao: o frontend nao permite excluir veiculos.

### 8. Gestao de clientes

Entre como `SELLER`, `MANAGER` ou `ADMIN`.

1. Abra Clientes no painel.
2. Teste busca por nome, parte do nome, email e CPF/CNPJ com apenas digitos.
3. Abra um cliente e confira os dados.
4. Edite nome, documento, email, telefone e endereco.
5. Salve e recarregue para confirmar persistencia.
6. Tente documento duplicado e telefone invalido.
7. Confirme que a pesquisa vazia lista todos os clientes e Limpar remove o filtro.

Na interface atual nao existe cadastro novo de cliente; use o seed ou o endpoint
correspondente em `/docs` para criar perfis novos.

### 9. Gestao de vendas

Entre como `SELLER`, `MANAGER` ou `ADMIN`.

1. Abra Vendas no painel.
2. Filtre por status, ID do cliente e ID do veiculo.
3. Abra uma venda da listagem.
4. Confira venda, cliente, veiculo, valor, forma de pagamento e observacoes.
5. Teste PENDENTE -> EM_PROCESSAMENTO.
6. Confirme que o veiculo muda para RESERVADO.
7. Teste EM_PROCESSAMENTO -> CONCLUIDA.
8. Confirme que o veiculo muda para VENDIDO.
9. Teste PENDENTE -> CANCELADA ou EM_PROCESSAMENTO -> CANCELADA.
10. Confirme que o veiculo reservado volta para DISPONIVEL quando nao possui outra
    venda ativa.
11. Confirme que vendas CONCLUIDA e CANCELADA nao permitem nova transicao.
12. Tente concluir uma venda cujo veiculo ja foi vendido por outra venda.

O frontend nao possui formulario para criar uma venda. Para criar dados novos,
use `/docs` com conta autorizada ou o seed.

### 10. Gestao financeira

Entre como `FINANCE` ou `ADMIN`.

1. Abra Financeiro no painel.
2. Confira os totais aprovados, pendentes, recusados e cancelados.
3. Filtre pagamentos por status e ID da venda.
4. Abra um pagamento.
5. Confira valor, tipo, venda vinculada, status da venda e observacoes.
6. De PENDENTE, teste APROVADO, RECUSADO e CANCELADO.
7. Confirme que pagamentos APROVADO, RECUSADO e CANCELADO sao finais.
8. Confirme que venda CANCELADA nao recebe novos pagamentos pela API.

O frontend nao permite criar pagamentos; use `/docs` ou o seed para esse passo.

### 11. Notificacoes

Entre como `ADMIN`.

1. Abra Notificacoes no painel.
2. Filtre por status e tipo.
3. Selecione uma notificacao da lista.
4. Confira tipo, data de envio, cliente, status e mensagem.
5. De PENDENTE, teste ENVIADA e FALHOU.
6. Confirme que status ENVIADA e FALHOU sao finais.
7. Feche os detalhes e confirme que os filtros permanecem.

O frontend nao cria notificacoes. Elas podem ser criadas por `/docs` ou pelo seed.

### 12. Relatorios

Entre como `MANAGER` ou `ADMIN`.

1. Abra Relatorios.
2. Confira vendas, estoque e financeiro sem filtro de periodo.
3. Informe uma data inicial e uma data final validas.
4. Confirme que vendas e financeiro respeitam o intervalo.
5. Confirme que estoque continua refletindo o momento atual.
6. Informe data inicial maior que a final e confirme a mensagem de validacao.
7. Limpe o periodo e confirme o retorno aos dados gerais.
8. Compare os indicadores com os modulos de vendas e financeiro.

### 13. Painel administrativo

1. Entre com cada perfil autorizado.
2. Confirme que o painel mostra somente blocos permitidos ao papel.
3. Abra vendas, test drives e pagamentos recentes pelos atalhos.
4. Confirme que os totais correspondem aos dados das telas detalhadas.
5. Confirme que links rapidos aparecem apenas para modulos permitidos.

## Criterios gerais de aceite

Para cada fluxo:

- nao deve haver erro 4xx/5xx inesperado;
- respostas de sucesso devem ser persistidas apos recarregar;
- combinacoes invalidas devem produzir mensagens claras;
- transicoes finalizadas nao devem ser alteradas;
- filtros devem combinar com os dados apresentados;
- acesso deve respeitar a matriz de perfis;
- rotas inexistentes devem mostrar a tela 404;
- API indisponivel deve gerar feedback em vez de tela vazia.

## Comandos de desenvolvimento

Backend:

```powershell
cd backend
.venv\Scripts\Activate.ps1
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

Frontend:

```powershell
cd frontend
npm run dev
npm run lint
npm run build
npm run preview
```

Banco:

```powershell
docker compose up -d postgres
docker compose ps
docker compose logs postgres
docker compose down
```
