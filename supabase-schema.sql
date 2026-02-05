-- Friendship Quiz Database Schema
-- Run this in your Supabase SQL Editor

-- Quiz Submissions Table
CREATE TABLE quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  instagram TEXT,
  answers JSONB NOT NULL,
  matched BOOLEAN DEFAULT false,
  match_id UUID,
  result_slug TEXT UNIQUE
);

-- Matches Table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  person_a_id UUID NOT NULL REFERENCES quiz_submissions(id),
  person_b_id UUID NOT NULL REFERENCES quiz_submissions(id),
  compatibility_score INTEGER NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  compatibility_title TEXT NOT NULL,
  published BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  CONSTRAINT different_people CHECK (person_a_id != person_b_id)
);

-- Add foreign key for match_id after matches table exists
ALTER TABLE quiz_submissions
ADD CONSTRAINT fk_match
FOREIGN KEY (match_id) REFERENCES matches(id);

-- Admin Emails Table (allowlist for admin access)
CREATE TABLE admin_emails (
  email TEXT PRIMARY KEY
);

-- Indexes for performance
CREATE INDEX idx_submissions_matched ON quiz_submissions(matched);
CREATE INDEX idx_submissions_email ON quiz_submissions(email);
CREATE INDEX idx_submissions_result_slug ON quiz_submissions(result_slug);
CREATE INDEX idx_matches_email_sent ON matches(email_sent);

-- Enable Row Level Security
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can insert a submission (public quiz)
CREATE POLICY "Anyone can submit quiz"
ON quiz_submissions FOR INSERT
WITH CHECK (true);

-- Anyone can read their own result via slug (for results page)
CREATE POLICY "Anyone can view by slug"
ON quiz_submissions FOR SELECT
USING (true);

-- Authenticated users who are admins can do everything
CREATE POLICY "Admins have full access to submissions"
ON quiz_submissions FOR ALL
USING (
  auth.role() = 'authenticated' AND
  auth.jwt() ->> 'email' IN (SELECT email FROM admin_emails)
);

CREATE POLICY "Admins have full access to matches"
ON matches FOR ALL
USING (
  auth.role() = 'authenticated' AND
  auth.jwt() ->> 'email' IN (SELECT email FROM admin_emails)
);

CREATE POLICY "Anyone can read matches for results"
ON matches FOR SELECT
USING (true);

CREATE POLICY "Admins can read admin_emails"
ON admin_emails FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  auth.jwt() ->> 'email' IN (SELECT email FROM admin_emails)
);

-- Insert your admin email(s) here
-- INSERT INTO admin_emails (email) VALUES ('your-email@example.com');
