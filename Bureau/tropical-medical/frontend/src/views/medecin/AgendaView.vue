<template>
  <div class="agenda-wrap">

    <!-- En-tête -->
    <div class="ag-header">
      <div class="ag-title-row">
        <div class="ag-icon"><Calendar :size="18" /></div>
        <h1 class="ag-title">Mon agenda</h1>
      </div>
      <div class="ag-filters">
        <button v-for="f in filtres" :key="f.val"
          class="filter-btn" :class="{ active: filtre === f.val }"
          @click="filtre = f.val">
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- Chargement -->
    <div v-if="chargement" class="skel-list">
      <div class="skel-row" v-for="i in 5" :key="i"></div>
    </div>

    <!-- Vide -->
    <div v-else-if="!rdvsFiltres.length" class="vide-box">
      <CalendarOff :size="48" style="opacity:.25;margin-bottom:.75rem" />
      <p>Aucun rendez-vous pour cette période</p>
    </div>

    <!-- Liste groupée par date -->
    <div v-else class="groupes">
      <div v-for="(groupe, date) in rdvsGroupes" :key="date" class="groupe">
        <div class="groupe-date">
          <span class="date-pill">{{ fmtDateGroupe(date) }}</span>
          <span class="date-count">{{ groupe.length }} RDV</span>
        </div>
        <div class="rdv-list">
          <div v-for="r in groupe" :key="r.id" class="rdv-card" :class="statutClass(r.statut)">
            <div class="rdv-time">
              <Clock :size="13" />
              {{ fmtHeure(r.date) }}
            </div>
            <div class="rdv-sep"></div>
            <div class="rdv-avatar"><User :size="16" /></div>
            <div class="rdv-info">
              <div class="rdv-nom">{{ r.patient.utilisateur.prenom }} {{ r.patient.utilisateur.nom }}</div>
              <div class="rdv-motif">{{ r.motif || 'Consultation' }}</div>
            </div>
            <div class="rdv-right">
              <span class="badge-type" :class="r.type === 'TELECONSULTATION' ? 'badge-tele' : 'badge-pres'">
                <Video v-if="r.type === 'TELECONSULTATION'" :size="10" /> <MapPin v-else :size="10" />
                {{ r.type === 'TELECONSULTATION' ? 'Télé' : 'Présentiel' }}
              </span>
              <span class="badge-statut" :class="statutBadge(r.statut)">{{ labelStatut(r.statut) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Calendar, CalendarOff, Clock, User, Video, MapPin } from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { fmtHeure } = useDate()

const chargement = ref(true)
const rdvs       = ref([])
const filtre     = ref('semaine')

const filtres = [
  { val: 'aujourd_hui', label: "Aujourd'hui" },
  { val: 'semaine',     label: 'Cette semaine' },
  { val: 'mois',        label: 'Ce mois' },
  { val: 'tous',        label: 'Tous' },
]

onMounted(async () => {
  try {
    rdvs.value = await api.get('/medecin/agenda')
  } finally { chargement.value = false }
})

const rdvsFiltres = computed(() => {
  const maintenant = new Date()
  const debutJour = new Date(maintenant); debutJour.setHours(0, 0, 0, 0)
  const finJour = new Date(maintenant); finJour.setHours(23, 59, 59, 999)

  return rdvs.value.filter(r => {
    const d = new Date(r.date)
    if (filtre.value === 'aujourd_hui') return d >= debutJour && d <= finJour
    if (filtre.value === 'semaine') {
      const fin = new Date(debutJour); fin.setDate(fin.getDate() + 7)
      return d >= debutJour && d <= fin
    }
    if (filtre.value === 'mois') {
      const fin = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0, 23, 59, 59)
      return d >= debutJour && d <= fin
    }
    return true
  })
})

const rdvsGroupes = computed(() => {
  const groupes = {}
  for (const r of rdvsFiltres.value) {
    const cle = new Date(r.date).toISOString().slice(0, 10)
    if (!groupes[cle]) groupes[cle] = []
    groupes[cle].push(r)
  }
  return groupes
})

function fmtDateGroupe(dateStr) {
  const d = new Date(dateStr)
  const auj = new Date(); auj.setHours(0, 0, 0, 0)
  const dem = new Date(auj); dem.setDate(dem.getDate() + 1)
  if (d.toDateString() === auj.toDateString()) return "Aujourd'hui"
  if (d.toDateString() === dem.toDateString()) return 'Demain'
  return d.toLocaleDateString('fr-SN', { weekday: 'long', day: 'numeric', month: 'long' })
}

function statutClass(s) {
  return { EN_ATTENTE: 'rdv-attente', CONFIRME: 'rdv-confirme', TERMINE: 'rdv-termine', ANNULE: 'rdv-annule' }[s] || ''
}

function statutBadge(s) {
  return { EN_ATTENTE: 'bs-orange', CONFIRME: 'bs-green', TERMINE: 'bs-gray', ANNULE: 'bs-red' }[s] || 'bs-gray'
}

function labelStatut(s) {
  return { EN_ATTENTE: 'En attente', CONFIRME: 'Confirmé', TERMINE: 'Terminé', ANNULE: 'Annulé' }[s] || s
}
</script>

<style scoped>
@keyframes fadeInUp { from { opacity:0;transform:translateY(12px) } to { opacity:1;transform:none } }
@keyframes shimmer  { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }

.agenda-wrap { display:flex;flex-direction:column;gap:1.25rem; }

.ag-header { display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem; }
.ag-title-row { display:flex;align-items:center;gap:.625rem; }
.ag-icon { width:36px;height:36px;border-radius:.75rem;background:linear-gradient(135deg,#38BDF8,#0284C7);display:flex;align-items:center;justify-content:center;color:white; }
.ag-title { font-family:var(--font-display);font-size:1.15rem;font-weight:800;color:var(--color-text); }
.ag-filters { display:flex;gap:.375rem;flex-wrap:wrap; }
/* .filter-btn — styles globaux dans style.css */

.groupes { display:flex;flex-direction:column;gap:1.25rem; }
.groupe {}
.groupe-date { display:flex;align-items:center;gap:.625rem;margin-bottom:.625rem; }
.date-pill { background:linear-gradient(135deg,#38BDF8,#0284C7);color:white;border-radius:9999px;padding:.3rem .875rem;font-size:.78rem;font-weight:700;text-transform:capitalize; }
.date-count { font-size:.75rem;color:var(--color-text-muted); }

.rdv-list { display:flex;flex-direction:column;gap:.5rem; }
.rdv-card { display:flex;align-items:center;gap:.75rem;background:white;border:1.5px solid #E2E8F0;border-radius:1rem;padding:.875rem 1.125rem;transition:all .2s;animation:fadeInUp .4s ease both;border-left:4px solid #E2E8F0; }
.rdv-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.07);transform:translateX(3px); }
.rdv-attente { border-left-color:#F59E0B; }
.rdv-confirme { border-left-color:#22C55E; }
.rdv-termine  { border-left-color:#94A3B8;opacity:.7; }
.rdv-annule   { border-left-color:#EF4444;opacity:.6; }

.rdv-time { display:flex;align-items:center;gap:.3rem;font-size:.82rem;font-weight:700;color:#0284C7;min-width:68px;flex-shrink:0; }
.rdv-sep  { width:1px;height:28px;background:#E2E8F0;flex-shrink:0; }
.rdv-avatar { width:32px;height:32px;border-radius:50%;background:rgba(56,189,248,.12);display:flex;align-items:center;justify-content:center;color:#0284C7;flex-shrink:0; }
.rdv-info { flex:1;min-width:0; }
.rdv-nom  { font-size:.88rem;font-weight:600;color:var(--color-text); }
.rdv-motif{ font-size:.73rem;color:var(--color-text-muted);margin-top:.1rem; }
.rdv-right { display:flex;align-items:center;gap:.375rem;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end; }

.badge-type { display:inline-flex;align-items:center;gap:.25rem;font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:9999px; }
.badge-tele { background:rgba(56,189,248,.12);color:#0284C7;border:1px solid rgba(56,189,248,.3); }
.badge-pres { background:rgba(74,222,128,.12);color:#16A34A;border:1px solid rgba(74,222,128,.3); }

.badge-statut { font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:9999px;text-transform:uppercase; }
.bs-orange { background:rgba(245,158,11,.12);color:#D97706;border:1px solid rgba(245,158,11,.3); }
.bs-green  { background:rgba(74,222,128,.12);color:#16A34A;border:1px solid rgba(74,222,128,.3); }
.bs-gray   { background:rgba(148,163,184,.12);color:#64748B;border:1px solid rgba(148,163,184,.3); }
.bs-red    { background:rgba(239,68,68,.12);color:#DC2626;border:1px solid rgba(239,68,68,.3); }

.vide-box { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5rem 1rem;color:var(--color-text-muted);font-size:.9rem; }
.skel-list { display:flex;flex-direction:column;gap:.5rem; }
.skel-row  { height:72px;background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:1rem;animation:shimmer 1.5s infinite; }
</style>
