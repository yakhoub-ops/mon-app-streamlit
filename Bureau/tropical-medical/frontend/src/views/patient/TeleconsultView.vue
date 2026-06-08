<template>
  <div>
    <h1 class="page-titre" style="margin-bottom:1.5rem">Mes téléconsultations</h1>

    <div v-if="chargement" style="display:flex;flex-direction:column;gap:.875rem">
      <div class="skeleton-block" v-for="i in 3" :key="i" style="height:100px"></div>
    </div>

    <template v-else>
      <!-- À venir -->
      <div v-if="avenir.length" style="margin-bottom:2rem">
        <h2 class="section-titre"><CalendarClock :size="17" /> À venir</h2>
        <div style="display:flex;flex-direction:column;gap:.875rem">
          <div v-for="tc in avenir" :key="tc.id" class="tc-card card tc-active">
            <div class="tc-badge-live" v-if="estAujourdhui(tc.rendezVous.date)">
              <Wifi :size="13" /> En direct
            </div>
            <div class="tc-body">
              <div class="tc-avatar">
                <Video :size="22" />
              </div>
              <div style="flex:1;min-width:0">
                <div class="tc-medecin">Dr. {{ tc.rendezVous.medecin.utilisateur.prenom }} {{ tc.rendezVous.medecin.utilisateur.nom }}</div>
                <div class="tc-specialite">{{ tc.rendezVous.medecin.specialite }}</div>
                <div class="tc-date">
                  <Clock :size="13" /> {{ fmtDateHeure(tc.rendezVous.date) }}
                </div>
                <div v-if="tc.plateforme" class="tc-plateforme">
                  <Monitor :size="12" /> {{ tc.plateforme }}
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:.5rem;flex-shrink:0">
                <span class="badge badge-info">
                  <span class="dot-live" v-if="estAujourdhui(tc.rendezVous.date)"></span>
                  {{ tc.statut==='EN_COURS'?'En cours':tc.statut==='PLANIFIEE'?'Planifiée':tc.statut }}
                </span>
                <button class="btn btn-primary btn-sm" @click="rejoindre(tc)">
                  <Video :size="14" /> Rejoindre
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Passées -->
      <div v-if="passees.length">
        <h2 class="section-titre"><History :size="17" /> Historique</h2>
        <div class="card table-wrap">
          <table class="table-tm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Médecin</th>
                <th>Durée</th>
                <th>Statut</th>
                <th>Compte-rendu</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tc in passees" :key="tc.id">
                <td style="font-size:.83rem">{{ fmtDateHeure(tc.rendezVous.date) }}</td>
                <td>
                  <div style="font-weight:600;font-size:.88rem">Dr. {{ tc.rendezVous.medecin.utilisateur.prenom }} {{ tc.rendezVous.medecin.utilisateur.nom }}</div>
                  <div style="font-size:.75rem;color:var(--color-text-muted)">{{ tc.rendezVous.medecin.specialite }}</div>
                </td>
                <td style="font-size:.83rem">{{ tc.dureeMinutes ? tc.dureeMinutes+' min' : '—' }}</td>
                <td><span class="badge" :class="tcStatutClass(tc.statut)">{{ lblStatut(tc.statut) }}</span></td>
                <td style="font-size:.82rem;color:var(--color-text-muted);max-width:200px">{{ tc.compteRendu || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Vide -->
      <div v-if="!avenir.length && !passees.length" class="vide-center">
        <Video :size="52" style="opacity:.25;margin-bottom:.875rem" />
        <p style="color:var(--color-text-muted);font-size:.9rem;text-align:center">Aucune téléconsultation trouvée.<br>Prenez un RDV de type téléconsultation.</p>
        <RouterLink to="/patient/rdv" class="btn btn-primary" style="margin-top:1rem">
          <CalendarPlus :size="15" /> Prendre un RDV
        </RouterLink>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Video, Clock, CalendarClock, CalendarPlus, Monitor, History, Wifi } from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const router = useRouter()
const api = useApi()
const { fmtDateHeure, estPasse, estAujourdhui } = useDate()

function roomIdDepuisUrl(urlVisio) {
  if (!urlVisio) return null
  return urlVisio.split('/').pop()
}

function rejoindre(tc) {
  const roomId = roomIdDepuisUrl(tc.urlVisio)
  if (roomId) router.push(`/salle/${roomId}`)
  else window.open(tc.urlVisio, '_blank')
}

const chargement     = ref(true)
const teleconsults   = ref([])

const avenir  = computed(() => teleconsults.value.filter(tc => !estPasse(tc.rendezVous.date) || tc.statut==='EN_COURS'))
const passees = computed(() => teleconsults.value.filter(tc => estPasse(tc.rendezVous.date) && tc.statut!=='EN_COURS'))

onMounted(async () => {
  try {
    const rdvs = await api.get('/patient/rdv')
    teleconsults.value = rdvs
      .filter(r => r.type==='TELECONSULTATION' && r.teleconsultation)
      .map(r => ({ ...r.teleconsultation, rendezVous: r }))
  } finally { chargement.value = false }
})

function lblStatut(s) { return {PLANIFIEE:'Planifiée',EN_COURS:'En cours',TERMINEE:'Terminée',ANNULEE:'Annulée'}[s]||s }
function tcStatutClass(s) { return {PLANIFIEE:'badge-info',EN_COURS:'badge-primary',TERMINEE:'badge-green',ANNULEE:'badge-danger'}[s]||'badge-gray' }
</script>

<style scoped>
.page-titre    { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
.section-titre { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--color-text);margin-bottom:1rem }
.tc-card       { padding:1.125rem 1.25rem;position:relative;overflow:hidden }
.tc-active     { border-left:3px solid var(--color-primary) }
.tc-badge-live { position:absolute;top:.75rem;right:.875rem;display:flex;align-items:center;gap:.35rem;font-size:.7rem;font-weight:700;background:rgba(14,159,142,0.12);color:var(--color-primary);padding:2px 8px;border-radius:9999px }
.tc-body       { display:flex;align-items:flex-start;gap:1rem }
.tc-avatar     { width:48px;height:48px;border-radius:.75rem;background:rgba(14,165,233,0.1);display:flex;align-items:center;justify-content:center;color:#0EA5E9;flex-shrink:0 }
.tc-medecin    { font-weight:700;font-size:.95rem;color:var(--color-text);margin-bottom:.125rem }
.tc-specialite { font-size:.78rem;color:var(--color-text-muted) }
.tc-date       { display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--color-text-muted);margin-top:.375rem }
.tc-plateforme { display:flex;align-items:center;gap:.3rem;font-size:.73rem;color:var(--color-text-muted);margin-top:.2rem }
.dot-live      { display:inline-block;width:6px;height:6px;border-radius:50%;background:#0E9F8E;margin-right:2px;animation:pulse-dot 1.5s ease-in-out infinite }
@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.3}}
.vide-center   { display:flex;flex-direction:column;align-items:center;padding:4rem 1rem }
.skeleton-block{background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.75rem;animation:shimmer 1.5s infinite}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
</style>
