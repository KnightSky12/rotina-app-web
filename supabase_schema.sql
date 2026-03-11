-- Passo a Passo: 
-- 1. Copie e cole todo esse arquivo no "SQL Editor" do sistema Supabase
-- 2. Aperte o botão "Run" (no canto inferior direito).
-- Isso vai criar as "planilhas" exatas no banco de dados para os seus gráficos.

CREATE TABLE daily_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  UNIQUE(date, name, tag_id)
);

CREATE TABLE hourly_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  hour_str TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  duration_minutes NUMERIC DEFAULT 0,
  UNIQUE(date, hour_str, tag_id)
);

-- Liberar acesso (uso local pessoal sem login com Email ou Senha no momento)
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write daily_tasks" ON daily_tasks
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read/write hourly_logs" ON hourly_logs
  FOR ALL USING (true) WITH CHECK (true);
