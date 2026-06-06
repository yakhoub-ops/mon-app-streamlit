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

const statutColor = { active: 'badge-green', delivree: 'badge-blue', expiree: 'badge-gray', annulee: 'badge-red' };
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <h2 class="text-2xl font-bold text-gray-900">Mes ordonnances</h2>
      <div class="card">
        <div v-if="loading" class="py-8 text-center text-gray-400">Chargement...</div>
        <div v-else class="space-y-4">
          <div v-for="o in ordonnances" :key="o.id_ordonnance"
            class="border border-gray-100 rounded-xl p-4">
            <div class="flex justify-between items-start mb-3">
              <div>
                <div class="font-semibold">Dr {{ o.medecin?.utilisateur?.prenom }} {{ o.medecin?.utilisateur?.nom }}</div>
                <div class="text-sm text-gray-500">{{ new Date(o.date_emission).toLocaleDateString('fr') }}</div>
              </div>
              <span class="badge" :class="statutColor[o.statut]">{{ o.statut }}</span>
            </div>
            <div class="space-y-2">
              <div v-for="l in o.lignes" :key="l.id_ligne" class="flex items-start gap-3 text-sm bg-gray-50 rounded-lg p-2">
                <span class="text-lg">💊</span>
                <div>
                  <div class="font-medium">{{ l.medicament?.nom }}</div>
                  <div class="text-gray-500">{{ l.posologie }} · {{ l.duree }}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="ordonnances.length === 0" class="py-8 text-center text-gray-400">Aucune ordonnance</div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
