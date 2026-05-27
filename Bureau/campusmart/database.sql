-- ============================================================
-- CampusMart — Base de données MySQL
-- Marketplace pour étudiants universitaires
-- ============================================================

CREATE DATABASE IF NOT EXISTS campusmart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campusmart;

-- --------------------------------------------------------
-- Table : utilisateurs
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS utilisateurs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nom             VARCHAR(100)    NOT NULL,
    email           VARCHAR(150)    NOT NULL UNIQUE,
    mot_de_passe    VARCHAR(255)    NOT NULL,
    universite      VARCHAR(150)    NOT NULL,
    telephone       VARCHAR(20)     NOT NULL,
    photo           VARCHAR(255)    DEFAULT NULL,
    note_moyenne    DECIMAL(2,1)    DEFAULT 0.0,
    nb_avis         INT             DEFAULT 0,
    date_inscription DATETIME       DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table : produits
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS produits (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    titre       VARCHAR(200)    NOT NULL,
    description TEXT            DEFAULT NULL,
    prix        DECIMAL(10,2)   NOT NULL,
    stock       INT             NOT NULL DEFAULT 1,
    photo       VARCHAR(255)    DEFAULT NULL,
    categorie   ENUM('Livres','Habits','Tech','Alimentaire','Services','Autre') DEFAULT 'Autre',
    id_vendeur  INT             NOT NULL,
    statut      ENUM('actif','epuise','supprime') DEFAULT 'actif',
    date        DATETIME        DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_vendeur) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table : commandes
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS commandes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    id_produit  INT             NOT NULL,
    id_acheteur INT             NOT NULL,
    id_vendeur  INT             NOT NULL,
    quantite    INT             NOT NULL DEFAULT 1,
    prix_total  DECIMAL(10,2)   NOT NULL,
    statut      ENUM('en_attente','confirme','livre','annule') DEFAULT 'en_attente',
    date        DATETIME        DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_produit)  REFERENCES produits(id)      ON DELETE CASCADE,
    FOREIGN KEY (id_acheteur) REFERENCES utilisateurs(id)  ON DELETE CASCADE,
    FOREIGN KEY (id_vendeur)  REFERENCES utilisateurs(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table : messages
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    id_envoyeur INT             NOT NULL,
    id_receveur INT             NOT NULL,
    contenu     TEXT            NOT NULL,
    lu          TINYINT(1)      DEFAULT 0,
    date        DATETIME        DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_envoyeur) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (id_receveur) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Table : avis
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS avis (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    id_auteur   INT             NOT NULL,
    id_cible    INT             NOT NULL,
    note        TINYINT         NOT NULL CHECK (note BETWEEN 1 AND 5),
    commentaire TEXT            DEFAULT NULL,
    date        DATETIME        DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY avis_unique (id_auteur, id_cible),
    FOREIGN KEY (id_auteur) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (id_cible)  REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Trigger : mise à jour automatique du statut produit
-- --------------------------------------------------------
DELIMITER $$

CREATE TRIGGER maj_statut_produit
AFTER UPDATE ON produits
FOR EACH ROW
BEGIN
    IF NEW.stock = 0 AND NEW.statut = 'actif' THEN
        UPDATE produits SET statut = 'epuise' WHERE id = NEW.id;
    END IF;
    IF NEW.stock > 0 AND OLD.statut = 'epuise' THEN
        UPDATE produits SET statut = 'actif' WHERE id = NEW.id;
    END IF;
END$$

CREATE TRIGGER decrementer_stock
AFTER INSERT ON commandes
FOR EACH ROW
BEGIN
    UPDATE produits
    SET stock = stock - NEW.quantite
    WHERE id = NEW.id_produit;
END$$

CREATE TRIGGER maj_note_vendeur
AFTER INSERT ON avis
FOR EACH ROW
BEGIN
    UPDATE utilisateurs u
    SET
        note_moyenne = (SELECT AVG(note) FROM avis WHERE id_cible = NEW.id_cible),
        nb_avis      = (SELECT COUNT(*)  FROM avis WHERE id_cible = NEW.id_cible)
    WHERE u.id = NEW.id_cible;
END$$

CREATE TRIGGER maj_note_vendeur_update
AFTER UPDATE ON avis
FOR EACH ROW
BEGIN
    UPDATE utilisateurs u
    SET
        note_moyenne = (SELECT AVG(note) FROM avis WHERE id_cible = NEW.id_cible),
        nb_avis      = (SELECT COUNT(*)  FROM avis WHERE id_cible = NEW.id_cible)
    WHERE u.id = NEW.id_cible;
END$$

DELIMITER ;

