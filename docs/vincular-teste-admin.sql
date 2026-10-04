-- Vincula teste@mkbalaobarbearia.com como Admin MK
-- Execute no Supabase Dashboard → SQL Editor

UPDATE barbers
SET user_id = (
  SELECT id FROM auth.users WHERE email = 'teste@mkbalaobarbearia.com'
)
WHERE slug = 'admin';

-- Verificação
SELECT b.name, b.slug, b.role, u.email, b.user_id IS NOT NULL AS vinculado
FROM barbers b
LEFT JOIN auth.users u ON u.id = b.user_id
WHERE b.slug = 'admin';
