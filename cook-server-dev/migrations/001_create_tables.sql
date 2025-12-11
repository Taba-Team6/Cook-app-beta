-- ============================================
-- 최종 통합 마이그레이션 SQL 파일
-- 기존 테이블, 신규 커뮤니티 기능, AI 기능, 그리고 더미 데이터를 모두 포함합니다.
-- ============================================

-- ============================================
-- 1. CLEANUP (Disbanded Tables & Views & Dependent Tables)
-- ============================================

-- 순서: 댓글 -> 리뷰 -> 완료 레시피 (의존성 역순으로 삭제)
DROP TABLE IF EXISTS community_comments;
DROP TABLE IF EXISTS community_reviews;

-- 완료 레시피 테이블 정리 (006) - gpt_temp_recipes, community_reviews가 참조할 가능성 있음
DROP TABLE IF EXISTS completed_recipes;

-- 이전 레시피 라이트 테이블 정리 (005)
DROP TABLE IF EXISTS recipes_light;

-- ============================================
-- 2. CORE TABLES CREATION
-- ============================================

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    allergies JSON DEFAULT NULL,
    preferences JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 식재료 테이블
CREATE TABLE IF NOT EXISTS ingredients (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    storage VARCHAR(20) DEFAULT 'room',
    quantity VARCHAR(50),
    unit VARCHAR(20),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_storage (storage),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 레시피 (원본/영구 저장소) 테이블 - completed_count, average_rating 추가 유지
CREATE TABLE IF NOT EXISTS recipes (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NULL,
    cooking_method VARCHAR(50) NULL,
    
    image_small VARCHAR(500) NULL, image_large VARCHAR(500) NULL,
    
    info_weight VARCHAR(50) NULL, info_energy VARCHAR(50) NULL, info_carb VARCHAR(50) NULL,
    info_protein VARCHAR(50) NULL, info_fat VARCHAR(50) NULL, info_sodium VARCHAR(50) NULL,
    
    ingredients_details TEXT NULL, hashtags TEXT NULL, sodium_tip TEXT NULL,
    
    manual_01 TEXT NULL, manual_02 TEXT NULL, manual_03 TEXT NULL, manual_04 TEXT NULL, manual_05 TEXT NULL,
    manual_06 TEXT NULL, manual_07 TEXT NULL, manual_08 TEXT NULL, manual_09 TEXT NULL, manual_10 TEXT NULL,
    manual_11 TEXT NULL, manual_12 TEXT NULL, manual_13 TEXT NULL, manual_14 TEXT NULL, manual_15 TEXT NULL,
    manual_16 TEXT NULL, manual_17 TEXT NULL, manual_18 TEXT NULL, manual_19 TEXT NULL, manual_20 TEXT NULL,

    -- 합친 파일에서 추가된 컬럼 유지
    completed_count INT DEFAULT 0,
    average_rating DECIMAL(2, 1) DEFAULT 0.0,

    ingredients_count INT DEFAULT 0, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_cooking_method (cooking_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 저장된 레시피 테이블
CREATE TABLE IF NOT EXISTS saved_recipes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), -- 기존 코드의 ID 기본값 추가
    user_id VARCHAR(36) NOT NULL,
    recipe_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL, category VARCHAR(50) NOT NULL, difficulty VARCHAR(20),
    cooking_time VARCHAR(50), image VARCHAR(500), description TEXT,
    ingredients JSON, steps JSON,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_recipe (user_id, recipe_id),
    INDEX idx_user_id (user_id), INDEX idx_category (category), INDEX idx_saved_at (saved_at), INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 요리 이력 테이블
CREATE TABLE IF NOT EXISTS cooking_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    recipe_id VARCHAR(100) NOT NULL,
    recipe_name VARCHAR(255) NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, rating INT CHECK (rating BETWEEN 1 AND 5), notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id), INDEX idx_completed_at (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 요리 세션 테이블
CREATE TABLE IF NOT EXISTS cooking_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    recipe_id VARCHAR(100) NOT NULL,
    recipe_name VARCHAR(255) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, finished_at TIMESTAMP,
    total_time INT, current_step INT DEFAULT 1,
    rating INT CHECK (rating BETWEEN 1 AND 5), memo TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id), INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 크롤링 이력 테이블 (005)
CREATE TABLE IF NOT EXISTS recipe_crawl_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_inserted INT NOT NULL, total_skipped INT NOT NULL, total_processed INT NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 커뮤니티 완성 레시피 테이블 (006)
CREATE TABLE IF NOT EXISTS completed_recipes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id CHAR(36) NOT NULL,
    recipe_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    image TEXT NULL,
    description TEXT NULL,
    category VARCHAR(100) NULL,
    cooking_method VARCHAR(100) NULL,
    hashtags TEXT NULL,
    ingredients_json JSON NULL,
    steps_json JSON NULL,
    cooking_time VARCHAR(50) NULL,
    servings VARCHAR(50) NULL,
    difficulty VARCHAR(50) NULL,
    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_completed_user (user_id),
    KEY idx_completed_recipe (recipe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 3. AI FEATURE TABLES (New: gpt_temp_recipes)
-- ============================================

-- GPT 생성 임시 레시피 테이블
CREATE TABLE IF NOT EXISTS gpt_temp_recipes (
    id INT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    cooking_method VARCHAR(50),
    image_small VARCHAR(500),
    image_large VARCHAR(500),
    
    info_weight VARCHAR(50), info_energy VARCHAR(50), info_carb VARCHAR(50),
    info_protein VARCHAR(50), info_fat VARCHAR(50), info_sodium VARCHAR(50),
    
    ingredients_details TEXT,
    hashtags TEXT,
    sodium_tip TEXT,
    ingredients_count INT,

    completed_count INT DEFAULT 0,
    average_rating DECIMAL(2, 1) DEFAULT 0.0,
    
    manual_01 TEXT, manual_02 TEXT, manual_03 TEXT, manual_04 TEXT, manual_05 TEXT,
    manual_06 TEXT, manual_07 TEXT, manual_08 TEXT, manual_09 TEXT, manual_10 TEXT,
    manual_11 TEXT, manual_12 TEXT, manual_13 TEXT, manual_14 TEXT, manual_15 TEXT,
    manual_16 TEXT, manual_17 TEXT, manual_18 TEXT, manual_19 TEXT, manual_20 TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_gpt_recipes_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 4. COMMUNITY TABLES (New: community_reviews, community_comments)
-- ============================================

-- 커뮤니티 리뷰 테이블
CREATE TABLE IF NOT EXISTS community_reviews (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    recipe_id VARCHAR(255) NOT NULL,
    recipe_name VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review TEXT NOT NULL,
    image_url TEXT NULL,
    user_name VARCHAR(100) NOT NULL,
    user_initial CHAR(2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- completed_recipes의 recipe_id를 참조 (참조 키가 기본 키가 아님)
    FOREIGN KEY (recipe_id) REFERENCES completed_recipes(recipe_id) ON DELETE CASCADE,

    INDEX idx_recipe_id (recipe_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 커뮤니티 댓글 테이블
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


-- ============================================
-- 5. VIEWS (From 003)
-- ============================================

-- 사용자 통계 뷰
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(DISTINCT i.id) as total_ingredients,
    COUNT(DISTINCT sr.id) as total_saved_recipes,
    COUNT(DISTINCT ch.id) as total_completed_recipes
FROM users u
LEFT JOIN ingredients i ON u.id = i.user_id
LEFT JOIN saved_recipes sr ON u.id = sr.user_id
LEFT JOIN cooking_history ch ON u.id = ch.user_id
GROUP BY u.id, u.name, u.email;


-- ============================================
-- 6. INITIAL DATA AND UPDATES (Sample Data & Normalization)
-- ============================================

-- [DUMMY USER ACCOUNT]
SET @DUMMY_USER_ID = UUID();
SET @DUMMY_RECIPE_ID_1 = 'R001'; -- 더미 레시피 1 ID
SET @DUMMY_RECIPE_ID_2 = 'R002'; -- 더미 레시피 2 ID
SET @DUMMY_REVIEW_ID = UUID();

-- 샘플 리뷰를 위한 레시피 ID 정의
SET @RECIPE_ID_PORK_RIBS = 'pork_ribs_stirfry';
SET @RECIPE_ID_HAMBURG = 'hamburg_ball_rice';
SET @RECIPE_ID_BUTTER_ROLL = 'three_color_butter_roll';
SET @RECIPE_ID_BULGOGI = 'mushroom_soybean_bulgogi';
SET @RECIPE_ID_SOUP = 'brisket_hangover_soup';

-- 1. 샘플 사용자 데이터 삽입 (002)
INSERT INTO users (id, email, password_hash, name)
VALUES (@DUMMY_USER_ID, 'demo@cooking.com', '$2a$10$YourHashedPasswordHere', '데모 사용자')
ON DUPLICATE KEY UPDATE id = id; -- 이미 존재하면 업데이트하지 않음

-- 2. 샘플 식재료 데이터 삽입 (002)
INSERT INTO ingredients (id, user_id, name, category, quantity, unit, storage, expiry_date)
VALUES
(UUID(), @DUMMY_USER_ID, '양파', '채소', '3', '개', 'room', DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)),
(UUID(), @DUMMY_USER_ID, '달걀', '유제품', '10', '개', 'refrigerated', DATE_ADD(CURRENT_DATE(), INTERVAL 14 DAY)),
(UUID(), @DUMMY_USER_ID, '김치', '소스/양념', '1', '포기', 'refrigerated', NULL)
ON DUPLICATE KEY UPDATE user_id = user_id;

-- 3. 레시피 테이블 더미 데이터 (커뮤니티/히스토리 연결용)
INSERT INTO recipes (id, name, category, cooking_method, ingredients_count, completed_count, average_rating)
VALUES
(@DUMMY_RECIPE_ID_1, '김치찌개', '찌개', '끓이기', 5, 2, 4.0),
(@DUMMY_RECIPE_ID_2, '계란말이', '반찬', '부치기', 3, 1, 5.0),
(@RECIPE_ID_PORK_RIBS, '돼지갈비볶음', '볶음', '볶기', 7, 0, 0.0), -- 신규
(@RECIPE_ID_HAMBURG, '함박스테이크 볼 밥', '밥', '굽기', 10, 0, 0.0), -- 신규
(@RECIPE_ID_BUTTER_ROLL, '삼색 버터롤', '디저트', '굽기', 8, 0, 0.0), -- 신규
(@RECIPE_ID_BULGOGI, '버섯콩불고기', '볶음', '볶기', 9, 0, 0.0), -- 신규
(@RECIPE_ID_SOUP, '양지해장국', '국/탕', '끓이기', 12, 0, 0.0) -- 신규
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 4. 저장된 레시피 테이블 더미 데이터
INSERT INTO saved_recipes (id, user_id, recipe_id, name, category, ingredients, steps)
VALUES
(UUID(), @DUMMY_USER_ID, @DUMMY_RECIPE_ID_1, '김치찌개', '찌개', '{"김치": "1포기", "돼지고기": "200g"}', '{"1": "끓인다"}')
ON DUPLICATE KEY UPDATE user_id = user_id;

-- 5. 요리 이력 테이블 더미 데이터
INSERT INTO cooking_history (id, user_id, recipe_id, recipe_name, rating, notes)
VALUES
(UUID(), @DUMMY_USER_ID, @DUMMY_RECIPE_ID_1, '김치찌개', 4, '조금 싱거웠다.'),
(UUID(), @DUMMY_USER_ID, @DUMMY_RECIPE_ID_2, '계란말이', 5, '완벽했다!')
ON DUPLICATE KEY UPDATE user_id = user_id;

-- 6. 요리 세션 테이블 더미 데이터 (진행 중이거나 완료된 세션)
INSERT INTO cooking_sessions (id, user_id, recipe_id, recipe_name, finished_at, total_time, current_step, rating, memo)
VALUES
(UUID(), @DUMMY_USER_ID, @DUMMY_RECIPE_ID_1, '김치찌개', NOW(), 1800, 5, 4, '다음엔 두부를 더 넣자.')
ON DUPLICATE KEY UPDATE user_id = user_id;

-- 7. 커뮤니티 완성 레시피 테이블 더미 데이터 (샘플 리뷰를 위한 항목 포함)
INSERT INTO completed_recipes (id, user_id, recipe_id, name, category, difficulty)
VALUES
(1, @DUMMY_USER_ID, @DUMMY_RECIPE_ID_1, '김치찌개', '찌개', 'Easy'),
(2, @DUMMY_USER_ID, @DUMMY_RECIPE_ID_2, '계란말이', '반찬', 'Normal'),
(3, @DUMMY_USER_ID, @RECIPE_ID_PORK_RIBS, '돼지갈비볶음', '볶음', 'Normal'), -- 샘플 리뷰용
(4, @DUMMY_USER_ID, @RECIPE_ID_HAMBURG, '함박스테이크 볼 밥', '밥', 'Easy'), -- 샘플 리뷰용
(5, @DUMMY_USER_ID, @RECIPE_ID_BUTTER_ROLL, '삼색 버터롤', '디저트', 'Hard'), -- 샘플 리뷰용
(6, @DUMMY_USER_ID, @RECIPE_ID_BULGOGI, '버섯콩불고기', '볶음', 'Easy'), -- 샘플 리뷰용
(7, @DUMMY_USER_ID, @RECIPE_ID_SOUP, '양지해장국', '국/탕', 'Normal') -- 샘플 리뷰용
ON DUPLICATE KEY UPDATE user_id = user_id;

-- 8. 커뮤니티 리뷰 테이블 더미 데이터
INSERT INTO community_reviews (id, user_id, recipe_id, recipe_name, rating, review, user_name, user_initial)
VALUES
(@DUMMY_REVIEW_ID, @DUMMY_USER_ID, @DUMMY_RECIPE_ID_1, '김치찌개', 4, '정말 맛있었습니다! 돼지고기가 신의 한 수였어요.', '데모 사용자', '데사')
ON DUPLICATE KEY UPDATE user_id = user_id;


-- 9. 샘플 데이터 추가 (사용자가 제공한 CommunityReview[] 데이터)
INSERT INTO community_reviews (id, user_id, recipe_id, recipe_name, rating, review, image_url, user_name, user_initial, created_at)
VALUES
('new_4', @DUMMY_USER_ID, @RECIPE_ID_PORK_RIBS, '돼지갈비볶음', 5, '양념이 정말 최고예요! 밥도둑이 따로 없습니다. 불 조절이 중요해요.', 'http://www.foodsafetykorea.go.kr/uploadimg/20141117/20141117053749_1416213469472.jpg', '고기사랑', '고', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 HOUR)),
('new_5', @DUMMY_USER_ID, @RECIPE_ID_HAMBURG, '함박스테이크 볼 밥', 4, '아이들 간식으로 딱이네요! 함박스테이크가 부드러워서 좋았습니다. 소스 레시피도 대만족!', 'http://www.foodsafetykorea.go.kr/uploadimg/cook/10_01062_2.png', '맘스키친', '맘', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 6 HOUR)),
('new_6', @DUMMY_USER_ID, @RECIPE_ID_BUTTER_ROLL, '삼색 버터롤', 5, '굽는 시간이 조금 걸렸지만, 결과물은 환상적이었어요! 커피랑 같이 먹으니 최고의 후식입니다.', 'http://www.foodsafetykorea.go.kr/uploadimg/cook/10_01091_2.png', '홈베이킹', '홈', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY)),
('new_7', @DUMMY_USER_ID, @RECIPE_ID_BULGOGI, '버섯콩불고기', 4, '채식 옵션으로 만들어봤는데, 고기 없이도 충분히 맛있고 건강한 맛이었어요. 양념 비율이 아주 좋습니다.', 'http://www.foodsafetykorea.go.kr/uploadimg/cook/10_00251_2.png', '건강라이프', '건', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY)),
('new_8', @DUMMY_USER_ID, @RECIPE_ID_SOUP, '양지해장국', 5, '속이 확 풀리는 얼큰한 국물! 숙취해소에 최고입니다. 양지살을 넉넉하게 넣는 걸 추천해요.', 'http://www.foodsafetykorea.go.kr/uploadimg/cook/10_00267_2.png', '국물중독', '국', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 4 DAY))
ON DUPLICATE KEY UPDATE user_id = user_id;


-- 10. 커뮤니티 댓글 테이블 더미 데이터
INSERT INTO community_comments (id, review_id, user_id, user_name, user_initial, text)
VALUES
(UUID(), @DUMMY_REVIEW_ID, @DUMMY_USER_ID, '데모 사용자', '데사', '맞아요, 저도 돼지고기 넣는 게 제일 맛있더라고요.')
ON DUPLICATE KEY UPDATE user_id = user_id;

-- 11. GPT 임시 레시피 테이블 더미 데이터
INSERT INTO gpt_temp_recipes (id, user_id, name, category, ingredients_count)
VALUES
(10001, @DUMMY_USER_ID, 'AI 추천 닭가슴살 샐러드', '반찬', 7)
ON DUPLICATE KEY UPDATE user_id = user_id;


-- 12. 카테고리 정규화 및 NULL 처리 (004) - 데이터 로드 후 실행
-- recipes 테이블에 데이터가 있다는 가정 하에 진행

UPDATE recipes
SET category = '기타'
WHERE category IS NULL OR TRIM(category) = '';

UPDATE recipes
SET category = CASE
    WHEN category LIKE '%밥%' OR category LIKE '%볶음밥%' OR category LIKE '%비빔밥%' OR category LIKE '%죽%' OR category LIKE '%덮밥%' THEN '밥'
    WHEN category LIKE '%국%' OR category LIKE '%탕%' THEN '국/탕'
    WHEN category LIKE '%찌개%' OR category LIKE '%전골%' THEN '찌개'
    WHEN category LIKE '%반찬%' OR category LIKE '%밑반찬%' OR category LIKE '%나물%' OR category LIKE '%무침%' OR category LIKE '%조림%' OR category LIKE '%볶음%' THEN '반찬'
    WHEN category LIKE '%구이%' OR category LIKE '%적%' THEN '구이'
    WHEN category LIKE '%튀김%' OR category LIKE '%전%' THEN '튀김'
    WHEN category LIKE '%면%' OR category LIKE '%국수%' OR category LIKE '%파스타%' THEN '면류'
    WHEN category LIKE '%찜%' THEN '찜'
    WHEN category LIKE '%후식%' OR category LIKE '%디저트%' OR category LIKE '%빵%' OR category LIKE '%케이크%' THEN '디저트'
    WHEN category LIKE '%음료%' OR category LIKE '%차%' THEN '음료'
    WHEN category LIKE '%일품%' OR category LIKE '%퓨전%' THEN '일품'
    ELSE '기타'
END;

UPDATE recipes
SET category = '기타'
WHERE category IS NULL OR TRIM(category) = '';

-- ============================================
-- END OF MIGRATION
-- ============================================