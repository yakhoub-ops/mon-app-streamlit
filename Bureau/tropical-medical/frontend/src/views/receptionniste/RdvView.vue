<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-titre">Gestion des rendez-vous</h1>
        <p style="color:var(--color-text-muted);font-size:.875rem">{{ rdvsFiltres.length }} RDV</p>
      </div>
      <button class="btn btn-primary" @click="modalOuvert=true">
        <Plus :size="16" /> Nouveau RDV
      </button>
    </div>

    <!-- Filtres -->
    <div style="display:flex;gap:.875rem;margin-bottom:1.25rem;flex-wrap:wrap;align-items:center">
      <div style="display:flex;gap:.375rem;flex-wrap:wrap">
        <button v-for="f in filtresDef" :key="f.val" class="filtre-btn" :class="{active:filtre===f.val}" @click="filtre=f.val">
          {{ f.label }}
        </button>
      </div>
      <input v-model="dateFiltre" type="date" class="input" style="width:180px;font-size:.83rem;padding:.375rem .625rem" />
      <button v-if="dateFiltre" class="btn btn-ghost btn-sm" @click="dateFiltre=''" style="color:var(--color-danger)">
        <X :size="14" /> Effacer date
      </button>
    </div>

    <div v-if="chargement" style="display:flex;flex-direction:column;gap:.75rem">
      <div class="skeleton-block" v-for="i in 5" :key="i" style="height:72px"></div>
    </div>

    <div v-else-if="rdvsFiltres.length" class="card table-wrap">
      <table class="table-tm">
        <thead>
          <tr>
            <th>Date / Heure</th>
            <th>Patient</th>
            <th>Médecin</th>
            <th>Type</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rdvsFiltres" :key="r.id">
            <td>
              <div style="font-weight:600;font-size:.85rem">{{ fmt(r.date) }}</div>
              <div style="font-size:.75rem;color:var(--color-text-muted)">{{ fmtHeure(r.date) }}</div>
            </td>
            <td>
              <div style="font-weight:600;font-size:.85rem">{{ r.patient.utilisateur.prenom }} {{ r.patient.utilisateur.nom }}</div>
              <div style="font-size:.73rem;color:var(--color-text-muted)">{{ r.patient.utilisateur.telephone || '—' }}</div>
            </td>
            <td style="font-size:.85rem">Dr. {{ r.medecin.utilisateur.prenom }} {{ r.medecin.utilisateur.nom }}</td>
            <td>
              <span class="badge" :class="r.type==='TELECONSULTATION'?'badge-info':'badge-primary'">
                <Video v-if="r.type==='TELECONSULTATION'" :size="11" />
                <MapPin v-else :size="11" />
                {{ r.type==='TELECONSULTATION'?'Télé':'Présentiel' }}
              </span>
            </td>
            <td><span class="badge" :class="statutClass(r.statut)">{{ lblStatut(r.statut) }}</span></td>
            <td>
              <div style="display:flex;gap:.375rem">
                <button v-if="r.statut==='EN_ATTENTE'" class="btn btn-ghost btn-sm" style="color:var(--color-green)" @click="changerStatut(r.id,'CONFIRME')" title="Confirmer">
                  <Check :size="14" />
                </button>
                <button v-if="!['ANNULE','TERMINE'].includes(r.statut)" class="btn btn-ghost btn-sm" style="color:var(--color-danger)" @click="changerStatut(r.id,'ANNULE')" title="Annuler">
                  <X :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="vide-center">
      <CalendarOff :size="48" style="opacity:.25;margin-bottom:.75rem" />
      <p style="color:var(--color-text-muted)">Aucun rendez-vous trouvé</p>
    </div>

    <!-- Modal Nouveau RDV -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="modalOuvert" class="modal-overlay" @click.self="modalOuvert=false">
          <div class="modal-box">
            <div class="modal-header">
              <h2 class="modal-titre"><Calendar :size="18" style="color:var(--color-primary)" /> Nouveau rendez-vous</h2>
              <button class="modal-close" @click="modalOuvert=false"><X :size="20" /></button>
            </div>
            <form @submit.prevent="creerRdv" class="modal-body">
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
                <label class="field-label"><Stethoscope :size="13" /> Médecin</label>
                <select v-model="form.medecinId" class="input" required>
                  <option value="">Sélectionner un médecin…</option>
                  <option v-for="m in medecins" :key="m.id" :value="m.id">
                    Dr. {{ m.utilisateur.prenom }} {{ m.utilisateur.nom }} — {{ m.specialite }}
                  </option>
                </select>
              </div>

              <div class="field">
                <label class="field-label"><Clock :size="13" /> Date et heure</label>
                <input v-model="form.date" type="datetime-local" class="input" :min="minInputLocal()" required />
              </div>

              <div class="field">
                <label class="field-label">Type</label>
                <div style="display:flex;gap:.625rem">
                  <button type="button" class="type-btn" :class="{active:form.type==='PRESENTIEL'}" @click="form.type='PRESENTIEL'">
                    <MapPin :size="14" /> Présentiel
                  </button>
                  <button type="button" class="type-btn" :class="{active:form.type==='TELECONSULTATION'}" @click="form.type='TELECONSULTATION'">
                    <Video :size="14" /> Téléconsultation
                  </button>
                </div>
              </div>

              <div class="field">
                <label class="field-label"><MessageSquare :size="13" /> Motif</label>
                <input v-model="form.motif" type="text" class="input" placeholder="Motif de consultation…" />
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="modalOuvert=false">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="envoi">
                  <Loader2 v-if="envoi" :size="16" class="spin" /><Check v-else :size="16" />
                  {{ envoi ? 'Création…' : 'Créer le RDV' }}
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
import { Plus, Calendar, CalendarOff, Check, X, Video, MapPin, Clock,
         User, Stethoscope, MessageSquare, AlertCircle, Loader2 } from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { fmt, fmtHeure, minInputLocal } = useDate()

const chargement = ref(true)
const rdvs       = ref([])
const patients   = ref([])
const medecins   = ref([])
const filtre     = ref('tous')
const dateFiltre = ref('')
const modalOuvert= ref(false)
const envoi      = ref(false)
const erreur     = ref('')
const form       = ref({ patientId:'', medecinId:'', date:'', type:'PRESENTIEL', motif:'' })

const filtresDef = [
  { val:'tous',       label:'Tous' },
  { val:'EN_ATTENTE', label:'En attente' },
  { val:'CONFIRME',   label:'Confirmés' },
  { val:'ANNULE',     label:'Annulés' },
  { val:'TERMINE',    label:'Terminés' },
]

const rdvsFiltres = computed(() => {
  let r = rdvs.value
  if (filtre.value !== 'tous') r = r.filter(x => x.statut === filtre.value)
  if (dateFiltre.value) r = r.filter(x => x.date.startsWith(dateFiltre.value))
  return r
})

async function charger() {
  chargement.value = true
  try { rdvs.value = await api.get('/receptionniste/rdv') }
  finally { chargement.value = false }
}

onMounted(async () => {
  const [, pats, meds] = await Promise.all([charger(), api.get('/receptionniste/patients'), api.get('/receptionniste/medecins')])
  patients.value = pats
  medecins.value = meds
})

async function changerStatut(id, statut) {
  await api.put(`/receptionniste/rdv/${id}`, { statut })
  await charger()
}

async function creerRdv() {
  erreur.value = ''; envoi.value = true
  try {
    await api.post('/receptionniste/rdv', { ...form.value, patientId: parseInt(form.value.patientId), medecinId: parseInt(form.value.medecinId) })
    modalOuvert.value = false
    form.value = { patientId:'', medecinId:'', date:'', type:'PRESENTIEL', motif:'' }
    await charger()
  } catch(e) { erreur.value = e.message }
  finally { envoi.value = false }
}

function lblStatut(s) { return { EN_ATTENTE:'En attente', CONFIRME:'Confirmé', ANNULE:'Annulé', TERMINE:'Terminé' }[s] || s }
function statutClass(s) { return { EN_ATTENTE:'badge-warning', CONFIRME:'badge-green', ANNULE:'badge-danger', TERMINE:'badge-gray' }[s] || 'badge-gray' }
</script>

<style scoped>
.page-header  { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;gap:1rem }
.page-titre   { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
/* .filtre-btn — styles globaux dans style.css */
.vide-center  { display:flex;flex-direction:column;align-items:center;padding:4rem 1rem }
.modal-overlay{ position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem }
.modal-box    { background:white;border-radius:1.25rem;width:100%;max-width:500px;max-height:90vh;overflow-y:auto }
.modal-header { display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #F1F5F9 }
.modal-titre  { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:1rem;font-weight:700 }
.modal-close  { background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex }
.modal-body   { padding:1.5rem;display:flex;flex-direction:column;gap:1rem }
.modal-footer { display:flex;justify-content:flex-end;gap:.75rem;padding-top:.5rem }
.field        { display:flex;flex-direction:column;gap:.375rem }
.field-label  { display:flex;align-items:center;gap:.375rem;font-size:.8rem;font-weight:600;color:var(--color-text-muted) }
/* .type-btn — styles globaux dans style.css */
.alert-erreur { display:flex;align-items:center;gap:.5rem;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,.25);color:var(--color-danger);border-radius:.75rem;padding:.625rem .875rem;font-size:.83rem }
.spin         { animation:spin 1s linear infinite }
@keyframes spin{ from{ transform:rotate(0deg) } to{ transform:rotate(360deg) } }
.modal-fade-enter-active,.modal-fade-leave-active { transition:all .25s ease }
.modal-fade-enter-from,.modal-fade-leave-to { opacity:0 }
.skeleton-block{ background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.625rem;animation:shimmer 1.5s infinite }
@keyframes shimmer{ 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }
</style>
