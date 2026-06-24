# Documentacao da API - Backend G04

Base URL local: `http://localhost:3000`

Prefixo versionado: `/api/v1`

Health check: `GET /health`

Documentacao interativa:

| Rota | Descricao |
| --- | --- |
| `GET /api-docs/` | Swagger UI gerada a partir dos comentarios `@swagger` em `src/routes/*.ts` |
| `GET /openapi.json` | Especificacao OpenAPI 3.0 gerada por `swagger-jsdoc` |

Schemas da documentacao ficam em `src/docs/zodSchemas.ts`, escritos em Zod e convertidos para OpenAPI com `zod-to-json-schema`.

## Padrao de resposta

Sucesso:

```json
{
  "success": true,
  "data": {},
  "message": "Operacao realizada com sucesso"
}
```

Erro:

```json
{
  "success": false,
  "error": "Mensagem de erro legivel",
  "statusCode": 400
}
```

## Autenticacao

O projeto usa login mockado para demonstracao quando `MOCK_AUTH=true`. A sessao mock e guardada no navegador apenas para redirecionar cada perfil ao fluxo correto; ela nao representa uma camada de seguranca real da API.

Credenciais mock disponiveis:

| Perfil | E-mail | Senha | Destino |
| --- | --- | --- | --- |
| Administrador | `admin@georisco.sp.gov.br` | `georisco123` | `/admin/analise-dados` |
| Agente | `agente@georisco.sp.gov.br` | `agente123` | `/agente/cadastro` |

### Auth: `/api/v1/auth`

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Valida credenciais mockadas e retorna token de sessao mock |
| `POST` | `/api/v1/auth/logout` | Encerra a sessao |

Payload de login:

```json
{
  "email": "usuario@exemplo.com",
  "senha": "sua_senha"
}
```

Resposta de login:

```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "usuario": {
      "id": "uuid-supabase",
      "email": "usuario@exemplo.com"
    }
  },
  "message": "Login realizado com sucesso"
}
```

## Regras gerais

- Todos os IDs sao inteiros positivos (`BIGINT` no banco).
- Campos obrigatorios nao podem ser strings vazias.
- `POST` exige todos os campos obrigatorios do DTO de criacao.
- `PUT` aceita campos parciais, mas exige ao menos um campo no body.
- `id` e gerado pelo banco e nao deve ser enviado pelo cliente.
- Entradas sao sanitizadas antes da persistencia (`src/helpers/sanitizers.ts`).
- Erros de validacao retornam `400 Bad Request`; registro nao encontrado retorna `404 Not Found`; duplicidade retorna `409 Conflict`; erros semanticos retornam `422 Unprocessable Entity`.

---

## Cadastradores

Recurso: `/api/v1/cadastradores`

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/api/v1/cadastradores` | Lista todos os cadastradores |
| `GET` | `/api/v1/cadastradores/:id` | Busca cadastrador por ID |
| `POST` | `/api/v1/cadastradores` | Cria um novo cadastrador |
| `PUT` | `/api/v1/cadastradores/:id` | Atualiza cadastrador |
| `DELETE` | `/api/v1/cadastradores/:id` | Remove cadastrador |

Payload de criacao:

```json
{
  "nome": "Josias Silva",
  "documento": "123.456-7"
}
```

Campos:

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `nome` | `string` | Sim | Nome completo do cadastrador |
| `documento` | `string` | Sim | Documento no formato `NNN.NNN-N` |

---

## Nucleos Familiares

Recurso principal: `/api/v1/nucleos-familiares`
Alias: `/api/v1/familias` (mesmo handler)

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/api/v1/nucleos-familiares` | Lista todos os nucleos familiares |
| `GET` | `/api/v1/nucleos-familiares/:id` | Busca nucleo familiar por ID |
| `POST` | `/api/v1/nucleos-familiares` | Cria novo nucleo familiar |
| `PUT` | `/api/v1/nucleos-familiares/:id` | Atualiza nucleo familiar |
| `DELETE` | `/api/v1/nucleos-familiares/:id` | Remove nucleo familiar |

Payload de criacao:

```json
{
  "nome_nucleo": "Familia Silva",
  "id_casa": 1,
  "id_cadastrador": 1,
  "observacao": "Observacao opcional",
  "tempo_residencia_domicilio": 12,
  "tempo_residencia_area": 24,
  "tempo_residencia_municipio": 60,
  "renda_familiar_total": 2400.00
}
```

Campos:

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `nome_nucleo` | `string` | Sim | Nome do nucleo familiar |
| `id_casa` | `number` | Sim | ID da casa vinculada (FK `casa`) |
| `id_cadastrador` | `number` | Nao | ID do cadastrador responsavel (FK `cadastrador`) |
| `id_chefe_familia` | `number \| null` | Nao | ID do individuo chefe da familia (FK `individuo`); definir apos criar o nucleo e cadastrar individuos |
| `observacao` | `string \| null` | Nao | Observacao livre |
| `tempo_residencia_domicilio` | `number \| null` | Nao | Tempo de residencia no domicilio (meses) |
| `tempo_residencia_area` | `number \| null` | Nao | Tempo de residencia na area (meses) |
| `tempo_residencia_municipio` | `number \| null` | Nao | Tempo de residencia no municipio (meses) |
| `renda_familiar_total` | `number` | Nao | Renda familiar total; padrao `0` |

Regras de negocio:

- `nome_nucleo` nao pode ser vazio.
- `id_casa` deve ser inteiro positivo valido.
- `id_chefe_familia` nao pode ser informado na criacao; defina-o via `PUT` apos cadastrar o individuo chefe.
- Na atualizacao, `id_chefe_familia` deve pertencer ao mesmo nucleo familiar e ter 18+ anos.
- `renda_familiar_total` nao pode ser negativa.

---

## Individuos

Recurso principal: `/api/v1/individuos`
Alias: `/api/v1/pessoas` (mesmo handler)

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/api/v1/individuos` | Lista todos os individuos |
| `GET` | `/api/v1/individuos/nucleos-familiares/:nucleoFamiliarId` | Lista individuos de um nucleo familiar |
| `GET` | `/api/v1/individuos/:id` | Busca individuo por ID |
| `POST` | `/api/v1/individuos` | Cadastra individuo |
| `PUT` | `/api/v1/individuos/:id` | Atualiza individuo |
| `DELETE` | `/api/v1/individuos/:id` | Remove individuo |

Payload de criacao (campos obrigatorios):

```json
{
  "id_nucleo_familiar": 1,
  "nome_completo": "Joao da Silva",
  "data_nascimento": "1990-05-10",
  "genero": "Masculino"
}
```

Payload de criacao (completo):

```json
{
  "id_nucleo_familiar": 1,
  "nome_completo": "Joao da Silva",
  "apelido": "Joaozinho",
  "nome_social": null,
  "data_nascimento": "1990-05-10",
  "genero": "Masculino",
  "cor_raca": "Pardo",
  "uf": "SP",
  "estado_civil": "Solteiro",
  "profissao": "Pedreiro",
  "nome_mae": "Maria da Silva",
  "nome_pai": "Jose da Silva",
  "grau_parentesco": "Filho",
  "escolaridade": "Ensino Medio",
  "situacao_ocupacional": "Empregado",
  "cpf": "52998224725",
  "doc_estrangeiro": null,
  "rg": "123456789",
  "nis": "12345678901",
  "telefone": "11999999999",
  "email": "joao@exemplo.com",
  "status_vital": "Vivo",
  "data_obito": null,
  "semanas_gestacao": null
}
```

Campos:

| Campo | Tipo | Obrigatorio | Valores permitidos |
| --- | --- | --- | --- |
| `id_nucleo_familiar` | `number` | Sim | Inteiro positivo |
| `nome_completo` | `string` | Sim | Nao vazio |
| `data_nascimento` | `string` | Sim | Data no passado ou hoje (`YYYY-MM-DD`) |
| `genero` | `string` | Sim | `Masculino`, `Feminino`, `Outro` |
| `cor_raca` | `string \| null` | Nao | `Branco`, `Preto`, `Pardo`, `Amarelo`, `Indigena` |
| `estado_civil` | `string \| null` | Nao | `Solteiro`, `Casado`, `Viuvo`, `Divorciado` |
| `status_vital` | `string` | Nao | `Vivo` (padrao), `Obito`, `Desaparecido` |
| `cpf` | `string \| null` | Nao | 11 digitos; unico no banco |
| `nis` | `string \| null` | Nao | 11 digitos; unico no banco |
| `uf` | `string \| null` | Nao | 2 letras (UF brasileira) |
| `email` | `string \| null` | Nao | Formato valido |
| `semanas_gestacao` | `number \| null` | Nao | Inteiro nao negativo |
| `data_obito` | `string \| null` | Nao | Obrigatorio se `status_vital = Obito` |

Regras de negocio:

- `id_nucleo_familiar` deve existir.
- `data_nascimento` nao pode ser data futura.
- `cpf`, quando informado, deve ter digito verificador valido.
- CPF ou NIS duplicado em outro individuo retorna `409 Conflict`.
- `status_vital = Obito` exige `data_obito`; outros status nao podem ter `data_obito`.
- `semanas_gestacao` deve ser inteiro nao negativo.

---

## Casas (Imoveis)

Recurso principal: `/api/v1/casas`
Alias: `/api/v1/imoveis` (mesmo handler)

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/api/v1/casas` | Lista todas as casas |
| `GET` | `/api/v1/casas/nucleos-familiares/:nucleoFamiliarId` | Busca a casa de um nucleo familiar |
| `GET` | `/api/v1/casas/:id` | Busca casa por ID |
| `POST` | `/api/v1/casas` | Cadastra nova casa |
| `PUT` | `/api/v1/casas/:id` | Atualiza casa |
| `DELETE` | `/api/v1/casas/:id` | Remove casa |

Payload de criacao:

```json
{
  "id_setor": 1,
  "coordenada_lat": -23.55052,
  "coordenada_long": -46.633308,
  "logradouro": "Rua A",
  "numero": "100",
  "bairro": "Centro",
  "observacao": null,
  "cep": "01234567",
  "tipo_construcao": "Alvenaria",
  "uso_imovel": "Residencial",
  "status_imovel": "Sadio",
  "data_interdicao": null
}
```

Campos:

| Campo | Tipo | Obrigatorio | Valores permitidos |
| --- | --- | --- | --- |
| `id_setor` | `number` | Sim | Inteiro positivo (FK `setor`) |
| `coordenada_lat` | `number` | Sim | Entre `-90` e `90` |
| `coordenada_long` | `number` | Sim | Entre `-180` e `180` |
| `logradouro` | `string` | Sim | Nao vazio |
| `numero` | `string` | Sim | Nao vazio; aceita `S/N`, `Lote 4`, etc. |
| `bairro` | `string` | Sim | Nao vazio |
| `observacao` | `string \| null` | Nao | — |
| `cep` | `string \| null` | Nao | 8 digitos |
| `tipo_construcao` | `string` | Sim | `Madeira`, `Alvenaria`, `Misto` |
| `uso_imovel` | `string` | Sim | `Residencial`, `Comercial`, `Misto` |
| `status_imovel` | `string` | Nao | `Sadio` (padrao), `Interditado`, `Destruido` |
| `data_interdicao` | `string \| null` | Nao | Obrigatoria se `status_imovel = Interditado` |

Regras de negocio:

- `status_imovel = Interditado` exige `data_interdicao`; outros status nao podem ter `data_interdicao`.

---

## Setores de Risco

Recurso principal: `/api/v1/setores`
Alias: `/api/v1/setores-risco` (mesmo handler)

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/api/v1/setores` | Lista todos os setores |
| `GET` | `/api/v1/setores/nucleos-familiares/:nucleoFamiliarId` | Busca o setor de um nucleo familiar (via casa) |
| `GET` | `/api/v1/setores/:id` | Busca setor por ID |
| `POST` | `/api/v1/setores` | Cadastra setor |
| `PUT` | `/api/v1/setores/:id` | Atualiza setor |
| `DELETE` | `/api/v1/setores/:id` | Remove setor |

Payload de criacao:

```json
{
  "nome_regiao": "Morro do Periquito",
  "tipo_risco": "Deslizamento",
  "grau_risco": "Alto"
}
```

Campos:

| Campo | Tipo | Obrigatorio | Valores permitidos |
| --- | --- | --- | --- |
| `nome_regiao` | `string` | Sim | Nao vazio |
| `tipo_risco` | `string` | Sim | Nao vazio (livre) |
| `grau_risco` | `string \| null` | Nao | `Baixo`, `Médio`, `Alto`, `Muito Alto` |

---

## Vulnerabilidades

Recurso: `/api/v1/vulnerabilidades`

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/api/v1/vulnerabilidades` | Lista todas as vulnerabilidades do catalogo |
| `GET` | `/api/v1/vulnerabilidades/individuos/:individuoId` | Lista vulnerabilidades associadas a um individuo |
| `GET` | `/api/v1/vulnerabilidades/:id` | Busca vulnerabilidade por ID |
| `POST` | `/api/v1/vulnerabilidades` | Cadastra nova vulnerabilidade no catalogo |
| `PUT` | `/api/v1/vulnerabilidades/:id` | Atualiza vulnerabilidade do catalogo |
| `DELETE` | `/api/v1/vulnerabilidades/:id` | Remove vulnerabilidade do catalogo |
| `POST` | `/api/v1/vulnerabilidades/individuos/:individuoId/:vulnerabilidadeId` | Associa vulnerabilidade a individuo |
| `DELETE` | `/api/v1/vulnerabilidades/individuos/:individuoId/:vulnerabilidadeId` | Desassocia vulnerabilidade de individuo |

A tabela `vulnerabilidade` e um catalogo/dicionario de tipos. A migration inicial semeia `Idoso`, `Gestante`, `PCD`, `Lactante`, `DoencaCronica` e `Crianca`. A relacao N:N com individuos fica na tabela `individuo_vulnerabilidade`.

Payload de criacao no catalogo:

```json
{
  "tipo_vulnerabilidade": "Gestante"
}
```

Campos:

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `tipo_vulnerabilidade` | `string` | Sim | Descricao da vulnerabilidade; nao vazio |

Regras de negocio (associacao):

- `individuoId` e `vulnerabilidadeId` devem existir antes de associar.
- A associacao e validada pelo service antes da persistencia.

---

## Pets

Recurso: `/api/v1/pets`

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/api/v1/pets` | Lista todos os pets |
| `GET` | `/api/v1/pets/nucleos-familiares/:nucleoFamiliarId` | Lista pets de um nucleo familiar |
| `GET` | `/api/v1/pets/:id` | Busca pet por ID |
| `POST` | `/api/v1/pets` | Cadastra pet |
| `PUT` | `/api/v1/pets/:id` | Atualiza pet |
| `DELETE` | `/api/v1/pets/:id` | Remove pet |

Payload de criacao:

```json
{
  "id_nucleo_familiar": 1,
  "tipo": "Cachorro",
  "porte": "Medio",
  "imagem": null,
  "quantidade": 2
}
```

Campos:

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| `id_nucleo_familiar` | `number` | Sim | FK para `nucleo_familiar` |
| `tipo` | `string \| null` | Nao | Tipo do animal (livre) |
| `porte` | `string \| null` | Nao | Porte do animal (livre) |
| `imagem` | `string \| null` | Nao | URL ou base64 da imagem |
| `quantidade` | `number \| null` | Nao | Quantidade de animais deste tipo |
