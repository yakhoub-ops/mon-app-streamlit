<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const stats = ref({ users: 0, medecins: 0, patients: 0, assurances: 0 });
const loading = ref(true);

onMounted(async () => {
  try {
    const [users, medecins, patients, assurances] = await Promise.all([
      api.get('/utilisateurs'),
      api.get('/medecins'),
      api.get('/patients'),
      api.get('/assurances'),
    ]);
    stats.value = {
      users: users.length,
      medecins: medecins.length,
      patients: patients.length,
      assurances: assurances.length,
    };
  } finally {
    loading.value = false;
  }
});

const cards = [
  { label: 'Utilisateurs', key: 'users', icon: '👤', color: 'bg-blue-50 text-blue-700', link: '/admin/utilisateurs' },
  { label: 'Médecins', key: 'medecins', icon: '🩺', color: 'bg-green-50 text-green-700', link: '/admin/utilisateurs' },
  { label: 'Patients', key: 'patients', icon: '👥', color: 'bg-purple-50 text-purple-700', link: '/admin/utilisateurs' },
  { label: 'Assurances', key: 'assurances', icon: '🛡️', color: 'bg-yellow-50 text-yellow-700', link: '/admin/assurances' },
];
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Tableau de bord Admin</h2>
        <p class="text-gray-500 text-sm mt-1">Vue d'ensemble de la plateforme</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <router-link v-for="c in cards" :key="c.key" :to="c.link"
          class="card hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" :class="c.color">{{ c.icon }}</div>
            <div>
              <div class="text-2xl font-bold text-gray-900">{{ loading ? '...' : stats[c.key] }}</div>
              <div class="text-sm text-gray-500">{{ c.label }}</div>
            </div>
          </div>
        </router-link>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4">Accès rapides</h3>
          <div class="space-y-2">
            <router-link to="/admin/utilisateurs" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span class="text-xl">👤</span>
              <div>
                <div class="text-sm font-medium text-gray-900">Gestion des utilisateurs</div>
                <div class="text-xs text-gray-500">Créer, modifier, activer/désactiver</div>
              </div>
            </router-link>
            <router-link to="/admin/assurances" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span class="text-xl">🛡️</span>
              <div>
                <div class="text-sm font-medium text-gray-900">Assurances & mutuelles</div>
                <div class="text-xs text-gray-500">Taux de prise en charge</div>
              </div>
            </router-link>
            <router-link to="/admin/interactions" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span class="text-xl">⚠️</span>
              <div>
                <div class="text-sm font-medium text-gray-900">Interactions médicamenteuses</div>
                <div class="text-xs text-gray-500">Base de données des interactions</div>
              </div>
            </router-link>
          </div>
        </div>

        <div class="card">
          <h3 class="font-semibold text-gray-900 mb-4">Informations système</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Version</span>
              <span class="text-sm font-medium">v3.0 — Vue 3 + Prisma</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Base de données</span>
              <span class="badge badge-green">MySQL connectée</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Backend</span>
              <span class="badge badge-green">En ligne</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
