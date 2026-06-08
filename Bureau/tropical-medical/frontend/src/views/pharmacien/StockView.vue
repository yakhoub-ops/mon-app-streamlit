<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-titre">Stock médicaments</h1>
        <p style="color:var(--color-text-muted);font-size:.875rem">{{ medsFiltres.length }} médicament(s)</p>
      </div>
      <button class="btn btn-primary" @click="ouvrirModal()">
        <Plus :size="16" /> Nouveau médicament
      </button>
    </div>

    <!-- Recherche + filtre -->
    <div style="display:flex;gap:.75rem;margin-bottom:1.25rem;flex-wrap:wrap;align-items:center">
      <div class="search-wrap">
        <Search :size="15" class="search-icon" />
        <input v-model="recherche" type="text" class="input search-input" placeholder="Nom, DCI…" />
      </div>
      <div style="display:flex;gap:.375rem;flex-wrap:wrap">
        <button class="filtre-btn" :class="{active:filtreStock==='tous'}"      @click="filtreStock='tous'">Tous</button>
        <button class="filtre-btn" :class="{active:filtreStock==='rupture'}"   @click="filtreStock='rupture'">
          <AlertTriangle :size="13" /> Ruptures
        </button>
        <button class="filtre-btn" :class="{active:filtreStock==='bas'}"       @click="filtreStock='bas'">Stock bas</button>
        <button class="filtre-btn" :class="{active:filtreStock==='suffisant'}" @click="filtreStock='suffisant'">Suffisant</button>
      </div>
    </div>

    <!-- Bannière ruptures avec CTA commander -->
    <div v-if="nbRuptures > 0 && filtreStock !== 'rupture'" class="rupture-banner">
      <div class="rupture-banner-left">
        <div class="rupture-icon"><AlertTriangle :size="18" /></div>
        <div>
          <div class="rupture-banner-titre">{{ nbRuptures }} médicament(s) en rupture de stock</div>
          <div class="rupture-banner-sub">Commandez directement chez vos fournisseurs</div>
        </div>
      </div>
      <button class="btn btn-danger btn-sm" @click="filtreStock='rupture'">
        <ShoppingCart :size="14" /> Voir et commander
      </button>
    </div>

    <div v-if="chargement" style="display:flex;flex-direction:column;gap:.625rem">
      <div class="skeleton-block" v-for="i in 8" :key="i" style="height:64px"></div>
    </div>

    <div v-else-if="medsFiltres.length" class="card table-wrap">
      <table class="table-tm">
        <thead>
          <tr>
            <th>Médicament</th>
            <th>Forme / Dosage</th>
            <th>Catégorie</th>
            <th>Prix unit.</th>
            <th>Stock actuel</th>
            <th>Stock min.</th>
            <th>Statut</th>
            <th>Fournisseur</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in medsFiltres" :key="m.id"
              :class="m.stockActuel===0?'row-rupture':m.stockActuel<=m.stockMinimum?'row-bas':''">
            <td>
              <div style="font-weight:600;font-size:.88rem">{{ m.nom }}</div>
              <div v-if="m.dci" style="font-size:.72rem;color:var(--color-text-muted)">{{ m.dci }}</div>
            </td>
            <td style="font-size:.83rem">{{ m.forme || '—' }}<span v-if="m.dosage"> · {{ m.dosage }}</span></td>
            <td style="font-size:.8rem;color:var(--color-text-muted)">{{ m.categorie || '—' }}</td>
            <td style="font-size:.85rem;font-weight:600">{{ m.prixUnitaire.toLocaleString('fr-SN') }} FCFA</td>
            <td>
              <div class="stock-bar-wrap">
                <div class="stock-bar" :class="stockBarClass(m)" :style="{ width: stockPct(m)+'%' }"></div>
              </div>
              <span class="stock-val" :class="stockValClass(m)">{{ m.stockActuel }}</span>
            </td>
            <td style="font-size:.83rem;color:var(--color-text-muted)">{{ m.stockMinimum }}</td>
            <td>
              <span class="badge" :class="stockBadgeClass(m)">{{ stockLabel(m) }}</span>
            </td>
            <td>
              <div v-if="m.urlFournisseur" class="url-cell">
                <Globe :size="12" />
                <span class="url-texte">{{ urlCourt(m.urlFournisseur) }}</span>
              </div>
              <span v-else style="font-size:.75rem;color:var(--color-text-muted)">—</span>
            </td>
            <td>
              <div style="display:flex;gap:.375rem;align-items:center">
                <button
                  v-if="m.stockActuel === 0 || m.stockActuel <= m.stockMinimum"
                  class="btn-commander"
                  @click="ouvrirCommander(m)"
                  title="Commander chez le fournisseur"
                >
                  <ShoppingCart :size="14" />
                  Commander
                </button>
                <button class="btn btn-ghost btn-sm" @click="ouvrirModal(m)" title="Modifier">
                  <Pencil :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="vide-center">
      <FlaskConical :size="48" style="opacity:.25;margin-bottom:.75rem" />
      <p style="color:var(--color-text-muted)">Aucun médicament trouvé</p>
    </div>

    <!-- ── MODAL COMMANDER ─────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="modalCommander" class="modal-overlay" @click.self="modalCommander=null">
          <div class="modal-box modal-commander-box">

            <!-- Header -->
            <div class="modal-header cmd-header">
              <div class="cmd-header-left">
                <div class="cmd-header-icon">
                  <ShoppingCart :size="20" />
                </div>
                <div>
                  <h2 class="modal-titre">Commander — {{ modalCommander.nom }}</h2>
                  <p class="cmd-header-sub">
                    <span class="badge badge-danger" v-if="modalCommander.stockActuel===0">Rupture totale</span>
                    <span class="badge badge-warning" v-else>Stock bas</span>
                    Stock actuel : <strong>{{ modalCommander.stockActuel }}</strong> /
                    min. <strong>{{ modalCommander.stockMinimum }}</strong>
                  </p>
                </div>
              </div>
              <button class="modal-close" @click="modalCommander=null"><X :size="20" /></button>
            </div>

            <div class="cmd-body">

              <!-- Info médicament -->
              <div class="cmd-med-info">
                <div class="cmd-info-item">
                  <span class="cmd-info-label">Forme</span>
                  <span class="cmd-info-val">{{ modalCommander.forme || '—' }}</span>
                </div>
                <div class="cmd-info-item">
                  <span class="cmd-info-label">Dosage</span>
                  <span class="cmd-info-val">{{ modalCommander.dosage || '—' }}</span>
                </div>
                <div class="cmd-info-item">
                  <span class="cmd-info-label">DCI</span>
                  <span class="cmd-info-val">{{ modalCommander.dci || '—' }}</span>
                </div>
                <div class="cmd-info-item">
                  <span class="cmd-info-label">Catégorie</span>
                  <span class="cmd-info-val">{{ modalCommander.categorie || '—' }}</span>
                </div>
              </div>

              <!-- URL fournisseur -->
              <div class="cmd-section">
                <label class="cmd-label">
                  <Globe :size="14" /> URL du site fournisseur
                </label>
                <div class="cmd-url-row">
                  <input
                    v-model="urlSaisie"
                    type="url"
                    class="input cmd-url-input"
                    placeholder="https://fournisseur.com"
                    @keyup.enter="accederFournisseur"
                  />
                  <button
                    class="btn btn-ghost btn-sm cmd-save-btn"
                    :disabled="enregistrement"
                    @click="sauvegarderUrl"
                    title="Sauvegarder l'URL pour ce médicament"
                  >
                    <Loader2 v-if="enregistrement" :size="14" class="spin" />
                    <Save v-else :size="14" />
                    {{ enregistrement ? '…' : 'Sauvegarder' }}
                  </button>
                </div>

                <!-- Feedback sauvegarde -->
                <Transition name="toast">
                  <div v-if="feedbackUrl" class="feedback-url" :class="feedbackOk?'feedback-ok':'feedback-err'">
                    <component :is="feedbackOk ? CheckCircle : AlertCircle" :size="14" />
                    {{ feedbackUrl }}
                  </div>
                </Transition>

                <!-- Aide si vide -->
                <p v-if="!urlSaisie" class="cmd-hint">
                  <Info :size="12" />
                  Entrez l'URL du site de votre fournisseur pour accéder directement à la commande.
                  L'URL sera mémorisée pour ce médicament.
                </p>
              </div>

              <!-- Bouton principal accès fournisseur -->
              <button
                class="btn-acceder-fournisseur"
                :class="urlSaisie ? 'btn-acceder-active' : 'btn-acceder-disabled'"
                :disabled="!urlSaisie"
                @click="accederFournisseur"
              >
                <ExternalLink :size="18" />
                <span>Accéder au site fournisseur</span>
                <ArrowRight :size="16" class="btn-acceder-arr" />
              </button>

              <p v-if="urlSaisie" class="cmd-url-preview">
                <Lock :size="11" /> {{ urlSaisie }}
              </p>

            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── MODAL MÉDICAMENT ────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="modal" class="modal-overlay" @click.self="modal=null">
          <div class="modal-box">
            <div class="modal-header">
              <h2 class="modal-titre">
                <FlaskConical :size="17" style="color:var(--color-primary)" />
                {{ modal.id ? 'Modifier le médicament' : 'Nouveau médicament' }}
              </h2>
              <button class="modal-close" @click="modal=null"><X :size="20" /></button>
            </div>
            <form @submit.prevent="sauvegarder" class="modal-body">
              <div v-if="erreur" class="alert-erreur"><AlertCircle :size="14" /> {{ erreur }}</div>

              <div class="deux-cols">
                <div class="field">
                  <label class="field-label">Nom *</label>
                  <input v-model="modal.nom" type="text" class="input" required />
                </div>
                <div class="field">
                  <label class="field-label">DCI</label>
                  <input v-model="modal.dci" type="text" class="input" placeholder="Dénomination commune" />
                </div>
              </div>
              <div class="deux-cols">
                <div class="field">
                  <label class="field-label">Forme</label>
                  <select v-model="modal.forme" class="input">
                    <option value="">—</option>
                    <option>Comprimé</option><option>Gélule</option><option>Sirop</option>
                    <option>Injection</option><option>Pommade</option><option>Sachet</option>
                  </select>
                </div>
                <div class="field">
                  <label class="field-label">Dosage</label>
                  <input v-model="modal.dosage" type="text" class="input" placeholder="Ex: 500 mg" />
                </div>
              </div>
              <div class="deux-cols">
                <div class="field">
                  <label class="field-label">Catégorie</label>
                  <input v-model="modal.categorie" type="text" class="input" placeholder="Ex: Antibiotique" />
                </div>
                <div class="field">
                  <label class="field-label">Prix unitaire (FCFA)</label>
                  <input v-model.number="modal.prixUnitaire" type="number" min="0" class="input" />
                </div>
              </div>
              <div class="deux-cols">
                <div class="field">
                  <label class="field-label">Stock minimum d'alerte</label>
                  <input v-model.number="modal.stockMinimum" type="number" min="0" class="input" />
                </div>
                <div class="field">
                  <label class="field-label">URL fournisseur</label>
                  <input v-model="modal.urlFournisseur" type="url" class="input" placeholder="https://fournisseur.com" />
                </div>
              </div>
              <div class="field">
                <label class="field-label">Description</label>
                <textarea v-model="modal.description" class="input" rows="2" style="resize:vertical"></textarea>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="modal=null">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="envoi">
                  <Loader2 v-if="envoi" :size="16" class="spin" /><Check v-else :size="16" />
                  {{ envoi ? 'Enregistrement…' : 'Sauvegarder' }}
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
  Plus, Search, AlertTriangle, FlaskConical, Pencil, X, Check,
  AlertCircle, Loader2, ShoppingCart, Globe, ExternalLink,
  ArrowRight, Save, CheckCircle, Info, Lock,
} from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'

const api = useApi()
const chargement  = ref(true)
const medicaments = ref([])
const recherche   = ref('')
const filtreStock = ref('tous')
const modal       = ref(null)
const envoi       = ref(false)
const erreur      = ref('')

// ── Commander ──────────────────────────────────────────────────────────────
const modalCommander  = ref(null)
const urlSaisie       = ref('')
const enregistrement  = ref(false)
const feedbackUrl     = ref('')
const feedbackOk      = ref(true)
let feedbackTimer     = null

function ouvrirCommander(m) {
  modalCommander.value = m
  urlSaisie.value      = m.urlFournisseur || ''
  feedbackUrl.value    = ''
}

async function sauvegarderUrl() {
  if (!modalCommander.value) return
  enregistrement.value = true
  feedbackUrl.value    = ''
  try {
    await api.patch(`/pharmacien/medicaments/${modalCommander.value.id}/url-fournisseur`, {
      urlFournisseur: urlSaisie.value || null,
    })
    // Mettre à jour la liste locale
    const idx = medicaments.value.findIndex(m => m.id === modalCommander.value.id)
    if (idx !== -1) medicaments.value[idx] = { ...medicaments.value[idx], urlFournisseur: urlSaisie.value || null }
    modalCommander.value = { ...modalCommander.value, urlFournisseur: urlSaisie.value || null }
    feedbackOk.value  = true
    feedbackUrl.value = 'URL fournisseur sauvegardée'
  } catch {
    feedbackOk.value  = false
    feedbackUrl.value = 'Erreur lors de la sauvegarde'
  } finally {
    enregistrement.value = false
    clearTimeout(feedbackTimer)
    feedbackTimer = setTimeout(() => { feedbackUrl.value = '' }, 3000)
  }
}

function accederFournisseur() {
  if (!urlSaisie.value) return
  let url = urlSaisie.value.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url
  window.open(url, '_blank', 'noopener,noreferrer')
}

function urlCourt(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return url.slice(0, 28) }
}

// ── Médicaments ─────────────────────────────────────────────────────────────
const nbRuptures = computed(() => medicaments.value.filter(m => m.stockActuel === 0).length)

const medsFiltres = computed(() => {
  let r = medicaments.value
  if (recherche.value) {
    const q = recherche.value.toLowerCase()
    r = r.filter(m => m.nom.toLowerCase().includes(q) || (m.dci||'').toLowerCase().includes(q))
  }
  if (filtreStock.value === 'rupture')   r = r.filter(m => m.stockActuel === 0)
  if (filtreStock.value === 'bas')       r = r.filter(m => m.stockActuel > 0 && m.stockActuel <= m.stockMinimum)
  if (filtreStock.value === 'suffisant') r = r.filter(m => m.stockActuel > m.stockMinimum)
  return r
})

onMounted(async () => {
  try { medicaments.value = await api.get('/pharmacien/medicaments') }
  finally { chargement.value = false }
})

function ouvrirModal(m = null) {
  erreur.value = ''
  modal.value  = m
    ? { ...m }
    : { nom:'', dci:'', forme:'', dosage:'', categorie:'', prixUnitaire:0, stockMinimum:10, description:'', urlFournisseur:'' }
}

async function sauvegarder() {
  erreur.value = ''; envoi.value = true
  try {
    if (modal.value.id) {
      await api.put(`/pharmacien/medicaments/${modal.value.id}`, modal.value)
    } else {
      await api.post('/pharmacien/medicaments', modal.value)
    }
    modal.value       = null
    medicaments.value = await api.get('/pharmacien/medicaments')
  } catch(e) { erreur.value = e.message }
  finally { envoi.value = false }
}

function stockPct(m)        { return Math.min(100, m.stockMinimum ? Math.round(m.stockActuel / (m.stockMinimum * 2) * 100) : 100) }
function stockBarClass(m)   { return m.stockActuel===0?'bar-rouge':m.stockActuel<=m.stockMinimum?'bar-orange':'bar-vert' }
function stockValClass(m)   { return m.stockActuel===0?'val-rouge':m.stockActuel<=m.stockMinimum?'val-orange':'val-vert' }
function stockBadgeClass(m) { return m.stockActuel===0?'badge-danger':m.stockActuel<=m.stockMinimum?'badge-warning':'badge-green' }
function stockLabel(m)      { return m.stockActuel===0?'Rupture':m.stockActuel<=m.stockMinimum?'Stock bas':'OK' }
</script>

<style scoped>
.page-header  { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;gap:1rem }
.page-titre   { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
.search-wrap  { position:relative;flex:0 1 260px }
.search-icon  { position:absolute;left:.75rem;top:50%;transform:translateY(-50%);color:var(--color-text-muted);pointer-events:none }
.search-input { padding-left:2.25rem }
/* .filtre-btn — styles globaux dans style.css */

/* Bannière ruptures */
.rupture-banner {
  display:flex;align-items:center;justify-content:space-between;gap:1rem;
  background:linear-gradient(135deg,rgba(220,38,38,.06),rgba(220,38,38,.02));
  border:1.5px solid rgba(220,38,38,.2);border-radius:1rem;
  padding:.875rem 1.25rem;margin-bottom:1.125rem;
}
.rupture-banner-left { display:flex;align-items:center;gap:.875rem }
.rupture-icon {
  width:40px;height:40px;border-radius:.75rem;
  background:rgba(220,38,38,.1);color:#DC2626;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.rupture-banner-titre { font-weight:700;font-size:.9rem;color:#DC2626 }
.rupture-banner-sub   { font-size:.78rem;color:var(--color-text-muted);margin-top:.125rem }

/* Colonne URL */
.url-cell  { display:flex;align-items:center;gap:.35rem;font-size:.75rem;color:#0284C7;max-width:120px }
.url-texte { overflow:hidden;text-overflow:ellipsis;white-space:nowrap }

/* Bouton Commander */
.btn-commander {
  display:inline-flex;align-items:center;gap:.35rem;
  padding:.35rem .75rem;border-radius:.625rem;border:none;cursor:pointer;
  background:linear-gradient(135deg,#F97316,#DC2626);color:white;
  font-size:.75rem;font-weight:700;white-space:nowrap;
  transition:transform .18s,box-shadow .18s;
  box-shadow:0 3px 10px rgba(220,38,38,.25);
}
.btn-commander:hover { transform:translateY(-2px);box-shadow:0 6px 18px rgba(220,38,38,.38) }

/* Stock bars */
.stock-bar-wrap{ width:60px;height:5px;background:#E2E8F0;border-radius:9999px;overflow:hidden;margin-bottom:2px }
.stock-bar    { height:100%;border-radius:9999px;transition:width .3s }
.bar-rouge    { background:var(--color-danger) }
.bar-orange   { background:var(--color-warning) }
.bar-vert     { background:var(--color-green) }
.stock-val    { font-size:.82rem;font-weight:700 }
.val-rouge    { color:var(--color-danger) }
.val-orange   { color:var(--color-warning) }
.val-vert     { color:var(--color-green) }
.row-rupture  { background:rgba(220,38,38,0.04) }
.row-bas      { background:rgba(245,158,11,0.04) }

/* Modal Commander */
.modal-commander-box { max-width:560px }

.cmd-header { background:linear-gradient(135deg,#FFF7ED,#FEF2F2) }
.cmd-header-left { display:flex;align-items:center;gap:.875rem;flex:1;min-width:0 }
.cmd-header-icon {
  width:48px;height:48px;border-radius:1rem;flex-shrink:0;
  background:linear-gradient(135deg,#F97316,#DC2626);color:white;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 16px rgba(220,38,38,.3);
}
.cmd-header-sub { display:flex;align-items:center;gap:.5rem;font-size:.8rem;color:var(--color-text-muted);margin-top:.25rem;flex-wrap:wrap }

.cmd-body { padding:1.5rem;display:flex;flex-direction:column;gap:1.25rem }

/* Info médicament */
.cmd-med-info {
  display:grid;grid-template-columns:1fr 1fr;gap:.625rem;
  background:#F8FAFC;border:1px solid #E2E8F0;border-radius:.875rem;padding:1rem;
}
.cmd-info-item  { display:flex;flex-direction:column;gap:.2rem }
.cmd-info-label { font-size:.7rem;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em }
.cmd-info-val   { font-size:.84rem;font-weight:600;color:var(--color-text) }

/* Section URL */
.cmd-section { display:flex;flex-direction:column;gap:.625rem }
.cmd-label   { display:flex;align-items:center;gap:.375rem;font-size:.82rem;font-weight:700;color:var(--color-text) }
.cmd-url-row { display:flex;gap:.5rem }
.cmd-url-input { flex:1;min-width:0 }
.cmd-save-btn  { flex-shrink:0;display:inline-flex;align-items:center;gap:.3rem;white-space:nowrap }

.cmd-hint {
  display:flex;align-items:flex-start;gap:.375rem;
  font-size:.77rem;color:var(--color-text-muted);
  background:#F0F9FF;border:1px solid #BAE6FD;border-radius:.625rem;
  padding:.5rem .75rem;
}

/* Feedback */
.feedback-url {
  display:inline-flex;align-items:center;gap:.375rem;
  padding:.4rem .875rem;border-radius:.625rem;font-size:.8rem;font-weight:600;border:1px solid;
}
.feedback-ok  { background:rgba(74,222,128,.1);color:#15803D;border-color:rgba(74,222,128,.3) }
.feedback-err { background:rgba(248,113,113,.1);color:#DC2626;border-color:rgba(248,113,113,.3) }

.toast-enter-active,.toast-leave-active { transition:opacity .2s,transform .2s }
.toast-enter-from,.toast-leave-to       { opacity:0;transform:translateY(-6px) }

/* Bouton accéder fournisseur */
.btn-acceder-fournisseur {
  display:flex;align-items:center;justify-content:center;gap:.75rem;
  width:100%;padding:1rem 1.5rem;border-radius:1rem;border:none;cursor:pointer;
  font-family:var(--font-display);font-size:1rem;font-weight:700;
  transition:transform .2s,box-shadow .2s;
}
.btn-acceder-active {
  background:linear-gradient(135deg,#F97316,#DC2626);color:white;
  box-shadow:0 6px 24px rgba(220,38,38,.35);
}
.btn-acceder-active:hover { transform:translateY(-3px);box-shadow:0 12px 36px rgba(220,38,38,.45) }
.btn-acceder-disabled {
  background:#E2E8F0;color:#94A3B8;cursor:not-allowed;
}
.btn-acceder-arr { transition:transform .2s }
.btn-acceder-active:hover .btn-acceder-arr { transform:translateX(4px) }

.cmd-url-preview {
  display:flex;align-items:center;gap:.375rem;
  font-size:.75rem;color:var(--color-text-muted);text-align:center;justify-content:center;
  word-break:break-all;
}

/* Communs */
.deux-cols    { display:grid;grid-template-columns:1fr 1fr;gap:.875rem }
@media(max-width:500px){ .deux-cols { grid-template-columns:1fr } }
.field        { display:flex;flex-direction:column;gap:.375rem }
.field-label  { font-size:.8rem;font-weight:600;color:var(--color-text-muted) }
.vide-center  { display:flex;flex-direction:column;align-items:center;padding:4rem 1rem }
.modal-overlay{ position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem }
.modal-box    { background:white;border-radius:1.25rem;width:100%;max-width:520px;max-height:90vh;overflow-y:auto }
.modal-header { display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #F1F5F9;gap:.75rem }
.modal-titre  { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:1rem;font-weight:700 }
.modal-close  { background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex;flex-shrink:0 }
.modal-body   { padding:1.5rem;display:flex;flex-direction:column;gap:1rem }
.modal-footer { display:flex;justify-content:flex-end;gap:.75rem;padding-top:.5rem }
.alert-erreur { display:flex;align-items:center;gap:.5rem;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,.25);color:var(--color-danger);border-radius:.75rem;padding:.625rem .875rem;font-size:.83rem }
.spin         { animation:spin 1s linear infinite }
@keyframes spin    { from{ transform:rotate(0deg) } to{ transform:rotate(360deg) } }
.modal-fade-enter-active,.modal-fade-leave-active { transition:all .25s ease }
.modal-fade-enter-from,.modal-fade-leave-to { opacity:0 }
.skeleton-block{ background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.625rem;animation:shimmer 1.5s infinite }
@keyframes shimmer{ 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }
</style>
