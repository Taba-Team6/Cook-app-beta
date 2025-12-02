-- ============================================
-- RECIPES CRAWL HISTORY TABLE (optional but useful)
-- ============================================

DROP TABLE IF EXISTS recipe_crawl_history;

CREATE TABLE IF NOT EXISTS recipe_crawl_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_inserted INT NOT NULL,
    total_skipped INT NOT NULL,
    total_processed INT NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
