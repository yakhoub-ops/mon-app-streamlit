<template>
  <div class="ordo-wrap">

    <!-- ══ EN-TÊTE ═══════════════════════════════════════════════ -->
    <div class="ordo-header" style="animation:fadeInUp .4s ease both">
      <div class="ordo-header-left">
        <div class="ordo-header-icon"><FileText :size="22" /></div>
        <div>
          <h1 class="page-titre">Mes ordonnances</h1>
          <p class="page-sub">{{ ordos.length }} ordonnance(s) au total</p>
        </div>
      </div>
    </div>

    <!-- ══ STATS ══════════════════════════════════════════════════ -->
    <div class="ordo-stats" style="animation:fadeInUp .4s ease .08s both">
      <div class="os-card os-green">
        <div class="os-icon"><FileText :size="18" /></div>
        <div class="os-val">{{ ordos.length }}</div>
        <div class="os-lbl">Total</div>
      </div>
      <div class="os-card os-emerald">
        <div class="os-icon"><CheckCircle :size="18" /></div>
        <div class="os-val">{{ ordos.filter(o => o.statut === 'ACTIVE').length }}</div>
        <div class="os-lbl">Actives</div>
      </div>
      <div class="os-card os-blue">
        <div class="os-icon"><PackageCheck :size="18" /></div>
        <div class="os-val">{{ ordos.filter(o => o.statut === 'DELIVREE').length }}</div>
        <div class="os-lbl">Délivrées</div>
      </div>
      <div class="os-card os-gray">
        <div class="os-icon"><Clock :size="18" /></div>
        <div class="os-val">{{ ordos.filter(o => o.statut === 'EXPIREE').length }}</div>
        <div class="os-lbl">Expirées</div>
      </div>
    </div>

    <!-- ══ FILTRES ═════════════════════════════════════════════════ -->
    <div class="filtres-tabs" style="animation:fadeInUp .4s ease .12s both">
      <button
        v-for="f in filtresDef" :key="f.val"
        class="filtre-btn" :class="[{ active: filtre === f.val }, f.cls]"
        @click="filtre = f.val"
      >
        <component :is="f.icone" :size="14" />
        <span class="fb-label">{{ f.label }}</span>
        <span v-if="f.count > 0" class="filtre-badge">{{ f.count }}</span>
      </button>
    </div>

    <!-- ══ SKELETON ════════════════════════════════════════════════ -->
    <div v-if="chargement" class="skel-list">
      <div class="skel-card" v-for="i in 3" :key="i"></div>
    </div>

    <!-- ══ LISTE ══════════════════════════════════════════════════ -->
    <div v-else-if="ordoFiltrees.length" class="ordo-list">
      <div
        v-for="(o, idx) in ordoFiltrees"
        :key="o.id"
        class="ordo-card"
        :class="{ 'ordo-active': o.statut === 'ACTIVE' }"
        :style="{ animationDelay: (idx * 0.07) + 's' }"
      >
        <!-- Barre colorée gauche -->
        <div class="ordo-strip" :class="stripClass(o.statut)"></div>

        <!-- Contenu principal -->
        <div class="ordo-body">
          <div class="ordo-top-row">
            <!-- Icône + infos -->
            <div class="ordo-icon-wrap" :class="iconBg(o.statut)">
              <Pill :size="20" />
            </div>

            <div class="ordo-meta">
              <div class="ordo-date-row">
                <CalendarDays :size="13" class="ordo-date-icon" />
                <span class="ordo-date">{{ fmt(o.date) }}</span>
                <span v-if="o.expirationDate" class="ordo-expiry">
                  <Clock :size="11" />
                  Expire le {{ fmt(o.expirationDate) }}
                </span>
              </div>
              <div class="ordo-medecin">
                <Stethoscope :size="13" />
                <span>{{ o.medecinNom || 'Médecin non renseigné' }}</span>
              </div>
              <div v-if="o.instructions" class="ordo-instr">
                <Info :size="12" />
                {{ o.instructions }}
              </div>
            </div>

            <!-- Statut + toggle -->
            <div class="ordo-actions">
              <span class="statut-chip" :class="chipClass(o.statut)">
                <component :is="chipIcone(o.statut)" :size="10" />
                {{ lblStatut(o.statut) }}
              </span>
              <button
                class="toggle-btn"
                :class="{ open: ouvert === o.id }"
                @click="ouvert = ouvert === o.id ? null : o.id"
                :title="ouvert === o.id ? 'Masquer' : 'Voir les médicaments'"
              >
                <ChevronDown :size="16" />
              </button>
            </div>
          </div>

          <!-- Résumé médicaments (toujours visible) -->
          <div class="ordo-meds-preview">
            <div
              v-for="l in o.lignes.slice(0, 3)"
              :key="l.id"
              class="med-pill"
            >
              <Pill :size="10" />
              {{ l.medicament?.nom || '—' }}
            </div>
            <div v-if="o.lignes.length > 3" class="med-pill med-pill-more">
              +{{ o.lignes.length - 3 }} autre(s)
            </div>
          </div>
        </div>

        <!-- Détail déroulant -->
        <Transition name="slide-down">
          <div v-if="ouvert === o.id" class="ordo-detail">
            <div class="detail-titre">
              <Package :size="14" />
              Médicaments prescrits ({{ o.lignes.length }})
            </div>
            <div class="meds-grid">
              <div v-for="l in o.lignes" :key="l.id" class="med-card">
                <div class="med-card-top">
                  <div class="med-card-icon"><Pill :size="16" /></div>
                  <div class="med-card-name">
                    {{ l.medicament?.nom || '—' }}
                    <span class="med-forme">{{ l.medicament?.forme }}</span>
                  </div>
                </div>
                <div class="med-card-rows">
                  <div class="med-row">
                    <span class="med-row-lbl">Posologie</span>
                    <span class="med-row-val">{{ l.posologie || '—' }}</span>
                  </div>
                  <div class="med-row" v-if="l.duree">
                    <span class="med-row-lbl">Durée</span>
                    <span class="med-row-val">{{ l.duree }}</span>
                  </div>
                  <div class="med-row" v-if="l.quantite">
                    <span class="med-row-lbl">Quantité</span>
                    <span class="med-row-val">{{ l.quantite }}</span>
                  </div>
                </div>
                <div v-if="l.medicament?.description" class="med-desc">
                  {{ l.medicament.description }}
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- ══ VIDE ════════════════════════════════════════════════════ -->
    <div v-else class="vide-block">
      <div class="vide-icon"><Pill :size="36" /></div>
      <p class="vide-titre">Aucune ordonnance</p>
      <p class="vide-sub">
        {{ filtre === 'tous'
          ? 'Vos ordonnances apparaîtront ici après une consultation.'
          : `Aucune ordonnance dans la catégorie « ${lblStatut(filtre)} »` }}
      </p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Pill, ChevronDown, Info, Package, Clock, FileText, CheckCircle,
  CalendarDays, Stethoscope, PackageCheck, ArrowRight, X,
} from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { fmt } = useDate()

const chargement = ref(true)
const ordos      = ref([])
const filtre     = ref('tous')
const ouvert     = ref(null)

const filtresDef = computed(() => [
  { val: 'tous',     label: 'Toutes',    icone: FileText,      count: 0,                                                        cls: 'fb-green'  },
  { val: 'ACTIVE',   label: 'Actives',   icone: CheckCircle,   count: ordos.value.filter(o => o.statut === 'ACTIVE').length,    cls: 'fb-emerald'},
  { val: 'DELIVREE', label: 'Délivrées', icone: PackageCheck,  count: ordos.value.filter(o => o.statut === 'DELIVREE').length,  cls: 'fb-blue'   },
  { val: 'EXPIREE',  label: 'Expirées',  icone: Clock,         count: ordos.value.filter(o => o.statut === 'EXPIREE').length,   cls: 'fb-gray'   },
])

const ordoFiltrees = computed(() =>
  filtre.value === 'tous' ? ordos.value : ordos.value.filter(o => o.statut === filtre.value)
)

onMounted(async () => {
  try { ordos.value = await api.get('/patient/ordonnances') }
  finally { chargement.value = false }
})

function lblStatut(s) {
  return { ACTIVE: 'Active', DELIVREE: 'Délivrée', EXPIREE: 'Expirée' }[s] || s
}
function chipClass(s) {
  return { ACTIVE: 'chip-green', DELIVREE: 'chip-blue', EXPIREE: 'chip-gray' }[s] || 'chip-gray'
}
function chipIcone(s) {
  return { ACTIVE: CheckCircle, DELIVREE: PackageCheck, EXPIREE: Clock }[s] || Clock
}
function stripClass(s) {
  return { ACTIVE: 'strip-green', DELIVREE: 'strip-blue', EXPIREE: 'strip-gray' }[s] || 'strip-gray'
}
function iconBg(s) {
  return { ACTIVE: 'icon-bg-green', DELIVREE: 'icon-bg-blue', EXPIREE: 'icon-bg-gray' }[s] || 'icon-bg-gray'
}
</script>

<style scoped>
@keyframes fadeInUp  { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:none } }
@keyframes shimmer   { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
@keyframes cardEnter { from { opacity:0; transform:translateY(14px) scale(.98) } to { opacity:1; transform:none } }

.ordo-wrap { display:flex; flex-direction:column; gap:1.25rem; }

/* ── En-tête ── */
.ordo-header { display:flex; align-items:center; justify-content:space-between; }
.ordo-header-left { display:flex; align-items:center; gap:.875rem; }
.ordo-header-icon {
  width:46px; height:46px; border-radius:1rem;
  background:linear-gradient(135deg,#4ADE80,#059669);
  display:flex; align-items:center; justify-content:center; color:white;
  box-shadow:0 4px 16px rgba(34,197,94,.3);
}
.page-titre { font-family:var(--font-display); font-size:1.2rem; font-weight:800; color:var(--color-text); }
.page-sub   { font-size:.78rem; color:var(--color-text-muted); margin-top:.1rem; }

/* ── Stats ── */
.ordo-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:.875rem; }
@media(max-width:640px) { .ordo-stats { grid-template-columns:repeat(2,1fr) } }

.os-card {
  border-radius:1rem; padding:1rem; display:flex; flex-direction:column;
  align-items:center; gap:.3rem; text-align:center;
  border:1.5px solid transparent; transition:transform .2s;
}
.os-card:hover { transform:translateY(-3px); }
.os-icon { width:36px; height:36px; border-radius:.75rem; display:flex; align-items:center; justify-content:center; }
.os-val  { font-family:var(--font-display); font-size:1.5rem; font-weight:800; line-height:1; }
.os-lbl  { font-size:.68rem; font-weight:600; text-transform:uppercase; letter-spacing:.06em; opacity:.75; }

.os-green   { background:linear-gradient(135deg,rgba(74,222,128,.12),rgba(5,150,105,.08)); border-color:rgba(34,197,94,.2); color:#16A34A; }
.os-green .os-icon   { background:rgba(34,197,94,.15); }
.os-emerald { background:linear-gradient(135deg,rgba(16,185,129,.12),rgba(5,150,105,.08)); border-color:rgba(16,185,129,.25); color:#059669; }
.os-emerald .os-icon { background:rgba(16,185,129,.15); }
.os-blue    { background:linear-gradient(135deg,rgba(56,189,248,.10),rgba(2,132,199,.07)); border-color:rgba(56,189,248,.25); color:#0284C7; }
.os-blue .os-icon    { background:rgba(56,189,248,.15); }
.os-gray    { background:linear-gradient(135deg,rgba(148,163,184,.10),rgba(71,85,105,.07)); border-color:rgba(148,163,184,.25); color:#64748B; }
.os-gray .os-icon    { background:rgba(148,163,184,.15); }

/* ── Filtres — styles globaux dans style.css ── */

/* ── Skeleton ── */
.skel-list { display:flex; flex-direction:column; gap:.875rem; }
.skel-card {
  height:110px;
  background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);
  background-size:200% 100%; border-radius:1.25rem; animation:shimmer 1.5s infinite;
}

/* ── Liste ordonnances ── */
.ordo-list { display:flex; flex-direction:column; gap:.875rem; }
.ordo-card {
  background:#fff; border:1.5px solid #E2E8F0; border-radius:1.25rem;
  overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,.04);
  display:flex; flex-direction:column;
  animation:cardEnter .4s ease both;
  transition:box-shadow .25s, transform .25s;
}
.ordo-card:hover { box-shadow:0 6px 28px rgba(0,0,0,.08); transform:translateY(-2px); }
.ordo-active { border-color:rgba(34,197,94,.3); }

/* Barre de couleur gauche */
.ordo-strip { height:4px; flex-shrink:0; }
.strip-green { background:linear-gradient(90deg,#4ADE80,#059669); }
.strip-blue  { background:linear-gradient(90deg,#38BDF8,#0284C7); }
.strip-gray  { background:linear-gradient(90deg,#94A3B8,#64748B); }

/* Corps principal */
.ordo-body { padding:1.125rem 1.25rem; display:flex; flex-direction:column; gap:.875rem; }

.ordo-top-row { display:flex; align-items:flex-start; gap:.875rem; }

.ordo-icon-wrap {
  width:44px; height:44px; border-radius:.875rem; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
}
.icon-bg-green { background:rgba(34,197,94,.12); color:#16A34A; }
.icon-bg-blue  { background:rgba(56,189,248,.12); color:#0284C7; }
.icon-bg-gray  { background:rgba(148,163,184,.12); color:#64748B; }

.ordo-meta { flex:1; min-width:0; display:flex; flex-direction:column; gap:.3rem; }
.ordo-date-row  { display:flex; align-items:center; gap:.4rem; flex-wrap:wrap; }
.ordo-date-icon { color:#16A34A; flex-shrink:0; }
.ordo-date      { font-size:.88rem; font-weight:700; color:var(--color-text); }
.ordo-expiry    {
  display:inline-flex; align-items:center; gap:.25rem;
  font-size:.72rem; color:#D97706; font-weight:500;
  background:rgba(245,158,11,.08); border:1px solid rgba(245,158,11,.2);
  border-radius:9999px; padding:.1rem .5rem;
}
.ordo-medecin {
  display:flex; align-items:center; gap:.35rem;
  font-size:.8rem; color:var(--color-text-muted); font-weight:500;
}
.ordo-instr {
  display:flex; align-items:flex-start; gap:.35rem;
  font-size:.77rem; color:var(--color-text-muted); line-height:1.5;
  background:#F8FAFC; border-radius:.5rem; padding:.4rem .625rem;
  border-left:3px solid rgba(34,197,94,.4);
}

.ordo-actions { display:flex; align-items:center; gap:.5rem; flex-shrink:0; }

/* Statut chip */
.statut-chip {
  display:inline-flex; align-items:center; gap:.3rem;
  font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:.06em;
  padding:.25rem .65rem; border-radius:9999px;
}
.chip-green { background:rgba(74,222,128,.12); color:#16A34A; border:1px solid rgba(74,222,128,.3); }
.chip-blue  { background:rgba(56,189,248,.12);  color:#0284C7; border:1px solid rgba(56,189,248,.3); }
.chip-gray  { background:rgba(148,163,184,.12); color:#64748B; border:1px solid rgba(148,163,184,.3); }

/* Toggle bouton */
.toggle-btn {
  width:32px; height:32px; border-radius:.625rem; border:1.5px solid #E2E8F0;
  background:white; cursor:pointer; color:var(--color-text-muted);
  display:flex; align-items:center; justify-content:center;
  transition:all .2s;
}
.toggle-btn:hover { background:#F1F5F9; border-color:#CBD5E1; }
.toggle-btn.open  {
  background:rgba(34,197,94,.08); border-color:rgba(34,197,94,.35); color:#16A34A;
  transform:rotate(180deg);
}
.toggle-btn.open:hover { background:rgba(34,197,94,.14); }

/* Aperçu médicaments */
.ordo-meds-preview { display:flex; flex-wrap:wrap; gap:.375rem; }
.med-pill {
  display:inline-flex; align-items:center; gap:.3rem;
  background:#F1F5F9; border:1px solid #E2E8F0;
  border-radius:9999px; padding:.25rem .7rem;
  font-size:.72rem; font-weight:600; color:var(--color-text-muted);
}
.med-pill-more {
  background:rgba(34,197,94,.08); color:#16A34A; border-color:rgba(34,197,94,.2);
}

/* ── Détail déroulant ── */
.slide-down-enter-active { transition:all .3s ease; }
.slide-down-leave-active { transition:all .2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity:0; transform:translateY(-8px); max-height:0; }

.ordo-detail {
  border-top:1.5px dashed #E2E8F0;
  padding:1rem 1.25rem 1.25rem;
  background:linear-gradient(180deg,#F8FAFC,#fff);
  display:flex; flex-direction:column; gap:.875rem;
}
.detail-titre {
  display:flex; align-items:center; gap:.4rem;
  font-size:.8rem; font-weight:700; color:var(--color-text-muted);
}

/* Grille médicaments */
.meds-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:.75rem; }

.med-card {
  background:#fff; border:1.5px solid #E2E8F0; border-radius:1rem;
  padding:.875rem; display:flex; flex-direction:column; gap:.625rem;
  box-shadow:0 1px 6px rgba(0,0,0,.04);
}
.med-card-top { display:flex; align-items:center; gap:.625rem; }
.med-card-icon {
  width:34px; height:34px; border-radius:.625rem; flex-shrink:0;
  background:rgba(34,197,94,.1); color:#16A34A;
  display:flex; align-items:center; justify-content:center;
}
.med-card-name { font-size:.88rem; font-weight:700; color:var(--color-text); line-height:1.3; }
.med-forme     { font-weight:400; font-size:.72rem; color:var(--color-text-muted); display:block; }

.med-card-rows { display:flex; flex-direction:column; gap:.25rem; }
.med-row       { display:flex; justify-content:space-between; align-items:center; font-size:.78rem; }
.med-row-lbl   { color:var(--color-text-muted); }
.med-row-val   { font-weight:600; color:var(--color-text); }

.med-desc {
  font-size:.73rem; color:var(--color-text-muted); line-height:1.5;
  border-top:1px solid #F1F5F9; padding-top:.5rem;
}

/* ── Vide ── */
.vide-block {
  display:flex; flex-direction:column; align-items:center; gap:.75rem;
  padding:3.5rem 1rem; text-align:center;
}
.vide-icon {
  width:72px; height:72px; border-radius:50%;
  background:linear-gradient(135deg,rgba(74,222,128,.1),rgba(5,150,105,.08));
  border:2px solid rgba(34,197,94,.15);
  display:flex; align-items:center; justify-content:center; color:#22C55E; opacity:.5;
}
.vide-titre { font-family:var(--font-display); font-size:1rem; font-weight:700; color:var(--color-text); }
.vide-sub   { font-size:.82rem; color:var(--color-text-muted); max-width:320px; line-height:1.6; }
</style>
