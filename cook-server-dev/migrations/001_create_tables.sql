-- ============================================
-- BASE TABLES CREATION (Final Version)
-- migrate.js에서 DB를 DROP/CREATE 하므로, 이 파일은 순수한 테이블 생성만 담당합니다.
-- ============================================

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

-- Food Safety API의 전체 데이터를 저장하도록 확장된 레시피 테이블
CREATE TABLE IF NOT EXISTS recipes (
    id VARCHAR(100) PRIMARY KEY, -- RCP_SEQ (일련번호)
    name VARCHAR(255) NOT NULL, -- RCP_NM (메뉴명)
    category VARCHAR(50) NULL, -- RCP_PAT2 (요리종류)
    cooking_method VARCHAR(50) NULL, -- RCP_WAY2 (조리방법)
    
    -- 이미지 경로
    image_small VARCHAR(500) NULL, image_large VARCHAR(500) NULL,
    
    -- 영양 정보 (빈 값 허용)
    info_weight VARCHAR(50) NULL, info_energy VARCHAR(50) NULL, info_carb VARCHAR(50) NULL,
    info_protein VARCHAR(50) NULL, info_fat VARCHAR(50) NULL, info_sodium VARCHAR(50) NULL,
    
    -- 상세 재료 및 팁 (TEXT 타입 사용, 빈 값 허용)
    ingredients_details TEXT NULL, hashtags TEXT NULL, sodium_tip TEXT NULL,
    
    -- 만드는 법 (MANUAL01 ~ MANUAL20, TEXT 타입, 빈 값 허용)
    manual_01 TEXT NULL, manual_02 TEXT NULL, manual_03 TEXT NULL, manual_04 TEXT NULL, manual_05 TEXT NULL,
    manual_06 TEXT NULL, manual_07 TEXT NULL, manual_08 TEXT NULL, manual_09 TEXT NULL, manual_10 TEXT NULL,
    manual_11 TEXT NULL, manual_12 TEXT NULL, manual_13 TEXT NULL, manual_14 TEXT NULL, manual_15 TEXT NULL,
    manual_16 TEXT NULL, manual_17 TEXT NULL, manual_18 TEXT NULL, manual_19 TEXT NULL, manual_20 TEXT NULL,

    -- 기존 메타데이터
    ingredients_count INT DEFAULT 0, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_cooking_method (cooking_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS saved_recipes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    recipe_id VARCHAR(100) NOT NULL, -- recipes(id)를 참조
    name VARCHAR(255) NOT NULL, category VARCHAR(50) NOT NULL, difficulty VARCHAR(20),
    cooking_time VARCHAR(50), image VARCHAR(500), description TEXT,
    ingredients JSON, steps JSON,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_recipe (user_id, recipe_id),
    INDEX idx_user_id (user_id), INDEX idx_category (category), INDEX idx_saved_at (saved_at), INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cooking_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    recipe_id VARCHAR(100) NOT NULL, -- recipes(id)를 참조
    recipe_name VARCHAR(255) NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, rating INT CHECK (rating BETWEEN 1 AND 5), notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id), INDEX idx_completed_at (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cooking_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    recipe_id VARCHAR(100) NOT NULL, -- recipes(id)를 참조
    recipe_name VARCHAR(255) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, finished_at TIMESTAMP,
    total_time INT, current_step INT DEFAULT 1,
    rating INT CHECK (rating BETWEEN 1 AND 5), memo TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id), INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recipe_crawl_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_inserted INT NOT NULL, total_skipped INT NOT NULL, total_processed INT NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;