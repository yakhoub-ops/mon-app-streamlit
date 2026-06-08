<template>
  <div class="cons-wrap">

    <!-- En-tête -->
    <div class="cons-header">
      <div class="cons-title-row">
        <div class="cons-icon"><Stethoscope :size="18" /></div>
        <h1 class="cons-title">Consultations</h1>
        <span class="cons-count" v-if="!chargement">{{ consultationsFiltrees.length }}</span>
      </div>
      <div class="search-box">
        <Search :size="15" class="search-ic" />
        <input v-model="recherche" type="text" placeholder="Rechercher un patient…" class="search-input" />
      </div>
    </div>

    <!-- Chargement -->
    <div v-if="chargement" class="skel-list">
      <div class="skel-row" v-for="i in 6" :key="i"></div>
    </div>

    <!-- Vide -->
    <div v-else-if="!consultationsFiltrees.length" class="vide-box">
      <Stethoscope :size="48" style="opacity:.2;margin-bottom:.75rem" />
      <p>Aucune consultation trouvée</p>
    </div>

    <!-- Tableau -->
    <div v-else class="cons-table-wrap">
      <table class="cons-table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Date</th>
            <th>Motif</th>
            <th>Diagnostic</th>
            <th>Ordonnance</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in consultationsFiltrees" :key="c.id" class="cons-row"
              @click="selectionner(c)" :class="{ selected: selected?.id === c.id }">
            <td>
              <div class="patient-cell">
                <div class="p-avatar"><User :size="14" /></div>
                <div>
                  <div class="p-nom">{{ c.dossier.patient.utilisateur.prenom }} {{ c.dossier.patient.utilisateur.nom }}</div>
                  <div class="p-tel">{{ c.dossier.patient.utilisateur.telephone || '—' }}</div>
                </div>
              </div>
            </td>
            <td class="td-date">
              <div class="date-main">{{ fmtDate(c.createdAt) }}</div>
              <div class="date-heure">{{ fmtHeure(c.createdAt) }}</div>
            </td>
            <td class="td-text">{{ c.motif || '—' }}</td>
            <td class="td-text">{{ c.diagnostic ? tronquer(c.diagnostic, 50) : '—' }}</td>
            <td>
              <span v-if="c.ordonnances.length" class="ordo-badge">
                <Pill :size="10" /> {{ c.ordonnances.length }}
              </span>
              <span v-else class="no-ordo">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Panneau détail -->
    <Transition name="slide-panel">
      <div v-if="selected" class="detail-panel">
        <div class="detail-header">
          <div class="detail-titre">
            <FileText :size="16" style="color:var(--color-primary)" />
            Détail consultation
          </div>
          <button class="close-btn" @click="selected = null"><X :size="16" /></button>
        </div>

        <div class="detail-patient">
          <div class="dp-avatar"><User :size="20" /></div>
          <div>
            <div class="dp-nom">{{ selected.dossier.patient.utilisateur.prenom }} {{ selected.dossier.patient.utilisateur.nom }}</div>
            <div class="dp-date">{{ fmtDate(selected.createdAt) }} à {{ fmtHeure(selected.createdAt) }}</div>
          </div>
        </div>

        <div class="detail-sections">
          <div v-if="selected.motif" class="ds">
            <div class="ds-label"><MessageSquare :size="12" /> Motif</div>
            <div class="ds-val">{{ selected.motif }}</div>
          </div>
          <div v-if="selected.anamnese" class="ds">
            <div class="ds-label"><ClipboardList :size="12" /> Anamnèse</div>
            <div class="ds-val">{{ selected.anamnese }}</div>
          </div>
          <div v-if="selected.examenClinique" class="ds">
            <div class="ds-label"><Activity :size="12" /> Examen clinique</div>
            <div class="ds-val">{{ selected.examenClinique }}</div>
          </div>
          <div v-if="selected.diagnostic" class="ds">
            <div class="ds-label"><Eye :size="12" /> Diagnostic</div>
            <div class="ds-val">{{ selected.diagnostic }}</div>
          </div>
          <div v-if="selected.traitement" class="ds">
            <div class="ds-label"><Pill :size="12" /> Traitement</div>
            <div class="ds-val">{{ selected.traitement }}</div>
          </div>
          <div v-if="selected.notes" class="ds">
            <div class="ds-label"><FileText :size="12" /> Notes</div>
            <div class="ds-val">{{ selected.notes }}</div>
          </div>
          <div v-if="selected.ordonnances.length" class="ds">
            <div class="ds-label"><Pill :size="12" /> Ordonnances</div>
            <div class="ordo-count-detail">{{ selected.ordonnances.length }} ordonnance(s) attachée(s)</div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Stethoscope, Search, User, Pill, FileText, X,
  MessageSquare, ClipboardList, Activity, Eye,
} from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { fmtHeure, fmt: fmtDate } = useDate()

const chargement    = ref(true)
const consultations = ref([])
const recherche     = ref('')
const selected      = ref(null)

onMounted(async () => {
  try {
    consultations.value = await api.get('/medecin/consultations')
  } finally { chargement.value = false }
})

const consultationsFiltrees = computed(() => {
  if (!recherche.value.trim()) return consultations.value
  const q = recherche.value.toLowerCase()
  return consultations.value.filter(c => {
    const p = c.dossier.patient.utilisateur
    return `${p.prenom} ${p.nom}`.toLowerCase().includes(q)
  })
})

function selectionner(c) {
  selected.value = selected.value?.id === c.id ? null : c
}

function tronquer(txt, n) {
  return txt.length > n ? txt.slice(0, n) + '…' : txt
}
</script>

<style scoped>
@keyframes shimmer  { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }

.cons-wrap { display:flex;flex-direction:column;gap:1.25rem; }

.cons-header { display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem; }
.cons-title-row { display:flex;align-items:center;gap:.625rem; }
.cons-icon { width:36px;height:36px;border-radius:.75rem;background:linear-gradient(135deg,#2DD4BF,#0F766E);display:flex;align-items:center;justify-content:center;color:white; }
.cons-title { font-family:var(--font-display);font-size:1.15rem;font-weight:800;color:var(--color-text); }
.cons-count { background:linear-gradient(135deg,#2DD4BF,#0F766E);color:white;border-radius:9999px;font-size:.72rem;font-weight:700;padding:2px 9px; }

.search-box { position:relative;display:flex;align-items:center; }
.search-ic  { position:absolute;left:.75rem;color:var(--color-text-muted);pointer-events:none; }
.search-input { padding:.5rem .75rem .5rem 2.25rem;border:1.5px solid #E2E8F0;border-radius:9999px;font-size:.84rem;outline:none;transition:border .15s;background:white;width:220px; }
.search-input:focus { border-color:#2DD4BF; }

.cons-table-wrap { background:white;border:1px solid #E2E8F0;border-radius:1.25rem;overflow:auto; }
.cons-table { width:100%;border-collapse:collapse; }
.cons-table thead tr { background:#F8FAFC;border-bottom:1.5px solid #E2E8F0; }
.cons-table th { padding:.75rem 1rem;text-align:left;font-size:.72rem;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em;white-space:nowrap; }
.cons-row { border-bottom:1px solid #F1F5F9;cursor:pointer;transition:background .15s; }
.cons-row:last-child { border-bottom:none; }
.cons-row:hover { background:rgba(45,212,191,.04); }
.cons-row.selected { background:rgba(45,212,191,.08); }
.cons-table td { padding:.75rem 1rem;vertical-align:middle; }

.patient-cell { display:flex;align-items:center;gap:.625rem; }
.p-avatar { width:30px;height:30px;border-radius:50%;background:rgba(45,212,191,.12);display:flex;align-items:center;justify-content:center;color:#0F766E;flex-shrink:0; }
.p-nom  { font-size:.84rem;font-weight:600;color:var(--color-text); }
.p-tel  { font-size:.72rem;color:var(--color-text-muted); }

.td-date { white-space:nowrap; }
.date-main  { font-size:.82rem;font-weight:600;color:var(--color-text); }
.date-heure { font-size:.72rem;color:var(--color-text-muted); }
.td-text { font-size:.82rem;color:var(--color-text-muted);max-width:180px; }

.ordo-badge { display:inline-flex;align-items:center;gap:.3rem;background:rgba(45,212,191,.12);color:#0F766E;border:1px solid rgba(45,212,191,.3);border-radius:9999px;font-size:.7rem;font-weight:700;padding:2px 8px; }
.no-ordo { color:#CBD5E1;font-size:.85rem; }

/* Panel détail */
.detail-panel { background:white;border:1.5px solid #E2E8F0;border-radius:1.25rem;padding:1.25rem; }
.detail-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem; }
.detail-titre { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:.95rem;font-weight:700;color:var(--color-text); }
.close-btn { background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex;align-items:center;padding:.25rem;border-radius:.5rem; }
.close-btn:hover { background:#F1F5F9; }

.detail-patient { display:flex;align-items:center;gap:.75rem;padding:.875rem;background:#F8FAFC;border-radius:.875rem;margin-bottom:1rem; }
.dp-avatar { width:40px;height:40px;border-radius:50%;background:rgba(45,212,191,.12);display:flex;align-items:center;justify-content:center;color:#0F766E;flex-shrink:0; }
.dp-nom  { font-weight:700;font-size:.95rem;color:var(--color-text); }
.dp-date { font-size:.75rem;color:var(--color-text-muted);margin-top:.15rem; }

.detail-sections { display:flex;flex-direction:column;gap:.75rem; }
.ds { }
.ds-label { display:flex;align-items:center;gap:.3rem;font-size:.72rem;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.2rem; }
.ds-val   { font-size:.85rem;color:var(--color-text);background:#F8FAFC;border-radius:.625rem;padding:.5rem .75rem;line-height:1.5; }
.ordo-count-detail { font-size:.85rem;color:#0F766E;font-weight:600; }

.vide-box { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5rem 1rem;color:var(--color-text-muted);font-size:.9rem; }
.skel-list { display:flex;flex-direction:column;gap:.5rem; }
.skel-row  { height:60px;background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:1rem;animation:shimmer 1.5s infinite; }

.slide-panel-enter-active,.slide-panel-leave-active { transition:all .25s ease; }
.slide-panel-enter-from,.slide-panel-leave-to { opacity:0;transform:translateY(-8px); }
</style>
