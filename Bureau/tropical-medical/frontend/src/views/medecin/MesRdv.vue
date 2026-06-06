<script setup>
import { ref, onMounted, computed } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const rdvs = ref([]);
const loading = ref(true);
const filter = ref('tous');

onMounted(async () => {
  rdvs.value = await api.get('/rdv');
  loading.value = false;
});

const filtered = computed(() => {
  if (filter.value === 'tous') return rdvs.value;
  return rdvs.value.filter((r) => r.statut === filter.value);
});

const confirmer = async (id) => {
  await api.patch(`/rdv/${id}/statut`, { statut: 'confirme' });
  rdvs.value = rdvs.value.map((r) => r.id_rdv === id ? { ...r, statut: 'confirme' } : r);
};

const terminer = async (id) => {
  await api.patch(`/rdv/${id}/statut`, { statut: 'termine' });
  rdvs.value = rdvs.value.map((r) => r.id_rdv === id ? { ...r, statut: 'termine' } : r);
};

const annuler = async (id) => {
  if (!confirm('Annuler ce RDV ?')) return;
  await api.patch(`/rdv/${id}/statut`, { statut: 'annule' });
  rdvs.value = rdvs.value.map((r) => r.id_rdv === id ? { ...r, statut: 'annule' } : r);
};

const statutColor = { en_attente: 'badge-yellow', confirme: 'badge-green', termine: 'badge-gray', annule: 'badge-red' };
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <h2 class="text-2xl font-bold text-gray-900">Mes rendez-vous</h2>
      <div class="flex gap-2 flex-wrap">
        <button v-for="f in ['tous','en_attente','confirme','termine','annule']" :key="f"
          @click="filter = f"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
          :class="filter === f ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          :style="filter === f ? 'background:#07f113' : ''">
          {{ { tous: 'Tous', en_attente: 'En attente', confirme: 'Confirmés', termine: 'Terminés', annule: 'Annulés' }[f] }}
        </button>
      </div>

      <div class="card">
        <div v-if="loading" class="py-8 text-center text-gray-400">Chargement...</div>
        <div v-else-if="filtered.length === 0" class="py-8 text-center text-gray-400">Aucun rendez-vous</div>
        <div v-else class="space-y-3">
          <div v-for="r in filtered" :key="r.id_rdv"
            class="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
            <div class="text-center min-w-20 bg-gray-50 rounded-lg p-2">
              <div class="text-sm font-bold text-gray-900">{{ new Date(r.date_rdv).toLocaleDateString('fr', { day: '2-digit', month: 'short' }) }}</div>
              <div class="text-xs text-gray-500">{{ new Date(r.date_rdv).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' }) }}</div>
            </div>
            <div class="flex-1">
              <div class="font-semibold text-gray-900">{{ r.patient?.utilisateur?.prenom }} {{ r.patient?.utilisateur?.nom }}</div>
              <div class="text-sm text-gray-500">{{ r.motif || 'Consultation' }}</div>
            </div>
            <div class="flex items-center gap-2 flex-wrap justify-end">
              <span class="badge" :class="r.type_rdv === 'teleconsultation' ? 'badge-blue' : 'badge-gray'">{{ r.type_rdv }}</span>
              <span class="badge" :class="statutColor[r.statut]">{{ r.statut }}</span>
              <div v-if="r.statut === 'en_attente'" class="flex gap-1">
                <button @click="confirmer(r.id_rdv)" class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Confirmer</button>
                <button @click="annuler(r.id_rdv)" class="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">Annuler</button>
              </div>
              <div v-if="r.statut === 'confirme'" class="flex gap-1">
                <router-link :to="`/medecin/consultations/nouvelle?rdv=${r.id_rdv}&patient=${r.id_patient}&medecin=${r.id_medecin}`"
                  class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Consulter</router-link>
                <button @click="annuler(r.id_rdv)" class="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
