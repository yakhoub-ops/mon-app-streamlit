import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

// Routes publiques
const routes = [
  {
    path: '/',
    component: () => import('../layouts/PublicLayout.vue'),
    children: [
      { path: '', name: 'Accueil', component: () => import('../views/public/AccueilView.vue') },
      { path: 'connexion', name: 'Connexion', component: () => import('../views/public/ConnexionView.vue') },
    ],
  },

  // Patient
  {
    path: '/patient',
    component: () => import('../layouts/PatientLayout.vue'),
    meta: { requiresAuth: true, role: 'PATIENT' },
    children: [
      { path: '', redirect: '/patient/tableau-bord' },
      { path: 'tableau-bord', name: 'PatientDashboard', component: () => import('../views/patient/TableauBordView.vue') },
      { path: 'rdv', name: 'PatientRdv', component: () => import('../views/patient/RdvView.vue') },
      { path: 'dossier', name: 'PatientDossier', component: () => import('../views/patient/DossierView.vue') },
      { path: 'ordonnances', name: 'PatientOrdonnances', component: () => import('../views/patient/OrdonnancesView.vue') },
      { path: 'factures', name: 'PatientFactures', component: () => import('../views/patient/FacturesView.vue') },
      { path: 'teleconsultation', name: 'PatientTeleconsult', component: () => import('../views/patient/TeleconsultView.vue') },
      { path: 'actualites',      name: 'PatientActualites', component: () => import('../views/patient/ActualitesView.vue') },
      { path: 'messagerie',      name: 'PatientMessagerie', component: () => import('../views/patient/MessagerieView.vue') },
      { path: 'parametres',      name: 'PatientParametres', component: () => import('../views/patient/ParametresView.vue') },
    ],
  },

  // Médecin
  {
    path: '/medecin',
    component: () => import('../layouts/MedecinLayout.vue'),
    meta: { requiresAuth: true, role: 'MEDECIN' },
    children: [
      { path: '', redirect: '/medecin/tableau-bord' },
      { path: 'tableau-bord', name: 'MedecinDashboard', component: () => import('../views/medecin/TableauBordView.vue') },
      { path: 'file-attente', name: 'MedecinFileAttente', component: () => import('../views/medecin/FileAttenteView.vue') },
      { path: 'consultation/:id', name: 'MedecinConsultation', component: () => import('../views/medecin/ConsultationView.vue') },
      { path: 'agenda', name: 'MedecinAgenda', component: () => import('../views/medecin/AgendaView.vue') },
      { path: 'consultations', name: 'MedecinConsultations', component: () => import('../views/medecin/ConsultationsView.vue') },
      { path: 'ordonnances', name: 'MedecinOrdonnances', component: () => import('../views/medecin/OrdonnancesView.vue') },
      { path: 'urgences', name: 'MedecinUrgences', component: () => import('../views/medecin/UrgencesView.vue') },
      { path: 'dossiers', name: 'MedecinDossiers', component: () => import('../views/medecin/DossiersView.vue') },
      { path: 'teleconsultation', name: 'MedecinTeleconsult', component: () => import('../views/medecin/TeleconsultView.vue') },
      { path: 'messagerie',      name: 'MedecinMessagerie', component: () => import('../views/medecin/MessagerieView.vue') },
      { path: 'parametres',      name: 'MedecinParametres', component: () => import('../views/medecin/ParametresView.vue') },
    ],
  },

  // Réceptionniste
  {
    path: '/receptionniste',
    component: () => import('../layouts/ReceptionnisteLayout.vue'),
    meta: { requiresAuth: true, role: 'RECEPTIONNISTE' },
    children: [
      { path: '', redirect: '/receptionniste/tableau-bord' },
      { path: 'tableau-bord', name: 'RecepDashboard', component: () => import('../views/receptionniste/TableauBordView.vue') },
      { path: 'rdv', name: 'RecepRdv', component: () => import('../views/receptionniste/RdvView.vue') },
      { path: 'file-attente', name: 'RecepFileAttente', component: () => import('../views/receptionniste/FileAttenteView.vue') },
      { path: 'lits', name: 'RecepLits', component: () => import('../views/receptionniste/LitsView.vue') },
      { path: 'patients', name: 'RecepPatients', component: () => import('../views/receptionniste/PatientsView.vue') },
      { path: 'factures',    name: 'RecepFactures',    component: () => import('../views/receptionniste/FacturesView.vue') },
      { path: 'actualites',  name: 'RecepActualites',  component: () => import('../views/receptionniste/ActualitesView.vue') },
      { path: 'messagerie',  name: 'RecepMessagerie',  component: () => import('../views/receptionniste/MessagerieView.vue') },
    ],
  },

  // Pharmacien
  {
    path: '/pharmacien',
    component: () => import('../layouts/PharmacienLayout.vue'),
    meta: { requiresAuth: true, role: 'PHARMACIEN' },
    children: [
      { path: '', redirect: '/pharmacien/tableau-bord' },
      { path: 'tableau-bord', name: 'PharmaDashboard', component: () => import('../views/pharmacien/TableauBordView.vue') },
      { path: 'ordonnances', name: 'PharmaOrdonnances', component: () => import('../views/pharmacien/OrdonnancesView.vue') },
      { path: 'stock', name: 'PharmaStock', component: () => import('../views/pharmacien/StockView.vue') },
      { path: 'livraisons', name: 'PharmaLivraisons', component: () => import('../views/pharmacien/LivraisonsView.vue') },
    ],
  },

  // Admin
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'ADMIN' },
    children: [
      { path: '', redirect: '/admin/tableau-bord' },
      { path: 'tableau-bord', name: 'AdminDashboard', component: () => import('../views/admin/TableauBordView.vue') },
      { path: 'utilisateurs', name: 'AdminUtilisateurs', component: () => import('../views/admin/UtilisateursView.vue') },
      { path: 'medecins', name: 'AdminMedecins', component: () => import('../views/admin/MedecinsView.vue') },
      { path: 'actualites', name: 'AdminActualites', component: () => import('../views/admin/ActualitesView.vue') },
      { path: 'statistiques', name: 'AdminStats', component: () => import('../views/admin/StatistiquesView.vue') },
      { path: 'parametres', name: 'AdminParametres', component: () => import('../views/admin/ParametresView.vue') },
    ],
  },

  // Salle de téléconsultation (accessible à tout utilisateur connecté)
  {
    path: '/salle/:roomId',
    name: 'SalleTeleconsult',
    component: () => import('../views/teleconsultation/SalleView.vue'),
    meta: { requiresAuth: true },
  },

  // 404
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/public/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// Guard de navigation par rôle
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.estConnecte) {
    return next({ name: 'Connexion', query: { redirect: to.fullPath } })
  }

  if (to.meta.role && auth.utilisateur?.role !== to.meta.role) {
    return next(auth.routeParDefaut)
  }

  next()
})

export default router
