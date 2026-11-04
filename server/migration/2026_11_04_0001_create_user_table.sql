CREATE TABLE `user` (
      `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      `uuid` CHAR(36) NOT NULL DEFAULT (UUID()),
      `first_name` VARCHAR(100) NOT NULL,
      `last_name` VARCHAR(100) NOT NULL,
      `email` VARCHAR(255) NOT NULL,
      `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
      PRIMARY KEY (`id`) USING BTREE,
      UNIQUE INDEX `uuid` (`uuid`) USING BTREE,
      UNIQUE INDEX `email` (`email`) USING BTREE
);
