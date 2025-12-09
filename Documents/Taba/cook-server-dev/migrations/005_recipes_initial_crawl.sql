-- ============================================
-- RECIPE CRAWL HISTORY TABLE (Migration Step 005)
-- 최종적으로 recipes_light 테이블을 삭제합니다.
-- ============================================

-- 이전 recipes_light 테이블이 남아있다면 삭제 (최종 정리)
DROP TABLE IF EXISTS recipes_light;

CREATE TABLE IF NOT EXISTS recipe_crawl_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_inserted INT NOT NULL,
    total_skipped INT NOT NULL,
    total_processed INT NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 참고: 레시피 데이터가 성공적으로 로드되려면, /api/recipes/crawl 엔드포인트를
-- 서버 구동 후 한 번 실행하여 FoodSafety API로부터 전체 레시피 데이터를
-- 확장된 'recipes' 테이블에 삽입해야 합니다.