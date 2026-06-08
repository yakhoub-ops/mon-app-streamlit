-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "mot_de_passe" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PreferencesUtilisateur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utilisateurId" INTEGER NOT NULL,
    "langue" TEXT NOT NULL DEFAULT 'FR',
    "theme" TEXT NOT NULL DEFAULT 'CLAIR',
    CONSTRAINT "PreferencesUtilisateur_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Medecin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utilisateurId" INTEGER NOT NULL,
    "specialite" TEXT NOT NULL,
    "numeroOrdre" TEXT,
    "description" TEXT,
    "consultationTarif" INTEGER NOT NULL DEFAULT 5000,
    CONSTRAINT "Medecin_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utilisateurId" INTEGER NOT NULL,
    "dateNaissance" DATETIME,
    "sexe" TEXT,
    "adresse" TEXT,
    "groupeSanguin" TEXT,
    "allergies" TEXT,
    "antecedents" TEXT,
    "assuranceId" INTEGER,
    CONSTRAINT "Patient_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Patient_assuranceId_fkey" FOREIGN KEY ("assuranceId") REFERENCES "Assurance" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assurance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "organisme" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tauxCouverture" INTEGER NOT NULL DEFAULT 80
);

-- CreateTable
CREATE TABLE "RendezVous" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patientId" INTEGER NOT NULL,
    "medecinId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PRESENTIEL',
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "motif" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RendezVous_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RendezVous_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PassageFileAttente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patientId" INTEGER NOT NULL,
    "medecinId" INTEGER,
    "rendezvousId" INTEGER,
    "niveauUrgence" TEXT NOT NULL DEFAULT 'FAIBLE',
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "motif" TEXT,
    "heureArrivee" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heureAppel" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PassageFileAttente_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PassageFileAttente_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PassageFileAttente_rendezvousId_fkey" FOREIGN KEY ("rendezvousId") REFERENCES "RendezVous" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DossierMedical" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patientId" INTEGER NOT NULL,
    "numeroDossier" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DossierMedical_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dossierId" INTEGER NOT NULL,
    "medecinId" INTEGER NOT NULL,
    "passageId" INTEGER,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motif" TEXT,
    "anamnese" TEXT,
    "examenClinique" TEXT,
    "diagnostic" TEXT,
    "traitement" TEXT,
    "notes" TEXT,
    "prochainRdv" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Consultation_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "DossierMedical" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Consultation_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Consultation_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "PassageFileAttente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ordonnance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dossierId" INTEGER NOT NULL,
    "consultationId" INTEGER,
    "medecinNom" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expirationDate" DATETIME,
    "instructions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ordonnance_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "DossierMedical" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ordonnance_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneOrdonnance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ordonnanceId" INTEGER NOT NULL,
    "medicamentId" INTEGER NOT NULL,
    "posologie" TEXT NOT NULL,
    "duree" TEXT,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "LigneOrdonnance_ordonnanceId_fkey" FOREIGN KEY ("ordonnanceId") REFERENCES "Ordonnance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LigneOrdonnance_medicamentId_fkey" FOREIGN KEY ("medicamentId") REFERENCES "Medicament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Medicament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "dci" TEXT,
    "forme" TEXT,
    "dosage" TEXT,
    "categorie" TEXT,
    "prixUnitaire" INTEGER NOT NULL DEFAULT 0,
    "stockActuel" INTEGER NOT NULL DEFAULT 0,
    "stockMinimum" INTEGER NOT NULL DEFAULT 10,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "LotMedicament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "medicamentId" INTEGER NOT NULL,
    "numeroLot" TEXT NOT NULL,
    "dateExpiration" DATETIME NOT NULL,
    "quantite" INTEGER NOT NULL,
    "quantiteRestante" INTEGER NOT NULL,
    "fournisseur" TEXT,
    "prixAchat" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LotMedicament_medicamentId_fkey" FOREIGN KEY ("medicamentId") REFERENCES "Medicament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "chambre" TEXT NOT NULL,
    "etage" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'STANDARD',
    "statut" TEXT NOT NULL DEFAULT 'LIBRE',
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "Hospitalisation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patientId" INTEGER NOT NULL,
    "litId" INTEGER NOT NULL,
    "medecinId" INTEGER,
    "dateAdmission" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateSortie" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'EN_COURS',
    "motif" TEXT,
    "diagnostic" TEXT,
    "notes" TEXT,
    "coutParJour" INTEGER NOT NULL DEFAULT 15000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Hospitalisation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Hospitalisation_litId_fkey" FOREIGN KEY ("litId") REFERENCES "Lit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patientId" INTEGER NOT NULL,
    "consultationId" INTEGER,
    "numero" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montantTotal" INTEGER NOT NULL DEFAULT 0,
    "montantAssurance" INTEGER NOT NULL DEFAULT 0,
    "montantPatient" INTEGER NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Facture_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Facture_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneFacture" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "factureId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "prixUnitaire" INTEGER NOT NULL,
    "montant" INTEGER NOT NULL,
    CONSTRAINT "LigneFacture_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "factureId" INTEGER NOT NULL,
    "montant" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Paiement_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransactionMobile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paiementId" INTEGER NOT NULL,
    "operateur" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransactionMobile_paiementId_fkey" FOREIGN KEY ("paiementId") REFERENCES "Paiement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Teleconsultation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rendezvousId" INTEGER NOT NULL,
    "medecinId" INTEGER NOT NULL,
    "urlVisio" TEXT NOT NULL,
    "plateforme" TEXT NOT NULL DEFAULT 'JITSI',
    "statut" TEXT NOT NULL DEFAULT 'PLANIFIEE',
    "dateDebut" DATETIME,
    "dateFin" DATETIME,
    "duree" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Teleconsultation_rendezvousId_fkey" FOREIGN KEY ("rendezvousId") REFERENCES "RendezVous" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Teleconsultation_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "Medecin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utilisateurId" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "canal" TEXT NOT NULL DEFAULT 'IN_APP',
    "statut" TEXT NOT NULL DEFAULT 'PLANIFIE',
    "lien" TEXT,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "envoyeAt" DATETIME,
    CONSTRAINT "Notification_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Actualite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "image" TEXT,
    "auteurId" INTEGER,
    "publiee" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "expediteurId" INTEGER NOT NULL,
    "destinataireId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Interaction_expediteurId_fkey" FOREIGN KEY ("expediteurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Interaction_destinataireId_fkey" FOREIGN KEY ("destinataireId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PreferencesUtilisateur_utilisateurId_key" ON "PreferencesUtilisateur"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "Medecin_utilisateurId_key" ON "Medecin"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_utilisateurId_key" ON "Patient"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "PassageFileAttente_rendezvousId_key" ON "PassageFileAttente"("rendezvousId");

-- CreateIndex
CREATE UNIQUE INDEX "DossierMedical_patientId_key" ON "DossierMedical"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "DossierMedical_numeroDossier_key" ON "DossierMedical"("numeroDossier");

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_passageId_key" ON "Consultation"("passageId");

-- CreateIndex
CREATE UNIQUE INDEX "Lit_numero_key" ON "Lit"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_consultationId_key" ON "Facture"("consultationId");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_numero_key" ON "Facture"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionMobile_paiementId_key" ON "TransactionMobile"("paiementId");

-- CreateIndex
CREATE UNIQUE INDEX "Teleconsultation_rendezvousId_key" ON "Teleconsultation"("rendezvousId");
