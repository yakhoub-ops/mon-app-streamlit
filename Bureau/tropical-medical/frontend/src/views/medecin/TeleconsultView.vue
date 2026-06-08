<template>
  <div>

    <!-- TOGGLE DISPONIBILITÉ -->
    <div class="toggle-banner" :class="teleconsultActive ? 'toggle-on' : 'toggle-off'">
      <div class="toggle-bg"></div>
      <div class="toggle-content">
        <div class="toggle-left">
          <div class="toggle-icon-box">
            <component :is="teleconsultActive ? Wifi : WifiOff" :size="26" />
            <span v-if="teleconsultActive" class="toggle-pulse"></span>
          </div>
          <div>
            <div class="toggle-title">Disponibilité téléconsultation</div>
            <div class="toggle-desc">
              <span v-if="teleconsultActive">Vous êtes <strong>disponible</strong> pour les consultations à distance</span>
              <span v-else>Vous êtes <strong>indisponible</strong> pour les consultations à distance</span>
            </div>
          </div>
        </div>
        <div class="toggle-right">
          <span class="toggle-lbl">{{ teleconsultActive ? 'Activée' : 'Désactivée' }}</span>
          <button
            class="toggle-switch"
            :class="teleconsultActive ? 'switch-on' : 'switch-off'"
            :disabled="toggling"
            @click="basculer"
            :title="teleconsultActive ? 'Désactiver la téléconsultation' : 'Activer la téléconsultation'"
          >
            <span class="switch-track">
              <span class="switch-thumb">
                <Loader2 v-if="toggling" :size="12" class="spin-icon" />
                <Check    v-else-if="teleconsultActive" :size="12" />
                <X        v-else :size="12" />
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Toast feedback -->
    <Transition name="toast">
      <div v-if="toastMsg" class="toast-feedback" :class="toastOk ? 'toast-ok' : 'toast-err'">
        <component :is="toastOk ? CheckCircle : AlertCircle" :size="16" />
        {{ toastMsg }}
      </div>
    </Transition>

    <h1 class="page-titre" style="margin-bottom:1.5rem;margin-top:1.75rem">Mes téléconsultations</h1>

    <div v-if="chargement" style="display:flex;flex-direction:column;gap:.875rem">
      <div class="skeleton-block" v-for="i in 3" :key="i" style="height:100px"></div>
    </div>

    <template v-else>
      <!-- À venir -->
      <div v-if="avenir.length" style="margin-bottom:2rem">
        <h2 class="section-titre"><CalendarClock :size="17" /> À venir</h2>
        <div style="display:flex;flex-direction:column;gap:.875rem">
          <div v-for="r in avenir" :key="r.id" class="card tc-card">
            <div class="tc-avatar"><Video :size="22" /></div>
            <div style="flex:1;min-width:0">
              <div class="tc-nom">{{ r.patient.utilisateur.prenom }} {{ r.patient.utilisateur.nom }}</div>
              <div class="tc-detail">
                <Clock :size="13" /> {{ fmtDateHeure(r.date) }}
                <span v-if="r.motif"> · {{ r.motif }}</span>
              </div>
              <div v-if="r.patient.utilisateur.telephone" class="tc-detail">
                <Phone :size="12" /> {{ r.patient.utilisateur.telephone }}
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:.375rem;flex-shrink:0;align-items:flex-end">
              <span class="badge badge-info">
                <Wifi :size="11" /> Téléconsultation
              </span>
              <button v-if="r.teleconsultation" class="btn btn-primary btn-sm" @click="rejoindre(r.teleconsultation)">
                <Video :size="14" /> Rejoindre
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Passées -->
      <div v-if="passes.length">
        <h2 class="section-titre"><History :size="17" /> Historique</h2>
        <div class="card table-wrap">
          <table class="table-tm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Statut</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in passes" :key="r.id">
                <td style="font-size:.83rem">{{ fmtDateHeure(r.date) }}</td>
                <td>
                  <div style="font-weight:600;font-size:.88rem">{{ r.patient.utilisateur.prenom }} {{ r.patient.utilisateur.nom }}</div>
                  <div style="font-size:.75rem;color:var(--color-text-muted)">{{ r.motif || '—' }}</div>
                </td>
                <td>
                  <span class="badge" :class="r.statut==='TERMINE'?'badge-green':r.statut==='ANNULE'?'badge-danger':'badge-gray'">
                    {{ lblStatut(r.statut) }}
                  </span>
                </td>
                <td style="font-size:.83rem;color:var(--color-text-muted)">
                  {{ r.teleconsultation?.duree ? r.teleconsultation.duree+' min' : '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="!avenir.length && !passes.length" class="vide-center">
        <Video :size="52" style="opacity:.25;margin-bottom:.875rem" />
        <p style="color:var(--color-text-muted)">Aucune téléconsultation</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  CalendarClock, Video, Clock, Phone, Wifi, WifiOff,
  History, Check, X, Loader2, CheckCircle, AlertCircle,
} from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const router = useRouter()
const api = useApi()
const { fmtDateHeure, estPasse } = useDate()

// ── Toggle téléconsultation ──────────────────────────────────────────────────
const teleconsultActive = ref(false)
const toggling  = ref(false)
const toastMsg  = ref('')
const toastOk   = ref(true)
let toastTimer  = null

function afficherToast(msg, ok = true) {
  toastMsg.value = msg
  toastOk.value  = ok
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 3000)
}

async function basculer() {
  if (toggling.value) return
  toggling.value = true
  try {
    const res = await api.put('/medecin/teleconsultation/statut', { actif: !teleconsultActive.value })
    teleconsultActive.value = res.teleconsultationActive
    afficherToast(teleconsultActive.value ? 'Téléconsultation activée' : 'Téléconsultation désactivée', true)
  } catch {
    afficherToast('Erreur lors du changement de statut', false)
  } finally {
    toggling.value = false
  }
}

// ── Agenda téléconsultations ─────────────────────────────────────────────────
function rejoindre(tc) {
  const roomId = tc?.urlVisio?.split('/').pop()
  if (roomId) router.push(`/salle/${roomId}`)
  else if (tc?.urlVisio) window.open(tc.urlVisio, '_blank')
}

const chargement = ref(true)
const rdvs       = ref([])

const avenir = computed(() => rdvs.value.filter(r => !estPasse(r.date) && r.statut !== 'ANNULE'))
const passes = computed(() => rdvs.value.filter(r => estPasse(r.date) || r.statut === 'ANNULE'))

onMounted(async () => {
  try {
    const [profil, tous] = await Promise.all([
      api.get('/medecin/profil'),
      api.get('/medecin/agenda'),
    ])
    teleconsultActive.value = profil.teleconsultationActive ?? false
    rdvs.value = tous.filter(r => r.type === 'TELECONSULTATION')
  } finally { chargement.value = false }
})

function lblStatut(s) { return { EN_ATTENTE:'En attente', CONFIRME:'Confirmé', TERMINE:'Terminé', ANNULE:'Annulé' }[s] || s }
</script>

<style scoped>
/* Toggle banner */
.toggle-banner {
  border-radius: 1.375rem;
  padding: 1.5rem 1.75rem;
  position: relative;
  overflow: hidden;
  transition: background .45s, box-shadow .45s;
}
.toggle-on  {
  background: linear-gradient(135deg, #10B981, #059669);
  box-shadow: 0 8px 32px rgba(5,150,105,.3);
}
.toggle-off {
  background: linear-gradient(135deg, #94A3B8, #475569);
  box-shadow: 0 8px 32px rgba(71,85,105,.2);
}
.toggle-bg {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 80% 50%, rgba(255,255,255,.08), transparent 60%);
}
.toggle-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.toggle-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
}
.toggle-icon-box {
  width: 54px; height: 54px;
  border-radius: 1rem;
  background: rgba(255,255,255,.18);
  border: 1px solid rgba(255,255,255,.3);
  display: flex; align-items: center; justify-content: center;
  color: white;
  flex-shrink: 0;
  position: relative;
}
.toggle-pulse {
  position: absolute; inset: -5px;
  border-radius: inherit;
  border: 2px solid rgba(255,255,255,.45);
  animation: pulse-ring 2s ease-out infinite;
}
.toggle-title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: white;
  margin-bottom: .25rem;
}
.toggle-desc {
  font-size: .82rem;
  color: rgba(255,255,255,.82);
}
.toggle-desc strong { color: white; }

.toggle-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}
.toggle-lbl {
  font-size: .82rem;
  font-weight: 700;
  color: rgba(255,255,255,.9);
  min-width: 72px;
  text-align: right;
}

/* Switch */
.toggle-switch {
  all: unset;
  cursor: pointer;
  display: flex;
  align-items: center;
  position: relative;
  padding: 0;
}
.toggle-switch:disabled { cursor: wait; opacity: .7; }
.switch-track {
  display: flex;
  align-items: center;
  width: 64px; height: 34px;
  border-radius: 9999px;
  padding: 3px;
  transition: background .3s;
  background: rgba(255,255,255,.22);
  border: 2px solid rgba(255,255,255,.4);
  box-sizing: border-box;
}
.switch-on .switch-track  { background: rgba(255,255,255,.35); }
.switch-off .switch-track { background: rgba(0,0,0,.22); }
.switch-thumb {
  width: 26px; height: 26px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .7rem;
  transition: transform .3s cubic-bezier(.4,0,.2,1), background .3s;
  flex-shrink: 0;
}
.switch-on  .switch-thumb { background: white; color: #059669; transform: translateX(30px); }
.switch-off .switch-thumb { background: rgba(255,255,255,.5); color: white; transform: translateX(0); }

.spin-icon { animation: spin 1s linear infinite; }

/* Toast */
.toast-feedback {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .6rem 1.125rem;
  border-radius: .875rem;
  font-size: .84rem;
  font-weight: 600;
  margin-top: .75rem;
  border: 1px solid;
}
.toast-ok  { background: rgba(74,222,128,.12); color: #15803D; border-color: rgba(74,222,128,.3); }
.toast-err { background: rgba(248,113,113,.12); color: #DC2626; border-color: rgba(248,113,113,.3); }

.toast-enter-active, .toast-leave-active { transition: opacity .25s, transform .25s; }
.toast-enter-from  { opacity: 0; transform: translateY(-8px); }
.toast-leave-to    { opacity: 0; transform: translateY(-8px); }

/* Page content */
.page-titre    { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
.section-titre { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--color-text);margin-bottom:1rem }
.tc-card       { display:flex;align-items:flex-start;gap:1rem;padding:1.125rem 1.25rem;border-left:3px solid var(--color-info) }
.tc-avatar     { width:46px;height:46px;border-radius:.75rem;background:rgba(14,165,233,0.1);display:flex;align-items:center;justify-content:center;color:#0EA5E9;flex-shrink:0 }
.tc-nom        { font-weight:700;font-size:.95rem;color:var(--color-text);margin-bottom:.25rem }
.tc-detail     { display:flex;align-items:center;gap:.375rem;font-size:.78rem;color:var(--color-text-muted);margin-top:.15rem }
.vide-center   { display:flex;flex-direction:column;align-items:center;padding:4rem 1rem }
.skeleton-block{ background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.75rem;animation:shimmer 1.5s infinite }

@keyframes shimmer   { 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }
@keyframes pulse-ring{ 0%{ transform:scale(1);opacity:.5 } 100%{ transform:scale(1.9);opacity:0 } }
@keyframes spin      { to{ transform:rotate(360deg) } }
</style>
