<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const actualites = ref([]);
const loading = ref(true);

onMounted(async () => {
  actualites.value = await api.get('/actualites');
  loading.value = false;
});

const typeIcon = { stock_entree: '📦', stock_alerte: '⚠️', stock_peremption: '🗓️', conseil: '💡', annonce: '📢' };
const typeColor = { stock_alerte: 'badge-red', stock_peremption: 'badge-yellow', stock_entree: 'badge-green', conseil: 'badge-blue', annonce: 'badge-gray' };
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <h2 class="text-2xl font-bold text-gray-900">Actualités santé</h2>
      <div v-if="loading" class="card py-8 text-center text-gray-400">Chargement...</div>
      <div v-else class="space-y-3">
        <div v-for="a in actualites" :key="a.id_actualite" class="card">
          <div class="flex items-start gap-3">
            <span class="text-2xl flex-shrink-0">{{ typeIcon[a.type] }}</span>
            <div class="flex-1">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <h3 class="font-semibold text-gray-900">{{ a.titre }}</h3>
                <span class="badge" :class="typeColor[a.type]">{{ a.type }}</span>
              </div>
              <p v-if="a.contenu" class="text-sm text-gray-600">{{ a.contenu }}</p>
              <p class="text-xs text-gray-400 mt-2">{{ new Date(a.created_at).toLocaleDateString('fr', { day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
            </div>
          </div>
        </div>
        <div v-if="actualites.length === 0" class="card py-8 text-center text-gray-400">Aucune actualité</div>
      </div>
    </div>
  </AppLayout>
</template>
