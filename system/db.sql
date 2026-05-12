-- db.sql
-- Create the database and the users table

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `vorname` VARCHAR(100) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY (`email`)
);

-- Children
CREATE TABLE IF NOT EXISTS `children` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `user_id`    INT NOT NULL,
  `name`       VARCHAR(100) NOT NULL,
  `geburtstag` DATE NOT NULL,
  `avatar`     VARCHAR(10) NOT NULL DEFAULT '🦄',
  PRIMARY KEY (`id`)
);

-- Avatar-Spalte nachrüsten falls children-Tabelle schon existiert
ALTER TABLE `children` ADD COLUMN IF NOT EXISTS `avatar` VARCHAR(10) NOT NULL DEFAULT '🦄';

-- Password reset tokens
CREATE TABLE IF NOT EXISTS `password_resets` (
  `user_id`    INT NOT NULL,
  `token`      VARCHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY (`token`)
);
