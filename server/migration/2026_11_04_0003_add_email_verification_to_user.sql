ALTER TABLE `user`
      ADD COLUMN `email_verification_hash` CHAR(64) NULL DEFAULT NULL AFTER `status`,
      ADD COLUMN `email_verified_at` DATETIME NULL DEFAULT NULL AFTER `email_verification_hash`,
      ADD UNIQUE INDEX `email_verification_hash` (`email_verification_hash`) USING BTREE;
