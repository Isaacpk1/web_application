# Contextualização: User Stories, Requisitos Funcionais, Requisitos Não-Funcionais e Regras de Negócios - Projeto G04 (Inteli 2026-1b, T25)


> Documento de contexto para desenvolvedores e IAs entenderem as User Stories, Requisitos Funcionais, Requisitos Não-Funcionais e Regras de Negócios.


## 2.3. User Stories

As *User Stories* são descrições concisas e em linguagem simples de uma funcionalidade do sistema, contadas a partir da perspectiva de quem executará a ação. Elas têm como objetivo principal focar no valor que a funcionalidade entrega ao negócio, facilitando a comunicação entre a equipe de desenvolvimento e os stakeholders, e servindo como um guia claro para a implementação.

Para garantir a qualidade, as histórias deste documento foram validadas utilizando o acrônimo INVEST (Independentes, Negociáveis, Valorosas, Estimáveis, Pequenas/Small e Testáveis) e possuem Critérios de Aceite.

**Nota sobre a Priorização:** A ordem de prioridade (Alta, Média e Baixa) foi definida com base no impacto direto para a operação e em dependências lógicas. As histórias de **Alta prioridade (US01 a US05)** compõem o *core* do sistema, garantindo a entrada correta, única e georreferenciada dos dados em campo. As histórias de **Média prioridade (US06 a US09)** focam na usabilidade, segurança e manipulação desses dados pela gestão. Por fim, a história de **Baixa prioridade (US10)** representa uma funcionalidade acessória de monitoramento.

| Prioridade | ID | Resumo |
|------------|----|--------|
| Alta | US01 | Cadastrar indivíduos com dados biográficos |
| Alta | US02 | Impedir cadastros duplicados por CPF/NIS |
| Alta | US03 | Registrar localização via GPS |
| Alta | US04 | Registrar dados de vulnerabilidade |
| Alta | US05 | Visualizar distribuição geográfica em mapa |
| Média | US06 | Salvar cadastros parciais automaticamente |
| Média | US07 | Buscar e filtrar cadastros por múltiplos critérios |
| Média | US08 | Visualizar cadastro com segurança de acesso |
| Média | US09 | Exportar dados em formato estruturado |
| Baixa | US10 | Acompanhar status de completude dos cadastros |

---

### US01

| Identificação | US01 |
|---|---|
| Persona | Josias (Agente de Campo) |
| User Story | Como agente de campo, posso cadastrar indivíduos com seus dados biográficos e socioeconômicos, para garantir que as informações sejam coletadas diretamente na fonte de forma estruturada |
| Critério de aceite 1 | CR1: Dado que o agente acessa o formulário de cadastro, quando preencher todos os campos obrigatórios válidos e submeter, então o sistema deve persistir o registro com ID único e retornar confirmação de sucesso |
| Critério de aceite 2 | CR2: Dado que o agente insere uma data de nascimento futura, quando tentar salvar o cadastro, então o sistema deve bloquear a ação e exibir mensagem de erro em até 500ms |
| Critério de aceite 3 | CR3: Dado que o agente insere um CPF inválido, quando submeter o formulário, então o sistema deve validar o dígito verificador e impedir o salvamento |
| Critério de aceite 4 | CR4: Dado que o agente preenche o nome com acentuação, quando salvar, então o sistema deve armazenar o nome em caixa alta e sem acentos |
| Critérios INVEST | Independente: A história foi estruturada de forma desacoplada de outras funcionalidades centrais. <br>Negociável: A forma de persistência e validação poderá ser ajustada conforme arquitetura. <br>Valorosa: Foi identificado alto valor na coleta estruturada de dados na origem. <br>Estimável: A complexidade foi considerada mensurável com base em formulários e validações padrão. <br>Pequena: O escopo foi limitado ao cadastro inicial de indivíduos. <br>Testável: Os critérios foram definidos com cenários claros de validação e erro. |

---

### US02

| Identificação | US02 |
|---|---|
| Persona | Josias (Agente de Campo) |
| User Story | Como agente de campo, posso validar a unicidade por CPF ou NIS durante o registro, para evitar inconsistência nos dados coletados |
| Critério de aceite 1 | CR1: Dado que um CPF já está cadastrado como ativo, quando tentar registrar um novo indivíduo com o mesmo CPF, então o sistema deve bloquear o cadastro e informar duplicidade |
| Critério de aceite 2 | CR2: Dado que um cadastro foi inativado, quando um novo cadastro com o mesmo CPF for realizado, então o sistema deve permitir a criação |
| Critério de aceite 3 | CR3: Dado que o agente insere CPF ou NIS com formatação (pontos ou traços), quando o sistema processar o cadastro, então deve normalizar os dados e validar considerando apenas os dígitos |
| Critérios INVEST | Independente: A funcionalidade foi definida sem dependência direta de outras histórias. <br>Negociável: A lógica de comparação poderá ser ajustada para diferentes chaves únicas. <br>Valorosa: Foi identificado valor crítico na integridade e unicidade dos dados. <br>Estimável: A implementação foi considerada clara com validações conhecidas. <br>Pequena: O escopo foi restrito à verificação de duplicidade. <br>Testável: Os cenários de bloqueio e permissão foram explicitamente definidos. |

---

### US03

| Identificação | US03 |
|---|---|
| Persona | Josias (Agente de Campo) |
| User Story | Como agente de campo, posso registrar a localização da residência por meio de coordenadas GPS, para identificar corretamente a moradia mesmo em locais sem endereço formal |
| Critério de aceite 1 | CR1: Dado que o agente acessa o formulário em campo, quando iniciar o cadastro, então o sistema deve capturar automaticamente latitude e longitude via GPS |
| Critério de aceite 2 | CR2: Dado que o dispositivo não possui sinal de GPS ativo, quando o agente tentar capturar a localização, então o sistema deve solicitar a ativação do serviço |
| Critério de aceite 3 | CR3: Dado que a localização foi capturada, quando o cadastro for salvo, então as coordenadas devem ser armazenadas junto ao registro |
| Critérios INVEST | Independente: A funcionalidade foi estruturada sem dependência direta de outras histórias. <br>Negociável: A forma de captura (automática ou manual) pode ser ajustada. <br>Valorosa: Foi identificado valor na precisão da localização em áreas irregulares. <br>Estimável: A implementação foi considerada previsível com uso de APIs de geolocalização. <br>Pequena: O escopo foi limitado ao registro de coordenadas. <br>Testável: Os critérios permitem validação da captura e persistência da localização. |

---

### US04

| Identificação | US04 |
|---|---|
| Persona | Josias (Agente de Campo) |
| User Story | Como agente de campo, posso registrar informações de vulnerabilidade dos indivíduos, para permitir a priorização de atendimento em situações de risco |
| Critério de aceite 1 | CR1: Dado que o agente preenche o cadastro, quando informar idade, deficiência ou condição especial, então o sistema deve classificar automaticamente o nível de vulnerabilidade |
| Critério de aceite 2 | CR2: Dado que os dados de vulnerabilidade foram registrados, quando o cadastro for salvo, então o sistema deve vincular essa informação ao perfil do indivíduo |
| Critério de aceite 3 | CR3: Dado que os critérios de vulnerabilidade não forem atendidos, quando o cadastro for salvo, então o sistema deve classificar como baixa prioridade |
| Critérios INVEST | Independente: A funcionalidade foi definida sem dependência de módulos externos. <br>Negociável: Os critérios de classificação de vulnerabilidade podem ser ajustados. <br>Valorosa: Foi identificado valor na priorização de indivíduos em situação de risco. <br>Estimável: A implementação foi considerada clara com base em regras de negócio definidas. <br>Pequena: O escopo foi limitado ao registro e classificação de vulnerabilidade. <br>Testável: Os critérios permitem validar a correta classificação com base nos dados inseridos. |

---

### US05

| Identificação | US05 |
|---|---|
| Persona | Cláudia (Gestora Administrativa) |
| User Story | Como gestora administrativa, posso visualizar a distribuição geográfica dos cadastros em um mapa, para identificar áreas com maior concentração de vulnerabilidade |
| Critério de aceite 1 | CR1: Dado que a gestora acessa o painel, quando visualizar o mapa, então os cadastros devem ser exibidos como pontos georreferenciados |
| Critério de aceite 2 | CR2: Dado que existem múltiplos registros próximos, quando o mapa for exibido, então o sistema deve agrupar os pontos (clusters) para melhor visualização |
| Critério de aceite 3 | CR3: Dado que a gestora seleciona uma região no mapa, quando interagir com os dados, então o sistema deve exibir informações resumidas daquela área |
| Critérios INVEST | Independente: A funcionalidade foi projetada separadamente da coleta de dados. <br>Negociável: A forma de visualização no mapa pode ser ajustada (clusters, heatmap, etc.). <br>Valorosa: Foi identificado valor na visualização estratégica das áreas de risco. <br>Estimável: A complexidade foi considerada controlável com bibliotecas de mapas. <br>Pequena: O escopo foi limitado à exibição dos dados georreferenciados. <br>Testável: Os critérios permitem validar renderização, agrupamento e interação com os dados. |

---

### US06

| Identificação | US06 |
|---|---|
| Persona | Josias (Agente de Campo) |
| User Story | Como agente de campo, posso salvar cadastros parciais automaticamente, para não perder dados em caso de falha de conexão ou interrupção |
| Critério de aceite 1 | CR1: Dado que o agente está preenchendo o formulário, quando houver intervalo de 30 segundos, então o sistema deve salvar automaticamente o rascunho |
| Critério de aceite 2 | CR2: Dado que a conexão é perdida durante o cadastro, quando o agente retornar ao sistema, então os dados previamente inseridos devem ser recuperados |
| Critério de aceite 3 | CR3: Dado que o cadastro está incompleto, quando salvo, então o sistema deve marcar o status como "Incompleto" |
| Critério de aceite 4 | CR4: Dado que o usuário fecha o navegador inesperadamente, quando reabrir o sistema, então o rascunho deve estar disponível para continuidade |
| Critério de aceite 5 | CR5: Dado que a conexão é restabelecida, quando houver dados pendentes, então o sistema deve sincronizar automaticamente com o servidor |
| Critérios INVEST | Independente: A funcionalidade foi isolada da persistência definitiva. <br>Negociável: A estratégia de armazenamento local poderá ser alterada. <br>Valorosa: Foi identificado valor na confiabilidade e continuidade do trabalho em campo. <br>Estimável: A complexidade foi considerada moderada e mensurável. <br>Pequena: O escopo foi focado em autosave e recuperação. <br>Testável: Os cenários de perda e recuperação foram claramente definidos. |

---

### US07

| Identificação | US07 |
|---|---|
| Persona | Cláudia (Gestora Administrativa) |
| User Story | Como gestora administrativa, posso buscar e filtrar cadastros por múltiplos critérios, para obter informações rapidamente e tomar decisões baseadas em dados |
| Critério de aceite 1 | CR1: Dado que a gestora acessa a base de dados, quando aplicar filtros por nome, CPF ou bairro, então o sistema deve retornar os registros correspondentes em até 5 segundos |
| Critério de aceite 2 | CR2: Dado que a gestora realiza busca com variação de acentuação, quando pesquisar um nome, então o sistema deve retornar resultados foneticamente similares |
| Critério de aceite 3 | CR3: Dado que a gestora filtra por vulnerabilidade, quando aplicar o critério, então o sistema deve considerar renda per capita conforme regra definida |
| Critério de aceite 4 | CR4: Dado que múltiplos filtros são aplicados simultaneamente, quando executada a busca, então o sistema deve combinar corretamente os critérios |
| Critérios INVEST | Independente: A funcionalidade foi projetada sem dependência de outras consultas específicas. <br>Negociável: Os critérios de filtro poderão ser expandidos ou refinados. <br>Valorosa: Foi identificado valor direto na tomada de decisão operacional. <br>Estimável: A implementação foi considerada previsível com uso de índices e queries. <br>Pequena: O escopo foi limitado à busca e filtragem. <br>Testável: Os critérios foram definidos com métricas de desempenho e precisão. |

---

### US08

| Identificação | US08 |
|---|---|
| Persona | Cláudia (Gestora Administrativa) |
| User Story | Como gestora administrativa, posso visualizar os dados completos de um cadastro com segurança de acesso, para garantir análise detalhada sem violar a privacidade |
| Critério de aceite 1 | CR1: Dado que a gestora acessa um registro, quando possuir permissão adequada, então todos os dados devem ser exibidos corretamente |
| Critério de aceite 2 | CR2: Dado que um usuário sem permissão tenta acessar dados sensíveis, quando visualizar o cadastro, então os campos restritos devem ser ocultados |
| Critério de aceite 3 | CR3: Dado que um dado sensível é acessado, quando a visualização ocorre, então o sistema deve registrar log com ID do usuário e timestamp |
| Critérios INVEST | Independente: A história foi definida de forma isolada da edição de dados. <br>Negociável: As regras de acesso poderão ser refinadas conforme perfis. <br>Valorosa: Foi identificado valor na segurança e governança dos dados. <br>Estimável: A complexidade foi considerada controlável com RBAC. <br>Pequena: O escopo foi restrito à visualização segura. <br>Testável: Os critérios foram definidos com cenários de acesso permitido e negado. |

---

### US09

| Identificação | US09 |
|---|---|
| Persona | Cláudia (Gestora Administrativa) |
| User Story | Como gestora administrativa, posso exportar os dados cadastrados em formato estruturado, para gerar relatórios e compartilhar informações com outras áreas |
| Critério de aceite 1 | CR1: Dado que a gestora seleciona os registros, quando solicitar exportação, então o sistema deve gerar arquivo em formato CSV ou PDF |
| Critério de aceite 2 | CR2: Dado que filtros estão aplicados, quando exportar os dados, então o arquivo deve conter apenas os registros filtrados |
| Critério de aceite 3 | CR3: Dado que o arquivo é gerado, quando concluída a exportação, então o sistema deve disponibilizar download imediato |
| Critérios INVEST | Independente: A funcionalidade foi definida sem dependência direta da visualização dos dados. <br>Negociável: Os formatos de exportação podem ser ajustados conforme necessidade. <br>Valorosa: Foi identificado valor na geração de relatórios para tomada de decisão. <br>Estimável: A implementação foi considerada previsível com geração de arquivos estruturados. <br>Pequena: O escopo foi limitado à exportação de dados filtrados. <br>Testável: Os critérios permitem validar geração e conteúdo do arquivo exportado. |

---

### US10

| Identificação | US10 |
|---|---|
| Persona | Cláudia (Gestora Administrativa) |
| User Story | Como gestora administrativa, posso acompanhar o status de completude dos cadastros, para identificar registros incompletos e direcionar ações de correção |
| Critério de aceite 1 | CR1: Dado que existem cadastros no sistema, quando acessados pela gestora, então cada registro deve indicar seu status (completo ou incompleto) |
| Critério de aceite 2 | CR2: Dado que a gestora aplica filtro por status, quando selecionar “incompleto”, então o sistema deve listar apenas os registros pendentes |
| Critério de aceite 3 | CR3: Dado que um cadastro é atualizado, quando todos os campos obrigatórios forem preenchidos, então o status deve ser alterado automaticamente para “completo” |
| Critérios INVEST | Independente: A funcionalidade foi estruturada de forma isolada da edição de cadastros. <br>Negociável: Os critérios de completude podem ser refinados conforme regras futuras. <br>Valorosa: Foi identificado valor na melhoria da qualidade e confiabilidade dos dados. <br>Estimável: A complexidade foi considerada baixa com base em validações existentes. <br>Pequena: O escopo foi limitado ao status de completude dos registros. <br>Testável: Os critérios permitem validar a transição de status conforme o preenchimento de campos. |

# <a name="c3"></a>3. Projeto da Aplicação Web (sprints 1 a 5)

## 3.1. Requisitos do Sistema (sprints 1 a 5)

*Esta seção formaliza o que o sistema deve fazer, sob quais regras e com quais qualidades. Atualize a cada sprint conforme os requisitos evoluem.*

### 3.1.1. Requisitos Funcionais (sprint 1, refinar até sprint 5)

| ID    | Nome | Descrição | Entrada | Processamento | Saída | Validação | Prioridade | US | RN | Endpoint |
|-------|------|-----------|---------|---------------|-------|-----------|------------|-----|-----|----------|
| RF001 | Cadastro de Indivíduos | Sistema recebe dados biográficos e socioeconômicos (nome, CPF, data nascimento, renda, etc.) via formulário, valida cada campo (CPF correto, data não futura, nome não vazio), armazena com UUID único no banco, retorna ID do novo registro e confirmação de sucesso | Formulário com campos: nome, CPF, NIS, RG, data nascimento, localização nascimento, gênero, estado civil, profissão, contatos (telefones, email), escolaridade, ocupação, renda, foto | Validação de CPF (dígito verificador), validação de data (não futura), normalização de strings (CAIXA ALTA, sem acentos), persistência em chefe_da_familia com hash UUID | ID gerado (UUID), confirmação com timestamp de criação, dados persistidos | CR: CPF inválido → erro bloqueante; Data futura → erro bloqueante; Nome vazio → erro bloqueante; CPF duplicado → verificar RN001 | Alta | US01 | RN001, RN008, RN009, RN016, RN019 | POST `/cadastros` |
| RF002 | Verificação de Duplicidade | Sistema recebe CPF ou NIS para validação, consulta tabela chefe_da_familia filtrando registros ATIVO com mesma chave, retorna "duplicado" ou "disponível" | CPF ou NIS formatado ou não formatado | Normalização (remover máscaras), query com filtro status='ATIVO', comparação exata | JSON: `{duplicado: boolean, mensagem: string}` | Status HTTP 200 OK (ambos casos); dados sensibilizados em logs | Alta | US02 | RN001, RN016, RN009 | POST `/cadastros/verificar-duplicidade` |
| RF003 | Atualização de Dados | Sistema recebe ID e novos valores, valida permissão do usuário (RBAC), valida dados (CPF/NIS não duplicam com outros registros), atualiza registro exceto campos imutáveis (ID, data_registro), retorna novo objeto e log de auditoria | ID (UUID) + objeto com campos a atualizar (nome, renda, status, etc.) | Validação RBAC, validação de duplicidade antes de atualizar, UPDATE no banco, registro em tabela de auditoria | Objeto atualizado em JSON + `{updated: true, audit_id: UUID, timestamp}` | Sem permissão → HTTP 403; ID inválido → HTTP 404; Dados inválidos → HTTP 422 | Alta | - | RN014, RN008, RN009, RN005 | PUT `/cadastros/:id` |
| RF004 | Visualização com Controle de Acesso | Sistema recebe ID de registro, verifica permissão do usuário autenticado, retorna dados filtrados por perfil (oculta renda/saúde se perfil insuficiente), registra em log de auditoria | ID do registro (UUID) + token de autenticação | Validação de permissão (RBAC), seleção de campos visíveis conforme perfil, busca em chefe_da_familia + joinrelacionados (núcleo, vulnerabilidade, localização), logging | JSON com dados visíveis + `{audit_id: UUID, acesso_timestamp}` | Sem autenticação → HTTP 401; Sem permissão → HTTP 403; Acesso a sensível → log obrigatório | Alta | US08 | RN005, RN018, RN012 | GET `/cadastros/:id` |
| RF005 | Busca Multi-Critério | Sistema recebe filtros (nome, CPF, bairro, setor_risco, vulnerabilidade), normaliza inputs, constrói query dinâmica com JOINs, executa em até 5 segundos (p95), retorna lista paginada com total de registros | Filtros: `{nome?, cpf?, nis?, bairro?, setor_risco_id?, vulnerabilidade_flags?, page?, limit?}` | Sanitização de strings, normalização de CPF/NIS, construção de prepared statements com AND/OR lógicos, paginação (offset/limit), ordenação por data_registro DESC | Array JSON com registros + metadados: `{total: int, page: int, limit: int, resultados: [...]}` | Filtro vazio → retorna todos (com paginação); Query complexa → timeout > 5s = erro; Permissões de dados sensíveis verificadas | Alta | US07 | RN015, RN017, RN005 | GET `/cadastros/busca` |
| RF006 | Inativação com Rastreamento | Sistema recebe ID e motivo (opcional), valida permissão, marca registro com flag `active=false` e registra em auditoria quem desativou e quando, não remove dados físicos | ID do registro + motivo (string, opcional) + token | Validação RBAC, UPDATE no banco com status INATIVO ou active=false, inserção em tabela de auditoria com informação de quem/quando | HTTP 204 No Content ou `{inativado: true, audit_id: UUID}` | Sem permissão → 403; ID não encontrado → 404; Já inativo → 409 Conflict | Média | US06 | RN007, RN003 | PATCH `/cadastros/:id/inativar` |
| RF007 | Auditoria com Rastreamento | Sistema registra automaticamente em cada ação: criação de registro (quem criou, quando, dados iniciais), edição (quem editou, quando, valores anteriores vs novos), visualização de dados sensíveis (quem visualizou, quando, qual campo) | Qualquer ação (CREATE, UPDATE, GET) + contexto de autenticação | Interceptação de requisições (middleware), extração de ID de usuário, timestamp, IP, operação realizada, dados afetados, persistência em tabela audit_logs com index em user_id + action_date | Logs estruturados em BD (imutáveis): `{audit_id, user_id, action, resource_id, timestamp, ip_origem, dados_anteriores?, dados_novos?}` | Logs não editáveis (somente INSERT); Retenção mínima 5 anos (RN012); Visualização restrita a admins | Alta | - | RN003, RN012, RN018 | GET `/logs` |
| RF008 | Anonimização Irreversível | Sistema cria cópia de dados para exportação estatística, substitui nomes por hashes SHA-256, remove CPF/NIS/RG, mantém dados estruturados (idade, renda, vulnerabilidade), gera arquivo ou visualização anonimizada | Query com filtros (período, região, setor) | SELECT ... FROM chefe_da_familia JOIN ..., geração de UUID hash para cada registro, mapeamento hash-UUID armazenado separadamente (inacessível), agregação de dados | Arquivo CSV/JSON com colunas: hash_id, idade (calculada), renda_faixa, vulnerabilidades (flags), dados anonimizados | Hash irreversível → verificação SHA-256; Sem possibilidade de reverter; Conformidade LGPD | Média | US09 | RN013, RN005 | Não implementado no backend atual |
| RF009 | Controle de Acesso RBAC | Sistema valida token Bearer ou identidade compatível, identifica o papel (admin, gestor, agente), verifica permissão antes de executar a lógica e nega acesso com HTTP 401/403 | Token Bearer ou headers `x-user-role` e `x-user-id` + ID de recurso solicitado | Validação do token pelo Supabase Auth, matriz de permissões e filtragem de dados visíveis conforme perfil | HTTP 200 com dados filtrados (se permitido) OU HTTP 401/403 (acesso negado) | Sem identidade → 401; Token inválido → 401; Perfil sem permissão → 403 | Alta | US08 | RN005 | GET `/auth/perfil` |
| RF010 | Sanitização/Padronização de Inputs | Sistema recebe dados em qualquer formato (CPF com pontos, nomes com acentos, telefones com parênteses), normaliza: CPF/NIS removendo máscaras (apenas dígitos), nomes em CAIXA ALTA sem acentos, telefones com apenas dígitos, persiste normalizado | Qualquer campo de entrada (formulário, API, importação) | Regex para remover máscaras, `toUpperCase()` para strings, `normalize().replace()` para acentos, persistência em formato normalizado | Dados armazenados em formato padrão; retorna ao usuário em formato legível | Validação CPF antes de normalizar; preservar formato original? Decidir com parceiro | Média | - | RN008, RN009 | POST `/cadastros/sanitizar` |
| RF011 | Gestão de Completude | Sistema permite salvar cadastro parcial, marca `cadastro_completo=false`, permite recuperação do rascunho, agrega campos pendentes e permite conclusão posterior | Dados parciais preenchidos | Validação parcial, persistência no BD e cálculo de pendências | Confirmação: `{salvo: true, status: 'incompleto', campos_pendentes: [...], resumo_id: UUID}` | Body vazio → erro; cadastro inexistente → 404 | Média | US06, US10 | RN010 | GET/PATCH `/cadastros/:id/rascunho` |
| RF012 | Vínculo Familiar Único | Sistema agrupa registros de indivíduos em um núcleo familiar (tabela nucleo_familiar), valida que responsável tem 18+ anos (RN002), impede que mesmo indivíduo pertença a 2 núcleos (chave única em membro_nucleo), permite consultar todos os membros de um núcleo | Dados do responsável e do núcleo familiar | Validação de dados do responsável, INSERT em nucleo_familiar e persistência dos dados familiares | Família criada com UUID, dados do responsável e metadados do núcleo | CPF inválido → erro; CPF/NIS duplicado → erro; renda negativa → erro; quantidade de membros inválida → erro | Alta | US01, US04 | RN002, RN011, RN007 | POST `/familias` |
| RF013 | Gestão de Documentos | Sistema aceita upload de imagens (JPG, PNG) e PDFs, valida tipo MIME, valida tamanho (máx 5MB), vincula arquivo ao registro de indivíduo, armazena no Supabase Storage e gera URL temporária | Arquivo multipart/form-data ou base64 + ID do cadastro + tipo_documento | Validação MIME/tamanho/limite, upload no Storage, persistência de metadados e URL assinada com TTL | URL de acesso + metadados do documento | Tipo inválido → 422; Tamanho > 5MB → 413; Max 10 arquivos por cadastro; Links expiram em 24h | Média | - | RN004, RN006 | GET/POST `/cadastros/:id/documentos` |
| RF014 | Busca Fonética/Fuzzy | Sistema recebe termo de busca, normaliza (remove acentos, maiúsculas), executa busca com algoritmo de semelhança (ex: Levenshtein distance), retorna nomes similares com score de relevância, ordena por score DESC | String de busca (nome parcial ou completo) | Normalização de entrada, aplicação de algoritmo fonético (ex: Metaphone ou Soundex), busca em índice full-text ou comparação em memória, cálculo de Levenshtein distance | Array de registros com score: `[{id, nome, score: 0.95}, {id, nome, score: 0.87}]` | Semelhança mínima > 70% para incluir no resultado; Busca acionada acima de 3 caracteres | Baixa | US07 | RN017 | Não implementado no backend atual |

### 3.1.2. Regras de Negócio (sprint 1, refinar até sprint 5)

| ID | Descrição da Regra de Negócio | Prioridade | RF Associado |
|:---|:---|:---:|:---|
| RN001 | **Unicidade de Identificação:** Não será permitido o cadastro de dois indivíduos com o mesmo número de CPF ou NIS ativos. | Alta | RF002 |
| RN002 | **Maioridade para Responsável:** Apenas indivíduos com idade igual ou superior a 18 anos podem ser vinculados como "Responsável Familiar". | Alta | RF012 |
| RN003 | **Imutabilidade de Logs:** Registros de auditoria não podem ser editados ou excluídos sob nenhuma circunstância. | Alta | RF007 |
| RN004 | **Formato de Documentos:** O sistema deve aceitar apenas arquivos nos formatos PDF, JPG e PNG para uploads. | Média | RF013 |
| RN005 | **Privacidade de Dados Sensíveis:** Campos de renda e saúde só devem ser visíveis para perfis autorizados (ex: Assistente Social). | Alta | RF009 |
| RN006 | **Limite de Tamanho de Arquivo:** Cada documento anexado ao cadastro não pode exceder o tamanho máximo de 5MB. | Média | RF013 |
| RN007 | **Inativação por Óbito:** Ao registrar óbito, o sistema deve encerrar automaticamente o vínculo do indivíduo no núcleo familiar. | Alta | RF006, RF012 |
| RN008 | **Padronização de Strings:** Nomes de indivíduos devem ser salvos em CAIXA ALTA e sem acentuação para facilitar buscas. | Média | RF010 |
| RN009 | **Persistência Limpa:** Números de documentos devem ser gravados apenas como dígitos numéricos (sem pontos ou traços). | Média | RF010 |
| RN010 | **Status de Cadastro Pendente:** Registros sem documento de identificação ou endereço devem ter o status "Incompleto". | Média | RF011 |
| RN011 | **Vínculo Familiar Único:** Um indivíduo não pode pertencer a dois núcleos familiares distintos simultaneamente. | Alta | RF012 |
| RN012 | **Retenção de Logs:** Logs de visualização de dados sensíveis devem ser mantidos por no mínimo 5 anos. | Média | RF007 |
| RN013 | **Anonimização Irreversível:** Dados nominais em bases estatísticas devem ser substituídos por hashes irreversíveis. | Alta | RF008 |
| RN014 | **Bloqueio em Auditoria:** Registros sob processo de auditoria ficam bloqueados para edição até a liberação do revisor. | Baixa | RF003, RF007 |
| RN015 | **Cálculo de Vulnerabilidade:** O status de vulnerabilidade deve considerar renda per capita familiar inferior ao limite legal. | Alta | RF005 |
| RN016 | **Validação de CPF:** O sistema deve validar matematicamente o dígito verificador do CPF antes de salvar. | Alta | RF001, RF002 |
| RN017 | **Busca Fonética:** A busca por semelhança deve retornar resultados foneticamente próximos (ex: Luiz e Luís). | Baixa | RF014 |
| RN018 | **Alerta de Acesso:** Gerar log de alerta sempre que um usuário comum visualizar dados socioeconômicos restritos. | Média | RF004, RF007 |
| RN019 | **Validação Cronológica:** O sistema deve impedir o registro de datas de nascimento futuras em relação à data atual. | Alta | RF001 |

### 3.1.3. Requisitos Não Funcionais (sprints 1 a 5)

| Eixo                     | ID | Requisito | Métrica / Critério | Justificativa | Como atendido |
|--------------------------|----|-----------|-------------------|--------------|----------------|
| **USAB — Usabilidade** | RNF001 | O formulário de cadastro em campo deve ser operável com uma mão, em tela de no mínimo 5 polegadas, sem necessidade de scroll excessivo. | Máximo de 5 campos por tela; botões com altura mínima de 48px; campo touch sem precisão excessiva. | Agentes em campo trabalham em condições adversas (chuva, movimento, mobilidade reduzida); interface mobile-first reduz erros. | Interface mobile-first com stepper por etapas, campos agrupados por tema (dados pessoais, saúde, imóvel), botões adaptados. |
| **USAB — Usabilidade** | RNF002 | O sistema deve fornecer feedback visual imediato para erros de validação nos formulários. | Mensagem de erro exibida em menos de 500ms após submissão inválida; destaque colorido no campo (vermelho WCAG AA). | Feedback rápido reduz ansiedade e retrabalho em campo com conexão intermitente. | Validação client-side com highlight no campo inválido e mensagem descritiva abaixo do input. |
| **USAB — Usabilidade** | RNF003 | O sistema deve indicar claramente quais campos são obrigatórios vs. opcionais. | 100% dos campos com label explícita: asterisco (*) para obrigatórios, "(opcional)" para opcionais; testado em testes de usabilidade. | Ambiguidade causa retrabalho e aumenta tempo de cadastro em campo; clareza melhora completude dos registros (RF011). | Labels com asteriscos, tooltips explicativos, indicadores visuais distintos. |
| **CONF — Confiabilidade** | RNF004 | O sistema deve manter os dados inseridos em campo mesmo em caso de perda de conexão. | Zero perda de dados em sessões com queda de rede; sincronização automática ao reconectar em até 60s; validação de integridade. | Agentes trabalham em áreas de conectividade intermitente (encostas, favelas); perda de dados compromete missão. | Armazenamento local temporário (localStorage ou IndexedDB) com fila de sincronização, checksums para validar integridade. |
| **CONF — Confiabilidade** | RNF005 | Cadastros parciais (RF011) devem ser recuperáveis após fechamento acidental do navegador. | Rascunho salvo automaticamente a cada 30 segundos de inatividade; persistência mínima 7 dias; indicador visual de "salvo". | Agentes podem fechar navegador acidentalmente em campo; perda compromete jornada de trabalho. | Auto-save periódico vinculado ao ID da sessão, com indicador visual de "salvo", recuperação ao reiniciar. |
| **CONF — Confiabilidade** | RNF006 | O sistema deve ter disponibilidade mínima de 99% durante jornadas de trabalho (horário comercial). | Uptime 99% medido mensalmente; tempo de resposta p99 < 2s em operações críticas; RTO 1 hora, RPO 15 min. | Sistema governamental social: falhas impedem atendimento a população em risco; confiabilidade é crítica para legitimidade. | Infraestrutura redundante, health checks, alertas automáticos, backup incremental a cada 15 minutos. |
| **DES — Desempenho** | RNF007 | O carregamento inicial do formulário de cadastro deve ser rápido mesmo em redes 3G. | p95 < 5 segundos em conexão simulada de 3G (1,6 Mbps); p50 < 2s em 4G (10 Mbps). | Agentes em campo podem ter apenas 3G; formulário pesado causa abandono e perda de produtividade. | Assets otimizados (lazy loading, compressão de imagens WebP), bundle JS minificado (< 200KB gzipped). |
| **DES — Desempenho** | RNF008 | A interface deve responder a interações do usuário em tempo real sem travamentos. | Tempo de resposta < 300ms para cliques e inputs; atualização de UI em 60 FPS; sem bloqueios de thread principal. | Interface travada prejudica experiência do agente em campo e afeta tomada de decisão em crise. | Debouncing em inputs, virtualização de listas longas, Web Workers para processamento pesado. |
| **DES — Desempenho** | RNF009 | Buscas multi-filtro devem retornar resultados em até 5 segundos mesmo com 10.000+ registros. | p95 < 5 segundos; índices em colunas de busca frequente (CPF, bairro, setor); prepared statements para evitar N+1. | Gestora (Cláudia) precisa filtrar em tempo real durante crise; busca lenta impacta decisão crítica. | Índices no banco de dados (CPF, NIS, bairro, setor_risco, data_registro); query optimization; result caching 5 min. |
| **SUP — Suportabilidade** | RNF010 | O sistema deve funcionar nos navegadores mais utilizados pelos agentes e gestores. | Compatível com Chrome 110+, Firefox 110+ e Safari 15+ em desktop e mobile; suporte a iOS 14+ e Android 10+. | Defesa Civil usa dispositivos variados; compatibilidade garante inclusão de todos os agentes sem exclusão. | Testes manuais de compatibilidade cross-browser nas sprints; progressive enhancement; polyfills para APIs antigas. |
| **SUP — Suportabilidade** | RNF011 | O código deve estar documentado para facilitar manutenção futura pela Defesa Civil ou outro time. | README completo com instruções de instalação, variáveis de ambiente e arquitetura; comentários em funções críticas; API OpenAPI/Swagger. | Projeto acadêmico: após conclusão, Defesa Civil deve conseguir manter código sem desenvolvedores originais. | Documentação em `documentos/outros`, API OpenAPI 3.0 gerada por `swagger-jsdoc`, Swagger UI em `/api-docs/`, schemas Zod em `src/docs/zodSchemas.ts` e exemplos de uso. |
| **SUP — Suportabilidade** | RNF012 | Funcionalidades novas devem ser integradas sem interromper serviço (zero downtime deployments). | Deploy em hot-standby; rollback automático se health check falha; testes de smoke suite rodarem pré-deploy. | Sistema de gestão de crise: indisponibilidade durante downtime prejudica resposta operacional. | Blue-green deployment, feature flags para rollout gradual, health checks contínuos. |
| **SEG — Segurança** | RNF013 | Todas as requisições HTTP devem usar HTTPS com TLS 1.2+. | 100% HTTPS; certificado válido e renovado automaticamente; redireção de HTTP → HTTPS; HSTS header ativo. | Dados sensíveis (CPF, saúde, renda) podem ser interceptados em rede aberta; conformidade com LGPD. | Certificado SSL letsencrypt com renovação automática, strict HSTS policy (1 ano), cipher suites modernas. |
| **SEG — Segurança** | RNF014 | Dados sensíveis (CPF, saúde, renda) nunca devem aparecer em URLs, query params ou logs não-cifrados. | Validação 100% em POST/PUT body; logs mascarados (CPF: ****1234); auditoria de violações. | Dados podem ser capturados em logs de proxy/balanceador; requisições GET são logadas mais frequentemente. | Dados sensíveis apenas em body (POST/PUT), middleware para mascarar logs, validação em pre-request hook. |
| **SEG — Segurança** | RNF015 | Controle de acesso (RBAC) deve ser aplicado antes de qualquer lógica de negócio em endpoints sensíveis. | Middleware de autenticação/autorização rodando primeiro; requisições sem permissão retornam 403 ANTES de tocar dados. | Frontend pode ser bypassado; segurança deve estar no backend; data exposure por autorização fraca causa vazamento de dados sensíveis. | Middleware RBAC em Express/NestJS antes de controllers, matriz de permissões explícita, testes de acesso negado. |
| **SEG — Segurança** | RNF016 | Senhas de usuários devem ser criptografadas com hash bcrypt cost ≥ 12 ou Argon2. | Nunca salvar senha em texto plano; bcrypt cost=12 (≈260ms por hash); Argon2id (memory=65535, time=2). | Banco de dados comprometido: senhas fracas resultam em contas tomadas; hash forte desestimula força bruta. | Hash bcrypt com cost dinâmico, nunca session cookie com senha, JWT com TTL 15 min + refresh token 7 dias. |
| **SEG — Segurança** | RNF017 | Logs de visualização de dados sensíveis (renda, saúde, CPF) devem ser auditados e retidos por 5 anos mínimo. | Tabela audit_logs imutável (somente INSERT); logs incluem user_id, timestamp, IP origem, campo acessado, ação; retenção 5+ anos. | LGPD artigo 5 II: Defesa Civil deve rastrear acesso a dados sensíveis; auditoria serve como comprovação de conformidade. | Tabela separada audit_logs com constraint UNIQUE na combinação (user_id, resource_id, action, timestamp), backup diário. |
| **SEG — Segurança** | RNF018 | Tokens de sessão/JWT devem ter TTL (time-to-live) bem definido e usar refresh tokens para sessões longas. | Access token: 15 minutos; Refresh token: 7 dias com rotate-on-use; sessão: max 8 horas mesmo com refresh ativo. | Tokens roubados com TTL longo = conta comprometida por horas; refresh token permite sessão sem manter tokens longevos em memória. | JWT com sub, iat, exp; middleware verifica exp antes de aceitar; refresh token endpoint requer identidade validada novamente. |
| **SEG — Segurança** | RNF019 | Arquivo com dados sensíveis exportados (RF008) devem ser anonimizados de forma irreversível com hash SHA-256. | Cada registro recebe UUID hash único; CPF/NIS/RG removidos; mapeamento hash→ID armazenado separadamente; sem possibilidade reversa. | Auditor pode pedir cópia dos dados; anonimização irreversível garante LGPD; hash SHA-256 é criptograficamente seguro. | SHA-256 em Node.js `crypto.createHash()`, mapeamento armazenado cifrado com chave separada, nunca exportado junto. |
| **SEG — Segurança** | RNF020 | Falhas de autenticação (login inválido, token expirado, RBAC denied) devem ser registradas com IP, user agent, tentativa. | Log de falha: IP origem, user_agent, endpoint tentado, motivo (invalid_password, expired_token, insufficient_scope); alerta em >5 falhas/min/IP. | Prevenção contra força bruta; detecção de ataques; conformidade com log de auditoria. | Middleware de logging de falhas, CloudFlare Rate Limiting ou similar, alertas em Grafana/Datadog. |
| **SEG — Segurança** | RNF021 | Dados em repouso no banco de dados devem ser criptografados com AES-256 para campos sensíveis. | Criptografia AES-256 para: CPF, NIS, renda, dados de saúde; chave mestra armazenada em secret manager (Vault, AWS Secrets Manager). | Banco de dados físico comprometido: dados sensíveis não são legíveis sem chave mestra. | PostgreSQL pgcrypto extension ou application-level encryption (NestJS/TypeORM hooks). |
| **SEC — Segurança** | RNF022 | Backup do banco de dados deve ser feito automaticamente a cada 15 minutos, criptografado e armazenado offline. | Backup incremental a cada 15 min; backup full diário; armazenamento offline (S3 cross-region ou tape archive); RPO = 15 min, RTO = 1 hora. | Perda de dados de população vulnerável = prejuízo social; conformidade com LGPD (direito à informação íntegra). | AWS RDS automated backups + S3 replication, PostgreSQL WAL archiving, testes de restore mensais. |
| **CAP — Capacidade** | RNF023 | O sistema deve suportar o volume estimado de cadastros do município de Santo André sem degradação de performance. | Suportar até 10.000 núcleos familiares (40.000 indivíduos); buscas em p95 < 5s em 10k registros simultâneos. | Santo André: ~70.000 habitantes em áreas de risco; 1-2 indivíduos por núcleo estimado = 10-20k registros; segurança de escala. | Índices no banco de dados, sharding se necessário, cache em Redis, CDN para assets estáticos. |
| **CAP — Capacidade** | RNF024 | Upload de documentos (RF013) deve suportar até 10 arquivos por cadastro, máximo 5MB cada, máximo 500MB por usuário. | Limite: 10 arquivos/cadastro, 5MB/arquivo, 500MB/usuário/mês; validação no front-end e back-end; quota tracking. | Armazenamento em nuvem é finito; limites protegem contra abuso e garantem sustentabilidade operacional. | Validação multipart form-data, middleware de tamanho, AWS S3 with lifecycle policies, quota tracking em BD. |
| **REST — Restrições Design** | RNF025 | A interface deve comunicar claramente o nível de urgência/prioridade de cada família cadastrada. | Famílias com perfil de alta vulnerabilidade (idosos, PCDs, gestantes) devem ter indicador visual distinto (cores/ícones) em todas as listagens. | Defesa Civil prioriza por vulnerabilidade; interface clara = decisão rápida em emergência. | Badges coloridos por nível de prioridade (vermelho=MUITO_ALTO, amarelo=ALTO, verde=MÉDIO), ícones supplementais. |
| **REST — Restrições Design** | RNF026 | O dashboard deve ser legível em ambientes com alta luminosidade (uso externo). | Contraste mínimo 4.5:1 entre texto e fundo (WCAG AA nível); fontes sem serif, tamanho mínimo 16px em mobile; sem uso exclusivo de cor. | Agentes em campo sob sol forte; baixo contraste = informação ilegível = erro operacional. | Paleta de cores validada com Webaim Contrast Checker, fontes San Francisco/Roboto, testes de legibilidade em brightness > 500 lux. |
| **ORG — Organizacionais** | RNF027 | O sistema não deve depender de serviços externos pagos para funcionamento crítico. | Zero dependências de APIs externas pagas em: cadastro, busca, autenticação, armazenamento de dados estruturados. | Orçamento público limitado; APIs pagas = custo operacional permanente; open-source garante sustentabilidade. | PostgreSQL (BD), JWT (auth), open-source stack. |
| **ORG — Organizacionais** | RNF028 | O projeto deve estar em conformidade com a LGPD durante todo o desenvolvimento e após lançamento. | Dados reais de munícipes não utilizados em desenvolvimento/repositório público; dados de teste sempre fictícios ou anonimizados; conformidade verificada em sprint 5. | LGPD é lei federal brasileira; não-conformidade = multa até 2% do faturamento; Defesa Civil pode ser responsabilizada. | Dados fictícios nos seeds do banco, variáveis de ambiente para produção, repositório privado, DPA (Data Processing Agreement), PIA (Privacy Impact Assessment). |
| **ORG — Organizacionais** | RNF029 | A solução deve ser mantível pela Defesa Civil ou por terceiros sem depender de time original. | Código documentado, arquitetura clara, ausência de débito técnico crítico, CI/CD setup, runbooks para operação. | Projeto acadêmico: após conclusão, Defesa Civil não pode depender de estudantes; sustentabilidade operacional é obrigatória. | Documentação completa, testes automatizados, infrastructure-as-code, runbooks para troubleshooting, handover com sprint 5. |

### 3.1.4. Matriz de Rastreabilidade Completa: RF ↔ US ↔ RN ↔ Endpoint (sprints 1 a 5)

**Objetivo:** Demonstrar que cada Requisito Funcional (RF) está rastreado até User Stories (US), ligado a Regras de Negócio (RN) e mapeado para Endpoints da API, garantindo cobertura completa e evitar lacunas.

| RF | US Associada | RN Associadas | Endpoint | Método | Status | Observação |
|----|----|----|----|----|----|-----|
| RF001 | US01 | RN016, RN019 | `/cadastros` | POST | Integrado | Valida CPF, data não-futura, obrigatórios e duplicidade ativa antes de persistir |
| RF002 | US02 | RN001, RN016, RN009 | `/cadastros/verificar-duplicidade` | POST | Integrado | Normaliza CPF/NIS, valida CPF e consulta registros ativos |
| RF003 | US03 | RN014, RN008, RN009, RN005 | `/cadastros/:id` | PUT | Integrado | RBAC, normalização, duplicidade, campos imutáveis, auditoria e bloqueio administrativo durante revisão |
| RF004 | US08 | RN005, RN018, RN012 | `/cadastros/:id` | GET | Integrado | Filtra campos sensíveis por perfil e registra visualização em auditoria |
| RF005 | US07 | RN015, RN017, RN005 | `/cadastros/busca` | GET | Integrado | Busca por nome, CPF, NIS, bairro, setor, status, prioridade e flags de vulnerabilidade |
| RF006 | US06 | RN007, RN003 | `/cadastros/:id/inativar` | PATCH | Integrado | Inativa sem remoção física, registra auditoria e fecha vínculo quando motivo é óbito |
| RF007 | - | RN003, RN012, RN018 | `/logs` | GET | Integrado | Logs persistidos em `audit_logs`, fallback em memória, retenção calculada para 5 anos |
| RF008 | - | RN013, RN005 | `/cadastros/exportar/anonimizado` | GET | Integrado | Gera hash SHA-256 e remove identificadores; exige GESTOR ou ADMIN |
| RF009 | US08 | RN005 | `/auth/perfil` | Pendente | O projeto usa somente login mockado para redirecionamento; RBAC e endpoint de perfil não estão implementados no backend atual. |
| RF010 | - | RN008, RN009 | `/cadastros/sanitizar` | POST | Integrado | Normaliza strings e remove máscaras de documentos/telefones/CEP |
| RF011 | US06 | RN010 | `/cadastros/:id/rascunho` | Integrado | Backend salva e recupera rascunho, calcula pendências e mantém o status de completude |
| RF012 | US01, US04 | RN002, RN011, RN007 | `/nucleos-familiares` | POST | Integrado | Cria núcleo/responsável, valida maioridade e aplica unicidade de vínculo por índice no banco |
| RF013 | - | RN004, RN006 | `/cadastros/:id/documentos` | POST | Integrado | Upload multipart ou base64, validação de MIME/tamanho/limite, metadados persistidos e URL temporária do Storage |
| RF014 | US07 | RN017 | `/cadastros/busca/fuzzy` | GET | Integrado | Busca fuzzy por Levenshtein e score de similaridade |

Legenda de status:

- **Integrado:** endpoint, service/repository e testes cobrem o fluxo principal do requisito.
- **Parcial:** existe endpoint e parte relevante da regra no backend, mas ha dependencia externa, frontend ou evolucao planejada.
- **Pendente:** requisito ainda nao possui implementacao funcional no escopo atual.

Escopo tecnico atual:

- A autenticacao real por JWT/Supabase Auth e RBAC nao estao integrados. O login mockado existe apenas para redirecionar administrador e agente aos respectivos fluxos.
- A documentacao Web API e gerada por OpenAPI 3.0 com `swagger-jsdoc`, Swagger UI em `/api-docs/` e schemas Zod convertidos para OpenAPI.
- As tabelas Supabase necessarias sao `chefe_da_familia`, `nucleo_familiar`, `membro_nucleo`, `localizacao`, `setor_risco`, `vulnerabilidade`, `audit_logs` e `cadastro_documento`.
> **Nota de escopo atual:** requisitos e trechos sobre autenticacao, auditoria, logs de alteracao e RBAC permanecem
> como historico de planejamento e nao fazem parte do backend atual. A rastreabilidade implementada
> registra apenas o cadastrador informado no cadastro como responsavel pela criacao de cada nucleo familiar.
