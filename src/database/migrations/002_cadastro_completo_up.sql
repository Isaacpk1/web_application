-- Evolui a RPC de cadastro composto. Esta migration e somente UP; o arquivo
-- 002_cadastro_completo_down.sql restaura a versao anterior quando necessario.
CREATE OR REPLACE FUNCTION criar_cadastro_completo(
    p_chave_idempotencia UUID,
    p_payload JSONB
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_casa JSONB := p_payload->'casa';
    v_nucleo JSONB := p_payload->'nucleo_familiar';
    v_membro JSONB;
    v_pet JSONB;
    v_casa_id INTEGER;
    v_nucleo_id INTEGER;
    v_individuo_id INTEGER;
    v_responsavel_id INTEGER;
    v_responsavel JSONB;
    v_indice INTEGER := 0;
    v_vulnerabilidade_id INTEGER;
    v_existente INTEGER;
    v_cpf TEXT;
    v_nis TEXT;
BEGIN
    IF p_payload IS NULL OR v_casa IS NULL OR v_nucleo IS NULL
       OR jsonb_typeof(p_payload->'individuos') <> 'array'
       OR jsonb_array_length(p_payload->'individuos') = 0 THEN
        RAISE EXCEPTION 'Payload de cadastro incompleto' USING ERRCODE = '22023';
    END IF;

    IF COALESCE(v_casa->>'id_setor', '') !~ '^[0-9]+$'
       OR NOT EXISTS (SELECT 1 FROM setor WHERE id = (v_casa->>'id_setor')::INTEGER AND ativo) THEN
        RAISE EXCEPTION 'Endereco invalido: setor inexistente ou inativo' USING ERRCODE = '22023';
    END IF;
    IF BTRIM(COALESCE(v_casa->>'logradouro', '')) = ''
       OR BTRIM(COALESCE(v_casa->>'numero', '')) = ''
       OR BTRIM(COALESCE(v_casa->>'bairro', '')) = '' THEN
        RAISE EXCEPTION 'Endereco invalido: logradouro, numero e bairro sao obrigatorios' USING ERRCODE = '22023';
    END IF;
    IF COALESCE(p_payload->>'responsavel_indice', '') !~ '^[0-9]+$'
       OR (p_payload->>'responsavel_indice')::INTEGER >= jsonb_array_length(p_payload->'individuos') THEN
        RAISE EXCEPTION 'Responsavel invalido: selecione um membro do nucleo' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM cadastrador WHERE id = (v_nucleo->>'id_cadastrador')::INTEGER) THEN
        RAISE EXCEPTION 'Cadastrador invalido' USING ERRCODE = '22023';
    END IF;

    SELECT nucleo_familiar_id INTO v_existente FROM cadastro_requisicao WHERE id = p_chave_idempotencia;
    IF FOUND THEN
        RETURN jsonb_build_object('nucleo_familiar_id', v_existente, 'reutilizado', TRUE);
    END IF;
    INSERT INTO cadastro_requisicao (id, id_cadastrador)
    VALUES (p_chave_idempotencia, (v_nucleo->>'id_cadastrador')::INTEGER)
    ON CONFLICT (id) DO NOTHING;
    IF NOT FOUND THEN
        SELECT nucleo_familiar_id INTO v_existente FROM cadastro_requisicao WHERE id = p_chave_idempotencia;
        RETURN jsonb_build_object('nucleo_familiar_id', v_existente, 'reutilizado', TRUE);
    END IF;

    INSERT INTO casa (id_setor, coordenada_lat, coordenada_long, logradouro, numero, bairro, observacao, cep, tipo_construcao, uso_imovel, status_imovel, data_interdicao)
    VALUES ((v_casa->>'id_setor')::INTEGER, (v_casa->>'coordenada_lat')::DECIMAL, (v_casa->>'coordenada_long')::DECIMAL,
        UPPER(BTRIM(v_casa->>'logradouro')), UPPER(BTRIM(v_casa->>'numero')), UPPER(BTRIM(v_casa->>'bairro')),
        NULLIF(v_casa->>'observacao', ''), NULLIF(v_casa->>'cep', ''), v_casa->>'tipo_construcao', v_casa->>'uso_imovel',
        COALESCE(v_casa->>'status_imovel', 'Sadio'), NULLIF(v_casa->>'data_interdicao', '')::DATE)
    ON CONFLICT (id_setor, bairro, logradouro, numero) DO UPDATE SET id = casa.id
    RETURNING id INTO v_casa_id;

    v_responsavel := p_payload->'individuos'->((p_payload->>'responsavel_indice')::INTEGER);
    IF NULLIF(regexp_replace(COALESCE(v_responsavel->>'cpf', ''), '\D', '', 'g'), '') IS NULL
       AND NULLIF(regexp_replace(COALESCE(v_responsavel->>'nis', ''), '\D', '', 'g'), '') IS NULL
       AND EXISTS (
         SELECT 1 FROM nucleo_familiar nf JOIN individuo i ON i.id = nf.id_chefe_familia
         WHERE nf.id_casa = v_casa_id
           AND i.nome_completo = UPPER(BTRIM(v_responsavel->>'nome_completo'))
           AND i.data_nascimento = (v_responsavel->>'data_nascimento')::DATE
       ) THEN
        RAISE EXCEPTION 'Duplicidade sem documento: responsavel ja cadastrado neste endereco' USING ERRCODE = '23505';
    END IF;

    INSERT INTO nucleo_familiar (nome_nucleo, id_casa, id_cadastrador, observacao, tempo_residencia_domicilio, tempo_residencia_area, tempo_residencia_municipio, renda_familiar_total)
    VALUES (UPPER(BTRIM(v_nucleo->>'nome_nucleo')), v_casa_id, (v_nucleo->>'id_cadastrador')::INTEGER,
        NULLIF(v_nucleo->>'observacao', ''), NULLIF(v_nucleo->>'tempo_residencia_domicilio', '')::INTEGER,
        NULLIF(v_nucleo->>'tempo_residencia_area', '')::INTEGER, NULLIF(v_nucleo->>'tempo_residencia_municipio', '')::INTEGER,
        COALESCE(NULLIF(v_nucleo->>'renda_familiar_total', '')::DECIMAL, 0)) RETURNING id INTO v_nucleo_id;

    FOR v_membro IN SELECT value FROM jsonb_array_elements(p_payload->'individuos') LOOP
        v_cpf := NULLIF(regexp_replace(COALESCE(v_membro->>'cpf', ''), '\D', '', 'g'), '');
        v_nis := NULLIF(regexp_replace(COALESCE(v_membro->>'nis', ''), '\D', '', 'g'), '');
        IF v_cpf IS NOT NULL AND EXISTS (SELECT 1 FROM individuo WHERE cpf = v_cpf) THEN
            RAISE EXCEPTION 'CPF ja cadastrado' USING ERRCODE = '23505';
        END IF;
        IF v_nis IS NOT NULL AND EXISTS (SELECT 1 FROM individuo WHERE nis = v_nis) THEN
            RAISE EXCEPTION 'NIS ja cadastrado' USING ERRCODE = '23505';
        END IF;
        INSERT INTO individuo (id_nucleo_familiar, nome_completo, apelido, nome_social, data_nascimento, genero, cor_raca, uf, estado_civil, profissao, nome_mae, nome_pai, grau_parentesco, escolaridade, situacao_ocupacional, cpf, doc_estrangeiro, rg, nis, telefone, email, status_vital, data_obito, semanas_gestacao)
        VALUES (v_nucleo_id, UPPER(BTRIM(v_membro->>'nome_completo')), NULLIF(v_membro->>'apelido',''), NULLIF(v_membro->>'nome_social',''),
            NULLIF(v_membro->>'data_nascimento','')::DATE, v_membro->>'genero', NULLIF(v_membro->>'cor_raca',''), NULLIF(v_membro->>'uf',''),
            NULLIF(v_membro->>'estado_civil',''), NULLIF(v_membro->>'profissao',''), NULLIF(v_membro->>'nome_mae',''), NULLIF(v_membro->>'nome_pai',''),
            NULLIF(v_membro->>'grau_parentesco',''), NULLIF(v_membro->>'escolaridade',''), NULLIF(v_membro->>'situacao_ocupacional',''),
            v_cpf, NULLIF(v_membro->>'doc_estrangeiro',''), NULLIF(v_membro->>'rg',''), v_nis, NULLIF(v_membro->>'telefone',''),
            NULLIF(v_membro->>'email',''), COALESCE(v_membro->>'status_vital','Vivo'), NULLIF(v_membro->>'data_obito','')::DATE,
            NULLIF(v_membro->>'semanas_gestacao','')::INTEGER) RETURNING id INTO v_individuo_id;
        IF v_indice = (p_payload->>'responsavel_indice')::INTEGER THEN v_responsavel_id := v_individuo_id; END IF;
        FOR v_vulnerabilidade_id IN SELECT value::INTEGER FROM jsonb_array_elements_text(COALESCE(p_payload->'vulnerabilidades_por_individuo'->v_indice::TEXT, '[]'::JSONB)) LOOP
            IF NOT EXISTS (SELECT 1 FROM vulnerabilidade WHERE id = v_vulnerabilidade_id) THEN
                RAISE EXCEPTION 'Vulnerabilidade invalida' USING ERRCODE = '22023';
            END IF;
            INSERT INTO individuo_vulnerabilidade (id_individuo, id_vulnerabilidade) VALUES (v_individuo_id, v_vulnerabilidade_id) ON CONFLICT DO NOTHING;
        END LOOP;
        v_indice := v_indice + 1;
    END LOOP;
    UPDATE nucleo_familiar SET id_chefe_familia = v_responsavel_id WHERE id = v_nucleo_id;
    FOR v_pet IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'pets', '[]'::JSONB)) LOOP
        IF NULLIF(v_pet->>'quantidade','') IS NOT NULL AND (v_pet->>'quantidade')::INTEGER < 1 THEN
            RAISE EXCEPTION 'Pet invalido: quantidade deve ser maior que zero' USING ERRCODE = '22023';
        END IF;
        INSERT INTO pet (id_nucleo_familiar, tipo, porte, quantidade, imagem) VALUES (v_nucleo_id, NULLIF(v_pet->>'tipo',''), NULLIF(v_pet->>'porte',''), NULLIF(v_pet->>'quantidade','')::INTEGER, NULLIF(v_pet->>'imagem',''));
    END LOOP;
    UPDATE cadastro_requisicao SET nucleo_familiar_id = v_nucleo_id WHERE id = p_chave_idempotencia;
    RETURN jsonb_build_object('nucleo_familiar_id', v_nucleo_id, 'reutilizado', FALSE);
END;
$$;
