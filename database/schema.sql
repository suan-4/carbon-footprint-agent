CREATE DATABASE IF NOT EXISTS carbon_agent
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE carbon_agent;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT 'primary key',
  open_id VARCHAR(64) NOT NULL UNIQUE COMMENT 'wechat openid',
  union_id VARCHAR(64) NULL COMMENT 'wechat unionid',
  nickname VARCHAR(64) NOT NULL COMMENT 'nickname',
  avatar_url VARCHAR(255) NULL COMMENT 'avatar url',
  campus VARCHAR(64) NULL COMMENT 'campus',
  total_points INT NOT NULL DEFAULT 0 COMMENT 'total points',
  total_carbon_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'total carbon kg',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1 active 0 disabled',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='users';

CREATE TABLE IF NOT EXISTS point_accounts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT 'primary key',
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'user id',
  balance INT NOT NULL DEFAULT 0 COMMENT 'current point balance',
  frozen_balance INT NOT NULL DEFAULT 0 COMMENT 'frozen point balance',
  version INT NOT NULL DEFAULT 0 COMMENT 'optimistic lock version',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_point_accounts_user_id FOREIGN KEY (user_id) REFERENCES users(id)
) COMMENT='point accounts';

CREATE TABLE IF NOT EXISTS point_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT 'primary key',
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'user id',
  behavior_record_id BIGINT UNSIGNED NULL COMMENT 'related behavior record id',
  order_id BIGINT UNSIGNED NULL COMMENT 'related order id',
  change_type VARCHAR(32) NOT NULL COMMENT 'earn or spend',
  points_delta INT NOT NULL COMMENT 'point delta',
  balance_after INT NOT NULL COMMENT 'balance after change',
  remark VARCHAR(255) NULL COMMENT 'remark',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_point_logs_user_created (user_id, created_at),
  CONSTRAINT fk_point_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id)
) COMMENT='point logs';

CREATE TABLE IF NOT EXISTS behavior_records (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT 'primary key',
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'user id',
  behavior_code VARCHAR(64) NOT NULL COMMENT 'behavior code',
  behavior_name VARCHAR(64) NOT NULL COMMENT 'behavior name',
  description VARCHAR(255) NULL COMMENT 'user submitted description',
  image_url VARCHAR(255) NULL COMMENT 'evidence image url',
  audit_status VARCHAR(32) NOT NULL DEFAULT 'pending' COMMENT 'pending approved rejected',
  points_awarded INT NOT NULL DEFAULT 0 COMMENT 'awarded points',
  carbon_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'carbon kg',
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'event time',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_behavior_records_user_created (user_id, created_at),
  CONSTRAINT fk_behavior_records_user_id FOREIGN KEY (user_id) REFERENCES users(id)
) COMMENT='behavior records';

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT 'primary key',
  name VARCHAR(128) NOT NULL UNIQUE COMMENT 'product name',
  category VARCHAR(32) NOT NULL COMMENT 'physical virtual badge',
  cover_url VARCHAR(255) NULL COMMENT 'cover image url',
  points_cost INT NOT NULL COMMENT 'points cost',
  stock INT NOT NULL DEFAULT 0 COMMENT 'stock',
  redeem_rule VARCHAR(255) NULL COMMENT 'redeem rule',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1 online 0 offline',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='products';

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT 'primary key',
  order_no VARCHAR(64) NOT NULL UNIQUE COMMENT 'order number',
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'user id',
  product_id BIGINT UNSIGNED NOT NULL COMMENT 'product id',
  product_name VARCHAR(128) NOT NULL COMMENT 'product name snapshot',
  points_cost INT NOT NULL COMMENT 'spent points',
  status VARCHAR(32) NOT NULL DEFAULT 'created' COMMENT 'created paid redeemed cancelled',
  verify_code VARCHAR(32) NULL COMMENT 'verify code',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_user_created (user_id, created_at),
  CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_orders_product_id FOREIGN KEY (product_id) REFERENCES products(id)
) COMMENT='orders';

CREATE TABLE IF NOT EXISTS carbon_reports (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT 'primary key',
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'user id',
  report_type VARCHAR(16) NOT NULL COMMENT 'weekly monthly',
  period_label VARCHAR(32) NOT NULL COMMENT 'example 2026-W13',
  total_carbon_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'total carbon kg in period',
  total_points INT NOT NULL DEFAULT 0 COMMENT 'total points in period',
  behavior_count INT NOT NULL DEFAULT 0 COMMENT 'behavior count',
  report_payload JSON NULL COMMENT 'chart payload',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_reports_user_period (user_id, report_type, period_label),
  CONSTRAINT fk_carbon_reports_user_id FOREIGN KEY (user_id) REFERENCES users(id)
) COMMENT='carbon reports';

CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT 'primary key',
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'user id',
  session_token VARCHAR(128) NOT NULL COMMENT 'session token',
  login_mode VARCHAR(32) NOT NULL DEFAULT 'dev' COMMENT 'wechat or dev',
  expires_at DATETIME NOT NULL COMMENT 'session expire time',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_sessions_token (session_token),
  INDEX idx_user_sessions_user (user_id),
  CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id)
) COMMENT='user sessions';

CREATE TABLE IF NOT EXISTS plaza_posts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT 'primary key',
  post_type VARCHAR(32) NOT NULL COMMENT 'help or book',
  title VARCHAR(128) NOT NULL COMMENT 'post title',
  meta_text VARCHAR(128) NOT NULL COMMENT 'meta text shown in card',
  description VARCHAR(255) NOT NULL COMMENT 'post description',
  reward_points INT NOT NULL DEFAULT 0 COMMENT 'reward points',
  tags_json JSON NULL COMMENT 'post tags json array',
  icon VARCHAR(255) NULL COMMENT 'icon path',
  icon_class VARCHAR(64) NULL COMMENT 'icon style class',
  status VARCHAR(32) NOT NULL DEFAULT 'open' COMMENT 'open claimed closed',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='plaza posts';

CREATE TABLE IF NOT EXISTS plaza_claims (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT 'primary key',
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'user id',
  post_id BIGINT UNSIGNED NOT NULL COMMENT 'post id',
  claim_code VARCHAR(32) NOT NULL COMMENT 'claim code',
  status VARCHAR(32) NOT NULL DEFAULT 'claimed' COMMENT 'claimed completed cancelled',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_plaza_claims_user_post (user_id, post_id),
  CONSTRAINT fk_plaza_claims_user_id FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_plaza_claims_post_id FOREIGN KEY (post_id) REFERENCES plaza_posts(id)
) COMMENT='plaza claims';
