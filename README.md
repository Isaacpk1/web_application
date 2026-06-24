# GeoRisco Santo André

<p align="center">
  <a href="https://www.inteli.edu.br/"><img src="/assets/inteli.png" alt="Inteli - Instituto de Tecnologia e Liderança" border="0"></a>
</p>

Aplicação web de georreferenciamento para gestão de riscos e acolhimento emergencial da Defesa Civil de Santo André. Centraliza cadastro de famílias em áreas de risco, monitoramento de ocorrências e logística humanitária.

## Integrantes

- [Ricardo Nelken](https://www.linkedin.com/in/ricardo-nelken-77153a3a9/)
- [Paulo Roberto Amorim de Sousa](https://www.linkedin.com/in/paulo-roberto-amorim/)
- [Gabriel Rodrigues](https://www.linkedin.com/in/rodriguesgabrieleng/?locale=pt)
- [Guilherme D'Elia](https://www.linkedin.com/in/guilherme-d-elia-251855272/)
- [Isaac Nicolas Alves da Silva](https://www.linkedin.com/in/isaac-nicolas-alves-da-silva-9787592a4/)
- [Lucas Levi Vaz](https://www.linkedin.com/in/lucaslevivaz/)
- [Anita Fratelli](https://www.linkedin.com/in/anita-fratelli-258398314/)
- [Gabrielly Mendes](https://www.linkedin.com/in/gabrielly-mendes-bb94683b9/)

## Professores

**Orientadora:** [Camila Naves Arantes](https://www.linkedin.com/in/camilanarantes/)

**Instrutores:** [Bruna Mayer Costa](https://www.linkedin.com/in/bruna-mayer/) · [Claudio Fernando André](https://www.linkedin.com/in/profclaudioandre/) · [Crishna Irion](https://www.linkedin.com/in/crishna-irion-phd-7b5aa311/) · [Fabio Cassio Souza](https://www.linkedin.com/in/fabiocassiosouza/) · [Henrique Mohallem Paiva](https://www.linkedin.com/in/henrique-mohallem-paiva-6854b460/)

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- Conta no [Supabase](https://supabase.com/) (ou use o modo mock para desenvolvimento sem banco)
- npm (incluso no Node.js)

## Instalação e execução

```bash
# 1. Clone o repositório
git clone https://git.inteli.edu.br/graduacao/2026-1b/t25/g04.git
cd g04

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais (veja a seção abaixo)

# 4. Inicie o servidor em modo de desenvolvimento (hot reload)
npm run dev
```

Acesse a aplicação em: **http://localhost:3000**

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key>
SUPABASE_ANON_KEY=<sua-anon-key>
PORT=3000

# Modo mock — permite rodar sem Supabase (ideal para desenvolvimento local)
MOCK_AUTH=true
```

> **Modo mock (`MOCK_AUTH=true`):** nenhuma conexão com Supabase é necessária. Use as credenciais de teste:
> - E-mail: `admin@georisco.sp.gov.br`
> - Senha: `georisco123`

## Scripts disponíveis

```bash
npm run dev          # Servidor com hot reload (desenvolvimento)
npm run build        # Compila TypeScript para dist/
npm start            # Executa a build compilada (produção)

npm test             # Todos os testes
npm run test:unit    # Somente testes unitários
npm run test:cov     # Testes com relatório de cobertura (mínimo 80%)
npm run test:watch   # Testes em modo watch

npm run lint         # Verifica o código com ESLint
npm run lint:fix     # Corrige automaticamente os erros de lint
npm run quality      # lint + cobertura de testes
```

## Deploy na Vercel

O projeto ja inclui a configuracao serverless em `vercel.json`. Ao importar o
repositorio na Vercel, mantenha os valores detectados automaticamente
(`npm run build` como comando de build) e cadastre estas variaveis de ambiente
em **Settings > Environment Variables**, tanto para Preview quanto para
Production:

```env
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key>
SUPABASE_ANON_KEY=<sua-anon-key>
MOCK_AUTH=false
```

Nao cadastre `PORT`: a Vercel administra essa configuracao. A chave
`SUPABASE_SERVICE_ROLE_KEY` e sigilosa e nunca deve ser exposta no frontend.
Depois do deploy, valide `https://<seu-dominio>/health` e o login.

## Cadastro atômico e migrations

O cadastro do agente usa apenas `POST /api/v1/cadastros-completos`. A mesma
`Idempotency-Key` e mantida enquanto a tentativa estiver em aberto, para que um
reenvio seguro devolva o mesmo nucleo sem duplicar registros.

As migrations possuem UP e DOWN separados. Aplique `001_migration.sql` e
`002_cadastro_completo_up.sql` primeiro em uma base Supabase de teste
explicitamente escolhida. Valide `setor_api`, busca, mapa e completude antes de
promover a sequencia ao ambiente principal. Rotas reais exigem Bearer JWT do
Supabase; o modo mock permanece isolado para desenvolvimento e testes.

## Estrutura do projeto

```
g04/
├── src/
│   ├── routes/        # Roteamento HTTP (todos os endpoints em /api/v1/)
│   ├── controllers/   # Parse da requisição, chamada ao service, formatação da resposta
│   ├── services/      # Regras de negócio e validações
│   ├── repositories/  # Queries no Supabase
│   ├── models/        # Tipos de domínio (domain/) e DTOs (dto/)
│   ├── helpers/       # Middlewares, incluindo autenticação JWT
│   ├── mocks/         # Rotas e dados mock para desenvolvimento sem banco
│   ├── views/         # Templates EJS (login, dashboard, famílias, mapa, etc.)
│   └── test/          # Testes unitários e de integração
├── public/            # Assets estáticos e scripts JS do frontend
├── documentos/
│   └── wad.md         # Web Application Document completo
└── .env               # Variáveis de ambiente (não versionado)
```

## Telas disponíveis

| Rota | Descrição |
|---|---|
| `/login` | Autenticação de usuários |
| `/` | Dashboard principal |
| `/familias` | Listagem e gestão de famílias cadastradas |
| `/mapa` | Visualização georreferenciada das ocorrências |
| `/completude` | Índice de completude dos cadastros |
| `/agente/cadastro` | Cadastro de novos agentes |

## Documentação da API

- **Swagger UI interativo:** http://localhost:3000/api-docs
- **Especificação OpenAPI (JSON):** http://localhost:3000/openapi.json

## Documentação do projeto

O WAD (Web Application Document) completo está em [`documentos/wad.md`](documentos/wad.md), incluindo requisitos funcionais, regras de negócio, arquitetura, matriz de rastreabilidade e testes.

## Histórico de versões

| Versão | Data | Descrição |
|---|---|---|
| 0.5.0 | Jun/2026 | Migração para novo schema Supabase; ajustes de completude e mapa |
| 0.4.0 | Mai/2026 | Integração frontend com API via JWT; telas de famílias e mapa |
| 0.3.0 | Mai/2026 | Endpoints de cadastro, indivíduo e núcleo familiar; testes de integração |
| 0.2.0 | Abr/2026 | Estrutura base da API REST; autenticação Supabase; modo mock |
| 0.1.0 | Abr/2026 | Setup inicial do projeto; configuração TypeScript, ESLint e Jest |

## Licença

<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1">

[GeoRisco Santo André](https://git.inteli.edu.br/graduacao/2026-1b/t25/g04) by Inteli — Ricardo Nelken, Paulo Roberto Amorim de Sousa, Gabriel Rodrigues, Guilherme D'Elia, Isaac Nicolas Alves da Silva, Lucas Levi Vaz, Anita Fratelli, Gabrielly Mendes is licensed under [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/?ref=chooser-v1).
