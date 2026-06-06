<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const factures = ref([]);
const patients = ref([]);
const assurances = ref([]);
const stats = ref({});
const loading = ref(true);
const showModal = ref(false);
const showPaiement = ref(false);
const selectedFacture = ref(null);
const saving = ref(false);
const error = ref('');

const form = ref({
  id_patient: '', id_consultation: null, id_assurance: null, taux_assurance: null,
  mode_paiement: 'especes', notes: '',
  lignes: [{ description: '', quantite: 1, prix_unitaire: 0 }],
});
const paiementForm = ref({ montant_paye: 0, mode_paiement: 'especes' });

onMounted(async () => {
  [factures.value, patients.value, assurances.value, stats.value] = await Promise.all([
    api.get('/factures'),
    api.get('/patients'),
    api.get('/assurances'),
    api.get('/factures/stats'),
  ]);
  loading.value = false;
});

const addLigne = () => form.value.lignes.push({ description: '', quantite: 1, prix_unitaire: 0 });
const removeLigne = (i) => form.value.lignes.splice(i, 1);

const total = () => form.value.lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);

const create = async () => {
  saving.value = true; error.value = '';
  try {
    const sel = assurances.value.find((a) => a.id_assurance === +form.value.id_assurance);
    const taux = sel?.taux_prise_en_charge || 0;
    await api.post('/factures', { ...form.value, taux_assurance: taux, id_assurance: form.value.id_assurance || null });
    factures.value = await api.get('/factures');
    showModal.value = false;
    form.value = { id_patient: '', id_consultation: null, id_assurance: null, taux_assurance: null, mode_paiement: 'especes', notes: '', lignes: [{ description: '', quantite: 1, prix_unitaire: 0 }] };
  } catch (e) { error.value = e.message; } finally { saving.value = false; }
};

const payer = async () => {
  saving.value = true;
  try {
    await api.patch(`/factures/${selectedFacture.value.id_facture}/payer`, paiementForm.value);
    factures.value = await api.get('/factures');
    showPaiement.value = false;
  } finally { saving.value = false; }
};

const openPaiement = (f) => { selectedFacture.value = f; paiementForm.value.montant_paye = Number(f.part_patient) - Number(f.montant_paye); showPaiement.value = true; };
const fmt = (n) => Number(n).toLocaleString('fr') + ' FCFA';
const statutColor = { en_attente: 'badge-yellow', partiellement_paye: 'badge-blue', paye: 'badge-green', annule: 'badge-red' };
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">Facturation</h2>
        <button @click="showModal = true" class="btn btn-primary">+ Nouvelle facture</button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4">
        <div class="card text-center">
          <div class="text-2xl font-bold text-gray-900">{{ fmt(stats.montant_total || 0) }}</div>
          <div class="text-xs text-gray-500 mt-1">Total facturé</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-green-600">{{ fmt(stats.montant_paye || 0) }}</div>
          <div class="text-xs text-gray-500 mt-1">Encaissé</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-orange-500">{{ stats.en_attente || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">En attente</div>
        </div>
      </div>

      <!-- Liste -->
      <div class="card">
        <div v-if="loading" class="py-8 text-center text-gray-400">Chargement...</div>
        <table v-else class="table-auto w-full">
          <thead><tr><th>Patient</th><th>Date</th><th>Montant</th><th>Part patient</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="f in factures" :key="f.id_facture">
              <td class="font-medium">{{ f.patient?.utilisateur?.prenom }} {{ f.patient?.utilisateur?.nom }}</td>
              <td>{{ new Date(f.date_emission).toLocaleDateString('fr') }}</td>
              <td>{{ fmt(f.montant_total) }}</td>
              <td>{{ fmt(f.part_patient) }}</td>
              <td><span class="badge" :class="statutColor[f.statut]">{{ f.statut }}</span></td>
              <td>
                <button v-if="f.statut !== 'paye' && f.statut !== 'annule'" @click="openPaiement(f)"
                  class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Encaisser</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal nouvelle facture -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl my-4">
        <h3 class="text-lg font-bold mb-4">Nouvelle facture</h3>
        <form @submit.prevent="create" class="space-y-4">
          <div><label class="text-xs font-medium text-gray-600">Patient</label>
            <select v-model.number="form.id_patient" required class="input mt-1">
              <option value="">Choisir...</option>
              <option v-for="p in patients" :key="p.id_patient" :value="p.id_patient">{{ p.utilisateur?.prenom }} {{ p.utilisateur?.nom }}</option>
            </select></div>
          <div><label class="text-xs font-medium text-gray-600">Assurance (optionnel)</label>
            <select v-model.number="form.id_assurance" class="input mt-1">
              <option value="">Aucune</option>
              <option v-for="a in assurances" :key="a.id_assurance" :value="a.id_assurance">{{ a.nom }} ({{ a.taux_prise_en_charge }}%)</option>
            </select></div>
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-gray-700">Prestations</label>
              <button type="button" @click="addLigne" class="text-xs text-green-600 hover:underline">+ Ajouter</button>
            </div>
            <div v-for="(l, i) in form.lignes" :key="i" class="flex gap-2 mb-2">
              <input v-model="l.description" required placeholder="Prestation" class="input flex-1" />
              <input v-model.number="l.quantite" type="number" min="1" class="input w-16" />
              <input v-model.number="l.prix_unitaire" type="number" min="0" class="input w-24" placeholder="Prix" />
              <button type="button" @click="removeLigne(i)" class="text-red-400">✕</button>
            </div>
            <div class="text-right text-sm font-semibold">Total : {{ fmt(total()) }}</div>
          </div>
          <div v-if="error" class="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{{ error }}</div>
          <div class="flex gap-2 pt-2">
            <button type="button" @click="showModal = false" class="btn btn-outline flex-1">Annuler</button>
            <button type="submit" :disabled="saving" class="btn btn-primary flex-1">{{ saving ? '...' : 'Créer' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal paiement -->
    <div v-if="showPaiement" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 class="text-lg font-bold mb-4">Encaisser paiement</h3>
        <div class="text-sm text-gray-600 mb-4">Reste à payer : <strong>{{ fmt(Number(selectedFacture.part_patient) - Number(selectedFacture.montant_paye)) }}</strong></div>
        <form @submit.prevent="payer" class="space-y-3">
          <div><label class="text-xs font-medium text-gray-600">Montant encaissé</label>
            <input v-model.number="paiementForm.montant_paye" type="number" min="0" required class="input mt-1" /></div>
          <div><label class="text-xs font-medium text-gray-600">Mode de paiement</label>
            <select v-model="paiementForm.mode_paiement" class="input mt-1">
              <option value="especes">Espèces</option>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
              <option value="carte">Carte bancaire</option>
              <option value="cheque">Chèque</option>
            </select></div>
          <div class="flex gap-2 pt-2">
            <button type="button" @click="showPaiement = false" class="btn btn-outline flex-1">Annuler</button>
            <button type="submit" :disabled="saving" class="btn btn-primary flex-1">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>
