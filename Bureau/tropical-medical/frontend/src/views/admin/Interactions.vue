<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const interactions = ref([]);
const medicaments = ref([]);
const loading = ref(true);
const showModal = ref(false);
const form = ref({ id_medicament_a: '', id_medicament_b: '', niveau: 'modere', description: '' });
const saving = ref(false);

const niveauColors = { faible: 'badge-green', modere: 'badge-yellow', eleve: 'badge-red', contrindication: 'badge-red' };

onMounted(async () => {
  [interactions.value, medicaments.value] = await Promise.all([
    api.get('/interactions'),
    api.get('/ordonnances/medicaments'),
  ]);
  loading.value = false;
});

const create = async () => {
  saving.value = true;
  try {
    await api.post('/interactions', form.value);
    interactions.value = await api.get('/interactions');
    showModal.value = false;
    form.value = { id_medicament_a: '', id_medicament_b: '', niveau: 'modere', description: '' };
  } finally { saving.value = false; }
};

const remove = async (id) => {
  if (!confirm('Supprimer ?')) return;
  await api.delete(`/interactions/${id}`);
  interactions.value = interactions.value.filter((i) => i.id_interaction !== id);
};
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">Interactions médicamenteuses</h2>
        <button @click="showModal = true" class="btn btn-primary">+ Nouvelle</button>
      </div>
      <div class="card">
        <div v-if="loading" class="py-8 text-center text-gray-400">Chargement...</div>
        <table v-else class="table-auto w-full">
          <thead><tr><th>Médicament A</th><th>Médicament B</th><th>Niveau</th><th>Description</th><th></th></tr></thead>
          <tbody>
            <tr v-for="i in interactions" :key="i.id_interaction">
              <td class="font-medium">{{ i.medicament_a?.nom }}</td>
              <td class="font-medium">{{ i.medicament_b?.nom }}</td>
              <td><span class="badge" :class="niveauColors[i.niveau]">{{ i.niveau }}</span></td>
              <td class="text-gray-500 max-w-xs truncate">{{ i.description || '—' }}</td>
              <td><button @click="remove(i.id_interaction)" class="text-xs text-red-500 hover:underline">Supprimer</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold mb-4">Nouvelle interaction</h3>
        <form @submit.prevent="create" class="space-y-3">
          <div><label class="text-xs font-medium text-gray-600">Médicament A</label>
            <select v-model.number="form.id_medicament_a" required class="input mt-1">
              <option value="">Choisir...</option>
              <option v-for="m in medicaments" :key="m.id_medicament" :value="m.id_medicament">{{ m.nom }}</option>
            </select></div>
          <div><label class="text-xs font-medium text-gray-600">Médicament B</label>
            <select v-model.number="form.id_medicament_b" required class="input mt-1">
              <option value="">Choisir...</option>
              <option v-for="m in medicaments" :key="m.id_medicament" :value="m.id_medicament">{{ m.nom }}</option>
            </select></div>
          <div><label class="text-xs font-medium text-gray-600">Niveau</label>
            <select v-model="form.niveau" class="input mt-1">
              <option value="faible">Faible</option>
              <option value="modere">Modéré</option>
              <option value="eleve">Élevé</option>
              <option value="contrindication">Contre-indication</option>
            </select></div>
          <div><label class="text-xs font-medium text-gray-600">Description</label>
            <textarea v-model="form.description" rows="2" class="input mt-1"></textarea></div>
          <div class="flex gap-2 pt-2">
            <button type="button" @click="showModal = false" class="btn btn-outline flex-1">Annuler</button>
            <button type="submit" :disabled="saving" class="btn btn-primary flex-1">{{ saving ? '...' : 'Créer' }}</button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>
