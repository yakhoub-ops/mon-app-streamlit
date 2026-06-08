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
          <div class="hero-tag"><Stethoscope :size="13" /> Médecin</div>
          <h1 class="hero-title">Bonjour, <span class="hero-name">Dr. {{ authStore.utilisateur?.prenom }} {{ authStore.utilisateur?.nom }}</span></h1>
          <p class="hero-date">{{ dateAujourdhui }}</p>
        </div>
        <div class="hero-icon-anim" style="animation:slideInRight .6s ease both">
          <div class="stethoscope-circle">
            <div class="sc-ring sc-ring-1"></div>
            <div class="sc-ring sc-ring-2"></div>
            <Stethoscope :size="44" class="sc-icon" />
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

    <!-- ACCÈS RAPIDES MÉDECIN -->
    <div class="section-row">
      <div class="section-pill"><Zap :size="13" /> Actions rapides</div>
    </div>
    <div class="qa-grid">
      <RouterLink to="/medecin/file-attente" class="qa-card qa-green" style="animation-delay:.08s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><Users :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">File d'attente</div>
          <div class="qa-sub">{{ donneesStats.enAttente || 0 }} patient(s) en attente</div>
        </div>
        <div class="qa-badge" v-if="donneesStats.enAttente > 0">{{ donneesStats.enAttente }}</div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/medecin/agenda" class="qa-card qa-blue" style="animation-delay:.14s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><Calendar :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Mon agenda</div>
          <div class="qa-sub">{{ donneesStats.rdvAujourdhui || 0 }} RDV aujourd'hui</div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/medecin/consultations" class="qa-card qa-teal" style="animation-delay:.2s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><Stethoscope :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Consultations</div>
          <div class="qa-sub">{{ donneesStats.consultationsMois || 0 }} ce mois</div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/medecin/dossiers" class="qa-card qa-purple" style="animation-delay:.26s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><FolderOpen :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Dossiers patients</div>
          <div class="qa-sub">Historiques médicaux</div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/medecin/ordonnances" class="qa-card qa-rose" style="animation-delay:.32s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><Pill :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Ordonnances</div>
          <div class="qa-sub">Rédiger &amp; consulter</div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/medecin/urgences" class="qa-card qa-red" style="animation-delay:.38s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><AlertTriangle :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Urgences</div>
          <div class="qa-sub">Patients critiques</div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/medecin/teleconsultation" class="qa-card qa-amber" style="animation-delay:.44s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap" style="position:relative">
          <Video :size="26" />
          <span v-if="teleconsultActive" class="tc-dot tc-dot-on"></span>
          <span v-else class="tc-dot tc-dot-off"></span>
        </div>
        <div class="qa-content">
          <div class="qa-title">Téléconsultation</div>
          <div class="qa-sub" style="display:flex;align-items:center;gap:.35rem">
            <span class="tc-badge" :class="teleconsultActive ? 'tc-badge-on' : 'tc-badge-off'">
              {{ teleconsultActive ? 'Activée' : 'Désactivée' }}
            </span>
          </div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/medecin/parametres" class="qa-card qa-slate" style="animation-delay:.50s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><Settings :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Paramètres</div>
          <div class="qa-sub">Mon profil médecin</div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>
    </div>

    <!-- DEUX COLONNES -->
    <div class="deux-cols">
      <!-- File d'attente -->
      <div class="panel" style="animation:fadeInUp .5s ease .4s both">
        <div class="panel-header">
          <div class="panel-icon"><Users :size="15" /></div>
          <h2 class="panel-titre">File d'attente en cours</h2>
          <RouterLink to="/medecin/file-attente" class="voir-tout">Voir tout <ChevronRight :size="13" /></RouterLink>
        </div>
        <div v-if="chargement" class="skel-list">
          <div class="skel-row" v-for="i in 3" :key="i"></div>
        </div>
        <div v-else-if="fileAttente.length" class="item-list">
          <div v-for="(p, idx) in fileAttente.slice(0,4)" :key="p.id" class="item-row" :style="{ animationDelay: (idx * 0.07) + 's' }">
            <div class="item-rang">{{ idx + 1 }}</div>
            <div class="item-avatar"><User :size="16" /></div>
            <div class="item-info">
              <div class="item-nom">{{ p.patient.utilisateur.prenom }} {{ p.patient.utilisateur.nom }}</div>
              <div class="item-sub">{{ p.motif || 'Consultation' }}</div>
            </div>
            <div class="item-right">
              <span class="chip" :class="urgenceClass(p.niveauUrgence)">{{ p.niveauUrgence }}</span>
              <RouterLink :to="`/medecin/consultation/${p.id}`" class="btn-consult">
                <Stethoscope :size="13" />
              </RouterLink>
            </div>
          </div>
        </div>
        <div v-else class="vide-mini"><CheckCircle :size="24" style="color:#22C55E" /><span>File vide</span></div>
      </div>

      <!-- RDV à venir -->
      <div class="panel" style="animation:fadeInUp .5s ease .5s both">
        <div class="panel-header">
          <div class="panel-icon panel-icon-blue"><Calendar :size="15" /></div>
          <h2 class="panel-titre">Prochains RDV</h2>
          <RouterLink to="/medecin/agenda" class="voir-tout">Agenda <ChevronRight :size="13" /></RouterLink>
        </div>
        <div v-if="chargement" class="skel-list">
          <div class="skel-row" v-for="i in 3" :key="i"></div>
        </div>
        <div v-else-if="rdvs.length" class="item-list">
          <div v-for="(r, idx) in rdvs.slice(0,4)" :key="r.id" class="item-row" :style="{ animationDelay: (idx * 0.07) + 's' }">
            <div class="rdv-time">{{ fmtHeure(r.date) }}</div>
            <div class="item-info">
              <div class="item-nom">{{ r.patient.utilisateur.prenom }} {{ r.patient.utilisateur.nom }}</div>
              <div class="item-sub">{{ r.motif || 'Consultation' }}</div>
            </div>
            <span class="chip" :class="r.type==='TELECONSULTATION'?'chip-blue':'chip-green'">
              <Video v-if="r.type==='TELECONSULTATION'" :size="10" />
              <MapPin v-else :size="10" />
            </span>
          </div>
        </div>
        <div v-else class="vide-mini"><CalendarOff :size="24" style="opacity:.3" /><span>Aucun RDV à venir</span></div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Stethoscope, Users, Calendar, CalendarOff, User, CheckCircle,
  ChevronRight, Video, MapPin, Zap, ArrowRight, FolderOpen, Settings,
  Pill, AlertTriangle,
} from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth.js'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

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

const authStore = useAuthStore()
const api = useApi()
const { fmtHeure } = useDate()

const chargement        = ref(true)
const donneesStats      = ref({ rdvAujourdhui: 0, rdvSemaine: 0, consultationsMois: 0, enAttente: 0 })
const fileAttente       = ref([])
const rdvs              = ref([])
const teleconsultActive = ref(false)

const dateAujourdhui = new Date().toLocaleDateString('fr-SN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const stats = computed(() => [
  { label: "RDV aujourd'hui",      val: donneesStats.value.rdvAujourdhui,    icone: Calendar,    bg: 'rgba(74,222,128,.12)', color: '#16A34A' },
  { label: 'RDV cette semaine',    val: donneesStats.value.rdvSemaine,       icone: Calendar,    bg: 'rgba(14,165,233,.10)', color: '#0284C7' },
  { label: 'Consultations (mois)', val: donneesStats.value.consultationsMois, icone: Stethoscope, bg: 'rgba(16,185,129,.10)', color: '#059669' },
  { label: 'En attente',           val: donneesStats.value.enAttente,        icone: Users,       bg: 'rgba(245,158,11,.10)', color: '#D97706' },
])

onMounted(async () => {
  try {
    const [s, fa, ag, profil] = await Promise.all([
      api.get('/medecin/statistiques'),
      api.get('/medecin/file-attente'),
      api.get('/medecin/agenda'),
      api.get('/medecin/profil'),
    ])
    donneesStats.value      = s
    fileAttente.value       = fa
    rdvs.value              = ag.filter(r => !['ANNULE', 'TERMINE'].includes(r.statut))
    teleconsultActive.value = profil.teleconsultationActive ?? false
  } finally { chargement.value = false }
})

function urgenceClass(n) {
  return { CRITIQUE: 'chip-red', URGENT: 'chip-amber', MODERE: 'chip-blue', FAIBLE: 'chip-gray' }[n] || 'chip-gray'
}
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
@keyframes spin         { to { transform:rotate(360deg) } }
@keyframes item-enter   { from { opacity:0; transform:translateX(-12px) } to { opacity:1; transform:none } }

.tbd-wrap { display:flex; flex-direction:column; gap:1.5rem; }

/* Hero */
.hero-banner { position:relative; border-radius:1.5rem; overflow:hidden; padding:2rem 2.5rem; color:white; box-shadow:0 12px 48px rgba(34,197,94,.28); }
.hero-bg { position:absolute; inset:0; background:linear-gradient(135deg,#4ADE80 0%,#22C55E 30%,#10B981 65%,#059669 100%); background-size:300% 300%; animation:gradShift 8s ease infinite; }
.hero-particles { position:absolute; inset:0; pointer-events:none; }
.particle { position:absolute; width:5px; height:5px; border-radius:50%; background:rgba(255,255,255,.3); animation:particle 3s ease-in infinite; }
.p1 { left:10%; bottom:0; animation-delay:0s } .p2 { left:22%; bottom:0; animation-delay:.5s }
.p3 { left:38%; bottom:0; animation-delay:1s  } .p4 { left:52%; bottom:0; animation-delay:.25s }
.p5 { left:64%; bottom:0; animation-delay:.8s } .p6 { left:76%; bottom:0; animation-delay:1.2s }
.p7 { left:87%; bottom:0; animation-delay:.4s } .p8 { left:95%; bottom:0; animation-delay:.9s }
.hero-content { position:relative; display:flex; align-items:center; justify-content:space-between; gap:1.5rem; }
.hero-left { display:flex; flex-direction:column; gap:.5rem; }
.hero-tag { display:inline-flex; align-items:center; gap:.375rem; background:rgba(255,255,255,.22); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,.4); border-radius:9999px; padding:.3rem .875rem; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; width:fit-content; }
.hero-title { font-family:var(--font-display); font-size:1.5rem; font-weight:800; letter-spacing:-.02em; }
.hero-name  { font-style:italic; }
.hero-date  { font-size:.82rem; opacity:.82; text-transform:capitalize; }
.stethoscope-circle { position:relative; width:90px; height:90px; }
.sc-ring { position:absolute; border-radius:50%; border:2px solid rgba(255,255,255,.25); }
.sc-ring-1 { inset:0; animation:spin 10s linear infinite; }
.sc-ring-2 { inset:12px; animation:spin 7s linear infinite reverse; border-style:dashed; }
.sc-icon { position:absolute; inset:0; margin:auto; width:44px; height:44px; opacity:.55; }

/* Stats */
.stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:.875rem; }
@media(max-width:900px) { .stats-grid { grid-template-columns:repeat(2,1fr) } }
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
.stat-val  { font-family:var(--font-display); font-size:1.5rem; font-weight:800; color:var(--accent); line-height:1; }
.stat-lbl  { font-size:.68rem; color:var(--color-text-muted); margin-top:.2rem; }

/* Section row */
.section-row { display:flex; }
.section-pill { display:inline-flex; align-items:center; gap:.375rem; background:linear-gradient(135deg,#4ADE80,#059669); color:white; border-radius:9999px; padding:.35rem 1rem; font-size:.78rem; font-weight:700; }

/* QA Grid */
.qa-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; }
@media(max-width:1200px) { .qa-grid { grid-template-columns:repeat(3,1fr) } }
@media(max-width:900px)  { .qa-grid { grid-template-columns:repeat(2,1fr) } }
@media(max-width:500px)  { .qa-grid { grid-template-columns:1fr } }

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
.qa-arr   { color:rgba(255,255,255,.65); flex-shrink:0; transition:transform .25s; }
.qa-badge { background:rgba(255,255,255,.3); color:white; border-radius:9999px; font-size:.7rem; font-weight:700; padding:1px 8px; min-width:24px; text-align:center; border:1px solid rgba(255,255,255,.4); }

.qa-green  { background:linear-gradient(135deg,#22C55E,#059669); box-shadow:0 6px 24px rgba(34,197,94,.32); }
.qa-blue   { background:linear-gradient(135deg,#38BDF8,#0284C7); box-shadow:0 6px 24px rgba(14,165,233,.32); }
.qa-teal   { background:linear-gradient(135deg,#2DD4BF,#0F766E); box-shadow:0 6px 24px rgba(20,184,166,.32); }
.qa-purple { background:linear-gradient(135deg,#A78BFA,#7C3AED); box-shadow:0 6px 24px rgba(139,92,246,.32); }
.qa-amber  { background:linear-gradient(135deg,#FCD34D,#D97706); box-shadow:0 6px 24px rgba(245,158,11,.32); }
.qa-slate  { background:linear-gradient(135deg,#94A3B8,#475569); box-shadow:0 6px 24px rgba(71,85,105,.25); }
.qa-green:hover  { box-shadow:0 14px 40px rgba(34,197,94,.5); }
.qa-blue:hover   { box-shadow:0 14px 40px rgba(14,165,233,.5); }
.qa-teal:hover   { box-shadow:0 14px 40px rgba(20,184,166,.5); }
.qa-purple:hover { box-shadow:0 14px 40px rgba(139,92,246,.5); }
.qa-rose         { background:linear-gradient(135deg,#FB7185,#E11D48); box-shadow:0 6px 24px rgba(225,29,72,.32); }
.qa-rose:hover   { box-shadow:0 14px 40px rgba(225,29,72,.5); }
.qa-red          { background:linear-gradient(135deg,#F87171,#DC2626); box-shadow:0 6px 24px rgba(220,38,38,.32); }
.qa-red:hover    { box-shadow:0 14px 40px rgba(220,38,38,.5); }
.qa-amber:hover  { box-shadow:0 14px 40px rgba(245,158,11,.5); }

/* Panels */
.deux-cols { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; }
@media(max-width:768px) { .deux-cols { grid-template-columns:1fr } }
.panel { background:#fff; border:1px solid #E2E8F0; border-radius:1.25rem; padding:1.375rem; box-shadow:0 2px 12px rgba(0,0,0,.04); transition:box-shadow .25s; }
.panel:hover { box-shadow:0 8px 32px rgba(0,0,0,.08); }
.panel-header { display:flex; align-items:center; gap:.625rem; margin-bottom:1.125rem; }
.panel-icon { width:32px; height:32px; border-radius:.75rem; background:linear-gradient(135deg,#4ADE80,#059669); display:flex; align-items:center; justify-content:center; color:white; flex-shrink:0; }
.panel-icon-blue { background:linear-gradient(135deg,#38BDF8,#0284C7); }
.panel-titre { font-family:var(--font-display); font-size:.92rem; font-weight:700; color:var(--color-text); flex:1; }
.voir-tout { display:inline-flex; align-items:center; gap:.2rem; font-size:.78rem; color:#16A34A; font-weight:600; text-decoration:none; padding:.25rem .625rem; border-radius:9999px; background:rgba(74,222,128,.08); transition:background .15s; }
.voir-tout:hover { background:rgba(74,222,128,.18); }

/* Items list */
.item-list { display:flex; flex-direction:column; gap:.5rem; }
.item-row { display:flex; align-items:center; gap:.625rem; padding:.5rem .625rem; border-radius:.875rem; background:#F8FAFC; border:1px solid transparent; transition:all .18s; animation:item-enter .4s ease both; }
.item-row:hover { background:rgba(74,222,128,.05); border-color:rgba(74,222,128,.2); }
.item-rang { width:20px; height:20px; border-radius:50%; background:linear-gradient(135deg,#4ADE80,#059669); color:white; font-size:.65rem; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.item-avatar { width:30px; height:30px; border-radius:50%; background:rgba(74,222,128,.12); display:flex; align-items:center; justify-content:center; color:#16A34A; flex-shrink:0; }
.item-info { flex:1; min-width:0; }
.item-nom  { font-size:.84rem; font-weight:600; color:var(--color-text); }
.item-sub  { font-size:.72rem; color:var(--color-text-muted); }
.item-right { display:flex; align-items:center; gap:.375rem; flex-shrink:0; }
.rdv-time   { font-size:.8rem; font-weight:700; color:#16A34A; min-width:48px; flex-shrink:0; }

.btn-consult { width:28px; height:28px; border-radius:.5rem; background:linear-gradient(135deg,#4ADE80,#059669); display:flex; align-items:center; justify-content:center; color:white; text-decoration:none; transition:transform .15s; flex-shrink:0; }
.btn-consult:hover { transform:scale(1.12); }

/* Chips */
.chip { font-size:.62rem; font-weight:700; padding:2px 7px; border-radius:9999px; text-transform:uppercase; letter-spacing:.04em; display:inline-flex; align-items:center; gap:3px; flex-shrink:0; }
.chip-green  { background:rgba(74,222,128,.12); color:#16A34A; border:1px solid rgba(74,222,128,.3); }
.chip-blue   { background:rgba(56,189,248,.12);  color:#0284C7; border:1px solid rgba(56,189,248,.3); }
.chip-amber  { background:rgba(252,211,77,.15);  color:#D97706; border:1px solid rgba(252,211,77,.3); }
.chip-red    { background:rgba(248,113,113,.12); color:#DC2626; border:1px solid rgba(248,113,113,.3); }
.chip-gray   { background:rgba(148,163,184,.12); color:#64748B; border:1px solid rgba(148,163,184,.3); }

/* Téléconsultation status dot + badge */
.tc-dot {
  position: absolute;
  bottom: -3px; right: -3px;
  width: 12px; height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,.6);
}
.tc-dot-on  { background: #4ADE80; box-shadow: 0 0 0 3px rgba(74,222,128,.35); animation: dot-pulse 2s ease infinite; }
.tc-dot-off { background: rgba(255,255,255,.4); }

.tc-badge {
  font-size: .64rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: .05em;
  border: 1px solid;
}
.tc-badge-on  { background: rgba(74,222,128,.25); color: #fff; border-color: rgba(74,222,128,.5); }
.tc-badge-off { background: rgba(255,255,255,.12); color: rgba(255,255,255,.8); border-color: rgba(255,255,255,.25); }

@keyframes dot-pulse { 0%,100% { box-shadow: 0 0 0 3px rgba(74,222,128,.35) } 50% { box-shadow: 0 0 0 6px rgba(74,222,128,.0) } }

.vide-mini { display:flex; align-items:center; gap:.625rem; padding:1.5rem; color:var(--color-text-muted); font-size:.85rem; justify-content:center; }
.skel-list { display:flex; flex-direction:column; gap:.5rem; }
.skel-row  { height:52px; background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%); background-size:200% 100%; border-radius:.875rem; animation:shimmer 1.5s infinite; }
.skel-val  { display:inline-block; width:36px; height:22px; background:#E2E8F0; border-radius:4px; animation:shimmer 1.5s infinite; }
</style>
