CREATE TABLE `migration` (
      `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      `migration` VARCHAR(100) NOT NULL,
      PRIMARY KEY (`id`) USING BTREE,
      UNIQUE INDEX `migration` (`migration`) USING BTREE
);
