<template>
  <div class="fac-wrap">

    <!-- ══ EN-TÊTE ══════════════════════════════════════════════ -->
    <div class="fac-header" style="animation:fadeInUp .4s ease both">
      <div class="fac-header-left">
        <div class="fac-header-icon"><Receipt :size="22" /></div>
        <div>
          <h1 class="page-titre">Mes factures</h1>
          <p class="page-sub">{{ factures.length }} facture(s) au total</p>
        </div>
      </div>
    </div>

    <!-- ══ STATS ════════════════════════════════════════════════ -->
    <div class="fac-stats" style="animation:fadeInUp .4s ease .06s both">
      <div class="fs-card fs-total">
        <div class="fs-glow"></div>
        <div class="fs-icon"><Receipt :size="20" /></div>
        <div class="fs-body">
          <div class="fs-val">{{ totalFactures.toLocaleString('fr-SN') }}</div>
          <div class="fs-lbl">Total FCFA</div>
        </div>
        <div class="fs-deco"></div>
      </div>
      <div class="fs-card fs-impaye">
        <div class="fs-glow"></div>
        <div class="fs-icon"><AlertCircle :size="20" /></div>
        <div class="fs-body">
          <div class="fs-val">{{ totalImpaye.toLocaleString('fr-SN') }}</div>
          <div class="fs-lbl">Impayé FCFA</div>
        </div>
        <div class="fs-deco"></div>
      </div>
      <div class="fs-card fs-paye">
        <div class="fs-glow"></div>
        <div class="fs-icon"><CheckCircle :size="20" /></div>
        <div class="fs-body">
          <div class="fs-val">{{ totalPaye.toLocaleString('fr-SN') }}</div>
          <div class="fs-lbl">Payé FCFA</div>
        </div>
        <div class="fs-deco"></div>
      </div>
      <div class="fs-card fs-nb">
        <div class="fs-glow"></div>
        <div class="fs-icon"><FileText :size="20" /></div>
        <div class="fs-body">
          <div class="fs-val">{{ factures.filter(f => f.statut === 'EN_ATTENTE').length }}</div>
          <div class="fs-lbl">En attente</div>
        </div>
        <div class="fs-deco"></div>
      </div>
    </div>

    <!-- ══ FILTRES ══════════════════════════════════════════════ -->
    <div class="filtres-tabs" style="animation:fadeInUp .4s ease .1s both">
      <button v-for="f in filtresDef" :key="f.val"
        class="filtre-btn" :class="[{ active: filtre === f.val }, f.cls]"
        @click="filtre = f.val">
        <component :is="f.icone" :size="14" />
        <span class="fb-label">{{ f.label }}</span>
        <span v-if="f.count > 0" class="filtre-badge">{{ f.count }}</span>
      </button>
    </div>

    <!-- ══ SKELETON ══════════════════════════════════════════════ -->
    <div v-if="chargement" class="skel-list">
      <div class="skel-card" v-for="i in 4" :key="i"></div>
    </div>

    <!-- ══ CARTES FACTURES ══════════════════════════════════════ -->
    <div v-else-if="facturesFiltrees.length" class="fac-list">
      <div
        v-for="(f, idx) in facturesFiltrees"
        :key="f.id"
        class="fac-card"
        :class="cardClass(f.statut)"
        :style="{ animationDelay: (idx * 0.07) + 's' }"
      >
        <!-- Barre de statut -->
        <div class="fac-strip" :class="stripClass(f.statut)"></div>

        <!-- Corps principal -->
        <div class="fac-body">
          <div class="fac-top">
            <!-- Numéro + date -->
            <div class="fac-id-block">
              <div class="fac-num">#{{ String(f.id).padStart(5,'0') }}</div>
              <div class="fac-date">
                <CalendarDays :size="12" />
                {{ fmt(f.createdAt || f.date) }}
              </div>
            </div>

            <!-- Montant (élément central, très visible) -->
            <div class="fac-montant-block">
              <div class="fac-montant">{{ f.montantTotal.toLocaleString('fr-SN') }}</div>
              <div class="fac-devise">FCFA</div>
            </div>

            <!-- Statut + actions -->
            <div class="fac-right">
              <span class="fac-chip" :class="chipClass(f.statut)">
                <component :is="chipIcone(f.statut)" :size="10" />
                {{ lblStatut(f.statut) }}
              </span>
              <div class="fac-btns">
                <button
                  v-if="f.statut === 'EN_ATTENTE'"
                  class="btn-payer"
                  @click="ouvrirPaiement(f)"
                >
                  <CreditCard :size="14" />
                  <span>Payer</span>
                </button>
                <button
                  class="btn-toggle"
                  :class="{ open: detail === f.id }"
                  @click="detail = detail === f.id ? null : f.id"
                  title="Voir les détails"
                >
                  <ChevronDown :size="15" />
                </button>
              </div>
            </div>
          </div>

          <!-- Mode de paiement si payé -->
          <div v-if="f.paiements?.length" class="fac-paid-info">
            <div class="paid-icon"><CheckCircle :size="13" /></div>
            <span>Payé via <strong>{{ lblMode(f.paiements[0].mode) }}</strong></span>
            <span class="paid-ref">· réf. {{ f.paiements[0].reference }}</span>
          </div>

          <!-- Lignes de détail -->
          <div v-if="f.lignes?.length" class="fac-lignes-preview">
            <span v-for="l in f.lignes.slice(0,2)" :key="l.id" class="ligne-pill">
              {{ l.description }}
            </span>
            <span v-if="f.lignes.length > 2" class="ligne-pill ligne-more">
              +{{ f.lignes.length - 2 }} autre(s)
            </span>
          </div>
        </div>

        <!-- Détail déroulant -->
        <Transition name="slide-down">
          <div v-if="detail === f.id" class="fac-detail">
            <div class="fac-detail-titre">
              <Package :size="14" /> Lignes de facturation
            </div>
            <div class="fac-detail-lignes">
              <div v-for="l in f.lignes" :key="l.id" class="det-ligne">
                <span class="det-desc">{{ l.description }}</span>
                <span class="det-montant">{{ l.montant.toLocaleString('fr-SN') }} FCFA</span>
              </div>
            </div>
            <div class="fac-detail-total">
              <span>Total</span>
              <span class="det-total-val">{{ f.montantTotal.toLocaleString('fr-SN') }} FCFA</span>
            </div>

            <!-- Paiements détail -->
            <template v-if="f.paiements?.length">
              <div class="fac-detail-titre" style="margin-top:.875rem">
                <ReceiptText :size="14" /> Paiements enregistrés
              </div>
              <div v-for="p in f.paiements" :key="p.id" class="pay-detail-row">
                <div class="pay-detail-left">
                  <div class="pay-mode-badge">{{ lblMode(p.mode) }}</div>
                  <span class="pay-ref-mono">{{ p.reference }}</span>
                </div>
                <span class="pay-statut-chip">
                  <CheckCircle :size="10" />
                  {{ p.statut === 'REUSSI' ? 'Confirmé' : p.statut }}
                </span>
              </div>
            </template>
          </div>
        </Transition>
      </div>
    </div>

    <!-- ══ VIDE ══════════════════════════════════════════════════ -->
    <div v-else class="vide-block">
      <div class="vide-icon"><Receipt :size="36" /></div>
      <p class="vide-titre">Aucune facture</p>
      <p class="vide-sub">
        {{ filtre === 'tous'
          ? 'Vos factures apparaîtront ici après une consultation.'
          : `Aucune facture « ${lblStatut(filtre)} »` }}
      </p>
    </div>

    <!-- ══ MODAL PAIEMENT ════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="modalPaiement" class="modal-overlay" @click.self="fermerModal">
          <div class="modal-box">

            <!-- Étape 1 : Choisir le mode -->
            <template v-if="etape === 1">
              <div class="modal-header">
                <div class="modal-header-left">
                  <div class="modal-icon"><CreditCard :size="20" /></div>
                  <div>
                    <h2 class="modal-titre">Payer la facture</h2>
                    <p class="modal-sub">Choisissez votre mode de paiement</p>
                  </div>
                </div>
                <button class="modal-close" @click="fermerModal"><X :size="20" /></button>
              </div>

              <div class="modal-body">
                <!-- Récap facture stylisé -->
                <div class="recap-card">
                  <div class="recap-gradient"></div>
                  <div class="recap-content">
                    <div class="recap-row">
                      <span class="recap-lbl">Référence</span>
                      <span class="recap-val recap-mono">#{{ String(factureActive.id).padStart(5,'0') }}</span>
                    </div>
                    <div class="recap-row">
                      <span class="recap-lbl">Date</span>
                      <span class="recap-val">{{ fmt(factureActive.createdAt || factureActive.date) }}</span>
                    </div>
                    <div class="recap-sep"></div>
                    <div class="recap-row recap-total-row">
                      <span class="recap-lbl-total">Montant à payer</span>
                      <span class="recap-montant">{{ factureActive.montantTotal.toLocaleString('fr-SN') }} <small>FCFA</small></span>
                    </div>
                  </div>
                </div>

                <!-- Modes de paiement -->
                <p class="modes-label"><Smartphone :size="13" /> Mode de paiement</p>
                <div class="modes-grid">
                  <button
                    v-for="m in modes" :key="m.id"
                    class="mode-btn" :class="{ active: modeChoisi === m.id }"
                    @click="modeChoisi = m.id"
                  >
                    <div class="mode-icone" :style="!m.logo ? { background: m.couleur } : {}">
                      <img v-if="m.logo" :src="m.logo" :alt="m.nom" class="mode-logo" />
                      <Banknote v-else :size="20" color="white" />
                    </div>
                    <div class="mode-infos">
                      <div class="mode-nom">{{ m.nom }}</div>
                      <div class="mode-type">{{ m.type }}</div>
                    </div>
                    <div v-if="modeChoisi === m.id" class="mode-check">
                      <CheckCircle :size="18" style="color:#22C55E" />
                    </div>
                  </button>
                </div>

                <!-- Téléphone -->
                <Transition name="slide-down">
                  <div v-if="modeChoisi && modeChoisi !== 'ESPECES'" class="tel-section">
                    <label class="tel-label"><Phone :size="13" /> Numéro de téléphone</label>
                    <div class="tel-wrap">
                      <span class="tel-flag">🇸🇳</span>
                      <span class="tel-prefix">+221</span>
                      <input
                        v-model="telephone"
                        type="tel" class="tel-input"
                        placeholder="77 000 00 00"
                        maxlength="10"
                        @input="telephone = telephone.replace(/\D/g,'')"
                      />
                    </div>
                  </div>
                </Transition>

                <div v-if="erreur" class="alert-erreur">
                  <AlertCircle :size="15" /> {{ erreur }}
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn-annuler" @click="fermerModal">Annuler</button>
                <button
                  class="btn-confirmer"
                  :disabled="!modeChoisi || (modeChoisi !== 'ESPECES' && telephone.length < 9)"
                  @click="confirmerPaiement"
                >
                  <Lock :size="14" />
                  Confirmer le paiement
                </button>
              </div>
            </template>

            <!-- Étape 2 : Traitement -->
            <template v-if="etape === 2">
              <div class="etape-processing">
                <div class="spinner-wrap">
                  <div class="spinner-outer"></div>
                  <div class="spinner-inner"></div>
                  <div class="spinner-dot"></div>
                </div>
                <div class="processing-titre">Traitement en cours…</div>
                <div class="processing-sub">
                  {{ modeChoisi === 'ESPECES' ? 'Enregistrement du paiement…' : `Connexion sécurisée à ${modeCourant?.nom}…` }}
                </div>
                <div class="processing-secure">
                  <Lock :size="12" /> Connexion sécurisée SSL
                </div>
              </div>
            </template>

            <!-- Étape 3 : Succès -->
            <template v-if="etape === 3">
              <div class="etape-succes">
                <div class="succes-bg-ring"></div>
                <div class="succes-cercle">
                  <CheckCircle :size="48" />
                </div>
                <h3 class="succes-titre">Paiement confirmé !</h3>
                <p class="succes-sub">Votre paiement a été enregistré avec succès.</p>

                <div class="succes-ref-card">
                  <div class="succes-ref-lbl">Référence de transaction</div>
                  <div class="succes-ref-code">{{ referenceRetour }}</div>
                </div>

                <div class="succes-details">
                  <div class="sd-row">
                    <span class="sd-lbl">Montant payé</span>
                    <span class="sd-val">{{ factureActive.montantTotal.toLocaleString('fr-SN') }} FCFA</span>
                  </div>
                  <div class="sd-row">
                    <span class="sd-lbl">Mode</span>
                    <span class="sd-val">{{ modeCourant?.nom }}</span>
                  </div>
                  <div class="sd-row" v-if="telephone">
                    <span class="sd-lbl">Numéro</span>
                    <span class="sd-val">+221 {{ telephone }}</span>
                  </div>
                </div>

                <button class="btn-fermer" @click="fermerModal">
                  <Check :size="16" /> Fermer
                </button>
              </div>
            </template>

          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Receipt, AlertCircle, CheckCircle, ChevronDown, Package, FileText,
  CreditCard, Phone, X, ArrowRight, Check, ReceiptText, Banknote,
  CalendarDays, Lock, Smartphone,
} from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'
import logoOrange from '../../../image medicale/orangeMONEY.jpeg'
import logoWave   from '../../../image medicale/wave.jpeg'
import logoMixx   from '../../../image medicale/Mixx by Yas .jpeg'

const api = useApi()
const { fmt } = useDate()

const chargement      = ref(true)
const factures        = ref([])
const detail          = ref(null)
const filtre          = ref('tous')
const modalPaiement   = ref(false)
const factureActive   = ref(null)
const modeChoisi      = ref('')
const telephone       = ref('')
const etape           = ref(1)
const erreur          = ref('')
const referenceRetour = ref('')

const totalFactures = computed(() => factures.value.reduce((s, f) => s + f.montantTotal, 0))
const totalImpaye   = computed(() => factures.value.filter(f => f.statut !== 'PAYEE').reduce((s, f) => s + f.montantTotal, 0))
const totalPaye     = computed(() => factures.value.filter(f => f.statut === 'PAYEE').reduce((s, f) => s + f.montantTotal, 0))

const filtresDef = computed(() => [
  { val: 'tous',       label: 'Toutes',      icone: Receipt,       count: 0,                                                              cls: 'fb-green'  },
  { val: 'EN_ATTENTE', label: 'En attente',  icone: AlertCircle,   count: factures.value.filter(f => f.statut === 'EN_ATTENTE').length,   cls: 'fb-red'    },
  { val: 'PAYEE',      label: 'Payées',      icone: CheckCircle,   count: factures.value.filter(f => f.statut === 'PAYEE').length,        cls: 'fb-emerald'},
  { val: 'ANNULEE',    label: 'Annulées',    icone: X,             count: factures.value.filter(f => f.statut === 'ANNULEE').length,      cls: 'fb-gray'   },
])

const facturesFiltrees = computed(() =>
  filtre.value === 'tous' ? factures.value : factures.value.filter(f => f.statut === filtre.value)
)

const modeCourant = computed(() => modes.find(m => m.id === modeChoisi.value))

const modes = [
  { id: 'ORANGE_MONEY', nom: 'Orange Money', type: 'Mobile Money',       logo: logoOrange, couleur: '#FF6600' },
  { id: 'WAVE',         nom: 'Wave',         type: 'Mobile Money',       logo: logoWave,   couleur: '#1A78C2' },
  { id: 'FREE_MONEY',   nom: 'Mixx by Yas',  type: 'Mobile Money',       logo: logoMixx,   couleur: '#8B5CF6' },
  { id: 'ESPECES',      nom: 'Espèces',      type: 'Paiement sur place', logo: null,       couleur: '#15803D' },
]

onMounted(async () => {
  try { factures.value = await api.get('/patient/factures') }
  finally { chargement.value = false }
})

function ouvrirPaiement(facture) {
  factureActive.value   = facture
  modeChoisi.value      = ''
  telephone.value       = ''
  erreur.value          = ''
  etape.value           = 1
  referenceRetour.value = ''
  modalPaiement.value   = true
}

function fermerModal() { modalPaiement.value = false }

async function confirmerPaiement() {
  erreur.value = ''
  if (!modeChoisi.value) return
  if (modeChoisi.value !== 'ESPECES' && telephone.value.length < 9) {
    erreur.value = 'Numéro de téléphone invalide (9 chiffres minimum).'
    return
  }
  etape.value = 2
  try {
    const operateur = modeChoisi.value === 'ESPECES' ? undefined : modeChoisi.value
    const body = {
      mode: modeChoisi.value === 'ESPECES' ? 'ESPECES' : 'MOBILE_MONEY',
      ...(operateur && { operateur }),
      ...(telephone.value && { telephone: telephone.value }),
    }
    await new Promise(r => setTimeout(r, 1800))
    const res = await api.post(`/patient/factures/${factureActive.value.id}/payer`, body)
    referenceRetour.value = res.reference
    factures.value = await api.get('/patient/factures')
    factureActive.value = factures.value.find(f => f.id === factureActive.value.id) || factureActive.value
    etape.value = 3
  } catch (e) {
    etape.value = 1
    erreur.value = e?.message || 'Erreur lors du paiement, veuillez réessayer.'
  }
}

function lblStatut(s)   { return { PAYEE: 'Payée', EN_ATTENTE: 'En attente', ANNULEE: 'Annulée', PARTIELLE: 'Partielle' }[s] || s }
function lblMode(m)     { return { ESPECES: 'Espèces', CARTE: 'Carte', MOBILE_MONEY: 'Mobile Money', ORANGE_MONEY: 'Orange Money', WAVE: 'Wave', FREE_MONEY: 'Mixx by Yas', ASSURANCE: 'Assurance', CHEQUE: 'Chèque' }[m] || m }
function cardClass(s)   { return { PAYEE: 'card-payee', EN_ATTENTE: 'card-attente', ANNULEE: 'card-annulee' }[s] || '' }
function chipClass(s)   { return { PAYEE: 'chip-green', EN_ATTENTE: 'chip-red', ANNULEE: 'chip-gray', PARTIELLE: 'chip-amber' }[s] || 'chip-gray' }
function chipIcone(s)   { return { PAYEE: CheckCircle, EN_ATTENTE: AlertCircle, ANNULEE: X, PARTIELLE: AlertCircle }[s] || AlertCircle }
function stripClass(s)  { return { PAYEE: 'strip-green', EN_ATTENTE: 'strip-red', ANNULEE: 'strip-gray' }[s] || 'strip-gray' }
</script>

<style scoped>
@keyframes fadeInUp  { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:none } }
@keyframes shimmer   { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
@keyframes cardEnter { from { opacity:0; transform:translateY(14px) scale(.98) } to { opacity:1; transform:none } }
@keyframes spin      { to { transform:rotate(360deg) } }
@keyframes spinRev   { to { transform:rotate(-360deg) } }
@keyframes pulse     { 0%,100% { transform:scale(1); opacity:1 } 50% { transform:scale(.85); opacity:.7 } }
@keyframes succesIn  { from { transform:scale(.5); opacity:0 } to { transform:scale(1); opacity:1 } }
@keyframes ringExpand{ from { transform:scale(1); opacity:.6 } to { transform:scale(2.4); opacity:0 } }

.fac-wrap { display:flex; flex-direction:column; gap:1.25rem; }

/* ── En-tête ── */
.fac-header       { display:flex; align-items:center; justify-content:space-between; }
.fac-header-left  { display:flex; align-items:center; gap:.875rem; }
.fac-header-icon  {
  width:46px; height:46px; border-radius:1rem;
  background:linear-gradient(135deg,#4ADE80,#059669); color:white;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 16px rgba(34,197,94,.3);
}
.page-titre { font-family:var(--font-display); font-size:1.2rem; font-weight:800; color:var(--color-text); }
.page-sub   { font-size:.78rem; color:var(--color-text-muted); margin-top:.1rem; }

/* ── Stats ── */
.fac-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:.875rem; }
@media(max-width:700px) { .fac-stats { grid-template-columns:repeat(2,1fr) } }

.fs-card {
  border-radius:1.125rem; padding:1.125rem 1rem;
  display:flex; align-items:center; gap:.875rem;
  position:relative; overflow:hidden;
  border:1.5px solid transparent;
  box-shadow:0 2px 12px rgba(0,0,0,.05);
  animation:cardEnter .5s ease both;
  transition:transform .25s, box-shadow .25s;
}
.fs-card:hover { transform:translateY(-3px); }
.fs-glow {
  position:absolute; inset:0;
  background:radial-gradient(circle at 20% 50%, var(--glow-color) 0%, transparent 70%);
  opacity:0; transition:opacity .3s;
}
.fs-card:hover .fs-glow { opacity:1; }
.fs-deco {
  position:absolute; top:-16px; right:-16px;
  width:64px; height:64px; border-radius:50%;
  background:var(--deco-color); opacity:.5;
  transition:transform .3s;
}
.fs-card:hover .fs-deco { transform:scale(1.4); }
.fs-icon {
  width:44px; height:44px; border-radius:.875rem; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  background:var(--icon-bg); color:var(--icon-color); position:relative; z-index:1;
}
.fs-body    { position:relative; z-index:1; }
.fs-val     { font-family:var(--font-display); font-size:1.2rem; font-weight:800; color:var(--val-color); line-height:1; }
.fs-lbl     { font-size:.68rem; color:var(--color-text-muted); margin-top:.2rem; font-weight:500; }

.fs-total   { background:#fff; border-color:#E2E8F0; --glow-color:rgba(34,197,94,.08); --deco-color:rgba(34,197,94,.08); --icon-bg:rgba(34,197,94,.1); --icon-color:#16A34A; --val-color:var(--color-text); }
.fs-impaye  { background:linear-gradient(135deg,rgba(239,68,68,.04),rgba(220,38,38,.03)); border-color:rgba(239,68,68,.15); --glow-color:rgba(239,68,68,.08); --deco-color:rgba(239,68,68,.06); --icon-bg:rgba(239,68,68,.08); --icon-color:#DC2626; --val-color:#DC2626; }
.fs-paye    { background:linear-gradient(135deg,rgba(34,197,94,.05),rgba(5,150,105,.04)); border-color:rgba(34,197,94,.2); --glow-color:rgba(34,197,94,.1); --deco-color:rgba(34,197,94,.08); --icon-bg:rgba(34,197,94,.1); --icon-color:#16A34A; --val-color:#16A34A; }
.fs-nb      { background:linear-gradient(135deg,rgba(245,158,11,.05),rgba(217,119,6,.03)); border-color:rgba(245,158,11,.2); --glow-color:rgba(245,158,11,.08); --deco-color:rgba(245,158,11,.06); --icon-bg:rgba(245,158,11,.1); --icon-color:#D97706; --val-color:#D97706; }

/* ── Filtres — styles globaux dans style.css ── */

/* ── Skeleton ── */
.skel-list { display:flex; flex-direction:column; gap:.875rem; }
.skel-card {
  height:96px;
  background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);
  background-size:200% 100%; border-radius:1.25rem; animation:shimmer 1.5s infinite;
}

/* ── Cartes factures ── */
.fac-list { display:flex; flex-direction:column; gap:.875rem; }
.fac-card {
  background:#fff; border:1.5px solid #E2E8F0; border-radius:1.25rem;
  overflow:hidden; display:flex; flex-direction:column;
  box-shadow:0 2px 12px rgba(0,0,0,.05);
  animation:cardEnter .45s ease both;
  transition:box-shadow .25s, transform .25s;
}
.fac-card:hover { box-shadow:0 8px 32px rgba(0,0,0,.1); transform:translateY(-2px); }
.card-attente { border-color:rgba(239,68,68,.2); }
.card-attente:hover { box-shadow:0 8px 32px rgba(239,68,68,.12); }
.card-payee { border-color:rgba(34,197,94,.2); }
.card-payee:hover { box-shadow:0 8px 32px rgba(34,197,94,.1); }

/* Strip colorée */
.fac-strip { height:4px; flex-shrink:0; }
.strip-green { background:linear-gradient(90deg,#4ADE80,#059669); }
.strip-red   { background:linear-gradient(90deg,#F87171,#DC2626); }
.strip-gray  { background:linear-gradient(90deg,#94A3B8,#64748B); }

/* Corps de la carte */
.fac-body { padding:1.125rem 1.25rem; display:flex; flex-direction:column; gap:.75rem; }
.fac-top  { display:flex; align-items:center; gap:1rem; flex-wrap:wrap; }

/* Numéro + date */
.fac-id-block { display:flex; flex-direction:column; gap:.2rem; flex-shrink:0; min-width:110px; }
.fac-num  { font-family:monospace; font-size:1rem; font-weight:800; color:var(--color-text); letter-spacing:.04em; }
.fac-date { display:flex; align-items:center; gap:.3rem; font-size:.73rem; color:var(--color-text-muted); }

/* Montant — élément central très visible */
.fac-montant-block { flex:1; display:flex; align-items:baseline; gap:.3rem; justify-content:center; }
.fac-montant { font-family:var(--font-display); font-size:1.6rem; font-weight:900; color:var(--color-text); letter-spacing:-.02em; }
.fac-devise  { font-size:.72rem; font-weight:700; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:.08em; }
.card-attente .fac-montant { color:#DC2626; }
.card-payee   .fac-montant { color:#16A34A; }

/* Statut + boutons */
.fac-right  { display:flex; align-items:center; gap:.625rem; flex-shrink:0; flex-wrap:wrap; justify-content:flex-end; }
.fac-chip   {
  display:inline-flex; align-items:center; gap:.3rem;
  font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:.06em;
  padding:.28rem .7rem; border-radius:9999px;
}
.chip-green { background:rgba(74,222,128,.12); color:#16A34A; border:1px solid rgba(74,222,128,.3); }
.chip-red   { background:rgba(248,113,113,.12); color:#DC2626; border:1px solid rgba(248,113,113,.3); }
.chip-amber { background:rgba(252,211,77,.15);  color:#D97706; border:1px solid rgba(252,211,77,.3); }
.chip-gray  { background:rgba(148,163,184,.12); color:#64748B; border:1px solid rgba(148,163,184,.3); }

.fac-btns  { display:flex; gap:.4rem; align-items:center; }
.btn-payer {
  display:inline-flex; align-items:center; gap:.375rem;
  padding:.5rem 1.125rem; border-radius:9999px; border:none; cursor:pointer;
  background:linear-gradient(135deg,#4ADE80,#059669); color:white;
  font-size:.82rem; font-weight:700;
  box-shadow:0 4px 14px rgba(34,197,94,.4);
  transition:all .22s;
}
.btn-payer:hover { transform:translateY(-2px) scale(1.03); box-shadow:0 8px 22px rgba(34,197,94,.55); }

.btn-toggle {
  width:34px; height:34px; border-radius:.625rem;
  border:1.5px solid #E2E8F0; background:white; cursor:pointer;
  color:var(--color-text-muted);
  display:flex; align-items:center; justify-content:center;
  transition:all .2s;
}
.btn-toggle svg { transition:transform .25s; }
.btn-toggle.open { background:rgba(34,197,94,.08); border-color:rgba(34,197,94,.35); color:#16A34A; }
.btn-toggle.open svg { transform:rotate(180deg); }

/* Infos paiement existant */
.fac-paid-info {
  display:inline-flex; align-items:center; gap:.4rem;
  font-size:.76rem; color:#16A34A; font-weight:500;
  background:rgba(34,197,94,.07); border:1px solid rgba(34,197,94,.2);
  border-radius:9999px; padding:.25rem .75rem; width:fit-content;
}
.paid-ref { color:var(--color-text-muted); font-family:monospace; font-size:.7rem; }

/* Lignes preview */
.fac-lignes-preview { display:flex; flex-wrap:wrap; gap:.375rem; }
.ligne-pill {
  display:inline-flex; align-items:center; gap:.25rem;
  background:#F1F5F9; border:1px solid #E2E8F0;
  border-radius:9999px; padding:.22rem .65rem;
  font-size:.71rem; font-weight:500; color:var(--color-text-muted);
  max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.ligne-more { background:rgba(34,197,94,.08); color:#16A34A; border-color:rgba(34,197,94,.2); }

/* Détail déroulant */
.slide-down-enter-active { transition:all .28s ease; }
.slide-down-leave-active { transition:all .2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity:0; transform:translateY(-6px); }

.fac-detail {
  border-top:1.5px dashed #E2E8F0;
  padding:.875rem 1.25rem 1.125rem;
  background:linear-gradient(180deg,#F8FAFC,#fff);
  display:flex; flex-direction:column; gap:.625rem;
}
.fac-detail-titre {
  display:flex; align-items:center; gap:.4rem;
  font-size:.78rem; font-weight:700; color:var(--color-text-muted);
  margin-bottom:.25rem;
}
.fac-detail-lignes { display:flex; flex-direction:column; }
.det-ligne {
  display:flex; justify-content:space-between; align-items:center;
  font-size:.83rem; padding:.4rem 0;
  border-bottom:1px dashed #F1F5F9;
}
.det-desc    { color:var(--color-text-muted); }
.det-montant { font-weight:700; color:var(--color-text); }
.fac-detail-total {
  display:flex; justify-content:space-between; align-items:center;
  font-size:.9rem; font-weight:700; padding:.5rem 0 0; margin-top:.125rem;
  border-top:2px solid #E2E8F0;
}
.det-total-val { color:#16A34A; font-size:1rem; }

.pay-detail-row {
  display:flex; align-items:center; justify-content:space-between;
  background:#F0FDF4; border:1px solid rgba(34,197,94,.2);
  border-radius:.75rem; padding:.5rem .875rem;
}
.pay-detail-left { display:flex; align-items:center; gap:.625rem; }
.pay-mode-badge {
  background:rgba(34,197,94,.12); color:#16A34A;
  border-radius:9999px; padding:.15rem .625rem;
  font-size:.72rem; font-weight:700;
}
.pay-ref-mono  { font-family:monospace; font-size:.75rem; color:var(--color-text-muted); }
.pay-statut-chip {
  display:inline-flex; align-items:center; gap:.25rem;
  font-size:.68rem; font-weight:700; color:#16A34A;
  background:rgba(34,197,94,.1); border-radius:9999px;
  padding:.2rem .6rem;
}

/* ── Vide ── */
.vide-block {
  display:flex; flex-direction:column; align-items:center; gap:.75rem;
  padding:3.5rem 1rem; text-align:center;
}
.vide-icon {
  width:72px; height:72px; border-radius:50%;
  background:rgba(34,197,94,.07); border:2px solid rgba(34,197,94,.15);
  display:flex; align-items:center; justify-content:center; color:#22C55E; opacity:.5;
}
.vide-titre { font-family:var(--font-display); font-size:1rem; font-weight:700; color:var(--color-text); }
.vide-sub   { font-size:.82rem; color:var(--color-text-muted); max-width:320px; line-height:1.6; }

/* ══════ MODAL ══════ */
.modal-overlay {
  position:fixed; inset:0; background:rgba(0,0,0,.55);
  backdrop-filter:blur(4px); z-index:300;
  display:flex; align-items:flex-end; justify-content:center;
}
@media(min-width:560px) { .modal-overlay { align-items:center; padding:1rem; } }

.modal-box {
  background:white; border-radius:1.5rem 1.5rem 0 0;
  width:100%; max-width:480px; max-height:95vh; overflow-y:auto;
  box-shadow:0 -8px 40px rgba(0,0,0,.2);
}
@media(min-width:560px) { .modal-box { border-radius:1.5rem; max-height:90vh; box-shadow:0 20px 60px rgba(0,0,0,.2); } }

.modal-header {
  display:flex; align-items:center; justify-content:space-between;
  padding:1.125rem 1.375rem;
  border-bottom:1px solid #F1F5F9;
}
.modal-header-left { display:flex; align-items:center; gap:.875rem; }
.modal-icon {
  width:42px; height:42px; border-radius:.875rem; flex-shrink:0;
  background:linear-gradient(135deg,#4ADE80,#059669); color:white;
  display:flex; align-items:center; justify-content:center;
}
.modal-titre { font-family:var(--font-display); font-size:1rem; font-weight:800; color:var(--color-text); }
.modal-sub   { font-size:.75rem; color:var(--color-text-muted); margin-top:.1rem; }
.modal-close {
  width:34px; height:34px; border-radius:50%; border:1.5px solid #E2E8F0;
  background:white; cursor:pointer; color:var(--color-text-muted);
  display:flex; align-items:center; justify-content:center; transition:all .2s;
}
.modal-close:hover { background:#F1F5F9; }

.modal-body   { padding:1.25rem 1.375rem; display:flex; flex-direction:column; gap:1rem; }
.modal-footer {
  display:flex; gap:.625rem; padding:1rem 1.375rem;
  border-top:1px solid #F1F5F9; flex-direction:column;
}
@media(min-width:400px) { .modal-footer { flex-direction:row; justify-content:flex-end; } }

/* Récap stylisé */
.recap-card {
  border-radius:1.125rem; overflow:hidden;
  border:1.5px solid rgba(34,197,94,.25);
  position:relative;
}
.recap-gradient {
  position:absolute; inset:0;
  background:linear-gradient(135deg,rgba(74,222,128,.08),rgba(5,150,105,.06));
  pointer-events:none;
}
.recap-content { padding:1rem 1.125rem; position:relative; }
.recap-row     { display:flex; justify-content:space-between; align-items:center; font-size:.84rem; padding:.25rem 0; }
.recap-lbl     { color:var(--color-text-muted); }
.recap-val     { font-weight:600; color:var(--color-text); }
.recap-mono    { font-family:monospace; font-size:.88rem; }
.recap-sep     { height:1px; background:rgba(34,197,94,.2); margin:.5rem 0; }
.recap-total-row { margin-top:.25rem; }
.recap-lbl-total { font-weight:700; color:var(--color-text); }
.recap-montant {
  font-family:var(--font-display); font-size:1.5rem; font-weight:900; color:#16A34A;
}
.recap-montant small { font-size:.65rem; font-weight:700; }

/* Modes de paiement */
.modes-label {
  display:flex; align-items:center; gap:.4rem;
  font-size:.8rem; font-weight:700; color:var(--color-text-muted);
}
.modes-grid { display:grid; grid-template-columns:1fr 1fr; gap:.625rem; }
@media(max-width:380px) { .modes-grid { grid-template-columns:1fr; } }
/* .mode-btn — styles globaux dans style.css */
.mode-icone {
  width:44px; height:44px; border-radius:.75rem; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  overflow:hidden; border:1px solid #E2E8F0;
}
.mode-logo  { width:100%; height:100%; object-fit:cover; }
.mode-infos { flex:1; min-width:0; }
.mode-nom   { font-weight:700; font-size:.84rem; color:var(--color-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mode-type  { font-size:.7rem; color:var(--color-text-muted); margin-top:.1rem; }
.mode-check { flex-shrink:0; }

/* Téléphone */
.tel-section { display:flex; flex-direction:column; gap:.4rem; }
.tel-label {
  display:flex; align-items:center; gap:.375rem;
  font-size:.8rem; font-weight:600; color:var(--color-text-muted);
}
.tel-wrap {
  display:flex; align-items:center;
  border:1.5px solid #E2E8F0; border-radius:.75rem; overflow:hidden;
  background:white; transition:border-color .2s;
}
.tel-wrap:focus-within { border-color:#22C55E; box-shadow:0 0 0 3px rgba(34,197,94,.12); }
.tel-flag   { padding:0 .5rem 0 .75rem; font-size:1.1rem; }
.tel-prefix {
  padding:0 .625rem; font-size:.88rem; font-weight:700; color:var(--color-text-muted);
  border-right:1px solid #E2E8F0; background:#F8FAFC;
  height:44px; display:flex; align-items:center;
}
.tel-input  {
  border:none; outline:none; padding:.625rem .875rem;
  font-size:.88rem; flex:1; background:transparent; color:var(--color-text);
}

.alert-erreur {
  display:flex; align-items:center; gap:.5rem;
  background:rgba(220,38,38,.07); border:1px solid rgba(220,38,38,.25);
  color:#DC2626; border-radius:.875rem; padding:.625rem .875rem;
  font-size:.84rem;
}

/* Boutons footer */
.btn-annuler {
  padding:.6rem 1.25rem; border-radius:.75rem;
  border:1.5px solid #E2E8F0; background:white;
  font-size:.85rem; font-weight:600; color:var(--color-text-muted);
  cursor:pointer; transition:all .2s; flex:1;
}
@media(min-width:400px) { .btn-annuler { flex:none; } }
.btn-annuler:hover { background:#F1F5F9; }
.btn-confirmer {
  display:flex; align-items:center; justify-content:center; gap:.4rem;
  flex:1; padding:.6rem 1.375rem; border-radius:.75rem; border:none; cursor:pointer;
  background:linear-gradient(135deg,#4ADE80,#059669); color:white;
  font-size:.85rem; font-weight:700;
  box-shadow:0 4px 14px rgba(34,197,94,.4); transition:all .2s;
}
@media(min-width:400px) { .btn-confirmer { flex:none; } }
.btn-confirmer:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(34,197,94,.55); }
.btn-confirmer:disabled { opacity:.45; cursor:not-allowed; }

/* ── Étape 2 : Processing ── */
.etape-processing {
  padding:3rem 2rem;
  display:flex; flex-direction:column; align-items:center; gap:1.25rem;
  text-align:center;
}
.spinner-wrap { position:relative; width:72px; height:72px; }
.spinner-outer {
  position:absolute; inset:0; border-radius:50%;
  border:4px solid #E2E8F0; border-top-color:#22C55E;
  animation:spin .9s linear infinite;
}
.spinner-inner {
  position:absolute; inset:10px; border-radius:50%;
  border:3px solid transparent; border-bottom-color:#4ADE80;
  animation:spinRev .7s linear infinite;
}
.spinner-dot {
  position:absolute; inset:50%; margin:-5px;
  width:10px; height:10px; border-radius:50%;
  background:#059669; animation:pulse .8s ease-in-out infinite;
}
.processing-titre { font-family:var(--font-display); font-size:1rem; font-weight:800; color:var(--color-text); }
.processing-sub   { font-size:.85rem; color:var(--color-text-muted); }
.processing-secure {
  display:inline-flex; align-items:center; gap:.375rem;
  font-size:.72rem; font-weight:600; color:#16A34A;
  background:rgba(34,197,94,.08); border:1px solid rgba(34,197,94,.2);
  border-radius:9999px; padding:.3rem .875rem;
}

/* ── Étape 3 : Succès ── */
.etape-succes {
  padding:2.5rem 1.75rem;
  display:flex; flex-direction:column; align-items:center; gap:1rem;
  text-align:center; position:relative; overflow:hidden;
}
.succes-bg-ring {
  position:absolute; width:240px; height:240px; border-radius:50%;
  top:50%; left:50%; transform:translate(-50%,-50%);
  background:radial-gradient(circle,rgba(34,197,94,.07) 0%, transparent 70%);
  pointer-events:none;
}
.succes-cercle {
  width:88px; height:88px; border-radius:50%;
  background:linear-gradient(135deg,#4ADE80,#059669); color:white;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 8px 32px rgba(34,197,94,.4);
  animation:succesIn .5s cubic-bezier(.4,0,.2,1) both;
  position:relative; z-index:1;
}
.succes-titre { font-family:var(--font-display); font-size:1.2rem; font-weight:900; color:var(--color-text); }
.succes-sub   { font-size:.85rem; color:var(--color-text-muted); margin-top:-.25rem; }
.succes-ref-card {
  width:100%; background:linear-gradient(135deg,rgba(74,222,128,.08),rgba(5,150,105,.06));
  border:1.5px solid rgba(34,197,94,.25); border-radius:1rem;
  padding:.875rem 1.25rem; text-align:center;
}
.succes-ref-lbl  { font-size:.72rem; color:var(--color-text-muted); margin-bottom:.375rem; }
.succes-ref-code { font-family:monospace; font-size:1.1rem; font-weight:900; color:#16A34A; letter-spacing:.12em; }
.succes-details  {
  width:100%; border:1.5px solid #E2E8F0; border-radius:.875rem; overflow:hidden;
}
.sd-row {
  display:flex; justify-content:space-between; align-items:center;
  padding:.625rem 1rem; border-bottom:1px solid #F1F5F9;
  font-size:.84rem;
}
.sd-row:last-child { border-bottom:none; }
.sd-lbl { color:var(--color-text-muted); }
.sd-val { font-weight:700; color:var(--color-text); }
.btn-fermer {
  display:flex; align-items:center; justify-content:center; gap:.4rem;
  width:100%; padding:.7rem; border-radius:.875rem; border:none; cursor:pointer;
  background:linear-gradient(135deg,#4ADE80,#059669); color:white;
  font-size:.88rem; font-weight:700;
  box-shadow:0 4px 16px rgba(34,197,94,.35); transition:all .2s;
  margin-top:.25rem;
}
.btn-fermer:hover { transform:translateY(-1px); box-shadow:0 6px 22px rgba(34,197,94,.5); }

/* Modal anim */
.modal-fade-enter-active,.modal-fade-leave-active { transition:all .28s ease; }
.modal-fade-enter-from,.modal-fade-leave-to { opacity:0; }
.modal-fade-enter-from .modal-box { transform:translateY(20px) scale(.97); }
</style>
