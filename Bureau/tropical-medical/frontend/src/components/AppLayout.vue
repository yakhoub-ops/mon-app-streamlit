<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useNotifStore } from '../stores/notifications';
import NotificationBell from './NotificationBell.vue';

const auth = useAuthStore();
const notif = useNotifStore();
const router = useRouter();
const route = useRoute();

const navLinks = computed(() => {
  const role = auth.role;
  const maps = {
    medecin: [
      { to: '/medecin', label: 'Tableau de bord', icon: '🏠' },
      { to: '/medecin/rdv', label: 'Mes RDV', icon: '📅' },
      { to: '/medecin/consultations', label: 'Consultations', icon: '🩺' },
      { to: '/medecin/ordonnances', label: 'Ordonnances', icon: '💊' },
      { to: '/medecin/patients', label: 'Patients', icon: '👥' },
      { to: '/medecin/urgences', label: 'Urgences', icon: '🚨' },
      { to: '/medecin/teleconsultations', label: 'Téléconsultation', icon: '💻' },
      { to: '/medecin/disponibilites', label: 'Disponibilités', icon: '🗓️' },
    ],
    patient: [
      { to: '/patient', label: 'Tableau de bord', icon: '🏠' },
      { to: '/patient/rdv', label: 'Mes RDV', icon: '📅' },
      { to: '/patient/dossier', label: 'Mon dossier', icon: '📋' },
      { to: '/patient/ordonnances', label: 'Ordonnances', icon: '💊' },
      { to: '/patient/factures', label: 'Factures', icon: '🧾' },
      { to: '/patient/actualites', label: 'Actualités', icon: '📰' },
    ],
    receptionniste: [
      { to: '/receptionniste', label: 'Tableau de bord', icon: '🏠' },
      { to: '/receptionniste/file-attente', label: "File d'attente", icon: '⏳' },
      { to: '/receptionniste/urgences', label: 'Urgences', icon: '🚨' },
      { to: '/receptionniste/facturation', label: 'Facturation', icon: '🧾' },
      { to: '/receptionniste/patients', label: 'Patients', icon: '👥' },
    ],
    pharmacien: [
      { to: '/pharmacien', label: 'Tableau de bord', icon: '🏠' },
      { to: '/pharmacien/stock', label: 'Stock', icon: '📦' },
      { to: '/pharmacien/ordonnances', label: 'Ordonnances', icon: '💊' },
      { to: '/pharmacien/medicaments', label: 'Médicaments', icon: '🏥' },
    ],
    admin: [
      { to: '/admin', label: 'Tableau de bord', icon: '🏠' },
      { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: '👤' },
      { to: '/admin/assurances', label: 'Assurances', icon: '🛡️' },
      { to: '/admin/interactions', label: 'Interactions', icon: '⚠️' },
    ],
  };
  return maps[role] || [];
});

const roleLabel = computed(() => ({
  medecin: 'Médecin',
  patient: 'Patient',
  receptionniste: 'Réceptionniste',
  pharmacien: 'Pharmacien',
  admin: 'Administrateur',
}[auth.role] || ''));

const logout = () => {
  auth.logout();
  router.push('/login');
};
</script>

<template>
  <div class="flex min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-10">
      <!-- Logo -->
      <div class="p-5 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style="background: #07f113">T</div>
          <div>
            <div class="font-bold text-gray-900 text-sm">Tropical Medical</div>
            <div class="text-xs text-gray-500">{{ roleLabel }}</div>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
        <router-link
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="route.path === link.to
            ? 'text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
          :style="route.path === link.to ? 'background: #07f113' : ''"
          :exact="link.to.split('/').length <= 2"
        >
          <span class="text-base">{{ link.icon }}</span>
          {{ link.label }}
        </router-link>
      </nav>

      <!-- User footer -->
      <div class="p-3 border-t border-gray-100">
        <router-link to="/profil" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
          <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
            {{ auth.user?.prenom?.[0] }}{{ auth.user?.nom?.[0] }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-900 truncate">{{ auth.user?.prenom }} {{ auth.user?.nom }}</div>
            <div class="text-xs text-gray-500 truncate">{{ auth.user?.email }}</div>
          </div>
        </router-link>
        <button @click="logout" class="mt-1 w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <span>🚪</span> Déconnexion
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 ml-64 flex flex-col min-h-screen">
      <!-- Top bar -->
      <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 class="text-lg font-semibold text-gray-900"></h1>
        <div class="flex items-center gap-3">
          <NotificationBell />
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
