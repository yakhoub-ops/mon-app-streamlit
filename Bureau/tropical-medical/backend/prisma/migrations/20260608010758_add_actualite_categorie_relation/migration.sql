-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Actualite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "image" TEXT,
    "categorie" TEXT NOT NULL DEFAULT 'INFO',
    "auteurId" INTEGER,
    "publiee" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Actualite_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Actualite" ("auteurId", "contenu", "createdAt", "id", "image", "publiee", "titre", "updatedAt") SELECT "auteurId", "contenu", "createdAt", "id", "image", "publiee", "titre", "updatedAt" FROM "Actualite";
DROP TABLE "Actualite";
ALTER TABLE "new_Actualite" RENAME TO "Actualite";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
