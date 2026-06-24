# Logica da Arquitetura MVC - Backend G04

Este projeto usa uma organizacao inspirada em MVC, adaptada para API REST com TypeScript, Express e Supabase.

## Fluxo principal

```txt
Request HTTP
  -> routes/
  -> controllers/
  -> services/
  -> repositories/
  -> Supabase/PostgreSQL
  -> views/responseFormatter
  -> Response HTTP
```

## Camadas

| Camada | Responsabilidade |
| --- | --- |
| `routes/` | Define endpoints Express, documenta com `@swagger` e delega para controllers. O `index.ts` agrega todos os recursos sob `/api/v1`. |
| `controllers/` | Recebe `Request`, extrai body e params, chama service, define status HTTP e usa `formatSuccess`/`formatError`. Nao acessa Supabase diretamente. |
| `services/` | Concentra todas as regras de negocio, validacoes de dominio e orquestracao entre repositories. Lanca erros tipados. Nao acessa `req/res`. |
| `repositories/` | Unica camada que conversa diretamente com Supabase. Encapsula consultas e persistencia. Chama `throwDatabaseError(error)` em falhas. |
| `models/domain/` | Union types e interfaces que representam as entidades de negocio com tipos estritos (enums como union types). |
| `models/dto/` | Contratos de entrada da API: `CreateXDTO` (campos obrigatorios) e `UpdateXDTO` (todos opcionais). |
| `database/SupabaseSchema.ts` | Tipos de linha que refletem diretamente o DDL do Supabase (enums como `string`, sem union types). Repositories usam esses tipos para interagir com o client. |
| `helpers/` | Funcoes puras de validacao, sanitizacao, autenticacao, erros tipados e parametros de rota. |
| `views/responseFormatter.ts` | Padroniza respostas JSON de sucesso e erro. Nao ha renderizacao SSR. |
| `docs/` | Configuracao Swagger/OpenAPI e schemas Zod convertidos para OpenAPI via `zod-to-json-schema`. |
| `mocks/` | Router mock montado quando `MOCK_AUTH=true`; permite desenvolver frontend sem Supabase. |

## Entidades e recursos implementados

| Entidade de dominio | Tabela Supabase | Recurso API |
| --- | --- | --- |
| `Setor` | `setor` | `/api/v1/setores` (alias `/setores-risco`) |
| `Cadastrador` | `cadastrador` | `/api/v1/cadastradores` |
| `Casa` | `casa` | `/api/v1/casas` (alias `/imoveis`) |
| `NucleoFamiliar` | `nucleo_familiar` | `/api/v1/nucleos-familiares` (alias `/familias`) |
| `Individuo` | `individuo` | `/api/v1/individuos` (alias `/pessoas`) |
| `Vulnerabilidade` | `vulnerabilidade` + `individuo_vulnerabilidade` | `/api/v1/vulnerabilidades` |
| `Pet` | `pet` | `/api/v1/pets` |

## Convencoes

- Controllers nao acessam Supabase diretamente.
- Repositories nao implementam regra de negocio.
- Services validam invariantes: CPF, data, duplicidade, existencia de FK, limites numericos.
- Toda interacao com Supabase passa por repository; erros de banco passam por `throwDatabaseError`.
- Responses HTTP usam sempre `formatSuccess` / `formatError` de `views/responseFormatter.ts`.
- Erros de dominio usam `BadRequestError`, `NotFoundError`, `ConflictError` ou `UnprocessableEntityError` (todos estendem `AppError`).
- Controllers mapeiam `AppError.statusCode` para o status HTTP; erros desconhecidos viram `500`.
- IDs de rota sao validados e convertidos por `getRouteParam` + `parsePositiveIntegerId`.
- Payloads sao validados por Zod via `parseBody` nos controllers que usam schemas.
- A documentacao interativa fica em `GET /api-docs/`; a spec OAS 3.0 em `GET /openapi.json`.
- Alias de rotas: `/familias` e `/nucleos-familiares` montam o mesmo `nucleoFamiliarRoutes`; `/pessoas` e `/individuos` montam o mesmo `individuoRoutes`; `/imoveis` e `/casas` montam o mesmo `casaRoutes`; `/setores-risco` e `/setores` montam o mesmo `setorRoutes`.

## Repositorio especial: `NucleoFamiliarConsultaRepository`

Resolve navegacao entre nucleos familiares e suas casas/setores sem acoplamento direto entre repositories de entidades diferentes. Usado por `CasaService` e `SetorService` para implementar `findByNucleoFamiliarId`.

```
nucleo_familiar -> id_casa -> casa -> id_setor -> setor
```
