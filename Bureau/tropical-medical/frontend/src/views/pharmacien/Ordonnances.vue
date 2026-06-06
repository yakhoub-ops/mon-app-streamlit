<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const ordonnances = ref([]);
const loading = ref(true);

onMounted(async () => {
  ordonnances.value = await api.get('/ordonnances');
  loading.value = false;
});

const delivrer = async (id) => {
  await api.patch(`/ordonnances/${id}/statut`, { statut: 'delivree' });
  ordonnances.value = ordonnances.value.map((o) => o.id_ordonnance === id ? { ...o, statut: 'delivree' } : o);
};

const statutColor = { active: 'badge-green', delivree: 'badge-blue', expiree: 'badge-gray', annulee: 'badge-red' };
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <h2 class="text-2xl font-bold text-gray-900">Ordonnances à délivrer</h2>
      <div class="card">
        <div v-if="loading" class="py-8 text-center text-gray-400">Chargement...</div>
        <div v-else class="space-y-3">
          <div v-for="o in ordonnances" :key="o.id_ordonnance"
            class="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <div class="font-semibold">{{ o.patient?.utilisateur?.prenom }} {{ o.patient?.utilisateur?.nom }}</div>
                <span class="badge" :class="statutColor[o.statut]">{{ o.statut }}</span>
              </div>
              <div class="text-sm text-gray-500">Dr {{ o.medecin?.utilisateur?.nom }} · {{ new Date(o.date_emission).toLocaleDateString('fr') }}</div>
              <div class="flex flex-wrap gap-1 mt-2">
                <span v-for="l in o.lignes" :key="l.id_ligne" class="badge badge-gray">{{ l.medicament?.nom }} × {{ l.quantite }}</span>
              </div>
            </div>
            <button v-if="o.statut === 'active'" @click="delivrer(o.id_ordonnance)"
              class="btn btn-primary text-xs py-1">✓ Délivrer</button>
          </div>
          <div v-if="ordonnances.length === 0" class="py-8 text-center text-gray-400">Aucune ordonnance</div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
