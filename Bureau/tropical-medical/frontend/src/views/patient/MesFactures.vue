<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const factures = ref([]);
const loading = ref(true);

onMounted(async () => {
  factures.value = await api.get('/factures');
  loading.value = false;
});

const statutColor = { en_attente: 'badge-yellow', partiellement_paye: 'badge-blue', paye: 'badge-green', annule: 'badge-red' };
const fmt = (n) => Number(n).toLocaleString('fr') + ' FCFA';
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <h2 class="text-2xl font-bold text-gray-900">Mes factures</h2>
      <div class="card">
        <div v-if="loading" class="py-8 text-center text-gray-400">Chargement...</div>
        <div v-else class="space-y-3">
          <div v-for="f in factures" :key="f.id_facture"
            class="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50">
            <div class="text-3xl">🧾</div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <div class="font-semibold">Facture #{{ f.id_facture }}</div>
                <span class="badge" :class="statutColor[f.statut]">{{ f.statut }}</span>
              </div>
              <div class="text-sm text-gray-500 mt-1">{{ new Date(f.date_emission).toLocaleDateString('fr') }}</div>
              <div class="flex gap-4 mt-2 text-sm">
                <span>Total : <strong>{{ fmt(f.montant_total) }}</strong></span>
                <span v-if="f.id_assurance">Assurance : <strong class="text-green-600">{{ fmt(f.part_assurance) }}</strong></span>
                <span>À payer : <strong class="text-orange-600">{{ fmt(f.part_patient) }}</strong></span>
              </div>
            </div>
          </div>
          <div v-if="factures.length === 0" class="py-8 text-center text-gray-400">Aucune facture</div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
