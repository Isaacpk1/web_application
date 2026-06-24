-- DOWN de 002: restaura a RPC de cadastro composta definida em 001.
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
    v_vulnerabilidade TEXT;
    v_existente INTEGER;
BEGIN
    SELECT nucleo_familiar_id INTO v_existente
    FROM cadastro_requisicao WHERE id = p_chave_idempotencia;
    IF FOUND THEN
        RETURN jsonb_build_object('nucleo_familiar_id', v_existente, 'reutilizado', TRUE);
    END IF;

    INSERT INTO cadastro_requisicao (id, id_cadastrador)
    VALUES (p_chave_idempotencia, (v_nucleo->>'id_cadastrador')::INTEGER)
    ON CONFLICT (id) DO NOTHING;

    IF NOT FOUND THEN
        SELECT nucleo_familiar_id INTO v_existente
        FROM cadastro_requisicao WHERE id = p_chave_idempotencia;
        RETURN jsonb_build_object('nucleo_familiar_id', v_existente, 'reutilizado', TRUE);
    END IF;

    INSERT INTO casa (
        id_setor, coordenada_lat, coordenada_long, logradouro, numero, bairro,
        observacao, cep, tipo_construcao, uso_imovel, status_imovel, data_interdicao
    ) VALUES (
        (v_casa->>'id_setor')::INTEGER, (v_casa->>'coordenada_lat')::DECIMAL,
        (v_casa->>'coordenada_long')::DECIMAL, UPPER(BTRIM(v_casa->>'logradouro')),
        UPPER(BTRIM(v_casa->>'numero')), UPPER(BTRIM(v_casa->>'bairro')),
        NULLIF(v_casa->>'observacao', ''), NULLIF(v_casa->>'cep', ''),
        v_casa->>'tipo_construcao', v_casa->>'uso_imovel',
        COALESCE(v_casa->>'status_imovel', 'Sadio'), NULLIF(v_casa->>'data_interdicao', '')::DATE
    ) ON CONFLICT (id_setor, bairro, logradouro, numero)
    DO UPDATE SET id = casa.id
    RETURNING id INTO v_casa_id;

    v_responsavel := p_payload->'individuos'->((p_payload->>'responsavel_indice')::INTEGER);
    SELECT nf.id INTO v_existente
    FROM nucleo_familiar nf
    JOIN individuo i ON i.id = nf.id_chefe_familia
    WHERE nf.id_casa = v_casa_id
      AND i.nome_completo = UPPER(BTRIM(v_responsavel->>'nome_completo'))
      AND i.data_nascimento = (v_responsavel->>'data_nascimento')::DATE;
    IF FOUND THEN
        RAISE EXCEPTION 'Possivel duplicidade: responsavel ja cadastrado neste endereco'
          USING ERRCODE = '23505';
    END IF;

    INSERT INTO nucleo_familiar (
        nome_nucleo, id_casa, id_cadastrador, observacao,
        tempo_residencia_domicilio, tempo_residencia_area,
        tempo_residencia_municipio, renda_familiar_total
    ) VALUES (
        UPPER(BTRIM(v_nucleo->>'nome_nucleo')), v_casa_id,
        (v_nucleo->>'id_cadastrador')::INTEGER, NULLIF(v_nucleo->>'observacao', ''),
        NULLIF(v_nucleo->>'tempo_residencia_domicilio', '')::INTEGER,
        NULLIF(v_nucleo->>'tempo_residencia_area', '')::INTEGER,
        NULLIF(v_nucleo->>'tempo_residencia_municipio', '')::INTEGER,
        COALESCE((v_nucleo->>'renda_familiar_total')::DECIMAL, 0)
    ) RETURNING id INTO v_nucleo_id;

    FOR v_membro IN SELECT value FROM jsonb_array_elements(p_payload->'individuos') LOOP
        INSERT INTO individuo (id_nucleo_familiar, nome_completo, data_nascimento, genero, cpf, nis, status_vital)
        VALUES (
            v_nucleo_id, UPPER(BTRIM(v_membro->>'nome_completo')),
            (v_membro->>'data_nascimento')::DATE, v_membro->>'genero',
            NULLIF(regexp_replace(COALESCE(v_membro->>'cpf',''), '\D', '', 'g'), ''),
            NULLIF(regexp_replace(COALESCE(v_membro->>'nis',''), '\D', '', 'g'), ''),
            COALESCE(v_membro->>'status_vital', 'Vivo')
        ) RETURNING id INTO v_individuo_id;

        IF v_indice = (p_payload->>'responsavel_indice')::INTEGER THEN
            v_responsavel_id := v_individuo_id;
        END IF;
        FOR v_vulnerabilidade IN
            SELECT value FROM jsonb_array_elements_text(
                COALESCE(p_payload->'vulnerabilidades_por_individuo'->v_indice::TEXT, '[]'::JSONB)
            )
        LOOP
            INSERT INTO individuo_vulnerabilidade (id_individuo, id_vulnerabilidade)
            VALUES (v_individuo_id, v_vulnerabilidade::INTEGER)
            ON CONFLICT DO NOTHING;
        END LOOP;
        v_indice := v_indice + 1;
    END LOOP;

    UPDATE nucleo_familiar SET id_chefe_familia = v_responsavel_id WHERE id = v_nucleo_id;

    FOR v_pet IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'pets', '[]'::JSONB)) LOOP
        INSERT INTO pet (id_nucleo_familiar, tipo, porte, quantidade, imagem)
        VALUES (v_nucleo_id, NULLIF(v_pet->>'tipo', ''), NULLIF(v_pet->>'porte', ''),
                NULLIF(v_pet->>'quantidade', '')::INTEGER, NULLIF(v_pet->>'imagem', ''));
    END LOOP;

    UPDATE cadastro_requisicao SET nucleo_familiar_id = v_nucleo_id WHERE id = p_chave_idempotencia;
    RETURN jsonb_build_object('nucleo_familiar_id', v_nucleo_id, 'reutilizado', FALSE);
END;
$$;
