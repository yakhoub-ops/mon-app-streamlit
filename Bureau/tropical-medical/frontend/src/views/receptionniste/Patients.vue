<script setup>
import { ref, onMounted, computed } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const patients = ref([]);
const loading = ref(true);
const search = ref('');

onMounted(async () => {
  patients.value = await api.get('/patients');
  loading.value = false;
});

const filtered = computed(() => {
  const q = search.value.toLowerCase();
  return patients.value.filter((p) =>
    `${p.utilisateur?.nom} ${p.utilisateur?.prenom} ${p.numero_dossier || ''}`.toLowerCase().includes(q)
  );
});
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <h2 class="text-2xl font-bold text-gray-900">Patients</h2>
      <div class="card">
        <input v-model="search" placeholder="Rechercher..." class="input mb-4" />
        <div v-if="loading" class="py-8 text-center text-gray-400">Chargement...</div>
        <div v-else class="space-y-2">
          <div v-for="p in filtered" :key="p.id_patient"
            class="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50">
            <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
              {{ p.utilisateur?.prenom?.[0] }}{{ p.utilisateur?.nom?.[0] }}
            </div>
            <div class="flex-1">
              <div class="font-semibold">{{ p.utilisateur?.prenom }} {{ p.utilisateur?.nom }}</div>
              <div class="text-sm text-gray-500">{{ p.numero_dossier || '—' }} · {{ p.utilisateur?.telephone }}</div>
            </div>
            <div class="text-sm text-gray-400">
              <span v-if="p.groupe_sanguin" class="badge badge-red mr-2">{{ p.groupe_sanguin }}</span>
            </div>
          </div>
          <div v-if="filtered.length === 0" class="py-8 text-center text-gray-400">Aucun patient</div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
