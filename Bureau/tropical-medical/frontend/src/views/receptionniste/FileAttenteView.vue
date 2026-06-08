<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-titre">File d'attente</h1>
        <p style="color:var(--color-text-muted);font-size:.875rem">{{ passages.length }} patient(s)</p>
      </div>
      <div style="display:flex;gap:.625rem">
        <button class="btn btn-ghost btn-sm" @click="charger" :disabled="chargement">
          <RefreshCw :size="14" :class="chargement?'spin':''" /> Actualiser
        </button>
        <button class="btn btn-primary" @click="modalOuvert=true">
          <UserPlus :size="16" /> Ajouter
        </button>
      </div>
    </div>

    <div v-if="chargement" style="display:flex;flex-direction:column;gap:.75rem">
      <div class="skeleton-block" v-for="i in 5" :key="i" style="height:88px"></div>
    </div>

    <div v-else-if="passages.length" style="display:flex;flex-direction:column;gap:.75rem">
      <div v-for="(p, idx) in passages" :key="p.id" class="card passage-card">
        <div class="rang">{{ idx + 1 }}</div>

        <div class="p-avatar"><User :size="20" /></div>

        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.25rem">
            <span class="p-nom">{{ p.patient.utilisateur.prenom }} {{ p.patient.utilisateur.nom }}</span>
            <span class="badge" :class="urgenceClass(p.niveauUrgence)">
              <component :is="urgenceIcone(p.niveauUrgence)" :size="11" />
              {{ lblUrgence(p.niveauUrgence) }}
            </span>
            <span v-if="p.statut==='APPELE'" class="badge badge-primary">Appelé</span>
          </div>
          <div class="p-sub">
            <Clock :size="12" /> Arrivé {{ fmtHeure(p.heureArrivee) }}
            <span v-if="p.motif"> · {{ p.motif }}</span>
          </div>
          <div v-if="p.medecin" class="p-sub">
            <Stethoscope :size="12" /> Dr. {{ p.medecin.utilisateur.prenom }} {{ p.medecin.utilisateur.nom }}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:.375rem;flex-shrink:0">
          <button class="btn btn-danger btn-sm" @click="retirer(p.id)">
            <LogOut :size="13" /> Retirer
          </button>
        </div>
      </div>
    </div>

    <div v-else class="vide-center">
      <CheckCircle :size="52" style="color:var(--color-green);opacity:.6;margin-bottom:.875rem" />
      <p style="color:var(--color-text-muted)">File d'attente vide</p>
    </div>

    <!-- Modal Ajouter -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="modalOuvert" class="modal-overlay" @click.self="modalOuvert=false">
          <div class="modal-box">
            <div class="modal-header">
              <h2 class="modal-titre"><UserPlus :size="18" style="color:var(--color-primary)" /> Ajouter à la file</h2>
              <button class="modal-close" @click="modalOuvert=false"><X :size="20" /></button>
            </div>
            <form @submit.prevent="ajouter" class="modal-body">
              <div v-if="erreur" class="alert-erreur"><AlertCircle :size="14" /> {{ erreur }}</div>

              <div class="field">
                <label class="field-label"><User :size="13" /> Patient</label>
                <select v-model="form.patientId" class="input" required>
                  <option value="">Sélectionner un patient…</option>
                  <option v-for="p in patients" :key="p.id" :value="p.id">
                    {{ p.utilisateur.prenom }} {{ p.utilisateur.nom }}
                  </option>
                </select>
              </div>

              <div class="field">
                <label class="field-label"><Stethoscope :size="13" /> Médecin (optionnel)</label>
                <select v-model="form.medecinId" class="input">
                  <option value="">Aucun médecin spécifique</option>
                  <option v-for="m in medecins" :key="m.id" :value="m.id">
                    Dr. {{ m.utilisateur.prenom }} {{ m.utilisateur.nom }} — {{ m.specialite }}
                  </option>
                </select>
              </div>

              <div class="field">
                <label class="field-label"><AlertTriangle :size="13" /> Niveau d'urgence</label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
                  <button v-for="u in urgences" :key="u.val" type="button"
                    class="urgence-btn" :class="[form.niveauUrgence===u.val?'selected':'', u.cls]"
                    @click="form.niveauUrgence=u.val">
                    <component :is="u.icone" :size="14" /> {{ u.label }}
                  </button>
                </div>
              </div>

              <div class="field">
                <label class="field-label"><MessageSquare :size="13" /> Motif</label>
                <input v-model="form.motif" type="text" class="input" placeholder="Motif de visite…" />
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="modalOuvert=false">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="envoi">
                  <Loader2 v-if="envoi" :size="16" class="spin" /><Check v-else :size="16" />
                  {{ envoi ? 'Ajout…' : 'Ajouter' }}
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
import { ref, onMounted, onUnmounted } from 'vue'
import {
  User, Clock, Stethoscope, UserPlus, RefreshCw, LogOut,
  CheckCircle, AlertCircle, AlertTriangle, X, Check, Loader2,
  MessageSquare, Activity, Info,
} from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { fmtHeure } = useDate()

const chargement = ref(true)
const passages   = ref([])
const patients   = ref([])
const medecins   = ref([])
const modalOuvert= ref(false)
const envoi      = ref(false)
const erreur     = ref('')
const form       = ref({ patientId:'', medecinId:'', niveauUrgence:'FAIBLE', motif:'' })
let   intervalle = null

const urgences = [
  { val:'FAIBLE',   label:'Faible',   cls:'u-faible',   icone: Info },
  { val:'MODERE',   label:'Modéré',   cls:'u-modere',   icone: Clock },
  { val:'URGENT',   label:'Urgent',   cls:'u-urgent',   icone: AlertTriangle },
  { val:'CRITIQUE', label:'Critique', cls:'u-critique',  icone: Activity },
]

async function charger() {
  chargement.value = true
  try { passages.value = await api.get('/receptionniste/file-attente') }
  finally { chargement.value = false }
}

onMounted(async () => {
  await charger()
  const [pats, meds] = await Promise.all([api.get('/receptionniste/patients'), api.get('/receptionniste/medecins')])
  patients.value = pats; medecins.value = meds
  intervalle = setInterval(charger, 30000)
})
onUnmounted(() => clearInterval(intervalle))

async function retirer(id) {
  if (!confirm('Retirer ce patient de la file ?')) return
  await api.put(`/receptionniste/file-attente/${id}/retirer`)
  await charger()
}

async function ajouter() {
  erreur.value = ''; envoi.value = true
  try {
    await api.post('/receptionniste/file-attente', {
      patientId: parseInt(form.value.patientId),
      medecinId: form.value.medecinId ? parseInt(form.value.medecinId) : undefined,
      niveauUrgence: form.value.niveauUrgence,
      motif: form.value.motif || undefined,
    })
    modalOuvert.value = false
    form.value = { patientId:'', medecinId:'', niveauUrgence:'FAIBLE', motif:'' }
    await charger()
  } catch(e) { erreur.value = e.message }
  finally { envoi.value = false }
}

function lblUrgence(n) { return { CRITIQUE:'Critique', URGENT:'Urgent', MODERE:'Modéré', FAIBLE:'Faible' }[n] || n }
function urgenceClass(n) { return { CRITIQUE:'badge-danger', URGENT:'badge-warning', MODERE:'badge-info', FAIBLE:'badge-gray' }[n] || 'badge-gray' }
function urgenceIcone(n) { return { CRITIQUE:Activity, URGENT:AlertTriangle, MODERE:Info, FAIBLE:Clock }[n] || Clock }
</script>

<style scoped>
.page-header  { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;gap:1rem }
.page-titre   { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
.passage-card { display:flex;align-items:center;gap:.875rem;padding:1rem 1.25rem;position:relative }
.rang         { position:absolute;top:.5rem;left:.5rem;width:18px;height:18px;border-radius:50%;background:var(--color-primary);color:white;font-size:.62rem;font-weight:700;display:flex;align-items:center;justify-content:center }
.p-avatar     { width:42px;height:42px;border-radius:50%;background:rgba(14,159,142,0.1);display:flex;align-items:center;justify-content:center;color:var(--color-primary);flex-shrink:0 }
.p-nom        { font-weight:700;font-size:.92rem;color:var(--color-text) }
.p-sub        { display:flex;align-items:center;gap:.35rem;font-size:.75rem;color:var(--color-text-muted);margin-top:.15rem }
.urgence-btn  { display:flex;align-items:center;justify-content:center;gap:.375rem;padding:.5rem;border-radius:.625rem;border:1.5px solid #E2E8F0;background:white;cursor:pointer;font-size:.8rem;font-weight:500;transition:all .18s }
.urgence-btn.selected { border-color:currentColor;font-weight:700 }
.u-faible     { color:var(--color-text-muted) }
.u-faible.selected { background:#F1F5F9 }
.u-modere     { color:var(--color-info) }
.u-modere.selected { background:rgba(14,165,233,0.08) }
.u-urgent     { color:var(--color-warning) }
.u-urgent.selected { background:rgba(245,158,11,0.08) }
.u-critique   { color:var(--color-danger) }
.u-critique.selected { background:rgba(220,38,38,0.08) }
.vide-center  { display:flex;flex-direction:column;align-items:center;padding:5rem 1rem }
.modal-overlay{ position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem }
.modal-box    { background:white;border-radius:1.25rem;width:100%;max-width:480px;max-height:90vh;overflow-y:auto }
.modal-header { display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #F1F5F9 }
.modal-titre  { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:1rem;font-weight:700 }
.modal-close  { background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex }
.modal-body   { padding:1.5rem;display:flex;flex-direction:column;gap:1rem }
.modal-footer { display:flex;justify-content:flex-end;gap:.75rem;padding-top:.5rem }
.field        { display:flex;flex-direction:column;gap:.375rem }
.field-label  { display:flex;align-items:center;gap:.375rem;font-size:.8rem;font-weight:600;color:var(--color-text-muted) }
.alert-erreur { display:flex;align-items:center;gap:.5rem;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,.25);color:var(--color-danger);border-radius:.75rem;padding:.625rem .875rem;font-size:.83rem }
.spin         { animation:spin 1s linear infinite }
@keyframes spin{ from{ transform:rotate(0deg) } to{ transform:rotate(360deg) } }
.modal-fade-enter-active,.modal-fade-leave-active { transition:all .25s ease }
.modal-fade-enter-from,.modal-fade-leave-to { opacity:0 }
.skeleton-block{ background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.75rem;animation:shimmer 1.5s infinite }
@keyframes shimmer{ 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }
</style>
