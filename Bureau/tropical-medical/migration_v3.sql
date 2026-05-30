-- =============================================================
--  TROPICAL MEDICAL — Migration v3
--  MySQL 8.0
-- =============================================================
USE tropical_medical;

-- 1. Durée variable des créneaux par plage (RG)
ALTER TABLE disponibilite
  ADD COLUMN duree_slot TINYINT UNSIGNED NOT NULL DEFAULT 30
    COMMENT 'Durée en minutes d\'un créneau (ex: 30, 45, 60)'
  AFTER heure_fin;

-- 2. Type de RDV (présentiel vs téléconsultation)
ALTER TABLE rdv
  ADD COLUMN type_rdv ENUM('presentiel','teleconsultation') NOT NULL DEFAULT 'presentiel'
  AFTER motif;

-- 3. Table actualités — générées automatiquement depuis le stock
CREATE TABLE actualite (
  id_actualite  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titre         VARCHAR(200) NOT NULL,
  contenu       TEXT,
  type          ENUM('stock_entree','stock_alerte','stock_peremption','conseil','annonce')
                NOT NULL DEFAULT 'annonce',
  id_stock      INT UNSIGNED NULL COMMENT 'Lien optionnel vers un lot de stock',
  publie        TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_actu_stock FOREIGN KEY (id_stock)
    REFERENCES stock(id_stock) ON DELETE SET NULL
);

-- Index
CREATE INDEX idx_actu_type ON actualite(type);
CREATE INDEX idx_actu_date ON actualite(created_at);
