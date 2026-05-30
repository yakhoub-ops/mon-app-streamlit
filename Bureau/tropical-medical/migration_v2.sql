-- =============================================================
--  TROPICAL MEDICAL — Migration v2 : fonctionnalités manquantes
--  MySQL 8.0 — À exécuter après tropical_database.sql
-- =============================================================

USE tropical_medical;

-- 1. Numéro dossier unique sur patient
ALTER TABLE patient
  ADD COLUMN numero_dossier VARCHAR(20) NULL UNIQUE AFTER id_util;

-- Générer les numéros pour les patients existants
UPDATE patient SET numero_dossier = CONCAT('TM-', LPAD(id_patient, 6, '0'))
WHERE numero_dossier IS NULL;

-- 2. Service d'affectation et téléconsultation sur médecin (RG2, RG11)
ALTER TABLE medecin
  ADD COLUMN service            VARCHAR(100) NULL       AFTER specialite,
  ADD COLUMN teleconsult_active TINYINT(1)   NOT NULL DEFAULT 0 AFTER disponible;

-- 3. Table assurance (RG14)
CREATE TABLE assurance (
  id_assurance         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom                  VARCHAR(150) NOT NULL,
  code                 VARCHAR(50)  NULL UNIQUE,
  taux_prise_en_charge DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Pourcentage 0-100',
  description          TEXT,
  actif                TINYINT(1)   NOT NULL DEFAULT 1,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO assurance (nom, code, taux_prise_en_charge) VALUES
  ('IPRES',    'IPRES',    80.00),
  ('CSS',      'CSS',      70.00),
  ('SALAMA',   'SALAMA',   75.00),
  ('NSIA',     'NSIA',     60.00),
  ('Askia',    'ASKIA',    65.00),
  ('Privée',   'PRIVEE',   50.00);

-- 4. Colonnes tiers-payant sur facture (RG14)
ALTER TABLE facture
  ADD COLUMN id_assurance   INT UNSIGNED  NULL                   AFTER reference_assurance,
  ADD COLUMN taux_assurance DECIMAL(5,2)  NULL                   AFTER id_assurance,
  ADD COLUMN part_assurance DECIMAL(12,2) NOT NULL DEFAULT 0.00  AFTER taux_assurance,
  ADD COLUMN part_patient   DECIMAL(12,2) NOT NULL DEFAULT 0.00  AFTER part_assurance,
  ADD CONSTRAINT fk_facture_assurance
    FOREIGN KEY (id_assurance) REFERENCES assurance(id_assurance) ON DELETE SET NULL;

-- 5. Table interactions médicamenteuses (RG13)
CREATE TABLE interaction_medicamenteuse (
  id_interaction  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_medicament_a INT UNSIGNED NOT NULL,
  id_medicament_b INT UNSIGNED NOT NULL,
  niveau          ENUM('faible','modere','eleve','contrindication') NOT NULL DEFAULT 'modere',
  description     TEXT,
  CONSTRAINT fk_inter_med_a FOREIGN KEY (id_medicament_a)
    REFERENCES medicament(id_medicament) ON DELETE CASCADE,
  CONSTRAINT fk_inter_med_b FOREIGN KEY (id_medicament_b)
    REFERENCES medicament(id_medicament) ON DELETE CASCADE,
  UNIQUE KEY uk_interaction (id_medicament_a, id_medicament_b)
);

-- 6. Table téléconsultation (RG11)
CREATE TABLE teleconsultation (
  id_teleconsult  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_rdv          INT UNSIGNED NOT NULL,
  id_medecin      INT UNSIGNED NOT NULL,
  id_patient      INT UNSIGNED NOT NULL,
  statut          ENUM('planifiee','en_cours','terminee','annulee') NOT NULL DEFAULT 'planifiee',
  lien_session    VARCHAR(500),
  date_debut      DATETIME,
  date_fin        DATETIME,
  notes           TEXT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tc_rdv     FOREIGN KEY (id_rdv)     REFERENCES rdv(id_rdv)         ON DELETE CASCADE,
  CONSTRAINT fk_tc_medecin FOREIGN KEY (id_medecin) REFERENCES medecin(id_medecin) ON DELETE CASCADE,
  CONSTRAINT fk_tc_patient FOREIGN KEY (id_patient) REFERENCES patient(id_patient) ON DELETE CASCADE
);

-- 7. Table liste d'attente RDV (RG12)
CREATE TABLE liste_attente_rdv (
  id_liste       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_patient     INT UNSIGNED NOT NULL,
  id_medecin     INT UNSIGNED NOT NULL,
  date_souhaitee DATE,
  motif          VARCHAR(255),
  priorite       TINYINT UNSIGNED NOT NULL DEFAULT 3 COMMENT '1=urgent … 5=normal',
  statut         ENUM('en_attente','propose','confirme','expire') NOT NULL DEFAULT 'en_attente',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lardv_patient FOREIGN KEY (id_patient) REFERENCES patient(id_patient) ON DELETE CASCADE,
  CONSTRAINT fk_lardv_medecin FOREIGN KEY (id_medecin) REFERENCES medecin(id_medecin) ON DELETE CASCADE
);
