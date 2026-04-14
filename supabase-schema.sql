-- Run this script in your Supabase SQL Editor to create the necessary tables

CREATE TABLE IF NOT EXISTS alumni (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  batch TEXT,
  "group" TEXT,
  age TEXT,
  profession TEXT,
  address TEXT,
  gender TEXT,
  religion TEXT,
  tshirtSize TEXT,
  extraMember TEXT,
  paymentMethod TEXT,
  trxId TEXT,
  status TEXT,
  passwordResetRequest BOOLEAN DEFAULT FALSE,
  timestamp TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB
);

INSERT INTO settings (key, value) VALUES (
  'hero_images',
  '["https://picsum.photos/seed/collegecampus/1920/1080", "https://picsum.photos/seed/reunion2/1920/1080", "https://picsum.photos/seed/reunion3/1920/1080"]'
) ON CONFLICT (key) DO NOTHING;
