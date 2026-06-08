<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-titre">Facturation</h1>
        <p style="color:var(--color-text-muted);font-size:.875rem">{{ factures.length }} facture(s)</p>
      </div>
    </div>

    <!-- Filtres -->
    <div style="display:flex;gap:.375rem;margin-bottom:1.25rem;flex-wrap:wrap">
      <button v-for="f in filtresDef" :key="f.val" class="filtre-btn" :class="{active:filtre===f.val}" @click="filtre=f.val">
        {{ f.label }}
        <span v-if="f.count>0" class="filtre-count">{{ f.count }}</span>
      </button>
    </div>

    <div v-if="chargement" style="display:flex;flex-direction:column;gap:.75rem">
      <div class="skeleton-block" v-for="i in 5" :key="i" style="height:72px"></div>
    </div>

    <div v-else-if="facturesFiltrees.length" class="card table-wrap">
      <table class="table-tm">
        <thead>
          <tr>
            <th>Date</th>
            <th>Référence</th>
            <th>Patient</th>
            <th>Montant</th>
            <th>Assurance</th>
            <th>Patient doit</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in facturesFiltrees" :key="f.id">
            <td style="font-size:.8rem;color:var(--color-text-muted)">{{ fmt(f.createdAt) }}</td>
            <td style="font-family:monospace;font-size:.8rem;font-weight:600">#{{ String(f.id).padStart(5,'0') }}</td>
            <td style="font-size:.85rem;font-weight:600">{{ f.patient.utilisateur.prenom }} {{ f.patient.utilisateur.nom }}</td>
            <td style="font-weight:700;font-size:.88rem">{{ f.montantTotal.toLocaleString('fr-SN') }} FCFA</td>
            <td style="font-size:.8rem;color:var(--color-green)">{{ f.montantAssurance ? f.montantAssurance.toLocaleString('fr-SN')+' FCFA' : '—' }}</td>
            <td style="font-weight:700;color:var(--color-danger);font-size:.88rem">{{ f.montantPatient.toLocaleString('fr-SN') }} FCFA</td>
            <td><span class="badge" :class="statutClass(f.statut)">{{ lblStatut(f.statut) }}</span></td>
            <td>
              <button
                v-if="f.statut==='EN_ATTENTE'"
                class="btn btn-primary btn-sm"
                @click="ouvrirPaiement(f)"
              >
                <CreditCard :size="13" /> Encaisser
              </button>
              <span v-else-if="f.paiements?.length" style="font-size:.75rem;color:var(--color-text-muted)">
                {{ lblMode(f.paiements[0].mode) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="vide-center">
      <Receipt :size="48" style="opacity:.25;margin-bottom:.75rem" />
      <p style="color:var(--color-text-muted)">Aucune facture trouvée</p>
    </div>

    <!-- Modal Paiement -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="factureSelectionnee" class="modal-overlay" @click.self="factureSelectionnee=null">
          <div class="modal-box">
            <div class="modal-header">
              <h2 class="modal-titre"><CreditCard :size="18" style="color:var(--color-primary)" /> Encaisser la facture</h2>
              <button class="modal-close" @click="factureSelectionnee=null"><X :size="20" /></button>
            </div>
            <form @submit.prevent="encaisser" class="modal-body">
              <div v-if="erreur" class="alert-erreur"><AlertCircle :size="14" /> {{ erreur }}</div>

              <!-- Résumé facture -->
              <div class="facture-resume">
                <div class="resume-row">
                  <span>Patient :</span>
                  <span style="font-weight:700">{{ factureSelectionnee.patient.utilisateur.prenom }} {{ factureSelectionnee.patient.utilisateur.nom }}</span>
                </div>
                <div class="resume-row">
                  <span>Montant total :</span>
                  <span style="font-weight:700">{{ factureSelectionnee.montantTotal.toLocaleString('fr-SN') }} FCFA</span>
                </div>
                <div class="resume-row">
                  <span>Part assurance :</span>
                  <span style="color:var(--color-green)">{{ factureSelectionnee.montantAssurance.toLocaleString('fr-SN') }} FCFA</span>
                </div>
                <div class="resume-row" style="border-top:1px solid #E2E8F0;padding-top:.625rem">
                  <span style="font-weight:700">À encaisser :</span>
                  <span style="font-weight:800;font-size:1.05rem;color:var(--color-primary)">{{ factureSelectionnee.montantPatient.toLocaleString('fr-SN') }} FCFA</span>
                </div>
              </div>

              <!-- Mode principal -->
              <div class="field">
                <label class="field-label">Mode de paiement</label>
                <div class="modes-grid">
                  <!-- Mobile Money = section à part -->
                  <button type="button"
                    class="mode-btn" :class="{active:paiementForm.mode==='MOBILE_MONEY'}"
                    @click="paiementForm.mode='MOBILE_MONEY'; paiementForm.operateur = paiementForm.operateur || 'ORANGE_MONEY'">
                    <div class="mode-icone-wrap">
                      <img :src="logoOrange" alt="Mobile Money" class="mode-logo-sm" />
                    </div>
                    Mobile Money
                  </button>
                  <button v-for="m in modes" :key="m.val" type="button"
                    class="mode-btn" :class="{active:paiementForm.mode===m.val}"
                    @click="paiementForm.mode=m.val">
                    <div class="mode-icone-wrap" :style="{ background: m.couleur }">
                      <component :is="m.icone" :size="15" color="white" />
                    </div>
                    {{ m.label }}
                  </button>
                </div>
              </div>

              <!-- Choix opérateur si Mobile Money -->
              <div v-if="paiementForm.mode==='MOBILE_MONEY'" class="field">
                <label class="field-label">Opérateur Mobile Money</label>
                <div class="operateurs-grid">
                  <button v-for="op in operateurs" :key="op.val" type="button"
                    class="op-btn" :class="{active: paiementForm.operateur===op.val}"
                    @click="paiementForm.operateur=op.val">
                    <img :src="op.logo" :alt="op.label" class="op-logo" />
                    <span class="op-label">{{ op.label }}</span>
                    <CheckCircle v-if="paiementForm.operateur===op.val" :size="14" class="op-check" />
                  </button>
                </div>
              </div>

              <div class="field">
                <label class="field-label">Référence (optionnel)</label>
                <input v-model="paiementForm.reference" type="text" class="input" placeholder="N° transaction, reçu…" />
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="factureSelectionnee=null">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="envoi">
                  <Loader2 v-if="envoi" :size="16" class="spin" /><Check v-else :size="16" />
                  {{ envoi ? 'Encaissement…' : 'Confirmer le paiement' }}
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
import { Receipt, CreditCard, Check, X, AlertCircle, Loader2, Banknote, Shield, CheckCircle } from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'
import logoOrange from '../../../image medicale/orangeMONEY.jpeg'
import logoWave   from '../../../image medicale/wave.jpeg'
import logoMixx   from '../../../image medicale/Mixx by Yas .jpeg'

const api = useApi()
const { fmt } = useDate()

const chargement          = ref(true)
const factures            = ref([])
const filtre              = ref('tous')
const factureSelectionnee = ref(null)
const envoi               = ref(false)
const erreur              = ref('')
const paiementForm        = ref({ mode:'ESPECES', operateur: '', reference:'' })

const modes = [
  { val:'ESPECES',      label:'Espèces',      logo: null,        couleur:'#15803D', icone: Banknote },
  { val:'CARTE',        label:'Carte bancaire',logo: null,        couleur:'#1D4ED8', icone: CreditCard },
  { val:'ASSURANCE',    label:'Assurance',    logo: null,        couleur:'#7C3AED', icone: Shield },
]

const operateurs = [
  { val:'ORANGE_MONEY', label:'Orange Money', logo: logoOrange },
  { val:'WAVE',         label:'Wave',         logo: logoWave   },
  { val:'FREE_MONEY',   label:'Mixx by Yas',  logo: logoMixx   },
]

const filtresDef = computed(() => [
  { val:'tous',       label:'Toutes',       count: 0 },
  { val:'EN_ATTENTE', label:'Impayées',     count: factures.value.filter(f=>f.statut==='EN_ATTENTE').length },
  { val:'PAYEE',      label:'Payées',       count: factures.value.filter(f=>f.statut==='PAYEE').length },
])

const facturesFiltrees = computed(() =>
  filtre.value === 'tous' ? factures.value : factures.value.filter(f => f.statut === filtre.value)
)

async function charger() {
  chargement.value = true
  try { factures.value = await api.get('/receptionniste/factures') }
  finally { chargement.value = false }
}

onMounted(charger)

function ouvrirPaiement(f) {
  factureSelectionnee.value = f
  paiementForm.value = { mode:'ESPECES', reference:'' }
  erreur.value = ''
}

async function encaisser() {
  erreur.value = ''; envoi.value = true
  try {
    await api.post(`/receptionniste/factures/${factureSelectionnee.value.id}/encaisser`, {
      mode: paiementForm.value.mode,
      montant: factureSelectionnee.value.montantPatient,
      reference: paiementForm.value.reference || undefined,
      ...(paiementForm.value.mode === 'MOBILE_MONEY' && { operateur: paiementForm.value.operateur }),
    })
    factureSelectionnee.value = null
    await charger()
  } catch(e) { erreur.value = e.message }
  finally { envoi.value = false }
}

function lblStatut(s) { return { EN_ATTENTE:'Impayée', PAYEE:'Payée', ANNULEE:'Annulée', PARTIELLE:'Partielle' }[s] || s }
function statutClass(s) { return { EN_ATTENTE:'badge-warning', PAYEE:'badge-green', ANNULEE:'badge-danger', PARTIELLE:'badge-info' }[s] || 'badge-gray' }
function lblMode(m) { return { ESPECES:'Espèces', MOBILE_MONEY:'Mobile Money', CARTE:'Carte', ASSURANCE:'Assurance' }[m] || m }
</script>

<style scoped>
.page-header  { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;gap:1rem }
.page-titre   { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
/* .filtre-btn, .filtre-count — styles globaux dans style.css */
.vide-center  { display:flex;flex-direction:column;align-items:center;padding:4rem 1rem }
.modal-overlay{ position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:flex-end;justify-content:center;padding:0 }
@media(min-width:560px){ .modal-overlay { align-items:center;padding:1rem } }
.modal-box    { background:white;border-radius:1.25rem 1.25rem 0 0;width:100%;max-width:480px;max-height:95vh;overflow-y:auto }
@media(min-width:560px){ .modal-box { border-radius:1.25rem;max-height:90vh } }
.modal-header { display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #F1F5F9 }
.modal-titre  { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:1rem;font-weight:700 }
.modal-close  { background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex }
.modal-body   { padding:1.5rem;display:flex;flex-direction:column;gap:1rem }
.modal-footer { display:flex;justify-content:flex-end;gap:.75rem;padding-top:.5rem }
.field        { display:flex;flex-direction:column;gap:.375rem }
.field-label  { font-size:.8rem;font-weight:600;color:var(--color-text-muted) }
.facture-resume { background:#F8FAFC;border-radius:.75rem;padding:.875rem 1rem;display:flex;flex-direction:column;gap:.5rem }
.resume-row   { display:flex;justify-content:space-between;align-items:center;font-size:.85rem;color:var(--color-text) }
.modes-grid   { display:grid;grid-template-columns:repeat(2,1fr);gap:.5rem }
@media(max-width:380px){ .modes-grid { grid-template-columns:1fr } }
/* .mode-btn — styles globaux dans style.css */
.mode-icone-wrap { width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden }
.mode-logo-sm { width:100%;height:100%;object-fit:cover }

/* Opérateurs Mobile Money */
.operateurs-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem }
@media(max-width:360px){ .operateurs-grid { grid-template-columns:1fr 1fr } }
.op-btn       { display:flex;flex-direction:column;align-items:center;gap:.375rem;padding:.625rem .5rem;border-radius:.875rem;border:1.5px solid #E2E8F0;background:white;cursor:pointer;transition:all .18s;position:relative }
.op-btn.active { border-color:var(--color-primary);background:rgba(14,159,142,0.06);box-shadow:0 0 0 3px rgba(14,159,142,0.12) }
.op-logo      { width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid #E2E8F0 }
.op-label     { font-size:.7rem;font-weight:600;color:var(--color-text);text-align:center;line-height:1.2 }
.op-check     { color:var(--color-primary);position:absolute;top:.375rem;right:.375rem }
.alert-erreur { display:flex;align-items:center;gap:.5rem;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,.25);color:var(--color-danger);border-radius:.75rem;padding:.625rem .875rem;font-size:.83rem }
.spin         { animation:spin 1s linear infinite }
@keyframes spin{ from{ transform:rotate(0deg) } to{ transform:rotate(360deg) } }
.modal-fade-enter-active,.modal-fade-leave-active { transition:all .25s ease }
.modal-fade-enter-from,.modal-fade-leave-to { opacity:0 }
.skeleton-block{ background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.625rem;animation:shimmer 1.5s infinite }
@keyframes shimmer{ 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }
</style>
