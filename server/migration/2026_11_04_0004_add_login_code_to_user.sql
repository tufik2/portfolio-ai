ALTER TABLE `user`
      ADD COLUMN `login_code_hash` CHAR(64) NULL DEFAULT NULL AFTER `email_verified_at`,
      ADD COLUMN `login_code_expires_at` DATETIME NULL DEFAULT NULL AFTER `login_code_hash`,
      ADD COLUMN `login_code_sent_at` DATETIME NULL DEFAULT NULL AFTER `login_code_expires_at`,
      ADD COLUMN `login_code_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER `login_code_sent_at`;
