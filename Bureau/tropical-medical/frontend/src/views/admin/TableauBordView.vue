<template>
  <div class="tbd-wrap">

    <!-- ══ HERO ══════════════════════════════════════════════════ -->
    <div class="hero-banner">
      <div class="hero-bg"></div>
      <div class="hero-particles">
        <span v-for="i in 10" :key="i" class="particle" :class="`p${i}`"></span>
      </div>
      <div class="hero-content">
        <div class="hero-left" style="animation:slideInLeft .6s ease both">
          <div class="hero-tag"><ShieldCheck :size="13" /> Administration</div>
          <h1 class="hero-title">Tableau de bord</h1>
          <p class="hero-date">{{ dateAujourdhui }}</p>
        </div>
        <div class="hero-kpis" style="animation:slideInRight .6s ease both">
          <div class="hero-kpi">
            <div class="hero-kpi-val">
              <span v-if="chargement">—</span>
              <AnimCounter v-else :target="donneesStats.totalUtilisateurs||0" />
            </div>
            <div class="hero-kpi-lbl">Utilisateurs</div>
          </div>
          <div class="hero-kpi-sep"></div>
          <div class="hero-kpi">
            <div class="hero-kpi-val">
              <span v-if="chargement">—</span>
              <AnimCounter v-else :target="donneesStats.totalPatients||0" />
            </div>
            <div class="hero-kpi-lbl">Patients</div>
          </div>
          <div class="hero-kpi-sep"></div>
          <div class="hero-kpi">
            <div class="hero-kpi-val">
              <span v-if="chargement">—</span>
              <AnimCounter v-else :target="donneesStats.totalMedecins||0" />
            </div>
            <div class="hero-kpi-lbl">Médecins</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ STATS GRID ════════════════════════════════════════════ -->
    <div class="stats-grid">
      <div
        v-for="(s, i) in stats"
        :key="s.label"
        class="stat-card"
        :style="{ '--accent': s.color, '--accent-bg': s.bg, animationDelay: (i * 0.09) + 's' }"
      >
        <div class="stat-glow"></div>
        <div class="stat-icon-box">
          <component :is="s.icone" :size="22" />
          <div class="stat-pulse"></div>
        </div>
        <div class="stat-body">
          <div class="stat-val">
            <span v-if="chargement" class="skel-val"></span>
            <AnimCounter v-else :target="typeof s.val === 'number' ? s.val : 0" />
            <span v-if="s.unit" class="stat-unit">{{ s.unit }}</span>
          </div>
          <div class="stat-lbl">{{ s.label }}</div>
        </div>
        <div class="stat-deco"></div>
        <div class="stat-bar"></div>
      </div>
    </div>

    <!-- ══ ACCÈS RAPIDES ADMIN ════════════════════════════════════ -->
    <div class="section-row">
      <div class="section-pill"><Zap :size="13" /> Actions rapides</div>
    </div>
    <div class="qa-grid">
      <RouterLink to="/admin/utilisateurs" class="qa-card qa-green" style="animation-delay:.08s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><Users :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Utilisateurs</div>
          <div class="qa-sub">Gérer les comptes</div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/admin/medecins" class="qa-card qa-blue" style="animation-delay:.14s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><Stethoscope :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Médecins</div>
          <div class="qa-sub">Équipe médicale</div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/admin/actualites" class="qa-card qa-amber" style="animation-delay:.2s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><Newspaper :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Actualités</div>
          <div class="qa-sub">Publier du contenu</div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/admin/statistiques" class="qa-card qa-purple" style="animation-delay:.26s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><BarChart3 :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Statistiques</div>
          <div class="qa-sub">Rapports & analytics</div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/admin/parametres" class="qa-card qa-teal" style="animation-delay:.32s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><Settings :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Paramètres</div>
          <div class="qa-sub">Configuration système</div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <div class="qa-card qa-dark qa-info" style="animation-delay:.38s;cursor:default">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><TrendingUp :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Revenu mensuel</div>
          <div class="qa-sub-big">{{ (donneesStats.revenuMois||0).toLocaleString('fr-SN') }} FCFA</div>
        </div>
      </div>
    </div>

    <!-- ══ GRILLE 3 COL ══════════════════════════════════════════ -->
    <div class="trois-cols">
      <!-- Rôles -->
      <div class="panel" style="animation:fadeInUp .5s ease .35s both">
        <div class="panel-header">
          <div class="panel-icon"><Users :size="15" /></div>
          <h2 class="panel-titre">Utilisateurs par rôle</h2>
        </div>
        <div v-if="chargement" class="skel-list">
          <div class="skel-row" v-for="i in 5" :key="i"></div>
        </div>
        <div v-else class="role-list">
          <div v-for="r in rolesStats" :key="r.role" class="role-row">
            <span class="chip" :class="r.cls">{{ r.label }}</span>
            <div class="bar-track">
              <div class="bar-fill" :class="r.barCls" :style="{ width: Math.min(100, r.count / maxRole * 100) + '%' }"></div>
            </div>
            <span class="role-count">{{ r.count }}</span>
          </div>
        </div>
      </div>

      <!-- RDV statuts -->
      <div class="panel" style="animation:fadeInUp .5s ease .45s both">
        <div class="panel-header">
          <div class="panel-icon panel-icon-blue"><Calendar :size="15" /></div>
          <h2 class="panel-titre">Statuts Rendez-vous</h2>
        </div>
        <div v-if="chargement" class="skel-list">
          <div class="skel-row" v-for="i in 4" :key="i"></div>
        </div>
        <div v-else class="role-list">
          <div v-for="r in rdvStats" :key="r.statut" class="role-row">
            <span class="chip" :class="r.cls">{{ r.label }}</span>
            <div class="bar-track">
              <div class="bar-fill bar-primary" :style="{ width: Math.min(100, r.count / Math.max(1,maxRdv) * 100) + '%' }"></div>
            </div>
            <span class="role-count">{{ r.count }}</span>
          </div>
        </div>
      </div>

      <!-- Lits -->
      <div class="panel" style="animation:fadeInUp .5s ease .55s both">
        <div class="panel-header">
          <div class="panel-icon panel-icon-amber"><BedDouble :size="15" /></div>
          <h2 class="panel-titre">Lits hospitaliers</h2>
        </div>
        <div class="lits-display">
          <div class="lit-donut-wrap">
            <svg viewBox="0 0 80 80" class="lit-donut">
              <circle cx="40" cy="40" r="30" fill="none" stroke="#F1F5F9" stroke-width="10"/>
              <circle cx="40" cy="40" r="30" fill="none" stroke="url(#grad-donut)" stroke-width="10"
                stroke-dasharray="188.5"
                :stroke-dashoffset="188.5 * (1 - tauxOccupation)"
                stroke-linecap="round" transform="rotate(-90 40 40)"
                style="transition:stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)"
              />
              <defs>
                <linearGradient id="grad-donut" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#4ADE80"/>
                  <stop offset="100%" stop-color="#059669"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="donut-center">
              <div class="donut-pct">{{ Math.round(tauxOccupation*100) }}%</div>
              <div class="donut-lbl">occupés</div>
            </div>
          </div>
          <div class="lit-stats">
            <div class="lit-row lit-libre">
              <div class="lit-dot" style="background:#22C55E"></div>
              <div>
                <div class="lit-val">{{ donneesStats.litsLibres||0 }}</div>
                <div class="lit-nom">Libres</div>
              </div>
            </div>
            <div class="lit-row lit-occupe">
              <div class="lit-dot" style="background:#DC2626"></div>
              <div>
                <div class="lit-val">{{ (donneesStats.litsTotaux||0)-(donneesStats.litsLibres||0) }}</div>
                <div class="lit-nom">Occupés</div>
              </div>
            </div>
            <div class="lit-row">
              <div class="lit-dot" style="background:#94A3B8"></div>
              <div>
                <div class="lit-val">{{ donneesStats.litsTotaux||0 }}</div>
                <div class="lit-nom">Total</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ShieldCheck, Users, Calendar, Stethoscope, BedDouble, FileText,
  BarChart3, Newspaper, ChevronRight, Zap, Receipt, ArrowRight,
  Settings, TrendingUp,
} from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'

const AnimCounter = defineComponent({
  props: { target: { type: Number, default: 0 } },
  setup(props) {
    const current = ref(0)
    onMounted(() => {
      const end = props.target
      if (!end) return
      const start = performance.now()
      const duration = 1400
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

const api = useApi()
const chargement   = ref(true)
const donneesStats = ref({})
const avancees     = ref({ usersParRole: [], rdvParStatut: [] })

const dateAujourdhui = new Date().toLocaleDateString('fr-SN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const tauxOccupation = computed(() => {
  const t = donneesStats.value.litsTotaux || 1
  const l = donneesStats.value.litsLibres || 0
  return (t - l) / t
})

const stats = computed(() => [
  { label: 'Utilisateurs',          val: donneesStats.value.totalUtilisateurs||0,  icone: Users,      bg: 'rgba(74,222,128,.12)', color: '#16A34A' },
  { label: 'Médecins',              val: donneesStats.value.totalMedecins||0,      icone: Stethoscope,bg: 'rgba(14,165,233,.10)', color: '#0284C7' },
  { label: 'Patients',              val: donneesStats.value.totalPatients||0,      icone: Users,      bg: 'rgba(16,185,129,.10)', color: '#059669' },
  { label: 'Consultations (mois)',  val: donneesStats.value.consultationsMois||0,  icone: FileText,   bg: 'rgba(245,158,11,.10)', color: '#D97706' },
  { label: 'Lits libres / total',   val: donneesStats.value.litsLibres||0, unit: `/${donneesStats.value.litsTotaux||0}`, icone: BedDouble, bg: 'rgba(139,92,246,.10)', color: '#7C3AED' },
  { label: 'Revenu (FCFA)',         val: donneesStats.value.revenuMois||0,         icone: Receipt,    bg: 'rgba(239,68,68,.08)',  color: '#DC2626' },
])

const ROLES_LBL = { PATIENT: 'Patient', MEDECIN: 'Médecin', RECEPTIONNISTE: 'Réceptionniste', PHARMACIEN: 'Pharmacien', ADMIN: 'Admin' }
const ROLES_CLS = { PATIENT: 'chip-green', MEDECIN: 'chip-blue', RECEPTIONNISTE: 'chip-teal', PHARMACIEN: 'chip-emerald', ADMIN: 'chip-red' }
const ROLES_BAR = { PATIENT: 'bar-green', MEDECIN: 'bar-blue', RECEPTIONNISTE: 'bar-teal', PHARMACIEN: 'bar-emerald', ADMIN: 'bar-red' }

const rolesStats = computed(() => avancees.value.usersParRole.map(r => ({
  role: r.role, label: ROLES_LBL[r.role] || r.role,
  cls: ROLES_CLS[r.role] || 'chip-gray', barCls: ROLES_BAR[r.role] || 'bar-gray',
  count: r._count._all,
})).sort((a, b) => b.count - a.count))

const maxRole = computed(() => Math.max(1, ...rolesStats.value.map(r => r.count)))

const RDV_LBL = { EN_ATTENTE: 'En attente', CONFIRME: 'Confirmé', ANNULE: 'Annulé', TERMINE: 'Terminé' }
const RDV_CLS = { EN_ATTENTE: 'chip-amber', CONFIRME: 'chip-green', ANNULE: 'chip-red', TERMINE: 'chip-gray' }

const rdvStats = computed(() => (avancees.value.rdvParStatut || []).map(r => ({
  statut: r.statut, label: RDV_LBL[r.statut] || r.statut,
  cls: RDV_CLS[r.statut] || 'chip-gray', count: r._count._all,
})))
const maxRdv = computed(() => Math.max(1, ...rdvStats.value.map(r => r.count)))

onMounted(async () => {
  try {
    const [s, av] = await Promise.all([api.get('/admin/statistiques'), api.get('/admin/statistiques/avancees')])
    donneesStats.value = s
    avancees.value     = av
  } finally { chargement.value = false }
})
</script>

<style scoped>
@keyframes slideInLeft  { from { opacity:0; transform:translateX(-32px) } to { opacity:1; transform:none } }
@keyframes slideInRight { from { opacity:0; transform:translateX(32px) }  to { opacity:1; transform:none } }
@keyframes fadeInUp     { from { opacity:0; transform:translateY(24px) }  to { opacity:1; transform:none } }
@keyframes stat-enter   { from { opacity:0; transform:translateY(16px) scale(.96) } to { opacity:1; transform:none } }
@keyframes gradShift    { 0%,100% { background-position:0% 50% } 50% { background-position:100% 50% } }
@keyframes particle     { 0% { transform:translateY(0) scale(1); opacity:.5 } 100% { transform:translateY(-70px) scale(0); opacity:0 } }
@keyframes pulse-ring   { 0% { transform:scale(1); opacity:.4 } 100% { transform:scale(2.2); opacity:0 } }
@keyframes shimmer      { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
@keyframes shine        { 0% { left:-100% } 60%,100% { left:150% } }

.tbd-wrap { display:flex; flex-direction:column; gap:1.5rem; }

/* Hero */
.hero-banner {
  position:relative; border-radius:1.5rem; overflow:hidden;
  padding:2rem 2.5rem; color:white;
  box-shadow:0 12px 48px rgba(34,197,94,.28);
}
.hero-bg {
  position:absolute; inset:0;
  background:linear-gradient(135deg,#4ADE80 0%,#22C55E 30%,#10B981 65%,#059669 100%);
  background-size:300% 300%; animation:gradShift 8s ease infinite;
}
.hero-particles { position:absolute; inset:0; pointer-events:none; }
.particle { position:absolute; width:5px; height:5px; border-radius:50%; background:rgba(255,255,255,.3); animation:particle 3s ease-in infinite; }
.p1 { left:8%;  bottom:0; animation-delay:0s }
.p2 { left:18%; bottom:0; animation-delay:.5s }
.p3 { left:32%; bottom:0; animation-delay:1s }
.p4 { left:48%; bottom:0; animation-delay:.25s }
.p5 { left:60%; bottom:0; animation-delay:.75s }
.p6 { left:72%; bottom:0; animation-delay:1.3s }
.p7 { left:83%; bottom:0; animation-delay:.1s }
.p8 { left:92%; bottom:0; animation-delay:.6s }
.p9 { left:25%; bottom:0; animation-delay:.9s }
.p10{ left:55%; bottom:0; animation-delay:1.5s }

.hero-content { position:relative; display:flex; align-items:center; justify-content:space-between; gap:1.5rem; flex-wrap:wrap; }
.hero-left { display:flex; flex-direction:column; gap:.5rem; }
.hero-tag {
  display:inline-flex; align-items:center; gap:.375rem;
  background:rgba(255,255,255,.22); backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,.4); border-radius:9999px;
  padding:.3rem .875rem; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; width:fit-content;
}
.hero-title { font-family:var(--font-display); font-size:1.75rem; font-weight:800; letter-spacing:-.02em; }
.hero-date  { font-size:.82rem; opacity:.82; text-transform:capitalize; }

.hero-kpis { display:flex; align-items:center; gap:1.5rem; background:rgba(255,255,255,.15); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,.3); border-radius:1.25rem; padding:1rem 1.5rem; }
.hero-kpi  { text-align:center; }
.hero-kpi-val { font-family:var(--font-display); font-size:1.75rem; font-weight:800; line-height:1; }
.hero-kpi-lbl { font-size:.72rem; opacity:.8; margin-top:.2rem; }
.hero-kpi-sep { width:1px; height:40px; background:rgba(255,255,255,.3); }

/* Stats */
.stats-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:.875rem; }
@media(max-width:1280px) { .stats-grid { grid-template-columns:repeat(3,1fr) } }
@media(max-width:640px)  { .stats-grid { grid-template-columns:1fr 1fr } }

.stat-card {
  background:#fff; border:1px solid #E2E8F0; border-radius:1.125rem;
  padding:1.1rem 1rem; display:flex; align-items:center; gap:.875rem;
  position:relative; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.04);
  animation:stat-enter .5s ease both; transition:transform .25s, box-shadow .25s;
}
.stat-card:hover { transform:translateY(-4px) scale(1.01); box-shadow:0 12px 32px rgba(0,0,0,.08); }
.stat-card:hover .stat-glow { opacity:1; }
.stat-card:hover .stat-icon-box { transform:rotate(-5deg) scale(1.1); }
.stat-card:hover .stat-pulse { animation:pulse-ring .8s ease-out; }

.stat-glow { position:absolute; inset:0; background:radial-gradient(circle at 20% 50%, var(--accent-bg), transparent 70%); opacity:0; transition:opacity .3s; }
.stat-deco { position:absolute; top:-20px; right:-20px; width:72px; height:72px; border-radius:50%; background:var(--accent-bg); opacity:.6; }
.stat-bar  { position:absolute; bottom:0; left:0; right:0; height:3px; background:linear-gradient(90deg,var(--accent),transparent); }

.stat-icon-box {
  position:relative; width:44px; height:44px; border-radius:.875rem; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  background:var(--accent-bg); color:var(--accent); transition:transform .25s; z-index:1;
}
.stat-pulse { position:absolute; inset:-4px; border-radius:inherit; border:2px solid var(--accent); opacity:0; }

.stat-body { position:relative; z-index:1; }
.stat-val  { font-family:var(--font-display); font-size:1.3rem; font-weight:800; color:var(--accent); line-height:1; display:flex; align-items:baseline; gap:.2rem; }
.stat-unit { font-size:.8rem; font-weight:600; opacity:.7; }
.stat-lbl  { font-size:.67rem; color:var(--color-text-muted); margin-top:.2rem; }

/* Section row */
.section-row { display:flex; align-items:center; }
.section-pill { display:inline-flex; align-items:center; gap:.375rem; background:linear-gradient(135deg,#4ADE80,#059669); color:white; border-radius:9999px; padding:.35rem 1rem; font-size:.78rem; font-weight:700; }

/* QA Grid */
.qa-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
@media(max-width:1024px) { .qa-grid { grid-template-columns:repeat(2,1fr) } }
@media(max-width:600px)  { .qa-grid { grid-template-columns:1fr } }

.qa-card {
  position:relative; display:flex; align-items:center; gap:.875rem;
  padding:1.125rem 1.25rem; border-radius:1.25rem;
  text-decoration:none; overflow:hidden;
  transition:transform .28s cubic-bezier(.4,0,.2,1), box-shadow .28s;
  animation:fadeInUp .5s ease both;
}
.qa-card:hover { transform:translateY(-5px); }
.qa-card:hover .qa-shine { animation:shine .8s ease forwards; }
.qa-card:hover .qa-arr  { transform:translateX(4px); opacity:1; }
.qa-card:hover .qa-icon-wrap { transform:scale(1.12) rotate(-5deg); }
.qa-card:hover .qa-shape { transform:scale(1.3) rotate(10deg); }

.qa-shape { position:absolute; right:-15px; top:-15px; width:80px; height:80px; border-radius:50%; background:rgba(255,255,255,.1); transition:transform .3s; }
.qa-shine { position:absolute; top:0; bottom:0; width:50px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent); left:-100%; pointer-events:none; }
.qa-icon-wrap { width:48px; height:48px; border-radius:.875rem; flex-shrink:0; background:rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center; color:white; border:1px solid rgba(255,255,255,.3); transition:transform .25s; }
.qa-content { flex:1; color:white; }
.qa-title { font-family:var(--font-display); font-size:.9rem; font-weight:700; }
.qa-sub   { font-size:.73rem; opacity:.8; margin-top:.15rem; }
.qa-sub-big { font-size:.85rem; font-weight:700; margin-top:.15rem; }
.qa-arr   { color:rgba(255,255,255,.65); flex-shrink:0; transition:transform .25s, opacity .25s; opacity:.7; }

.qa-green  { background:linear-gradient(135deg,#22C55E,#059669); box-shadow:0 6px 24px rgba(34,197,94,.32); }
.qa-blue   { background:linear-gradient(135deg,#38BDF8,#0284C7); box-shadow:0 6px 24px rgba(14,165,233,.32); }
.qa-amber  { background:linear-gradient(135deg,#FCD34D,#D97706); box-shadow:0 6px 24px rgba(245,158,11,.32); }
.qa-purple { background:linear-gradient(135deg,#A78BFA,#7C3AED); box-shadow:0 6px 24px rgba(139,92,246,.32); }
.qa-teal   { background:linear-gradient(135deg,#2DD4BF,#0F766E); box-shadow:0 6px 24px rgba(20,184,166,.32); }
.qa-dark   { background:linear-gradient(135deg,#334155,#0F172A); box-shadow:0 6px 24px rgba(15,23,42,.32); }

.qa-green:hover  { box-shadow:0 14px 40px rgba(34,197,94,.5); }
.qa-blue:hover   { box-shadow:0 14px 40px rgba(14,165,233,.5); }
.qa-amber:hover  { box-shadow:0 14px 40px rgba(245,158,11,.5); }
.qa-purple:hover { box-shadow:0 14px 40px rgba(139,92,246,.5); }
.qa-teal:hover   { box-shadow:0 14px 40px rgba(20,184,166,.5); }

.qa-info { cursor:default !important; }

/* 3 cols */
.trois-cols { display:grid; grid-template-columns:1fr 1fr 1fr; gap:1.25rem; }
@media(max-width:900px) { .trois-cols { grid-template-columns:1fr } }

.panel { background:#fff; border:1px solid #E2E8F0; border-radius:1.25rem; padding:1.375rem; box-shadow:0 2px 12px rgba(0,0,0,.04); transition:box-shadow .25s; }
.panel:hover { box-shadow:0 8px 32px rgba(0,0,0,.08); }
.panel-header { display:flex; align-items:center; gap:.625rem; margin-bottom:1.125rem; }
.panel-icon { width:32px; height:32px; border-radius:.75rem; background:linear-gradient(135deg,#4ADE80,#059669); display:flex; align-items:center; justify-content:center; color:white; flex-shrink:0; }
.panel-icon-blue  { background:linear-gradient(135deg,#38BDF8,#0284C7); }
.panel-icon-amber { background:linear-gradient(135deg,#FCD34D,#D97706); }
.panel-titre { font-family:var(--font-display); font-size:.92rem; font-weight:700; color:var(--color-text); }

/* Role list */
.role-list { display:flex; flex-direction:column; gap:.625rem; }
.role-row  { display:flex; align-items:center; gap:.625rem; }
.bar-track { flex:1; height:6px; background:#F1F5F9; border-radius:9999px; overflow:hidden; }
.bar-fill  { height:100%; border-radius:9999px; transition:width .6s cubic-bezier(.4,0,.2,1); }
.bar-primary  { background:linear-gradient(90deg,#4ADE80,#059669); }
.bar-green    { background:linear-gradient(90deg,#4ADE80,#16A34A); }
.bar-blue     { background:linear-gradient(90deg,#38BDF8,#0284C7); }
.bar-teal     { background:linear-gradient(90deg,#2DD4BF,#0F766E); }
.bar-emerald  { background:linear-gradient(90deg,#34D399,#059669); }
.bar-red      { background:linear-gradient(90deg,#F87171,#DC2626); }
.bar-gray     { background:#CBD5E1; }
.role-count { font-weight:700; font-size:.85rem; color:var(--color-text); min-width:24px; text-align:right; }

/* Chips */
.chip { font-size:.62rem; font-weight:700; padding:2px 8px; border-radius:9999px; text-transform:uppercase; letter-spacing:.04em; flex-shrink:0; min-width:72px; text-align:center; }
.chip-green   { background:rgba(74,222,128,.12); color:#16A34A; border:1px solid rgba(74,222,128,.3); }
.chip-blue    { background:rgba(56,189,248,.12);  color:#0284C7; border:1px solid rgba(56,189,248,.3); }
.chip-teal    { background:rgba(45,212,191,.12);  color:#0F766E; border:1px solid rgba(45,212,191,.3); }
.chip-emerald { background:rgba(52,211,153,.12);  color:#059669; border:1px solid rgba(52,211,153,.3); }
.chip-red     { background:rgba(248,113,113,.12); color:#DC2626; border:1px solid rgba(248,113,113,.3); }
.chip-amber   { background:rgba(252,211,77,.15);  color:#D97706; border:1px solid rgba(252,211,77,.3); }
.chip-gray    { background:rgba(148,163,184,.12); color:#64748B; border:1px solid rgba(148,163,184,.3); }

/* Lits donut */
.lits-display { display:flex; align-items:center; gap:1.5rem; }
.lit-donut-wrap { position:relative; width:100px; height:100px; flex-shrink:0; }
.lit-donut { width:100%; height:100%; }
.donut-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.donut-pct { font-family:var(--font-display); font-size:1.1rem; font-weight:800; color:#16A34A; }
.donut-lbl { font-size:.6rem; color:var(--color-text-muted); font-weight:600; }
.lit-stats { display:flex; flex-direction:column; gap:.625rem; flex:1; }
.lit-row   { display:flex; align-items:center; gap:.625rem; }
.lit-dot   { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
.lit-val   { font-family:var(--font-display); font-size:1rem; font-weight:800; color:var(--color-text); line-height:1; }
.lit-nom   { font-size:.7rem; color:var(--color-text-muted); }

/* Skeleton */
.skel-list { display:flex; flex-direction:column; gap:.5rem; }
.skel-row  { height:28px; background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%); background-size:200% 100%; border-radius:.5rem; animation:shimmer 1.5s infinite; }
.skel-val  { display:inline-block; width:40px; height:22px; background:#E2E8F0; border-radius:4px; animation:shimmer 1.5s infinite; }
</style>
