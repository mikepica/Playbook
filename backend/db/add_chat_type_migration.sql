-- Migration: Add chat_type field to chat_threads table
-- Date: 2025-09-29
-- Description: Adds chat_type field to distinguish between playbook and project chats

-- Add the chat_type column with default value 'playbook'
ALTER TABLE chat_threads
ADD COLUMN chat_type VARCHAR(20) NOT NULL DEFAULT 'playbook';

-- Add a check constraint to ensure only valid chat types
ALTER TABLE chat_threads
ADD CONSTRAINT chat_threads_chat_type_check
CHECK (chat_type IN ('playbook', 'project'));

-- Update any existing threads to be 'playbook' type (this is redundant due to default but explicit)
UPDATE chat_threads SET chat_type = 'playbook' WHERE chat_type IS NULL OR chat_type = '';