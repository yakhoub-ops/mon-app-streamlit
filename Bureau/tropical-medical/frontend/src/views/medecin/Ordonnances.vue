<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';
import { useAuthStore } from '../../stores/auth';

const route = useRoute();
const auth = useAuthStore();
const ordonnances = ref([]);
const medicaments = ref([]);
const loading = ref(true);
const showModal = ref(!!route.query.consultation);
const saving = ref(false);
const error = ref('');

const form = ref({
  id_consultation: route.query.consultation ? +route.query.consultation : '',
  id_medecin: auth.user?.medecin?.id_medecin || '',
  id_patient: route.query.patient ? +route.query.patient : '',
  lignes: [{ id_medicament: '', posologie: '', duree: '', quantite: 1 }],
});

onMounted(async () => {
  [ordonnances.value, medicaments.value] = await Promise.all([
    api.get('/ordonnances'),
    api.get('/ordonnances/medicaments'),
  ]);
  if (auth.user?.medecin?.id_medecin) form.value.id_medecin = auth.user.medecin.id_medecin;
  loading.value = false;
});

const addLigne = () => form.value.lignes.push({ id_medicament: '', posologie: '', duree: '', quantite: 1 });
const removeLigne = (i) => form.value.lignes.splice(i, 1);

const create = async () => {
  saving.value = true; error.value = '';
  try {
    await api.post('/ordonnances', { ...form.value, lignes: form.value.lignes.map(l => ({ ...l, id_medicament: +l.id_medicament })) });
    ordonnances.value = await api.get('/ordonnances');
    showModal.value = false;
    form.value.lignes = [{ id_medicament: '', posologie: '', duree: '', quantite: 1 }];
  } catch (e) { error.value = e.message; } finally { saving.value = false; }
};

const print = (id) => window.open(`/ordonnances/${id}/print`, '_blank');

const statutColor = { active: 'badge-green', delivree: 'badge-blue', expiree: 'badge-gray', annulee: 'badge-red' };
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">Ordonnances</h2>
        <button @click="showModal = true" class="btn btn-primary">+ Nouvelle</button>
      </div>
      <div class="card">
        <div v-if="loading" class="py-8 text-center text-gray-400">Chargement...</div>
        <div v-else class="space-y-3">
          <div v-for="o in ordonnances" :key="o.id_ordonnance"
            class="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50">
            <div class="min-w-20 text-center">
              <div class="text-sm font-bold">{{ new Date(o.date_emission).toLocaleDateString('fr') }}</div>
              <span class="badge mt-1" :class="statutColor[o.statut]">{{ o.statut }}</span>
            </div>
            <div class="flex-1">
              <div class="font-semibold">{{ o.patient?.utilisateur?.prenom }} {{ o.patient?.utilisateur?.nom }}</div>
              <div class="text-sm text-gray-500 mt-1">{{ o.lignes?.length }} médicament(s)</div>
              <div class="flex flex-wrap gap-1 mt-2">
                <span v-for="l in o.lignes" :key="l.id_ligne" class="badge badge-gray">{{ l.medicament?.nom }}</span>
              </div>
            </div>
            <button @click="print(o.id_ordonnance)" class="btn btn-outline text-xs py-1">🖨 Imprimer</button>
          </div>
          <div v-if="ordonnances.length === 0" class="py-8 text-center text-gray-400">Aucune ordonnance</div>
        </div>
      </div>
    </div>

    <!-- Modal nouvelle ordonnance -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl my-4">
        <h3 class="text-lg font-bold mb-4">Nouvelle ordonnance</h3>
        <form @submit.prevent="create" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-medium text-gray-600">ID Consultation</label>
              <input v-model.number="form.id_consultation" type="number" required class="input mt-1" /></div>
            <div><label class="text-xs font-medium text-gray-600">ID Patient</label>
              <input v-model.number="form.id_patient" type="number" required class="input mt-1" /></div>
          </div>
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-gray-700">Médicaments</label>
              <button type="button" @click="addLigne" class="text-xs text-green-600 hover:underline">+ Ajouter</button>
            </div>
            <div v-for="(l, i) in form.lignes" :key="i" class="border border-gray-200 rounded-lg p-3 mb-2 space-y-2">
              <div class="flex gap-2">
                <select v-model.number="l.id_medicament" required class="input flex-1">
                  <option value="">Médicament...</option>
                  <option v-for="m in medicaments" :key="m.id_medicament" :value="m.id_medicament">{{ m.nom }}</option>
                </select>
                <input v-model.number="l.quantite" type="number" min="1" class="input w-20" placeholder="Qté" />
              </div>
              <input v-model="l.posologie" required class="input" placeholder="Posologie (ex: 1 cp matin et soir)" />
              <div class="flex gap-2">
                <input v-model="l.duree" class="input" placeholder="Durée (ex: 7 jours)" />
                <button type="button" @click="removeLigne(i)" class="text-red-400 hover:text-red-600 text-sm">✕</button>
              </div>
            </div>
          </div>
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
