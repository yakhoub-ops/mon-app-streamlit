-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "antecedentsFamiliaux" TEXT;
ALTER TABLE "Patient" ADD COLUMN "chirurgies" TEXT;
ALTER TABLE "Patient" ADD COLUMN "contactUrgenceNom" TEXT;
ALTER TABLE "Patient" ADD COLUMN "contactUrgenceTelephone" TEXT;
ALTER TABLE "Patient" ADD COLUMN "hospitalisationsPrecedentes" TEXT;
ALTER TABLE "Patient" ADD COLUMN "maladiesChroniques" TEXT;
ALTER TABLE "Patient" ADD COLUMN "numeroIdentification" TEXT;

-- CreateTable
CREATE TABLE "Vaccination" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dossierId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "dateAdministration" DATETIME NOT NULL,
    "rappelPrevu" DATETIME,
    "rappelEffectue" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vaccination_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "DossierMedical" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamenMedical" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dossierId" INTEGER NOT NULL,
    "consultationId" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'AUTRE',
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "resultats" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fichier" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamenMedical_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "DossierMedical" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExamenMedical_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
