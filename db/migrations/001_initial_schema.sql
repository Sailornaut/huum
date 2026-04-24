-- HUUM MVP: Initial database schema
-- Run with: psql $DATABASE_URL -f db/migrations/001_initial_schema.sql

BEGIN;

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE post_visibility AS ENUM ('public', 'reduced', 'hidden');
CREATE TYPE media_type AS ENUM ('image', 'video');
CREATE TYPE report_category AS ENUM (
    'hate_speech', 'misinformation', 'harassment',
    'spam', 'violence', 'illegal_content', 'other'
);
CREATE TYPE report_status AS ENUM (
    'pending', 'under_review', 'community_vote',
    'resolved_no_action', 'resolved_warning',
    'resolved_reduced', 'resolved_suspended', 'resolved_banned'
);
CREATE TYPE moderation_action_type AS ENUM (
    'warning', 'visibility_reduction', 'temporary_suspension',
    'permanent_ban', 'content_removal', 'no_action', 'appeal_granted'
);

-- ============================================================
-- Users
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    username        VARCHAR(50) UNIQUE NOT NULL,
    display_name    VARCHAR(100),
    password_hash   VARCHAR(255),
    bio             TEXT,
    avatar_url      VARCHAR(500),
    banner_url      VARCHAR(500),
    profile_font    VARCHAR(20) DEFAULT 'sans',
    oauth_provider  VARCHAR(20),
    oauth_id        VARCHAR(255),
    role            user_role DEFAULT 'user',
    is_verified     BOOLEAN DEFAULT false,
    is_suspended    BOOLEAN DEFAULT false,
    suspension_reason TEXT,
    suspended_until TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);

-- ============================================================
-- Belief Tags
-- ============================================================
CREATE TABLE belief_tags (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(50) UNIQUE NOT NULL,
    slug    VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE user_belief_tags (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tag_id  INT REFERENCES belief_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tag_id)
);

-- ============================================================
-- User Preferences
-- ============================================================
CREATE TABLE user_preferences (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    perspective_slider  FLOAT DEFAULT 0.3 CHECK (perspective_slider >= 0 AND perspective_slider <= 1),
    show_sensitive      BOOLEAN DEFAULT false,
    notification_emails BOOLEAN DEFAULT true,
    theme               VARCHAR(10) DEFAULT 'system'
);

-- ============================================================
-- Follows
-- ============================================================
CREATE TABLE follows (
    follower_id  UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);

-- ============================================================
-- Posts
-- ============================================================
CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL CHECK (char_length(content) <= 2000),
    media_urls      TEXT[],
    media_type      media_type,
    parent_post_id  UUID REFERENCES posts(id) ON DELETE SET NULL,
    repost_of_id    UUID REFERENCES posts(id) ON DELETE SET NULL,
    like_count      INT DEFAULT 0,
    comment_count   INT DEFAULT 0,
    repost_count    INT DEFAULT 0,
    visibility      post_visibility DEFAULT 'public',
    is_deleted      BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_parent ON posts(parent_post_id);
CREATE INDEX idx_posts_visibility_created ON posts(visibility, created_at DESC);

-- ============================================================
-- Post Tags
-- ============================================================
CREATE TABLE post_tags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    tag_id  INT REFERENCES belief_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- ============================================================
-- Likes
-- ============================================================
CREATE TABLE likes (
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_likes_post ON likes(post_id);

-- ============================================================
-- Comments
-- ============================================================
CREATE TABLE comments (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
    content           TEXT NOT NULL CHECK (char_length(content) <= 1000),
    like_count        INT DEFAULT 0,
    depth             INT DEFAULT 0,
    is_deleted        BOOLEAN DEFAULT false,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);

-- ============================================================
-- Reports
-- ============================================================
CREATE TABLE reports (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    reported_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category         report_category NOT NULL,
    description      TEXT,
    status           report_status DEFAULT 'pending',
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_post ON reports(reported_post_id);
CREATE INDEX idx_reports_created ON reports(created_at DESC);

-- ============================================================
-- Community Votes
-- ============================================================
CREATE TABLE community_votes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    voter_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote        VARCHAR(20) NOT NULL CHECK (vote IN ('violates', 'no_violation', 'unsure')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (report_id, voter_id)
);

-- ============================================================
-- Moderation Actions
-- ============================================================
CREATE TABLE moderation_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id       UUID REFERENCES reports(id),
    moderator_id    UUID REFERENCES users(id),
    target_user_id  UUID REFERENCES users(id),
    target_post_id  UUID REFERENCES posts(id),
    action          moderation_action_type NOT NULL,
    reason          TEXT NOT NULL,
    is_public       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mod_actions_target_user ON moderation_actions(target_user_id);
CREATE INDEX idx_mod_actions_created ON moderation_actions(created_at DESC);
CREATE INDEX idx_mod_actions_public ON moderation_actions(is_public, created_at DESC);

-- ============================================================
-- Updated-at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_posts_updated_at
    BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
