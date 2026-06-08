<template>
  <div style="max-width:800px">
    <!-- Chargement passage -->
    <div v-if="chargement" style="display:flex;flex-direction:column;gap:1rem">
      <div class="skeleton-block" style="height:100px"></div>
      <div class="skeleton-block" style="height:400px"></div>
    </div>

    <template v-else-if="passage">
      <!-- Fiche patient -->
      <div class="card patient-banner" style="margin-bottom:1.25rem;padding:1.25rem 1.5rem">
        <div class="patient-avatar"><User :size="24" /></div>
        <div style="flex:1">
          <div class="patient-nom">{{ passage.patient.utilisateur.prenom }} {{ passage.patient.utilisateur.nom }}</div>
          <div class="patient-sub">
            <Phone :size="12" /> {{ passage.patient.utilisateur.telephone || '—' }}
            <span v-if="passage.motif"> · {{ passage.motif }}</span>
          </div>
          <div v-if="passage.patient.dossier" class="patient-sub">
            <FolderOpen :size="12" /> Dossier #{{ passage.patient.dossier.numeroDossier }}
          </div>
        </div>
        <span class="badge" :class="urgenceClass(passage.niveauUrgence)">{{ passage.niveauUrgence }}</span>
      </div>

      <!-- Formulaire consultation -->
      <div class="card" style="padding:1.5rem">
        <h2 class="section-titre" style="margin-bottom:1.25rem">
          <Stethoscope :size="18" style="color:var(--color-primary)" /> Nouvelle consultation
        </h2>

        <form @submit.prevent="soumettre" style="display:flex;flex-direction:column;gap:1.25rem">
          <div v-if="erreur" class="alert-erreur">
            <AlertCircle :size="15" /> {{ erreur }}
          </div>

          <div class="deux-cols">
            <div class="field">
              <label class="field-label"><MessageSquare :size="13" /> Motif</label>
              <input v-model="form.motif" type="text" class="input" placeholder="Motif de consultation" />
            </div>
            <div class="field">
              <label class="field-label"><Calendar :size="13" /> Prochain RDV (optionnel)</label>
              <input v-model="form.prochainRdv" type="date" class="input" />
            </div>
          </div>

          <div class="field">
            <label class="field-label"><ClipboardList :size="13" /> Anamnèse</label>
            <textarea v-model="form.anamnese" class="input textarea" rows="2" placeholder="Histoire de la maladie…"></textarea>
          </div>

          <div class="field">
            <label class="field-label"><Activity :size="13" /> Examen clinique</label>
            <textarea v-model="form.examenClinique" class="input textarea" rows="2" placeholder="Résultats de l'examen…"></textarea>
          </div>

          <div class="field">
            <label class="field-label"><Eye :size="13" /> Diagnostic</label>
            <textarea v-model="form.diagnostic" class="input textarea" rows="2" placeholder="Diagnostic établi…"></textarea>
          </div>

          <div class="field">
            <label class="field-label"><Pill :size="13" /> Traitement prescrit</label>
            <textarea v-model="form.traitement" class="input textarea" rows="2" placeholder="Traitement à suivre…"></textarea>
          </div>

          <div class="field">
            <label class="field-label"><FileText :size="13" /> Notes internes</label>
            <textarea v-model="form.notes" class="input textarea" rows="2" placeholder="Notes pour le dossier…"></textarea>
          </div>

          <!-- Ordonnance -->
          <div class="ordo-section">
            <div class="ordo-header" @click="ordo.ouvert = !ordo.ouvert">
              <h3 class="ordo-titre">
                <Pill :size="16" style="color:var(--color-primary)" /> Ordonnance
                <span v-if="ordo.lignes.length" class="ordo-count">{{ ordo.lignes.length }}</span>
              </h3>
              <ChevronDown :size="16" :class="['chevron',ordo.ouvert?'rotated':'']" />
            </div>

            <Transition name="slide">
              <div v-if="ordo.ouvert" class="ordo-body">
                <div class="field" style="margin-bottom:.75rem">
                  <label class="field-label"><Info :size="13" /> Instructions générales</label>
                  <input v-model="ordo.instructions" type="text" class="input" placeholder="Ex: Prendre après les repas" />
                </div>

                <!-- Lignes médicaments -->
                <div v-for="(lg, i) in ordo.lignes" :key="i" class="ordo-ligne-form">
                  <div class="ordo-ligne-num">{{ i + 1 }}</div>
                  <div style="flex:1;display:flex;flex-direction:column;gap:.5rem">
                    <select v-model="lg.medicamentId" class="input input-sm" required>
                      <option value="">Sélectionner un médicament…</option>
                      <option v-for="m in medicaments" :key="m.id" :value="m.id">
                        {{ m.nom }} {{ m.dosage ? '· '+m.dosage : '' }} ({{ m.forme }})
                      </option>
                    </select>
                    <div style="display:flex;gap:.5rem;flex-wrap:wrap">
                      <input v-model="lg.posologie" class="input input-sm" placeholder="Posologie ex: 1cp 3x/j" style="flex:2;min-width:120px" />
                      <input v-model="lg.duree" class="input input-sm" placeholder="Durée ex: 7 jours" style="flex:1;min-width:80px" />
                      <input v-model.number="lg.quantite" type="number" min="1" class="input input-sm" placeholder="Qté" style="width:70px" />
                    </div>
                  </div>
                  <button type="button" class="remove-btn" @click="ordo.lignes.splice(i,1)">
                    <X :size="15" />
                  </button>
                </div>

                <button type="button" class="btn btn-outline btn-sm" style="width:100%;margin-top:.625rem" @click="ajouterLigne">
                  <Plus :size="14" /> Ajouter un médicament
                </button>
              </div>
            </Transition>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:.75rem;padding-top:.5rem;border-top:1px solid #F1F5F9">
            <RouterLink to="/medecin/file-attente" class="btn btn-ghost">Annuler</RouterLink>
            <button type="submit" class="btn btn-primary" :disabled="envoi">
              <Loader2 v-if="envoi" :size="16" class="spin" />
              <Check v-else :size="16" />
              {{ envoi ? 'Enregistrement…' : 'Valider la consultation' }}
            </button>
          </div>
        </form>
      </div>
    </template>

    <div v-else class="vide-center" style="padding:5rem 1rem">
      <AlertCircle :size="48" style="opacity:.3;margin-bottom:.75rem" />
      <p style="color:var(--color-text-muted)">Passage introuvable</p>
      <RouterLink to="/medecin/file-attente" class="btn btn-primary" style="margin-top:1rem">
        <ArrowLeft :size="15" /> Retour
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  User, Phone, FolderOpen, Stethoscope, AlertCircle,
  MessageSquare, Calendar, ClipboardList, Activity, Eye,
  Pill, FileText, ChevronDown, Info, Plus, X, Check,
  Loader2, ArrowLeft,
} from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'

const route  = useRoute()
const router = useRouter()
const api    = useApi()

const chargement  = ref(true)
const passage     = ref(null)
const medicaments = ref([])
const envoi       = ref(false)
const erreur      = ref('')

const form = reactive({
  motif: '', anamnese: '', examenClinique: '',
  diagnostic: '', traitement: '', notes: '', prochainRdv: '',
})

const ordo = reactive({
  ouvert: false,
  instructions: '',
  lignes: [],
})

function ajouterLigne() {
  ordo.lignes.push({ medicamentId: '', posologie: '', duree: '', quantite: 1 })
}

onMounted(async () => {
  try {
    const [fa, meds] = await Promise.all([
      api.get('/medecin/file-attente'),
      api.get('/medecin/medicaments'),
    ])
    const passageId = parseInt(route.params.id)
    passage.value   = fa.find(p => p.id === passageId) || null
    medicaments.value = meds

    if (passage.value?.motif) form.motif = passage.value.motif
    ordo.ouvert = true
  } finally { chargement.value = false }
})

async function soumettre() {
  erreur.value = ''; envoi.value = true
  try {
    if (!passage.value?.patient?.dossier?.id) {
      erreur.value = 'Ce patient n\'a pas de dossier médical'
      return
    }

    const payload = {
      passageId: passage.value.id,
      dossierId: passage.value.patient.dossier.id,
      ...form,
      prochainRdv: form.prochainRdv || undefined,
    }

    if (ordo.lignes.length > 0) {
      payload.ordonnance = {
        instructions: ordo.instructions,
        lignes: ordo.lignes.filter(l => l.medicamentId),
      }
    }

    await api.post('/medecin/consultations', payload)
    router.push('/medecin/file-attente')
  } catch(e) { erreur.value = e.message }
  finally    { envoi.value = false }
}

function urgenceClass(n) {
  return { CRITIQUE:'badge-danger', URGENT:'badge-warning', MODERE:'badge-info', FAIBLE:'badge-gray' }[n] || 'badge-gray'
}
</script>

<style scoped>
.patient-banner{ display:flex;align-items:center;gap:1rem }
.patient-avatar{ width:48px;height:48px;border-radius:50%;background:rgba(14,159,142,0.12);display:flex;align-items:center;justify-content:center;color:var(--color-primary);flex-shrink:0 }
.patient-nom   { font-weight:700;font-size:1rem;color:var(--color-text) }
.patient-sub   { display:flex;align-items:center;gap:.375rem;font-size:.78rem;color:var(--color-text-muted);margin-top:.2rem }
.section-titre { display:flex;align-items:center;gap:.625rem;font-family:var(--font-display);font-size:1.05rem;font-weight:700;color:var(--color-text) }
.deux-cols     { display:grid;grid-template-columns:1fr 1fr;gap:1rem }
@media(max-width:560px){ .deux-cols { grid-template-columns:1fr } }
.field         { display:flex;flex-direction:column;gap:.375rem }
.field-label   { display:flex;align-items:center;gap:.375rem;font-size:.8rem;font-weight:600;color:var(--color-text-muted) }
.textarea      { resize:vertical;min-height:64px }
.ordo-section  { border:1.5px solid #E2E8F0;border-radius:.875rem;overflow:hidden }
.ordo-header   { display:flex;align-items:center;justify-content:space-between;padding:.875rem 1rem;cursor:pointer;background:#FAFBFC }
.ordo-titre    { display:flex;align-items:center;gap:.5rem;font-weight:700;font-size:.9rem;color:var(--color-text) }
.ordo-count    { background:var(--color-primary);color:white;border-radius:9999px;font-size:.65rem;font-weight:700;padding:1px 6px }
.chevron       { color:var(--color-text-muted);transition:transform .25s }
.chevron.rotated{ transform:rotate(180deg) }
.ordo-body     { padding:1rem;border-top:1px solid #E2E8F0;display:flex;flex-direction:column;gap:.625rem }
.ordo-ligne-form{ display:flex;align-items:flex-start;gap:.625rem;background:#F8FAFC;border-radius:.625rem;padding:.625rem }
.ordo-ligne-num { width:22px;height:22px;border-radius:50%;background:var(--color-primary);color:white;font-size:.7rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:.25rem }
.remove-btn    { background:none;border:none;cursor:pointer;color:var(--color-danger);display:flex;align-items:center;padding:.25rem;flex-shrink:0 }
.input-sm      { font-size:.82rem;padding:.375rem .625rem }
.alert-erreur  { display:flex;align-items:center;gap:.5rem;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,.25);color:var(--color-danger);border-radius:.75rem;padding:.625rem .875rem;font-size:.85rem }
.vide-center   { display:flex;flex-direction:column;align-items:center }
.spin          { animation:spin 1s linear infinite }
@keyframes spin{ from{ transform:rotate(0deg) } to{ transform:rotate(360deg) } }
.slide-enter-active,.slide-leave-active{ transition:all .25s ease }
.slide-enter-from,.slide-leave-to{ opacity:0;transform:translateY(-6px) }
.skeleton-block{ background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.75rem;animation:shimmer 1.5s infinite }
@keyframes shimmer{ 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }
</style>
