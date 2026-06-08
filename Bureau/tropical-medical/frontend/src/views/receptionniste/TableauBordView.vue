<template>
  <div class="tbd-wrap">

    <!-- HERO -->
    <div class="hero-banner">
      <div class="hero-bg"></div>
      <div class="hero-particles">
        <span v-for="i in 8" :key="i" class="particle" :class="`p${i}`"></span>
      </div>
      <div class="hero-content">
        <div class="hero-left" style="animation:slideInLeft .6s ease both">
          <div class="hero-tag"><LayoutDashboard :size="13" /> Réception</div>
          <h1 class="hero-title">Réception — Tropical Medical</h1>
          <p class="hero-date">{{ dateAujourdhui }}</p>
        </div>
        <div class="hero-kpis" style="animation:slideInRight .6s ease both">
          <div class="hero-kpi">
            <div class="hero-kpi-val"><AnimCounter :target="donneesStats.rdvAujourdhui||0" /></div>
            <div class="hero-kpi-lbl">RDV du jour</div>
          </div>
          <div class="hero-kpi-sep"></div>
          <div class="hero-kpi">
            <div class="hero-kpi-val"><AnimCounter :target="donneesStats.enAttente||0" /></div>
            <div class="hero-kpi-lbl">En attente</div>
          </div>
          <div class="hero-kpi-sep"></div>
          <div class="hero-kpi">
            <div class="hero-kpi-val"><AnimCounter :target="donneesStats.litsLibres||0" /></div>
            <div class="hero-kpi-lbl">Lits libres</div>
          </div>
        </div>
      </div>
    </div>

    <!-- STATS -->
    <div class="stats-grid">
      <div v-for="(s, i) in stats" :key="s.label" class="stat-card" :style="{ '--accent': s.color, '--accent-bg': s.bg, animationDelay: (i * 0.1) + 's' }">
        <div class="stat-glow"></div>
        <div class="stat-icon-box">
          <component :is="s.icone" :size="22" />
          <div class="stat-pulse"></div>
        </div>
        <div class="stat-body">
          <div class="stat-val">
            <span v-if="chargement" class="skel-val"></span>
            <AnimCounter v-else :target="s.val" />
          </div>
          <div class="stat-lbl">{{ s.label }}</div>
        </div>
        <div class="stat-deco"></div>
        <div class="stat-bar"></div>
      </div>
    </div>

    <!-- ACCÈS RAPIDES -->
    <div class="section-row"><div class="section-pill"><Zap :size="13" /> Actions rapides</div></div>
    <div class="qa-grid">
      <RouterLink to="/receptionniste/rdv" class="qa-card qa-green" style="animation-delay:.08s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><Calendar :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">RDV du jour</div>
          <div class="qa-sub">{{ donneesStats.rdvAujourdhui || 0 }} rendez-vous</div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/receptionniste/file-attente" class="qa-card qa-amber" style="animation-delay:.14s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><Users :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">File d'attente</div>
          <div class="qa-sub">{{ donneesStats.enAttente || 0 }} patient(s)</div>
        </div>
        <div class="qa-badge" v-if="donneesStats.enAttente > 0">{{ donneesStats.enAttente }}</div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/receptionniste/patients" class="qa-card qa-blue" style="animation-delay:.2s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><UserPlus :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Patients</div>
          <div class="qa-sub">Gérer les dossiers</div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/receptionniste/lits" class="qa-card qa-teal" style="animation-delay:.26s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><BedDouble :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Gestion des lits</div>
          <div class="qa-sub">{{ donneesStats.litsLibres || 0 }} lit(s) libre(s)</div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/receptionniste/factures" class="qa-card qa-purple" style="animation-delay:.32s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><Receipt :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Facturation</div>
          <div class="qa-sub">{{ donneesStats.facImpayees || 0 }} impayée(s)</div>
        </div>
        <div class="qa-badge" v-if="donneesStats.facImpayees > 0">{{ donneesStats.facImpayees }}</div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <div class="qa-card qa-dark" style="animation-delay:.38s; cursor:default">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><Activity :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Taux d'occupation</div>
          <div class="qa-sub-big">{{ tauxOccupation }}%</div>
        </div>
      </div>
    </div>

    <!-- DEUX COLONNES -->
    <div class="deux-cols">
      <!-- RDV du jour -->
      <div class="panel" style="animation:fadeInUp .5s ease .4s both">
        <div class="panel-header">
          <div class="panel-icon"><Calendar :size="15" /></div>
          <h2 class="panel-titre">RDV du jour</h2>
          <RouterLink to="/receptionniste/rdv" class="voir-tout">Gérer <ChevronRight :size="13" /></RouterLink>
        </div>
        <div v-if="chargement" class="skel-list">
          <div class="skel-row" v-for="i in 4" :key="i"></div>
        </div>
        <div v-else-if="rdvsDuJour.length" class="item-list">
          <div v-for="(r, idx) in rdvsDuJour.slice(0,5)" :key="r.id" class="item-row" :style="{ animationDelay: (idx * 0.07) + 's' }">
            <div class="rdv-time">{{ fmtHeure(r.date) }}</div>
            <div class="item-info">
              <div class="item-nom">{{ r.patient.utilisateur.prenom }} {{ r.patient.utilisateur.nom }}</div>
              <div class="item-sub">Dr. {{ r.medecin.utilisateur.prenom }} {{ r.medecin.utilisateur.nom }}</div>
            </div>
            <span class="chip" :class="statutRdvClass(r.statut)">{{ lblStatutRdv(r.statut) }}</span>
          </div>
        </div>
        <div v-else class="vide-mini"><CalendarOff :size="24" style="opacity:.3" /><span>Aucun RDV aujourd'hui</span></div>
      </div>

      <!-- File d'attente -->
      <div class="panel" style="animation:fadeInUp .5s ease .5s both">
        <div class="panel-header">
          <div class="panel-icon panel-icon-amber"><Users :size="15" /></div>
          <h2 class="panel-titre">File d'attente</h2>
          <RouterLink to="/receptionniste/file-attente" class="voir-tout">Gérer <ChevronRight :size="13" /></RouterLink>
        </div>
        <div v-if="chargement" class="skel-list">
          <div class="skel-row" v-for="i in 3" :key="i"></div>
        </div>
        <div v-else-if="fileAttente.length" class="item-list">
          <div v-for="(p, idx) in fileAttente.slice(0,5)" :key="p.id" class="item-row" :style="{ animationDelay: (idx * 0.07) + 's' }">
            <div class="rang-badge">{{ idx + 1 }}</div>
            <div class="item-info">
              <div class="item-nom">{{ p.patient.utilisateur.prenom }} {{ p.patient.utilisateur.nom }}</div>
              <div class="item-sub">{{ p.motif || 'Consultation' }}</div>
            </div>
            <span class="chip" :class="urgenceClass(p.niveauUrgence)">{{ p.niveauUrgence }}</span>
          </div>
        </div>
        <div v-else class="vide-mini"><CheckCircle :size="24" style="color:#22C55E" /><span>File vide</span></div>
      </div>
    </div>

    <!-- LITS APERÇU -->
    <div class="panel lits-panel" style="animation:fadeInUp .5s ease .6s both">
      <div class="panel-header">
        <div class="panel-icon panel-icon-teal"><BedDouble :size="15" /></div>
        <h2 class="panel-titre">Aperçu des lits</h2>
        <RouterLink to="/receptionniste/lits" class="voir-tout">Gérer <ChevronRight :size="13" /></RouterLink>
      </div>
      <div class="lits-grid">
        <div class="lit-card lit-libre" style="animation:litCardIn .5s cubic-bezier(.34,1.56,.64,1) .05s both">
          <div class="lit-card-head">
            <div class="lit-icon-circle"><BedDouble :size="20" /></div>
            <span class="lit-chip">{{ 100 - tauxOccupation }}%</span>
          </div>
          <div class="lit-val"><AnimCounter :target="donneesStats.litsLibres||0" /></div>
          <div class="lit-lbl">Lits libres</div>
          <div class="lit-bar-wrap"><div class="lit-bar" :style="{ width: (100 - tauxOccupation) + '%' }"></div></div>
        </div>
        <div class="lit-card lit-occupe" style="animation:litCardIn .5s cubic-bezier(.34,1.56,.64,1) .13s both">
          <div class="lit-card-head">
            <div class="lit-icon-circle"><BedDouble :size="20" /></div>
            <span class="lit-chip lit-chip-pulse">{{ tauxOccupation }}%</span>
          </div>
          <div class="lit-val"><AnimCounter :target="(donneesStats.litsTotaux||0)-(donneesStats.litsLibres||0)" /></div>
          <div class="lit-lbl">Occupés</div>
          <div class="lit-bar-wrap"><div class="lit-bar" :style="{ width: tauxOccupation + '%' }"></div></div>
        </div>
        <div class="lit-card lit-total" style="animation:litCardIn .5s cubic-bezier(.34,1.56,.64,1) .21s both">
          <div class="lit-card-head">
            <div class="lit-icon-circle"><BedDouble :size="20" /></div>
            <span class="lit-chip">Capacité</span>
          </div>
          <div class="lit-val"><AnimCounter :target="donneesStats.litsTotaux||0" /></div>
          <div class="lit-lbl">Total lits</div>
          <div class="lit-bar-wrap"><div class="lit-bar" style="width:100%"></div></div>
        </div>
        <div class="lit-card lit-fac" style="animation:litCardIn .5s cubic-bezier(.34,1.56,.64,1) .29s both">
          <div class="lit-card-head">
            <div class="lit-icon-circle"><Receipt :size="20" /></div>
            <span class="lit-chip">En attente</span>
          </div>
          <div class="lit-val"><AnimCounter :target="donneesStats.facImpayees||0" /></div>
          <div class="lit-lbl">Factures impayées</div>
          <div class="lit-bar-wrap"><div class="lit-bar" style="width:60%"></div></div>
        </div>
      </div>
    </div>

    <!-- PAIEMENTS RÉCENTS (temps-réel) -->
    <div class="panel" style="animation:fadeInUp .5s ease .7s both">
      <div class="panel-header">
        <div class="panel-icon panel-icon-green"><CreditCard :size="15" /></div>
        <h2 class="panel-titre">Paiements patients en ligne</h2>
        <RouterLink to="/receptionniste/factures" class="voir-tout">Toutes <ChevronRight :size="13" /></RouterLink>
        <div v-if="nouveauPaiement" class="pulse-badge">
          <span class="pulse-ring"></span>
          <span class="pulse-dot"></span>
          Nouveau
        </div>
      </div>

      <div v-if="chargementPaiements" class="skel-list">
        <div class="skel-row" v-for="i in 4" :key="i"></div>
      </div>
      <div v-else-if="paiementsRecents.length === 0" class="vide-mini">
        <CreditCard :size="24" style="opacity:.25" />
        <span>Aucun paiement en ligne reçu</span>
      </div>
      <div v-else class="pay-list">
        <transition-group name="pay-item">
          <div
            v-for="(p, idx) in paiementsRecents.slice(0, 8)"
            :key="p.id"
            class="pay-row"
            :class="{ 'pay-row-new': p._nouveau }"
            :style="{ animationDelay: (idx * 0.06) + 's' }"
          >
            <div class="pay-avatar">
              <span>{{ initiales(p.facture?.patient?.utilisateur) }}</span>
            </div>
            <div class="pay-info">
              <div class="pay-nom">{{ p.facture?.patient?.utilisateur?.prenom }} {{ p.facture?.patient?.utilisateur?.nom }}</div>
              <div class="pay-meta">
                Facture <span class="pay-ref">#{{ String(p.factureId).padStart(5,'0') }}</span>
                · {{ lblMode(p.mode) }}
                · {{ fmtRelative(p.createdAt) }}
              </div>
            </div>
            <div class="pay-montant">
              <span class="pay-fcfa">{{ Number(p.montant).toLocaleString('fr-SN') }}</span>
              <span class="pay-devise">FCFA</span>
            </div>
            <span class="pay-chip">Payé</span>
          </div>
        </transition-group>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineComponent, h } from 'vue'
import { RouterLink } from 'vue-router'
import { LayoutDashboard, Calendar, CalendarOff, Users, BedDouble, ChevronRight, CheckCircle, Zap, ArrowRight, UserPlus, Receipt, Activity, CreditCard } from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'
import { useSocket } from '../../composables/useSocket.js'
import { useAuthStore } from '../../stores/auth.js'

const AnimCounter = defineComponent({
  props: { target: { type: Number, default: 0 } },
  setup(props) {
    const current = ref(0)
    onMounted(() => {
      const end = props.target; if (!end) return
      const start = performance.now(), duration = 1300
      function step(now) {
        const t = Math.min((now - start) / duration, 1)
        current.value = Math.round((1 - Math.pow(1 - t, 3)) * end)
        if (t < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
    return () => h('span', current.value)
  },
})

const api      = useApi()
const auth     = useAuthStore()
const { fmtHeure } = useDate()
const { getSocket } = useSocket()

const chargement          = ref(true)
const chargementPaiements = ref(true)
const donneesStats = ref({ rdvAujourdhui: 0, enAttente: 0, litsLibres: 0, litsTotaux: 0, facImpayees: 0 })
const rdvsDuJour      = ref([])
const fileAttente     = ref([])
const paiementsRecents = ref([])
const nouveauPaiement  = ref(false)
let  nouveauTimer      = null

const dateAujourdhui = new Date().toLocaleDateString('fr-SN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const tauxOccupation = computed(() => {
  const t = donneesStats.value.litsTotaux || 1
  return Math.round(((t - (donneesStats.value.litsLibres || 0)) / t) * 100)
})

const stats = computed(() => [
  { label: "RDV aujourd'hui",  val: donneesStats.value.rdvAujourdhui, icone: Calendar,        bg: 'rgba(74,222,128,.12)', color: '#16A34A' },
  { label: 'En attente',       val: donneesStats.value.enAttente,     icone: Users,           bg: 'rgba(245,158,11,.10)', color: '#D97706' },
  { label: 'Lits libres',      val: donneesStats.value.litsLibres,    icone: BedDouble,       bg: 'rgba(16,185,129,.10)', color: '#059669' },
  { label: 'Lits totaux',      val: donneesStats.value.litsTotaux,    icone: BedDouble,       bg: 'rgba(14,165,233,.10)', color: '#0284C7' },
  { label: 'Factures impayées',val: donneesStats.value.facImpayees,   icone: CreditCard,      bg: 'rgba(239,68,68,.08)',  color: '#DC2626' },
])

onMounted(async () => {
  const today = new Date().toISOString().split('T')[0]
  try {
    const [s, rdvs, fa, pays] = await Promise.all([
      api.get('/receptionniste/statistiques'),
      api.get(`/receptionniste/rdv?date=${today}`),
      api.get('/receptionniste/file-attente'),
      api.get('/receptionniste/paiements-recents').catch(() => []),
    ])
    donneesStats.value   = s
    rdvsDuJour.value     = rdvs
    fileAttente.value    = fa
    paiementsRecents.value = pays
  } finally {
    chargement.value          = false
    chargementPaiements.value = false
  }

  // Écoute socket — paiement en ligne d'un patient
  const socket = getSocket()
  if (socket) {
    socket.on('paiement_patient', (data) => {
      const entree = {
        id:        Date.now(),
        factureId: data.factureId,
        montant:   data.montant,
        mode:      data.mode,
        createdAt: data.payeAt,
        _nouveau:  true,
        facture: {
          patient: {
            utilisateur: { prenom: data.nomPatient?.split(' ')[0] || '', nom: data.nomPatient?.split(' ').slice(1).join(' ') || '' }
          }
        },
      }
      paiementsRecents.value.unshift(entree)
      donneesStats.value.facImpayees = Math.max(0, (donneesStats.value.facImpayees || 0) - 1)

      nouveauPaiement.value = true
      clearTimeout(nouveauTimer)
      nouveauTimer = setTimeout(() => { nouveauPaiement.value = false }, 8000)

      // Retirer le badge _nouveau après 5s
      setTimeout(() => { entree._nouveau = false }, 5000)
    })
  }
})

onUnmounted(() => {
  clearTimeout(nouveauTimer)
  const socket = getSocket()
  if (socket) socket.off('paiement_patient')
})

function initiales(u) {
  if (!u) return '?'
  return ((u.prenom?.[0] || '') + (u.nom?.[0] || '')).toUpperCase() || '?'
}

function fmtRelative(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1)    return "À l'instant"
  if (diff < 60)   return `Il y a ${diff} min`
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`
  return new Date(iso).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short' })
}

function lblMode(m) {
  return { ESPECES: 'Espèces', MOBILE_MONEY: 'Mobile Money', ORANGE_MONEY: 'Orange Money', WAVE: 'Wave', FREE_MONEY: 'Mixx by Yas', CARTE: 'Carte' }[m] || m
}

function lblStatutRdv(s) { return { EN_ATTENTE: 'En attente', CONFIRME: 'Confirmé', ANNULE: 'Annulé', TERMINE: 'Terminé' }[s] || s }
function statutRdvClass(s) { return { EN_ATTENTE: 'chip-amber', CONFIRME: 'chip-green', ANNULE: 'chip-red', TERMINE: 'chip-gray' }[s] || 'chip-gray' }
function urgenceClass(n) { return { CRITIQUE: 'chip-red', URGENT: 'chip-amber', MODERE: 'chip-blue', FAIBLE: 'chip-gray' }[n] || 'chip-gray' }
</script>

<style scoped>
@keyframes slideInLeft  { from { opacity:0; transform:translateX(-32px) } to { opacity:1; transform:none } }
@keyframes slideInRight { from { opacity:0; transform:translateX(32px)  } to { opacity:1; transform:none } }
@keyframes fadeInUp     { from { opacity:0; transform:translateY(20px)  } to { opacity:1; transform:none } }
@keyframes stat-enter   { from { opacity:0; transform:translateY(16px) scale(.95) } to { opacity:1; transform:none } }
@keyframes gradShift    { 0%,100% { background-position:0% 50% } 50% { background-position:100% 50% } }
@keyframes particle     { 0% { transform:translateY(0) scale(1); opacity:.5 } 100% { transform:translateY(-65px) scale(0); opacity:0 } }
@keyframes pulse-ring   { 0% { transform:scale(1); opacity:.4 } 100% { transform:scale(2.2); opacity:0 } }
@keyframes shimmer      { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
@keyframes shine        { 0% { left:-100% } 60%,100% { left:150% } }
@keyframes item-enter   { from { opacity:0; transform:translateX(-12px) } to { opacity:1; transform:none } }

.tbd-wrap { display:flex; flex-direction:column; gap:1.5rem; }

/* Hero */
.hero-banner { position:relative; border-radius:1.5rem; overflow:hidden; padding:2rem 2.5rem; color:white; box-shadow:0 12px 48px rgba(34,197,94,.28); }
.hero-bg { position:absolute; inset:0; background:linear-gradient(135deg,#4ADE80 0%,#22C55E 30%,#10B981 65%,#059669 100%); background-size:300% 300%; animation:gradShift 8s ease infinite; }
.hero-particles { position:absolute; inset:0; pointer-events:none; }
.particle { position:absolute; width:5px; height:5px; border-radius:50%; background:rgba(255,255,255,.3); animation:particle 3s ease-in infinite; }
.p1{left:8%;bottom:0;animation-delay:0s} .p2{left:20%;bottom:0;animation-delay:.5s} .p3{left:35%;bottom:0;animation-delay:1s}
.p4{left:50%;bottom:0;animation-delay:.25s} .p5{left:63%;bottom:0;animation-delay:.8s} .p6{left:76%;bottom:0;animation-delay:1.3s}
.p7{left:88%;bottom:0;animation-delay:.4s} .p8{left:94%;bottom:0;animation-delay:.9s}
.hero-content { position:relative; display:flex; align-items:center; justify-content:space-between; gap:1.5rem; flex-wrap:wrap; }
.hero-left { display:flex; flex-direction:column; gap:.5rem; }
.hero-tag { display:inline-flex; align-items:center; gap:.375rem; background:rgba(255,255,255,.22); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,.4); border-radius:9999px; padding:.3rem .875rem; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; width:fit-content; }
.hero-title { font-family:var(--font-display); font-size:1.5rem; font-weight:800; letter-spacing:-.02em; }
.hero-date  { font-size:.82rem; opacity:.82; text-transform:capitalize; }
.hero-kpis { display:flex; align-items:center; gap:1.25rem; background:rgba(255,255,255,.15); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,.3); border-radius:1.25rem; padding:.875rem 1.25rem; }
.hero-kpi  { text-align:center; }
.hero-kpi-val { font-family:var(--font-display); font-size:1.5rem; font-weight:800; line-height:1; }
.hero-kpi-lbl { font-size:.7rem; opacity:.8; margin-top:.2rem; }
.hero-kpi-sep { width:1px; height:36px; background:rgba(255,255,255,.3); }

/* Stats */
.stats-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:.875rem; }
@media(max-width:1024px) { .stats-grid { grid-template-columns:repeat(3,1fr) } }
@media(max-width:600px)  { .stats-grid { grid-template-columns:1fr 1fr } }
.stat-card { background:#fff; border:1px solid #E2E8F0; border-radius:1.125rem; padding:1.1rem 1rem; display:flex; align-items:center; gap:.875rem; position:relative; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.04); animation:stat-enter .5s ease both; transition:transform .25s, box-shadow .25s; }
.stat-card:hover { transform:translateY(-4px) scale(1.01); box-shadow:0 12px 32px rgba(0,0,0,.08); }
.stat-card:hover .stat-glow { opacity:1; }
.stat-card:hover .stat-icon-box { transform:rotate(-6deg) scale(1.12); }
.stat-card:hover .stat-pulse { animation:pulse-ring .8s ease-out; }
.stat-glow { position:absolute; inset:0; background:radial-gradient(circle at 20% 50%, var(--accent-bg), transparent 70%); opacity:0; transition:opacity .3s; }
.stat-deco { position:absolute; top:-20px; right:-20px; width:72px; height:72px; border-radius:50%; background:var(--accent-bg); opacity:.6; }
.stat-bar  { position:absolute; bottom:0; left:0; right:0; height:3px; background:linear-gradient(90deg,var(--accent),transparent); }
.stat-icon-box { position:relative; width:44px; height:44px; border-radius:.875rem; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:var(--accent-bg); color:var(--accent); transition:transform .25s; z-index:1; }
.stat-pulse { position:absolute; inset:-4px; border-radius:inherit; border:2px solid var(--accent); opacity:0; }
.stat-body { position:relative; z-index:1; }
.stat-val  { font-family:var(--font-display); font-size:1.35rem; font-weight:800; color:var(--accent); line-height:1; }
.stat-lbl  { font-size:.67rem; color:var(--color-text-muted); margin-top:.2rem; }

/* Section row */
.section-row { display:flex; }
.section-pill { display:inline-flex; align-items:center; gap:.375rem; background:linear-gradient(135deg,#4ADE80,#059669); color:white; border-radius:9999px; padding:.35rem 1rem; font-size:.78rem; font-weight:700; }

/* QA Grid */
.qa-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
@media(max-width:1024px) { .qa-grid { grid-template-columns:repeat(2,1fr) } }
@media(max-width:600px)  { .qa-grid { grid-template-columns:1fr } }
.qa-card { position:relative; display:flex; align-items:center; gap:.875rem; padding:1.125rem 1.25rem; border-radius:1.25rem; text-decoration:none; overflow:hidden; transition:transform .28s cubic-bezier(.4,0,.2,1), box-shadow .28s; animation:fadeInUp .5s ease both; }
.qa-card:hover { transform:translateY(-5px); }
.qa-card:hover .qa-shine { animation:shine .8s ease forwards; }
.qa-card:hover .qa-arr { transform:translateX(4px); }
.qa-card:hover .qa-icon-wrap { transform:scale(1.12) rotate(-5deg); }
.qa-card:hover .qa-shape { transform:scale(1.3) rotate(10deg); }
.qa-shape { position:absolute; right:-15px; top:-15px; width:80px; height:80px; border-radius:50%; background:rgba(255,255,255,.1); transition:transform .3s; }
.qa-shine { position:absolute; top:0; bottom:0; width:50px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent); left:-100%; pointer-events:none; }
.qa-icon-wrap { width:48px; height:48px; border-radius:.875rem; flex-shrink:0; background:rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center; color:white; border:1px solid rgba(255,255,255,.3); transition:transform .25s; }
.qa-content { flex:1; color:white; }
.qa-title { font-family:var(--font-display); font-size:.9rem; font-weight:700; }
.qa-sub   { font-size:.73rem; opacity:.8; margin-top:.15rem; }
.qa-sub-big { font-size:1rem; font-weight:800; margin-top:.15rem; }
.qa-arr   { color:rgba(255,255,255,.65); flex-shrink:0; transition:transform .25s; }
.qa-badge { background:rgba(255,255,255,.3); color:white; border-radius:9999px; font-size:.7rem; font-weight:700; padding:1px 8px; border:1px solid rgba(255,255,255,.4); }

.qa-green  { background:linear-gradient(135deg,#22C55E,#059669); box-shadow:0 6px 24px rgba(34,197,94,.32); }
.qa-amber  { background:linear-gradient(135deg,#FCD34D,#D97706); box-shadow:0 6px 24px rgba(245,158,11,.32); }
.qa-blue   { background:linear-gradient(135deg,#38BDF8,#0284C7); box-shadow:0 6px 24px rgba(14,165,233,.32); }
.qa-teal   { background:linear-gradient(135deg,#2DD4BF,#0F766E); box-shadow:0 6px 24px rgba(20,184,166,.32); }
.qa-purple { background:linear-gradient(135deg,#A78BFA,#7C3AED); box-shadow:0 6px 24px rgba(139,92,246,.32); }
.qa-dark   { background:linear-gradient(135deg,#334155,#0F172A); box-shadow:0 6px 24px rgba(15,23,42,.25); cursor:default; }
.qa-green:hover  { box-shadow:0 14px 40px rgba(34,197,94,.5); }
.qa-amber:hover  { box-shadow:0 14px 40px rgba(245,158,11,.5); }
.qa-blue:hover   { box-shadow:0 14px 40px rgba(14,165,233,.5); }
.qa-teal:hover   { box-shadow:0 14px 40px rgba(20,184,166,.5); }
.qa-purple:hover { box-shadow:0 14px 40px rgba(139,92,246,.5); }

/* Panels */
.deux-cols { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; }
@media(max-width:768px) { .deux-cols { grid-template-columns:1fr } }
.panel { background:#fff; border:1px solid #E2E8F0; border-radius:1.25rem; padding:1.375rem; box-shadow:0 2px 12px rgba(0,0,0,.04); transition:box-shadow .25s; }
.panel:hover { box-shadow:0 8px 32px rgba(0,0,0,.08); }
.panel-header { display:flex; align-items:center; gap:.625rem; margin-bottom:1.125rem; }
.panel-icon { width:32px; height:32px; border-radius:.75rem; background:linear-gradient(135deg,#4ADE80,#059669); display:flex; align-items:center; justify-content:center; color:white; flex-shrink:0; }
.panel-icon-amber { background:linear-gradient(135deg,#FCD34D,#D97706); }
.panel-icon-teal  { background:linear-gradient(135deg,#2DD4BF,#0F766E); }
.panel-titre { font-family:var(--font-display); font-size:.92rem; font-weight:700; color:var(--color-text); flex:1; }
.voir-tout { display:inline-flex; align-items:center; gap:.2rem; font-size:.78rem; color:#16A34A; font-weight:600; text-decoration:none; padding:.25rem .625rem; border-radius:9999px; background:rgba(74,222,128,.08); transition:background .15s; }
.voir-tout:hover { background:rgba(74,222,128,.18); }

.item-list { display:flex; flex-direction:column; gap:.5rem; }
.item-row { display:flex; align-items:center; gap:.625rem; padding:.5rem .625rem; border-radius:.875rem; background:#F8FAFC; border:1px solid transparent; transition:all .18s; animation:item-enter .4s ease both; }
.item-row:hover { background:rgba(74,222,128,.05); border-color:rgba(74,222,128,.2); }
.rdv-time { font-size:.8rem; font-weight:700; color:#16A34A; min-width:48px; flex-shrink:0; }
.rang-badge { width:22px; height:22px; border-radius:50%; background:linear-gradient(135deg,#4ADE80,#059669); color:white; font-size:.65rem; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.item-info { flex:1; min-width:0; }
.item-nom  { font-size:.84rem; font-weight:600; color:var(--color-text); }
.item-sub  { font-size:.72rem; color:var(--color-text-muted); }

/* Lits grid */
.lits-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1.25rem; }
@media(max-width:768px) { .lits-grid { grid-template-columns:1fr 1fr } }
.lit-card {
  background: var(--color-surface);
  border-radius: 1.25rem;
  padding: 1.375rem 1.25rem 1.125rem;
  border: 1.5px solid var(--color-border);
  position: relative;
  overflow: hidden;
  transition: transform .28s cubic-bezier(.34,1.56,.64,1), box-shadow .28s ease;
  box-shadow: 0 2px 10px rgba(0,0,0,.04);
}
.lit-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  border-radius: 1.25rem 1.25rem 0 0;
  background-size: 200% 100%;
  animation: stripeMove 3s ease-in-out infinite;
}
.lit-card::after {
  content: '';
  position: absolute;
  top: 0; left: -60%;
  width: 40%; height: 4px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent);
  animation: stripeShine 3.5s ease-in-out infinite;
  border-radius: 9999px;
  pointer-events: none;
}
.lit-card:hover { transform: translateY(-5px) scale(1.01); box-shadow: 0 18px 40px rgba(0,0,0,.11); }
.lit-card:hover .lit-icon-circle { animation: iconBounce .4s cubic-bezier(.34,1.56,.64,1) forwards; }
.lit-card-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
.lit-icon-circle { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition: transform .2s; }
.lit-chip { font-size:.64rem; font-weight:700; padding:3px 9px; border-radius:9999px; letter-spacing:.02em; }
.lit-chip-pulse { animation: chipPulse 2.2s ease-in-out infinite; }
.lit-val { font-family:var(--font-display); font-size:2.25rem; font-weight:800; line-height:1; color:var(--color-text); }
.lit-lbl { font-size:.78rem; font-weight:600; margin-top:.375rem; color:var(--color-text-muted); }
.lit-bar-wrap { height:5px; background:var(--color-border); border-radius:9999px; margin-top:1.125rem; overflow:hidden; position:relative; }
.lit-bar { height:100%; border-radius:9999px; transition:width 1.1s cubic-bezier(.4,0,.2,1); background-size:200% 100%; animation:barShimmer 2.5s ease-in-out infinite; }

.lit-libre::before { background:linear-gradient(90deg,#22C55E,#4ADE80,#22C55E); }
.lit-libre .lit-icon-circle { background:rgba(34,197,94,.12); color:#16A34A; }
.lit-libre .lit-chip { background:rgba(34,197,94,.12); color:#16A34A; border:1px solid rgba(34,197,94,.25); }
.lit-libre .lit-bar { background:linear-gradient(90deg,#22C55E,#4ADE80,#22C55E); }

.lit-occupe::before { background:linear-gradient(90deg,#EF4444,#F87171,#EF4444); }
.lit-occupe .lit-icon-circle { background:rgba(239,68,68,.10); color:#DC2626; }
.lit-occupe .lit-chip { background:rgba(239,68,68,.10); color:#DC2626; border:1px solid rgba(239,68,68,.2); }
.lit-occupe .lit-bar { background:linear-gradient(90deg,#EF4444,#F87171,#EF4444); }

.lit-total::before { background:linear-gradient(90deg,#3B82F6,#60A5FA,#3B82F6); }
.lit-total .lit-icon-circle { background:rgba(59,130,246,.10); color:#2563EB; }
.lit-total .lit-chip { background:rgba(59,130,246,.10); color:#2563EB; border:1px solid rgba(59,130,246,.2); }
.lit-total .lit-bar { background:linear-gradient(90deg,#3B82F6,#60A5FA,#3B82F6); }

.lit-fac::before { background:linear-gradient(90deg,#F59E0B,#FCD34D,#F59E0B); }
.lit-fac .lit-icon-circle { background:rgba(245,158,11,.10); color:#D97706; }
.lit-fac .lit-chip { background:rgba(245,158,11,.10); color:#D97706; border:1px solid rgba(245,158,11,.25); }
.lit-fac .lit-bar { background:linear-gradient(90deg,#F59E0B,#FCD34D,#F59E0B); }

@keyframes litCardIn {
  from { opacity:0; transform:translateY(22px) scale(.95) }
  to   { opacity:1; transform:none }
}
@keyframes stripeMove {
  0%,100% { background-position:0% 50% }
  50%     { background-position:100% 50% }
}
@keyframes stripeShine {
  0%   { left:-60% }
  60%,100% { left:120% }
}
@keyframes barShimmer {
  0%,100% { background-position:0% 50% }
  50%     { background-position:100% 50% }
}
@keyframes iconBounce {
  0%   { transform:scale(1) }
  60%  { transform:scale(1.22) }
  100% { transform:scale(1.1) }
}
@keyframes chipPulse {
  0%,100% { opacity:1; transform:scale(1) }
  50%     { opacity:.65; transform:scale(.94) }
}

/* Chips */
.chip { font-size:.62rem; font-weight:700; padding:2px 7px; border-radius:9999px; text-transform:uppercase; letter-spacing:.04em; flex-shrink:0; }
.chip-green  { background:rgba(74,222,128,.12); color:#16A34A; border:1px solid rgba(74,222,128,.3); }
.chip-blue   { background:rgba(56,189,248,.12);  color:#0284C7; border:1px solid rgba(56,189,248,.3); }
.chip-amber  { background:rgba(252,211,77,.15);  color:#D97706; border:1px solid rgba(252,211,77,.3); }
.chip-red    { background:rgba(248,113,113,.12); color:#DC2626; border:1px solid rgba(248,113,113,.3); }
.chip-gray   { background:rgba(148,163,184,.12); color:#64748B; border:1px solid rgba(148,163,184,.3); }

.vide-mini { display:flex; align-items:center; gap:.625rem; padding:1.5rem; color:var(--color-text-muted); font-size:.85rem; justify-content:center; }
.skel-list { display:flex; flex-direction:column; gap:.5rem; }
.skel-row  { height:52px; background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%); background-size:200% 100%; border-radius:.875rem; animation:shimmer 1.5s infinite; }
.skel-val  { display:inline-block; width:36px; height:22px; background:#E2E8F0; border-radius:4px; animation:shimmer 1.5s infinite; }

/* ── Panel paiements récents ──────────────────────────────── */
@keyframes paySlideIn { from { opacity:0; transform:translateX(-16px) } to { opacity:1; transform:none } }
@keyframes pulseGlow  { 0%,100% { box-shadow:0 0 0 0 rgba(34,197,94,.4) } 60% { box-shadow:0 0 0 8px rgba(34,197,94,0) } }

.panel-icon-green { background:linear-gradient(135deg,#4ADE80,#059669); }

/* Badge "Nouveau" clignotant */
.pulse-badge {
  display:inline-flex; align-items:center; gap:.3rem;
  background:rgba(34,197,94,.1); color:#16A34A;
  border:1px solid rgba(34,197,94,.3); border-radius:9999px;
  padding:.2rem .65rem; font-size:.68rem; font-weight:700;
  margin-left:auto; position:relative;
}
.pulse-ring {
  position:absolute; inset:-3px; border-radius:9999px;
  border:1.5px solid rgba(34,197,94,.5);
  animation:pulseGlow 1.2s ease-out infinite;
}
.pulse-dot {
  width:7px; height:7px; border-radius:50%;
  background:#16A34A; animation:pulseGlow .8s ease-out infinite;
}

/* Liste */
.pay-list { display:flex; flex-direction:column; gap:.5rem; }
.pay-item-enter-active { transition:all .35s ease; }
.pay-item-enter-from   { opacity:0; transform:translateY(-10px); }

.pay-row {
  display:flex; align-items:center; gap:.875rem;
  padding:.75rem 1rem; border-radius:1rem;
  background:#F8FAFC; border:1px solid #E2E8F0;
  transition:all .25s; animation:paySlideIn .3s ease both;
}
.pay-row:hover { background:#F0FDF4; border-color:rgba(34,197,94,.25); }
.pay-row-new {
  background:linear-gradient(135deg,rgba(74,222,128,.08),rgba(16,185,129,.05));
  border-color:rgba(34,197,94,.35);
  animation:pulseGlow 1.5s ease-out 3;
}

.pay-avatar {
  width:38px; height:38px; border-radius:50%; flex-shrink:0;
  background:linear-gradient(135deg,#4ADE80,#059669);
  display:flex; align-items:center; justify-content:center;
  color:white; font-size:.78rem; font-weight:800;
}
.pay-info   { flex:1; min-width:0; }
.pay-nom    { font-size:.88rem; font-weight:700; color:var(--color-text); }
.pay-meta   { font-size:.72rem; color:var(--color-text-muted); margin-top:.1rem; }
.pay-ref    { font-family:monospace; font-weight:700; color:var(--color-text); }

.pay-montant { display:flex; flex-direction:column; align-items:flex-end; flex-shrink:0; }
.pay-fcfa    { font-family:var(--font-display); font-size:1rem; font-weight:800; color:#16A34A; }
.pay-devise  { font-size:.62rem; color:var(--color-text-muted); font-weight:500; }

.pay-chip {
  flex-shrink:0; font-size:.62rem; font-weight:700; padding:3px 8px;
  border-radius:9999px; text-transform:uppercase; letter-spacing:.04em;
  background:rgba(74,222,128,.12); color:#16A34A;
  border:1px solid rgba(74,222,128,.3);
}
</style>
