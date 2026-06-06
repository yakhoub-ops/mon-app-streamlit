<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const consultations = ref([]);
const loading = ref(true);

onMounted(async () => {
  consultations.value = await api.get('/consultations');
  loading.value = false;
});

const terminer = async (id) => {
  await api.put(`/consultations/${id}`, { statut: 'terminee' });
  consultations.value = consultations.value.map((c) => c.id_consultation === id ? { ...c, statut: 'terminee' } : c);
};
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">Consultations</h2>
        <router-link to="/medecin/consultations/nouvelle" class="btn btn-primary">+ Nouvelle</router-link>
      </div>
      <div class="card">
        <div v-if="loading" class="py-8 text-center text-gray-400">Chargement...</div>
        <div v-else class="space-y-3">
          <div v-for="c in consultations" :key="c.id_consultation"
            class="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50">
            <div class="min-w-20 text-center">
              <div class="text-sm font-bold">{{ new Date(c.date_consultation).toLocaleDateString('fr') }}</div>
              <span class="badge" :class="c.statut === 'terminee' ? 'badge-green' : 'badge-yellow'">{{ c.statut }}</span>
            </div>
            <div class="flex-1">
              <div class="font-semibold">{{ c.patient?.utilisateur?.prenom }} {{ c.patient?.utilisateur?.nom }}</div>
              <div class="text-sm text-gray-600 mt-1">{{ c.motif || '—' }}</div>
              <div v-if="c.diagnostic" class="text-sm text-gray-500 mt-1">🩺 {{ c.diagnostic }}</div>
            </div>
            <div class="flex gap-2">
              <router-link v-if="c.statut === 'en_cours'" :to="`/medecin/ordonnances?consultation=${c.id_consultation}&patient=${c.id_patient}`"
                class="btn btn-outline text-xs py-1 px-2">Ordonnance</router-link>
              <button v-if="c.statut === 'en_cours'" @click="terminer(c.id_consultation)"
                class="btn btn-primary text-xs py-1 px-2">Terminer</button>
            </div>
          </div>
          <div v-if="consultations.length === 0" class="py-8 text-center text-gray-400">Aucune consultation</div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
