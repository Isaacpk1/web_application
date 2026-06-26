-- Remove o bucket somente se ele estiver vazio.
DELETE FROM storage.buckets
WHERE id = 'cadastro-imagens'
  AND NOT EXISTS (
      SELECT 1
      FROM storage.objects
      WHERE bucket_id = 'cadastro-imagens'
  );
