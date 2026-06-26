DROP INDEX IF EXISTS idx_pet_nucleo;
DROP TABLE IF EXISTS pet;

NOTIFY pgrst, 'reload schema';
