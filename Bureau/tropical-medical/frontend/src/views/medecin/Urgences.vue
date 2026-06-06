<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const urgences = ref([]);
const loading = ref(true);
const showModal = ref(false);
const form = ref({ nom_patient: '', description: '', niveau: 'urgent', notes: '' });
const saving = ref(false);

const niveauColors = { critique: 'badge-red', urgent: 'badge-red', modere: 'badge-yellow', faible: 'badge-green' };
const statutColors = { en_attente: 'badge-yellow', prise_en_charge: 'badge-blue', resolue: 'badge-green' };

onMounted(async () => {
  urgences.value = await api.get('/urgences');
  loading.value = false;
});

const priseEnCharge = async (id) => {
  await api.patch(`/urgences/${id}/statut`, { statut: 'prise_en_charge' });
  urgences.value = urgences.value.map((u) => u.id_urgence === id ? { ...u, statut: 'prise_en_charge', date_prise_en_charge: new Date() } : u);
};

const resoudre = async (id) => {
  await api.patch(`/urgences/${id}/statut`, { statut: 'resolue' });
  urgences.value = urgences.value.map((u) => u.id_urgence === id ? { ...u, statut: 'resolue' } : u);
};

const creer = async () => {
  saving.value = true;
  try {
    const u = await api.post('/urgences', form.value);
    urgences.value.unshift(u);
    showModal.value = false;
    form.value = { nom_patient: '', description: '', niveau: 'urgent', notes: '' };
  } finally { saving.value = false; }
};
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">Urgences</h2>
        <button @click="showModal = true" class="btn btn-danger">🚨 Signaler</button>
      </div>
      <div class="space-y-3">
        <div v-if="loading" class="card py-8 text-center text-gray-400">Chargement...</div>
        <div v-for="u in urgences" :key="u.id_urgence"
          class="card border-l-4"
          :class="{ 'border-l-red-500': u.niveau === 'critique' || u.niveau === 'urgent', 'border-l-yellow-500': u.niveau === 'modere', 'border-l-green-500': u.niveau === 'faible' }">
          <div class="flex items-start gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold">{{ u.patient?.utilisateur ? `${u.patient.utilisateur.prenom} ${u.patient.utilisateur.nom}` : u.nom_patient || 'Patient inconnu' }}</span>
                <span class="badge" :class="niveauColors[u.niveau]">{{ u.niveau }}</span>
                <span class="badge" :class="statutColors[u.statut]">{{ u.statut }}</span>
              </div>
              <p class="text-sm text-gray-700">{{ u.description }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ new Date(u.date_arrivee).toLocaleString('fr') }}</p>
            </div>
            <div class="flex gap-2">
              <button v-if="u.statut === 'en_attente'" @click="priseEnCharge(u.id_urgence)" class="btn btn-primary text-xs py-1">Prendre en charge</button>
              <button v-if="u.statut === 'prise_en_charge'" @click="resoudre(u.id_urgence)" class="btn btn-outline text-xs py-1">Résoudre</button>
            </div>
          </div>
        </div>
        <div v-if="!loading && urgences.length === 0" class="card py-8 text-center text-gray-400">Aucune urgence</div>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold mb-4">Signaler une urgence</h3>
        <form @submit.prevent="creer" class="space-y-3">
          <div><label class="text-xs font-medium text-gray-600">Nom du patient</label><input v-model="form.nom_patient" class="input mt-1" /></div>
          <div><label class="text-xs font-medium text-gray-600">Niveau</label>
            <select v-model="form.niveau" class="input mt-1">
              <option value="critique">Critique</option>
              <option value="urgent">Urgent</option>
              <option value="modere">Modéré</option>
              <option value="faible">Faible</option>
            </select></div>
          <div><label class="text-xs font-medium text-gray-600">Description *</label>
            <textarea v-model="form.description" required rows="3" class="input mt-1"></textarea></div>
          <div class="flex gap-2 pt-2">
            <button type="button" @click="showModal = false" class="btn btn-outline flex-1">Annuler</button>
            <button type="submit" :disabled="saving" class="btn btn-danger flex-1">{{ saving ? '...' : 'Signaler' }}</button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>
