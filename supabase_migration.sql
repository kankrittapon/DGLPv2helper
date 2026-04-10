-- ===== DGLP Quiz Helper v1.2 — Supabase Migration =====
-- รัน SQL นี้ใน Supabase Dashboard → SQL Editor

-- ============================================
-- 1. สร้างตาราง quiz_attempts
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_name TEXT,
  course_id TEXT,
  section_id TEXT,
  total_questions INT,
  answers JSONB,
  score INT,
  ai_provider TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_topic ON quiz_attempts(course_id, section_id);
CREATE INDEX IF NOT EXISTS idx_attempts_created ON quiz_attempts(created_at DESC);

-- ============================================
-- 3. Updated_at Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON quiz_attempts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 4. Row Level Security (RLS)
-- ============================================
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
DROP POLICY IF EXISTS "Users see own data" ON quiz_attempts;
CREATE POLICY "Users see own data"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own data
DROP POLICY IF EXISTS "Users insert own data" ON quiz_attempts;
CREATE POLICY "Users insert own data"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own data
DROP POLICY IF EXISTS "Users update own data" ON quiz_attempts;
CREATE POLICY "Users update own data"
  ON quiz_attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own data
DROP POLICY IF EXISTS "Users delete own data" ON quiz_attempts;
CREATE POLICY "Users delete own data"
  ON quiz_attempts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. Email/Password Auth is enabled by default in Supabase!
-- ============================================
