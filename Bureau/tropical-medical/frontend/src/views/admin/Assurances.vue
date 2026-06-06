<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const assurances = ref([]);
const loading = ref(true);
const showModal = ref(false);
const form = ref({ nom: '', code: '', taux_prise_en_charge: 80, description: '' });
const saving = ref(false);
const error = ref('');

onMounted(load);

async function load() {
  loading.value = true;
  try { assurances.value = await api.get('/assurances'); } finally { loading.value = false; }
}

const create = async () => {
  saving.value = true; error.value = '';
  try {
    await api.post('/assurances', form.value);
    await load();
    showModal.value = false;
    form.value = { nom: '', code: '', taux_prise_en_charge: 80, description: '' };
  } catch (e) { error.value = e.message; } finally { saving.value = false; }
};

const remove = async (id) => {
  if (!confirm('Supprimer cette assurance ?')) return;
  await api.delete(`/assurances/${id}`);
  await load();
};
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">Assurances & Mutuelles</h2>
        <button @click="showModal = true" class="btn btn-primary">+ Nouvelle</button>
      </div>
      <div class="card">
        <div v-if="loading" class="py-8 text-center text-gray-400">Chargement...</div>
        <table v-else class="table-auto w-full">
          <thead><tr><th>Nom</th><th>Code</th><th>Taux PEC</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="a in assurances" :key="a.id_assurance">
              <td class="font-medium">{{ a.nom }}</td>
              <td class="text-gray-500">{{ a.code || '—' }}</td>
              <td><span class="font-semibold text-green-600">{{ a.taux_prise_en_charge }}%</span></td>
              <td><span class="badge" :class="a.actif ? 'badge-green' : 'badge-red'">{{ a.actif ? 'Active' : 'Inactive' }}</span></td>
              <td>
                <button @click="remove(a.id_assurance)" class="text-xs text-red-500 hover:underline">Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold mb-4">Nouvelle assurance</h3>
        <form @submit.prevent="create" class="space-y-3">
          <div><label class="text-xs font-medium text-gray-600">Nom</label><input v-model="form.nom" required class="input mt-1" /></div>
          <div><label class="text-xs font-medium text-gray-600">Code</label><input v-model="form.code" class="input mt-1" /></div>
          <div><label class="text-xs font-medium text-gray-600">Taux de prise en charge (%)</label>
            <input v-model.number="form.taux_prise_en_charge" type="number" min="0" max="100" required class="input mt-1" /></div>
          <div><label class="text-xs font-medium text-gray-600">Description</label>
            <textarea v-model="form.description" rows="2" class="input mt-1"></textarea></div>
          <div v-if="error" class="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{{ error }}</div>
          <div class="flex gap-2 pt-2">
            <button type="button" @click="showModal = false" class="btn btn-outline flex-1">Annuler</button>
            <button type="submit" :disabled="saving" class="btn btn-primary flex-1">{{ saving ? '...' : 'Créer' }}</button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>
