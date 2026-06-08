<template>
  <div>
    <div style="margin-bottom:1.25rem">
      <h1 class="page-titre">Tableau de bord statistique</h1>
      <p style="color:var(--color-text-muted);font-size:.875rem">Vue d'ensemble de l'activité de la plateforme</p>
    </div>

    <div v-if="chargement" style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
      <div class="skeleton-block card" v-for="i in 4" :key="i" style="height:280px"></div>
    </div>

    <div v-else style="display:flex;flex-direction:column;gap:1.25rem">

      <!-- Ligne 1 : consultations par mois + revenus par mois -->
      <div class="deux-cols">
        <div class="card chart-card">
          <h2 class="chart-titre"><Activity :size="16" /> Consultations par mois</h2>
          <div v-if="!moisLabels.length" class="vide-mini">Aucune donnée disponible</div>
          <div v-else class="barres-wrap">
            <div v-for="(lbl, i) in moisLabels" :key="lbl" class="barre-col">
              <span class="barre-val">{{ consultationsParMois[i] }}</span>
              <div class="barre-outer">
                <div class="barre-inner" :style="{ height: pct(consultationsParMois[i], maxConsult) + '%', background:'var(--color-primary)' }"></div>
              </div>
              <span class="barre-lbl">{{ lbl }}</span>
            </div>
          </div>
        </div>

        <div class="card chart-card">
          <h2 class="chart-titre"><TrendingUp :size="16" /> Revenus encaissés (FCFA)</h2>
          <div v-if="!moisLabels.length" class="vide-mini">Aucune donnée disponible</div>
          <div v-else class="barres-wrap">
            <div v-for="(lbl, i) in moisLabels" :key="lbl" class="barre-col">
              <span class="barre-val" style="font-size:.6rem">{{ fmtK(revenusParMois[i]) }}</span>
              <div class="barre-outer">
                <div class="barre-inner" :style="{ height: pct(revenusParMois[i], maxRevenu) + '%', background:'var(--color-gold)' }"></div>
              </div>
              <span class="barre-lbl">{{ lbl }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Ligne 2 : répartition rôles + statuts RDV -->
      <div class="deux-cols">
        <!-- Rôles : donut CSS custom -->
        <div class="card chart-card">
          <h2 class="chart-titre"><Users :size="16" /> Répartition des utilisateurs</h2>
          <div style="display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap">
            <div style="position:relative;width:120px;height:120px;flex-shrink:0">
              <svg viewBox="0 0 36 36" style="width:100%;height:100%;transform:rotate(-90deg)">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#F1F5F9" stroke-width="3.5" />
                <circle v-for="seg in segmentsRoles" :key="seg.role"
                  cx="18" cy="18" r="15.5" fill="none"
                  :stroke="seg.couleur" stroke-width="3.5"
                  :stroke-dasharray="`${seg.dash} ${97.39 - seg.dash}`"
                  :stroke-dashoffset="-seg.offset"
                />
              </svg>
              <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:1.3rem;font-weight:800;color:var(--color-text)">{{ totalUsers }}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:.5rem;flex:1">
              <div v-for="seg in segmentsRoles" :key="seg.role" class="legende-ligne">
                <div class="legende-pt" :style="{ background: seg.couleur }"></div>
                <span style="flex:1;font-size:.8rem">{{ seg.label }}</span>
                <span style="font-weight:700;font-size:.8rem">{{ seg.count }}</span>
                <span style="font-size:.72rem;color:var(--color-text-muted)">({{ seg.pct }}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Statuts RDV -->
        <div class="card chart-card">
          <h2 class="chart-titre"><Calendar :size="16" /> Statuts des rendez-vous</h2>
          <div style="display:flex;flex-direction:column;gap:.625rem">
            <div v-for="r in rdvRows" :key="r.statut" class="rdv-row">
              <span class="rdv-label">{{ r.label }}</span>
              <div class="rdv-bar-wrap">
                <div class="rdv-bar" :style="{ width: pct(r.count, maxRdv)+'%', background: r.couleur }"></div>
              </div>
              <span class="rdv-count">{{ r.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Ligne 3 : stats globales résumé -->
      <div class="card chart-card">
        <h2 class="chart-titre"><BarChart3 :size="16" /> Résumé de la plateforme</h2>
        <div class="resume-grid">
          <div v-for="s in resumeStats" :key="s.label" class="resume-item">
            <div class="resume-icone" :style="{ background: s.bg, color: s.color }">
              <component :is="s.icone" :size="18" />
            </div>
            <div class="resume-val" :style="{ color: s.color }">{{ s.val }}</div>
            <div class="resume-lbl">{{ s.label }}</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Activity, TrendingUp, Users, Calendar, BarChart3, Stethoscope, BedDouble, FileText, Receipt } from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'

const api = useApi()
const chargement = ref(true)
const stats      = ref({})
const avancees   = ref({ consultations:[], factures:[], rdvParStatut:[], usersParRole:[] })

const MOIS_NOM = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

function groupParMois(items, champ='createdAt') {
  const maintenant = new Date()
  const res = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1)
    res[`${d.getFullYear()}-${d.getMonth()}`] = 0
  }
  items.forEach(it => {
    const d = new Date(it[champ])
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (key in res) res[key]++
  })
  return res
}

function groupRevenusParMois(factures) {
  const maintenant = new Date()
  const res = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1)
    res[`${d.getFullYear()}-${d.getMonth()}`] = 0
  }
  factures.forEach(f => {
    const d = new Date(f.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (key in res) res[key] += f.montantTotal || 0
  })
  return res
}

const moisLabels = computed(() => {
  const now = new Date()
  const labels = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(MOIS_NOM[d.getMonth()])
  }
  return labels
})

const consultationsParMois = computed(() => Object.values(groupParMois(avancees.value.consultations)))
const revenusParMois       = computed(() => Object.values(groupRevenusParMois(avancees.value.factures)))
const maxConsult = computed(() => Math.max(1, ...consultationsParMois.value))
const maxRevenu  = computed(() => Math.max(1, ...revenusParMois.value))

function pct(val, max) { return Math.round((val / max) * 100) }
function fmtK(val)     { return val >= 1000 ? (val/1000).toFixed(0)+'k' : String(val) }

// Donut rôles
const ROLE_COULEURS = { PATIENT:'#0E9F8E', MEDECIN:'#0EA5E9', RECEPTIONNISTE:'#15803D', PHARMACIEN:'#E6B800', ADMIN:'#DC2626' }
const ROLE_LBL = { PATIENT:'Patient', MEDECIN:'Médecin', RECEPTIONNISTE:'Réceptionniste', PHARMACIEN:'Pharmacien', ADMIN:'Admin' }
const PERIM = 97.39

const totalUsers = computed(() => avancees.value.usersParRole.reduce((s,r) => s + r._count._all, 0))

const segmentsRoles = computed(() => {
  const total = totalUsers.value || 1
  let offset = 0
  return avancees.value.usersParRole.map(r => {
    const count = r._count._all
    const dash  = (count / total) * PERIM
    const seg   = { role:r.role, label:ROLE_LBL[r.role]||r.role, count, couleur:ROLE_COULEURS[r.role]||'#94A3B8', dash, offset, pct:Math.round(count/total*100) }
    offset += dash
    return seg
  })
})

// RDV
const RDV_LBL  = { EN_ATTENTE:'En attente', CONFIRME:'Confirmé', ANNULE:'Annulé', TERMINE:'Terminé' }
const RDV_COL  = { EN_ATTENTE:'#F59E0B',    CONFIRME:'#15803D',  ANNULE:'#DC2626', TERMINE:'#64748B' }

const rdvRows  = computed(() => (avancees.value.rdvParStatut||[]).map(r => ({
  statut: r.statut, label: RDV_LBL[r.statut]||r.statut,
  count: r._count._all, couleur: RDV_COL[r.statut]||'#94A3B8',
})))
const maxRdv = computed(() => Math.max(1, ...rdvRows.value.map(r => r.count)))

// Résumé
const resumeStats = computed(() => [
  { label:'Médecins',          val: stats.value.totalMedecins||0,      icone:Stethoscope, bg:'rgba(14,165,233,0.1)', color:'var(--color-info)' },
  { label:'Patients',          val: stats.value.totalPatients||0,      icone:Users,       bg:'rgba(14,159,142,0.1)', color:'var(--color-primary)' },
  { label:'Lits libres',       val: `${stats.value.litsLibres||0}/${stats.value.litsTotaux||0}`, icone:BedDouble, bg:'rgba(245,158,11,0.1)', color:'var(--color-warning)' },
  { label:'Ordo. actives',     val: stats.value.ordoActives||0,        icone:FileText,    bg:'rgba(21,128,61,0.08)', color:'var(--color-green)' },
  { label:'Consultations/mois',val: stats.value.consultationsMois||0,  icone:Activity,    bg:'rgba(230,184,0,0.1)',  color:'var(--color-gold)' },
  { label:'Revenu (FCFA)',     val: (stats.value.revenuMois||0).toLocaleString('fr-SN'), icone:Receipt, bg:'rgba(220,38,38,0.08)', color:'var(--color-danger)' },
])

onMounted(async () => {
  chargement.value = true
  try {
    const [s, av] = await Promise.all([api.get('/admin/statistiques'), api.get('/admin/statistiques/avancees')])
    stats.value = s; avancees.value = av
  } finally { chargement.value = false }
})
</script>

<style scoped>
.page-titre    { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
.deux-cols     { display:grid;grid-template-columns:1fr 1fr;gap:1.25rem }
@media(max-width:900px){ .deux-cols { grid-template-columns:1fr } }
.chart-card    { padding:1.5rem }
.chart-titre   { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:.95rem;font-weight:700;color:var(--color-text);margin-bottom:1.25rem }
.barres-wrap   { display:flex;align-items:flex-end;gap:.5rem;height:140px }
.barre-col     { display:flex;flex-direction:column;align-items:center;flex:1;gap:.25rem }
.barre-val     { font-size:.65rem;font-weight:700;color:var(--color-text-muted);min-height:14px }
.barre-outer   { width:100%;flex:1;background:#F1F5F9;border-radius:6px 6px 0 0;display:flex;align-items:flex-end;overflow:hidden }
.barre-inner   { width:100%;border-radius:6px 6px 0 0;transition:height .5s ease;min-height:2px }
.barre-lbl     { font-size:.65rem;color:var(--color-text-muted) }
.vide-mini     { display:flex;align-items:center;justify-content:center;height:120px;font-size:.85rem;color:var(--color-text-muted) }
.legende-ligne { display:flex;align-items:center;gap:.5rem }
.legende-pt    { width:10px;height:10px;border-radius:50%;flex-shrink:0 }
.rdv-row       { display:flex;align-items:center;gap:.75rem }
.rdv-label     { min-width:90px;font-size:.8rem;font-weight:600;color:var(--color-text) }
.rdv-bar-wrap  { flex:1;height:10px;background:#F1F5F9;border-radius:9999px;overflow:hidden }
.rdv-bar       { height:100%;border-radius:9999px;transition:width .5s }
.rdv-count     { min-width:28px;font-weight:700;font-size:.85rem;text-align:right;color:var(--color-text) }
.resume-grid   { display:grid;grid-template-columns:repeat(6,1fr);gap:.75rem }
@media(max-width:900px){ .resume-grid { grid-template-columns:repeat(3,1fr) } }
@media(max-width:480px){ .resume-grid { grid-template-columns:repeat(2,1fr) } }
.resume-item   { display:flex;flex-direction:column;align-items:center;gap:.5rem;padding:.875rem .5rem;background:#F8FAFC;border-radius:.875rem }
.resume-icone  { width:40px;height:40px;border-radius:.75rem;display:flex;align-items:center;justify-content:center }
.resume-val    { font-family:var(--font-display);font-size:1.3rem;font-weight:800;line-height:1 }
.resume-lbl    { font-size:.68rem;color:var(--color-text-muted);text-align:center }
.skeleton-block{ background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;animation:shimmer 1.5s infinite }
@keyframes shimmer{ 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }
</style>
