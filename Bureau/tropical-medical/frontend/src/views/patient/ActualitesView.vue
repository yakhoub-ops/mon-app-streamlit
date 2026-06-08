<template>
  <div class="actu-wrap">

    <!-- En-tête -->
    <div class="actu-header">
      <div class="actu-title-row">
        <div class="actu-icon"><Newspaper :size="18" /></div>
        <div>
          <h1 class="actu-titre">Actualités Santé</h1>
          <p class="actu-sous">Informations et événements de Tropical Medical</p>
        </div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filtres-tabs">
      <button v-for="c in categories" :key="c.val"
        class="filtre-btn" :class="[c.cls, { active: filtre === c.val }]"
        @click="filtre = c.val">
        <component :is="c.icone" :size="13" />
        {{ c.label }}
      </button>
    </div>

    <!-- Chargement -->
    <div v-if="chargement" class="grid-actu">
      <div class="skel-card" v-for="i in 6" :key="i"></div>
    </div>

    <!-- Vide -->
    <div v-else-if="!actusFiltrees.length" class="vide-box">
      <Newspaper :size="52" style="opacity:.15;margin-bottom:.875rem" />
      <p>Aucune actualité dans cette catégorie</p>
    </div>

    <!-- Grille articles -->
    <div v-else class="grid-actu">
      <article v-for="(a, i) in actusFiltrees" :key="a.id"
        class="actu-card" :style="{ animationDelay: (i * 60) + 'ms' }"
        @click="ouvrirDetail(a)">
        <!-- Bande couleur -->
        <div class="actu-stripe" :class="stripeCls(a.categorie)"></div>
        <div class="actu-body">
          <div class="actu-top">
            <span class="actu-badge" :class="badgeCls(a.categorie)">
              <component :is="catIcone(a.categorie)" :size="11" />
              {{ catLabel(a.categorie) }}
            </span>
            <span class="actu-date">{{ fmt(a.createdAt) }}</span>
          </div>
          <h2 class="actu-nom">{{ a.titre }}</h2>
          <p class="actu-extrait">{{ extrait(a.contenu) }}</p>
          <div class="actu-footer">
            <span class="actu-auteur" v-if="a.auteur">
              <User :size="11" /> {{ a.auteur.prenom }} {{ a.auteur.nom }}
            </span>
            <span class="actu-lire">Lire la suite →</span>
          </div>
        </div>
      </article>
    </div>

    <!-- Modal détail -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="detail" class="modal-overlay" @click.self="detail = null">
          <div class="modal-detail">
            <div class="md-stripe" :class="stripeCls(detail.categorie)"></div>
            <div class="md-content">
              <div class="md-top">
                <span class="actu-badge" :class="badgeCls(detail.categorie)">
                  <component :is="catIcone(detail.categorie)" :size="11" />
                  {{ catLabel(detail.categorie) }}
                </span>
                <button class="md-close" @click="detail = null"><X :size="20" /></button>
              </div>
              <h2 class="md-titre">{{ detail.titre }}</h2>
              <div class="md-meta">
                <span v-if="detail.auteur"><User :size="12" /> Publié par {{ detail.auteur.prenom }} {{ detail.auteur.nom }}</span>
                <span><Calendar :size="12" /> {{ fmt(detail.createdAt) }}</span>
              </div>
              <p class="md-contenu">{{ detail.contenu }}</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Newspaper, User, Calendar, X,
  Droplets, Syringe, Heart, Info, CalendarDays, AlertTriangle,
} from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { fmt } = useDate()

const chargement = ref(true)
const actus      = ref([])
const filtre     = ref('TOUT')
const detail     = ref(null)

const categories = [
  { val: 'TOUT',           label: 'Toutes',          cls: 'fb-green',  icone: Newspaper    },
  { val: 'DON_SANG',       label: 'Don de sang',     cls: 'fb-red',    icone: Droplets     },
  { val: 'VACCINATION',    label: 'Vaccination',     cls: 'fb-blue',   icone: Syringe      },
  { val: 'SENSIBILISATION',label: 'Sensibilisation', cls: 'fb-purple', icone: Heart        },
  { val: 'EVENEMENT',      label: 'Événements',      cls: 'fb-teal',   icone: CalendarDays },
  { val: 'INFO',           label: 'Infos clinique',  cls: 'fb-gray',   icone: Info         },
]

const actusFiltrees = computed(() =>
  filtre.value === 'TOUT' ? actus.value : actus.value.filter(a => a.categorie === filtre.value)
)

onMounted(async () => {
  try { actus.value = await api.get('/patient/actualites') }
  finally { chargement.value = false }
})

function ouvrirDetail(a) { detail.value = a }

function extrait(txt) {
  return txt.length > 140 ? txt.slice(0, 140) + '…' : txt
}

function catLabel(cat) {
  return { DON_SANG: 'Don de sang', VACCINATION: 'Vaccination', SENSIBILISATION: 'Sensibilisation', EVENEMENT: 'Événement', INFO: 'Info clinique', URGENCE: 'Urgence' }[cat] || cat
}

function catIcone(cat) {
  return { DON_SANG: Droplets, VACCINATION: Syringe, SENSIBILISATION: Heart, EVENEMENT: CalendarDays, INFO: Info, URGENCE: AlertTriangle }[cat] || Info
}

function badgeCls(cat) {
  return { DON_SANG: 'badge-red', VACCINATION: 'badge-info', SENSIBILISATION: 'badge-purple', EVENEMENT: 'badge-teal', INFO: 'badge-gray', URGENCE: 'badge-danger' }[cat] || 'badge-gray'
}

function stripeCls(cat) {
  return { DON_SANG: 'stripe-red', VACCINATION: 'stripe-blue', SENSIBILISATION: 'stripe-purple', EVENEMENT: 'stripe-teal', INFO: 'stripe-gray', URGENCE: 'stripe-orange' }[cat] || 'stripe-gray'
}
</script>

<style scoped>
@keyframes fadeInUp { from { opacity:0;transform:translateY(14px) } to { opacity:1;transform:none } }
@keyframes shimmer  { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }

.actu-wrap { display:flex;flex-direction:column;gap:1.375rem; }

.actu-header { display:flex;align-items:center;gap:1rem;flex-wrap:wrap;justify-content:space-between; }
.actu-title-row { display:flex;align-items:center;gap:.875rem; }
.actu-icon { width:42px;height:42px;border-radius:.875rem;background:linear-gradient(135deg,#4ADE80,#059669);display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0; }
.actu-titre { font-family:var(--font-display);font-size:1.2rem;font-weight:800;color:var(--color-text);margin:0; }
.actu-sous  { font-size:.8rem;color:var(--color-text-muted);margin:0; }

/* Grille */
.grid-actu { display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.125rem; }

/* Card */
.actu-card {
  background:white;border-radius:1.125rem;border:1.5px solid #E2E8F0;
  overflow:hidden;cursor:pointer;
  transition:all .22s cubic-bezier(.4,0,.2,1);
  animation:fadeInUp .4s ease both;
  display:flex;flex-direction:column;
}
.actu-card:hover { transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.1);border-color:transparent; }

.actu-stripe { height:4px;width:100%;flex-shrink:0; }
.stripe-red    { background:linear-gradient(90deg,#F87171,#DC2626); }
.stripe-blue   { background:linear-gradient(90deg,#60A5FA,#2563EB); }
.stripe-purple { background:linear-gradient(90deg,#C084FC,#9333EA); }
.stripe-teal   { background:linear-gradient(90deg,#2DD4BF,#0F766E); }
.stripe-gray   { background:linear-gradient(90deg,#94A3B8,#475569); }
.stripe-orange { background:linear-gradient(90deg,#FB923C,#EA580C); }

.actu-body { padding:1.125rem;display:flex;flex-direction:column;gap:.625rem;flex:1; }
.actu-top  { display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap; }
.actu-date { font-size:.72rem;color:var(--color-text-muted); }

.actu-badge { display:inline-flex;align-items:center;gap:.3rem;font-size:.68rem;font-weight:700;padding:3px 8px;border-radius:9999px; }
.badge-red    { background:rgba(239,68,68,.1);color:#DC2626;border:1px solid rgba(239,68,68,.2); }
.badge-purple { background:rgba(147,51,234,.1);color:#9333EA;border:1px solid rgba(147,51,234,.2); }
.badge-teal   { background:rgba(15,118,110,.1);color:#0F766E;border:1px solid rgba(15,118,110,.2); }
.badge-gray   { background:rgba(71,85,105,.08);color:#475569;border:1px solid rgba(71,85,105,.15); }

.actu-nom    { font-family:var(--font-display);font-size:.95rem;font-weight:700;color:var(--color-text);margin:0;line-height:1.35; }
.actu-extrait{ font-size:.82rem;color:var(--color-text-muted);line-height:1.55;margin:0; }
.actu-footer { display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:.5rem;border-top:1px solid #F1F5F9; }
.actu-auteur { display:flex;align-items:center;gap:.3rem;font-size:.72rem;color:var(--color-text-muted); }
.actu-lire   { font-size:.75rem;font-weight:700;color:var(--color-primary); }

/* Skeleton */
.skel-card { height:220px;background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:1.125rem;animation:shimmer 1.5s infinite; }

/* Vide */
.vide-box { display:flex;flex-direction:column;align-items:center;padding:4rem 1rem;color:var(--color-text-muted);font-size:.9rem; }

/* Modal */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem; }
.modal-detail  { background:white;border-radius:1.25rem;width:100%;max-width:600px;max-height:88vh;overflow-y:auto;display:flex;flex-direction:column; }
.md-stripe     { height:6px;flex-shrink:0;border-radius:1.25rem 1.25rem 0 0; }
.md-content    { padding:1.5rem;display:flex;flex-direction:column;gap:1rem; }
.md-top        { display:flex;align-items:center;justify-content:space-between; }
.md-close      { background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex;border-radius:.5rem;padding:.25rem; }
.md-close:hover{ background:#F1F5F9; }
.md-titre      { font-family:var(--font-display);font-size:1.15rem;font-weight:800;color:var(--color-text);margin:0;line-height:1.3; }
.md-meta       { display:flex;align-items:center;gap:1rem;flex-wrap:wrap;font-size:.78rem;color:var(--color-text-muted); }
.md-meta span  { display:flex;align-items:center;gap:.3rem; }
.md-contenu    { font-size:.9rem;color:var(--color-text);line-height:1.7;white-space:pre-line;margin:0; }

.modal-fade-enter-active,.modal-fade-leave-active { transition:all .25s ease; }
.modal-fade-enter-from,.modal-fade-leave-to { opacity:0; }
</style>
