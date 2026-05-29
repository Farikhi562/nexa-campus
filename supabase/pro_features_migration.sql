ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weakness_analysis JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS seat_owner_id UUID REFERENCES auth.users;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_text TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;

ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS room_password TEXT;
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS max_members INT DEFAULT 5;
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS welcome_message TEXT;
ALTER TABLE study_rooms ADD COLUMN IF NOT EXISTS custom_name TEXT;

CREATE TABLE IF NOT EXISTS document_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  document_id UUID REFERENCES documents ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES study_teams ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES study_teams ON DELETE CASCADE,
  document_id UUID REFERENCES documents ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, document_id)
);

CREATE TABLE IF NOT EXISTS team_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES study_teams ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
