<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const rdvs = ref([]);
const loading = ref(true);

onMounted(async () => {
  rdvs.value = await api.get('/rdv');
  loading.value = false;
});

const annuler = async (id) => {
  if (!confirm('Annuler ce RDV ?')) return;
  await api.patch(`/rdv/${id}/statut`, { statut: 'annule' });
  rdvs.value = rdvs.value.map((r) => r.id_rdv === id ? { ...r, statut: 'annule' } : r);
};

const statutColor = { en_attente: 'badge-yellow', confirme: 'badge-green', termine: 'badge-gray', annule: 'badge-red' };
const sorted = () => [...rdvs.value].sort((a, b) => new Date(b.date_rdv) - new Date(a.date_rdv));
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">Mes rendez-vous</h2>
        <router-link to="/patient/rdv/nouveau" class="btn btn-primary">+ Prendre un RDV</router-link>
      </div>
      <div class="card">
        <div v-if="loading" class="py-8 text-center text-gray-400">Chargement...</div>
        <div v-else class="space-y-3">
          <div v-for="r in sorted()" :key="r.id_rdv"
            class="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50">
            <div class="min-w-20 text-center bg-gray-50 rounded-lg p-2">
              <div class="text-sm font-bold">{{ new Date(r.date_rdv).toLocaleDateString('fr', { day: '2-digit', month: 'short' }) }}</div>
              <div class="text-xs text-gray-500">{{ new Date(r.date_rdv).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' }) }}</div>
            </div>
            <div class="flex-1">
              <div class="font-semibold">Dr {{ r.medecin?.utilisateur?.prenom }} {{ r.medecin?.utilisateur?.nom }}</div>
              <div class="text-sm text-gray-500">{{ r.medecin?.specialite }} · {{ r.motif || 'Consultation' }}</div>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge" :class="r.type_rdv === 'teleconsultation' ? 'badge-blue' : 'badge-gray'">{{ r.type_rdv }}</span>
              <span class="badge" :class="statutColor[r.statut]">{{ r.statut }}</span>
              <button v-if="['en_attente', 'confirme'].includes(r.statut)" @click="annuler(r.id_rdv)"
                class="text-xs text-red-500 hover:underline ml-2">Annuler</button>
            </div>
          </div>
          <div v-if="rdvs.length === 0" class="py-8 text-center text-gray-400">Aucun rendez-vous</div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
