import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('../views/Login.vue'), meta: { public: true } },

  // Médecin
  { path: '/medecin', component: () => import('../views/medecin/Dashboard.vue'), meta: { role: 'medecin' } },
  { path: '/medecin/rdv', component: () => import('../views/medecin/MesRdv.vue'), meta: { role: 'medecin' } },
  { path: '/medecin/consultations', component: () => import('../views/medecin/Consultations.vue'), meta: { role: 'medecin' } },
  { path: '/medecin/consultations/nouvelle', component: () => import('../views/medecin/NouvelleConsultation.vue'), meta: { role: 'medecin' } },
  { path: '/medecin/ordonnances', component: () => import('../views/medecin/Ordonnances.vue'), meta: { role: 'medecin' } },
  { path: '/medecin/patients', component: () => import('../views/medecin/Patients.vue'), meta: { role: 'medecin' } },
  { path: '/medecin/patients/:id', component: () => import('../views/medecin/FichePatient.vue'), meta: { role: 'medecin' } },
  { path: '/medecin/urgences', component: () => import('../views/medecin/Urgences.vue'), meta: { role: 'medecin' } },
  { path: '/medecin/teleconsultations', component: () => import('../views/medecin/Teleconsultations.vue'), meta: { role: 'medecin' } },
  { path: '/medecin/disponibilites', component: () => import('../views/medecin/Disponibilites.vue'), meta: { role: 'medecin' } },

  // Patient
  { path: '/patient', component: () => import('../views/patient/Dashboard.vue'), meta: { role: 'patient' } },
  { path: '/patient/rdv', component: () => import('../views/patient/MesRdv.vue'), meta: { role: 'patient' } },
  { path: '/patient/rdv/nouveau', component: () => import('../views/patient/NouveauRdv.vue'), meta: { role: 'patient' } },
  { path: '/patient/dossier', component: () => import('../views/patient/MonDossier.vue'), meta: { role: 'patient' } },
  { path: '/patient/ordonnances', component: () => import('../views/patient/MesOrdonnances.vue'), meta: { role: 'patient' } },
  { path: '/patient/factures', component: () => import('../views/patient/MesFactures.vue'), meta: { role: 'patient' } },
  { path: '/patient/actualites', component: () => import('../views/patient/Actualites.vue'), meta: { role: 'patient' } },

  // Réceptionniste
  { path: '/receptionniste', component: () => import('../views/receptionniste/Dashboard.vue'), meta: { role: 'receptionniste' } },
  { path: '/receptionniste/file-attente', component: () => import('../views/receptionniste/FileAttente.vue'), meta: { role: 'receptionniste' } },
  { path: '/receptionniste/urgences', component: () => import('../views/receptionniste/Urgences.vue'), meta: { role: 'receptionniste' } },
  { path: '/receptionniste/facturation', component: () => import('../views/receptionniste/Facturation.vue'), meta: { role: 'receptionniste' } },
  { path: '/receptionniste/patients', component: () => import('../views/receptionniste/Patients.vue'), meta: { role: 'receptionniste' } },

  // Pharmacien
  { path: '/pharmacien', component: () => import('../views/pharmacien/Dashboard.vue'), meta: { role: 'pharmacien' } },
  { path: '/pharmacien/stock', component: () => import('../views/pharmacien/Stock.vue'), meta: { role: 'pharmacien' } },
  { path: '/pharmacien/ordonnances', component: () => import('../views/pharmacien/Ordonnances.vue'), meta: { role: 'pharmacien' } },
  { path: '/pharmacien/medicaments', component: () => import('../views/pharmacien/Medicaments.vue'), meta: { role: 'pharmacien' } },

  // Admin
  { path: '/admin', component: () => import('../views/admin/Dashboard.vue'), meta: { role: 'admin' } },
  { path: '/admin/utilisateurs', component: () => import('../views/admin/Utilisateurs.vue'), meta: { role: 'admin' } },
  { path: '/admin/assurances', component: () => import('../views/admin/Assurances.vue'), meta: { role: 'admin' } },
  { path: '/admin/interactions', component: () => import('../views/admin/Interactions.vue'), meta: { role: 'admin' } },

  // Commun
  { path: '/profil', component: () => import('../views/Profil.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
];

const router = createRouter({ history: createWebHistory(), routes });

const roleHome = {
  medecin: '/medecin',
  patient: '/patient',
  receptionniste: '/receptionniste',
  pharmacien: '/pharmacien',
  admin: '/admin',
};

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.isLoggedIn) return '/login';
  if (to.path === '/login' && auth.isLoggedIn) return roleHome[auth.role] || '/';
  if (to.meta.role && auth.role !== to.meta.role) return roleHome[auth.role] || '/login';
  return true;
});

export { roleHome };
export default router;
