-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Medecin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utilisateurId" INTEGER NOT NULL,
    "specialite" TEXT NOT NULL,
    "numeroOrdre" TEXT,
    "description" TEXT,
    "consultationTarif" INTEGER NOT NULL DEFAULT 5000,
    "teleconsultationActive" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Medecin_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Medecin" ("consultationTarif", "description", "id", "numeroOrdre", "specialite", "utilisateurId") SELECT "consultationTarif", "description", "id", "numeroOrdre", "specialite", "utilisateurId" FROM "Medecin";
DROP TABLE "Medecin";
ALTER TABLE "new_Medecin" RENAME TO "Medecin";
CREATE UNIQUE INDEX "Medecin_utilisateurId_key" ON "Medecin"("utilisateurId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
