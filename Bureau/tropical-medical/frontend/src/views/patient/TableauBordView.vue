<template>
  <div class="tbd-wrap">

    <!-- ══ HERO BANNER ══════════════════════════════════════════ -->
    <div class="hero-banner">
      <div class="hero-bg"></div>
      <div class="hero-particles">
        <span v-for="i in 12" :key="i" class="particle" :class="`p${i}`"></span>
      </div>
      <div class="hero-content">
        <div class="hero-left" style="animation: slideInLeft .6s ease both">
          <div class="hero-tag">
            <Heart :size="13" class="tag-icon" />
            Espace patient
          </div>
          <h1 class="hero-title">
            Bonjour, <span class="hero-name">{{ prenom }}</span> 👋
          </h1>
          <p class="hero-date">{{ dateAujourdui }}</p>
          <div class="hero-meta">
            <div class="hero-meta-item">
              <Shield :size="13" />
              <span>Suivi médical actif</span>
            </div>
            <div class="hero-meta-dot"></div>
            <div class="hero-meta-item">
              <Activity :size="13" />
              <span>Données à jour</span>
            </div>
          </div>
        </div>
        <div class="hero-right" style="animation: slideInRight .6s ease both">
          <div class="hero-circle-wrap">
            <div class="hero-circle hero-circle-1"></div>
            <div class="hero-circle hero-circle-2"></div>
            <div class="hero-circle hero-circle-3"></div>
            <div class="hero-avatar">
              <img
                v-if="auth.utilisateur?.avatar"
                :src="auth.utilisateur.avatar"
                class="hero-avatar-img"
                :alt="prenom"
              />
              <User v-else :size="40" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ BANNIÈRE RAPPEL RDV ══════════════════════════════════ -->
    <transition name="rappel-slide">
      <div v-if="rappelInfo" class="rappel-banner" :class="rappelInfo.urgence">
        <div class="rappel-left">
          <div class="rappel-icon-ring">
            <Bell :size="22" class="rappel-bell" />
          </div>
          <div class="rappel-text">
            <div class="rappel-titre">{{ rappelInfo.titre }}</div>
            <div class="rappel-desc">
              avec Dr. {{ prochainRdv.medecin.utilisateur.prenom }} {{ prochainRdv.medecin.utilisateur.nom }}
              — {{ fmtHeure(prochainRdv.date) }}
              <span class="rappel-specialite">· {{ prochainRdv.medecin.specialite }}</span>
            </div>
          </div>
        </div>
        <div class="rappel-center">
          <div class="countdown-wrap">
            <div class="cd-bloc" v-if="countdown.heures > 0 || countdown.jours > 0">
              <span class="cd-val">{{ String(countdown.jours > 0 ? countdown.jours : countdown.heures).padStart(2,'0') }}</span>
              <span class="cd-lbl">{{ countdown.jours > 0 ? 'j' : 'h' }}</span>
            </div>
            <div class="cd-sep" v-if="countdown.heures > 0 || countdown.jours > 0">:</div>
            <div class="cd-bloc">
              <span class="cd-val">{{ String(countdown.jours > 0 ? countdown.heures : countdown.minutes).padStart(2,'0') }}</span>
              <span class="cd-lbl">{{ countdown.jours > 0 ? 'h' : 'min' }}</span>
            </div>
            <div class="cd-sep">:</div>
            <div class="cd-bloc">
              <span class="cd-val">{{ String(countdown.jours > 0 ? countdown.minutes : countdown.secondes).padStart(2,'0') }}</span>
              <span class="cd-lbl">{{ countdown.jours > 0 ? 'min' : 's' }}</span>
            </div>
          </div>
        </div>
        <div class="rappel-actions">
          <RouterLink v-if="prochainRdv.type==='TELECONSULTATION'" to="/patient/teleconsultation" class="btn-rappel-join">
            <Video :size="14" /> Rejoindre
          </RouterLink>
          <RouterLink to="/patient/rdv" class="btn-rappel-voir">
            <CalendarClock :size="13" /> Voir le RDV
          </RouterLink>
        </div>
        <button class="rappel-close" @click="masquerRappel = true" title="Masquer"><X :size="14" /></button>
      </div>
    </transition>

    <!-- ══ STATS CARDS ══════════════════════════════════════════ -->
    <div class="stats-grid">
      <div
        v-for="(s, i) in statsCards"
        :key="s.label"
        class="stat-card"
        :style="{ '--accent': s.couleur, '--accent-bg': s.bg, animationDelay: (i * 0.1) + 's' }"
      >
        <div class="stat-glow"></div>
        <div class="stat-icon-box">
          <component :is="s.icone" :size="22" />
          <div class="stat-icon-pulse"></div>
        </div>
        <div class="stat-body">
          <div class="stat-val">
            <AnimCounter :target="s.val" />
          </div>
          <div class="stat-lbl">{{ s.label }}</div>
        </div>
        <div class="stat-deco-circle"></div>
        <div class="stat-bar"></div>
      </div>
    </div>

    <!-- ══ CARTE PROFIL ═══════════════════════════════════════ -->
    <div class="profil-card-horiz" style="animation: fadeInUp .45s ease .25s both">
      <!-- Avatar -->
      <div class="pch-left">
        <div class="pch-avatar-ring">
          <img v-if="auth.utilisateur?.avatar" :src="auth.utilisateur.avatar" class="pch-avatar-img" alt="Photo" />
          <div v-else class="pch-avatar-placeholder"><User :size="32" /></div>
        </div>
        <RouterLink to="/patient/parametres" class="pch-edit-btn" title="Modifier la photo">
          <Camera :size="12" />
        </RouterLink>
      </div>

      <!-- Infos -->
      <div class="pch-info">
        <div class="pch-nom">{{ auth.utilisateur?.prenom }} {{ auth.utilisateur?.nom }}</div>
        <div class="pch-badge"><Shield :size="10" /> Patient</div>
        <div class="pch-email">{{ auth.utilisateur?.email }}</div>
      </div>

      <!-- Séparateur -->
      <div class="pch-sep"></div>

      <!-- Mini stats -->
      <div class="pch-stats">
        <div class="pch-stat">
          <span class="pch-stat-val">{{ rdvs.filter(r => !estPasse(r.date) && r.statut !== 'ANNULE').length }}</span>
          <span class="pch-stat-lbl">RDV à venir</span>
        </div>
        <div class="pch-stat">
          <span class="pch-stat-val">{{ ordosActives.length }}</span>
          <span class="pch-stat-lbl">Ordonnances</span>
        </div>
        <div class="pch-stat">
          <span class="pch-stat-val">{{ consultations.length }}</span>
          <span class="pch-stat-lbl">Consultations</span>
        </div>
      </div>

      <!-- Séparateur -->
      <div class="pch-sep"></div>

      <!-- Rappel toggle -->
      <div class="pch-rappel">
        <div class="pch-rappel-label">
          <Bell :size="14" style="color:#16A34A" />
          <span>Rappels RDV</span>
          <span class="pch-rappel-state">{{ prefStore.rappelRdv ? 'Activés' : 'Désactivés' }}</span>
        </div>
        <button
          class="toggle-switch"
          :class="{ active: prefStore.rappelRdv }"
          @click="prefStore.setRappelRdv(!prefStore.rappelRdv)"
        >
          <span class="toggle-thumb"></span>
        </button>
      </div>

      <!-- CTA -->
      <RouterLink to="/patient/parametres" class="pch-cta">
        <Settings :size="14" /> Paramètres
      </RouterLink>
    </div>

    <!-- ══ ACCÈS RAPIDES (très stylés) ═════════════════════════ -->
    <div class="section-title-row">
      <div class="section-pill"><Zap :size="13" /> Accès rapides</div>
    </div>
    <div class="quick-access-grid">
      <RouterLink to="/patient/rdv" class="qa-card qa-green">
        <div class="qa-bg-shape"></div>
        <div class="qa-icon-wrap"><CalendarPlus :size="28" /></div>
        <div class="qa-text">
          <div class="qa-title">Prendre un RDV</div>
          <div class="qa-sub">Réserver une consultation</div>
        </div>
        <div class="qa-arrow"><ArrowRight :size="18" /></div>
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/patient/dossier" class="qa-card qa-blue">
        <div class="qa-bg-shape"></div>
        <div class="qa-icon-wrap"><FolderOpen :size="28" /></div>
        <div class="qa-text">
          <div class="qa-title">Mon dossier</div>
          <div class="qa-sub">Historique médical complet</div>
        </div>
        <div class="qa-arrow"><ArrowRight :size="18" /></div>
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/patient/ordonnances" class="qa-card qa-purple">
        <div class="qa-bg-shape"></div>
        <div class="qa-icon-wrap"><FileText :size="28" /></div>
        <div class="qa-text">
          <div class="qa-title">Ordonnances</div>
          <div class="qa-sub">{{ ordosActives.length }} ordonnance(s) active(s)</div>
        </div>
        <div class="qa-arrow"><ArrowRight :size="18" /></div>
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/patient/teleconsultation" class="qa-card qa-teal">
        <div class="qa-bg-shape"></div>
        <div class="qa-icon-wrap"><Video :size="28" /></div>
        <div class="qa-text">
          <div class="qa-title">Téléconsultation</div>
          <div class="qa-sub">Consultation à distance</div>
        </div>
        <div class="qa-arrow"><ArrowRight :size="18" /></div>
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/patient/factures" class="qa-card qa-amber">
        <div class="qa-bg-shape"></div>
        <div class="qa-icon-wrap"><Receipt :size="28" /></div>
        <div class="qa-text">
          <div class="qa-title">Mes factures</div>
          <div class="qa-sub">Suivi des paiements</div>
        </div>
        <div class="qa-arrow"><ArrowRight :size="18" /></div>
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/patient/parametres" class="qa-card qa-slate">
        <div class="qa-bg-shape"></div>
        <div class="qa-icon-wrap"><Settings :size="28" /></div>
        <div class="qa-text">
          <div class="qa-title">Paramètres</div>
          <div class="qa-sub">Gérer mon compte</div>
        </div>
        <div class="qa-arrow"><ArrowRight :size="18" /></div>
        <div class="qa-shine"></div>
      </RouterLink>
    </div>

    <!-- ══ RDV + ORDONNANCES ═════════════════════════════════ -->
    <div class="deux-cols">
      <div class="panel rdv-panel" style="animation: fadeInUp .5s ease .4s both">
        <div class="panel-header">
          <div class="panel-icon"><CalendarClock :size="15" /></div>
          <h2 class="panel-titre">Prochain rendez-vous</h2>
          <RouterLink to="/patient/rdv" class="voir-tout">Tous <ChevronRight :size="13" /></RouterLink>
        </div>

        <div v-if="chargement" class="skel-block"></div>

        <div v-else-if="prochainRdv" class="rdv-card">
          <div class="rdv-date-box">
            <div class="rdv-jour">{{ fmt(prochainRdv.date, { weekday: 'short' }) }}</div>
            <div class="rdv-num">{{ new Date(prochainRdv.date).getDate() }}</div>
            <div class="rdv-mois">{{ fmt(prochainRdv.date, { month: 'short' }) }}</div>
          </div>
          <div class="rdv-info">
            <div class="rdv-time-row">
              <Clock :size="13" style="color:#16A34A" />
              <span class="rdv-heure">{{ fmtHeure(prochainRdv.date) }}</span>
            </div>
            <div class="rdv-medecin">Dr. {{ prochainRdv.medecin.utilisateur.prenom }} {{ prochainRdv.medecin.utilisateur.nom }}</div>
            <div class="rdv-specialite">{{ prochainRdv.medecin.specialite }}</div>
            <div class="rdv-motif" v-if="prochainRdv.motif">
              <MessageSquare :size="12" /> {{ prochainRdv.motif }}
            </div>
            <div class="rdv-badges">
              <span class="chip" :class="prochainRdv.type==='TELECONSULTATION'?'chip-blue':'chip-green'">
                <Video v-if="prochainRdv.type==='TELECONSULTATION'" :size="10" />
                <MapPin v-else :size="10" />
                {{ prochainRdv.type==='TELECONSULTATION' ? 'Téléconsultation' : 'Présentiel' }}
              </span>
              <span class="chip" :class="statutClass(prochainRdv.statut)">{{ lblStatut(prochainRdv.statut) }}</span>
            </div>
            <div class="rdv-actions">
              <RouterLink v-if="prochainRdv.type==='TELECONSULTATION'" to="/patient/teleconsultation" class="btn-join">
                <Video :size="14" /> Rejoindre
              </RouterLink>
              <button class="btn-cancel" @click="annuler(prochainRdv.id)">
                <X :size="13" /> Annuler
              </button>
            </div>
          </div>
        </div>

        <div v-else class="rdv-vide">
          <div class="rdv-vide-icon"><CalendarOff :size="32" /></div>
          <p>Aucun rendez-vous à venir</p>
          <RouterLink to="/patient/rdv" class="btn-prendreRdv">
            <Plus :size="15" /> Prendre un RDV
          </RouterLink>
        </div>
      </div>

      <!-- Ordonnances actives -->
      <div class="panel" style="animation: fadeInUp .5s ease .5s both">
        <div class="panel-header">
          <div class="panel-icon panel-icon-purple"><FileText :size="15" /></div>
          <h2 class="panel-titre">Ordonnances actives</h2>
          <RouterLink to="/patient/ordonnances" class="voir-tout">Voir tout <ChevronRight :size="13" /></RouterLink>
        </div>
        <div v-if="chargement" class="skel-list">
          <div class="skel-row" v-for="i in 3" :key="i"></div>
        </div>
        <div v-else-if="ordosActives.length===0" class="vide-mini">
          <FileText :size="24" style="opacity:.2" />
          <span>Aucune ordonnance active</span>
        </div>
        <div v-else class="ordo-list">
          <div v-for="o in ordosActives.slice(0,3)" :key="o.id" class="ordo-item">
            <div class="ordo-dot-wrap">
              <div class="ordo-dot"></div>
              <div class="ordo-line" v-if="ordosActives.length>1"></div>
            </div>
            <div class="ordo-body">
              <div class="ordo-nom">Dr. {{ o.medecinNom }}</div>
              <div class="ordo-sub">{{ fmt(o.date) }} · {{ o.lignes.length }} médicament(s)</div>
            </div>
            <span class="chip chip-green">Active</span>
          </div>
        </div>
      </div>
    </div><!-- fin deux-cols -->

    <!-- ══ HISTORIQUE CONSULTATIONS ════════════════════════════ -->
    <div class="panel" style="animation: fadeInUp .5s ease .6s both">
      <div class="panel-header">
        <div class="panel-icon panel-icon-blue"><Stethoscope :size="15" /></div>
        <h2 class="panel-titre">Historique des consultations</h2>
        <RouterLink to="/patient/dossier" class="voir-tout">Voir tout <ChevronRight :size="13" /></RouterLink>
      </div>
      <div v-if="chargement" class="skel-block"></div>
      <div v-else-if="consultations.length===0" class="vide-mini">
        <Stethoscope :size="24" style="opacity:.2" />
        <span>Aucune consultation enregistrée</span>
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Médecin</th>
              <th>Diagnostic</th>
              <th>Ordonnance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in consultations.slice(0,5)" :key="c.id" class="table-row-anim">
              <td class="td-date">{{ fmt(c.date) }}</td>
              <td class="td-med">Dr. {{ c.medecin.utilisateur.prenom }} {{ c.medecin.utilisateur.nom }}</td>
              <td class="td-diag">{{ c.diagnostic || '—' }}</td>
              <td>
                <span v-if="c.ordonnances?.length" class="chip chip-green"><FileText :size="10" /> Disponible</span>
                <span v-else class="chip chip-gray">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineComponent, h } from 'vue'
import { RouterLink } from 'vue-router'
import {
  User, Heart, Shield, Activity, CalendarClock, CalendarOff, CalendarPlus,
  ChevronRight, FileText, Video, MapPin, MessageSquare, Clock, Bell, Camera,
  X, Plus, FolderOpen, Receipt, Stethoscope, Zap, ArrowRight, Settings,
} from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth.js'
import { usePreferencesStore } from '../../stores/preferences.js'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

/* ─── Composant compteur animé ─── */
const AnimCounter = defineComponent({
  props: { target: { type: Number, default: 0 } },
  setup(props) {
    const current = ref(0)
    onMounted(() => {
      const end = props.target
      if (end === 0) return
      const duration = 1200
      const start = performance.now()
      function step(now) {
        const t = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - t, 3)
        current.value = Math.round(ease * end)
        if (t < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
    return () => h('span', current.value)
  },
})

const auth      = useAuthStore()
const prefStore = usePreferencesStore()
const api       = useApi()
const { fmt, fmtHeure, estPasse } = useDate()

const chargement    = ref(true)
const rdvs          = ref([])
const ordonnances   = ref([])
const factures      = ref([])
const consultations = ref([])
const masquerRappel = ref(false)

const prenom        = computed(() => auth.utilisateur?.prenom || '')
const dateAujourdui = new Date().toLocaleDateString('fr-SN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const prochainRdv = computed(() =>
  [...rdvs.value]
    .filter(r => !estPasse(r.date) && !['ANNULE', 'TERMINE'].includes(r.statut))
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0]
)
const ordosActives = computed(() => ordonnances.value.filter(o => o.statut === 'ACTIVE'))

const statsCards = computed(() => [
  { label: 'RDV à venir',         val: rdvs.value.filter(r => !estPasse(r.date) && r.statut !== 'ANNULE').length, icone: CalendarClock, couleur: '#16A34A', bg: 'rgba(74,222,128,.12)' },
  { label: 'Ordonnances actives', val: ordosActives.value.length,                                                  icone: FileText,      couleur: '#7C3AED', bg: 'rgba(139,92,246,.10)' },
  { label: 'Consultations',       val: consultations.value.length,                                                 icone: Stethoscope,   couleur: '#0284C7', bg: 'rgba(14,165,233,.10)' },
  { label: 'Factures impayées',   val: factures.value.filter(f => f.statut === 'EN_ATTENTE').length,               icone: Receipt,       couleur: '#DC2626', bg: 'rgba(239,68,68,.08)' },
])

/* ─── Compte à rebours ─── */
const countdown = ref({ jours: 0, heures: 0, minutes: 0, secondes: 0, total: 0 })
let timerInterval = null

function calculerCountdown() {
  if (!prochainRdv.value) { countdown.value = { jours: 0, heures: 0, minutes: 0, secondes: 0, total: 0 }; return }
  const diff = new Date(prochainRdv.value.date).getTime() - Date.now()
  if (diff <= 0) { countdown.value = { jours: 0, heures: 0, minutes: 0, secondes: 0, total: 0 }; return }
  const jours    = Math.floor(diff / 86400000)
  const heures   = Math.floor((diff % 86400000) / 3600000)
  const minutes  = Math.floor((diff % 3600000)  / 60000)
  const secondes = Math.floor((diff % 60000)    / 1000)
  countdown.value = { jours, heures, minutes, secondes, total: diff }
}

const rappelInfo = computed(() => {
  if (!prochainRdv.value || masquerRappel.value) return null
  if (!prefStore.rappelRdv) return null
  const diff = countdown.value.total
  if (diff <= 0) return null
  const h = diff / 3600000
  if (h > 72) return null
  if (h <= 2)  return { titre: '⏰ Votre RDV est dans moins de 2 heures !', urgence: 'urgence-rouge' }
  if (h <= 6)  return { titre: '🔔 RDV dans moins de 6 heures — préparez-vous', urgence: 'urgence-amber' }
  if (h <= 24) return { titre: '📅 Rappel : vous avez un RDV aujourd\'hui', urgence: 'urgence-vert' }
  if (h <= 48) return { titre: '📆 RDV demain — pensez à confirmer', urgence: 'urgence-vert' }
  return { titre: '🗓️ RDV dans 3 jours — rappel anticipé', urgence: 'urgence-vert' }
})

/* ─── Notifications navigateur ─── */
function demanderPermissionNotif() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') Notification.requestPermission()
}

const notifEnvoyeesPour = new Set()

function envoyerNotifBrowser(rdv) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const key = `${rdv.id}_${Math.floor(countdown.value.total / 3600000)}`
  if (notifEnvoyeesPour.has(key)) return
  notifEnvoyeesPour.add(key)

  const medecinNom = `Dr. ${rdv.medecin.utilisateur.prenom} ${rdv.medecin.utilisateur.nom}`
  const h = countdown.value.total / 3600000
  let body = `RDV avec ${medecinNom} à ${fmtHeure(rdv.date)}.`
  if (h <= 0.5) body = `⏰ Votre RDV avec ${medecinNom} est dans moins de 30 minutes !`
  else if (h <= 2) body = `⏰ RDV avec ${medecinNom} dans environ ${Math.round(h * 60)} minutes.`

  try {
    new Notification('Tropical Medical — Rappel RDV', {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    })
  } catch (_) { /* navigateur sans support */ }
}

onMounted(async () => {
  demanderPermissionNotif()
  try {
    const [r, o, f, d] = await Promise.all([
      api.get('/patient/rdv'),
      api.get('/patient/ordonnances'),
      api.get('/patient/factures'),
      api.get('/patient/dossier').catch(() => null),
    ])
    rdvs.value = r
    ordonnances.value = o
    factures.value = f
    if (d) consultations.value = d.dossier?.consultations || []
  } finally { chargement.value = false }

  calculerCountdown()
  timerInterval = setInterval(() => {
    calculerCountdown()
    if (prochainRdv.value && countdown.value.total > 0 && countdown.value.total <= 2 * 3600000) {
      envoyerNotifBrowser(prochainRdv.value)
    }
  }, 1000)
})

onUnmounted(() => { if (timerInterval) clearInterval(timerInterval) })

async function annuler(id) {
  if (!confirm("Confirmer l'annulation ?")) return
  await api.put(`/patient/rdv/${id}/annuler`)
  rdvs.value = await api.get('/patient/rdv')
}

function lblStatut(s)   { return { EN_ATTENTE: 'En attente', CONFIRME: 'Confirmé', ANNULE: 'Annulé', TERMINE: 'Terminé' }[s] || s }
function statutClass(s) { return { EN_ATTENTE: 'chip-amber', CONFIRME: 'chip-green', ANNULE: 'chip-red', TERMINE: 'chip-gray' }[s] || 'chip-gray' }
</script>

<style scoped>
/* ── Keyframes ──────────────────────────────────────────────── */
@keyframes slideInLeft  { from { opacity:0; transform:translateX(-32px) } to { opacity:1; transform:none } }
@keyframes slideInRight { from { opacity:0; transform:translateX(32px)  } to { opacity:1; transform:none } }
@keyframes fadeInUp     { from { opacity:0; transform:translateY(24px)  } to { opacity:1; transform:none } }
@keyframes fadeIn       { from { opacity:0 }                              to { opacity:1 } }
@keyframes float        { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-8px) } }
@keyframes spin         { to { transform:rotate(360deg) } }
@keyframes pulse-ring   { 0% { transform:scale(1); opacity:.4 } 100% { transform:scale(2.2); opacity:0 } }
@keyframes shimmer      { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
@keyframes gradShift    { 0%,100% { background-position:0% 50% } 50% { background-position:100% 50% } }
@keyframes particle     { 0% { transform:translateY(0) scale(1); opacity:.6 } 100% { transform:translateY(-60px) scale(0); opacity:0 } }
@keyframes stat-enter   { from { opacity:0; transform:translateY(16px) scale(.95) } to { opacity:1; transform:none } }
@keyframes shine        { 0% { left:-100% } 60%,100% { left:150% } }

.tbd-wrap { display:flex; flex-direction:column; gap:1.5rem; }

/* ── Hero ───────────────────────────────────────────────────── */
.hero-banner {
  position:relative; border-radius:1.5rem; overflow:hidden;
  padding:2rem 2.5rem; color:white; min-height:160px;
  box-shadow:0 12px 48px rgba(34,197,94,.3);
}
.hero-bg {
  position:absolute; inset:0;
  background:linear-gradient(135deg,#4ADE80 0%,#22C55E 30%,#10B981 65%,#059669 100%);
  background-size:300% 300%; animation:gradShift 8s ease infinite;
}
/* particles */
.hero-particles { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
.particle {
  position:absolute; width:6px; height:6px; border-radius:50%;
  background:rgba(255,255,255,.35);
  animation:particle 3s ease-in infinite;
}
.p1  { left:10%; top:80%; animation-delay:0s;    animation-duration:2.8s; }
.p2  { left:20%; top:90%; animation-delay:.4s;   animation-duration:3.2s; }
.p3  { left:35%; top:85%; animation-delay:.8s;   animation-duration:2.5s; }
.p4  { left:50%; top:92%; animation-delay:1.2s;  animation-duration:3s;   }
.p5  { left:62%; top:88%; animation-delay:.2s;   animation-duration:2.7s; }
.p6  { left:75%; top:91%; animation-delay:.6s;   animation-duration:3.3s; }
.p7  { left:85%; top:84%; animation-delay:1s;    animation-duration:2.6s; }
.p8  { left:5%;  top:86%; animation-delay:1.4s;  animation-duration:3.1s; }
.p9  { left:42%; top:93%; animation-delay:.3s;   animation-duration:2.9s; }
.p10 { left:58%; top:87%; animation-delay:.7s;   animation-duration:2.4s; }
.p11 { left:90%; top:89%; animation-delay:1.1s;  animation-duration:3.4s; }
.p12 { left:28%; top:82%; animation-delay:.5s;   animation-duration:2.8s; }

.hero-content { position:relative; display:flex; align-items:center; justify-content:space-between; gap:1.5rem; }
.hero-left    { display:flex; flex-direction:column; gap:.625rem; }
.hero-tag {
  display:inline-flex; align-items:center; gap:.4rem;
  background:rgba(255,255,255,.22); backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,.4); border-radius:9999px;
  padding:.3rem .9rem; font-size:.72rem; font-weight:700;
  text-transform:uppercase; letter-spacing:.07em; width:fit-content;
}
.tag-icon { animation:float 2.5s ease-in-out infinite; }
.hero-title { font-family:var(--font-display); font-size:1.8rem; font-weight:800; letter-spacing:-.02em; line-height:1.1; }
.hero-name  { font-style:italic; }
.hero-date  { font-size:.82rem; opacity:.82; text-transform:capitalize; }
.hero-meta  { display:flex; align-items:center; gap:.625rem; margin-top:.25rem; }
.hero-meta-item { display:flex; align-items:center; gap:.35rem; font-size:.75rem; font-weight:500; opacity:.9; }
.hero-meta-dot  { width:4px; height:4px; border-radius:50%; background:rgba(255,255,255,.5); }

/* hero avatar */
.hero-right { flex-shrink:0; }
.hero-circle-wrap { position:relative; width:100px; height:100px; }
.hero-circle { position:absolute; border-radius:50%; border:2px solid rgba(255,255,255,.25); }
.hero-circle-1 { inset:0; animation:spin 12s linear infinite; }
.hero-circle-2 { inset:10px; animation:spin 8s linear infinite reverse; border-style:dashed; }
.hero-circle-3 { inset:20px; animation:spin 6s linear infinite; border-color:rgba(255,255,255,.15); }
.hero-avatar {
  position:absolute; inset:25px;
  background:rgba(255,255,255,.2); backdrop-filter:blur(8px);
  border-radius:50%; display:flex; align-items:center; justify-content:center;
  border:2px solid rgba(255,255,255,.4);
  overflow:hidden;
}
.hero-avatar-img {
  width:100%; height:100%; object-fit:cover; border-radius:50%;
}

/* ── Stat cards ─────────────────────────────────────────────── */
.stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; }
@media(max-width:900px) { .stats-grid { grid-template-columns:repeat(2,1fr) } }

.stat-card {
  background:#fff; border:1px solid #E2E8F0; border-radius:1.125rem;
  padding:1.25rem 1rem; display:flex; align-items:center; gap:1rem;
  position:relative; overflow:hidden;
  box-shadow:0 2px 12px rgba(0,0,0,.05);
  animation:stat-enter .5s ease both;
  transition:transform .25s, box-shadow .25s;
  cursor:default;
}
.stat-card:hover { transform:translateY(-4px) scale(1.01); box-shadow:0 12px 32px rgba(0,0,0,.1), 0 0 0 1px var(--accent-bg); }
.stat-card:hover .stat-glow { opacity:1; }
.stat-card:hover .stat-icon-pulse { animation:pulse-ring .8s ease-out; }

.stat-glow { position:absolute; inset:0; background:radial-gradient(circle at 20% 50%, var(--accent-bg) 0%, transparent 70%); opacity:0; transition:opacity .3s; }
.stat-deco-circle { position:absolute; top:-20px; right:-20px; width:80px; height:80px; border-radius:50%; background:var(--accent-bg); opacity:.6; transition:transform .3s; }
.stat-card:hover .stat-deco-circle { transform:scale(1.3); }
.stat-bar { position:absolute; bottom:0; left:0; right:0; height:3px; background:linear-gradient(90deg, var(--accent), transparent); }

.stat-icon-box {
  position:relative; width:48px; height:48px; border-radius:1rem; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  background:var(--accent-bg); color:var(--accent);
  box-shadow:0 4px 16px color-mix(in srgb, var(--accent) 25%, transparent);
  z-index:1; transition:transform .25s;
}
.stat-card:hover .stat-icon-box { transform:rotate(-5deg) scale(1.1); }

.stat-icon-pulse {
  position:absolute; inset:-4px; border-radius:inherit;
  border:2px solid var(--accent); opacity:0;
}

.stat-body { position:relative; z-index:1; }
.stat-val { font-family:var(--font-display); font-size:1.75rem; font-weight:800; color:var(--accent); line-height:1; }
.stat-lbl { font-size:.7rem; color:var(--color-text-muted); margin-top:.25rem; font-weight:500; }

/* ── Section title row ──────────────────────────────────────── */
.section-title-row { display:flex; align-items:center; gap:.75rem; }
.section-pill {
  display:inline-flex; align-items:center; gap:.375rem;
  background:linear-gradient(135deg,#4ADE80,#059669); color:white;
  border-radius:9999px; padding:.35rem 1rem;
  font-size:.78rem; font-weight:700;
}

/* ── Accès rapides ──────────────────────────────────────────── */
.quick-access-grid {
  display:grid; grid-template-columns:repeat(3,1fr); gap:1rem;
}
@media(max-width:1024px) { .quick-access-grid { grid-template-columns:repeat(2,1fr) } }
@media(max-width:600px)  { .quick-access-grid { grid-template-columns:1fr } }

.qa-card {
  position:relative; display:flex; align-items:center; gap:1rem;
  padding:1.25rem 1.375rem; border-radius:1.25rem;
  text-decoration:none; overflow:hidden;
  transition:transform .28s cubic-bezier(.4,0,.2,1), box-shadow .28s;
  animation:fadeInUp .5s ease both;
}
.qa-card:nth-child(1) { animation-delay:.1s }
.qa-card:nth-child(2) { animation-delay:.15s }
.qa-card:nth-child(3) { animation-delay:.2s }
.qa-card:nth-child(4) { animation-delay:.25s }
.qa-card:nth-child(5) { animation-delay:.3s }
.qa-card:nth-child(6) { animation-delay:.35s }

.qa-card:hover { transform:translateY(-5px); }
.qa-card:hover .qa-shine { animation:shine 0.8s ease forwards; }
.qa-card:hover .qa-arrow { transform:translateX(4px); }
.qa-card:hover .qa-icon-wrap { transform:scale(1.12) rotate(-5deg); }
.qa-card:hover .qa-bg-shape { transform:scale(1.3) rotate(10deg); }

/* Shine sweep effect */
.qa-shine {
  position:absolute; top:0; bottom:0; width:60px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);
  left:-100%; pointer-events:none;
}

/* Background shape decorative */
.qa-bg-shape {
  position:absolute; right:-20px; top:-20px;
  width:90px; height:90px; border-radius:50%;
  background:rgba(255,255,255,.12); transition:transform .3s;
}

.qa-icon-wrap {
  width:52px; height:52px; border-radius:1rem; flex-shrink:0;
  background:rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center;
  color:white; backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,.3);
  transition:transform .25s;
}
.qa-text { flex:1; min-width:0; color:white; }
.qa-title { font-family:var(--font-display); font-size:.95rem; font-weight:700; }
.qa-sub   { font-size:.75rem; opacity:.8; margin-top:.2rem; }
.qa-arrow { color:rgba(255,255,255,.7); flex-shrink:0; transition:transform .25s; }

/* Card themes */
.qa-green  { background:linear-gradient(135deg,#22C55E,#059669); box-shadow:0 6px 24px rgba(34,197,94,.35); }
.qa-blue   { background:linear-gradient(135deg,#38BDF8,#0284C7); box-shadow:0 6px 24px rgba(14,165,233,.35); }
.qa-purple { background:linear-gradient(135deg,#A78BFA,#7C3AED); box-shadow:0 6px 24px rgba(139,92,246,.35); }
.qa-teal   { background:linear-gradient(135deg,#2DD4BF,#0F766E); box-shadow:0 6px 24px rgba(20,184,166,.35); }
.qa-amber  { background:linear-gradient(135deg,#FCD34D,#D97706); box-shadow:0 6px 24px rgba(245,158,11,.35); }
.qa-slate  { background:linear-gradient(135deg,#94A3B8,#475569); box-shadow:0 6px 24px rgba(71,85,105,.25); }

.qa-green:hover  { box-shadow:0 12px 40px rgba(34,197,94,.5); }
.qa-blue:hover   { box-shadow:0 12px 40px rgba(14,165,233,.5); }
.qa-purple:hover { box-shadow:0 12px 40px rgba(139,92,246,.5); }
.qa-teal:hover   { box-shadow:0 12px 40px rgba(20,184,166,.5); }
.qa-amber:hover  { box-shadow:0 12px 40px rgba(245,158,11,.5); }
.qa-slate:hover  { box-shadow:0 12px 40px rgba(71,85,105,.4); }

/* ── Carte Profil Horizontale ─────────────────────────────── */
@keyframes avatarPop { from { transform:scale(.85); opacity:0 } to { transform:scale(1); opacity:1 } }

.profil-card-horiz {
  display:flex; align-items:center; gap:1.5rem;
  background:#fff; border:1px solid #E2E8F0; border-radius:1.25rem;
  padding:1.25rem 1.5rem;
  box-shadow:0 2px 16px rgba(0,0,0,.06);
  position:relative; overflow:hidden;
}
.profil-card-horiz::before {
  content:''; position:absolute; left:0; top:0; bottom:0;
  width:4px; background:linear-gradient(180deg,#4ADE80,#059669);
  border-radius:9999px 0 0 9999px;
}
@media(max-width:900px) {
  .profil-card-horiz { flex-wrap:wrap; gap:1rem; }
  .pch-sep { display:none; }
}

/* Avatar */
.pch-left { position:relative; flex-shrink:0; }
.pch-avatar-ring {
  width:72px; height:72px; border-radius:50%;
  background:linear-gradient(135deg,#4ADE80,#059669); padding:3px;
  box-shadow:0 4px 16px rgba(34,197,94,.3);
  animation:avatarPop .5s cubic-bezier(.4,0,.2,1) both;
}
.pch-avatar-img {
  width:100%; height:100%; border-radius:50%; object-fit:cover; border:3px solid white;
}
.pch-avatar-placeholder {
  width:100%; height:100%; border-radius:50%; border:3px solid white;
  background:linear-gradient(135deg,#F0FDF4,#DCFCE7);
  display:flex; align-items:center; justify-content:center; color:#16A34A;
}
.pch-edit-btn {
  position:absolute; bottom:0; right:0;
  width:22px; height:22px; border-radius:50%;
  background:linear-gradient(135deg,#4ADE80,#059669); color:white;
  display:flex; align-items:center; justify-content:center;
  border:2px solid white; text-decoration:none;
  box-shadow:0 2px 8px rgba(0,0,0,.15); transition:transform .2s;
}
.pch-edit-btn:hover { transform:scale(1.15); }

/* Infos */
.pch-info { flex:0 0 auto; display:flex; flex-direction:column; gap:.3rem; min-width:150px; }
.pch-nom  { font-family:var(--font-display); font-size:1rem; font-weight:800; color:var(--color-text); }
.pch-badge {
  display:inline-flex; align-items:center; gap:.3rem; width:fit-content;
  background:rgba(74,222,128,.12); color:#16A34A;
  border:1px solid rgba(74,222,128,.3); border-radius:9999px;
  padding:.15rem .6rem; font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em;
}
.pch-email { font-size:.72rem; color:var(--color-text-muted); }

/* Séparateur vertical */
.pch-sep { width:1px; height:52px; background:#E2E8F0; flex-shrink:0; }

/* Mini stats */
.pch-stats { display:flex; gap:1.5rem; flex-shrink:0; }
.pch-stat  { display:flex; flex-direction:column; align-items:center; gap:.1rem; }
.pch-stat-val { font-family:var(--font-display); font-size:1.3rem; font-weight:800; color:#16A34A; }
.pch-stat-lbl { font-size:.64rem; color:var(--color-text-muted); font-weight:500; text-transform:uppercase; letter-spacing:.04em; white-space:nowrap; }

/* Toggle rappel */
.pch-rappel { display:flex; flex-direction:column; gap:.5rem; align-items:center; flex-shrink:0; }
.pch-rappel-label {
  display:flex; align-items:center; gap:.4rem;
  font-size:.8rem; font-weight:600; color:var(--color-text); white-space:nowrap;
}
.pch-rappel-state { font-size:.7rem; color:var(--color-text-muted); font-weight:400; }

/* Toggle Switch */
.toggle-switch {
  width:46px; height:26px; border-radius:9999px; border:none; cursor:pointer;
  background:#CBD5E1; position:relative; transition:background .25s; flex-shrink:0;
}
.toggle-switch.active { background:linear-gradient(90deg,#4ADE80,#16A34A); }
.toggle-thumb {
  position:absolute; top:4px; left:4px;
  width:18px; height:18px; border-radius:50%; background:white;
  box-shadow:0 1px 4px rgba(0,0,0,.2);
  transition:transform .25s cubic-bezier(.4,0,.2,1);
}
.toggle-switch.active .toggle-thumb { transform:translateX(20px); }

/* CTA */
.pch-cta {
  margin-left:auto; flex-shrink:0;
  display:inline-flex; align-items:center; gap:.4rem;
  padding:.55rem 1.1rem; border-radius:.75rem;
  background:linear-gradient(135deg,#4ADE80,#059669); color:white;
  font-size:.82rem; font-weight:700; text-decoration:none;
  box-shadow:0 4px 14px rgba(34,197,94,.3); transition:all .2s;
}
.pch-cta:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(34,197,94,.45); }

/* ── Panels ─────────────────────────────────────────────────── */
.deux-cols { display:grid; grid-template-columns:1.2fr 1fr; gap:1.25rem; }
@media(max-width:900px) { .deux-cols { grid-template-columns:1fr } }

.panel {
  background:#fff; border:1px solid #E2E8F0; border-radius:1.25rem;
  padding:1.375rem; box-shadow:0 2px 12px rgba(0,0,0,.04);
  transition:box-shadow .25s;
}
.panel:hover { box-shadow:0 8px 32px rgba(0,0,0,.08); }

.panel-header { display:flex; align-items:center; gap:.625rem; margin-bottom:1.25rem; }
.panel-icon {
  width:32px; height:32px; border-radius:.75rem;
  background:linear-gradient(135deg,#4ADE80,#059669);
  display:flex; align-items:center; justify-content:center; color:white; flex-shrink:0;
}
.panel-icon-purple { background:linear-gradient(135deg,#A78BFA,#7C3AED); }
.panel-icon-blue   { background:linear-gradient(135deg,#38BDF8,#0284C7); }
.panel-titre { font-family:var(--font-display); font-size:.95rem; font-weight:700; color:var(--color-text); flex:1; }
.voir-tout {
  display:flex; align-items:center; gap:.2rem; font-size:.78rem; color:#16A34A; font-weight:600;
  text-decoration:none; padding:.25rem .625rem; border-radius:9999px;
  background:rgba(74,222,128,.08); transition:background .15s;
}
.voir-tout:hover { background:rgba(74,222,128,.18); }

/* RDV card */
.rdv-card { display:flex; gap:1.25rem; align-items:flex-start; }
.rdv-date-box {
  text-align:center; min-width:72px; flex-shrink:0;
  background:linear-gradient(135deg,#4ADE80,#059669); border-radius:1rem;
  padding:1rem .75rem; color:white;
  box-shadow:0 4px 16px rgba(34,197,94,.3);
}
.rdv-jour { font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; opacity:.85; }
.rdv-num  { font-family:var(--font-display); font-size:2rem; font-weight:800; line-height:1; }
.rdv-mois { font-size:.75rem; font-weight:600; text-transform:capitalize; opacity:.85; }

.rdv-info { flex:1; min-width:0; }
.rdv-time-row { display:flex; align-items:center; gap:.375rem; margin-bottom:.375rem; }
.rdv-heure    { font-size:.82rem; font-weight:700; color:#16A34A; }
.rdv-medecin  { font-weight:700; font-size:1rem; color:var(--color-text); }
.rdv-specialite { font-size:.8rem; color:var(--color-text-muted); margin-top:.1rem; }
.rdv-motif { display:flex; align-items:center; gap:.35rem; font-size:.78rem; color:var(--color-text-muted); margin-top:.375rem; }
.rdv-badges  { display:flex; gap:.375rem; margin-top:.625rem; flex-wrap:wrap; }
.rdv-actions { display:flex; gap:.5rem; margin-top:.875rem; flex-wrap:wrap; }
.btn-join {
  display:inline-flex; align-items:center; gap:.375rem;
  padding:.45rem 1rem; border-radius:9999px; border:none; cursor:pointer;
  background:linear-gradient(135deg,#4ADE80,#059669); color:white;
  font-size:.8rem; font-weight:700; text-decoration:none;
  box-shadow:0 4px 12px rgba(34,197,94,.35); transition:all .2s;
}
.btn-join:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(34,197,94,.5); }
.btn-cancel {
  display:inline-flex; align-items:center; gap:.35rem;
  padding:.45rem .875rem; border-radius:9999px;
  border:1.5px solid rgba(239,68,68,.25); background:rgba(239,68,68,.05);
  color:#DC2626; font-size:.8rem; font-weight:600; cursor:pointer; transition:all .2s;
}
.btn-cancel:hover { background:rgba(239,68,68,.12); border-color:rgba(239,68,68,.4); }

.rdv-vide { display:flex; flex-direction:column; align-items:center; gap:.75rem; padding:1.75rem 1rem; color:var(--color-text-muted); text-align:center; }
.rdv-vide-icon { width:56px; height:56px; border-radius:50%; background:#F8FAFC; display:flex; align-items:center; justify-content:center; opacity:.35; }
.btn-prendreRdv {
  display:inline-flex; align-items:center; gap:.375rem;
  padding:.55rem 1.25rem; border-radius:9999px;
  background:linear-gradient(135deg,#4ADE80,#059669); color:white;
  font-size:.85rem; font-weight:700; text-decoration:none;
  box-shadow:0 4px 16px rgba(34,197,94,.3); transition:all .2s;
}
.btn-prendreRdv:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(34,197,94,.45); }

/* Ordonnances */
.ordo-list { display:flex; flex-direction:column; gap:.5rem; }
.ordo-item { display:flex; align-items:flex-start; gap:.75rem; }
.ordo-dot-wrap { display:flex; flex-direction:column; align-items:center; padding-top:4px; }
.ordo-dot  { width:10px; height:10px; border-radius:50%; background:linear-gradient(135deg,#4ADE80,#059669); flex-shrink:0; }
.ordo-line { flex:1; width:2px; background:#E2E8F0; margin-top:4px; min-height:20px; }
.ordo-body { flex:1; padding-bottom:.5rem; }
.ordo-nom  { font-size:.85rem; font-weight:600; color:var(--color-text); }
.ordo-sub  { font-size:.73rem; color:var(--color-text-muted); margin-top:.1rem; }

/* Table */
.table-wrap  { overflow-x:auto; }
.data-table  { width:100%; border-collapse:collapse; }
.data-table th {
  padding:.6rem .875rem; text-align:left; font-size:.68rem; font-weight:700;
  color:var(--color-text-muted); text-transform:uppercase; letter-spacing:.06em;
  background:#F8FAFC; border-bottom:2px solid #F1F5F9;
}
.data-table td { padding:.7rem .875rem; font-size:.84rem; color:var(--color-text); border-bottom:1px solid #F8FAFC; }
.data-table tr:last-child td { border-bottom:none; }
.table-row-anim { transition:background .15s; }
.table-row-anim:hover td { background:rgba(74,222,128,.04); }
.td-date { white-space:nowrap; font-weight:600; color:#16A34A; font-size:.8rem; }
.td-med  { font-weight:500; }
.td-diag { max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--color-text-muted); }

/* Chips */
.chip { font-size:.62rem; font-weight:700; padding:2px 8px; border-radius:9999px; text-transform:uppercase; letter-spacing:.04em; display:inline-flex; align-items:center; gap:3px; flex-shrink:0; }
.chip-green  { background:rgba(74,222,128,.12);  color:#16A34A; border:1px solid rgba(74,222,128,.3); }
.chip-blue   { background:rgba(56,189,248,.12);  color:#0284C7; border:1px solid rgba(56,189,248,.3); }
.chip-amber  { background:rgba(252,211,77,.15);  color:#D97706; border:1px solid rgba(252,211,77,.3); }
.chip-red    { background:rgba(248,113,113,.12); color:#DC2626; border:1px solid rgba(248,113,113,.3); }
.chip-gray   { background:rgba(148,163,184,.12); color:#64748B; border:1px solid rgba(148,163,184,.3); }

/* ── Transition bannière ────────────────────────────────────── */
.rappel-slide-enter-active { transition:all .4s cubic-bezier(.4,0,.2,1) }
.rappel-slide-leave-active { transition:all .3s cubic-bezier(.4,0,.2,1) }
.rappel-slide-enter-from  { opacity:0; transform:translateY(-12px) scale(.98) }
.rappel-slide-leave-to    { opacity:0; transform:translateY(-8px) scale(.99) }

/* ── Bannière rappel ─────────────────────────────────────────── */
@keyframes bellShake {
  0%,100% { transform:rotate(0) }
  15%  { transform:rotate(12deg) }
  30%  { transform:rotate(-10deg) }
  45%  { transform:rotate(8deg) }
  60%  { transform:rotate(-6deg) }
  75%  { transform:rotate(3deg) }
}
@keyframes cdPulse { 0%,100% { opacity:1 } 50% { opacity:.6 } }

.rappel-banner {
  position:relative; display:flex; align-items:center; gap:1rem;
  padding:1rem 1.375rem; border-radius:1.25rem; overflow:hidden;
  border:1.5px solid transparent;
}
.rappel-banner::before {
  content:''; position:absolute; inset:0; opacity:.08;
  background:repeating-linear-gradient(45deg, white 0px, white 2px, transparent 2px, transparent 12px);
  pointer-events:none;
}
.urgence-rouge {
  background:linear-gradient(135deg,#FEF2F2,#FFF1F1);
  border-color:rgba(239,68,68,.3);
  box-shadow:0 4px 24px rgba(239,68,68,.12), 0 0 0 1px rgba(239,68,68,.08);
}
.urgence-amber {
  background:linear-gradient(135deg,#FFFBEB,#FFF8E0);
  border-color:rgba(245,158,11,.3);
  box-shadow:0 4px 24px rgba(245,158,11,.12);
}
.urgence-vert {
  background:linear-gradient(135deg,#F0FDF4,#ECFDF5);
  border-color:rgba(34,197,94,.3);
  box-shadow:0 4px 24px rgba(34,197,94,.12);
}

.rappel-left { display:flex; align-items:center; gap:.875rem; flex:1; min-width:0; }
.rappel-icon-ring {
  width:44px; height:44px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
}
.urgence-rouge .rappel-icon-ring { background:rgba(239,68,68,.12); color:#DC2626; }
.urgence-amber .rappel-icon-ring { background:rgba(245,158,11,.12); color:#D97706; }
.urgence-vert  .rappel-icon-ring { background:rgba(34,197,94,.12);  color:#16A34A; }

.urgence-rouge .rappel-icon-ring .rappel-bell { animation:bellShake 1.5s ease infinite; }
.urgence-amber .rappel-icon-ring .rappel-bell { animation:bellShake 2.5s ease infinite; }

.rappel-text { min-width:0; }
.rappel-titre { font-family:var(--font-display); font-size:.93rem; font-weight:800; }
.urgence-rouge .rappel-titre { color:#B91C1C; }
.urgence-amber .rappel-titre { color:#92400E; }
.urgence-vert  .rappel-titre { color:#15803D; }
.rappel-desc  { font-size:.78rem; color:var(--color-text-muted); margin-top:.15rem; }
.rappel-specialite { opacity:.7; }

/* Compte à rebours */
.rappel-center { flex-shrink:0; }
.countdown-wrap { display:flex; align-items:center; gap:.25rem; }
.cd-bloc {
  display:flex; flex-direction:column; align-items:center;
  min-width:44px; padding:.35rem .5rem; border-radius:.625rem;
}
.urgence-rouge .cd-bloc { background:rgba(239,68,68,.08); }
.urgence-amber .cd-bloc { background:rgba(245,158,11,.08); }
.urgence-vert  .cd-bloc { background:rgba(34,197,94,.08); }
.cd-val {
  font-family:var(--font-display); font-size:1.4rem; font-weight:800; line-height:1;
  animation:cdPulse 1s ease-in-out infinite;
}
.urgence-rouge .cd-val { color:#DC2626; }
.urgence-amber .cd-val { color:#D97706; }
.urgence-vert  .cd-val { color:#16A34A; }
.cd-lbl { font-size:.58rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; opacity:.6; margin-top:.15rem; }
.cd-sep { font-size:1.2rem; font-weight:800; opacity:.4; margin-bottom:.6rem; }

.rappel-actions { display:flex; gap:.5rem; flex-shrink:0; }
.btn-rappel-join {
  display:inline-flex; align-items:center; gap:.35rem;
  padding:.45rem 1rem; border-radius:9999px; font-size:.8rem; font-weight:700;
  background:linear-gradient(135deg,#4ADE80,#059669); color:white; text-decoration:none;
  box-shadow:0 3px 12px rgba(34,197,94,.35); transition:all .2s;
}
.btn-rappel-join:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(34,197,94,.5); }
.btn-rappel-voir {
  display:inline-flex; align-items:center; gap:.35rem;
  padding:.45rem .875rem; border-radius:9999px; font-size:.8rem; font-weight:600;
  background:rgba(34,197,94,.08); color:#16A34A; text-decoration:none;
  border:1.5px solid rgba(34,197,94,.25); transition:all .2s;
}
.urgence-rouge .btn-rappel-voir { background:rgba(239,68,68,.08); color:#DC2626; border-color:rgba(239,68,68,.25); }
.urgence-amber .btn-rappel-voir { background:rgba(245,158,11,.08); color:#D97706; border-color:rgba(245,158,11,.25); }
.btn-rappel-voir:hover { opacity:.85; }
.rappel-close {
  position:absolute; top:.625rem; right:.625rem;
  width:24px; height:24px; border-radius:50%; border:none; cursor:pointer;
  background:rgba(0,0,0,.06); color:var(--color-text-muted);
  display:flex; align-items:center; justify-content:center; transition:background .15s;
}
.rappel-close:hover { background:rgba(0,0,0,.12); }

/* Empty & Skeleton */
.vide-mini { display:flex; align-items:center; gap:.625rem; padding:1.5rem; color:var(--color-text-muted); font-size:.85rem; justify-content:center; }
.skel-list { display:flex; flex-direction:column; gap:.5rem; }
.skel-row  { height:48px; background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%); background-size:200% 100%; border-radius:.75rem; animation:shimmer 1.5s infinite; }
.skel-block { height:100px; background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%); background-size:200% 100%; border-radius:.875rem; animation:shimmer 1.5s infinite; }
</style>
