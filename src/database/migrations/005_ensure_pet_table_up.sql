-- Garante a tabela de pets em ambientes que receberam uma versao antiga da
-- migration inicial ou ficaram com o schema cache do PostgREST desatualizado.
CREATE TABLE IF NOT EXISTS pet (
    id                  SERIAL PRIMARY KEY,
    id_nucleo_familiar  INTEGER NOT NULL,
    tipo                VARCHAR(50),
    porte               VARCHAR(50),
    imagem              VARCHAR(255),
    quantidade          INTEGER,

    CONSTRAINT fk_pet_nucleo
        FOREIGN KEY (id_nucleo_familiar)
        REFERENCES nucleo_familiar(id)
);

CREATE INDEX IF NOT EXISTS idx_pet_nucleo
    ON pet(id_nucleo_familiar);

-- Supabase/PostgREST pode manter cache do schema por alguns instantes.
-- O notify abaixo pede reload imediato apos a migration.
NOTIFY pgrst, 'reload schema';
