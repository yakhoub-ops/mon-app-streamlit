<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-titre">Réception des livraisons</h1>
        <p style="color:var(--color-text-muted);font-size:.875rem">{{ lots.length }} lot(s) enregistré(s)</p>
      </div>
      <button class="btn btn-primary" @click="modalOuvert=true">
        <Truck :size="16" /> Nouvelle livraison
      </button>
    </div>

    <!-- Alerte lots expirant -->
    <div v-if="lotsExpirant.length" class="alerte-expiration" style="margin-bottom:1.25rem">
      <AlertTriangle :size="16" />
      <span><strong>{{ lotsExpirant.length }} lot(s)</strong> expirent dans les 30 prochains jours.</span>
    </div>

    <div v-if="chargement" style="display:flex;flex-direction:column;gap:.75rem">
      <div class="skeleton-block" v-for="i in 5" :key="i" style="height:80px"></div>
    </div>

    <div v-else-if="lots.length" class="card table-wrap">
      <table class="table-tm">
        <thead>
          <tr>
            <th>Médicament</th>
            <th>N° Lot</th>
            <th>Fournisseur</th>
            <th>Quantité</th>
            <th>Restant</th>
            <th>Expiration</th>
            <th>Prix achat</th>
            <th>Reçu le</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in lots" :key="l.id" :class="estExpire(l.dateExpiration)?'row-expire':estBientotExpire(l.dateExpiration)?'row-bientot':''">
            <td>
              <div style="font-weight:600;font-size:.88rem">{{ l.medicament.nom }}</div>
              <div style="font-size:.72rem;color:var(--color-text-muted)">{{ l.medicament.forme }}</div>
            </td>
            <td style="font-family:monospace;font-size:.82rem">{{ l.numeroLot }}</td>
            <td style="font-size:.82rem;color:var(--color-text-muted)">{{ l.fournisseur || '—' }}</td>
            <td style="font-weight:600;font-size:.85rem">{{ l.quantite }}</td>
            <td>
              <span :style="{ fontWeight:700, fontSize:'.88rem', color: l.quantiteRestante===0?'var(--color-danger)':l.quantiteRestante<5?'var(--color-warning)':'var(--color-green)' }">
                {{ l.quantiteRestante }}
              </span>
            </td>
            <td>
              <div style="font-size:.83rem" :class="estExpire(l.dateExpiration)?'texte-rouge':estBientotExpire(l.dateExpiration)?'texte-orange':''">
                {{ fmt(l.dateExpiration) }}
              </div>
              <span v-if="estExpire(l.dateExpiration)" class="badge badge-danger" style="margin-top:2px">Expiré</span>
              <span v-else-if="estBientotExpire(l.dateExpiration)" class="badge badge-warning" style="margin-top:2px">Expire bientôt</span>
            </td>
            <td style="font-size:.82rem">{{ l.prixAchat ? l.prixAchat.toLocaleString('fr-SN')+' FCFA' : '—' }}</td>
            <td style="font-size:.78rem;color:var(--color-text-muted)">{{ fmt(l.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="vide-center">
      <Truck :size="48" style="opacity:.25;margin-bottom:.75rem" />
      <p style="color:var(--color-text-muted)">Aucune livraison enregistrée</p>
    </div>

    <!-- Modal Nouvelle livraison -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="modalOuvert" class="modal-overlay" @click.self="modalOuvert=false">
          <div class="modal-box">
            <div class="modal-header">
              <h2 class="modal-titre"><Truck :size="18" style="color:var(--color-primary)" /> Réceptionner une livraison</h2>
              <button class="modal-close" @click="modalOuvert=false"><X :size="20" /></button>
            </div>
            <form @submit.prevent="creerLot" class="modal-body">
              <div v-if="erreur" class="alert-erreur"><AlertCircle :size="14" /> {{ erreur }}</div>

              <div class="field">
                <label class="field-label"><FlaskConical :size="13" /> Médicament *</label>
                <select v-model="form.medicamentId" class="input" required>
                  <option value="">Sélectionner un médicament…</option>
                  <option v-for="m in medicaments" :key="m.id" :value="m.id">
                    {{ m.nom }} {{ m.dosage ? '· '+m.dosage : '' }} ({{ m.forme || '?' }})
                  </option>
                </select>
              </div>

              <div class="deux-cols">
                <div class="field">
                  <label class="field-label">N° de lot</label>
                  <input v-model="form.numeroLot" type="text" class="input" placeholder="Ex: LOT-2025-001" />
                </div>
                <div class="field">
                  <label class="field-label">Quantité *</label>
                  <input v-model.number="form.quantite" type="number" min="1" class="input" required />
                </div>
              </div>

              <div class="deux-cols">
                <div class="field">
                  <label class="field-label"><Calendar :size="13" /> Date d'expiration *</label>
                  <input v-model="form.dateExpiration" type="date" class="input" required />
                </div>
                <div class="field">
                  <label class="field-label">Prix d'achat (FCFA)</label>
                  <input v-model.number="form.prixAchat" type="number" min="0" class="input" />
                </div>
              </div>

              <div class="field">
                <label class="field-label">Fournisseur</label>
                <input v-model="form.fournisseur" type="text" class="input" placeholder="Nom du fournisseur…" />
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="modalOuvert=false">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="envoi">
                  <Loader2 v-if="envoi" :size="16" class="spin" /><Check v-else :size="16" />
                  {{ envoi ? 'Enregistrement…' : 'Enregistrer la livraison' }}
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
import { Truck, AlertTriangle, FlaskConical, Calendar, Check, X, AlertCircle, Loader2 } from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { fmt } = useDate()

const chargement = ref(true)
const lots       = ref([])
const medicaments= ref([])
const modalOuvert= ref(false)
const envoi      = ref(false)
const erreur     = ref('')
const form       = ref({ medicamentId:'', numeroLot:'', quantite:1, dateExpiration:'', prixAchat:null, fournisseur:'' })

const dans30j     = new Date(); dans30j.setDate(dans30j.getDate() + 30)
const lotsExpirant = computed(() => lots.value.filter(l => {
  const exp = new Date(l.dateExpiration)
  return exp <= dans30j && exp > new Date() && l.quantiteRestante > 0
}))

onMounted(async () => {
  try {
    const [ls, meds] = await Promise.all([api.get('/pharmacien/lots'), api.get('/pharmacien/medicaments')])
    lots.value        = ls
    medicaments.value = meds
  } finally { chargement.value = false }
})

async function creerLot() {
  erreur.value = ''; envoi.value = true
  try {
    await api.post('/pharmacien/lots', {
      medicamentId: parseInt(form.value.medicamentId),
      numeroLot:    form.value.numeroLot || undefined,
      quantite:     form.value.quantite,
      dateExpiration: form.value.dateExpiration,
      prixAchat:    form.value.prixAchat || undefined,
      fournisseur:  form.value.fournisseur || undefined,
    })
    modalOuvert.value = false
    form.value = { medicamentId:'', numeroLot:'', quantite:1, dateExpiration:'', prixAchat:null, fournisseur:'' }
    lots.value = await api.get('/pharmacien/lots')
  } catch(e) { erreur.value = e.message }
  finally { envoi.value = false }
}

function estExpire(date)       { return new Date(date) < new Date() }
function estBientotExpire(date){ const d = new Date(date); return d >= new Date() && d <= dans30j }
</script>

<style scoped>
.page-header  { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;gap:1rem }
.page-titre   { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
.alerte-expiration { display:flex;align-items:center;gap:.625rem;background:rgba(245,158,11,0.1);border:1.5px solid rgba(245,158,11,.35);color:#B45309;border-radius:.875rem;padding:.75rem 1rem;font-size:.85rem }
.row-expire   { background:rgba(220,38,38,0.04) }
.row-bientot  { background:rgba(245,158,11,0.04) }
.texte-rouge  { color:var(--color-danger);font-weight:600 }
.texte-orange { color:var(--color-warning);font-weight:600 }
.deux-cols    { display:grid;grid-template-columns:1fr 1fr;gap:.875rem }
@media(max-width:480px){ .deux-cols { grid-template-columns:1fr } }
.field        { display:flex;flex-direction:column;gap:.375rem }
.field-label  { display:flex;align-items:center;gap:.375rem;font-size:.8rem;font-weight:600;color:var(--color-text-muted) }
.vide-center  { display:flex;flex-direction:column;align-items:center;padding:4rem 1rem }
.modal-overlay{ position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem }
.modal-box    { background:white;border-radius:1.25rem;width:100%;max-width:500px;max-height:90vh;overflow-y:auto }
.modal-header { display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #F1F5F9 }
.modal-titre  { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:1rem;font-weight:700 }
.modal-close  { background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex }
.modal-body   { padding:1.5rem;display:flex;flex-direction:column;gap:1rem }
.modal-footer { display:flex;justify-content:flex-end;gap:.75rem;padding-top:.5rem }
.alert-erreur { display:flex;align-items:center;gap:.5rem;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,.25);color:var(--color-danger);border-radius:.75rem;padding:.625rem .875rem;font-size:.83rem }
.spin         { animation:spin 1s linear infinite }
@keyframes spin{ from{ transform:rotate(0deg) } to{ transform:rotate(360deg) } }
.modal-fade-enter-active,.modal-fade-leave-active { transition:all .25s ease }
.modal-fade-enter-from,.modal-fade-leave-to { opacity:0 }
.skeleton-block{ background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.75rem;animation:shimmer 1.5s infinite }
@keyframes shimmer{ 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }
</style>
