import swaggerJsdoc from 'swagger-jsdoc';

import { openApiSchemas } from './zodSchemas';

/**
 * Define a ordem visual dos grupos exibidos no Swagger.
 *
 * @remarks
 * A lista segue a priorizacao dos requisitos funcionais do artefato 1, deixando
 * RF001, RF002 e RF003 no topo da documentacao.
 *
 * @example
 * ```typescript
 * const firstTag = rfOrderedTags[0].name; // RF001 - Cadastro de Individuos
 * ```
 */
const rfOrderedTags = [
  { name: 'RF001 - Cadastro de Indivíduos', description: 'Endpoints prioritarios para criacao de cadastros.' },
  { name: 'RF002 - Verificação de Duplicidade', description: 'Consulta de CPF/NIS ja existente.' },
  { name: 'RF003 - Atualização de Dados', description: 'Atualizacao e manutencao de cadastros.' },
  { name: 'RF004 - Visualização de Cadastros', description: 'Consulta e listagem de cadastros.' },
  { name: 'RF005 - Busca Multi-Critério', description: 'Busca filtrada e paginada de cadastros.' },
  { name: 'RF006 - Inativação', description: 'Inativacao logica de cadastros.' },
  { name: 'RF008 - Anonimização', description: 'Exportacao estatistica anonimizada.' },
  { name: 'RF010 - Sanitização', description: 'Padronizacao de dados enviados pelo cliente.' },
  { name: 'RF012 - Núcleo Familiar', description: 'Familias, nucleos e entidades relacionadas.' },
  { name: 'RF013 - Gestão de Documentos', description: 'Upload e consulta de documentos do cadastro.' },
  { name: 'Apoio - Imóveis', description: 'Endpoints complementares de casas.' },
  { name: 'Apoio - Setores de Risco', description: 'Endpoints complementares de setores de risco.' },
  { name: 'Apoio - Vulnerabilidades', description: 'Endpoints complementares de vulnerabilidades.' },
];

/**
 * Mapa auxiliar para transformar uma tag de RF em prioridade numerica.
 *
 * @remarks
 * Tags desconhecidas recebem prioridade baixa durante a ordenacao dos paths.
 *
 * @example
 * ```typescript
 * const priority = rfTagOrder.get('RF001 - Cadastro de IndivÃ­duos');
 * ```
 */
const rfTagOrder = new Map(rfOrderedTags.map((tag, index) => [tag.name, index + 1]));

/**
 * Ordem secundaria dos metodos HTTP dentro de um mesmo path.
 *
 * @remarks
 * A ordenacao por RF vem primeiro; este array apenas desempata operacoes do
 * mesmo grupo.
 */
const httpMethods = ['get', 'post', 'put', 'patch', 'delete'] as const;

/**
 * Especificacao OpenAPI gerada a partir dos blocos Swagger das rotas.
 *
 * @remarks
 * Este objeto ainda nao esta ordenado; a ordenacao final acontece em
 * `sortOpenApiSpec`.
 */
const rawOpenApiSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'GeoRisco Santo Andre - Web API',
      version: '1.0.0',
      description: 'Primeira versao funcional da WebAPI. Os endpoints estao ordenados no Swagger conforme a prioridade dos RFs mapeados no artefato 1.',
    },
    tags: rfOrderedTags,
    servers: [
      {
        url: '/api/v1',
        description: 'Servidor atual',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        ...openApiSchemas,
      },
    },
  },
  apis: ['src/routes/*.ts'],
});

/**
 * Especificacao OpenAPI final exposta em `/openapi.json` e `/api-docs`.
 *
 * @remarks
 * Os paths sao ordenados por prioridade de RF para atender ao criterio de
 * entrega da WebAPI.
 *
 * @example
 * ```typescript
 * app.get('/openapi.json', (_req, res) => res.json(openApiSpec));
 * ```
 */
export const openApiSpec = sortOpenApiSpec(rawOpenApiSpec);

/**
 * Ordena os paths da especificacao OpenAPI conforme prioridade dos RFs.
 *
 * @param spec - Objeto OpenAPI gerado pelo swagger-jsdoc.
 * @returns Objeto OpenAPI com paths reordenados.
 *
 * @example
 * ```typescript
 * const orderedSpec = sortOpenApiSpec(rawOpenApiSpec);
 * ```
 */
function sortOpenApiSpec(spec: any): any {
  if (!spec.paths) {
    return spec;
  }

  return {
    ...spec,
    paths: Object.fromEntries(
      Object.entries(spec.paths)
        .map(([path, pathItem]) => [path, sortPathItem(pathItem)] as const)
        .sort(([leftPath, leftItem], [rightPath, rightItem]) => {
          const leftPriority = getPathPriority(leftItem);
          const rightPriority = getPathPriority(rightItem);

          return leftPriority - rightPriority || leftPath.localeCompare(rightPath);
        }),
    ),
  };
}

/**
 * Ordena as operacoes HTTP dentro de um mesmo path.
 *
 * @param pathItem - Conjunto de operacoes de um path OpenAPI.
 * @returns Path item com metodos reordenados por RF e metodo HTTP.
 */
function sortPathItem(pathItem: any): any {
  const sortedEntries = Object.entries(pathItem).sort(([leftMethod, leftOperation], [rightMethod, rightOperation]) => {
    const leftPriority = getOperationPriority(leftMethod, leftOperation);
    const rightPriority = getOperationPriority(rightMethod, rightOperation);

    return leftPriority - rightPriority || getMethodOrder(leftMethod) - getMethodOrder(rightMethod);
  });

  return Object.fromEntries(sortedEntries);
}

/**
 * Calcula a prioridade mais alta de um path.
 *
 * @remarks
 * Quando um path possui mais de um metodo, vale a menor prioridade numerica
 * encontrada entre as operacoes.
 *
 * @param pathItem - Conjunto de operacoes de um path OpenAPI.
 * @returns Prioridade numerica usada na ordenacao dos paths.
 */
function getPathPriority(pathItem: any): number {
  return Math.min(
    ...Object.entries(pathItem).map(([method, operation]) => getOperationPriority(method, operation)),
  );
}

/**
 * Calcula a prioridade de uma operacao OpenAPI.
 *
 * @param method - Metodo HTTP da operacao.
 * @param operation - Operacao OpenAPI com tags e metadados.
 * @returns Prioridade numerica combinando RF e metodo HTTP.
 */
function getOperationPriority(method: string, operation: any): number {
  const tagPriority = Array.isArray(operation?.tags)
    ? Math.min(...operation.tags.map((tag: string) => rfTagOrder.get(tag) ?? 999))
    : 999;

  return tagPriority * 10 + getMethodOrder(method);
}

/**
 * Retorna a posicao de ordenacao de um metodo HTTP.
 *
 * @param method - Metodo HTTP em minusculo.
 * @returns Indice do metodo ou 99 quando o metodo nao estiver mapeado.
 */
function getMethodOrder(method: string): number {
  const index = httpMethods.indexOf(method as (typeof httpMethods)[number]);

  return index === -1 ? 99 : index;
}
