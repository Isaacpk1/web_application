# Estrutura de Testes

Este diretório contém a suite de testes automatizados do projeto.

## Organização

### Testes Unitários (`unit/`)

Cobrem a camada de serviço isolando o banco via mocks do repositório.

| Arquivo | O que cobre |
|---|---|
| `cadastradorService.spec.ts` | Criação/atualização de cadastradores, validação do formato de documento `###.###-#` |
| `nucleoFamiliarService.spec.ts` | Criação/atualização de núcleos familiares, regra de id_chefe_familia só após criação, renda não-negativa |
| `casaService.spec.ts` | Criação/atualização de casas, validação de coordenadas, enums de tipo_construcao e uso_imovel, regra de interdição |
| `individuoService.spec.ts` | Criação de indivíduos, validação de CPF (dígito verificador), data não-futura, data_obito apenas com status Óbito |
| `setorService.spec.ts` | Validação de grau_risco (Baixo, Médio, Alto, Muito Alto), CRUD básico |
| `vulnerabilidadeService.spec.ts` | Catálogo de tipos, associação/desassociação individuo↔vulnerabilidade |

### Testes de Integração HTTP (`http/`)

Testam a camada HTTP no estilo *black-box*: comunicação exclusivamente via HTTP com `supertest`, sem acesso ao código interno dos serviços. O `app` do Express é carregado por import assíncrono; variáveis do Supabase são sobrescritas em `beforeAll` com valores fictícios para garantir que validações sejam testáveis sem banco de dados real.

| Arquivo | Recurso testado | Rota canônica | Alias |
|---|---|---|---|
| `app.spec.ts` | Health check e CORS | `GET /health` | — |
| `apiRoutes.http.spec.ts` | Contrato geral da API (com mocks de repositório) | `/api/v1/*` | — |
| `cadastradorRoutes.http.spec.ts` | CRUD de cadastradores | `/api/v1/cadastradores` | — |
| `familiaRoutes.http.spec.ts` | CRUD de núcleos familiares (RF012) | `/api/v1/nucleos-familiares` | `/api/v1/familias` |
| `imovelRoutes.http.spec.ts` | CRUD de casas/imóveis | `/api/v1/casas` | `/api/v1/imoveis` |
| `pessoaRoutes.http.spec.ts` | CRUD de indivíduos (RF001, RF003, RF004) | `/api/v1/individuos` | `/api/v1/pessoas` |
| `setorRiscoRoutes.http.spec.ts` | CRUD de setores de risco | `/api/v1/setores` | `/api/v1/setores-risco` |
| `vulnerabilidadeRoutes.http.spec.ts` | Catálogo de vulnerabilidades + associação com indivíduos | `/api/v1/vulnerabilidades` | — |

> **IDs:** todas as tabelas usam `BIGINT` auto-incrementado, não UUIDs. Os testes de "recurso não encontrado" usam IDs inteiros inexistentes (ex.: `99999`). IDs inválidos (zero, string não-numérica) retornam `400` antes de qualquer acesso ao banco.

### Utilitários

| Arquivo | Finalidade |
|---|---|
| `setupEnv.ts` | Configuração de variáveis de ambiente para todos os testes |

## Como Rodar

### Todos os testes
```bash
npm test
```

### Apenas testes unitários
```bash
npm test -- --testPathPattern="unit/"
```

### Apenas testes HTTP
```bash
npm test -- --testPathPattern="http/"
```

### Um arquivo específico
```bash
npm test -- unit/nucleoFamiliarService.spec.ts
npm test -- http/familiaRoutes.http.spec.ts
```

### Com coverage
```bash
npm run test:cov
```
