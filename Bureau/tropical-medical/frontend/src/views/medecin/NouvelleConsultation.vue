<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';
import { useAuthStore } from '../../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const form = ref({
  id_patient: route.query.patient ? +route.query.patient : '',
  id_medecin: auth.user?.medecin?.id_medecin || '',
  id_rdv: route.query.rdv ? +route.query.rdv : null,
  motif: '',
  diagnostic: '',
  traitement: '',
  notes: '',
});

const patients = ref([]);
const saving = ref(false);
const error = ref('');

onMounted(async () => {
  patients.value = await api.get('/patients');
  if (auth.user?.medecin?.id_medecin) form.value.id_medecin = auth.user.medecin.id_medecin;
});

const submit = async () => {
  saving.value = true; error.value = '';
  try {
    const c = await api.post('/consultations', form.value);
    router.push(`/medecin/consultations`);
  } catch (e) { error.value = e.message; } finally { saving.value = false; }
};
</script>

<template>
  <AppLayout>
    <div class="max-w-2xl space-y-5">
      <h2 class="text-2xl font-bold text-gray-900">Nouvelle consultation</h2>
      <div class="card">
        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-700">Patient</label>
            <select v-model.number="form.id_patient" required class="input mt-1">
              <option value="">Sélectionner un patient...</option>
              <option v-for="p in patients" :key="p.id_patient" :value="p.id_patient">
                {{ p.utilisateur?.prenom }} {{ p.utilisateur?.nom }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Motif</label>
            <input v-model="form.motif" class="input mt-1" placeholder="Motif de la consultation" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Diagnostic</label>
            <textarea v-model="form.diagnostic" rows="3" class="input mt-1" placeholder="Diagnostic clinique..."></textarea>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Traitement</label>
            <textarea v-model="form.traitement" rows="2" class="input mt-1" placeholder="Traitement prescrit..."></textarea>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Notes</label>
            <textarea v-model="form.notes" rows="2" class="input mt-1" placeholder="Notes complémentaires..."></textarea>
          </div>
          <div v-if="error" class="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{{ error }}</div>
          <div class="flex gap-3 pt-2">
            <button type="button" @click="router.back()" class="btn btn-outline">Annuler</button>
            <button type="submit" :disabled="saving" class="btn btn-primary">{{ saving ? 'Enregistrement...' : 'Démarrer la consultation' }}</button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>
