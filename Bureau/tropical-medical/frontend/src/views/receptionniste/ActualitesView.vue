<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-titre">Actualités Santé</h1>
        <p style="color:var(--color-text-muted);font-size:.875rem">{{ actus.length }} article(s)</p>
      </div>
      <button class="btn btn-primary" @click="ouvrirCreer">
        <Plus :size="16" /> Nouvelle actualité
      </button>
    </div>

    <!-- Filtres -->
    <div class="filtres-tabs" style="margin-bottom:1.25rem">
      <button v-for="c in categories" :key="c.val"
        class="filtre-btn" :class="[c.cls, { active: filtre === c.val }]"
        @click="filtre = c.val">
        {{ c.label }}
        <span class="filtre-count" v-if="c.val !== 'TOUT'">{{ compter(c.val) }}</span>
      </button>
    </div>

    <div v-if="chargement" class="skel-list">
      <div class="skeleton-block" v-for="i in 5" :key="i" style="height:72px"></div>
    </div>

    <div v-else-if="actusFiltrees.length" class="card table-wrap">
      <table class="table-tm">
        <thead>
          <tr>
            <th>Titre</th>
            <th>Catégorie</th>
            <th>Statut</th>
            <th>Date</th>
            <th style="text-align:center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in actusFiltrees" :key="a.id">
            <td>
              <div style="font-weight:600;font-size:.88rem;max-width:320px">{{ a.titre }}</div>
              <div style="font-size:.73rem;color:var(--color-text-muted);margin-top:.1rem">{{ extrait(a.contenu) }}</div>
            </td>
            <td>
              <span class="badge" :class="badgeCls(a.categorie)">{{ catLabel(a.categorie) }}</span>
            </td>
            <td>
              <button class="statut-toggle" :class="a.publiee ? 'st-publiee' : 'st-brouillon'" @click="basculer(a)">
                <Eye v-if="a.publiee" :size="13" /> <EyeOff v-else :size="13" />
                {{ a.publiee ? 'Publiée' : 'Brouillon' }}
              </button>
            </td>
            <td style="font-size:.78rem;color:var(--color-text-muted);white-space:nowrap">{{ fmt(a.createdAt) }}</td>
            <td>
              <div style="display:flex;justify-content:center;gap:.375rem">
                <button class="btn-icone" title="Modifier" @click="ouvrirEditer(a)"><Pencil :size="15" /></button>
                <button class="btn-icone btn-icone-danger" title="Supprimer" @click="supprimer(a)"><Trash2 :size="15" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="vide-center">
      <Newspaper :size="48" style="opacity:.2;margin-bottom:.75rem" />
      <p style="color:var(--color-text-muted)">Aucune actualité trouvée</p>
    </div>

    <!-- Modal créer / modifier -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="modalOuvert" class="modal-overlay" @click.self="modalOuvert=false">
          <div class="modal-box">
            <div class="modal-header">
              <h2 class="modal-titre">
                <component :is="editActu ? Pencil : Plus" :size="18" style="color:var(--color-primary)" />
                {{ editActu ? 'Modifier l\'actualité' : 'Nouvelle actualité' }}
              </h2>
              <button class="modal-close" @click="modalOuvert=false"><X :size="20" /></button>
            </div>
            <form @submit.prevent="sauvegarder" class="modal-body">
              <div v-if="erreur" class="alert-erreur"><AlertCircle :size="14" /> {{ erreur }}</div>

              <div class="field">
                <label class="field-label">Titre *</label>
                <input v-model="form.titre" type="text" class="input" required placeholder="Titre de l'actualité…" />
              </div>

              <div class="field">
                <label class="field-label">Catégorie</label>
                <div class="cats-grid">
                  <button v-for="c in categoriesForm" :key="c.val" type="button"
                    class="cat-btn" :class="{ active: form.categorie === c.val, ['cb-'+c.color]: true }"
                    @click="form.categorie = c.val">
                    <component :is="c.icone" :size="14" /> {{ c.label }}
                  </button>
                </div>
              </div>

              <div class="field">
                <label class="field-label">Contenu *</label>
                <textarea v-model="form.contenu" class="input" rows="6" required
                  placeholder="Rédigez le contenu de l'actualité…"
                  style="resize:vertical;min-height:120px"></textarea>
              </div>

              <div class="field">
                <label class="field-label" style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
                  <input type="checkbox" v-model="form.publiee" style="width:16px;height:16px;accent-color:var(--color-primary)" />
                  Publier immédiatement (visible par les patients)
                </label>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="modalOuvert=false">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="envoi">
                  <Loader2 v-if="envoi" :size="16" class="spin" /><Check v-else :size="16" />
                  {{ envoi ? 'Enregistrement…' : (editActu ? 'Modifier' : 'Publier') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, X, Check, AlertCircle, Loader2,
  Newspaper, Droplets, Syringe, Heart, Info, CalendarDays, AlertTriangle,
} from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { fmt } = useDate()

const chargement = ref(true)
const actus      = ref([])
const filtre     = ref('TOUT')
const modalOuvert= ref(false)
const editActu   = ref(null)
const envoi      = ref(false)
const erreur     = ref('')
const form       = ref({ titre: '', contenu: '', categorie: 'INFO', publiee: true })

const categories = [
  { val: 'TOUT',            label: 'Toutes',          cls: 'fb-green'  },
  { val: 'DON_SANG',        label: 'Don de sang',     cls: 'fb-red'    },
  { val: 'VACCINATION',     label: 'Vaccination',     cls: 'fb-blue'   },
  { val: 'SENSIBILISATION', label: 'Sensibilisation', cls: 'fb-purple' },
  { val: 'EVENEMENT',       label: 'Événements',      cls: 'fb-teal'   },
  { val: 'INFO',            label: 'Infos',           cls: 'fb-gray'   },
]

const categoriesForm = [
  { val: 'DON_SANG',        label: 'Don de sang',     icone: Droplets,     color: 'red'    },
  { val: 'VACCINATION',     label: 'Vaccination',     icone: Syringe,      color: 'blue'   },
  { val: 'SENSIBILISATION', label: 'Sensibilisation', icone: Heart,        color: 'purple' },
  { val: 'EVENEMENT',       label: 'Événement',       icone: CalendarDays, color: 'teal'   },
  { val: 'INFO',            label: 'Info clinique',   icone: Info,         color: 'gray'   },
  { val: 'URGENCE',         label: 'Urgence',         icone: AlertTriangle,color: 'orange' },
]

const actusFiltrees = computed(() =>
  filtre.value === 'TOUT' ? actus.value : actus.value.filter(a => a.categorie === filtre.value)
)

function compter(cat) { return actus.value.filter(a => a.categorie === cat).length }

async function charger() {
  chargement.value = true
  try { actus.value = await api.get('/receptionniste/actualites') }
  finally { chargement.value = false }
}

onMounted(charger)

function ouvrirCreer() {
  editActu.value = null
  form.value = { titre: '', contenu: '', categorie: 'INFO', publiee: true }
  erreur.value = ''; modalOuvert.value = true
}

function ouvrirEditer(a) {
  editActu.value = a
  form.value = { titre: a.titre, contenu: a.contenu, categorie: a.categorie, publiee: a.publiee }
  erreur.value = ''; modalOuvert.value = true
}

async function sauvegarder() {
  erreur.value = ''; envoi.value = true
  try {
    if (editActu.value) {
      const updated = await api.put(`/receptionniste/actualites/${editActu.value.id}`, form.value)
      const idx = actus.value.findIndex(a => a.id === editActu.value.id)
      if (idx >= 0) actus.value[idx] = { ...actus.value[idx], ...updated }
    } else {
      const created = await api.post('/receptionniste/actualites', form.value)
      actus.value.unshift(created)
    }
    modalOuvert.value = false
  } catch(e) { erreur.value = e.message }
  finally { envoi.value = false }
}

async function basculer(a) {
  try {
    const res = await api.patch(`/receptionniste/actualites/${a.id}/publier`, {})
    a.publiee = res.publiee
  } catch(e) { console.error(e) }
}

async function supprimer(a) {
  if (!confirm(`Supprimer « ${a.titre} » ?`)) return
  await api.del(`/receptionniste/actualites/${a.id}`)
  actus.value = actus.value.filter(x => x.id !== a.id)
}

function extrait(txt) { return txt.length > 80 ? txt.slice(0, 80) + '…' : txt }
function catLabel(cat) {
  return { DON_SANG:'Don de sang', VACCINATION:'Vaccination', SENSIBILISATION:'Sensibilisation', EVENEMENT:'Événement', INFO:'Info clinique', URGENCE:'Urgence' }[cat] || cat
}
function badgeCls(cat) {
  return { DON_SANG:'badge-danger', VACCINATION:'badge-info', SENSIBILISATION:'badge-primary', EVENEMENT:'badge-green', INFO:'badge-gray', URGENCE:'badge-warning' }[cat] || 'badge-gray'
}
</script>

<style scoped>
.page-header  { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;gap:1rem }
.page-titre   { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
.vide-center  { display:flex;flex-direction:column;align-items:center;padding:4rem 1rem }
.btn-icone    { width:30px;height:30px;border-radius:.5rem;border:1.5px solid #E2E8F0;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);transition:all .15s }
.btn-icone:hover { border-color:var(--color-primary);color:var(--color-primary) }
.btn-icone-danger:hover { border-color:var(--color-danger)!important;color:var(--color-danger)!important }
.statut-toggle { display:inline-flex;align-items:center;gap:.35rem;font-size:.75rem;font-weight:600;padding:4px 10px;border-radius:9999px;border:none;cursor:pointer;transition:all .15s }
.st-publiee  { background:rgba(34,197,94,.12);color:#16A34A; }
.st-brouillon{ background:rgba(148,163,184,.12);color:#64748B; }
.skel-list { display:flex;flex-direction:column;gap:.5rem }
.skeleton-block { background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.75rem;animation:shimmer 1.5s infinite }
@keyframes shimmer{ 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }
.modal-overlay{ position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem }
.modal-box    { background:white;border-radius:1.25rem;width:100%;max-width:560px;max-height:90vh;overflow-y:auto }
.modal-header { display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #F1F5F9 }
.modal-titre  { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:1rem;font-weight:700 }
.modal-close  { background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex }
.modal-body   { padding:1.5rem;display:flex;flex-direction:column;gap:1rem }
.modal-footer { display:flex;justify-content:flex-end;gap:.75rem;padding-top:.5rem }
.field        { display:flex;flex-direction:column;gap:.375rem }
.field-label  { font-size:.8rem;font-weight:600;color:var(--color-text-muted) }
.alert-erreur { display:flex;align-items:center;gap:.5rem;background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.25);color:var(--color-danger);border-radius:.75rem;padding:.625rem .875rem;font-size:.83rem }
.spin { animation:spin 1s linear infinite }
@keyframes spin{ from{ transform:rotate(0deg) } to{ transform:rotate(360deg) } }
.modal-fade-enter-active,.modal-fade-leave-active { transition:all .25s ease }
.modal-fade-enter-from,.modal-fade-leave-to { opacity:0 }
.cats-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem }
@media(max-width:420px){ .cats-grid { grid-template-columns:1fr 1fr } }
.cat-btn { display:flex;align-items:center;justify-content:center;gap:.4rem;padding:.5rem .75rem;border-radius:.75rem;border:1.5px solid #E2E8F0;background:white;cursor:pointer;font-size:.78rem;font-weight:600;color:var(--color-text-muted);transition:all .15s }
.cat-btn.active.cb-red    { border-color:#DC2626;background:rgba(220,38,38,.08);color:#DC2626 }
.cat-btn.active.cb-blue   { border-color:#2563EB;background:rgba(37,99,235,.08);color:#2563EB }
.cat-btn.active.cb-purple { border-color:#9333EA;background:rgba(147,51,234,.08);color:#9333EA }
.cat-btn.active.cb-teal   { border-color:#0F766E;background:rgba(15,118,110,.08);color:#0F766E }
.cat-btn.active.cb-gray   { border-color:#475569;background:rgba(71,85,105,.08);color:#475569 }
.cat-btn.active.cb-orange { border-color:#EA580C;background:rgba(234,88,12,.08);color:#EA580C }
</style>
