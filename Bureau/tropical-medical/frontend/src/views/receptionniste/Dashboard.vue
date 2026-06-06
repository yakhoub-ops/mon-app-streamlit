<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const stats = ref({ file_attente: 0, urgences: 0, rdv_today: 0 });
const loading = ref(true);

onMounted(async () => {
  try {
    const [file, urgences, rdvs] = await Promise.all([
      api.get('/file-attente'),
      api.get('/urgences'),
      api.get('/rdv'),
    ]);
    const today = new Date().toDateString();
    stats.value = {
      file_attente: file.filter((f) => f.statut === 'en_attente').length,
      urgences: urgences.filter((u) => u.statut === 'en_attente').length,
      rdv_today: rdvs.filter((r) => new Date(r.date_rdv).toDateString() === today).length,
    };
  } finally { loading.value = false; }
});
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-900">Accueil / Réception</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <router-link to="/receptionniste/file-attente" class="card text-center hover:shadow-md transition-shadow">
          <div class="text-3xl font-bold text-orange-500">{{ loading ? '...' : stats.file_attente }}</div>
          <div class="text-sm text-gray-500 mt-1">En attente</div>
          <div class="text-2xl mt-2">⏳</div>
        </router-link>
        <router-link to="/receptionniste/urgences" class="card text-center hover:shadow-md transition-shadow">
          <div class="text-3xl font-bold text-red-600">{{ loading ? '...' : stats.urgences }}</div>
          <div class="text-sm text-gray-500 mt-1">Urgences</div>
          <div class="text-2xl mt-2">🚨</div>
        </router-link>
        <div class="card text-center">
          <div class="text-3xl font-bold text-blue-600">{{ loading ? '...' : stats.rdv_today }}</div>
          <div class="text-sm text-gray-500 mt-1">RDV aujourd'hui</div>
          <div class="text-2xl mt-2">📅</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <router-link to="/receptionniste/file-attente" class="card text-center hover:shadow-md">
          <div class="text-2xl mb-2">⏳</div><div class="text-sm font-medium">File d'attente</div>
        </router-link>
        <router-link to="/receptionniste/urgences" class="card text-center hover:shadow-md">
          <div class="text-2xl mb-2">🚨</div><div class="text-sm font-medium">Urgences</div>
        </router-link>
        <router-link to="/receptionniste/facturation" class="card text-center hover:shadow-md">
          <div class="text-2xl mb-2">🧾</div><div class="text-sm font-medium">Facturation</div>
        </router-link>
        <router-link to="/receptionniste/patients" class="card text-center hover:shadow-md">
          <div class="text-2xl mb-2">👥</div><div class="text-sm font-medium">Patients</div>
        </router-link>
      </div>
    </div>
  </AppLayout>
</template>
