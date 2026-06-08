<template>
  <div class="ordo-wrap">

    <!-- En-tête -->
    <div class="ordo-header">
      <div class="ordo-title-row">
        <div class="ordo-icon"><Pill :size="18" /></div>
        <h1 class="ordo-title">Ordonnances</h1>
        <span class="ordo-count" v-if="!chargement">{{ ordonnances.length }}</span>
      </div>
      <button class="btn-nouvelle" @click="ouvrirModal">
        <Plus :size="15" /> Nouvelle ordonnance
      </button>
    </div>

    <!-- Chargement -->
    <div v-if="chargement" class="skel-list">
      <div class="skel-row" v-for="i in 4" :key="i"></div>
    </div>

    <!-- Vide -->
    <div v-else-if="!ordonnances.length" class="vide-box">
      <div class="vide-icon"><Pill :size="32" /></div>
      <p class="vide-titre">Aucune ordonnance rédigée</p>
      <p class="vide-sub">Créez votre première ordonnance pour un patient</p>
      <button class="btn-nouvelle" style="margin-top:1.25rem" @click="ouvrirModal">
        <Plus :size="14" /> Rédiger une ordonnance
      </button>
    </div>

    <!-- Liste des ordonnances -->
    <div v-else class="ordo-list">
      <div v-for="o in ordonnances" :key="o.id" class="ordo-prescription">

        <!-- Bande latérale colorée selon statut -->
        <div class="ordo-stripe" :class="stripeClass(o.statut)"></div>

        <div class="ordo-inner">

          <!-- Header prescription -->
          <div class="rx-header">
            <div class="rx-left">
              <div class="rx-symbol">℞</div>
              <div>
                <div class="rx-label">ORDONNANCE MÉDICALE</div>
                <div class="rx-date">Émise le {{ fmt(o.createdAt) }}</div>
              </div>
            </div>
            <div class="rx-right">
              <span class="rx-statut" :class="statutClass(o.statut)">
                <component :is="statutIcone(o.statut)" :size="11" />
                {{ lblStatut(o.statut) }}
              </span>
              <div class="rx-num">#{{ o.id }}</div>
            </div>
          </div>

          <!-- Infos patient -->
          <div class="rx-patient">
            <div class="rx-patient-icon"><User :size="14" /></div>
            <div class="rx-patient-info">
              <span class="rx-patient-nom">{{ o.dossier.patient.utilisateur.prenom }} {{ o.dossier.patient.utilisateur.nom }}</span>
              <span class="rx-patient-dossier">Dossier #{{ o.dossier.numeroDossier }}</span>
            </div>
            <div v-if="o.expirationDate" class="rx-expiration">
              <Calendar :size="11" />
              Expire le {{ fmt(o.expirationDate) }}
            </div>
          </div>

          <!-- Médicaments (liste Rx) -->
          <div class="rx-meds">
            <div v-for="(lg, i) in o.lignes" :key="lg.id" class="rx-med-item">
              <div class="rx-med-num">{{ i + 1 }}</div>
              <div class="rx-med-body">
                <div class="rx-med-nom">
                  {{ lg.medicament.nom }}
                  <span v-if="lg.medicament.dosage" class="rx-med-dosage">{{ lg.medicament.dosage }}</span>
                  <span v-if="lg.medicament.forme" class="rx-med-forme">— {{ lg.medicament.forme }}</span>
                </div>
                <div class="rx-med-detail">
                  <span class="rx-chip rx-chip-blue"><Clock :size="9" /> {{ lg.posologie }}</span>
                  <span v-if="lg.duree" class="rx-chip rx-chip-purple"><Calendar :size="9" /> {{ lg.duree }}</span>
                  <span class="rx-chip rx-chip-gray">Qté : {{ lg.quantite }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Instructions + expiration -->
          <div v-if="o.instructions" class="rx-instructions">
            <Info :size="12" />
            <span>{{ o.instructions }}</span>
          </div>

          <!-- Pied signature -->
          <div class="rx-footer">
            <div class="rx-signature">
              <div class="rx-sig-line"></div>
              <div class="rx-sig-label">Signature du médecin</div>
            </div>
            <div class="rx-actions">
              <button class="rx-btn-action" @click="imprimer(o)" title="Imprimer">
                <Printer :size="13" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ── MODAL NOUVELLE ORDONNANCE ──────────────────────────────────────── -->
    <Transition name="fade-modal">
      <div v-if="modal" class="modal-overlay" @click.self="fermerModal">
        <div class="modal-box">

          <!-- Header modal -->
          <div class="modal-header">
            <div class="modal-titre-row">
              <div class="modal-titre-icon"><Pill :size="16" /></div>
              <div>
                <div class="modal-titre">Nouvelle ordonnance</div>
                <div class="modal-sous-titre">Remplissez les informations ci-dessous</div>
              </div>
            </div>
            <button class="close-btn" @click="fermerModal"><X :size="18" /></button>
          </div>

          <form @submit.prevent="soumettre" class="modal-body">
            <div v-if="erreur" class="alert-erreur">
              <AlertCircle :size="14" /> {{ erreur }}
            </div>

            <!-- ① Patient -->
            <div class="form-section">
              <div class="form-section-title"><span class="form-step">1</span> Patient</div>
              <div class="field">
                <label class="field-label"><User :size="12" /> Rechercher un patient</label>
                <div class="patient-search">
                  <Search :size="14" class="search-ico" />
                  <input v-model="recherchePatient" type="text"
                    class="input" style="padding-left:2.25rem"
                    placeholder="Tapez le nom du patient…"
                    @input="rechercherDossiers" />
                  <div v-if="dossiersSuggestions.length" class="suggestions">
                    <div v-for="d in dossiersSuggestions" :key="d.id"
                      class="suggestion-item" @click="selectionnerDossier(d)">
                      <div class="sug-avatar"><User :size="12" /></div>
                      <div>
                        <div class="sug-nom">{{ d.patient.utilisateur.prenom }} {{ d.patient.utilisateur.nom }}</div>
                        <div class="sug-dossier">Dossier #{{ d.numeroDossier }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="dossierSelectionne" class="dossier-sel">
                  <CheckCircle :size="15" />
                  <span>{{ dossierSelectionne.patient.utilisateur.prenom }} {{ dossierSelectionne.patient.utilisateur.nom }}</span>
                  <span class="dossier-sel-num">Dossier #{{ dossierSelectionne.numeroDossier }}</span>
                </div>
              </div>
            </div>

            <!-- ② Médicaments -->
            <div class="form-section">
              <div class="form-section-title"><span class="form-step">2</span> Médicaments prescrits</div>

              <div v-for="(lg, i) in form.lignes" :key="i" class="ligne-form">
                <div class="ligne-header">
                  <div class="ligne-num">{{ i + 1 }}</div>
                  <div class="ligne-rx-label">Médicament {{ i + 1 }}</div>
                  <button type="button" class="remove-btn" @click="form.lignes.splice(i, 1)" title="Supprimer">
                    <X :size="13" />
                  </button>
                </div>

                <!-- Sélection médicament -->
                <div class="field">
                  <label class="field-label">Médicament *</label>
                  <select v-model="lg.medicamentId" class="input" required>
                    <option value="">Sélectionner un médicament…</option>
                    <option v-for="m in medicaments" :key="m.id" :value="m.id">
                      {{ m.nom }}{{ m.dosage ? ' ' + m.dosage : '' }}{{ m.forme ? ' — ' + m.forme : '' }}
                    </option>
                  </select>
                </div>

                <!-- Posologie -->
                <div class="field">
                  <label class="field-label">
                    <Clock :size="11" /> Posologie *
                    <span class="field-hint">exemples ci-dessous</span>
                  </label>
                  <input v-model="lg.posologie" class="input"
                    placeholder="Ex : 1 comprimé 3 fois par jour après les repas" required />
                  <div class="exemples-row">
                    <button v-for="ex in EXEMPLES_POSOLOGIE" :key="ex" type="button"
                      class="ex-chip" @click="lg.posologie = ex">{{ ex }}</button>
                  </div>
                </div>

                <!-- Durée + Quantité -->
                <div class="field-grid">
                  <div class="field">
                    <label class="field-label">
                      <Calendar :size="11" /> Durée du traitement
                    </label>
                    <input v-model="lg.duree" class="input"
                      placeholder="Ex : 7 jours" />
                    <div class="exemples-row">
                      <button v-for="d in EXEMPLES_DUREE" :key="d" type="button"
                        class="ex-chip ex-chip-purple" @click="lg.duree = d">{{ d }}</button>
                    </div>
                  </div>
                  <div class="field">
                    <label class="field-label">Quantité totale</label>
                    <input v-model.number="lg.quantite" type="number" min="1"
                      class="input" placeholder="1" />
                  </div>
                </div>

              </div>

              <button type="button" class="btn-add-ligne" @click="ajouterLigne">
                <Plus :size="14" /> Ajouter un médicament
              </button>
            </div>

            <!-- ③ Options -->
            <div class="form-section">
              <div class="form-section-title"><span class="form-step">3</span> Instructions & options</div>

              <div class="field">
                <label class="field-label"><Info :size="12" /> Instructions générales</label>
                <input v-model="form.instructions" type="text" class="input"
                  placeholder="Ex : Prendre pendant les repas, éviter l'alcool" />
                <div class="exemples-row">
                  <button v-for="ex in EXEMPLES_INSTRUCTIONS" :key="ex" type="button"
                    class="ex-chip ex-chip-teal" @click="form.instructions = ex">{{ ex }}</button>
                </div>
              </div>

              <div class="field">
                <label class="field-label"><Calendar :size="12" /> Date d'expiration (optionnel)</label>
                <input v-model="form.expirationDate" type="date" class="input" />
              </div>
            </div>

            <!-- Actions -->
            <div class="modal-actions">
              <button type="button" class="btn btn-ghost" @click="fermerModal">Annuler</button>
              <button type="submit" class="btn-valider"
                :disabled="envoi || !dossierSelectionne || !form.lignes.length">
                <Loader2 v-if="envoi" :size="15" class="spin" />
                <Check v-else :size="15" />
                {{ envoi ? 'Enregistrement…' : 'Valider l\'ordonnance' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import {
  Pill, Plus, User, Info, Calendar, Clock, X, Check,
  AlertCircle, Loader2, CheckCircle, Printer, Search,
  CheckCircle2, XCircle, AlertTriangle,
} from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { fmt } = useDate()

// ── Exemples rapides ─────────────────────────────────────────────────────────
const EXEMPLES_POSOLOGIE = [
  '1 cp matin',
  '1 cp 2×/j',
  '1 cp 3×/j après repas',
  '2 cp matin à jeun',
  '1 cp soir au coucher',
  '½ cp 2×/j',
]

const EXEMPLES_DUREE = [
  '3 jours', '5 jours', '7 jours', '10 jours', '14 jours', '1 mois', '3 mois',
]

const EXEMPLES_INSTRUCTIONS = [
  'Prendre pendant les repas',
  'Prendre à jeun',
  'Prendre le soir au coucher',
  'Éviter l\'exposition au soleil',
  'Ne pas écraser les comprimés',
]

// ── Données ──────────────────────────────────────────────────────────────────
const chargement  = ref(true)
const ordonnances = ref([])
const medicaments = ref([])
const modal       = ref(false)
const envoi       = ref(false)
const erreur      = ref('')

const recherchePatient    = ref('')
const dossiersSuggestions = ref([])
const dossierSelectionne  = ref(null)
const tousLesDossiers     = ref([])

const form = reactive({
  instructions: '',
  expirationDate: '',
  lignes: [],
})

onMounted(async () => {
  try {
    const [ords, meds, dossiers] = await Promise.all([
      api.get('/medecin/ordonnances'),
      api.get('/medecin/medicaments'),
      api.get('/medecin/dossiers'),
    ])
    ordonnances.value    = ords
    medicaments.value    = meds
    tousLesDossiers.value = dossiers
  } finally { chargement.value = false }
})

function ouvrirModal() {
  modal.value = true
  erreur.value = ''
  recherchePatient.value = ''
  dossierSelectionne.value = null
  dossiersSuggestions.value = []
  form.instructions = ''
  form.expirationDate = ''
  form.lignes = [{ medicamentId: '', posologie: '', duree: '', quantite: 1 }]
}

function fermerModal() { modal.value = false }

function rechercherDossiers() {
  const q = recherchePatient.value.toLowerCase().trim()
  if (!q) { dossiersSuggestions.value = []; return }
  dossiersSuggestions.value = tousLesDossiers.value.filter(d => {
    const p = d.patient.utilisateur
    return `${p.prenom} ${p.nom}`.toLowerCase().includes(q)
  }).slice(0, 6)
}

function selectionnerDossier(d) {
  dossierSelectionne.value  = d
  recherchePatient.value    = `${d.patient.utilisateur.prenom} ${d.patient.utilisateur.nom}`
  dossiersSuggestions.value = []
}

function ajouterLigne() {
  form.lignes.push({ medicamentId: '', posologie: '', duree: '', quantite: 1 })
}

async function soumettre() {
  if (!dossierSelectionne.value) { erreur.value = 'Sélectionnez un patient'; return }
  const lignesValides = form.lignes.filter(l => l.medicamentId && l.posologie)
  if (!lignesValides.length) { erreur.value = 'Ajoutez au moins un médicament avec posologie'; return }

  erreur.value = ''; envoi.value = true
  try {
    await api.post('/medecin/ordonnances', {
      dossierId:      dossierSelectionne.value.id,
      instructions:   form.instructions   || undefined,
      expirationDate: form.expirationDate || undefined,
      lignes:         lignesValides,
    })
    ordonnances.value = await api.get('/medecin/ordonnances')
    fermerModal()
  } catch (e) { erreur.value = e.message }
  finally     { envoi.value = false }
}

function imprimer(o) {
  const w = window.open('', '_blank')
  const meds = o.lignes.map((l, i) =>
    `<p style="margin:.5rem 0"><strong>${i+1}. ${l.medicament.nom}${l.medicament.dosage?' '+l.medicament.dosage:''}</strong>
     ${l.medicament.forme?'— '+l.medicament.forme:''}<br>
     <em>Posologie :</em> ${l.posologie}
     ${l.duree?'— '+l.duree:''}
     — Qté : ${l.quantite}</p>`
  ).join('')
  w.document.write(`<html><head><title>Ordonnance #${o.id}</title>
    <style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');body{font-family:'Montserrat',sans-serif;max-width:600px;margin:2rem auto;color:#1e293b}
    h1{text-align:center;font-size:1.5rem;border-bottom:2px solid #7C3AED;padding-bottom:.5rem}
    .header{display:flex;justify-content:space-between;margin:1rem 0;font-size:.85rem}
    .rx{font-size:3rem;color:#7C3AED;line-height:1}
    .sig{border-top:1px solid #ccc;margin-top:3rem;padding-top:.5rem;font-size:.8rem;color:#64748b}
    @media print{button{display:none}}</style></head><body>
    <h1>℞ ORDONNANCE MÉDICALE</h1>
    <div class="header">
      <div><strong>Patient :</strong> ${o.dossier.patient.utilisateur.prenom} ${o.dossier.patient.utilisateur.nom}<br>
      <strong>Dossier :</strong> #${o.dossier.numeroDossier}</div>
      <div><strong>Date :</strong> ${fmt(o.createdAt)}<br>
      <strong>N° :</strong> ${o.id}</div>
    </div>
    ${meds}
    ${o.instructions?`<p><em>Instructions :</em> ${o.instructions}</p>`:''}
    <div class="sig">Signature du médecin ___________________________</div>
    <script>window.print()<\/script></body></html>`)
  w.document.close()
}

function lblStatut(s) { return { ACTIVE:'Active', UTILISEE:'Utilisée', EXPIREE:'Expirée' }[s] || s }
function statutClass(s) { return { ACTIVE:'st-green', UTILISEE:'st-gray', EXPIREE:'st-red' }[s] || 'st-gray' }
function stripeClass(s) { return { ACTIVE:'stripe-green', UTILISEE:'stripe-gray', EXPIREE:'stripe-red' }[s] || 'stripe-gray' }
function statutIcone(s) { return { ACTIVE: CheckCircle2, UTILISEE: CheckCircle, EXPIREE: XCircle }[s] || AlertTriangle }
</script>

<style scoped>
@keyframes shimmer  { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
@keyframes spin     { to { transform:rotate(360deg) } }
@keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
@keyframes slideUp  { from { opacity:0;transform:translateY(16px) } to { opacity:1;transform:none } }

.ordo-wrap { display:flex;flex-direction:column;gap:1.25rem; }

/* Header */
.ordo-header { display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem; }
.ordo-title-row { display:flex;align-items:center;gap:.625rem; }
.ordo-icon { width:38px;height:38px;border-radius:.875rem;background:linear-gradient(135deg,#A78BFA,#7C3AED);display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 4px 12px rgba(124,58,237,.3); }
.ordo-title { font-family:var(--font-display);font-size:1.2rem;font-weight:800;color:var(--color-text); }
.ordo-count { background:linear-gradient(135deg,#A78BFA,#7C3AED);color:white;border-radius:9999px;font-size:.72rem;font-weight:700;padding:2px 10px; }

.btn-nouvelle { display:inline-flex;align-items:center;gap:.4rem;background:linear-gradient(135deg,#A78BFA,#7C3AED);color:white;border:none;border-radius:.875rem;padding:.625rem 1.25rem;font-size:.84rem;font-weight:700;cursor:pointer;transition:box-shadow .2s,transform .2s;box-shadow:0 4px 14px rgba(124,58,237,.3); }
.btn-nouvelle:hover { box-shadow:0 8px 24px rgba(124,58,237,.45);transform:translateY(-2px); }

/* Vide */
.vide-box   { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5rem 1rem; }
.vide-icon  { width:72px;height:72px;border-radius:1.5rem;background:rgba(124,58,237,.08);display:flex;align-items:center;justify-content:center;color:#A78BFA;margin-bottom:1rem; }
.vide-titre { font-family:var(--font-display);font-size:1.05rem;font-weight:700;color:var(--color-text); }
.vide-sub   { font-size:.83rem;color:var(--color-text-muted);margin-top:.25rem; }

/* Liste */
.ordo-list { display:flex;flex-direction:column;gap:1rem; }

/* Prescription card */
.ordo-prescription {
  display:flex;
  background:white;
  border:1px solid #E2E8F0;
  border-radius:1.25rem;
  overflow:hidden;
  box-shadow:0 2px 12px rgba(0,0,0,.04);
  animation:slideUp .4s ease both;
  transition:box-shadow .22s,transform .22s;
}
.ordo-prescription:hover { box-shadow:0 8px 28px rgba(0,0,0,.09);transform:translateY(-2px); }

.ordo-stripe { width:5px;flex-shrink:0; }
.stripe-green { background:linear-gradient(180deg,#4ADE80,#16A34A); }
.stripe-gray  { background:#CBD5E1; }
.stripe-red   { background:linear-gradient(180deg,#F87171,#DC2626); }

.ordo-inner { flex:1;min-width:0;display:flex;flex-direction:column; }

/* Header prescription */
.rx-header {
  display:flex;align-items:center;justify-content:space-between;gap:1rem;
  padding:.875rem 1.25rem;
  background:linear-gradient(135deg,rgba(167,139,250,.06),rgba(124,58,237,.03));
  border-bottom:1px solid #F1F5F9;
}
.rx-left  { display:flex;align-items:center;gap:.75rem; }
.rx-symbol { font-size:2rem;font-weight:900;color:#7C3AED;line-height:1;font-family:'Montserrat',sans-serif; }
.rx-label  { font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#7C3AED; }
.rx-date   { font-size:.72rem;color:var(--color-text-muted);margin-top:.1rem; }
.rx-right  { display:flex;flex-direction:column;align-items:flex-end;gap:.25rem; }
.rx-num    { font-size:.68rem;color:var(--color-text-muted);font-family:monospace; }

.rx-statut {
  display:inline-flex;align-items:center;gap:.3rem;
  font-size:.63rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;
  padding:3px 9px;border-radius:9999px;
}
.st-green { background:rgba(74,222,128,.12);color:#16A34A;border:1px solid rgba(74,222,128,.3); }
.st-gray  { background:rgba(148,163,184,.12);color:#64748B;border:1px solid rgba(148,163,184,.3); }
.st-red   { background:rgba(239,68,68,.12);color:#DC2626;border:1px solid rgba(239,68,68,.3); }

/* Patient */
.rx-patient {
  display:flex;align-items:center;gap:.625rem;
  padding:.625rem 1.25rem;
  background:#FAFBFC;border-bottom:1px dashed #E2E8F0;
}
.rx-patient-icon { width:28px;height:28px;border-radius:50%;background:rgba(124,58,237,.1);display:flex;align-items:center;justify-content:center;color:#7C3AED;flex-shrink:0; }
.rx-patient-info  { display:flex;align-items:center;gap:.5rem;flex:1;min-width:0; }
.rx-patient-nom   { font-weight:700;font-size:.88rem;color:var(--color-text); }
.rx-patient-dossier { font-size:.72rem;color:var(--color-text-muted); }
.rx-expiration    { display:flex;align-items:center;gap:.3rem;font-size:.72rem;color:#D97706;background:rgba(252,211,77,.12);border:1px solid rgba(252,211,77,.3);border-radius:9999px;padding:2px 8px;flex-shrink:0; }

/* Médicaments */
.rx-meds { padding:.875rem 1.25rem;display:flex;flex-direction:column;gap:.625rem; }
.rx-med-item { display:flex;align-items:flex-start;gap:.75rem; }
.rx-med-num {
  width:22px;height:22px;border-radius:50%;flex-shrink:0;margin-top:.1rem;
  background:linear-gradient(135deg,#A78BFA,#7C3AED);color:white;
  font-size:.65rem;font-weight:800;display:flex;align-items:center;justify-content:center;
}
.rx-med-body  { flex:1;min-width:0; }
.rx-med-nom   { font-size:.88rem;font-weight:700;color:var(--color-text); }
.rx-med-dosage { font-size:.78rem;color:#7C3AED;font-weight:600;margin-left:.375rem; }
.rx-med-forme  { font-size:.75rem;color:var(--color-text-muted);font-weight:400;margin-left:.25rem; }
.rx-med-detail { display:flex;align-items:center;gap:.375rem;flex-wrap:wrap;margin-top:.3rem; }

.rx-chip { display:inline-flex;align-items:center;gap:.25rem;font-size:.68rem;border-radius:9999px;padding:2px 8px;border:1px solid; }
.rx-chip-blue   { background:rgba(56,189,248,.1);color:#0284C7;border-color:rgba(56,189,248,.25); }
.rx-chip-purple { background:rgba(167,139,250,.1);color:#7C3AED;border-color:rgba(167,139,250,.25); }
.rx-chip-gray   { background:#F8FAFC;color:var(--color-text-muted);border-color:#E2E8F0; }

/* Instructions */
.rx-instructions {
  display:flex;align-items:flex-start;gap:.5rem;
  margin:0 1.25rem .875rem;
  font-size:.78rem;color:#92400E;
  background:#FFFBEB;border:1px solid #FDE68A;border-radius:.625rem;
  padding:.5rem .875rem;
}

/* Pied */
.rx-footer {
  display:flex;align-items:flex-end;justify-content:space-between;
  padding:.625rem 1.25rem .875rem;
  border-top:1px dashed #E2E8F0;
}
.rx-signature { display:flex;flex-direction:column;gap:.25rem; }
.rx-sig-line  { width:120px;height:1px;background:#CBD5E1; }
.rx-sig-label { font-size:.65rem;color:var(--color-text-muted);letter-spacing:.04em; }
.rx-actions   { display:flex;gap:.375rem; }
.rx-btn-action {
  width:30px;height:30px;border-radius:.625rem;border:1.5px solid #E2E8F0;
  background:white;cursor:pointer;color:var(--color-text-muted);
  display:flex;align-items:center;justify-content:center;
  transition:all .15s;
}
.rx-btn-action:hover { border-color:#7C3AED;color:#7C3AED;background:rgba(124,58,237,.05); }

/* ── MODAL ──────────────────────────────────────────────────────────────── */
.modal-overlay { position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem;animation:fadeIn .2s ease; }
.modal-box { background:white;border-radius:1.5rem;width:100%;max-width:640px;max-height:90vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,.22); }

.modal-header { display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #F1F5F9;position:sticky;top:0;background:white;z-index:10; }
.modal-titre-row { display:flex;align-items:center;gap:.75rem; }
.modal-titre-icon { width:38px;height:38px;border-radius:.875rem;background:linear-gradient(135deg,#A78BFA,#7C3AED);display:flex;align-items:center;justify-content:center;color:white; }
.modal-titre      { font-family:var(--font-display);font-size:1rem;font-weight:800;color:var(--color-text); }
.modal-sous-titre { font-size:.75rem;color:var(--color-text-muted);margin-top:.1rem; }
.close-btn { background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex;align-items:center;padding:.375rem;border-radius:.625rem;transition:background .15s; }
.close-btn:hover { background:#F1F5F9; }

.modal-body { padding:1.5rem;display:flex;flex-direction:column;gap:1.25rem; }

/* Sections du formulaire */
.form-section { display:flex;flex-direction:column;gap:.875rem;background:#FAFBFC;border:1px solid #E2E8F0;border-radius:1rem;padding:1rem 1.125rem; }
.form-section-title { display:flex;align-items:center;gap:.625rem;font-size:.82rem;font-weight:800;color:var(--color-text);text-transform:uppercase;letter-spacing:.05em; }
.form-step { width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#A78BFA,#7C3AED);color:white;font-size:.65rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0; }

.field       { display:flex;flex-direction:column;gap:.35rem; }
.field-grid  { display:grid;grid-template-columns:1fr auto;gap:.75rem;align-items:start; }
.field-grid > .field:last-child { min-width:110px; }
.field-label { display:flex;align-items:center;gap:.35rem;font-size:.78rem;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em; }
.field-hint  { font-weight:400;font-size:.7rem;color:var(--color-text-muted);text-transform:none;letter-spacing:0;margin-left:.25rem; }

/* Exemples */
.exemples-row { display:flex;flex-wrap:wrap;gap:.375rem;margin-top:.25rem; }
.ex-chip {
  padding:3px 10px;border-radius:9999px;border:1.5px solid #E2E8F0;
  background:white;font-size:.72rem;font-weight:600;color:#64748B;cursor:pointer;
  transition:all .15s;white-space:nowrap;
}
.ex-chip:hover        { border-color:#A78BFA;color:#7C3AED;background:rgba(167,139,250,.07); }
.ex-chip-purple:hover { border-color:#A78BFA;color:#7C3AED;background:rgba(167,139,250,.07); }
.ex-chip-teal:hover   { border-color:#2DD4BF;color:#0F766E;background:rgba(20,184,166,.07); }

/* Patient search */
.patient-search { position:relative; }
.search-ico { position:absolute;left:.75rem;top:50%;transform:translateY(-50%);color:var(--color-text-muted);pointer-events:none; }
.suggestions { position:absolute;top:calc(100% + .25rem);left:0;right:0;background:white;border:1.5px solid #E2E8F0;border-radius:.875rem;box-shadow:0 12px 32px rgba(0,0,0,.1);z-index:20;overflow:hidden; }
.suggestion-item { display:flex;align-items:center;gap:.625rem;padding:.625rem 1rem;cursor:pointer;transition:background .1s; }
.suggestion-item:hover { background:#F8FAFC; }
.sug-avatar { width:28px;height:28px;border-radius:50%;background:rgba(124,58,237,.1);display:flex;align-items:center;justify-content:center;color:#7C3AED;flex-shrink:0; }
.sug-nom    { font-size:.84rem;font-weight:600;color:var(--color-text); }
.sug-dossier { font-size:.7rem;color:var(--color-text-muted); }

.dossier-sel {
  display:flex;align-items:center;gap:.5rem;
  padding:.5rem .875rem;border-radius:.75rem;
  background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);
  font-size:.84rem;font-weight:600;color:#15803D;
}
.dossier-sel-num { font-weight:400;font-size:.75rem;color:#16A34A;margin-left:.25rem; }

/* Ligne médicament */
.ligne-form { background:white;border:1.5px solid #E2E8F0;border-radius:.875rem;padding:1rem;display:flex;flex-direction:column;gap:.75rem;transition:border-color .15s; }
.ligne-form:focus-within { border-color:#A78BFA; }
.ligne-header { display:flex;align-items:center;gap:.5rem; }
.ligne-num { width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#A78BFA,#7C3AED);color:white;font-size:.65rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.ligne-rx-label { flex:1;font-size:.78rem;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em; }
.remove-btn { background:none;border:none;cursor:pointer;color:#DC2626;display:flex;align-items:center;padding:.25rem;border-radius:.5rem;transition:background .12s; }
.remove-btn:hover { background:rgba(220,38,38,.06); }

.btn-add-ligne {
  display:flex;align-items:center;justify-content:center;gap:.5rem;
  width:100%;padding:.625rem;border:2px dashed #CBD5E1;border-radius:.875rem;
  background:none;cursor:pointer;color:var(--color-text-muted);font-size:.82rem;font-weight:700;
  transition:all .15s;
}
.btn-add-ligne:hover { border-color:#A78BFA;color:#7C3AED;background:rgba(167,139,250,.04); }

.modal-actions { display:flex;justify-content:flex-end;gap:.75rem;padding-top:.5rem;border-top:1px solid #F1F5F9; }
.btn-valider {
  display:inline-flex;align-items:center;gap:.4rem;
  background:linear-gradient(135deg,#A78BFA,#7C3AED);color:white;
  border:none;border-radius:.875rem;padding:.625rem 1.375rem;
  font-size:.85rem;font-weight:700;cursor:pointer;
  box-shadow:0 4px 14px rgba(124,58,237,.3);transition:box-shadow .2s,transform .2s;
}
.btn-valider:not(:disabled):hover { box-shadow:0 8px 24px rgba(124,58,237,.45);transform:translateY(-1px); }
.btn-valider:disabled { opacity:.5;cursor:not-allowed; }

.alert-erreur { display:flex;align-items:center;gap:.5rem;background:rgba(220,38,38,.07);border:1px solid rgba(220,38,38,.2);color:#DC2626;border-radius:.75rem;padding:.625rem .875rem;font-size:.84rem; }

.skel-list { display:flex;flex-direction:column;gap:1rem; }
.skel-row  { height:140px;background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:1.25rem;animation:shimmer 1.5s infinite; }

.fade-modal-enter-active,.fade-modal-leave-active { transition:opacity .25s ease; }
.fade-modal-enter-from,.fade-modal-leave-to { opacity:0; }
.spin { animation:spin 1s linear infinite; }
</style>
