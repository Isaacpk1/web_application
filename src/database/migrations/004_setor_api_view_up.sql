CREATE OR REPLACE VIEW setor_api AS
SELECT
    s.id,
    COALESCE(s.denominacao, s.codigo_setor) AS nome_regiao,
    STRING_AGG(DISTINCT tr.nome, ', ' ORDER BY tr.nome) AS tipo_risco,
    CASE MAX(gr.ordem_exibicao)
        WHEN 4 THEN 'Muito Alto'
        WHEN 3 THEN 'Alto'
        WHEN 2 THEN 'Médio'
        ELSE 'Baixo'
    END AS grau_risco,
    s.codigo_setor
FROM setor s
LEFT JOIN setor_tipo_risco str
    ON str.id_setor = s.id AND str.ativo = TRUE
LEFT JOIN tipo_risco tr
    ON tr.id = str.id_tipo_risco AND tr.ativo = TRUE
LEFT JOIN grau_risco gr
    ON gr.id = str.id_grau_risco AND gr.ativo = TRUE
WHERE s.ativo = TRUE
GROUP BY s.id, s.codigo_setor, s.denominacao;
