-- Adiciona coluna bot_config na tabela settings
-- Roda uma vez no Supabase Dashboard > SQL Editor

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS bot_config JSONB DEFAULT '{}';
