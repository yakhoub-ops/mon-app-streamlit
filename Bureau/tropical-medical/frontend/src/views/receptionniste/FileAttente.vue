<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const file = ref([]);
const patients = ref([]);
const loading = ref(true);
const showModal = ref(false);
const form = ref({ id_patient: '', priorite: 3, notes: '' });
const saving = ref(false);

onMounted(async () => {
  [file.value, patients.value] = await Promise.all([api.get('/file-attente'), api.get('/patients')]);
  loading.value = false;
});

const prioriteColor = { 1: 'badge-red', 2: 'badge-red', 3: 'badge-yellow', 4: 'badge-gray', 5: 'badge-gray' };
const prioriteLabel = { 1: 'Urgent', 2: 'Urgent', 3: 'Normal', 4: 'Faible', 5: 'Faible' };

const appeler = async (id) => {
  await api.patch(`/file-attente/${id}/appeler`);
  file.value = file.value.map((f) => f.id_file === id ? { ...f, statut: 'appele', heure_appel: new Date() } : f);
};

const terminer = async (id) => {
  await api.patch(`/file-attente/${id}/statut`, { statut: 'consulte' });
  file.value = file.value.filter((f) => f.id_file !== id);
};

const retirer = async (id) => {
  await api.delete(`/file-attente/${id}`);
  file.value = file.value.filter((f) => f.id_file !== id);
};

const ajouter = async () => {
  saving.value = true;
  try {
    const item = await api.post('/file-attente', form.value);
    file.value.push(item);
    showModal.value = false;
    form.value = { id_patient: '', priorite: 3, notes: '' };
  } finally { saving.value = false; }
};
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">File d'attente</h2>
        <button @click="showModal = true" class="btn btn-primary">+ Ajouter</button>
      </div>
      <div class="space-y-3">
        <div v-if="loading" class="card py-8 text-center text-gray-400">Chargement...</div>
        <div v-for="(item, idx) in file.filter(f => f.statut !== 'parti')" :key="item.id_file"
          class="card flex items-center gap-4"
          :class="{ 'border-l-4 border-l-red-500': item.priorite <= 2 }">
          <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
            style="background: #07f113; color: white">{{ idx + 1 }}</div>
          <div class="flex-1">
            <div class="font-semibold">{{ item.patient?.utilisateur?.prenom }} {{ item.patient?.utilisateur?.nom }}</div>
            <div class="text-sm text-gray-500">Arrivée : {{ new Date(item.heure_arrivee).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' }) }}</div>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge" :class="prioriteColor[item.priorite]">{{ prioriteLabel[item.priorite] }}</span>
            <span class="badge" :class="item.statut === 'appele' ? 'badge-blue' : 'badge-yellow'">{{ item.statut }}</span>
          </div>
          <div class="flex gap-2">
            <button v-if="item.statut === 'en_attente'" @click="appeler(item.id_file)" class="btn btn-primary text-xs py-1">📢 Appeler</button>
            <button v-if="item.statut === 'appele'" @click="terminer(item.id_file)" class="btn btn-outline text-xs py-1">✓ Terminé</button>
            <button @click="retirer(item.id_file)" class="text-xs text-red-400 hover:text-red-600">✕</button>
          </div>
        </div>
        <div v-if="!loading && file.filter(f => f.statut !== 'parti').length === 0"
          class="card py-8 text-center text-gray-400">File d'attente vide</div>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold mb-4">Ajouter à la file</h3>
        <form @submit.prevent="ajouter" class="space-y-3">
          <div><label class="text-xs font-medium text-gray-600">Patient</label>
            <select v-model.number="form.id_patient" required class="input mt-1">
              <option value="">Choisir...</option>
              <option v-for="p in patients" :key="p.id_patient" :value="p.id_patient">
                {{ p.utilisateur?.prenom }} {{ p.utilisateur?.nom }}
              </option>
            </select></div>
          <div><label class="text-xs font-medium text-gray-600">Priorité (1=urgent, 5=normal)</label>
            <input v-model.number="form.priorite" type="number" min="1" max="5" class="input mt-1" /></div>
          <div><label class="text-xs font-medium text-gray-600">Notes</label>
            <input v-model="form.notes" class="input mt-1" /></div>
          <div class="flex gap-2 pt-2">
            <button type="button" @click="showModal = false" class="btn btn-outline flex-1">Annuler</button>
            <button type="submit" :disabled="saving" class="btn btn-primary flex-1">Ajouter</button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>
