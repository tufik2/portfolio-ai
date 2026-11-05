CREATE TABLE `user_session` (
      `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      `user_id` BIGINT UNSIGNED NOT NULL,
      `refresh_jti_hash` CHAR(64) NOT NULL,
      `refresh_token_expires_at` DATETIME NOT NULL,
      `created_at` DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
      `refreshed_at` DATETIME NULL DEFAULT NULL,
      PRIMARY KEY (`id`) USING BTREE,
      UNIQUE INDEX `refresh_jti_hash` (`refresh_jti_hash`) USING BTREE,
      INDEX `user_id` (`user_id`) USING BTREE,
      CONSTRAINT `user_session_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
);
