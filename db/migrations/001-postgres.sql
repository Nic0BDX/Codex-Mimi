CREATE SCHEMA IF NOT EXISTS mimi_nini;
CREATE TABLE IF NOT EXISTS mimi_nini.profiles (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, avatar TEXT NOT NULL,
  expression TEXT NOT NULL DEFAULT 'joie', pin_hash TEXT, salt TEXT,
  failures INTEGER NOT NULL DEFAULT 0, locked_until BIGINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS mimi_nini.sessions (
  token TEXT PRIMARY KEY, profile_id TEXT NOT NULL, expires BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS mimi_nini.rooms (
  id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, host TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby', players TEXT NOT NULL, state TEXT,
  version INTEGER NOT NULL DEFAULT 0, capacity INTEGER NOT NULL DEFAULT 2,
  round_limit INTEGER NOT NULL DEFAULT 40, updated BIGINT NOT NULL,
  created BIGINT NOT NULL, winner TEXT
);
CREATE TABLE IF NOT EXISTS mimi_nini.messages (
  id TEXT PRIMARY KEY, room TEXT NOT NULL, profile TEXT NOT NULL,
  body TEXT NOT NULL, created BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS mimi_nini.invitations (
  id TEXT PRIMARY KEY, recipient TEXT NOT NULL, room TEXT NOT NULL, created BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON mimi_nini.sessions (expires);
CREATE INDEX IF NOT EXISTS rooms_host_status ON mimi_nini.rooms (host,status);
CREATE INDEX IF NOT EXISTS messages_room_created ON mimi_nini.messages (room,created);
CREATE INDEX IF NOT EXISTS invitations_recipient ON mimi_nini.invitations (recipient,room);
ALTER TABLE mimi_nini.rooms ADD COLUMN IF NOT EXISTS game_id TEXT NOT NULL DEFAULT 'meganopoly';
