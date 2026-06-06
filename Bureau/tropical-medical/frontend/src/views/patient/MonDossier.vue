<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const patient = ref(null);
const dossier = ref(null);
const loading = ref(true);

onMounted(async () => {
  patient.value = await api.get('/patients/me');
  if (patient.value) {
    dossier.value = await api.get(`/dossiers/patient/${patient.value.id_patient}`).catch(() => null);
  }
  loading.value = false;
});
</script>

<template>
  <AppLayout>
    <div v-if="loading" class="py-12 text-center text-gray-400">Chargement...</div>
    <div v-else class="space-y-5 max-w-3xl">
      <h2 class="text-2xl font-bold text-gray-900">Mon dossier médical</h2>

      <!-- Infos personnelles -->
      <div class="card space-y-3">
        <h3 class="font-semibold text-gray-900">Informations personnelles</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><span class="text-gray-500">Date de naissance :</span>
            <span class="ml-2 font-medium">{{ patient?.date_naissance ? new Date(patient.date_naissance).toLocaleDateString('fr') : '—' }}</span></div>
          <div><span class="text-gray-500">Sexe :</span><span class="ml-2 font-medium">{{ patient?.sexe || '—' }}</span></div>
          <div><span class="text-gray-500">Groupe sanguin :</span>
            <span v-if="patient?.groupe_sanguin" class="ml-2"><span class="badge badge-red">{{ patient.groupe_sanguin }}</span></span>
            <span v-else class="ml-2 font-medium">—</span></div>
          <div><span class="text-gray-500">Adresse :</span><span class="ml-2 font-medium">{{ patient?.adresse || '—' }}</span></div>
        </div>
      </div>

      <!-- Allergies -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 mb-2">Allergies connues</h3>
        <p class="text-gray-700 text-sm">{{ patient?.allergies || 'Aucune allergie connue' }}</p>
      </div>

      <!-- Antécédents -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 mb-2">Antécédents médicaux</h3>
        <p class="text-gray-700 text-sm">{{ patient?.antecedents || 'Aucun antécédent' }}</p>
      </div>

      <!-- Consultations -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 mb-4">Historique des consultations</h3>
        <div v-if="!dossier?.consultations?.length" class="text-center text-gray-400 py-4">Aucune consultation</div>
        <div v-else class="space-y-3">
          <div v-for="c in dossier.consultations" :key="c.id_consultation" class="border border-gray-100 rounded-xl p-4">
            <div class="flex justify-between items-start">
              <div>
                <div class="font-semibold text-sm">{{ new Date(c.date_consultation).toLocaleDateString('fr') }}</div>
                <div class="text-xs text-gray-500">Dr {{ c.medecin?.utilisateur?.nom }}</div>
              </div>
              <span class="badge" :class="c.statut === 'terminee' ? 'badge-green' : 'badge-yellow'">{{ c.statut }}</span>
            </div>
            <div v-if="c.motif" class="text-sm text-gray-600 mt-2">{{ c.motif }}</div>
            <div v-if="c.diagnostic" class="text-sm text-gray-800 mt-1"><strong>Diagnostic :</strong> {{ c.diagnostic }}</div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
