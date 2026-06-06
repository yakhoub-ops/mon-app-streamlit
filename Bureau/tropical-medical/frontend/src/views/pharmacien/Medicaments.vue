<script setup>
import { ref, onMounted, computed } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const medicaments = ref([]);
const loading = ref(true);
const search = ref('');
const showModal = ref(false);
const form = ref({ nom: '', dci: '', forme: 'comprime', dosage: '', description: '' });
const saving = ref(false);

onMounted(async () => {
  medicaments.value = await api.get('/ordonnances/medicaments');
  loading.value = false;
});

const filtered = computed(() => {
  const q = search.value.toLowerCase();
  return medicaments.value.filter((m) => `${m.nom} ${m.dci || ''}`.toLowerCase().includes(q));
});

const create = async () => {
  saving.value = true;
  try {
    await api.post('/ordonnances/medicaments', form.value);
    medicaments.value = await api.get('/ordonnances/medicaments');
    showModal.value = false;
    form.value = { nom: '', dci: '', forme: 'comprime', dosage: '', description: '' };
  } finally { saving.value = false; }
};

const formeIcon = { comprime: '💊', sirop: '🧴', injectable: '💉', creme: '🧴', gouttes: '💧', poudre: '⚗️', autre: '🏥' };
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">Médicaments</h2>
        <button @click="showModal = true" class="btn btn-primary">+ Nouveau</button>
      </div>
      <div class="card">
        <input v-model="search" placeholder="Rechercher..." class="input mb-4" />
        <div v-if="loading" class="py-8 text-center text-gray-400">Chargement...</div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-for="m in filtered" :key="m.id_medicament" class="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
            <span class="text-2xl">{{ formeIcon[m.forme] || '💊' }}</span>
            <div>
              <div class="font-medium">{{ m.nom }}</div>
              <div class="text-xs text-gray-500">{{ m.dci || '—' }} · {{ m.forme }} {{ m.dosage ? '· ' + m.dosage : '' }}</div>
            </div>
          </div>
          <div v-if="filtered.length === 0" class="col-span-2 py-8 text-center text-gray-400">Aucun médicament</div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold mb-4">Nouveau médicament</h3>
        <form @submit.prevent="create" class="space-y-3">
          <div><label class="text-xs font-medium text-gray-600">Nom *</label><input v-model="form.nom" required class="input mt-1" /></div>
          <div><label class="text-xs font-medium text-gray-600">DCI</label><input v-model="form.dci" class="input mt-1" /></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-medium text-gray-600">Forme</label>
              <select v-model="form.forme" class="input mt-1">
                <option v-for="f in ['comprime','sirop','injectable','creme','gouttes','poudre','autre']" :key="f" :value="f">{{ f }}</option>
              </select></div>
            <div><label class="text-xs font-medium text-gray-600">Dosage</label><input v-model="form.dosage" class="input mt-1" /></div>
          </div>
          <div class="flex gap-2 pt-2">
            <button type="button" @click="showModal = false" class="btn btn-outline flex-1">Annuler</button>
            <button type="submit" :disabled="saving" class="btn btn-primary flex-1">Créer</button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>
