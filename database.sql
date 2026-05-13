-- Tambahkan kolom yang diperlukan ke tabel players bawaan QBCore
ALTER TABLE `players` ADD COLUMN IF NOT EXISTS `dc_coin` INT(11) DEFAULT 0;
ALTER TABLE `players` ADD COLUMN IF NOT EXISTS `vip_tier` VARCHAR(50) DEFAULT 'none';
ALTER TABLE `players` ADD COLUMN IF NOT EXISTS `vip_expire` DATETIME DEFAULT NULL;

-- Opsional: Tabel log khusus jika ingin menyimpan riwayat di DB selain Discord
CREATE TABLE IF NOT EXISTS `darkness_vip_logs` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `citizenid` VARCHAR(50) NOT NULL,
    `action` TEXT NOT NULL,
    `amount` INT(11) DEFAULT 0,
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
