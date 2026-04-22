# HUUM — MVP Architecture Document

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Web (Next.js)│  │  Mobile (PWA)│  │  Admin Panel │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCER (Cloud LB)                        │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   API Gateway    │ │  WebSocket Server│ │  Static/CDN      │
│   (NestJS)       │ │  (Socket.io)     │ │  (Next.js SSR)   │
│   Port 3001      │ │  Port 3002       │ │  Port 3000       │
└────────┬─────────┘ └────────┬─────────┘ └──────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                                 │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │  Auth   │ │  Posts  │ │  Feed    │ │Moderation│ │  Users    │  │
│  │ Module  │ │ Module  │ │ Module   │ │  Module  │ │  Module   │  │
│  └────┬────┘ └────┬────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
└───────┼───────────┼───────────┼─────────────┼─────────────┼────────┘
        │           │           │             │             │
        ▼           ▼           ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  PostgreSQL   │  │  Redis       │  │  S3 (Minio)  │              │
│  │  (Primary DB) │  │  (Cache/     │  │  (Media      │              │
│  │               │  │   Sessions)  │  │   Storage)   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### Service Breakdown

| Service | Responsibility | Tech |
|---------|---------------|------|
| **API Gateway** | REST API, auth middleware, rate limiting | NestJS |
| **WebSocket Server** | Real-time notifications, live comments | Socket.io on NestJS |
| **Auth Module** | JWT issuance, OAuth flows, session mgmt | Passport.js + JWT |
| **Posts Module** | CRUD for posts, media upload orchestration | NestJS + Multer |
| **Feed Module** | Feed generation, ranking, perspective mixing | NestJS + Redis cache |
| **Moderation Module** | Reports, community votes, mod actions | NestJS |
| **Users Module** | Profiles, follows, belief tags | NestJS |

### Data Flow: Creating a Post

```
User → Next.js Form → POST /api/posts → Auth Middleware (JWT verify)
  → Posts Service → Upload media to S3 → Save post to PostgreSQL
  → Invalidate feed cache in Redis → WebSocket broadcast to followers
  → Return post object to client
```

---

## 2. Database Schema

### Entity Relationship Diagram

```
users ──────────< posts
  │                 │
  │                 ├────< comments
  │                 │        │
  │                 ├────< post_likes
  │                 │
  │                 ├────< reposts
  │                 │
  │                 └────< reports ────> moderation_actions
  │
  ├────< user_belief_tags
  │
  ├────< follows (self-referential)
  │
  └────< community_votes
```

### Tables

#### users
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    username        VARCHAR(50) UNIQUE NOT NULL,
    display_name    VARCHAR(100),
    password_hash   VARCHAR(255),          -- null for OAuth-only users
    bio             TEXT,
    avatar_url      VARCHAR(500),
    oauth_provider  VARCHAR(20),           -- 'google', 'apple', null
    oauth_id        VARCHAR(255),
    role            VARCHAR(20) DEFAULT 'user',  -- 'user', 'moderator', 'admin'
    is_verified     BOOLEAN DEFAULT false,
    is_suspended    BOOLEAN DEFAULT false,
    suspension_reason TEXT,
    suspended_until TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

#### user_belief_tags
```sql
CREATE TABLE belief_tags (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(50) UNIQUE NOT NULL,   -- 'tech', 'politics', 'philosophy', etc.
    slug    VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE user_belief_tags (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tag_id  INT REFERENCES belief_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tag_id)
);
```

#### follows
```sql
CREATE TABLE follows (
    follower_id  UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_following ON follows(following_id);
```

#### posts
```sql
CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    media_urls      TEXT[],                -- array of S3 URLs
    media_type      VARCHAR(20),           -- 'image', 'video', null
    parent_post_id  UUID REFERENCES posts(id) ON DELETE SET NULL,  -- for threads
    repost_of_id    UUID REFERENCES posts(id) ON DELETE SET NULL,
    like_count      INT DEFAULT 0,
    comment_count   INT DEFAULT 0,
    repost_count    INT DEFAULT 0,
    visibility      VARCHAR(20) DEFAULT 'public',  -- 'public', 'reduced', 'hidden'
    is_deleted      BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_parent ON posts(parent_post_id);
```

#### post_tags
```sql
CREATE TABLE post_tags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    tag_id  INT REFERENCES belief_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);
```

#### likes
```sql
CREATE TABLE likes (
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);
```

#### comments
```sql
CREATE TABLE comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
    content         TEXT NOT NULL,
    like_count      INT DEFAULT 0,
    depth           INT DEFAULT 0,
    is_deleted      BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
```

#### reports
```sql
CREATE TYPE report_category AS ENUM (
    'hate_speech', 'misinformation', 'harassment',
    'spam', 'violence', 'illegal_content', 'other'
);

CREATE TYPE report_status AS ENUM (
    'pending', 'under_review', 'community_vote',
    'resolved_no_action', 'resolved_warning',
    'resolved_reduced', 'resolved_suspended', 'resolved_banned'
);

CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    reported_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category        report_category NOT NULL,
    description     TEXT,
    status          report_status DEFAULT 'pending',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_post ON reports(reported_post_id);
```

#### community_votes
```sql
CREATE TABLE community_votes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id   UUID REFERENCES reports(id) ON DELETE CASCADE,
    voter_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    vote        VARCHAR(20) NOT NULL,  -- 'violates', 'no_violation', 'unsure'
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (report_id, voter_id)
);
```

#### moderation_actions
```sql
CREATE TYPE action_type AS ENUM (
    'warning', 'visibility_reduction', 'temporary_suspension',
    'permanent_ban', 'content_removal', 'no_action', 'appeal_granted'
);

CREATE TABLE moderation_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id       UUID REFERENCES reports(id),
    moderator_id    UUID REFERENCES users(id),       -- null = system/automated
    target_user_id  UUID REFERENCES users(id),
    target_post_id  UUID REFERENCES posts(id),
    action          action_type NOT NULL,
    reason          TEXT NOT NULL,
    is_public       BOOLEAN DEFAULT true,             -- visible in mod logs
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mod_actions_target_user ON moderation_actions(target_user_id);
```

#### user_preferences
```sql
CREATE TABLE user_preferences (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    perspective_slider  FLOAT DEFAULT 0.3,  -- 0.0 = only followed, 1.0 = max diversity
    show_sensitive      BOOLEAN DEFAULT false,
    notification_emails BOOLEAN DEFAULT true,
    theme               VARCHAR(10) DEFAULT 'system'
);
```

---

## 3. API Design

### Authentication

```
POST   /api/auth/register          Register with email/password
POST   /api/auth/login             Login, returns JWT
POST   /api/auth/refresh           Refresh JWT token
GET    /api/auth/google             Google OAuth redirect
GET    /api/auth/google/callback    Google OAuth callback
GET    /api/auth/apple              Apple OAuth redirect
GET    /api/auth/apple/callback     Apple OAuth callback
POST   /api/auth/logout             Invalidate refresh token
```

**Example: Register**
```json
// POST /api/auth/register
// Request
{
  "email": "user@example.com",
  "username": "newuser",
  "password": "SecurePass123!",
  "displayName": "New User"
}

// Response 201
{
  "user": { "id": "uuid", "username": "newuser", "email": "user@example.com" },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

### Users

```
GET    /api/users/:username         Get user profile
PATCH  /api/users/me                Update own profile
GET    /api/users/:username/posts   Get user's posts
POST   /api/users/:username/follow  Follow a user
DELETE /api/users/:username/follow  Unfollow a user
GET    /api/users/:username/followers   Get followers
GET    /api/users/:username/following   Get following
PATCH  /api/users/me/preferences    Update preferences (incl. perspective slider)
PUT    /api/users/me/belief-tags    Set belief tags
```

**Example: Get Profile**
```json
// GET /api/users/janedoe
// Response 200
{
  "id": "uuid",
  "username": "janedoe",
  "displayName": "Jane Doe",
  "bio": "Thinking about the future.",
  "avatarUrl": "https://cdn.huum.app/avatars/uuid.jpg",
  "beliefTags": ["tech", "philosophy", "environment"],
  "followerCount": 1234,
  "followingCount": 567,
  "isFollowing": false,
  "createdAt": "2026-01-15T00:00:00Z"
}
```

### Posts

```
POST   /api/posts                   Create a post
GET    /api/posts/:id               Get a single post
DELETE /api/posts/:id               Delete own post
POST   /api/posts/:id/like          Like a post
DELETE /api/posts/:id/like          Unlike a post
POST   /api/posts/:id/repost        Repost
GET    /api/posts/:id/thread        Get full thread (parent + replies)
```

**Example: Create Post**
```json
// POST /api/posts
// Headers: Authorization: Bearer <token>
// Content-Type: multipart/form-data
{
  "content": "Just had an interesting thought about free speech online...",
  "tags": ["politics", "tech"],
  "media": [<file>],             // optional
  "parentPostId": null            // set for threaded replies
}

// Response 201
{
  "id": "uuid",
  "content": "Just had an interesting thought about free speech online...",
  "author": { "id": "uuid", "username": "janedoe", "avatarUrl": "..." },
  "tags": ["politics", "tech"],
  "mediaUrls": ["https://cdn.huum.app/media/uuid.jpg"],
  "likeCount": 0,
  "commentCount": 0,
  "repostCount": 0,
  "createdAt": "2026-04-11T12:00:00Z"
}
```

### Comments

```
POST   /api/posts/:id/comments          Add comment
GET    /api/posts/:id/comments           Get comments (paginated, threaded)
DELETE /api/comments/:id                 Delete own comment
POST   /api/comments/:id/like            Like a comment
```

### Feed

```
GET    /api/feed                    Get personalized feed (paginated)
GET    /api/feed/trending           Get trending posts
GET    /api/feed/explore            Explore/discover feed
```

**Query params for /api/feed:**
```
?cursor=<timestamp>&limit=20&perspectiveLevel=0.3
```

### Moderation

```
POST   /api/reports                      Report a post or user
GET    /api/moderation/queue             Get pending reports (moderators)
GET    /api/moderation/vote/:reportId    Get report for community voting
POST   /api/moderation/vote/:reportId    Cast community vote
POST   /api/moderation/action            Take moderation action (admin/mod)
GET    /api/moderation/log               Public moderation log (paginated)
GET    /api/moderation/log/:userId       Moderation history for a user
```

**Example: Report**
```json
// POST /api/reports
{
  "reportedPostId": "uuid",
  "category": "misinformation",
  "description": "This post contains verifiably false health claims."
}

// Response 201
{ "id": "uuid", "status": "pending", "message": "Report submitted. Thank you." }
```

---

## 4. Frontend Structure

### Pages

```
/                       → Landing / marketing page (unauthenticated)
/feed                   → Main feed (authenticated)
/explore                → Explore / trending
/post/[id]              → Single post + thread view
/create                 → Create post
/profile/[username]     → User profile
/settings               → User settings + perspective slider
/moderation             → Moderation dashboard (mod/admin)
/moderation/log         → Public moderation log
/auth/login             → Login
/auth/register          → Register
```

### Component Hierarchy

```
app/
├── layout.tsx                    # Root layout (nav, theme provider)
├── page.tsx                      # Landing page
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (main)/                       # Authenticated layout group
│   ├── layout.tsx                # Sidebar nav, auth guard
│   ├── feed/page.tsx
│   ├── explore/page.tsx
│   ├── create/page.tsx
│   ├── post/[id]/page.tsx
│   ├── profile/[username]/page.tsx
│   ├── settings/page.tsx
│   └── moderation/
│       ├── page.tsx              # Mod dashboard
│       └── log/page.tsx          # Public log
components/
├── ui/                           # Reusable primitives
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Avatar.tsx
│   ├── Modal.tsx
│   ├── Slider.tsx
│   └── Badge.tsx
├── layout/
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── MobileNav.tsx
│   └── AuthGuard.tsx
├── feed/
│   ├── FeedList.tsx              # Infinite scroll feed
│   ├── PostCard.tsx              # Single post in feed
│   ├── PerspectiveSlider.tsx     # The slider control
│   └── TrendingSidebar.tsx
├── post/
│   ├── PostDetail.tsx
│   ├── ThreadView.tsx
│   ├── CommentTree.tsx           # Recursive threaded comments
│   ├── CommentInput.tsx
│   └── CreatePostForm.tsx
├── profile/
│   ├── ProfileHeader.tsx
│   ├── ProfileTabs.tsx
│   ├── BeliefTagSelector.tsx
│   └── FollowButton.tsx
└── moderation/
    ├── ReportButton.tsx
    ├── ReportModal.tsx
    ├── ModerationQueue.tsx
    ├── CommunityVoteCard.tsx
    └── ModerationLogEntry.tsx
```

---

## 5. Feed Algorithm Logic

### Ranking Formula

```python
# Pseudocode for feed generation

def generate_feed(user, cursor, limit=20, perspective_level=0.3):
    """
    perspective_level: 0.0 = only followed users, 1.0 = maximum diversity
    """

    # Step 1: Determine feed composition ratios
    followed_ratio  = 1.0 - (perspective_level * 0.7)   # e.g., 0.3 → 79%
    diverse_ratio   = perspective_level * 0.5             # e.g., 0.3 → 15%
    trending_ratio  = perspective_level * 0.2 + 0.06      # e.g., 0.3 → 12%
    # Ratios always sum to ~1.0 with minor rounding

    followed_count = round(limit * followed_ratio)   # ~16 posts
    diverse_count  = round(limit * diverse_ratio)     # ~3 posts
    trending_count = limit - followed_count - diverse_count  # ~1 post

    # Step 2: Fetch followed users' posts
    followed_posts = db.query("""
        SELECT p.* FROM posts p
        JOIN follows f ON f.following_id = p.author_id
        WHERE f.follower_id = :user_id
          AND p.visibility = 'public'
          AND p.created_at < :cursor
        ORDER BY score(p) DESC
        LIMIT :count
    """, user_id=user.id, cursor=cursor, count=followed_count)

    # Step 3: Fetch diverse viewpoint posts
    user_tags = get_user_tags(user.id)       # e.g., ['tech', 'philosophy']
    diverse_posts = db.query("""
        SELECT p.* FROM posts p
        JOIN post_tags pt ON pt.post_id = p.id
        JOIN belief_tags bt ON bt.id = pt.tag_id
        WHERE bt.slug NOT IN :user_tags       -- different topics
          AND p.author_id NOT IN (             -- not already followed
              SELECT following_id FROM follows WHERE follower_id = :user_id
          )
          AND p.visibility = 'public'
          AND p.created_at > NOW() - INTERVAL '48 hours'
        ORDER BY engagement_score(p) DESC
        LIMIT :count
    """, user_tags=user_tags, user_id=user.id, count=diverse_count)

    # Step 4: Fetch trending posts
    trending_posts = db.query("""
        SELECT p.* FROM posts p
        WHERE p.created_at > NOW() - INTERVAL '24 hours'
          AND p.visibility = 'public'
        ORDER BY trending_score(p) DESC
        LIMIT :count
    """, count=trending_count)

    # Step 5: Interleave and deduplicate
    feed = interleave(followed_posts, diverse_posts, trending_posts)
    feed = deduplicate(feed)

    return feed


def score(post):
    """Base relevance score for a post"""
    age_hours = hours_since(post.created_at)
    recency = max(0, 1.0 - (age_hours / 72))        # decay over 72h

    engagement = (
        post.like_count * 1.0 +
        post.comment_count * 2.0 +                   # comments valued higher
        post.repost_count * 1.5
    )
    engagement_norm = log(1 + engagement)

    return (recency * 0.4) + (engagement_norm * 0.6)


def trending_score(post):
    """Velocity-based trending score"""
    age_hours = max(1, hours_since(post.created_at))
    recent_engagement = get_engagement_last_hours(post.id, hours=6)
    return recent_engagement / age_hours


def interleave(followed, diverse, trending):
    """
    Place diverse/trending posts at regular intervals.
    Every 5th post is diverse, every 10th is trending.
    Rest are from followed users.
    """
    result = []
    f_idx, d_idx, t_idx = 0, 0, 0

    for i in range(len(followed) + len(diverse) + len(trending)):
        if i % 10 == 9 and t_idx < len(trending):
            result.append(trending[t_idx])
            t_idx += 1
        elif i % 5 == 4 and d_idx < len(diverse):
            result.append(diverse[d_idx])
            d_idx += 1
        elif f_idx < len(followed):
            result.append(followed[f_idx])
            f_idx += 1

    return result
```

### How Diversity Is Injected

1. **Tag-based opposites**: Posts tagged with topics the user does NOT follow
2. **Author diversity**: Exclude users already followed → surface new voices
3. **Engagement quality filter**: Diverse posts must have high comment-to-like ratio (indicates discussion, not just agreement)
4. **Recency bias for diverse**: Only last 48 hours → keeps diverse content fresh and relevant

### How User Preferences Affect Feed

| Perspective Slider | Followed % | Diverse % | Trending % |
|-------------------|-----------|----------|-----------|
| 0.0 (echo chamber)| 100%      | 0%       | 6%        |
| 0.3 (default)     | 79%       | 15%      | 12%       |
| 0.5 (balanced)    | 65%       | 25%      | 16%       |
| 0.8 (explorer)    | 44%       | 40%      | 22%       |
| 1.0 (max diverse) | 30%       | 50%      | 26%       |

---

## 6. Moderation System Design

### Reporting Workflow

```
User clicks "Report" on post/user
        │
        ▼
User selects category + optional description
        │
        ▼
Report created (status: "pending")
        │
        ▼
  ┌─────┴──────────────────────┐
  │  Automated check:          │
  │  • Duplicate report?       │
  │  • User has prior strikes? │
  │  • Keyword/pattern match?  │
  └─────┬──────────────────────┘
        │
   ┌────┴────┐
   │ Auto-    │ Yes → Fast-track to moderator review
   │ flagged? │
   │          │ No  → Add to community vote queue (if 3+ reports)
   └──────────┘
        │
        ▼
  Community Vote Phase (24-48 hours)
  • 10 random eligible voters selected
  • Voters see post + report reason (reporter anonymous)
  • Vote: "violates" / "no violation" / "unsure"
        │
        ▼
  ┌─────┴──────────┐
  │  >= 70% say     │ Yes → Auto-apply warning or visibility reduction
  │  "violates"?    │       Flag for moderator confirmation
  │                 │ No  → Close report, no action
  └─────────────────┘
        │
        ▼
  Moderator Review (final)
  • Can override community vote
  • Applies enforcement tier
  • Action logged publicly
```

### Community Voting Mechanics

- **Eligibility**: Account age > 30 days, no active suspensions, > 50 posts
- **Selection**: 10 random eligible voters per report (not the reporter, not the reported)
- **Anonymity**: Voters don't see reporter identity; reported user sees only the action, not individual votes
- **Incentive**: Voters who consistently align with final moderation decisions earn "Trusted Voter" status (faster queue access)
- **Anti-gaming**: Same user can't be selected for multiple reports on same content

### Enforcement Tiers

| Tier | Action | Trigger | Duration | Visibility |
|------|--------|---------|----------|------------|
| 1 | Warning | First violation | N/A | Private to user |
| 2 | Visibility Reduction | 2nd violation or community vote | 7 days | Post shown to fewer users |
| 3 | Temporary Suspension | 3rd violation or severe content | 7-30 days | Account frozen |
| 4 | Permanent Ban | Repeated severe violations, illegal content | Permanent | Account removed |

### What Is Allowed vs Not Allowed

**Allowed:**
- Strong opinions on any topic
- Satire and humor
- Criticism of public figures, policies, ideas
- Adult language (with content warning)
- Controversial but legal speech

**Not Allowed:**
- Direct threats of violence
- Doxxing (sharing private personal info)
- Child exploitation content (zero tolerance, immediate ban + report to authorities)
- Coordinated harassment campaigns
- Spam and bot manipulation
- Impersonation of real people
- Verifiably false health/safety misinformation that poses imminent danger

### Abuse Prevention

1. **Rate limiting**: Max 3 reports per user per hour
2. **False report tracking**: Users who file >5 rejected reports in 30 days get a warning
3. **Brigading detection**: Multiple reports from accounts that follow each other → flag for manual review
4. **Appeal system**: Every moderation action can be appealed once within 14 days

---

## 7. MVP Build Plan

### Phase 1: Foundation (Week 1-2)
- [x] Project scaffolding (NestJS + Next.js + PostgreSQL)
- [ ] Database schema + migrations
- [ ] Auth module (email/password + JWT)
- [ ] User registration + login pages
- [ ] Basic user profile CRUD

### Phase 2: Core Content (Week 3-4)
- [ ] Posts CRUD (text only first)
- [ ] Media upload to S3
- [ ] Basic feed (chronological, followed users only)
- [ ] Post detail + thread view
- [ ] Like, comment, repost

### Phase 3: Smart Feed + Discovery (Week 5-6)
- [ ] Feed algorithm with perspective slider
- [ ] Trending calculation
- [ ] Explore page
- [ ] Belief tags system
- [ ] OAuth (Google)

### Phase 4: Moderation + Polish (Week 7-8)
- [ ] Reporting system
- [ ] Community voting
- [ ] Moderation dashboard
- [ ] Public moderation log
- [ ] WebSocket notifications
- [ ] Mobile responsiveness
- [ ] Deploy to production

### Priority Order (if time is short)
1. Auth + Users (can't do anything without it)
2. Posts + Comments (core value prop)
3. Basic Feed (users need to see content)
4. Moderation/Reporting (safety requirement)
5. Smart Feed Algorithm (differentiator)
6. Community Voting (nice to have for MVP)
7. OAuth (convenience, not critical)
8. WebSocket notifications (polish)

---

## 8. Deployment Strategy

### Cloud Architecture (GCP)

```
┌─────────────────────────────────────────────────┐
│                  GCP Project                      │
│                                                   │
│  ┌─────────────────┐    ┌─────────────────────┐  │
│  │  Cloud Run       │    │  Cloud SQL          │  │
│  │  (API + Next.js) │───▶│  (PostgreSQL 15)    │  │
│  │  Min: 0, Max: 5  │    │  db-f1-micro        │  │
│  └────────┬────────┘    └─────────────────────┘  │
│           │                                       │
│  ┌────────┴────────┐    ┌─────────────────────┐  │
│  │  Cloud CDN       │    │  Memorystore        │  │
│  │  (static assets) │    │  (Redis, 1GB)       │  │
│  └─────────────────┘    └─────────────────────┘  │
│                                                   │
│  ┌─────────────────┐    ┌─────────────────────┐  │
│  │  Cloud Storage   │    │  Cloud Build         │  │
│  │  (media uploads) │    │  (CI/CD)            │  │
│  └─────────────────┘    └─────────────────────┘  │
│                                                   │
│  ┌─────────────────┐                              │
│  │  Cloud Armor     │ ← Rate limiting + WAF       │
│  └─────────────────┘                              │
└─────────────────────────────────────────────────┘
```

### Estimated Monthly Cost (MVP, Low Traffic)

| Service | Spec | Est. Cost |
|---------|------|-----------|
| Cloud Run | 0-5 instances, 1 vCPU/512MB | $5-30 |
| Cloud SQL | db-f1-micro, 10GB | $8 |
| Memorystore | Basic, 1GB | $35 |
| Cloud Storage | 10GB media | $0.50 |
| Cloud CDN | Light traffic | $1-5 |
| **Total** | | **~$50-80/mo** |

### Scaling Considerations

- **Phase 1 (0-1K users)**: Single Cloud Run instance, no Redis needed (use in-memory cache)
- **Phase 2 (1K-10K users)**: Add Redis, scale Cloud Run to 2-3 instances, upgrade DB
- **Phase 3 (10K-100K users)**: Read replicas for DB, dedicated WebSocket service, CDN for all media
- **Phase 4 (100K+)**: Consider Kubernetes (GKE), message queue for feed generation, search service (Elasticsearch)

### Cost-Saving Tips
- Use Cloud Run (scale to zero when no traffic)
- Skip Redis until you actually need it (use NestJS CacheModule with in-memory)
- Use Cloud Storage lifecycle rules to move old media to cheaper tiers
- Compress images on upload (sharp library)

---

## Bonus

### Monetization Strategies (Non-Invasive)
1. **HUUM Pro** ($4.99/mo): Extended post length, custom profile themes, advanced analytics
2. **Creator Fund**: Revenue share from optional "tip" button on posts
3. **Promoted Discussions**: Brands can sponsor discussion topics (clearly labeled, community can downvote)
4. **API Access**: Paid tier for researchers/academics studying discourse patterns

### Viral Growth Loops
1. **"See the other side"**: Shareable cards showing how a topic looks from different perspectives
2. **Discussion threads embeddable** on other platforms (like tweet embeds)
3. **Weekly "Perspective Report"**: Email digest showing what viewpoints you engaged with
4. **Referral program**: Invite 3 friends → unlock custom belief tag badges

### Branding Notes
- "HUUM" evokes a hum of conversation, collective voice
- Tagline suggestions: "Every voice matters" / "Hear the whole room" / "Beyond the bubble"
- Color palette: Warm gradients (amber → coral) to feel human and inviting, not cold/corporate
