# Contextualizacao - Backend G04 (Inteli 2026-1b, T25)

> Documento de contexto para desenvolvedores e IAs entenderem o estado atual do backend, sua arquitetura, endpoints, regras de negocio, testes e convencoes.

---

## 1. Visao Geral

Este backend implementa uma API REST para gestao de vulnerabilidade social. O sistema permite cadastrar e consultar familias (nucleos familiares), individuos, imoveis (casas), setores de risco, vulnerabilidades e animais de estimacao (pets) associados a areas vulneraveis atendidas pela Defesa Civil.

### Personas atendidas

- **Josias - agente de campo**: registra familias, individuos e imoveis durante visitas presenciais.
- **Claudia - gestora administrativa**: consulta dados, pesquisa familias e acompanha informacoes de risco.

### Estado atual

O projeto possui:

- Aplicacao Express configurada em `src/app.ts`.
- Servidor separado em `src/server.ts`.
- Configuracao de ambiente em `src/config/env.ts`.
- Cliente Supabase centralizado em `src/database/supabaseClient.ts`.
- Schema TypeScript do banco em `src/database/SupabaseSchema.ts`.
- Login de demonstracao via modo mock (`MOCK_AUTH=true`), com perfis de administrador e agente para redirecionar os fluxos da interface.
- Nao ha middleware JWT real montado nas rotas da API; o login mock e apenas um mecanismo de navegacao para demonstracao.
- Models separados entre `domain/` e `dto/`.
- Controllers, services, repositories e routes para: `Setor`, `Cadastrador`, `Casa`, `NucleoFamiliar`, `Individuo`, `Vulnerabilidade` e `Pet`.
- Repositorio auxiliar `NucleoFamiliarConsultaRepository` para navegacao entre nucleos, casas e setores.
- Documentacao OAS 3.0 com Swagger UI em `/api-docs/` e JSON em `/openapi.json`.
- Schemas da documentacao escritos em Zod em `src/docs/zodSchemas.ts`.
- Respostas HTTP padronizadas em `src/views/responseFormatter.ts`.
- Helpers de erro, validacao, sanitizacao e parametros de rota em `src/helpers/`.
- Testes automatizados em `src/test/` (unitarios e HTTP/integracao).

---

## 2. Stack Tecnologica

| Camada | Tecnologia |
| --- | --- |
| Runtime | Node.js |
| Linguagem | TypeScript |
| Framework HTTP | Express.js |
| Banco de dados | Supabase/PostgreSQL |
| Client de banco | `@supabase/supabase-js` |
| Documentacao API | OpenAPI 3.0, Swagger UI, swagger-jsdoc |
| Schemas da documentacao | Zod + zod-to-json-schema |
| Variaveis de ambiente | `dotenv` |
| Testes | Jest, ts-jest, Supertest |
| Lint | ESLint |

### Variaveis de ambiente

```env
PORT=3000
SUPABASE_URL="https://<projeto>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
SUPABASE_ANON_KEY="eyJ..."
MOCK_AUTH=true   # usa o login e dados mockados para demonstracao
```

`src/config/env.ts` valida as variaveis obrigatorias. Se alguma estiver ausente, a aplicacao falha com erro explicito na inicializacao.

---

## 3. Como Rodar

```sh
npm install        # instalar dependencias
npm run dev        # desenvolvimento com hot reload (tsx watch)
npm run build      # compilar TypeScript para dist/
npm start          # executar build compilada
npm test           # rodar todos os testes
npm run test:unit  # testes unitarios apenas
npm run lint       # ESLint
```

Health check:
```
GET http://localhost:3000/health
```

Swagger UI:
```
GET http://localhost:3000/api-docs/
```

OpenAPI JSON:
```
GET http://localhost:3000/openapi.json
```

---

## 4. Estrutura Atual de Pastas

```txt
src/
|-- app.ts
|-- server.ts
|
|-- config/
|   `-- env.ts
|
|-- database/
|   |-- supabaseClient.ts
|   `-- SupabaseSchema.ts
|
|-- docs/
|   |-- openapi.ts
|   `-- zodSchemas.ts
|
|-- models/
|   |-- domain/
|   |   |-- Casa.ts
|   |   |-- Cadastrador.ts
|   |   |-- Individuo.ts
|   |   |-- NucleoFamiliar.ts
|   |   |-- Pet.ts
|   |   |-- Setor.ts
|   |   `-- Vulnerabilidade.ts
|   `-- dto/
|       |-- CreateCasaDTO.ts / UpdateCasaDTO.ts
|       |-- CreateCadastradorDTO.ts / UpdateCadastradorDTO.ts
|       |-- CreateIndividuoDTO.ts / UpdateIndividuoDTO.ts
|       |-- CreateNucleoFamiliarDTO.ts / UpdateNucleoFamiliarDTO.ts
|       |-- CreatePetDTO.ts / UpdatePetDTO.ts
|       |-- CreateSetorDTO.ts / UpdateSetorDTO.ts
|       `-- CreateVulnerabilidadeDTO.ts / UpdateVulnerabilidadeDTO.ts
|
|-- repositories/
|   |-- CasaRepository.ts
|   |-- CadastradorRepository.ts
|   |-- IndividuoRepository.ts
|   |-- NucleoFamiliarRepository.ts
|   |-- NucleoFamiliarConsultaRepository.ts
|   |-- PetRepository.ts
|   |-- SetorRepository.ts
|   `-- VulnerabilidadeRepository.ts
|
|-- services/
|   |-- CasaService.ts
|   |-- CadastradorService.ts
|   |-- IndividuoService.ts
|   |-- NucleoFamiliarService.ts
|   |-- PetService.ts
|   |-- SetorService.ts
|   `-- VulnerabilidadeService.ts
|
|-- controllers/
|   |-- CasaController.ts
|   |-- CadastradorController.ts
|   |-- IndividuoController.ts
|   |-- NucleoFamiliarController.ts
|   |-- PetController.ts
|   |-- SetorController.ts
|   `-- VulnerabilidadeController.ts
|
|-- routes/
|   |-- authRoutes.ts
|   |-- cadastradorRoutes.ts
|   |-- casaRoutes.ts
|   |-- individuoRoutes.ts
|   |-- nucleoFamiliarRoutes.ts
|   |-- petRoutes.ts
|   |-- setorRoutes.ts
|   |-- vulnerabilidadeRoutes.ts
|   `-- index.ts
|
|-- helpers/
|   |-- databaseErrors.ts
|   |-- errors.ts
|   |-- objects.ts
|   |-- payloadValidation.ts
|   |-- requestParams.ts
|   |-- sanitizers.ts
|   `-- validators.ts
|
|-- middlewares/
|   `-- cors.ts
|
|-- mocks/
|   |-- mockRouter.ts
|   `-- mockStore.ts
|
|-- views/
|   `-- responseFormatter.ts
|
`-- test/
    |-- factories.ts
    |-- setupEnv.ts
    |-- http/
    |   |-- apiRoutes.http.spec.ts
    |   |-- app.spec.ts
    |   |-- cadastradorRoutes.http.spec.ts
    |   |-- familiaRoutes.http.spec.ts
    |   |-- imovelRoutes.http.spec.ts
    |   |-- pessoaRoutes.http.spec.ts
    |   |-- setorRiscoRoutes.http.spec.ts
    |   `-- vulnerabilidadeRoutes.http.spec.ts
    `-- unit/
        |-- cadastradorService.spec.ts
        |-- casaService.spec.ts
        |-- databaseErrors.spec.ts
        |-- IndividuoRepository.spec.ts
        |-- individuoService.spec.ts
        |-- NucleoFamiliarConsultaRepository.spec.ts
        |-- nucleoFamiliarService.spec.ts
        |-- setorService.spec.ts
        |-- VulnerabilidadeRepository.spec.ts
        |-- vulnerabilidadeService.spec.ts
        `-- zodSchemas.spec.ts
```

---

## 5. Responsabilidade das Camadas

### `app.ts`

- Cria a instancia do Express.
- Registra `express.json()` e CORS.
- Expoe `GET /health`.
- Expoe `GET /openapi.json`.
- Expoe `GET /api-docs/` com Swagger UI.
- Se `MOCK_AUTH=true`, monta rotas mock antes das reais.
- Registra as rotas versionadas em `/api/v1`.
- Retorna erro padronizado para rotas inexistentes.
- Exporta `app` para testes com Supertest.

### `database/SupabaseSchema.ts`

- Define tipos de linha que refletem diretamente o DDL real do Supabase.
- Repositories usam esses tipos para conversas com o Supabase client.
- Diferenca em relacao ao `models/domain`: enums aparecem como `string` no schema e como union types no dominio.

### `models/domain`

- Tipos de negocio com union types para campos de enum (ex.: `genero: 'Masculino' | 'Feminino' | 'Outro'`).
- Repositories fazem cast de `string` (Supabase) para union type (dominio).

### `models/dto`

- Contratos de entrada da API.
- `CreateXDTO`: campos obrigatorios de criacao; campos opcionais com `?`.
- `UpdateXDTO`: todos os campos opcionais; services exigem ao menos um.

### `repositories/`

- Unica camada que acessa o Supabase diretamente.
- Chamam `throwDatabaseError(error)` em caso de falha do banco.
- Usam `pickDefined` para updates parciais.
- `NucleoFamiliarConsultaRepository`: resolve `nucleo_familiar → id_casa → casa → id_setor` para busca por nucleo familiar em `CasaService` e `SetorService`.

### `services/`

- Regras de negocio, validacoes de dominio e orquestracao.
- Lancam `BadRequestError`, `NotFoundError`, `ConflictError` ou `UnprocessableEntityError`.
- Nao acessam `req/res` nem Supabase diretamente.

### `controllers/`

- Extraem body e params da requisicao.
- Chamam services.
- Formatam respostas com `formatSuccess`/`formatError`.
- Mapeiam `AppError.statusCode` para o status HTTP.

### `routes/`

- Definem os endpoints Express e documentam com `@swagger`.
- `routes/index.ts` agrega os recursos em `/api/v1`.
- Rotas especificas (ex.: `/nucleos-familiares/:nucleoFamiliarId`) aparecem antes de `/:id`.
- Aliases: `/familias` = `/nucleos-familiares`; `/pessoas` = `/individuos`; `/imoveis` = `/casas`; `/setores-risco` = `/setores`.

### `helpers/`

- `errors.ts`: `AppError` e subclasses tipadas + `getErrorMessage`.
- `validators.ts`: validacoes de ID, CPF, NIS, UF, email, CEP, strings, numeros e datas.
- `sanitizers.ts`: normalizacao de strings (remove espacos extras, etc.).
- `requestParams.ts`: `getRouteParam` + `parsePositiveIntegerId` para params de rota.
- `payloadValidation.ts`: `parseBody` que valida body com schema Zod.
- `objects.ts`: `pickDefined` (filtra campos undefined) e `withDefaults` (aplica valores padrao).
- `databaseErrors.ts`: `throwDatabaseError` que converte erro do Supabase em `AppError`.

### `views/responseFormatter.ts`

- `formatSuccess(data, message)` → `{ success: true, data, message }`.
- `formatError(message, statusCode)` → `{ success: false, error: message, statusCode }`.

---

## 6. Entidades do Dominio

### `Setor`

| Campo | Tipo | Descricao |
| --- | --- | --- |
| `id` | `number` | PK gerada pelo banco |
| `nome_regiao` | `string` | Nome da regiao |
| `tipo_risco` | `string` | Tipo de risco (livre) |
| `grau_risco` | `'Baixo' \| 'Médio' \| 'Alto' \| 'Muito Alto' \| null` | Grau de risco |

### `Cadastrador`

| Campo | Tipo | Descricao |
| --- | --- | --- |
| `id` | `number` | PK gerada pelo banco |
| `nome` | `string` | Nome do agente cadastrador |
| `documento` | `string` | Documento no formato `NNN.NNN-N` |
| `email` | `string \| null` | E-mail de identificacao do cadastrador; o seed cria o agente mock |

### `Casa`

| Campo | Tipo | Descricao |
| --- | --- | --- |
| `id` | `number` | PK gerada pelo banco |
| `id_setor` | `number` | FK para `setor` |
| `coordenada_lat` | `number` | Latitude (entre -90 e 90) |
| `coordenada_long` | `number` | Longitude (entre -180 e 180) |
| `logradouro` | `string` | Logradouro |
| `numero` | `string` | Numero (aceita S/N, Lote 4, etc.) |
| `observacao` | `string \| null` | Observacao livre |
| `bairro` | `string` | Bairro |
| `cep` | `string \| null` | CEP (8 digitos) |
| `tipo_construcao` | `'Madeira' \| 'Alvenaria' \| 'Misto'` | Tipo de construcao |
| `uso_imovel` | `'Residencial' \| 'Comercial' \| 'Misto'` | Uso do imovel |
| `status_imovel` | `'Sadio' \| 'Interditado' \| 'Destruido'` | Status do imovel |
| `data_interdicao` | `string \| null` | Data de interdicao (obrigatoria se Interditado) |

### `NucleoFamiliar`

| Campo | Tipo | Descricao |
| --- | --- | --- |
| `id` | `number` | PK gerada pelo banco |
| `nome_nucleo` | `string` | Nome do nucleo familiar |
| `id_casa` | `number` | FK para `casa` |
| `id_cadastrador` | `number` | FK para `cadastrador` |
| `id_chefe_familia` | `number \| null` | FK ciclica para `individuo` |
| `observacao` | `string \| null` | Observacao livre |
| `tempo_residencia_domicilio` | `number \| null` | Tempo no domicilio (meses) |
| `tempo_residencia_area` | `number \| null` | Tempo na area (meses) |
| `tempo_residencia_municipio` | `number \| null` | Tempo no municipio (meses) |
| `renda_familiar_total` | `number` | Renda familiar total (padrao 0) |

### `Individuo`

| Campo | Tipo | Descricao |
| --- | --- | --- |
| `id` | `number` | PK gerada pelo banco |
| `id_nucleo_familiar` | `number` | FK para `nucleo_familiar` |
| `nome_completo` | `string` | Nome completo |
| `apelido` | `string \| null` | Apelido |
| `nome_social` | `string \| null` | Nome social |
| `data_nascimento` | `string` | Data de nascimento (`YYYY-MM-DD`); nao pode ser futura |
| `genero` | `'Masculino' \| 'Feminino' \| 'Outro'` | Genero |
| `cor_raca` | `'Branco' \| 'Preto' \| 'Pardo' \| 'Amarelo' \| 'Indigena' \| null` | Cor/raca |
| `uf` | `string \| null` | UF de nascimento (2 letras) |
| `estado_civil` | `'Solteiro' \| 'Casado' \| 'Viuvo' \| 'Divorciado' \| null` | Estado civil |
| `profissao` | `string \| null` | Profissao |
| `nome_mae` | `string \| null` | Nome da mae |
| `nome_pai` | `string \| null` | Nome do pai |
| `grau_parentesco` | `string \| null` | Grau de parentesco com o responsavel |
| `escolaridade` | `string \| null` | Escolaridade |
| `situacao_ocupacional` | `string \| null` | Situacao ocupacional |
| `cpf` | `string \| null` | CPF (11 digitos, unico) |
| `doc_estrangeiro` | `string \| null` | Documento estrangeiro |
| `rg` | `string \| null` | RG |
| `nis` | `string \| null` | NIS (11 digitos, unico) |
| `telefone` | `string \| null` | Telefone |
| `email` | `string \| null` | Email |
| `status_vital` | `'Vivo' \| 'Obito' \| 'Desaparecido'` | Status vital (padrao `Vivo`) |
| `data_obito` | `string \| null` | Data do obito (obrigatoria se `status_vital = Obito`) |
| `semanas_gestacao` | `number \| null` | Semanas de gestacao (inteiro nao negativo) |

### `Vulnerabilidade`

| Campo | Tipo | Descricao |
| --- | --- | --- |
| `id` | `number` | PK gerada pelo banco |
| `tipo_vulnerabilidade` | `string` | Descricao do tipo (ex.: `Gestante`, `Idoso`) |

### `IndividuoVulnerabilidade`

| Campo | Tipo | Descricao |
| --- | --- | --- |
| `id_individuo` | `number` | FK para `individuo` |
| `id_vulnerabilidade` | `number` | FK para `vulnerabilidade` |

### `Pet`

| Campo | Tipo | Descricao |
| --- | --- | --- |
| `id` | `number` | PK gerada pelo banco |
| `id_nucleo_familiar` | `number` | FK para `nucleo_familiar` |
| `tipo` | `string \| null` | Tipo do animal (livre) |
| `porte` | `string \| null` | Porte do animal (livre) |
| `imagem` | `string \| null` | URL ou base64 da imagem |
| `quantidade` | `number \| null` | Quantidade de animais deste tipo |

---

## 7. Endpoints Implementados

Base local: `http://localhost:3000`
Prefixo da API: `/api/v1`

### Health

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/health` | Verifica se o servidor esta operacional |

### Auth - `/api/v1/auth` (login mock para demonstracao)

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Valida credenciais mockadas e retorna token de sessao mock |
| `POST` | `/api/v1/auth/logout` | Encerra a sessao |

### Cadastradores - `/api/v1/cadastradores`

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/api/v1/cadastradores` | Lista todos os cadastradores |
| `GET` | `/api/v1/cadastradores/:id` | Busca cadastrador por ID |
| `POST` | `/api/v1/cadastradores` | Cria cadastrador |
| `PUT` | `/api/v1/cadastradores/:id` | Atualiza cadastrador |
| `DELETE` | `/api/v1/cadastradores/:id` | Remove cadastrador |

### Nucleos Familiares - `/api/v1/nucleos-familiares` (alias `/api/v1/familias`)

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/api/v1/nucleos-familiares` | Lista todos os nucleos familiares |
| `GET` | `/api/v1/nucleos-familiares/:id` | Busca nucleo familiar por ID |
| `POST` | `/api/v1/nucleos-familiares` | Cria nucleo familiar |
| `PUT` | `/api/v1/nucleos-familiares/:id` | Atualiza nucleo familiar |
| `DELETE` | `/api/v1/nucleos-familiares/:id` | Remove nucleo familiar |

### Individuos - `/api/v1/individuos` (alias `/api/v1/pessoas`)

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/api/v1/individuos` | Lista todos os individuos |
| `GET` | `/api/v1/individuos/nucleos-familiares/:nucleoFamiliarId` | Lista individuos de um nucleo familiar |
| `GET` | `/api/v1/individuos/:id` | Busca individuo por ID |
| `POST` | `/api/v1/individuos` | Cadastra individuo |
| `PUT` | `/api/v1/individuos/:id` | Atualiza individuo |
| `DELETE` | `/api/v1/individuos/:id` | Remove individuo |

### Casas (Imoveis) - `/api/v1/casas` (alias `/api/v1/imoveis`)

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/api/v1/casas` | Lista todas as casas |
| `GET` | `/api/v1/casas/nucleos-familiares/:nucleoFamiliarId` | Busca a casa de um nucleo familiar |
| `GET` | `/api/v1/casas/:id` | Busca casa por ID |
| `POST` | `/api/v1/casas` | Cadastra casa |
| `PUT` | `/api/v1/casas/:id` | Atualiza casa |
| `DELETE` | `/api/v1/casas/:id` | Remove casa |

### Setores de Risco - `/api/v1/setores` (alias `/api/v1/setores-risco`)

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/api/v1/setores` | Lista todos os setores |
| `GET` | `/api/v1/setores/nucleos-familiares/:nucleoFamiliarId` | Busca o setor de um nucleo familiar (via casa) |
| `GET` | `/api/v1/setores/:id` | Busca setor por ID |
| `POST` | `/api/v1/setores` | Cria setor |
| `PUT` | `/api/v1/setores/:id` | Atualiza setor |
| `DELETE` | `/api/v1/setores/:id` | Remove setor |

### Vulnerabilidades - `/api/v1/vulnerabilidades`

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/api/v1/vulnerabilidades` | Lista o catalogo de vulnerabilidades |
| `GET` | `/api/v1/vulnerabilidades/individuos/:individuoId` | Lista vulnerabilidades de um individuo |
| `GET` | `/api/v1/vulnerabilidades/:id` | Busca vulnerabilidade por ID |
| `POST` | `/api/v1/vulnerabilidades` | Cadastra vulnerabilidade no catalogo |
| `PUT` | `/api/v1/vulnerabilidades/:id` | Atualiza vulnerabilidade do catalogo |
| `DELETE` | `/api/v1/vulnerabilidades/:id` | Remove vulnerabilidade do catalogo |
| `POST` | `/api/v1/vulnerabilidades/individuos/:individuoId/:vulnerabilidadeId` | Associa vulnerabilidade a individuo |
| `DELETE` | `/api/v1/vulnerabilidades/individuos/:individuoId/:vulnerabilidadeId` | Desassocia vulnerabilidade de individuo |

### Pets - `/api/v1/pets`

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/api/v1/pets` | Lista todos os pets |
| `GET` | `/api/v1/pets/nucleos-familiares/:nucleoFamiliarId` | Lista pets de um nucleo familiar |
| `GET` | `/api/v1/pets/:id` | Busca pet por ID |
| `POST` | `/api/v1/pets` | Cadastra pet |
| `PUT` | `/api/v1/pets/:id` | Atualiza pet |
| `DELETE` | `/api/v1/pets/:id` | Remove pet |

### Documentacao

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/openapi.json` | Especificacao OpenAPI 3.0 |
| `GET` | `/api-docs/` | Swagger UI interativa |

---

## 8. Padrao de Resposta HTTP

### Sucesso

```json
{
  "success": true,
  "data": {},
  "message": "Operacao realizada com sucesso"
}
```

### Erro

```json
{
  "success": false,
  "error": "Mensagem de erro legivel",
  "statusCode": 400
}
```

---

## 9. Regras de Negocio Implementadas

### Regras gerais

- IDs recebidos por rota devem ser inteiros positivos.
- Campos obrigatorios nao podem ser strings vazias.
- `POST` exige todos os campos obrigatorios do DTO.
- `PUT` aceita campos parciais, mas exige ao menos um campo no body.
- `id` nao deve ser enviado pelo cliente.
- Entradas sao sanitizadas antes da persistencia.

### Individuo

- `id_nucleo_familiar` deve existir em `nucleo_familiar`.
- `data_nascimento` nao pode ser data futura.
- `genero` deve ser `Masculino`, `Feminino` ou `Outro`.
- `cpf`, quando informado, deve ter digito verificador valido.
- CPF ou NIS duplicado em outro individuo retorna `409 Conflict`.
- `status_vital = Obito` exige `data_obito`; outros status nao podem ter `data_obito`.
- `semanas_gestacao` deve ser inteiro nao negativo.

### Nucleo Familiar

- `nome_nucleo` nao pode ser vazio.
- `id_casa` deve ser inteiro positivo.
- `id_chefe_familia` nao pode ser informado na criacao; defina via `PUT` apos cadastrar o individuo.
- Na atualizacao, `id_chefe_familia` deve pertencer ao mesmo nucleo familiar e ter 18+ anos.
- `renda_familiar_total` nao pode ser negativa.

### Casa

- `id_setor` deve ser inteiro positivo valido.
- `coordenada_lat` entre `-90` e `90`; `coordenada_long` entre `-180` e `180`.
- `tipo_construcao`: `Madeira`, `Alvenaria` ou `Misto`.
- `uso_imovel`: `Residencial`, `Comercial` ou `Misto`.
- `status_imovel = Interditado` exige `data_interdicao`; outros status nao podem ter `data_interdicao`.
- `cep`, quando informado, deve ter 8 digitos.

### Setor

- `nome_regiao` e `tipo_risco` nao podem ser vazios.
- `grau_risco`, quando informado, deve ser `Baixo`, `Médio`, `Alto` ou `Muito Alto`.

### Vulnerabilidade

- `tipo_vulnerabilidade` nao pode ser vazio.
- Para associar ao individuo, ambos devem existir no banco.

---

## 10. Testes

Os testes ficam em `src/test/` e sao separados em dois grupos.

### Testes unitarios (`src/test/unit/`)

| Arquivo | Cobertura |
| --- | --- |
| `individuoService.spec.ts` | Regras de individuo: CPF, data, duplicidade, status vital |
| `nucleoFamiliarService.spec.ts` | Regras de nucleo familiar: chefe, renda, ids |
| `casaService.spec.ts` | Regras de casa: coordenadas, interdicao, tipo/uso |
| `setorService.spec.ts` | Regras de setor: grau de risco |
| `vulnerabilidadeService.spec.ts` | Regras de vulnerabilidade: tipo vazio, associacao |
| `cadastradorService.spec.ts` | Regras de cadastrador |
| `IndividuoRepository.spec.ts` | Repositorio de individuo com mock Supabase |
| `NucleoFamiliarConsultaRepository.spec.ts` | Navegacao nucleo → casa → setor |
| `VulnerabilidadeRepository.spec.ts` | Repositorio de vulnerabilidade com mock |
| `databaseErrors.spec.ts` | Mapeamento de erros do Supabase |
| `zodSchemas.spec.ts` | Validacao dos schemas Zod |

### Testes HTTP (`src/test/http/`)

| Arquivo | Cobertura |
| --- | --- |
| `app.spec.ts` | Health check, rota inexistente |
| `apiRoutes.http.spec.ts` | Rotas gerais da API |
| `cadastradorRoutes.http.spec.ts` | CRUD de cadastradores via HTTP |
| `familiaRoutes.http.spec.ts` | CRUD de nucleos familiares via HTTP |
| `imovelRoutes.http.spec.ts` | CRUD de casas via HTTP |
| `pessoaRoutes.http.spec.ts` | CRUD de individuos via HTTP |
| `setorRiscoRoutes.http.spec.ts` | CRUD de setores via HTTP |
| `vulnerabilidadeRoutes.http.spec.ts` | CRUD e associacoes de vulnerabilidades via HTTP |

Threshold de cobertura: 80% statements/functions/lines, 70% branches.

---

## 11. Fluxo de uma Requisicao

```txt
HTTP Request
  |
  v
routes/*Routes.ts
  |
  v
controllers/*Controller.ts
  |
  v
services/*Service.ts (validacao + regras de negocio)
  |
  v
repositories/*Repository.ts
  |
  v
database/supabaseClient.ts
  |
  v
Supabase/PostgreSQL
  |
  v
views/responseFormatter.ts
  |
  v
HTTP Response
```

Exemplo com individuo:

```txt
POST /api/v1/individuos
  -> individuoRoutes.ts
  -> IndividuoController.create
  -> IndividuoService.create (valida CPF, data, nucleo, duplicidade)
  -> IndividuoRepository.create
  -> Supabase: tabela individuo
```

---

## 12. Convencoes de Codigo

- `PascalCase` para classes, interfaces e arquivos de dominio.
- `camelCase` para variaveis, metodos, helpers e arquivos de rota/config.
- `snake_case` para campos que espelham colunas do banco.
- Services concentram regras de negocio.
- Controllers nao devem acessar Supabase diretamente.
- Repositories nao devem conter regra de negocio.
- Toda interacao com Supabase deve passar por repository.
- Respostas HTTP usam `formatSuccess` / `formatError`.
- Erros de dominio usam subclasses de `AppError`.

---

## 13. Banco de Dados

### 13.1. Tabelas reais acessadas pela API

| Tabela | Descricao |
| --- | --- |
| `setor` | Setor de risco com grau e tipo |
| `cadastrador` | Agente responsavel pelos cadastros |
| `casa` | Imovel com coordenadas e dados fisicos |
| `nucleo_familiar` | Agrupamento familiar vinculado a uma casa e a um cadastrador |
| `individuo` | Todos os moradores do nucleo |
| `vulnerabilidade` | Catalogo de tipos de vulnerabilidade |
| `individuo_vulnerabilidade` | Relacao N:N entre individuos e vulnerabilidades |
| `pet` | Animais de estimacao do nucleo familiar |

### 13.2. Mapeamento conceitual

| Conceito de negocio | Tabela(s) envolvida(s) |
| --- | --- |
| Familia / Nucleo Familiar | `nucleo_familiar` |
| Imovel / Casa | `casa` |
| Setor de Risco | `setor` |
| Individuo / Pessoa | `individuo` |
| Vulnerabilidade | `vulnerabilidade` + `individuo_vulnerabilidade` |
| Pet | `pet` |
| Cadastrador | `cadastrador` |

---

## 14. Referencias

- Documentacao de endpoints: `documentos/outros/endpoints.md`
- Mapeamento Supabase x Models: `documentos/outros/mapeamento-supabase-models.md`
- Logica arquitetura MVC: `documentos/outros/logica_arquitetura_mvc.md`
- Modelagem fisica: `documentos/outros/modelagemfisica.md`
- Supabase JS Client: https://supabase.com/docs/reference/javascript
- Express.js: https://expressjs.com/
- TypeScript: https://www.typescriptlang.org/
- Jest: https://jestjs.io/
