<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();
const stats = ref({ rdv_today: 0, consultations: 0, patients: 0, urgences: 0 });
const rdvsAujourdhui = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const [rdvs, consultations, urgences] = await Promise.all([
      api.get('/rdv'),
      api.get('/consultations'),
      api.get('/urgences'),
    ]);
    const today = new Date().toDateString();
    rdvsAujourdhui.value = rdvs
      .filter((r) => new Date(r.date_rdv).toDateString() === today && r.statut !== 'annule')
      .sort((a, b) => new Date(a.date_rdv) - new Date(b.date_rdv))
      .slice(0, 5);
    stats.value = {
      rdv_today: rdvsAujourdhui.value.length,
      consultations: consultations.length,
      patients: new Set(rdvs.map((r) => r.id_patient)).size,
      urgences: urgences.filter((u) => u.statut === 'en_attente').length,
    };
  } finally { loading.value = false; }
});

const statutColor = { en_attente: 'badge-yellow', confirme: 'badge-green', termine: 'badge-gray', annule: 'badge-red' };
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Bonjour, Dr {{ auth.user?.nom }}</h2>
        <p class="text-gray-500 text-sm">{{ new Date().toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long' }) }}</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card text-center">
          <div class="text-3xl font-bold text-blue-600">{{ stats.rdv_today }}</div>
          <div class="text-sm text-gray-500 mt-1">RDV aujourd'hui</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-green-600">{{ stats.consultations }}</div>
          <div class="text-sm text-gray-500 mt-1">Consultations</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-purple-600">{{ stats.patients }}</div>
          <div class="text-sm text-gray-500 mt-1">Patients uniques</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-red-600">{{ stats.urgences }}</div>
          <div class="text-sm text-gray-500 mt-1">Urgences en attente</div>
        </div>
      </div>

      <!-- RDV du jour -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900">RDV d'aujourd'hui</h3>
          <router-link to="/medecin/rdv" class="text-sm text-green-600 hover:underline">Voir tous →</router-link>
        </div>
        <div v-if="loading" class="py-6 text-center text-gray-400">Chargement...</div>
        <div v-else-if="rdvsAujourdhui.length === 0" class="py-6 text-center text-gray-400">Aucun RDV aujourd'hui</div>
        <div v-else class="space-y-3">
          <div v-for="r in rdvsAujourdhui" :key="r.id_rdv" class="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
            <div class="text-center min-w-16">
              <div class="text-lg font-bold text-gray-900">{{ new Date(r.date_rdv).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' }) }}</div>
            </div>
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ r.patient?.utilisateur?.prenom }} {{ r.patient?.utilisateur?.nom }}</div>
              <div class="text-sm text-gray-500">{{ r.motif || 'Consultation générale' }}</div>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge" :class="r.type_rdv === 'teleconsultation' ? 'badge-blue' : 'badge-gray'">{{ r.type_rdv }}</span>
              <span class="badge" :class="statutColor[r.statut] || 'badge-gray'">{{ r.statut }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Accès rapides -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <router-link to="/medecin/consultations/nouvelle" class="card text-center hover:shadow-md transition-shadow cursor-pointer">
          <div class="text-2xl mb-2">🩺</div>
          <div class="text-sm font-medium">Nouvelle consultation</div>
        </router-link>
        <router-link to="/medecin/ordonnances" class="card text-center hover:shadow-md transition-shadow cursor-pointer">
          <div class="text-2xl mb-2">💊</div>
          <div class="text-sm font-medium">Ordonnances</div>
        </router-link>
        <router-link to="/medecin/urgences" class="card text-center hover:shadow-md transition-shadow cursor-pointer">
          <div class="text-2xl mb-2">🚨</div>
          <div class="text-sm font-medium">Urgences</div>
        </router-link>
        <router-link to="/medecin/disponibilites" class="card text-center hover:shadow-md transition-shadow cursor-pointer">
          <div class="text-2xl mb-2">🗓️</div>
          <div class="text-sm font-medium">Disponibilités</div>
        </router-link>
      </div>
    </div>
  </AppLayout>
</template>
