<template>
  <div>
    <h1 class="page-titre" style="margin-bottom:1.5rem">Mon dossier médical</h1>

    <div v-if="chargement" style="display:flex;flex-direction:column;gap:1rem">
      <div class="skeleton-block" style="height:140px"></div>
      <div class="skeleton-block" style="height:300px"></div>
    </div>

    <template v-else-if="dossier">
      <!-- Fiche patient -->
      <div class="card fiche-patient" style="margin-bottom:1.25rem;padding:1.5rem">
        <div class="fiche-header">
          <div class="avatar-cercle">
            <User :size="32" />
          </div>
          <div>
            <div class="fiche-nom">{{ dossier.patient.utilisateur.prenom }} {{ dossier.patient.utilisateur.nom }}</div>
            <div class="fiche-sub">Né(e) le {{ fmtDate(dossier.patient.dateNaissance) }} · {{ age(dossier.patient.dateNaissance) }} ans</div>
          </div>
        </div>
        <div class="fiche-chips">
          <div class="fiche-chip" :class="dossier.groupeSanguin?'chip-red':'chip-gray'">
            <Droplets :size="14" />
            <span>{{ dossier.groupeSanguin || 'Groupe sanguin inconnu' }}</span>
          </div>
          <div v-if="dossier.allergies" class="fiche-chip chip-orange">
            <AlertTriangle :size="14" />
            <span>Allergies : {{ dossier.allergies }}</span>
          </div>
          <div v-if="dossier.antecedents" class="fiche-chip chip-blue">
            <ClipboardList :size="14" />
            <span>Antécédents : {{ dossier.antecedents }}</span>
          </div>
        </div>
      </div>

      <!-- Consultations -->
      <div class="card" style="padding:1.25rem">
        <h2 class="section-titre"><ClipboardList :size="17" /> Historique des consultations</h2>

        <div v-if="!dossier.consultations?.length" class="vide-center" style="padding:2rem">
          <ClipboardList :size="36" style="opacity:.25;margin-bottom:.5rem" />
          <p style="color:var(--color-text-muted);font-size:.875rem">Aucune consultation enregistrée</p>
        </div>

        <div v-else class="consultations-list">
          <div v-for="c in dossier.consultations" :key="c.id" class="consult-item">
            <div class="consult-timeline-dot"></div>
            <div class="consult-card" :class="{ expanded: ouvert===c.id }">
              <button class="consult-header" @click="ouvert = ouvert===c.id ? null : c.id">
                <div style="display:flex;align-items:center;gap:.75rem;flex:1">
                  <div class="consult-date-box">
                    <span>{{ new Date(c.createdAt).toLocaleDateString('fr-SN',{day:'numeric',month:'short'}) }}</span>
                    <span>{{ new Date(c.createdAt).getFullYear() }}</span>
                  </div>
                  <div>
                    <div style="font-weight:600;font-size:.9rem;color:var(--color-text)">Dr. {{ c.medecin.utilisateur.prenom }} {{ c.medecin.utilisateur.nom }}</div>
                    <div style="font-size:.75rem;color:var(--color-text-muted)">{{ c.medecin.specialite }}</div>
                  </div>
                </div>
                <ChevronDown :size="16" class="consult-chevron" :class="{ rotated: ouvert===c.id }" />
              </button>

              <Transition name="slide">
                <div v-if="ouvert===c.id" class="consult-body">
                  <div class="consult-row"><span class="cr-label"><Thermometer :size="13" /> Motif</span><span>{{ c.motif || '—' }}</span></div>
                  <div class="consult-row"><span class="cr-label"><Eye :size="13" /> Diagnostic</span><span>{{ c.diagnostic || '—' }}</span></div>
                  <div class="consult-row"><span class="cr-label"><FileText :size="13" /> Notes</span><span>{{ c.notes || '—' }}</span></div>
                  <div class="consult-row"><span class="cr-label"><Pill :size="13" /> Traitement</span><span>{{ c.traitement || '—' }}</span></div>
                  <div v-if="c.tensionArterielle" class="consult-row">
                    <span class="cr-label"><Activity :size="13" /> Tension</span><span>{{ c.tensionArterielle }}</span>
                  </div>
                  <div v-if="c.pouls" class="consult-row">
                    <span class="cr-label"><Heart :size="13" /> Pouls</span><span>{{ c.pouls }} bpm</span>
                  </div>
                  <div v-if="c.temperature" class="consult-row">
                    <span class="cr-label"><Thermometer :size="13" /> Température</span><span>{{ c.temperature }} °C</span>
                  </div>
                  <div v-if="c.poids" class="consult-row">
                    <span class="cr-label"><Scale :size="13" /> Poids</span><span>{{ c.poids }} kg</span>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="vide-center" style="padding:5rem 1rem">
      <FolderOpen :size="48" style="opacity:.25;margin-bottom:.75rem" />
      <p style="color:var(--color-text-muted)">Aucun dossier médical trouvé</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  User, Droplets, AlertTriangle, ClipboardList, FileText,
  ChevronDown, Thermometer, Eye, Pill, Activity, Heart,
  Scale, FolderOpen,
} from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { fmt: fmtDate } = useDate()

const chargement = ref(true)
const dossier    = ref(null)
const ouvert     = ref(null)

function age(dob) {
  if (!dob) return '?'
  const a = new Date(), b = new Date(dob)
  let y = a.getFullYear() - b.getFullYear()
  if (a.getMonth() < b.getMonth() || (a.getMonth()===b.getMonth() && a.getDate()<b.getDate())) y--
  return y
}

onMounted(async () => {
  try { dossier.value = await api.get('/patient/dossier') }
  catch { dossier.value = null }
  finally { chargement.value = false }
})
</script>

<style scoped>
.page-titre   { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
.fiche-header { display:flex;align-items:center;gap:1rem;margin-bottom:1rem }
.avatar-cercle{ width:56px;height:56px;border-radius:50%;background:rgba(14,159,142,0.12);display:flex;align-items:center;justify-content:center;color:var(--color-primary);flex-shrink:0 }
.fiche-nom    { font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:var(--color-text) }
.fiche-sub    { font-size:.8rem;color:var(--color-text-muted);margin-top:.125rem }
.fiche-chips  { display:flex;flex-wrap:wrap;gap:.5rem }
.fiche-chip   { display:flex;align-items:center;gap:.375rem;padding:.375rem .75rem;border-radius:9999px;font-size:.78rem;font-weight:500 }
.chip-red     { background:rgba(220,38,38,0.08);color:#DC2626 }
.chip-orange  { background:rgba(245,158,11,0.1);color:#D97706 }
.chip-blue    { background:rgba(14,165,233,0.1);color:#0284C7 }
.chip-gray    { background:#F1F5F9;color:var(--color-text-muted) }
.section-titre{ display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--color-text);margin-bottom:1.25rem }
.consultations-list { display:flex;flex-direction:column;gap:0;position:relative;padding-left:1.5rem }
.consultations-list::before { content:'';position:absolute;left:.625rem;top:0;bottom:0;width:2px;background:#E2E8F0 }
.consult-item { position:relative;padding-bottom:1rem }
.consult-timeline-dot { position:absolute;left:-1.5rem;top:.875rem;width:10px;height:10px;border-radius:50%;background:var(--color-primary);border:2px solid white;z-index:1 }
.consult-card { background:#F8FAFC;border-radius:.75rem;border:1px solid #E2E8F0;overflow:hidden }
.consult-header { width:100%;display:flex;align-items:center;padding:.75rem 1rem;background:none;border:none;cursor:pointer;text-align:left;gap:.5rem }
.consult-date-box { display:flex;flex-direction:column;align-items:center;background:white;border-radius:.5rem;padding:.375rem .625rem;min-width:52px;border:1px solid #E2E8F0;font-size:.72rem;font-weight:600;color:var(--color-text-muted);line-height:1.4 }
.consult-chevron  { color:var(--color-text-muted);transition:transform .25s }
.consult-chevron.rotated { transform:rotate(180deg) }
.consult-body { padding:.75rem 1rem;border-top:1px solid #E2E8F0;display:flex;flex-direction:column;gap:.5rem }
.consult-row  { display:flex;align-items:flex-start;gap:.75rem;font-size:.83rem;color:var(--color-text) }
.cr-label     { display:flex;align-items:center;gap:.3rem;min-width:100px;font-weight:600;color:var(--color-text-muted);flex-shrink:0 }
.vide-center  { display:flex;flex-direction:column;align-items:center }
.slide-enter-active,.slide-leave-active{transition:all .25s ease}
.slide-enter-from,.slide-leave-to{opacity:0;transform:translateY(-8px)}
.skeleton-block{background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.75rem;animation:shimmer 1.5s infinite}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
</style>
