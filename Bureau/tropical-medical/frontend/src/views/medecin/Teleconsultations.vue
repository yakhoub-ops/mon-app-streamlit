<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const list = ref([]);
const loading = ref(true);

onMounted(async () => {
  list.value = await api.get('/teleconsultations');
  loading.value = false;
});

const start = async (id) => {
  await api.patch(`/teleconsultations/${id}/statut`, { statut: 'en_cours' });
  list.value = list.value.map((t) => t.id_teleconsult === id ? { ...t, statut: 'en_cours' } : t);
};

const end = async (id) => {
  await api.patch(`/teleconsultations/${id}/statut`, { statut: 'terminee' });
  list.value = list.value.map((t) => t.id_teleconsult === id ? { ...t, statut: 'terminee' } : t);
};

const statutColor = { planifiee: 'badge-yellow', en_cours: 'badge-blue', terminee: 'badge-green', annulee: 'badge-red' };
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <h2 class="text-2xl font-bold text-gray-900">Téléconsultations</h2>
      <div class="card">
        <div v-if="loading" class="py-8 text-center text-gray-400">Chargement...</div>
        <div v-else class="space-y-3">
          <div v-for="t in list" :key="t.id_teleconsult"
            class="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50">
            <div class="flex-1">
              <div class="font-semibold">{{ t.patient?.utilisateur?.prenom }} {{ t.patient?.utilisateur?.nom }}</div>
              <div class="text-sm text-gray-500">{{ new Date(t.created_at).toLocaleDateString('fr') }}</div>
              <span class="badge mt-1" :class="statutColor[t.statut]">{{ t.statut }}</span>
            </div>
            <div class="flex gap-2">
              <a v-if="t.lien_session" :href="t.lien_session" target="_blank" class="btn btn-outline text-xs py-1">💻 Rejoindre</a>
              <button v-if="t.statut === 'planifiee'" @click="start(t.id_teleconsult)" class="btn btn-primary text-xs py-1">Démarrer</button>
              <button v-if="t.statut === 'en_cours'" @click="end(t.id_teleconsult)" class="btn btn-outline text-xs py-1">Terminer</button>
            </div>
          </div>
          <div v-if="list.length === 0" class="py-8 text-center text-gray-400">Aucune téléconsultation</div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
