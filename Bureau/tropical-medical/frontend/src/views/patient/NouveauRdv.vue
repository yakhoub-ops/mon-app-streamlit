<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const router = useRouter();
const step = ref(1);

const medecins = ref([]);
const creneaux = ref([]);
const patient = ref(null);

const form = ref({ type_rdv: '', id_medecin: null, date: '', creneau: '', motif: '' });
const selectedMedecin = ref(null);
const saving = ref(false);
const loadingCreneaux = ref(false);

onMounted(async () => {
  [medecins.value, patient.value] = await Promise.all([
    api.get('/medecins'),
    api.get('/patients/me'),
  ]);
});

watch(() => [form.value.id_medecin, form.value.date], async ([med, date]) => {
  if (med && date) {
    loadingCreneaux.value = true;
    creneaux.value = await api.get(`/medecins/${med}/creneaux?date=${date}`);
    loadingCreneaux.value = false;
  }
});

const selectMedecin = (m) => {
  selectedMedecin.value = m;
  form.value.id_medecin = m.id_medecin;
  step.value = 3;
};

const submit = async () => {
  saving.value = true;
  try {
    const dateRdv = `${form.value.date}T${form.value.creneau}:00`;
    await api.post('/rdv', {
      id_patient: patient.value.id_patient,
      id_medecin: form.value.id_medecin,
      date_rdv: dateRdv,
      motif: form.value.motif,
      type_rdv: form.value.type_rdv,
    });
    router.push('/patient/rdv');
  } finally { saving.value = false; }
};

const specialites = computed => [...new Set(medecins.value.map((m) => m.specialite))];
</script>

<template>
  <AppLayout>
    <div class="max-w-xl space-y-5">
      <div class="flex items-center gap-2">
        <button @click="router.back()" class="text-gray-400 hover:text-gray-600">←</button>
        <h2 class="text-2xl font-bold text-gray-900">Prendre un rendez-vous</h2>
      </div>

      <!-- Progress -->
      <div class="flex gap-2">
        <div v-for="s in 4" :key="s" class="flex-1 h-1.5 rounded-full transition-colors"
          :style="s <= step ? 'background: #07f113' : 'background: #e5e7eb'"></div>
      </div>

      <!-- Étape 1 : Type -->
      <div v-if="step === 1" class="card space-y-4">
        <h3 class="font-semibold text-gray-900">Type de consultation</h3>
        <div class="grid grid-cols-2 gap-3">
          <button @click="form.type_rdv = 'presentiel'; step = 2"
            class="p-4 border-2 rounded-xl text-center hover:border-green-500 transition-colors"
            :class="form.type_rdv === 'presentiel' ? 'border-green-500 bg-green-50' : 'border-gray-200'">
            <div class="text-2xl mb-1">🏥</div>
            <div class="font-medium text-sm">Présentiel</div>
          </button>
          <button @click="form.type_rdv = 'teleconsultation'; step = 2"
            class="p-4 border-2 rounded-xl text-center hover:border-green-500 transition-colors"
            :class="form.type_rdv === 'teleconsultation' ? 'border-green-500 bg-green-50' : 'border-gray-200'">
            <div class="text-2xl mb-1">💻</div>
            <div class="font-medium text-sm">Téléconsultation</div>
          </button>
        </div>
      </div>

      <!-- Étape 2 : Médecin -->
      <div v-if="step === 2" class="card space-y-4">
        <div class="flex items-center gap-2">
          <button @click="step = 1" class="text-sm text-gray-500 hover:underline">← Retour</button>
          <h3 class="font-semibold text-gray-900">Choisir un médecin</h3>
        </div>
        <div class="space-y-2">
          <div v-for="m in medecins.filter((x) => !form.type_rdv || x.teleconsult_active || form.type_rdv === 'presentiel')"
            :key="m.id_medecin"
            @click="selectMedecin(m)"
            class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {{ m.utilisateur?.prenom?.[0] }}
            </div>
            <div>
              <div class="font-medium">Dr {{ m.utilisateur?.prenom }} {{ m.utilisateur?.nom }}</div>
              <div class="text-sm text-gray-500">{{ m.specialite }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Étape 3 : Date & Créneau -->
      <div v-if="step === 3" class="card space-y-4">
        <div class="flex items-center gap-2">
          <button @click="step = 2" class="text-sm text-gray-500 hover:underline">← Retour</button>
          <h3 class="font-semibold text-gray-900">Dr {{ selectedMedecin?.utilisateur?.nom }} — {{ selectedMedecin?.specialite }}</h3>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700">Date</label>
          <input v-model="form.date" type="date" :min="new Date().toISOString().slice(0,10)" class="input mt-1" />
        </div>
        <div v-if="form.date">
          <label class="text-sm font-medium text-gray-700">Créneau</label>
          <div v-if="loadingCreneaux" class="text-sm text-gray-400 mt-2">Chargement...</div>
          <div v-else class="grid grid-cols-4 gap-2 mt-2">
            <button v-for="c in creneaux" :key="c.heure"
              @click="if(c.disponible) { form.creneau = c.heure; step = 4; }"
              :disabled="!c.disponible"
              class="py-2 rounded-lg text-sm font-medium text-center transition-colors"
              :class="form.creneau === c.heure
                ? 'text-white'
                : c.disponible
                  ? 'bg-gray-100 hover:bg-green-100 text-gray-700'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'"
              :style="form.creneau === c.heure ? 'background:#07f113' : ''">
              {{ c.heure }}
            </button>
            <div v-if="creneaux.length === 0" class="col-span-4 text-sm text-gray-400 text-center py-2">Aucun créneau disponible</div>
          </div>
        </div>
      </div>

      <!-- Étape 4 : Confirmation -->
      <div v-if="step === 4" class="card space-y-4">
        <div class="flex items-center gap-2">
          <button @click="step = 3" class="text-sm text-gray-500 hover:underline">← Retour</button>
          <h3 class="font-semibold text-gray-900">Confirmation</h3>
        </div>
        <div class="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-gray-500">Médecin</span><span class="font-medium">Dr {{ selectedMedecin?.utilisateur?.prenom }} {{ selectedMedecin?.utilisateur?.nom }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Type</span><span class="font-medium">{{ form.type_rdv }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Date</span><span class="font-medium">{{ new Date(form.date).toLocaleDateString('fr') }} à {{ form.creneau }}</span></div>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700">Motif (optionnel)</label>
          <input v-model="form.motif" class="input mt-1" placeholder="Raison de la consultation" />
        </div>
        <button @click="submit" :disabled="saving" class="btn btn-primary w-full justify-center py-3">
          {{ saving ? 'Confirmation...' : 'Confirmer le rendez-vous' }}
        </button>
      </div>
    </div>
  </AppLayout>
</template>
