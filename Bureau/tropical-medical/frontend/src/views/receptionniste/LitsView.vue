<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-titre">Gestion des lits</h1>
        <p style="color:var(--color-text-muted);font-size:.875rem">{{ lits.length }} lits · {{ libres }} libres</p>
      </div>
      <button class="btn btn-ghost btn-sm" @click="charger"><RefreshCw :size="14" /> Actualiser</button>
    </div>

    <!-- Légende / stats rapides -->
    <div class="legende-bar">
      <div class="legende-stat legende-libre" style="animation:legendeIn .45s cubic-bezier(.34,1.56,.64,1) .05s both">
        <div class="legende-icon"><BedDouble :size="16" /></div>
        <div>
          <div class="legende-nb">{{ compteur('LIBRE') }}</div>
          <div class="legende-txt">Libres</div>
        </div>
      </div>
      <div class="legende-stat legende-occupe" style="animation:legendeIn .45s cubic-bezier(.34,1.56,.64,1) .12s both">
        <div class="legende-icon"><BedDouble :size="16" /></div>
        <div>
          <div class="legende-nb">{{ compteur('OCCUPE') }}</div>
          <div class="legende-txt">Occupés</div>
        </div>
      </div>
      <div class="legende-stat legende-reserve" style="animation:legendeIn .45s cubic-bezier(.34,1.56,.64,1) .19s both">
        <div class="legende-icon"><BedDouble :size="16" /></div>
        <div>
          <div class="legende-nb">{{ compteur('RESERVE') }}</div>
          <div class="legende-txt">Réservés</div>
        </div>
      </div>
      <div class="legende-stat legende-maintenance" style="animation:legendeIn .45s cubic-bezier(.34,1.56,.64,1) .26s both">
        <div class="legende-icon"><Wrench :size="16" /></div>
        <div>
          <div class="legende-nb">{{ compteur('MAINTENANCE') }}</div>
          <div class="legende-txt">Maintenance</div>
        </div>
      </div>
    </div>

    <!-- Filtres étage -->
    <div style="display:flex;gap:.375rem;margin-bottom:1.25rem;flex-wrap:wrap">
      <button class="filtre-btn" :class="{active:etageFiltre===null}" @click="etageFiltre=null">Tous</button>
      <button v-for="e in etages" :key="e" class="filtre-btn" :class="{active:etageFiltre===e}" @click="etageFiltre=e">
        Étage {{ e }}
      </button>
    </div>

    <div v-if="chargement" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:.75rem">
      <div class="skeleton-block" v-for="i in 15" :key="i" style="height:100px"></div>
    </div>

    <div v-else class="lits-grid">
      <div
        v-for="(lit, idx) in litsFiltres" :key="lit.id"
        class="lit-card"
        :class="[`lit-${lit.statut.toLowerCase()}`, lit.statut==='LIBRE'?'lit-clickable':'']"
        :style="{ animation: `litIn .4s cubic-bezier(.34,1.56,.64,1) ${idx * 0.04}s both` }"
        @click="lit.statut==='LIBRE' && ouvrirHospitaliser(lit)"
      >
        <div class="lit-numero"><BedDouble :size="18" /> {{ lit.numero }}</div>
        <div class="lit-chambre">Chambre {{ lit.chambre }}</div>
        <div class="lit-type">{{ lblType(lit.type) }}</div>
        <div v-if="lit.hospitalisations?.length" class="lit-patient">
          <User :size="11" />
          {{ lit.hospitalisations[0].patient.utilisateur.prenom }} {{ lit.hospitalisations[0].patient.utilisateur.nom }}
        </div>
        <div class="lit-statut-badge">{{ lblStatut(lit.statut) }}</div>

        <!-- Actions sur lits occupés/réservés -->
        <div v-if="['OCCUPE','RESERVE'].includes(lit.statut)" class="lit-actions">
          <button class="lit-action-btn" @click.stop="libererLit(lit)" title="Libérer">
            <LogOut :size="13" />
          </button>
          <button class="lit-action-btn" @click.stop="changerStatut(lit,'MAINTENANCE')" title="Maintenance">
            <Wrench :size="13" />
          </button>
        </div>
        <div v-if="lit.statut==='MAINTENANCE'" class="lit-actions">
          <button class="lit-action-btn" @click.stop="changerStatut(lit,'LIBRE')" title="Libérer">
            <Check :size="13" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Hospitaliser -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="modalHosp" class="modal-overlay" @click.self="modalHosp=null">
          <div class="modal-box">
            <div class="modal-header">
              <h2 class="modal-titre"><BedDouble :size="18" style="color:var(--color-primary)" /> Admettre un patient — Lit {{ modalHosp.numero }}</h2>
              <button class="modal-close" @click="modalHosp=null"><X :size="20" /></button>
            </div>
            <form @submit.prevent="hospitaliser" class="modal-body">
              <div v-if="erreur" class="alert-erreur"><AlertCircle :size="14" /> {{ erreur }}</div>

              <div class="field">
                <label class="field-label"><User :size="13" /> Patient</label>
                <select v-model="hospForm.patientId" class="input" required>
                  <option value="">Sélectionner un patient…</option>
                  <option v-for="p in patients" :key="p.id" :value="p.id">
                    {{ p.utilisateur.prenom }} {{ p.utilisateur.nom }}
                  </option>
                </select>
              </div>

              <div class="field">
                <label class="field-label"><Stethoscope :size="13" /> Médecin responsable</label>
                <select v-model="hospForm.medecinId" class="input">
                  <option value="">Aucun spécifié</option>
                  <option v-for="m in medecins" :key="m.id" :value="m.id">
                    Dr. {{ m.utilisateur.prenom }} {{ m.utilisateur.nom }}
                  </option>
                </select>
              </div>

              <div class="field">
                <label class="field-label"><MessageSquare :size="13" /> Motif d'hospitalisation</label>
                <input v-model="hospForm.motif" type="text" class="input" placeholder="Ex: Suivi post-opératoire…" />
              </div>

              <div class="field">
                <label class="field-label">Coût par jour (FCFA)</label>
                <input v-model.number="hospForm.coutParJour" type="number" min="0" step="1000" class="input" />
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="modalHosp=null">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="envoi">
                  <Loader2 v-if="envoi" :size="16" class="spin" /><Check v-else :size="16" />
                  {{ envoi ? 'Admission…' : 'Admettre' }}
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
import { BedDouble, User, Stethoscope, RefreshCw, LogOut, Wrench, Check, X, AlertCircle, Loader2, MessageSquare } from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'

const api = useApi()

const chargement = ref(true)
const lits       = ref([])
const patients   = ref([])
const medecins   = ref([])
const etageFiltre= ref(null)
const modalHosp  = ref(null)
const envoi      = ref(false)
const erreur     = ref('')
const hospForm   = ref({ patientId:'', medecinId:'', motif:'', coutParJour: 15000 })

const etages     = computed(() => [...new Set(lits.value.map(l => l.etage))].sort())
const libres     = computed(() => lits.value.filter(l => l.statut === 'LIBRE').length)
const litsFiltres= computed(() => etageFiltre.value !== null ? lits.value.filter(l => l.etage === etageFiltre.value) : lits.value)

function compteur(s) { return lits.value.filter(l => l.statut === s).length }

async function charger() {
  chargement.value = true
  try { lits.value = await api.get('/receptionniste/lits') }
  finally { chargement.value = false }
}

onMounted(async () => {
  await charger()
  const [pats, meds] = await Promise.all([api.get('/receptionniste/patients'), api.get('/receptionniste/medecins')])
  patients.value = pats; medecins.value = meds
})

function ouvrirHospitaliser(lit) {
  modalHosp.value = lit
  hospForm.value  = { patientId:'', medecinId:'', motif:'', coutParJour: 15000 }
  erreur.value    = ''
}

async function hospitaliser() {
  erreur.value = ''; envoi.value = true
  try {
    await api.post('/receptionniste/hospitalisations', {
      litId: modalHosp.value.id,
      patientId: parseInt(hospForm.value.patientId),
      medecinId: hospForm.value.medecinId ? parseInt(hospForm.value.medecinId) : undefined,
      motif: hospForm.value.motif || undefined,
      coutParJour: hospForm.value.coutParJour,
    })
    modalHosp.value = null
    await charger()
  } catch(e) { erreur.value = e.message }
  finally { envoi.value = false }
}

async function libererLit(lit) {
  const hosp = lit.hospitalisations?.[0]
  if (hosp) {
    if (!confirm('Valider la sortie du patient ?')) return
    await api.put(`/receptionniste/hospitalisations/${hosp.id}/sortie`)
  } else {
    await api.put(`/receptionniste/lits/${lit.id}`, { statut:'LIBRE' })
  }
  await charger()
}

async function changerStatut(lit, statut) {
  await api.put(`/receptionniste/lits/${lit.id}`, { statut })
  await charger()
}

function lblStatut(s) { return { LIBRE:'Libre', OCCUPE:'Occupé', RESERVE:'Réservé', MAINTENANCE:'Maintenance' }[s] || s }
function lblType(t)   { return { STANDARD:'Standard', VIP:'VIP', SOINS_INTENSIFS:'Soins intensifs', MATERNITE:'Maternité' }[t] || t }
</script>

<style scoped>
.page-header  { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;gap:1rem }
.page-titre   { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
/* Légende stats */
.legende-bar { display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem }
.legende-stat {
  display:flex;align-items:center;gap:.625rem;
  background:var(--color-surface);border:1.5px solid var(--color-border);
  border-radius:1rem;padding:.625rem 1rem;
  flex:1;min-width:130px;
  box-shadow:0 2px 6px rgba(0,0,0,.04);
  position:relative;overflow:hidden;
  transition:transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease;
}
.legende-stat:hover { transform:translateY(-3px) scale(1.02); box-shadow:0 10px 24px rgba(0,0,0,.09); }
.legende-stat:hover .legende-icon { animation:iconBounceS .35s cubic-bezier(.34,1.56,.64,1) forwards; }
.legende-stat::before { content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:1rem 1rem 0 0;background-size:200% 100%;animation:stripeMove 3s ease-in-out infinite; }
.legende-stat::after  { content:'';position:absolute;top:0;left:-60%;width:40%;height:3px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);animation:stripeShine 3.5s ease-in-out infinite;pointer-events:none; }
.legende-icon { width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .2s }
.legende-nb   { font-family:var(--font-display);font-size:1.375rem;font-weight:800;line-height:1 }
.legende-txt  { font-size:.7rem;font-weight:600;margin-top:.125rem;color:var(--color-text-muted) }

.legende-libre::before    { background:linear-gradient(90deg,#22C55E,#4ADE80) }
.legende-libre .legende-icon { background:rgba(34,197,94,.12);color:#16A34A }
.legende-libre .legende-nb   { color:#16A34A }

.legende-occupe::before   { background:linear-gradient(90deg,#EF4444,#F87171) }
.legende-occupe .legende-icon { background:rgba(239,68,68,.10);color:#DC2626 }
.legende-occupe .legende-nb   { color:#DC2626 }

.legende-reserve::before  { background:linear-gradient(90deg,#F59E0B,#FCD34D) }
.legende-reserve .legende-icon { background:rgba(245,158,11,.12);color:#D97706 }
.legende-reserve .legende-nb   { color:#D97706 }

.legende-maintenance::before { background:linear-gradient(90deg,#94A3B8,#CBD5E1) }
.legende-maintenance .legende-icon { background:rgba(148,163,184,.15);color:#64748B }
.legende-maintenance .legende-nb   { color:#64748B }

/* .filtre-btn — styles globaux dans style.css */
.lits-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:.875rem }
.lit-card {
  border-radius:1rem;padding:1rem;
  border:1.5px solid var(--color-border);
  position:relative;
  background:var(--color-surface);
  box-shadow:0 2px 6px rgba(0,0,0,.04);
  overflow:hidden;
  transition:transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease, border-color .2s;
}
.lit-card::before { content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:1rem 1rem 0 0;background-size:200% 100%;animation:stripeMove 3s ease-in-out infinite; }
.lit-card::after  { content:'';position:absolute;top:0;left:-60%;width:40%;height:3px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);animation:stripeShine 3.5s ease-in-out infinite;pointer-events:none; }
.lit-card.lit-libre::before    { background:linear-gradient(90deg,#22C55E,#4ADE80,#22C55E) }
.lit-card.lit-occupe::before   { background:linear-gradient(90deg,#EF4444,#F87171,#EF4444) }
.lit-card.lit-reserve::before  { background:linear-gradient(90deg,#F59E0B,#FCD34D,#F59E0B) }
.lit-card.lit-maintenance::before { background:linear-gradient(90deg,#94A3B8,#CBD5E1,#94A3B8) }

.lit-numero   { display:flex;align-items:center;gap:.375rem;font-family:var(--font-display);font-size:1rem;font-weight:800;margin-bottom:.25rem;margin-top:.25rem }
.lit-chambre  { font-size:.73rem;color:var(--color-text-muted) }
.lit-type     { font-size:.7rem;color:var(--color-text-muted);margin-bottom:.375rem }
.lit-patient  { display:flex;align-items:center;gap:.25rem;font-size:.72rem;font-weight:600;color:var(--color-text);margin-top:.25rem }
.lit-statut-badge { margin-top:.5rem;font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:2px 8px;border-radius:9999px;display:inline-flex;align-items:center }
.lit-card.lit-occupe .lit-statut-badge { animation:chipPulse 2.2s ease-in-out infinite; }
.lit-actions  { position:absolute;top:.625rem;right:.625rem;display:flex;gap:.25rem }
.lit-action-btn { width:26px;height:26px;border-radius:.5rem;border:1.5px solid var(--color-border);background:var(--color-surface);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--color-text-muted);transition:all .18s }
.lit-action-btn:hover { background:var(--color-bg);border-color:var(--color-primary);color:var(--color-primary);transform:scale(1.12) }
.lit-clickable { cursor:pointer }
.lit-clickable:hover { border-color:var(--color-primary);transform:translateY(-4px) scale(1.02);box-shadow:0 10px 24px rgba(14,159,142,0.15) }

@keyframes legendeIn {
  from { opacity:0; transform:translateY(16px) scale(.96) }
  to   { opacity:1; transform:none }
}
@keyframes litIn {
  from { opacity:0; transform:translateY(14px) scale(.95) }
  to   { opacity:1; transform:none }
}
@keyframes stripeMove {
  0%,100% { background-position:0% 50% }
  50%     { background-position:100% 50% }
}
@keyframes stripeShine {
  0%     { left:-60% }
  60%,100% { left:120% }
}
@keyframes iconBounceS {
  0%   { transform:scale(1) }
  60%  { transform:scale(1.2) }
  100% { transform:scale(1.08) }
}
@keyframes chipPulse {
  0%,100% { opacity:1; transform:scale(1) }
  50%     { opacity:.6; transform:scale(.93) }
}
.modal-overlay{ position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem }
.modal-box    { background:white;border-radius:1.25rem;width:100%;max-width:460px;max-height:90vh;overflow-y:auto }
.modal-header { display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #F1F5F9 }
.modal-titre  { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:.95rem;font-weight:700 }
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
