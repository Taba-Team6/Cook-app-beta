-- ============================================
-- COMMUNITY TABLES (Migration Step 007)
-- 커뮤니티 리뷰 + 댓글 시스템
-- ============================================

-- =========================
-- 1️⃣ 커뮤니티 리뷰 테이블
-- =========================
CREATE TABLE community_reviews (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),

    user_id VARCHAR(36) NOT NULL,

    -- ✅ 이제 recipes가 아니라 completed_recipes 기준
    recipe_id VARCHAR(255) NOT NULL,
    recipe_name VARCHAR(255) NOT NULL,

    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review TEXT NOT NULL,
    image_url TEXT NULL,

    user_name VARCHAR(100) NOT NULL,
    user_initial CHAR(2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    -- ✅ 핵심 수정 포인트
    FOREIGN KEY (recipe_id) 
      REFERENCES completed_recipes(recipe_id)
      ON DELETE CASCADE,

    INDEX idx_recipe_id (recipe_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- =========================
-- 2️⃣ 커뮤니티 댓글 테이블
-- =========================
CREATE TABLE IF NOT EXISTS community_comments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),

    review_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,

    user_name VARCHAR(100) NOT NULL,
    user_initial CHAR(2) NOT NULL,

    text TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (review_id) REFERENCES community_reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_review_id (review_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
