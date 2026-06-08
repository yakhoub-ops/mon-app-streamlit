<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-titre">File d'attente</h1>
        <p style="color:var(--color-text-muted);font-size:.875rem">{{ passages.length }} patient(s) en attente</p>
      </div>
      <button class="btn btn-ghost btn-sm" @click="charger" :disabled="chargement">
        <RefreshCw :size="15" :class="chargement?'spin':''" /> Actualiser
      </button>
    </div>

    <div v-if="chargement" style="display:flex;flex-direction:column;gap:.875rem">
      <div class="skeleton-block" v-for="i in 4" :key="i" style="height:100px"></div>
    </div>

    <div v-else-if="passages.length" style="display:flex;flex-direction:column;gap:.875rem">
      <div v-for="(p, idx) in passages" :key="p.id" class="card passage-card">
        <div class="passage-rank">{{ idx + 1 }}</div>

        <div class="passage-avatar">
          <User :size="20" />
        </div>

        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.25rem">
            <span class="passage-nom">{{ p.patient.utilisateur.prenom }} {{ p.patient.utilisateur.nom }}</span>
            <span class="badge" :class="urgenceClass(p.niveauUrgence)">
              <component :is="urgenceIcone(p.niveauUrgence)" :size="11" />
              {{ lblUrgence(p.niveauUrgence) }}
            </span>
            <span v-if="p.statut==='APPELE'" class="badge badge-primary">
              <Volume2 :size="11" /> Appelé
            </span>
          </div>
          <div class="passage-sub">
            <Clock :size="12" /> Arrivé à {{ fmtHeure(p.heureArrivee) }}
            <span v-if="p.motif"> · {{ p.motif }}</span>
          </div>
          <div v-if="p.patient.utilisateur.telephone" class="passage-sub" style="margin-top:.1rem">
            <Phone :size="12" /> {{ p.patient.utilisateur.telephone }}
          </div>
          <div v-if="p.rendezvous" class="passage-sub" style="margin-top:.1rem">
            <Calendar :size="12" /> RDV {{ p.rendezvous.type==='TELECONSULTATION'?'Téléconsultation':'Présentiel' }}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:.375rem;flex-shrink:0">
          <button v-if="p.statut==='EN_ATTENTE'" class="btn btn-outline btn-sm" @click="appeler(p.id)">
            <Volume2 :size="14" /> Appeler
          </button>
          <RouterLink
            v-if="p.patient.dossier"
            :to="`/medecin/consultation/${p.id}`"
            class="btn btn-primary btn-sm"
          >
            <Stethoscope :size="14" /> Consulter
          </RouterLink>
          <span v-else class="hint-erreur"><AlertCircle :size="12" /> Pas de dossier</span>
        </div>
      </div>
    </div>

    <div v-else class="vide-center">
      <CheckCircle :size="52" style="color:var(--color-green);opacity:.6;margin-bottom:.875rem" />
      <p style="color:var(--color-text-muted);font-size:.95rem">File d'attente vide</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  User, Clock, Volume2, Phone, Calendar, RefreshCw,
  Stethoscope, CheckCircle, AlertCircle,
  AlertTriangle, Activity, Info,
} from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { fmtHeure } = useDate()

const chargement = ref(true)
const passages   = ref([])
let intervalle   = null

async function charger() {
  chargement.value = true
  try { passages.value = await api.get('/medecin/file-attente') }
  finally { chargement.value = false }
}

async function appeler(id) {
  await api.put(`/medecin/file-attente/${id}/appeler`)
  await charger()
}

onMounted(() => {
  charger()
  intervalle = setInterval(charger, 30000)
})
onUnmounted(() => clearInterval(intervalle))

function lblUrgence(n) { return { CRITIQUE:'Critique', URGENT:'Urgent', MODERE:'Modéré', FAIBLE:'Faible' }[n] || n }
function urgenceClass(n) { return { CRITIQUE:'badge-danger', URGENT:'badge-warning', MODERE:'badge-info', FAIBLE:'badge-gray' }[n] || 'badge-gray' }
function urgenceIcone(n) { return { CRITIQUE:Activity, URGENT:AlertTriangle, MODERE:Info, FAIBLE:Clock }[n] || Clock }
</script>

<style scoped>
.page-header  { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;gap:1rem }
.page-titre   { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
.passage-card { display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;position:relative }
.passage-rank { position:absolute;top:.5rem;left:.5rem;font-size:.65rem;font-weight:800;color:var(--color-text-muted);background:#F1F5F9;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center }
.passage-avatar { width:44px;height:44px;border-radius:50%;background:rgba(14,159,142,0.12);display:flex;align-items:center;justify-content:center;color:var(--color-primary);flex-shrink:0 }
.passage-nom  { font-weight:700;font-size:.92rem;color:var(--color-text) }
.passage-sub  { display:flex;align-items:center;gap:.3rem;font-size:.75rem;color:var(--color-text-muted) }
.hint-erreur  { display:flex;align-items:center;gap:.3rem;font-size:.73rem;color:var(--color-danger) }
.vide-center  { display:flex;flex-direction:column;align-items:center;padding:5rem 1rem }
.spin         { animation:spin 1s linear infinite }
@keyframes spin{ from{ transform:rotate(0deg) } to{ transform:rotate(360deg) } }
.skeleton-block{ background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.75rem;animation:shimmer 1.5s infinite }
@keyframes shimmer{ 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }
</style>
