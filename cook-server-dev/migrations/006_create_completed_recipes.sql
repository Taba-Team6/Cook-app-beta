DROP TABLE IF EXISTS completed_recipes;

CREATE TABLE completed_recipes (
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
);
