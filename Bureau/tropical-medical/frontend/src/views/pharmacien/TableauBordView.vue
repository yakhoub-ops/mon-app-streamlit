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
          <div class="hero-tag"><FlaskConical :size="13" /> Pharmacie</div>
          <h1 class="hero-title">Pharmacie — Tropical Medical</h1>
          <p class="hero-date">{{ dateAujourdhui }}</p>
        </div>
        <div style="animation:slideInRight .6s ease both; flex-shrink:0">
          <div class="flask-wrap">
            <div class="flask-ring"></div>
            <FlaskConical :size="52" class="flask-icon" />
            <div class="flask-bubble b1"></div>
            <div class="flask-bubble b2"></div>
            <div class="flask-bubble b3"></div>
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
      <RouterLink to="/pharmacien/ordonnances" class="qa-card qa-green" style="animation-delay:.08s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><FileText :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Ordonnances</div>
          <div class="qa-sub">{{ donneesStats.ordoEnAttente || 0 }} active(s)</div>
        </div>
        <div class="qa-badge" v-if="donneesStats.ordoEnAttente > 0">{{ donneesStats.ordoEnAttente }}</div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/pharmacien/stock" class="qa-card qa-blue" style="animation-delay:.14s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><Package :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Gestion du stock</div>
          <div class="qa-sub">{{ donneesStats.totalMeds || 0 }} médicament(s)</div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <RouterLink to="/pharmacien/livraisons" class="qa-card qa-purple" style="animation-delay:.2s">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><Truck :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Livraisons</div>
          <div class="qa-sub">Suivi des commandes</div>
        </div>
        <ArrowRight :size="16" class="qa-arr" />
        <div class="qa-shine"></div>
      </RouterLink>

      <div class="qa-card qa-red qa-alert" style="animation-delay:.26s; cursor:default">
        <div class="qa-shape"></div>
        <div class="qa-icon-wrap"><AlertTriangle :size="26" /></div>
        <div class="qa-content">
          <div class="qa-title">Ruptures de stock</div>
          <div class="qa-sub">{{ donneesStats.ruptures || 0 }} médicament(s)</div>
        </div>
        <div class="qa-badge-danger" v-if="donneesStats.ruptures > 0">{{ donneesStats.ruptures }}</div>
      </div>
    </div>

    <!-- DEUX COLONNES -->
    <div class="deux-cols">
      <!-- Ordonnances -->
      <div class="panel" style="animation:fadeInUp .5s ease .4s both">
        <div class="panel-header">
          <div class="panel-icon"><FileText :size="15" /></div>
          <h2 class="panel-titre">Ordonnances actives</h2>
          <RouterLink to="/pharmacien/ordonnances" class="voir-tout">Voir tout <ChevronRight :size="13" /></RouterLink>
        </div>
        <div v-if="chargement" class="skel-list">
          <div class="skel-row" v-for="i in 4" :key="i"></div>
        </div>
        <div v-else-if="ordonnances.length" class="item-list">
          <div v-for="(o, idx) in ordonnances.slice(0,4)" :key="o.id" class="item-row" :style="{ animationDelay: (idx * 0.07) + 's' }">
            <div class="item-avatar pill-icon"><Pill :size="14" /></div>
            <div class="item-info">
              <div class="item-nom">{{ o.dossier.patient.utilisateur.prenom }} {{ o.dossier.patient.utilisateur.nom }}</div>
              <div class="item-sub">{{ o.lignes.length }} médicament(s) · Dr. {{ o.medecinNom }}</div>
            </div>
            <RouterLink to="/pharmacien/ordonnances" class="btn-deliver"><Package :size="13" /></RouterLink>
          </div>
        </div>
        <div v-else class="vide-mini"><CheckCircle :size="24" style="color:#22C55E" /><span>Aucune ordonnance</span></div>
      </div>

      <!-- Alertes stock -->
      <div class="panel" style="animation:fadeInUp .5s ease .5s both">
        <div class="panel-header">
          <div class="panel-icon panel-icon-amber"><AlertTriangle :size="15" /></div>
          <h2 class="panel-titre">Alertes de stock</h2>
          <RouterLink to="/pharmacien/stock" class="voir-tout">Stock <ChevronRight :size="13" /></RouterLink>
        </div>
        <div v-if="chargement" class="skel-list">
          <div class="skel-row" v-for="i in 4" :key="i"></div>
        </div>
        <div v-else-if="alertes.length" class="item-list">
          <div v-for="(m, idx) in alertes.slice(0,5)" :key="m.id" class="item-row alerte-row" :style="{ animationDelay: (idx * 0.07) + 's' }">
            <div class="item-avatar" :class="m.stockActuel===0 ? 'avatar-red' : 'avatar-amber'">
              <FlaskConical :size="13" />
            </div>
            <div class="item-info">
              <div class="item-nom">{{ m.nom }} <span v-if="m.dosage" style="font-weight:400;color:#94A3B8;font-size:.72rem">{{ m.dosage }}</span></div>
              <div class="item-sub">Stock : <strong>{{ m.stockActuel }}</strong> / min {{ m.stockMinimum }}</div>
            </div>
            <span class="chip" :class="m.stockActuel===0?'chip-red':'chip-amber'">
              {{ m.stockActuel===0 ? 'Rupture' : 'Bas' }}
            </span>
          </div>
        </div>
        <div v-else class="vide-mini"><CheckCircle :size="24" style="color:#22C55E" /><span>Stocks suffisants</span></div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import { RouterLink } from 'vue-router'
import { FlaskConical, FileText, Pill, Package, CheckCircle, AlertTriangle, ChevronRight, Zap, ArrowRight, Truck } from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'

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

const api = useApi()
const chargement   = ref(true)
const donneesStats = ref({ ordoEnAttente: 0, ruptures: 0, lotsExpirant: 0, totalMeds: 0 })
const ordonnances  = ref([])
const alertes      = ref([])

const dateAujourdhui = new Date().toLocaleDateString('fr-SN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const stats = computed(() => [
  { label: 'Ordonnances actives', val: donneesStats.value.ordoEnAttente, icone: FileText,      bg: 'rgba(74,222,128,.12)', color: '#16A34A' },
  { label: 'Ruptures de stock',   val: donneesStats.value.ruptures,      icone: AlertTriangle, bg: 'rgba(239,68,68,.08)',  color: '#DC2626' },
  { label: 'Lots expirant (30j)', val: donneesStats.value.lotsExpirant,  icone: FlaskConical,  bg: 'rgba(245,158,11,.10)', color: '#D97706' },
  { label: 'Médicaments actifs',  val: donneesStats.value.totalMeds,     icone: Package,       bg: 'rgba(14,165,233,.10)', color: '#0284C7' },
])

onMounted(async () => {
  try {
    const [s, ordos, al] = await Promise.all([
      api.get('/pharmacien/statistiques'),
      api.get('/pharmacien/ordonnances?statut=ACTIVE'),
      api.get('/pharmacien/alertes-stock'),
    ])
    donneesStats.value = s; ordonnances.value = ordos; alertes.value = al
  } finally { chargement.value = false }
})
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
@keyframes bubbleRise   { 0% { transform:translateY(0) scale(1); opacity:.5 } 100% { transform:translateY(-30px) scale(0); opacity:0 } }
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
.hero-content { position:relative; display:flex; align-items:center; justify-content:space-between; gap:1.5rem; }
.hero-left { display:flex; flex-direction:column; gap:.5rem; }
.hero-tag { display:inline-flex; align-items:center; gap:.375rem; background:rgba(255,255,255,.22); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,.4); border-radius:9999px; padding:.3rem .875rem; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; width:fit-content; }
.hero-title { font-family:var(--font-display); font-size:1.5rem; font-weight:800; letter-spacing:-.02em; }
.hero-date  { font-size:.82rem; opacity:.82; text-transform:capitalize; }

/* Flask animation */
.flask-wrap { position:relative; width:80px; height:80px; }
.flask-ring { position:absolute; inset:0; border-radius:50%; border:2px dashed rgba(255,255,255,.3); animation:spin 10s linear infinite; }
.flask-icon { position:absolute; inset:0; margin:auto; width:52px; height:52px; opacity:.4; }
.flask-bubble { position:absolute; width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,.5); animation:bubbleRise 2s ease-in infinite; }
.b1 { left:38%; bottom:10px; animation-delay:0s; }
.b2 { left:52%; bottom:10px; animation-delay:.7s; width:4px; height:4px; }
.b3 { left:44%; bottom:10px; animation-delay:1.3s; width:8px; height:8px; }
@keyframes spin { to { transform:rotate(360deg) } }

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
.qa-title { font-family:var(--font-display); font-size:.88rem; font-weight:700; }
.qa-sub   { font-size:.73rem; opacity:.8; margin-top:.15rem; }
.qa-arr   { color:rgba(255,255,255,.65); flex-shrink:0; transition:transform .25s; }
.qa-badge { background:rgba(255,255,255,.3); color:white; border-radius:9999px; font-size:.7rem; font-weight:700; padding:1px 8px; border:1px solid rgba(255,255,255,.4); }
.qa-badge-danger { background:rgba(255,255,255,.25); color:white; border-radius:9999px; font-size:.75rem; font-weight:700; padding:2px 9px; border:1px solid rgba(255,255,255,.3); animation:pulse 2s ease infinite; }
@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.6 } }
.qa-alert { cursor:default !important; }

.qa-green  { background:linear-gradient(135deg,#22C55E,#059669); box-shadow:0 6px 24px rgba(34,197,94,.32); }
.qa-blue   { background:linear-gradient(135deg,#38BDF8,#0284C7); box-shadow:0 6px 24px rgba(14,165,233,.32); }
.qa-purple { background:linear-gradient(135deg,#A78BFA,#7C3AED); box-shadow:0 6px 24px rgba(139,92,246,.32); }
.qa-red    { background:linear-gradient(135deg,#F87171,#DC2626); box-shadow:0 6px 24px rgba(220,38,38,.32); }
.qa-green:hover  { box-shadow:0 14px 40px rgba(34,197,94,.5); }
.qa-blue:hover   { box-shadow:0 14px 40px rgba(14,165,233,.5); }
.qa-purple:hover { box-shadow:0 14px 40px rgba(139,92,246,.5); }

/* Panels */
.deux-cols { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; }
@media(max-width:768px) { .deux-cols { grid-template-columns:1fr } }
.panel { background:#fff; border:1px solid #E2E8F0; border-radius:1.25rem; padding:1.375rem; box-shadow:0 2px 12px rgba(0,0,0,.04); transition:box-shadow .25s; }
.panel:hover { box-shadow:0 8px 32px rgba(0,0,0,.08); }
.panel-header { display:flex; align-items:center; gap:.625rem; margin-bottom:1.125rem; }
.panel-icon { width:32px; height:32px; border-radius:.75rem; background:linear-gradient(135deg,#4ADE80,#059669); display:flex; align-items:center; justify-content:center; color:white; flex-shrink:0; }
.panel-icon-amber { background:linear-gradient(135deg,#FCD34D,#D97706); }
.panel-titre { font-family:var(--font-display); font-size:.92rem; font-weight:700; color:var(--color-text); flex:1; }
.voir-tout { display:inline-flex; align-items:center; gap:.2rem; font-size:.78rem; color:#16A34A; font-weight:600; text-decoration:none; padding:.25rem .625rem; border-radius:9999px; background:rgba(74,222,128,.08); transition:background .15s; }
.voir-tout:hover { background:rgba(74,222,128,.18); }

.item-list { display:flex; flex-direction:column; gap:.5rem; }
.item-row { display:flex; align-items:center; gap:.625rem; padding:.5rem .625rem; border-radius:.875rem; background:#F8FAFC; border:1px solid transparent; transition:all .18s; animation:item-enter .4s ease both; }
.item-row:hover { background:rgba(74,222,128,.05); border-color:rgba(74,222,128,.2); }
.alerte-row { background:#FFFBEB; }
.alerte-row:hover { background:rgba(252,211,77,.08); border-color:rgba(252,211,77,.3); }
.item-avatar { width:30px; height:30px; border-radius:50%; background:rgba(74,222,128,.12); display:flex; align-items:center; justify-content:center; color:#16A34A; flex-shrink:0; }
.pill-icon  { background:rgba(74,222,128,.12); color:#16A34A; }
.avatar-red   { background:rgba(239,68,68,.1);  color:#DC2626; }
.avatar-amber { background:rgba(245,158,11,.1); color:#D97706; }
.item-info { flex:1; min-width:0; }
.item-nom  { font-size:.84rem; font-weight:600; color:var(--color-text); }
.item-sub  { font-size:.72rem; color:var(--color-text-muted); }
.btn-deliver { width:28px; height:28px; border-radius:.5rem; background:linear-gradient(135deg,#4ADE80,#059669); display:flex; align-items:center; justify-content:center; color:white; text-decoration:none; transition:transform .15s; flex-shrink:0; }
.btn-deliver:hover { transform:scale(1.12); }

.chip { font-size:.62rem; font-weight:700; padding:2px 7px; border-radius:9999px; text-transform:uppercase; letter-spacing:.04em; flex-shrink:0; }
.chip-green  { background:rgba(74,222,128,.12); color:#16A34A; border:1px solid rgba(74,222,128,.3); }
.chip-amber  { background:rgba(252,211,77,.15);  color:#D97706; border:1px solid rgba(252,211,77,.3); }
.chip-red    { background:rgba(248,113,113,.12); color:#DC2626; border:1px solid rgba(248,113,113,.3); }

.vide-mini { display:flex; align-items:center; gap:.625rem; padding:1.5rem; color:var(--color-text-muted); font-size:.85rem; justify-content:center; }
.skel-list { display:flex; flex-direction:column; gap:.5rem; }
.skel-row  { height:52px; background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%); background-size:200% 100%; border-radius:.875rem; animation:shimmer 1.5s infinite; }
.skel-val  { display:inline-block; width:36px; height:22px; background:#E2E8F0; border-radius:4px; animation:shimmer 1.5s infinite; }
</style>
