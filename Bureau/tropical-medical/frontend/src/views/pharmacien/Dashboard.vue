<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const stats = ref({ stock: 0, alertes: 0, ordonnances: 0 });
const loading = ref(true);

onMounted(async () => {
  try {
    const [stock, alertes, ordonnances] = await Promise.all([
      api.get('/stock'),
      api.get('/stock/alertes'),
      api.get('/ordonnances'),
    ]);
    stats.value = {
      stock: stock.length,
      alertes: alertes.length,
      ordonnances: ordonnances.filter((o) => o.statut === 'active').length,
    };
  } finally { loading.value = false; }
});
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-900">Pharmacie</h2>
      <div class="grid grid-cols-3 gap-4">
        <div class="card text-center">
          <div class="text-3xl font-bold text-blue-600">{{ loading ? '...' : stats.stock }}</div>
          <div class="text-sm text-gray-500 mt-1">Références en stock</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-red-500">{{ loading ? '...' : stats.alertes }}</div>
          <div class="text-sm text-gray-500 mt-1">Alertes stock</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-green-600">{{ loading ? '...' : stats.ordonnances }}</div>
          <div class="text-sm text-gray-500 mt-1">Ordonnances actives</div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <router-link to="/pharmacien/stock" class="card text-center hover:shadow-md">
          <div class="text-2xl mb-2">📦</div><div class="text-sm font-medium">Gérer le stock</div>
        </router-link>
        <router-link to="/pharmacien/ordonnances" class="card text-center hover:shadow-md">
          <div class="text-2xl mb-2">💊</div><div class="text-sm font-medium">Ordonnances</div>
        </router-link>
        <router-link to="/pharmacien/medicaments" class="card text-center hover:shadow-md">
          <div class="text-2xl mb-2">🏥</div><div class="text-sm font-medium">Médicaments</div>
        </router-link>
      </div>
    </div>
  </AppLayout>
</template>
