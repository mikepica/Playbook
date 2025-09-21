-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Timestamp update trigger helper
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Main SOP table
CREATE TABLE IF NOT EXISTS sops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL UNIQUE,
    version INTEGER NOT NULL DEFAULT 1,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER sops_set_updated_at
BEFORE UPDATE ON sops
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- SOP history table
CREATE TABLE IF NOT EXISTS sop_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sop_id UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL,
    content JSONB NOT NULL,
    edited_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sop_history_sop_id ON sop_history(sop_id);

CREATE TRIGGER sop_history_set_updated_at
BEFORE UPDATE ON sop_history
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Chat threads table
CREATE TABLE IF NOT EXISTS chat_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sop_id UUID REFERENCES sops(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'New Thread',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_sop_id ON chat_threads(sop_id);

CREATE TRIGGER chat_threads_set_updated_at
BEFORE UPDATE ON chat_threads
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);

CREATE TRIGGER chat_messages_set_updated_at
BEFORE UPDATE ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
