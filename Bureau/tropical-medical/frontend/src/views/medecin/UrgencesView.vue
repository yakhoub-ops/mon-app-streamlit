<template>
  <div class="urg-wrap">

    <!-- En-tête -->
    <div class="urg-header">
      <div class="urg-title-row">
        <div class="urg-icon pulse-icon"><AlertTriangle :size="18" /></div>
        <h1 class="urg-title">Urgences</h1>
        <span v-if="!chargement" class="urg-badge" :class="urgences.length ? 'urg-badge-red' : 'urg-badge-gray'">
          {{ urgences.length }}
        </span>
      </div>
      <div class="urg-actions">
        <span class="refresh-info"><RefreshCw :size="12" class="spin-slow" /> Actualisation auto</span>
        <button class="btn-refresh" @click="charger" :disabled="chargement">
          <RefreshCw :size="14" :class="{ spin: chargement }" />
        </button>
      </div>
    </div>

    <!-- Filtres niveau -->
    <div class="filtres-tabs">
      <button v-for="n in niveaux" :key="n.val"
        class="filtre-btn" :class="[n.cls, { active: filtre === n.val }]"
        @click="filtre = n.val">
        <component :is="n.icone" :size="12" />
        {{ n.label }}
        <span v-if="compteParNiveau[n.val]" class="filtre-count">{{ compteParNiveau[n.val] }}</span>
      </button>
    </div>

    <!-- Chargement -->
    <div v-if="chargement" class="skel-list">
      <div class="skel-row" v-for="i in 3" :key="i"></div>
    </div>

    <!-- Vide -->
    <div v-else-if="!urgencesFiltrees.length" class="vide-box">
      <ShieldCheck :size="56" style="color:#22C55E;opacity:.5;margin-bottom:.75rem" />
      <p class="vide-titre">Aucune urgence en cours</p>
      <p class="vide-sub">Tous les patients sont stables</p>
    </div>

    <!-- Liste urgences -->
    <div v-else class="urg-list">
      <div v-for="(p, idx) in urgencesFiltrees" :key="p.id"
        class="urg-card"
        :class="p.niveauUrgence === 'CRITIQUE' ? 'urg-critique' : 'urg-urgent'"
        :style="{ animationDelay: (idx * 0.08) + 's' }">

        <!-- Indicateur niveau -->
        <div class="niv-indicator" :class="p.niveauUrgence === 'CRITIQUE' ? 'ind-critique' : 'ind-urgent'">
          <Zap :size="14" v-if="p.niveauUrgence === 'CRITIQUE'" />
          <AlertTriangle :size="14" v-else />
        </div>

        <div class="urg-avatar">
          <User :size="20" />
        </div>

        <div class="urg-info">
          <div class="urg-nom">{{ p.patient.utilisateur.prenom }} {{ p.patient.utilisateur.nom }}</div>
          <div class="urg-meta">
            <span><Phone :size="10" /> {{ p.patient.utilisateur.telephone || '—' }}</span>
            <span v-if="p.motif"><MessageSquare :size="10" /> {{ p.motif }}</span>
            <span><Clock :size="10" /> Arrivé {{ depuisMaintenant(p.heureArrivee) }}</span>
          </div>
        </div>

        <div class="urg-right">
          <span class="urg-niveau" :class="p.niveauUrgence === 'CRITIQUE' ? 'niv-critique' : 'niv-urgent'">
            <Zap :size="10" v-if="p.niveauUrgence === 'CRITIQUE'" />
            <AlertTriangle :size="10" v-else />
            {{ p.niveauUrgence }}
          </span>
          <RouterLink :to="`/medecin/consultation/${p.id}`" class="btn-consulter">
            <Stethoscope :size="13" /> Consulter
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Pied de page info -->
    <div v-if="!chargement" class="urg-footer">
      <Info :size="13" />
      Seuls les patients CRITIQUE et URGENT sont affichés. Pour tous les patients, consultez la
      <RouterLink to="/medecin/file-attente" class="urg-link">file d'attente</RouterLink>.
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  AlertTriangle, Zap, ShieldCheck, RefreshCw, User, Phone,
  MessageSquare, Clock, Stethoscope, Info,
} from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { depuisMaintenant } = useDate()

const chargement = ref(true)
const urgences   = ref([])
const filtre     = ref('tous')

let intervalle = null

const niveaux = [
  { val: 'tous',     label: 'Tous',     cls: '',         icone: AlertTriangle },
  { val: 'CRITIQUE', label: 'Critique', cls: 'fb-red',   icone: Zap          },
  { val: 'URGENT',   label: 'Urgent',   cls: 'fb-amber', icone: AlertTriangle },
]

const compteParNiveau = computed(() => ({
  CRITIQUE: urgences.value.filter(u => u.niveauUrgence === 'CRITIQUE').length,
  URGENT:   urgences.value.filter(u => u.niveauUrgence === 'URGENT').length,
}))

const urgencesFiltrees = computed(() => {
  if (filtre.value === 'tous') return urgences.value
  return urgences.value.filter(u => u.niveauUrgence === filtre.value)
})

async function charger() {
  chargement.value = true
  try {
    urgences.value = await api.get('/medecin/urgences')
  } finally { chargement.value = false }
}

onMounted(() => {
  charger()
  intervalle = setInterval(charger, 30000)
})

onUnmounted(() => clearInterval(intervalle))
</script>

<style scoped>
@keyframes fadeInUp  { from { opacity:0;transform:translateY(14px) } to { opacity:1;transform:none } }
@keyframes shimmer   { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
@keyframes spin      { to { transform:rotate(360deg) } }
@keyframes spin-slow { to { transform:rotate(360deg) } }
@keyframes pulse-red { 0%,100% { box-shadow:0 0 0 0 rgba(239,68,68,.5) } 50% { box-shadow:0 0 0 8px rgba(239,68,68,0) } }

.urg-wrap { display:flex;flex-direction:column;gap:1.25rem; }

.urg-header { display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem; }
.urg-title-row { display:flex;align-items:center;gap:.625rem; }
.urg-icon { width:36px;height:36px;border-radius:.75rem;background:linear-gradient(135deg,#F87171,#DC2626);display:flex;align-items:center;justify-content:center;color:white; }
.pulse-icon { animation:pulse-red 2s ease infinite; }
.urg-title { font-family:var(--font-display);font-size:1.15rem;font-weight:800;color:var(--color-text); }
.urg-badge { border-radius:9999px;font-size:.72rem;font-weight:700;padding:2px 9px; }
.urg-badge-red  { background:linear-gradient(135deg,#F87171,#DC2626);color:white; }
.urg-badge-gray { background:#E2E8F0;color:#64748B; }

.urg-actions { display:flex;align-items:center;gap:.625rem; }
.refresh-info { display:flex;align-items:center;gap:.375rem;font-size:.75rem;color:var(--color-text-muted); }
.btn-refresh { width:32px;height:32px;border-radius:.625rem;border:1.5px solid #E2E8F0;background:white;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--color-text-muted);transition:all .15s; }
.btn-refresh:hover { border-color:#F87171;color:#DC2626; }

/* .filtres-tabs, .filtre-btn, .fb-* — styles globaux dans style.css */

.urg-list { display:flex;flex-direction:column;gap:.75rem; }
.urg-card { display:flex;align-items:center;gap:.875rem;background:white;border:2px solid #E2E8F0;border-radius:1.25rem;padding:1rem 1.25rem;animation:fadeInUp .4s ease both;transition:box-shadow .2s; }
.urg-card:hover { box-shadow:0 6px 24px rgba(0,0,0,.08); }
.urg-critique { border-color:rgba(239,68,68,.4);background:rgba(239,68,68,.02); }
.urg-urgent   { border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.02); }

.niv-indicator { width:36px;height:36px;border-radius:.75rem;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.ind-critique { background:rgba(239,68,68,.12);color:#DC2626; }
.ind-urgent   { background:rgba(245,158,11,.12);color:#D97706; }

.urg-avatar { width:42px;height:42px;border-radius:50%;background:#F8FAFC;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);flex-shrink:0;border:2px solid #E2E8F0; }

.urg-info { flex:1;min-width:0; }
.urg-nom { font-size:.92rem;font-weight:700;color:var(--color-text); }
.urg-meta { display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;margin-top:.25rem; }
.urg-meta span { display:inline-flex;align-items:center;gap:.25rem;font-size:.72rem;color:var(--color-text-muted); }

.urg-right { display:flex;flex-direction:column;align-items:flex-end;gap:.5rem;flex-shrink:0; }
.urg-niveau { display:inline-flex;align-items:center;gap:.3rem;font-size:.68rem;font-weight:700;padding:3px 9px;border-radius:9999px;text-transform:uppercase; }
.niv-critique { background:rgba(239,68,68,.12);color:#DC2626;border:1px solid rgba(239,68,68,.3); }
.niv-urgent   { background:rgba(245,158,11,.12);color:#D97706;border:1px solid rgba(245,158,11,.3); }

.btn-consulter { display:inline-flex;align-items:center;gap:.375rem;background:linear-gradient(135deg,#22C55E,#059669);color:white;border-radius:.625rem;padding:.45rem .875rem;font-size:.78rem;font-weight:700;text-decoration:none;transition:box-shadow .2s,transform .2s; }
.btn-consulter:hover { box-shadow:0 4px 14px rgba(34,197,94,.4);transform:scale(1.03); }

.urg-footer { display:flex;align-items:center;gap:.375rem;font-size:.78rem;color:var(--color-text-muted);padding:.75rem 1rem;background:#F8FAFC;border-radius:.875rem;border:1px solid #E2E8F0; }
.urg-link { color:var(--color-primary);font-weight:600;text-decoration:none; }
.urg-link:hover { text-decoration:underline; }

.vide-box { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4rem 1rem; }
.vide-titre { font-size:1rem;font-weight:700;color:var(--color-text);margin:0; }
.vide-sub   { font-size:.85rem;color:var(--color-text-muted);margin:.25rem 0 0; }

.skel-list { display:flex;flex-direction:column;gap:.75rem; }
.skel-row  { height:80px;background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:1.25rem;animation:shimmer 1.5s infinite; }
.spin { animation:spin 1s linear infinite; }
.spin-slow { animation:spin-slow 3s linear infinite; }
</style>
