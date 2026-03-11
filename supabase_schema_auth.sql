-- ATENÇÃO: Esse script vai apagar as antigas tabelas e criar as novas com Segurança (RLS).
-- Passo a Passo: 
-- 1. Copie e cole todo esse arquivo no "SQL Editor" do sistema Supabase
-- 2. Aperte o botão "Run".

DROP TABLE IF EXISTS daily_tasks;
DROP TABLE IF EXISTS hourly_logs;

-- Planilha de Tarefas do Dia contendo a coluna obrigatória "user_id"
CREATE TABLE daily_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  UNIQUE(user_id, date, name, tag_id)
);

-- Planilha da Timeline/Gráfico de Barras contendo a coluna obrigatória "user_id"
CREATE TABLE hourly_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  hour_str TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  duration_minutes NUMERIC DEFAULT 0,
  UNIQUE(user_id, date, hour_str, tag_id)
);

-- Ativar a Trava de Segurança Mágica (RLS)
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_logs ENABLE ROW LEVEL SECURITY;

-- As Regras de Ouro: O usuário atual logado (auth.uid) SÓ pode ver e editar as PRÓPRIAS linhas.
CREATE POLICY "Users can manage their own daily_tasks" 
ON daily_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own hourly_logs" 
ON hourly_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
