<script setup>
import { ref, onMounted, computed } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const stock = ref([]);
const medicaments = ref([]);
const alertes = ref([]);
const loading = ref(true);
const search = ref('');
const showModal = ref(false);
const showMvt = ref(false);
const selectedStock = ref(null);
const saving = ref(false);

const form = ref({ id_medicament: '', quantite: 0, seuil_alerte: 10, prix_unitaire: 0, lot: '', date_peremption: '' });
const mvtForm = ref({ type: 'entree', quantite: 1, motif: '' });

onMounted(async () => {
  [stock.value, medicaments.value, alertes.value] = await Promise.all([
    api.get('/stock'),
    api.get('/ordonnances/medicaments'),
    api.get('/stock/alertes'),
  ]);
  loading.value = false;
});

const filtered = computed(() => {
  const q = search.value.toLowerCase();
  return stock.value.filter((s) => s.medicament?.nom?.toLowerCase().includes(q));
});

const create = async () => {
  saving.value = true;
  try {
    await api.post('/stock', form.value);
    stock.value = await api.get('/stock');
    alertes.value = await api.get('/stock/alertes');
    showModal.value = false;
    form.value = { id_medicament: '', quantite: 0, seuil_alerte: 10, prix_unitaire: 0, lot: '', date_peremption: '' };
  } finally { saving.value = false; }
};

const mouvement = async () => {
  saving.value = true;
  try {
    await api.post(`/stock/${selectedStock.value.id_stock}/mouvement`, mvtForm.value);
    stock.value = await api.get('/stock');
    alertes.value = await api.get('/stock/alertes');
    showMvt.value = false;
    mvtForm.value = { type: 'entree', quantite: 1, motif: '' };
  } finally { saving.value = false; }
};

const isAlerte = (s) => alertes.value.some((a) => a.id_stock === s.id_stock);
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">Stock pharmacie</h2>
        <button @click="showModal = true" class="btn btn-primary">+ Entrée stock</button>
      </div>

      <!-- Alertes -->
      <div v-if="alertes.length > 0" class="card border-l-4 border-l-red-500">
        <div class="flex items-center gap-2 mb-2"><span class="text-xl">⚠️</span><strong class="text-red-600">{{ alertes.length }} alerte(s) stock</strong></div>
        <div class="flex flex-wrap gap-2">
          <span v-for="a in alertes.slice(0, 5)" :key="a.id_stock" class="badge badge-red">{{ a.medicament?.nom || a.medicament_nom }}</span>
          <span v-if="alertes.length > 5" class="badge badge-gray">+{{ alertes.length - 5 }}</span>
        </div>
      </div>

      <div class="card">
        <input v-model="search" placeholder="Rechercher un médicament..." class="input mb-4" />
        <div v-if="loading" class="py-8 text-center text-gray-400">Chargement...</div>
        <table v-else class="table-auto w-full">
          <thead><tr><th>Médicament</th><th>Quantité</th><th>Seuil</th><th>Prix unitaire</th><th>Péremption</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="s in filtered" :key="s.id_stock" :class="{ 'bg-red-50': isAlerte(s) }">
              <td class="font-medium">
                <span v-if="isAlerte(s)" class="mr-1">⚠️</span>{{ s.medicament?.nom }}
              </td>
              <td>
                <span :class="s.quantite <= s.seuil_alerte ? 'text-red-600 font-bold' : 'text-gray-900'">{{ s.quantite }}</span>
              </td>
              <td class="text-gray-500">{{ s.seuil_alerte }}</td>
              <td>{{ Number(s.prix_unitaire).toLocaleString('fr') }} FCFA</td>
              <td class="text-sm text-gray-500">{{ s.date_peremption ? new Date(s.date_peremption).toLocaleDateString('fr') : '—' }}</td>
              <td>
                <button @click="selectedStock = s; showMvt = true" class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Mouvement</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal entrée stock -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold mb-4">Entrée stock</h3>
        <form @submit.prevent="create" class="space-y-3">
          <div><label class="text-xs font-medium text-gray-600">Médicament</label>
            <select v-model.number="form.id_medicament" required class="input mt-1">
              <option value="">Choisir...</option>
              <option v-for="m in medicaments" :key="m.id_medicament" :value="m.id_medicament">{{ m.nom }}</option>
            </select></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-medium text-gray-600">Quantité</label><input v-model.number="form.quantite" type="number" required class="input mt-1" /></div>
            <div><label class="text-xs font-medium text-gray-600">Seuil alerte</label><input v-model.number="form.seuil_alerte" type="number" class="input mt-1" /></div>
            <div><label class="text-xs font-medium text-gray-600">Prix unitaire</label><input v-model.number="form.prix_unitaire" type="number" class="input mt-1" /></div>
            <div><label class="text-xs font-medium text-gray-600">Lot</label><input v-model="form.lot" class="input mt-1" /></div>
          </div>
          <div><label class="text-xs font-medium text-gray-600">Date de péremption</label><input v-model="form.date_peremption" type="date" class="input mt-1" /></div>
          <div class="flex gap-2 pt-2">
            <button type="button" @click="showModal = false" class="btn btn-outline flex-1">Annuler</button>
            <button type="submit" :disabled="saving" class="btn btn-primary flex-1">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal mouvement -->
    <div v-if="showMvt" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 class="text-lg font-bold mb-2">Mouvement — {{ selectedStock?.medicament?.nom }}</h3>
        <p class="text-sm text-gray-500 mb-4">Stock actuel : {{ selectedStock?.quantite }}</p>
        <form @submit.prevent="mouvement" class="space-y-3">
          <div><label class="text-xs font-medium text-gray-600">Type</label>
            <select v-model="mvtForm.type" class="input mt-1">
              <option value="entree">Entrée</option>
              <option value="sortie">Sortie</option>
              <option value="ajustement">Ajustement</option>
            </select></div>
          <div><label class="text-xs font-medium text-gray-600">Quantité</label><input v-model.number="mvtForm.quantite" type="number" min="1" required class="input mt-1" /></div>
          <div><label class="text-xs font-medium text-gray-600">Motif</label><input v-model="mvtForm.motif" class="input mt-1" /></div>
          <div class="flex gap-2 pt-2">
            <button type="button" @click="showMvt = false" class="btn btn-outline flex-1">Annuler</button>
            <button type="submit" :disabled="saving" class="btn btn-primary flex-1">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>
