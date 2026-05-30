-- =============================================================
--  TROPICAL MEDICAL — Script de création de la base de données
--  Stack : MySQL 8+
-- =============================================================

CREATE DATABASE IF NOT EXISTS tropical_medical
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tropical_medical;

-- =============================================================
--  1. UTILISATEUR  (table centrale : tous les rôles)
-- =============================================================
CREATE TABLE utilisateur (
  id_util       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom           VARCHAR(80)  NOT NULL,
  prenom        VARCHAR(80)  NOT NULL,
  telephone     VARCHAR(20)  NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  mot_de_passe  VARCHAR(255) NOT NULL,
  role          ENUM('medecin','patient','receptionniste','pharmacien','admin') NOT NULL,
  actif         TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================================
--  2. MEDECIN  (extension de utilisateur)
-- =============================================================
CREATE TABLE medecin (
  id_medecin     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_util        INT UNSIGNED NOT NULL UNIQUE,
  specialite     VARCHAR(100) NOT NULL,
  numero_ordre   VARCHAR(50),
  biographie     TEXT,
  photo_url      VARCHAR(255),
  disponible     TINYINT(1)   NOT NULL DEFAULT 1,
  CONSTRAINT fk_medecin_util FOREIGN KEY (id_util)
    REFERENCES utilisateur(id_util) ON DELETE CASCADE
);

-- =============================================================
--  3. DISPONIBILITE MEDECIN  (créneaux hebdomadaires)
-- =============================================================
CREATE TABLE disponibilite (
  id_dispo     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_medecin   INT UNSIGNED NOT NULL,
  jour_semaine TINYINT UNSIGNED NOT NULL COMMENT '1=Lundi … 7=Dimanche',
  heure_debut  TIME NOT NULL,
  heure_fin    TIME NOT NULL,
  CONSTRAINT fk_dispo_medecin FOREIGN KEY (id_medecin)
    REFERENCES medecin(id_medecin) ON DELETE CASCADE
);

-- =============================================================
--  4. PATIENT  (extension de utilisateur)
-- =============================================================
CREATE TABLE patient (
  id_patient      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_util         INT UNSIGNED NOT NULL UNIQUE,
  date_naissance  DATE,
  sexe            ENUM('M','F','Autre'),
  adresse         VARCHAR(255),
  groupe_sanguin  ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'),
  allergies       TEXT,
  antecedents     TEXT,
  CONSTRAINT fk_patient_util FOREIGN KEY (id_util)
    REFERENCES utilisateur(id_util) ON DELETE CASCADE
);

-- =============================================================
--  5. RDV  (rendez-vous)
-- =============================================================
CREATE TABLE rdv (
  id_rdv       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_patient   INT UNSIGNED NOT NULL,
  id_medecin   INT UNSIGNED NOT NULL,
  date_rdv     DATETIME     NOT NULL,
  motif        VARCHAR(255),
  statut       ENUM('en_attente','confirme','annule','termine') NOT NULL DEFAULT 'en_attente',
  notes        TEXT,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rdv_patient FOREIGN KEY (id_patient)
    REFERENCES patient(id_patient) ON DELETE CASCADE,
  CONSTRAINT fk_rdv_medecin FOREIGN KEY (id_medecin)
    REFERENCES medecin(id_medecin) ON DELETE CASCADE
);

-- =============================================================
--  6. DOSSIER MEDICAL  (un par patient)
-- =============================================================
CREATE TABLE dossier_medical (
  id_dossier    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_patient    INT UNSIGNED NOT NULL UNIQUE,
  observations  TEXT,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dossier_patient FOREIGN KEY (id_patient)
    REFERENCES patient(id_patient) ON DELETE CASCADE
);

-- =============================================================
--  7. CONSULTATION
-- =============================================================
CREATE TABLE consultation (
  id_consultation  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_rdv           INT UNSIGNED,
  id_patient       INT UNSIGNED NOT NULL,
  id_medecin       INT UNSIGNED NOT NULL,
  id_dossier       INT UNSIGNED,
  date_consultation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  motif            VARCHAR(255),
  diagnostic       TEXT,
  traitement       TEXT,
  notes            TEXT,
  statut           ENUM('en_cours','terminee') NOT NULL DEFAULT 'en_cours',
  CONSTRAINT fk_consult_rdv     FOREIGN KEY (id_rdv)     REFERENCES rdv(id_rdv)              ON DELETE SET NULL,
  CONSTRAINT fk_consult_patient FOREIGN KEY (id_patient) REFERENCES patient(id_patient)      ON DELETE CASCADE,
  CONSTRAINT fk_consult_medecin FOREIGN KEY (id_medecin) REFERENCES medecin(id_medecin)      ON DELETE CASCADE,
  CONSTRAINT fk_consult_dossier FOREIGN KEY (id_dossier) REFERENCES dossier_medical(id_dossier) ON DELETE SET NULL
);

-- =============================================================
--  8. MEDICAMENT  (catalogue)
-- =============================================================
CREATE TABLE medicament (
  id_medicament  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom            VARCHAR(150) NOT NULL,
  dci            VARCHAR(150) COMMENT 'Dénomination Commune Internationale',
  forme          ENUM('comprime','sirop','injectable','creme','gouttes','poudre','autre') NOT NULL DEFAULT 'comprime',
  dosage         VARCHAR(80),
  description    TEXT
);

-- =============================================================
--  9. ORDONNANCE
-- =============================================================
CREATE TABLE ordonnance (
  id_ordonnance   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_consultation INT UNSIGNED NOT NULL,
  id_medecin      INT UNSIGNED NOT NULL,
  id_patient      INT UNSIGNED NOT NULL,
  date_emission   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_expiration DATE,
  statut          ENUM('active','delivree','expiree','annulee') NOT NULL DEFAULT 'active',
  CONSTRAINT fk_ordo_consult  FOREIGN KEY (id_consultation) REFERENCES consultation(id_consultation) ON DELETE CASCADE,
  CONSTRAINT fk_ordo_medecin  FOREIGN KEY (id_medecin)      REFERENCES medecin(id_medecin)           ON DELETE CASCADE,
  CONSTRAINT fk_ordo_patient  FOREIGN KEY (id_patient)      REFERENCES patient(id_patient)           ON DELETE CASCADE
);

-- =============================================================
-- 10. LIGNE ORDONNANCE  (détail médicaments prescrits)
-- =============================================================
CREATE TABLE ligne_ordonnance (
  id_ligne       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_ordonnance  INT UNSIGNED NOT NULL,
  id_medicament  INT UNSIGNED NOT NULL,
  posologie      VARCHAR(255) NOT NULL COMMENT 'ex: 1 cp matin et soir',
  duree          VARCHAR(80)  COMMENT 'ex: 7 jours',
  quantite       SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  instructions   TEXT,
  CONSTRAINT fk_ligne_ordo  FOREIGN KEY (id_ordonnance) REFERENCES ordonnance(id_ordonnance)    ON DELETE CASCADE,
  CONSTRAINT fk_ligne_medic FOREIGN KEY (id_medicament) REFERENCES medicament(id_medicament)    ON DELETE CASCADE
);

-- =============================================================
-- 11. URGENCE
-- =============================================================
CREATE TABLE urgence (
  id_urgence           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_patient           INT UNSIGNED,
  nom_patient          VARCHAR(160) COMMENT 'Si patient non enregistré',
  description          TEXT NOT NULL,
  niveau               ENUM('critique','urgent','modere','faible') NOT NULL DEFAULT 'urgent',
  statut               ENUM('en_attente','prise_en_charge','resolue') NOT NULL DEFAULT 'en_attente',
  date_arrivee         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_medecin           INT UNSIGNED,
  date_prise_en_charge DATETIME,
  notes                TEXT,
  CONSTRAINT fk_urgence_patient FOREIGN KEY (id_patient) REFERENCES patient(id_patient)  ON DELETE SET NULL,
  CONSTRAINT fk_urgence_medecin FOREIGN KEY (id_medecin) REFERENCES medecin(id_medecin)  ON DELETE SET NULL
);

-- =============================================================
-- 12. FILE D'ATTENTE
-- =============================================================
CREATE TABLE file_attente (
  id_file       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_patient    INT UNSIGNED NOT NULL,
  id_medecin    INT UNSIGNED,
  id_rdv        INT UNSIGNED,
  heure_arrivee DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  heure_appel   DATETIME,
  statut        ENUM('en_attente','appele','consulte','parti') NOT NULL DEFAULT 'en_attente',
  priorite      TINYINT UNSIGNED NOT NULL DEFAULT 3 COMMENT '1=urgent … 5=normal',
  notes         VARCHAR(255),
  CONSTRAINT fk_file_patient FOREIGN KEY (id_patient) REFERENCES patient(id_patient) ON DELETE CASCADE,
  CONSTRAINT fk_file_medecin FOREIGN KEY (id_medecin) REFERENCES medecin(id_medecin) ON DELETE SET NULL,
  CONSTRAINT fk_file_rdv     FOREIGN KEY (id_rdv)     REFERENCES rdv(id_rdv)         ON DELETE SET NULL
);

-- =============================================================
-- 13. STOCK PHARMACIE
-- =============================================================
CREATE TABLE stock (
  id_stock         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_medicament    INT UNSIGNED NOT NULL,
  quantite         INT UNSIGNED NOT NULL DEFAULT 0,
  seuil_alerte     INT UNSIGNED NOT NULL DEFAULT 10,
  prix_unitaire    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  lot              VARCHAR(80),
  date_peremption  DATE,
  date_entree      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_medicament FOREIGN KEY (id_medicament)
    REFERENCES medicament(id_medicament) ON DELETE CASCADE
);

-- =============================================================
-- 14. MOUVEMENT STOCK  (entrées / sorties)
-- =============================================================
CREATE TABLE mouvement_stock (
  id_mouvement  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_stock      INT UNSIGNED NOT NULL,
  type          ENUM('entree','sortie','ajustement') NOT NULL,
  quantite      INT NOT NULL COMMENT 'Négatif pour sortie',
  motif         VARCHAR(255),
  id_util       INT UNSIGNED COMMENT 'Pharmacien responsable',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mvt_stock FOREIGN KEY (id_stock)  REFERENCES stock(id_stock)           ON DELETE CASCADE,
  CONSTRAINT fk_mvt_util  FOREIGN KEY (id_util)   REFERENCES utilisateur(id_util)      ON DELETE SET NULL
);

-- =============================================================
-- 15. FACTURE
-- =============================================================
CREATE TABLE facture (
  id_facture          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_patient          INT UNSIGNED NOT NULL,
  id_consultation     INT UNSIGNED,
  date_emission       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_echeance       DATE,
  montant_total       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  montant_paye        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  statut              ENUM('en_attente','partiellement_paye','paye','annule') NOT NULL DEFAULT 'en_attente',
  mode_paiement       ENUM('especes','wave','orange_money','carte','assurance','cheque') DEFAULT NULL,
  reference_assurance VARCHAR(120),
  notes               TEXT,
  CONSTRAINT fk_facture_patient FOREIGN KEY (id_patient)      REFERENCES patient(id_patient)          ON DELETE CASCADE,
  CONSTRAINT fk_facture_consult FOREIGN KEY (id_consultation) REFERENCES consultation(id_consultation) ON DELETE SET NULL
);

-- =============================================================
-- 16. LIGNE FACTURE  (détail des actes / produits facturés)
-- =============================================================
CREATE TABLE ligne_facture (
  id_ligne_facture  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_facture        INT UNSIGNED NOT NULL,
  description       VARCHAR(255) NOT NULL,
  quantite          SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  prix_unitaire     DECIMAL(10,2) NOT NULL,
  montant           DECIMAL(12,2) GENERATED ALWAYS AS (quantite * prix_unitaire) STORED,
  CONSTRAINT fk_ligne_facture FOREIGN KEY (id_facture) REFERENCES facture(id_facture) ON DELETE CASCADE
);

-- =============================================================
-- 17. NOTIFICATION
-- =============================================================
CREATE TABLE notification (
  id_notification  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_util          INT UNSIGNED NOT NULL,
  message          TEXT NOT NULL,
  type             ENUM('rdv','urgence','ordonnance','stock','facture','systeme') NOT NULL DEFAULT 'systeme',
  lu               TINYINT(1) NOT NULL DEFAULT 0,
  lien             VARCHAR(255) COMMENT 'Route frontend optionnelle',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_util FOREIGN KEY (id_util) REFERENCES utilisateur(id_util) ON DELETE CASCADE
);

-- =============================================================
--  INDEX  (performances des jointures fréquentes)
-- =============================================================
CREATE INDEX idx_rdv_patient    ON rdv(id_patient);
CREATE INDEX idx_rdv_medecin    ON rdv(id_medecin);
CREATE INDEX idx_rdv_date       ON rdv(date_rdv);
CREATE INDEX idx_rdv_statut     ON rdv(statut);

CREATE INDEX idx_consult_patient ON consultation(id_patient);
CREATE INDEX idx_consult_medecin ON consultation(id_medecin);
CREATE INDEX idx_consult_date    ON consultation(date_consultation);

CREATE INDEX idx_ordo_patient    ON ordonnance(id_patient);
CREATE INDEX idx_ordo_statut     ON ordonnance(statut);

CREATE INDEX idx_file_statut     ON file_attente(statut);
CREATE INDEX idx_file_priorite   ON file_attente(priorite);

CREATE INDEX idx_stock_peremption ON stock(date_peremption);
CREATE INDEX idx_stock_seuil      ON stock(quantite, seuil_alerte);

CREATE INDEX idx_facture_patient  ON facture(id_patient);
CREATE INDEX idx_facture_statut   ON facture(statut);

CREATE INDEX idx_notif_util_lu    ON notification(id_util, lu);

-- =============================================================
--  DONNEES DE TEST
-- =============================================================

-- Mot de passe : "tropical123" (bcrypt hash)
INSERT INTO utilisateur (nom, prenom, telephone, email, mot_de_passe, role) VALUES
  ('Diallo',   'Amadou',   '771234567', 'amadou.diallo@tropical.sn',   '$2a$10$v/wCGI/oA3VU9akKSHTe9eELqkmdFNIFpDXLxtjSigvW9EWuyRWZK', 'admin'),
  ('Sall',     'Fatou',    '772345678', 'fatou.sall@tropical.sn',       '$2a$10$v/wCGI/oA3VU9akKSHTe9eELqkmdFNIFpDXLxtjSigvW9EWuyRWZK', 'medecin'),
  ('Ndiaye',   'Ibrahima', '773456789', 'ibrahima.ndiaye@tropical.sn',  '$2a$10$v/wCGI/oA3VU9akKSHTe9eELqkmdFNIFpDXLxtjSigvW9EWuyRWZK', 'medecin'),
  ('Ba',       'Mariama',  '774567890', 'mariama.ba@tropical.sn',       '$2a$10$v/wCGI/oA3VU9akKSHTe9eELqkmdFNIFpDXLxtjSigvW9EWuyRWZK', 'patient'),
  ('Diop',     'Cheikh',   '775678901', 'cheikh.diop@tropical.sn',      '$2a$10$v/wCGI/oA3VU9akKSHTe9eELqkmdFNIFpDXLxtjSigvW9EWuyRWZK', 'patient'),
  ('Fall',     'Aissatou', '776789012', 'aissatou.fall@tropical.sn',    '$2a$10$v/wCGI/oA3VU9akKSHTe9eELqkmdFNIFpDXLxtjSigvW9EWuyRWZK', 'receptionniste'),
  ('Gueye',   'Moussa',   '777890123', 'moussa.gueye@tropical.sn',     '$2a$10$v/wCGI/oA3VU9akKSHTe9eELqkmdFNIFpDXLxtjSigvW9EWuyRWZK', 'pharmacien');

INSERT INTO medecin (id_util, specialite, numero_ordre, disponible) VALUES
  (2, 'Médecine générale',    'MG-2021-0042', 1),
  (3, 'Pédiatrie',            'PE-2019-0017', 1);

INSERT INTO patient (id_util, date_naissance, sexe, adresse, groupe_sanguin) VALUES
  (4, '1990-03-15', 'F', 'Dakar, Plateau',   'A+'),
  (5, '1985-07-22', 'M', 'Thiès, Centre',    'O+');

INSERT INTO dossier_medical (id_patient, observations) VALUES
  (1, 'Aucun antécédent notable.'),
  (2, 'Hypertension légère suivie depuis 2022.');

INSERT INTO disponibilite (id_medecin, jour_semaine, heure_debut, heure_fin) VALUES
  (1, 1, '08:00', '12:00'), (1, 1, '14:00', '17:00'),
  (1, 2, '08:00', '12:00'), (1, 3, '08:00', '12:00'),
  (1, 4, '08:00', '12:00'), (1, 5, '08:00', '11:00'),
  (2, 1, '09:00', '13:00'), (2, 2, '09:00', '13:00'),
  (2, 3, '09:00', '13:00'), (2, 4, '09:00', '13:00');

INSERT INTO medicament (nom, dci, forme, dosage, description) VALUES
  ('Paracétamol 500mg',  'Paracétamol',   'comprime',    '500 mg',   'Antalgique et antipyrétique'),
  ('Amoxicilline 500mg', 'Amoxicilline',  'comprime',    '500 mg',   'Antibiotique pénicilline'),
  ('Ibuprofène 400mg',   'Ibuprofène',    'comprime',    '400 mg',   'Anti-inflammatoire AINS'),
  ('SRO Sachet',         'Sels de réhydratation', 'poudre', '—',    'Réhydratation orale'),
  ('Métronidazole 250mg','Métronidazole', 'comprime',    '250 mg',   'Antibiotique antiprotozoaire'),
  ('Cotrimoxazole 480mg','Cotrimoxazole', 'comprime',    '480 mg',   'Antibiotique sulfamide'),
  ('Quinine injectable', 'Quinine',       'injectable',  '300 mg/ml','Antipaludéen'),
  ('ACT Artémisinine',   'Artéméther/Luméfantrine', 'comprime', '20/120 mg', 'Antipaludéen combiné');

INSERT INTO stock (id_medicament, quantite, seuil_alerte, prix_unitaire, lot, date_peremption) VALUES
  (1, 500, 50,  150.00,  'LOT-2024-001', '2026-12-31'),
  (2, 200, 30,  350.00,  'LOT-2024-002', '2026-06-30'),
  (3, 150, 20,  250.00,  'LOT-2024-003', '2026-09-30'),
  (4, 100, 15,   50.00,  'LOT-2024-004', '2027-01-31'),
  (5, 180, 25,  200.00,  'LOT-2024-005', '2026-08-31'),
  (6,  80, 20,  300.00,  'LOT-2024-006', '2026-11-30'),
  (7,  40, 10, 2500.00,  'LOT-2024-007', '2025-12-31'),
  (8, 120, 20,  900.00,  'LOT-2024-008', '2026-07-31');

INSERT INTO rdv (id_patient, id_medecin, date_rdv, motif, statut) VALUES
  (1, 1, DATE_ADD(NOW(), INTERVAL 1 DAY),  'Consultation de routine',     'confirme'),
  (2, 1, DATE_ADD(NOW(), INTERVAL 2 DAY),  'Douleurs abdominales',        'en_attente'),
  (1, 2, DATE_ADD(NOW(), INTERVAL 3 DAY),  'Suivi pédiatrique',           'confirme'),
  (2, 2, DATE_SUB(NOW(), INTERVAL 5 DAY),  'Fièvre enfant',               'termine');

INSERT INTO notification (id_util, message, type, lu) VALUES
  (4, 'Votre RDV du lendemain est confirmé avec Dr Sall.',  'rdv',    0),
  (5, 'Nouveau RDV enregistré avec Dr Sall.',               'rdv',    0),
  (2, 'Vous avez 2 RDV confirmés demain.',                  'rdv',    0),
  (7, 'Stock Quinine injectable sous le seuil d\'alerte.',  'stock',  0);
