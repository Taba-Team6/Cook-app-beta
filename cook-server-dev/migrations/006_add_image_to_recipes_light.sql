-- 006_add_image_to_recipes_light.sql

-- recipes_light 테이블에 image 컬럼 추가 (이미지 경로는 NULL 허용)
ALTER TABLE recipes_light
ADD COLUMN image VARCHAR(255) NULL;