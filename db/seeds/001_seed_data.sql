-- HUUM MVP: Seed data for development
-- Run with: psql $DATABASE_URL -f db/seeds/001_seed_data.sql

BEGIN;

-- ============================================================
-- Belief Tags
-- ============================================================
INSERT INTO belief_tags (name, slug) VALUES
    ('Technology', 'tech'),
    ('Politics', 'politics'),
    ('Philosophy', 'philosophy'),
    ('Science', 'science'),
    ('Environment', 'environment'),
    ('Economics', 'economics'),
    ('Culture', 'culture'),
    ('Education', 'education'),
    ('Health', 'health'),
    ('Media', 'media'),
    ('Sports', 'sports'),
    ('Art', 'art'),
    ('Music', 'music'),
    ('Food', 'food'),
    ('Travel', 'travel'),
    ('Gaming', 'gaming'),
    ('Business', 'business'),
    ('History', 'history'),
    ('Law', 'law'),
    ('Spirituality', 'spirituality')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Admin User (password: Admin123!)
-- bcrypt hash for 'Admin123!'
-- ============================================================
INSERT INTO users (id, email, username, display_name, password_hash, bio, role, is_verified)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@huum.app',
    'admin',
    'HUUM Admin',
    '$2b$10$EIXkPz3VTqLhGfVN5YWFG.Zd7LS3UJ8JvzJNDEz0WH/Z5cNvQUKe',
    'Platform administrator',
    'admin',
    true
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_preferences (user_id) VALUES ('a0000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- Demo Users (password for all: Demo1234!)
-- ============================================================
INSERT INTO users (id, email, username, display_name, password_hash, bio, role, is_verified)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'alice@example.com', 'alice_thinks',
     'Alice Chen', '$2b$10$EIXkPz3VTqLhGfVN5YWFG.Zd7LS3UJ8JvzJNDEz0WH/Z5cNvQUKe',
     'Software engineer. Thinks about AI ethics and open source.', 'user', true),
    ('b0000000-0000-0000-0000-000000000002', 'bob@example.com', 'bob_debates',
     'Bob Martinez', '$2b$10$EIXkPz3VTqLhGfVN5YWFG.Zd7LS3UJ8JvzJNDEz0WH/Z5cNvQUKe',
     'Political commentator. Believes in civil discourse from all sides.', 'user', true),
    ('b0000000-0000-0000-0000-000000000003', 'carol@example.com', 'carol_creates',
     'Carol Kim', '$2b$10$EIXkPz3VTqLhGfVN5YWFG.Zd7LS3UJ8JvzJNDEz0WH/Z5cNvQUKe',
     'Artist and philosopher. Exploring the intersection of creativity and thought.', 'user', true),
    ('b0000000-0000-0000-0000-000000000004', 'dave@example.com', 'dave_science',
     'Dave Okafor', '$2b$10$EIXkPz3VTqLhGfVN5YWFG.Zd7LS3UJ8JvzJNDEz0WH/Z5cNvQUKe',
     'Climate scientist. Data-driven perspectives on our planet.', 'moderator', true)
ON CONFLICT (email) DO NOTHING;

-- Preferences for demo users
INSERT INTO user_preferences (user_id, perspective_slider) VALUES
    ('b0000000-0000-0000-0000-000000000001', 0.3),
    ('b0000000-0000-0000-0000-000000000002', 0.7),
    ('b0000000-0000-0000-0000-000000000003', 0.5),
    ('b0000000-0000-0000-0000-000000000004', 0.4)
ON CONFLICT (user_id) DO NOTHING;

-- Belief tags for demo users
INSERT INTO user_belief_tags (user_id, tag_id) VALUES
    ('b0000000-0000-0000-0000-000000000001', (SELECT id FROM belief_tags WHERE slug = 'tech')),
    ('b0000000-0000-0000-0000-000000000001', (SELECT id FROM belief_tags WHERE slug = 'philosophy')),
    ('b0000000-0000-0000-0000-000000000002', (SELECT id FROM belief_tags WHERE slug = 'politics')),
    ('b0000000-0000-0000-0000-000000000002', (SELECT id FROM belief_tags WHERE slug = 'economics')),
    ('b0000000-0000-0000-0000-000000000003', (SELECT id FROM belief_tags WHERE slug = 'art')),
    ('b0000000-0000-0000-0000-000000000003', (SELECT id FROM belief_tags WHERE slug = 'philosophy')),
    ('b0000000-0000-0000-0000-000000000004', (SELECT id FROM belief_tags WHERE slug = 'science')),
    ('b0000000-0000-0000-0000-000000000004', (SELECT id FROM belief_tags WHERE slug = 'environment'))
ON CONFLICT DO NOTHING;

-- ============================================================
-- Follows
-- ============================================================
INSERT INTO follows (follower_id, following_id) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002'),
    ('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003'),
    ('b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001'),
    ('b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004'),
    ('b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Demo Posts
-- ============================================================
INSERT INTO posts (id, author_id, content, visibility) VALUES
    ('c0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000001',
     'Just read an incredible paper on how LLMs are changing the way we think about creativity. Are we entering an era where AI and humans co-create? What does that mean for authorship?',
     'public'),
    ('c0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000002',
     'Unpopular opinion: the best policy ideas come from listening to people you disagree with. Echo chambers are killing nuance in political discourse.',
     'public'),
    ('c0000000-0000-0000-0000-000000000003',
     'b0000000-0000-0000-0000-000000000003',
     'There is something deeply human about creating art that machines cannot replicate — the intention, the struggle, the imperfection. That is where beauty lives.',
     'public'),
    ('c0000000-0000-0000-0000-000000000004',
     'b0000000-0000-0000-0000-000000000004',
     'New IPCC data shows we are tracking closer to the best-case scenario than five years ago. Renewable energy adoption is outpacing every model. There is reason for cautious optimism.',
     'public')
ON CONFLICT DO NOTHING;

-- Post tags
INSERT INTO post_tags (post_id, tag_id) VALUES
    ('c0000000-0000-0000-0000-000000000001', (SELECT id FROM belief_tags WHERE slug = 'tech')),
    ('c0000000-0000-0000-0000-000000000001', (SELECT id FROM belief_tags WHERE slug = 'philosophy')),
    ('c0000000-0000-0000-0000-000000000002', (SELECT id FROM belief_tags WHERE slug = 'politics')),
    ('c0000000-0000-0000-0000-000000000003', (SELECT id FROM belief_tags WHERE slug = 'art')),
    ('c0000000-0000-0000-0000-000000000003', (SELECT id FROM belief_tags WHERE slug = 'philosophy')),
    ('c0000000-0000-0000-0000-000000000004', (SELECT id FROM belief_tags WHERE slug = 'science')),
    ('c0000000-0000-0000-0000-000000000004', (SELECT id FROM belief_tags WHERE slug = 'environment'))
ON CONFLICT DO NOTHING;

-- ============================================================
-- Demo Comments (threaded)
-- ============================================================
INSERT INTO comments (id, post_id, author_id, content, depth) VALUES
    ('d0000000-0000-0000-0000-000000000001',
     'c0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000002',
     'Interesting take! But I think we need to separate "co-creation" from "automation". The former is exciting, the latter is concerning.',
     0),
    ('d0000000-0000-0000-0000-000000000002',
     'c0000000-0000-0000-0000-000000000001',
     'b0000000-0000-0000-0000-000000000001',
     'Great point. I see co-creation as the human directing intent while AI handles execution. The vision still comes from us.',
     1),
    ('d0000000-0000-0000-0000-000000000003',
     'c0000000-0000-0000-0000-000000000002',
     'b0000000-0000-0000-0000-000000000004',
     'Agreed 100%. In climate science, the best solutions come from people who combine economic pragmatism with environmental urgency.',
     0)
ON CONFLICT DO NOTHING;

-- Set parent for nested reply
UPDATE comments SET parent_comment_id = 'd0000000-0000-0000-0000-000000000001'
WHERE id = 'd0000000-0000-0000-0000-000000000002';

-- Update comment counts
UPDATE posts SET comment_count = 2 WHERE id = 'c0000000-0000-0000-0000-000000000001';
UPDATE posts SET comment_count = 1 WHERE id = 'c0000000-0000-0000-0000-000000000002';

-- ============================================================
-- Demo Likes
-- ============================================================
INSERT INTO likes (user_id, post_id) VALUES
    ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001'),
    ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001'),
    ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001'),
    ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002'),
    ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

UPDATE posts SET like_count = 3 WHERE id = 'c0000000-0000-0000-0000-000000000001';
UPDATE posts SET like_count = 1 WHERE id = 'c0000000-0000-0000-0000-000000000002';
UPDATE posts SET like_count = 1 WHERE id = 'c0000000-0000-0000-0000-000000000004';

COMMIT;
