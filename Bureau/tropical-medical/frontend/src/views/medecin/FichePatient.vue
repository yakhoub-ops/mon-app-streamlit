<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const route = useRoute();
const patient = ref(null);
const dossier = ref(null);
const loading = ref(true);
const tab = ref('dossier');

onMounted(async () => {
  [patient.value, dossier.value] = await Promise.all([
    api.get(`/patients/${route.params.id}`),
    api.get(`/dossiers/patient/${route.params.id}`).catch(() => null),
  ]);
  loading.value = false;
});
</script>

<template>
  <AppLayout>
    <div v-if="loading" class="py-12 text-center text-gray-400">Chargement...</div>
    <div v-else-if="!patient" class="py-12 text-center text-gray-400">Patient introuvable</div>
    <div v-else class="space-y-5">
      <!-- Header -->
      <div class="card flex items-center gap-5">
        <div class="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 font-bold text-2xl">
          {{ patient.utilisateur?.prenom?.[0] }}{{ patient.utilisateur?.nom?.[0] }}
        </div>
        <div class="flex-1">
          <h2 class="text-2xl font-bold text-gray-900">{{ patient.utilisateur?.prenom }} {{ patient.utilisateur?.nom }}</h2>
          <div class="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
            <span>📱 {{ patient.utilisateur?.telephone }}</span>
            <span>✉️ {{ patient.utilisateur?.email }}</span>
            <span v-if="patient.date_naissance">🎂 {{ new Date(patient.date_naissance).toLocaleDateString('fr') }}</span>
            <span v-if="patient.groupe_sanguin"><span class="badge badge-red">{{ patient.groupe_sanguin }}</span></span>
          </div>
        </div>
        <router-link :to="`/medecin/consultations/nouvelle?patient=${patient.id_patient}&medecin=${patient.id_medecin}`"
          class="btn btn-primary">🩺 Consulter</router-link>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 border-b border-gray-200">
        <button v-for="t in [['dossier','📋 Dossier'], ['allergies','⚠️ Allergies'], ['consultations','🩺 Consultations']]"
          :key="t[0]" @click="tab = t[0]"
          class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
          :class="tab === t[0] ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'">
          {{ t[1] }}
        </button>
      </div>

      <!-- Tab content -->
      <div v-if="tab === 'dossier'" class="card space-y-3">
        <div><strong class="text-gray-600 text-sm">Observations :</strong>
          <p class="mt-1 text-gray-800">{{ dossier?.observations || 'Aucune observation' }}</p></div>
        <div v-if="patient.antecedents"><strong class="text-gray-600 text-sm">Antécédents :</strong>
          <p class="mt-1 text-gray-800">{{ patient.antecedents }}</p></div>
      </div>

      <div v-if="tab === 'allergies'" class="card">
        <p class="text-gray-800">{{ patient.allergies || 'Aucune allergie connue' }}</p>
      </div>

      <div v-if="tab === 'consultations'" class="space-y-3">
        <div v-for="c in dossier?.consultations || []" :key="c.id_consultation"
          class="card space-y-2">
          <div class="flex items-center justify-between">
            <div class="font-semibold">{{ new Date(c.date_consultation).toLocaleDateString('fr') }}</div>
            <span class="badge" :class="c.statut === 'terminee' ? 'badge-green' : 'badge-yellow'">{{ c.statut }}</span>
          </div>
          <div v-if="c.motif" class="text-sm text-gray-600">{{ c.motif }}</div>
          <div v-if="c.diagnostic" class="text-sm text-gray-800"><strong>Diagnostic :</strong> {{ c.diagnostic }}</div>
          <div v-if="c.traitement" class="text-sm text-gray-800"><strong>Traitement :</strong> {{ c.traitement }}</div>
        </div>
        <div v-if="!dossier?.consultations?.length" class="card text-center text-gray-400 py-6">Aucune consultation</div>
      </div>
    </div>
  </AppLayout>
</template>
