# Tropical Medical

Plateforme médicale sénégalaise complète — consultations, téléconsultation, pharmacie, hospitalisation, urgences et paiements mobiles (Orange Money · Wave · Free Money).

## Stack technique

| Couche      | Technologies                                                                 |
|-------------|------------------------------------------------------------------------------|
| Frontend    | Vue 3 · Vite · Tailwind CSS v4 · Pinia · Vue Router v4 · vue-i18n v9       |
| UI          | lucide-vue-next · @vueuse/motion                                             |
| Temps réel  | Socket.io-client (v4)                                                        |
| Backend     | Node.js · Express 5 · Prisma 5 (SQLite) · JWT · bcryptjs                    |
| WebSocket   | Socket.io (v4)                                                               |
| Tâches CRON | node-cron (rappels RDV + alertes stock)                                      |
| Téléconsult | Jitsi Meet (iframe embarqué)                                                 |

## Modules fonctionnels

| Module            | Rôles concernés                        | Fonctionnalités clés                                              |
|-------------------|----------------------------------------|-------------------------------------------------------------------|
| Authentification  | Tous                                   | JWT, refresh, changement de mot de passe, RBAC                    |
| File d'attente    | Médecin, Réceptionniste                | Numéro d'appel, statuts, appel socket temps réel                  |
| Consultations     | Médecin, Réceptionniste                | Dossier médical, ordonnances, diagnostic                          |
| Téléconsultation  | Médecin, Patient                       | Salle Jitsi embarquée, lien par RDV                               |
| Pharmacie         | Pharmacien                             | Stock, lots, expirations, délivrance ordonnances                  |
| Hospitalisation   | Réceptionniste                         | Plan des lits (LIBRE/OCCUPÉ/RÉSERVÉ/MAINTENANCE), admissions      |
| Facturation       | Patient, Réceptionniste                | Paiement mobile (Orange Money · Wave · Free Money) ou espèces     |
| Urgences          | Réceptionniste                         | Triage 4 niveaux, notifications immédiates                        |
| Notifications     | Tous                                   | Socket.io temps réel + persistance base + toasts animés           |
| Administration    | Admin                                  | Gestion utilisateurs, médecins, actualités, statistiques avancées |
| Préférences       | Tous                                   | Thème clair/sombre/auto, langue Français/Wolof                    |

## Architecture

```
tropical-medical/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Modèles de données (SQLite)
│   │   └── seed.js             # Données de démo (5 rôles)
│   └── src/
│       ├── app.js              # Express + Socket.io + CORS
│       ├── cron.js             # Rappels RDV + alertes stock
│       ├── config/
│       │   ├── prisma.js       # Client Prisma singleton
│       │   └── constants.js    # Rôles, statuts, modes paiement
│       ├── helpers/
│       │   └── notificationHelper.js  # creerNotification()
│       ├── middlewares/
│       │   ├── auth.js         # Vérification JWT
│       │   └── roleCheck.js    # RBAC par rôle
│       ├── controllers/        # 13 contrôleurs métier
│       └── routes/             # Routes par domaine
└── frontend/
    └── src/
        ├── main.js             # Bootstrap Vue + Pinia + i18n + Motion
        ├── router/index.js     # Routes avec guards par rôle
        ├── stores/
        │   ├── auth.js         # Token JWT + utilisateur courant
        │   ├── notifications.js # Socket + toasts + persistance
        │   └── preferences.js  # Thème + langue (localStorage)
        ├── composables/
        │   ├── useApi.js       # get/post/put/del avec Bearer
        │   ├── useDate.js      # Formatage dates FR-SN
        │   └── useSocket.js    # Singleton Socket.io
        ├── layouts/            # DashboardLayout + 5 layouts rôle + PublicLayout
        ├── components/
        │   ├── layout/         # AppHeader, AppSidebar
        │   └── NotifToast.vue  # Toasts temps réel (Teleport)
        ├── views/
        │   ├── public/         # Accueil, Connexion, 404
        │   ├── patient/        # 7 vues (RDV, Dossier, Factures…)
        │   ├── medecin/        # 6 vues (FileAttente, Consultation…)
        │   ├── receptionniste/ # 6 vues (Lits, Patients, Factures…)
        │   ├── pharmacien/     # 4 vues (Stock, Ordonnances…)
        │   ├── admin/          # 6 vues (Statistiques, Utilisateurs…)
        │   └── teleconsultation/ # SalleView (Jitsi)
        ├── locales/
        │   ├── fr.json         # Traductions Français
        │   └── wo.json         # Traductions Wolof
        └── style.css           # Tailwind v4 + palette + dark mode
```

## Installation

### Prérequis

- Node.js ≥ 18
- npm ≥ 9

### Backend

```bash
cd backend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env : renseigner JWT_SECRET

# Initialiser la base de données et insérer les données de démo
npx prisma migrate dev --name init
npm run prisma:seed

# Démarrer en développement
npm run dev
```

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Vérifier VITE_API_URL (défaut : http://localhost:5000/api)

# Démarrer en développement
npm run dev
```

L'application est accessible sur **http://localhost:5173** (frontend) et **http://localhost:5000** (API).

## Comptes de démonstration

| Rôle           | Email                        | Mot de passe  |
|----------------|------------------------------|---------------|
| Administrateur | admin@tropical.sn            | Admin123!     |
| Médecin        | medecin@tropical.sn          | Medecin123!   |
| Réceptionniste | receptionniste@tropical.sn   | Recep123!     |
| Pharmacien     | pharmacien@tropical.sn       | Pharma123!    |
| Patient        | patient@tropical.sn          | Patient123!   |

## Variables d'environnement

### Backend (`backend/.env`)

| Variable        | Description                          | Défaut                  |
|-----------------|--------------------------------------|-------------------------|
| `DATABASE_URL`  | Chemin SQLite (Prisma)               | `file:./dev.db`         |
| `JWT_SECRET`    | Clé secrète de signature JWT         | *(obligatoire)*         |
| `JWT_EXPIRES_IN`| Durée de validité du token           | `24h`                   |
| `PORT`          | Port du serveur Express              | `5000`                  |
| `FRONTEND_URL`  | Origine autorisée (CORS)             | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable          | Description                | Défaut                      |
|-------------------|----------------------------|-----------------------------|
| `VITE_API_URL`    | URL base de l'API REST     | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | URL du serveur Socket.io   | `http://localhost:5000`     |

## Palette de couleurs

| Variable              | Valeur      | Usage                            |
|-----------------------|-------------|----------------------------------|
| `--color-primary`     | `#0E9F8E`   | Couleur principale (teal)        |
| `--color-primary-dark`| `#0A7A6D`   | Survol et accents                |
| `--color-gold`        | `#E6B800`   | Alertes, badges dorés            |
| `--color-green`       | `#15803D`   | Succès, disponible               |
| `--color-danger`      | `#DC2626`   | Erreurs, urgences                |
| `--color-warning`     | `#F59E0B`   | Avertissements                   |
| `--color-info`        | `#0EA5E9`   | Informations, téléconsultation   |

## Fonctionnalités temps réel (Socket.io)

Le serveur gère deux types de rooms :
- `user:{id}` — notifications personnelles (appel patient, paiement confirmé…)
- `role:{ROLE}` — notifications collectives (alertes stock pharmaciens…)

Les événements principaux :
| Événement         | Déclencheur                           |
|-------------------|---------------------------------------|
| `notification`    | Toute notification (DB + temps réel)  |
| `appel_patient`   | Médecin appelle depuis la file d'attente |
| `rdv_update`      | Nouveau RDV créé pour un patient      |
| `facture_payee`   | Paiement encaissé                     |
| `stock_alerte`    | Médicament sous le seuil minimum      |

## CRON jobs

| Heure      | Tâche                                                          |
|------------|----------------------------------------------------------------|
| Chaque h   | Rappels RDV dans 23-25h (dédupliqués par lien de notification) |
| 08h00/jour | Alertes stock médicaments < seuil_minimum                      |

## Paiements mobiles

Le modèle `Paiement` + `TransactionMobile` simule un paiement immédiat (statut `REUSSI`).  
En production, connecter à l'API Orange Money Sénégal, l'API Wave ou la passerelle Free Money.

## Bilinguisme

L'interface est disponible en **Français** et **Wolof** via vue-i18n v9.  
Le toggle FR/WO est accessible dans l'en-tête du dashboard et dans la navbar publique.  
La langue choisie est persistée dans `localStorage` sous la clé `tm_langue`.

## Licence

Projet universitaire — Université de Thiès, Sénégal.  
Contact : yakhoub.baby@univ-thies.sn
