<template>
  <div>

    <!-- En-tête -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon"><FileText :size="18" /></div>
        <div>
          <h1 class="page-titre">Ordonnances</h1>
          <p class="page-sub">{{ ordoFiltrees.length }} ordonnance(s) — {{ lblFiltre }}</p>
        </div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filtres-tabs">
      <button v-for="f in filtresDef" :key="f.val"
        class="filtre-btn" :class="{active:filtre===f.val}"
        @click="filtre=f.val">
        <component :is="f.icone" :size="13" />
        {{ f.label }}
        <span v-if="f.count>0" class="filtre-count">{{ f.count }}</span>
      </button>
    </div>

    <!-- Skeleton -->
    <div v-if="chargement" style="display:flex;flex-direction:column;gap:1rem;margin-top:1rem">
      <div class="skel-card" v-for="i in 4" :key="i"></div>
    </div>

    <!-- Liste -->
    <div v-else-if="ordoFiltrees.length" class="ordo-list">
      <div v-for="o in ordoFiltrees" :key="o.id" class="ordo-prescription">

        <!-- Bande latérale -->
        <div class="ordo-stripe" :class="stripeClass(o.statut)"></div>

        <div class="ordo-inner">

          <!-- En-tête prescription -->
          <div class="rx-header">
            <div class="rx-header-left">
              <div class="rx-symbol">℞</div>
              <div>
                <div class="rx-label">ORDONNANCE MÉDICALE</div>
                <div class="rx-meta">
                  <span>Dr. {{ o.medecinNom }}</span>
                  <span>·</span>
                  <span>{{ fmt(o.createdAt) }}</span>
                </div>
              </div>
            </div>
            <div class="rx-header-right">
              <span class="rx-badge" :class="badgeClass(o.statut)">
                <component :is="statutIcone(o.statut)" :size="11" />
                {{ lblStatut(o.statut) }}
              </span>
              <span class="rx-num">#{{ o.id }}</span>
            </div>
          </div>

          <!-- Patient -->
          <div class="rx-patient">
            <div class="rx-patient-avatar"><User :size="14" /></div>
            <div class="rx-patient-info">
              <span class="rx-patient-nom">{{ o.dossier.patient.utilisateur.prenom }} {{ o.dossier.patient.utilisateur.nom }}</span>
              <span v-if="o.dossier.patient.utilisateur.telephone" class="rx-patient-tel">
                <Phone :size="10" /> {{ o.dossier.patient.utilisateur.telephone }}
              </span>
            </div>
            <div class="rx-patient-right">
              <button v-if="o.statut==='ACTIVE'" class="btn-delivrer"
                :disabled="livraison===o.id" @click="delivrer(o.id)">
                <Loader2 v-if="livraison===o.id" :size="14" class="spin" />
                <Package v-else :size="14" />
                {{ livraison===o.id ? 'En cours…' : 'Délivrer' }}
              </button>
              <button class="btn-toggle" @click="ouvert=ouvert===o.id?null:o.id"
                :title="ouvert===o.id?'Réduire':'Voir les médicaments'">
                <ChevronDown :size="15" :class="['chev', ouvert===o.id?'rotated':'']" />
              </button>
            </div>
          </div>

          <!-- Instructions -->
          <div v-if="o.instructions" class="rx-instructions">
            <Info :size="12" />
            <span>{{ o.instructions }}</span>
          </div>

          <!-- Médicaments (expandable) -->
          <Transition name="slide">
            <div v-if="ouvert===o.id" class="rx-meds-section">

              <div class="rx-meds-titre">
                <Package :size="13" />
                {{ o.lignes.length }} médicament(s) prescrit(s)
              </div>

              <div class="rx-meds-grid">
                <div v-for="(l, i) in o.lignes" :key="l.id" class="rx-med-card">
                  <div class="rx-med-num">{{ i + 1 }}</div>
                  <div class="rx-med-body">
                    <div class="rx-med-nom">
                      {{ l.medicament.nom }}
                      <span v-if="l.medicament.dosage" class="rx-med-dosage">{{ l.medicament.dosage }}</span>
                    </div>
                    <div v-if="l.medicament.forme" class="rx-med-forme">{{ l.medicament.forme }}</div>
                    <div class="rx-med-posologie">
                      <span class="rx-chip rx-chip-blue"><Clock :size="9" /> {{ l.posologie }}</span>
                      <span v-if="l.duree" class="rx-chip rx-chip-purple"><Calendar :size="9" /> {{ l.duree }}</span>
                      <span class="rx-chip rx-chip-gray">Qté : {{ l.quantite }}</span>
                    </div>
                  </div>
                  <div class="rx-med-stock">
                    <span class="stock-chip" :class="l.medicament.stockActuel >= l.quantite ? 'stock-ok' : 'stock-nok'">
                      <component :is="l.medicament.stockActuel >= l.quantite ? CheckCircle2 : AlertTriangle" :size="11" />
                      Stock : {{ l.medicament.stockActuel }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Warning délivrance -->
              <div v-if="o.statut==='ACTIVE'" class="rx-warning">
                <AlertTriangle :size="13" />
                La délivrance soustrait automatiquement les quantités du stock.
              </div>

              <!-- Bouton délivrer (répété dans la section) -->
              <div v-if="o.statut==='ACTIVE'" class="rx-meds-footer">
                <button class="btn-delivrer btn-delivrer-lg"
                  :disabled="livraison===o.id" @click="delivrer(o.id)">
                  <Loader2 v-if="livraison===o.id" :size="15" class="spin" />
                  <Package v-else :size="15" />
                  {{ livraison===o.id ? 'Délivrance en cours…' : 'Confirmer la délivrance' }}
                </button>
              </div>

            </div>
          </Transition>

          <!-- Expiration -->
          <div v-if="o.expirationDate" class="rx-footer">
            <Calendar :size="11" />
            Expire le {{ fmt(o.expirationDate) }}
          </div>

        </div>
      </div>
    </div>

    <!-- Vide -->
    <div v-else class="vide-center">
      <div class="vide-icon"><FileText :size="32" /></div>
      <p class="vide-titre">Aucune ordonnance {{ lblFiltre.toLowerCase() }}</p>
      <p class="vide-sub">Les ordonnances prescrites par les médecins apparaissent ici</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Pill, Package, FileText, ChevronDown, Info, Clock, Calendar,
  AlertTriangle, Loader2, User, Phone, CheckCircle2, XCircle,
  CheckCircle,
} from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { fmt } = useDate()

const chargement = ref(true)
const ordos      = ref([])
const filtre     = ref('ACTIVE')
const ouvert     = ref(null)
const livraison  = ref(null)

const filtresDef = computed(() => [
  { val:'ACTIVE',   label:'Actives',   icone: CheckCircle2,     count: ordos.value.filter(o=>o.statut==='ACTIVE').length },
  { val:'DELIVREE', label:'Délivrées', icone: CheckCircle,      count: ordos.value.filter(o=>o.statut==='DELIVREE').length },
  { val:'EXPIREE',  label:'Expirées',  icone: XCircle,          count: ordos.value.filter(o=>o.statut==='EXPIREE').length },
])

const ordoFiltrees = computed(() => ordos.value.filter(o => o.statut === filtre.value))
const lblFiltre = computed(() => ({ ACTIVE:'Actives', DELIVREE:'Délivrées', EXPIREE:'Expirées' }[filtre.value] || filtre.value))

onMounted(async () => {
  try { ordos.value = await api.get('/pharmacien/ordonnances') }
  finally { chargement.value = false }
})

async function delivrer(id) {
  if (!confirm('Délivrer cette ordonnance et déduire le stock ?')) return
  livraison.value = id
  try {
    await api.put(`/pharmacien/ordonnances/${id}/delivrer`)
    ordos.value = await api.get('/pharmacien/ordonnances')
  } finally { livraison.value = null }
}

function lblStatut(s) { return { ACTIVE:'Active', DELIVREE:'Délivrée', EXPIREE:'Expirée' }[s] || s }
function badgeClass(s) { return { ACTIVE:'badge-active', DELIVREE:'badge-delivree', EXPIREE:'badge-expiree' }[s] || '' }
function stripeClass(s) { return { ACTIVE:'stripe-green', DELIVREE:'stripe-blue', EXPIREE:'stripe-red' }[s] || 'stripe-gray' }
function statutIcone(s) { return { ACTIVE: CheckCircle2, DELIVREE: CheckCircle, EXPIREE: XCircle }[s] || AlertTriangle }
</script>

<style scoped>
@keyframes shimmer { 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }
@keyframes spin    { to { transform:rotate(360deg) } }
@keyframes slideUp { from{ opacity:0;transform:translateY(14px) } to{ opacity:1;transform:none } }

/* Header */
.page-header { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.125rem;gap:1rem; }
.header-left { display:flex;align-items:center;gap:.75rem; }
.header-icon { width:42px;height:42px;border-radius:.875rem;background:linear-gradient(135deg,#38BDF8,#0284C7);display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 4px 14px rgba(2,132,199,.28);flex-shrink:0; }
.page-titre  { font-family:var(--font-display);font-size:1.2rem;font-weight:800;color:var(--color-text); }
.page-sub    { font-size:.78rem;color:var(--color-text-muted);margin-top:.1rem; }

/* .filtres-tabs, .filtre-btn, .filtre-count — styles globaux dans style.css */

/* Liste */
.ordo-list { display:flex;flex-direction:column;gap:1rem; }

/* Prescription card */
.ordo-prescription {
  display:flex;
  background:white;
  border:1px solid #E2E8F0;
  border-radius:1.25rem;
  overflow:hidden;
  box-shadow:0 2px 10px rgba(0,0,0,.04);
  animation:slideUp .35s ease both;
  transition:box-shadow .2s,transform .2s;
}
.ordo-prescription:hover { box-shadow:0 8px 28px rgba(0,0,0,.08);transform:translateY(-2px); }

.ordo-stripe { width:5px;flex-shrink:0; }
.stripe-green { background:linear-gradient(180deg,#4ADE80,#16A34A); }
.stripe-blue  { background:linear-gradient(180deg,#38BDF8,#0284C7); }
.stripe-red   { background:linear-gradient(180deg,#F87171,#DC2626); }
.stripe-gray  { background:#CBD5E1; }

.ordo-inner { flex:1;min-width:0;display:flex;flex-direction:column; }

/* Header rx */
.rx-header {
  display:flex;align-items:center;justify-content:space-between;gap:1rem;
  padding:.875rem 1.25rem;
  background:linear-gradient(135deg,rgba(56,189,248,.04),white);
  border-bottom:1px solid #F1F5F9;
}
.rx-header-left { display:flex;align-items:center;gap:.75rem; }
.rx-symbol  { font-size:2rem;font-weight:900;color:#0284C7;font-family:'Montserrat',sans-serif;line-height:1; }
.rx-label   { font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#0284C7; }
.rx-meta    { display:flex;align-items:center;gap:.375rem;font-size:.73rem;color:var(--color-text-muted);margin-top:.15rem; }
.rx-header-right { display:flex;flex-direction:column;align-items:flex-end;gap:.25rem; }
.rx-num     { font-size:.66rem;color:var(--color-text-muted);font-family:monospace; }

.rx-badge {
  display:inline-flex;align-items:center;gap:.3rem;
  font-size:.63rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;
  padding:3px 9px;border-radius:9999px;border:1px solid;
}
.badge-active   { background:rgba(74,222,128,.1);color:#16A34A;border-color:rgba(74,222,128,.3); }
.badge-delivree { background:rgba(56,189,248,.1);color:#0284C7;border-color:rgba(56,189,248,.3); }
.badge-expiree  { background:rgba(248,113,113,.1);color:#DC2626;border-color:rgba(248,113,113,.3); }

/* Patient */
.rx-patient {
  display:flex;align-items:center;gap:.75rem;
  padding:.625rem 1.25rem;
  background:#FAFBFC;border-bottom:1px dashed #E2E8F0;
}
.rx-patient-avatar { width:30px;height:30px;border-radius:50%;background:rgba(2,132,199,.1);display:flex;align-items:center;justify-content:center;color:#0284C7;flex-shrink:0; }
.rx-patient-info { display:flex;align-items:center;gap:.625rem;flex:1;min-width:0;flex-wrap:wrap; }
.rx-patient-nom  { font-weight:700;font-size:.9rem;color:var(--color-text); }
.rx-patient-tel  { display:inline-flex;align-items:center;gap:.3rem;font-size:.72rem;color:var(--color-text-muted); }
.rx-patient-right { display:flex;align-items:center;gap:.5rem;flex-shrink:0; }

/* Bouton délivrer */
.btn-delivrer {
  display:inline-flex;align-items:center;gap:.4rem;
  padding:.45rem 1rem;border-radius:.75rem;border:none;cursor:pointer;
  background:linear-gradient(135deg,#4ADE80,#059669);color:white;
  font-size:.78rem;font-weight:700;
  transition:box-shadow .18s,transform .18s;
  box-shadow:0 3px 10px rgba(5,150,105,.25);
}
.btn-delivrer:hover:not(:disabled) { box-shadow:0 6px 18px rgba(5,150,105,.4);transform:translateY(-1px); }
.btn-delivrer:disabled { opacity:.6;cursor:wait; }
.btn-delivrer-lg { width:100%;justify-content:center;padding:.625rem 1rem;font-size:.85rem; }

.btn-toggle {
  width:30px;height:30px;border-radius:.625rem;border:1.5px solid #E2E8F0;
  background:white;cursor:pointer;color:var(--color-text-muted);
  display:flex;align-items:center;justify-content:center;transition:all .15s;
}
.btn-toggle:hover { border-color:#0284C7;color:#0284C7;background:rgba(2,132,199,.05); }

.chev { transition:transform .25s; }
.chev.rotated { transform:rotate(180deg); }

/* Instructions */
.rx-instructions {
  display:flex;align-items:flex-start;gap:.5rem;
  margin:.5rem 1.25rem 0;
  font-size:.78rem;color:#92400E;
  background:#FFFBEB;border:1px solid #FDE68A;border-radius:.625rem;
  padding:.5rem .875rem;
}

/* Section médicaments (expandable) */
.rx-meds-section { padding:1rem 1.25rem;border-top:1px solid #F1F5F9;display:flex;flex-direction:column;gap:.875rem; }
.rx-meds-titre { display:flex;align-items:center;gap:.375rem;font-size:.75rem;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.05em; }

.rx-meds-grid { display:flex;flex-direction:column;gap:.625rem; }
.rx-med-card {
  display:flex;align-items:flex-start;gap:.75rem;
  background:#F8FAFC;border:1px solid #E2E8F0;border-radius:.875rem;
  padding:.75rem 1rem;border-left:3px solid #0284C7;
}
.rx-med-num {
  width:22px;height:22px;border-radius:50%;flex-shrink:0;
  background:linear-gradient(135deg,#38BDF8,#0284C7);color:white;
  font-size:.65rem;font-weight:800;display:flex;align-items:center;justify-content:center;margin-top:.1rem;
}
.rx-med-body   { flex:1;min-width:0; }
.rx-med-nom    { font-size:.88rem;font-weight:700;color:var(--color-text); }
.rx-med-dosage { font-size:.78rem;font-weight:600;color:#0284C7;margin-left:.375rem; }
.rx-med-forme  { font-size:.73rem;color:var(--color-text-muted);margin-top:.1rem; }
.rx-med-posologie { display:flex;align-items:center;gap:.375rem;flex-wrap:wrap;margin-top:.375rem; }

.rx-chip { display:inline-flex;align-items:center;gap:.25rem;font-size:.68rem;border-radius:9999px;padding:2px 8px;border:1px solid; }
.rx-chip-blue   { background:rgba(56,189,248,.1);color:#0284C7;border-color:rgba(56,189,248,.25); }
.rx-chip-purple { background:rgba(167,139,250,.1);color:#7C3AED;border-color:rgba(167,139,250,.25); }
.rx-chip-gray   { background:#F1F5F9;color:var(--color-text-muted);border-color:#E2E8F0; }

.rx-med-stock { flex-shrink:0;margin-top:.15rem; }
.stock-chip {
  display:inline-flex;align-items:center;gap:.3rem;
  font-size:.68rem;font-weight:700;padding:3px 8px;border-radius:9999px;border:1px solid;
}
.stock-ok  { background:rgba(74,222,128,.1);color:#16A34A;border-color:rgba(74,222,128,.3); }
.stock-nok { background:rgba(248,113,113,.1);color:#DC2626;border-color:rgba(248,113,113,.3); }

.rx-warning {
  display:flex;align-items:center;gap:.5rem;
  font-size:.75rem;color:#92400E;
  background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:.625rem;
  padding:.5rem .875rem;
}

.rx-meds-footer { }

/* Footer */
.rx-footer {
  display:flex;align-items:center;gap:.375rem;
  padding:.5rem 1.25rem;border-top:1px dashed #E2E8F0;
  font-size:.72rem;color:#D97706;
}

/* Vide */
.vide-center { display:flex;flex-direction:column;align-items:center;padding:4rem 1rem; }
.vide-icon   { width:70px;height:70px;border-radius:1.5rem;background:rgba(2,132,199,.06);display:flex;align-items:center;justify-content:center;color:#38BDF8;margin-bottom:1rem; }
.vide-titre  { font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--color-text); }
.vide-sub    { font-size:.82rem;color:var(--color-text-muted);margin-top:.25rem;text-align:center; }

/* Skeleton */
.skel-card { height:110px;background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:1.25rem;animation:shimmer 1.5s infinite; }

.slide-enter-active,.slide-leave-active { transition:all .28s ease; }
.slide-enter-from,.slide-leave-to { opacity:0;transform:translateY(-8px); }
.spin { animation:spin 1s linear infinite; }
</style>
