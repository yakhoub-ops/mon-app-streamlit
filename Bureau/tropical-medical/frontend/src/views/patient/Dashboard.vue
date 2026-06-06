<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();
const rdvs = ref([]);
const factures = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    [rdvs.value, factures.value] = await Promise.all([
      api.get('/rdv'),
      api.get('/factures'),
    ]);
  } finally { loading.value = false; }
});

const prochainRdv = () => rdvs.value
  .filter((r) => new Date(r.date_rdv) > new Date() && r.statut !== 'annule')
  .sort((a, b) => new Date(a.date_rdv) - new Date(b.date_rdv))[0];

const facturesImpayees = () => factures.value.filter((f) => f.statut !== 'paye' && f.statut !== 'annule').length;
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Bonjour, {{ auth.user?.prenom }}</h2>
        <p class="text-gray-500 text-sm">Bienvenue sur votre espace patient</p>
      </div>

      <!-- Prochain RDV -->
      <div v-if="prochainRdv()" class="card border-l-4 border-l-green-500">
        <div class="flex items-center gap-4">
          <div class="text-3xl">📅</div>
          <div class="flex-1">
            <div class="text-sm text-gray-500">Prochain rendez-vous</div>
            <div class="font-bold text-gray-900">{{ new Date(prochainRdv().date_rdv).toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long' }) }}</div>
            <div class="text-sm text-gray-600">{{ new Date(prochainRdv().date_rdv).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' }) }} · Dr {{ prochainRdv().medecin?.utilisateur?.nom }}</div>
          </div>
          <span class="badge" :class="prochainRdv().type_rdv === 'teleconsultation' ? 'badge-blue' : 'badge-green'">{{ prochainRdv().type_rdv }}</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="card text-center">
          <div class="text-3xl font-bold text-blue-600">{{ rdvs.length }}</div>
          <div class="text-sm text-gray-500 mt-1">RDV total</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-orange-500">{{ facturesImpayees() }}</div>
          <div class="text-sm text-gray-500 mt-1">Factures impayées</div>
        </div>
      </div>

      <!-- Accès rapides -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <router-link to="/patient/rdv/nouveau" class="card text-center hover:shadow-md transition-shadow cursor-pointer">
          <div class="text-2xl mb-2">📅</div>
          <div class="text-sm font-medium">Prendre un RDV</div>
        </router-link>
        <router-link to="/patient/dossier" class="card text-center hover:shadow-md transition-shadow cursor-pointer">
          <div class="text-2xl mb-2">📋</div>
          <div class="text-sm font-medium">Mon dossier médical</div>
        </router-link>
        <router-link to="/patient/ordonnances" class="card text-center hover:shadow-md transition-shadow cursor-pointer">
          <div class="text-2xl mb-2">💊</div>
          <div class="text-sm font-medium">Mes ordonnances</div>
        </router-link>
        <router-link to="/patient/factures" class="card text-center hover:shadow-md transition-shadow cursor-pointer">
          <div class="text-2xl mb-2">🧾</div>
          <div class="text-sm font-medium">Mes factures</div>
        </router-link>
        <router-link to="/patient/actualites" class="card text-center hover:shadow-md transition-shadow cursor-pointer">
          <div class="text-2xl mb-2">📰</div>
          <div class="text-sm font-medium">Actualités santé</div>
        </router-link>
      </div>
    </div>
  </AppLayout>
</template>
