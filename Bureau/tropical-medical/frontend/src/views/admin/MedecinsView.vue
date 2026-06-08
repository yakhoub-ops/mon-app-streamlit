<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-titre">Gestion des médecins</h1>
        <p style="color:var(--color-text-muted);font-size:.875rem">{{ medecins.length }} médecin(s) enregistré(s)</p>
      </div>
    </div>

    <!-- Recherche -->
    <div class="card" style="margin-bottom:1.25rem;padding:.875rem 1rem">
      <div class="search-wrap">
        <Search :size="15" class="search-icon" />
        <input v-model="q" type="search" class="input search-input" placeholder="Rechercher par nom, spécialité…" />
      </div>
    </div>

    <div v-if="chargement" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem">
      <div class="skeleton-block" v-for="i in 6" :key="i" style="height:160px;border-radius:1rem"></div>
    </div>

    <div v-else-if="medecinsFiltres.length" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem">
      <div v-for="m in medecinsFiltres" :key="m.id" class="card medecin-card">
        <div class="medecin-header">
          <div class="avatar-md">
            {{ `${m.utilisateur.prenom[0]||''}${m.utilisateur.nom[0]||''}`.toUpperCase() }}
          </div>
          <div style="flex:1;min-width:0">
            <div class="medecin-nom">Dr {{ m.utilisateur.prenom }} {{ m.utilisateur.nom }}</div>
            <div class="medecin-spec">{{ m.specialite || 'Médecine générale' }}</div>
          </div>
          <span class="badge" :class="m.utilisateur.actif ? 'badge-green' : 'badge-danger'">
            {{ m.utilisateur.actif ? 'Actif' : 'Inactif' }}
          </span>
        </div>

        <div class="medecin-infos">
          <div class="info-ligne"><Mail :size="13" /> {{ m.utilisateur.email }}</div>
          <div v-if="m.utilisateur.telephone" class="info-ligne"><Phone :size="13" /> {{ m.utilisateur.telephone }}</div>
          <div class="info-ligne"><Receipt :size="13" /> {{ (m.consultationTarif||0).toLocaleString('fr-SN') }} FCFA / consultation</div>
        </div>

        <div class="medecin-stats">
          <div class="stat-mini">
            <span class="stat-mini-val" style="color:var(--color-primary)">{{ m._count.consultations }}</span>
            <span class="stat-mini-lbl">Consultations</span>
          </div>
          <div class="stat-mini">
            <span class="stat-mini-val" style="color:var(--color-info)">{{ m._count.rendezvous }}</span>
            <span class="stat-mini-lbl">RDV</span>
          </div>
          <div v-if="m.numeroOrdre" class="stat-mini">
            <span class="stat-mini-val" style="color:var(--color-text-muted);font-size:.75rem">{{ m.numeroOrdre }}</span>
            <span class="stat-mini-lbl">N° Ordre</span>
          </div>
        </div>

        <button class="btn btn-ghost btn-sm" @click="ouvrirEditer(m)" style="width:100%;margin-top:.75rem;justify-content:center">
          <Pencil :size="14" /> Modifier le profil
        </button>
      </div>
    </div>

    <div v-else class="vide-center">
      <Stethoscope :size="48" style="opacity:.2;margin-bottom:.75rem" />
      <p style="color:var(--color-text-muted)">Aucun médecin trouvé</p>
    </div>

    <!-- Modal édition médecin -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="modalOuvert" class="modal-overlay" @click.self="modalOuvert=false">
          <div class="modal-box">
            <div class="modal-header">
              <h2 class="modal-titre"><Pencil :size="18" style="color:var(--color-primary)" /> Modifier le médecin</h2>
              <button class="modal-close" @click="modalOuvert=false"><X :size="20" /></button>
            </div>
            <form @submit.prevent="sauvegarder" class="modal-body">
              <div v-if="erreur" class="alert-erreur"><AlertCircle :size="14" /> {{ erreur }}</div>

              <div v-if="editMedecin" class="info-banner">
                <div class="avatar-sm">{{ `${editMedecin.utilisateur.prenom[0]}${editMedecin.utilisateur.nom[0]}`.toUpperCase() }}</div>
                <div>
                  <div style="font-weight:700;font-size:.9rem">Dr {{ editMedecin.utilisateur.prenom }} {{ editMedecin.utilisateur.nom }}</div>
                  <div style="font-size:.78rem;color:var(--color-text-muted)">{{ editMedecin.utilisateur.email }}</div>
                </div>
              </div>

              <div class="field">
                <label class="field-label">Spécialité</label>
                <input v-model="form.specialite" type="text" class="input" placeholder="Ex: Cardiologie" />
              </div>
              <div class="field">
                <label class="field-label">Description / Bio</label>
                <textarea v-model="form.description" class="input" rows="3" placeholder="Présentation du médecin…"></textarea>
              </div>
              <div class="deux-cols">
                <div class="field">
                  <label class="field-label">Tarif consultation (FCFA)</label>
                  <input v-model.number="form.consultationTarif" type="number" min="0" class="input" />
                </div>
                <div class="field">
                  <label class="field-label">N° Ordre des médecins</label>
                  <input v-model="form.numeroOrdre" type="text" class="input" placeholder="Ex: SN-2025-0042" />
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="modalOuvert=false">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="envoi">
                  <Loader2 v-if="envoi" :size="16" class="spin" /><Check v-else :size="16" />
                  {{ envoi ? 'Enregistrement…' : 'Sauvegarder' }}
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
import { Stethoscope, Pencil, Search, Mail, Phone, Receipt, Check, X, AlertCircle, Loader2 } from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'

const api = useApi()
const chargement  = ref(true)
const medecins    = ref([])
const q           = ref('')
const modalOuvert = ref(false)
const editMedecin = ref(null)
const envoi       = ref(false)
const erreur      = ref('')
const form        = ref({ specialite:'', description:'', consultationTarif:5000, numeroOrdre:'' })

const medecinsFiltres = computed(() => {
  if (!q.value) return medecins.value
  const s = q.value.toLowerCase()
  return medecins.value.filter(m =>
    m.utilisateur.nom.toLowerCase().includes(s) ||
    m.utilisateur.prenom.toLowerCase().includes(s) ||
    (m.specialite||'').toLowerCase().includes(s)
  )
})

async function charger() {
  chargement.value = true
  try { medecins.value = await api.get('/admin/medecins') }
  finally { chargement.value = false }
}

function ouvrirEditer(m) {
  editMedecin.value = m
  form.value = {
    specialite:       m.specialite || '',
    description:      m.description || '',
    consultationTarif:m.consultationTarif || 5000,
    numeroOrdre:      m.numeroOrdre || '',
  }
  erreur.value = ''; modalOuvert.value = true
}

async function sauvegarder() {
  erreur.value = ''; envoi.value = true
  try {
    const updated = await api.put(`/admin/medecins/${editMedecin.value.id}`, form.value)
    const idx = medecins.value.findIndex(m => m.id === editMedecin.value.id)
    if (idx >= 0) medecins.value[idx] = { ...medecins.value[idx], ...updated }
    modalOuvert.value = false
  } catch(e) { erreur.value = e.message }
  finally { envoi.value = false }
}

onMounted(charger)
</script>

<style scoped>
.page-header   { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;gap:1rem }
.page-titre    { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
.search-wrap   { position:relative;max-width:400px }
.search-icon   { position:absolute;left:.75rem;top:50%;transform:translateY(-50%);color:var(--color-text-muted) }
.search-input  { padding-left:2.25rem;width:100% }
.medecin-card  { padding:1.25rem;display:flex;flex-direction:column;gap:.75rem;transition:box-shadow .2s }
.medecin-card:hover { box-shadow:0 8px 24px rgba(14,159,142,.12) }
.medecin-header{ display:flex;align-items:center;gap:.75rem }
.avatar-md     { width:44px;height:44px;border-radius:50%;background:rgba(14,159,142,0.12);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;color:var(--color-primary);flex-shrink:0 }
.medecin-nom   { font-family:var(--font-display);font-size:.9rem;font-weight:700;color:var(--color-text) }
.medecin-spec  { font-size:.75rem;color:var(--color-text-muted);margin-top:.15rem }
.medecin-infos { display:flex;flex-direction:column;gap:.35rem }
.info-ligne    { display:flex;align-items:center;gap:.4rem;font-size:.78rem;color:var(--color-text-muted) }
.medecin-stats { display:flex;gap:1rem;padding:.625rem .875rem;background:#F8FAFC;border-radius:.75rem }
.stat-mini     { display:flex;flex-direction:column;align-items:center }
.stat-mini-val { font-family:var(--font-display);font-size:1.1rem;font-weight:800;line-height:1 }
.stat-mini-lbl { font-size:.65rem;color:var(--color-text-muted);margin-top:.15rem }
.btn-sm        { padding:.375rem .875rem;font-size:.82rem;display:flex;align-items:center;gap:.375rem }
.vide-center   { display:flex;flex-direction:column;align-items:center;padding:4rem 1rem }
.info-banner   { display:flex;align-items:center;gap:.75rem;background:#F8FAFC;border-radius:.875rem;padding:.75rem 1rem }
.avatar-sm     { width:36px;height:36px;border-radius:50%;background:rgba(14,159,142,0.12);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.75rem;color:var(--color-primary);flex-shrink:0 }
.deux-cols     { display:grid;grid-template-columns:1fr 1fr;gap:.875rem }
@media(max-width:480px){ .deux-cols { grid-template-columns:1fr } }
.field         { display:flex;flex-direction:column;gap:.375rem }
.field-label   { font-size:.8rem;font-weight:600;color:var(--color-text-muted) }
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem }
.modal-box     { background:white;border-radius:1.25rem;width:100%;max-width:500px;max-height:90vh;overflow-y:auto }
.modal-header  { display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #F1F5F9 }
.modal-titre   { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:1rem;font-weight:700 }
.modal-close   { background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex }
.modal-body    { padding:1.5rem;display:flex;flex-direction:column;gap:1rem }
.modal-footer  { display:flex;justify-content:flex-end;gap:.75rem;padding-top:.5rem }
.alert-erreur  { display:flex;align-items:center;gap:.5rem;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,.25);color:var(--color-danger);border-radius:.75rem;padding:.625rem .875rem;font-size:.83rem }
.spin          { animation:spin 1s linear infinite }
@keyframes spin{ from{ transform:rotate(0deg) } to{ transform:rotate(360deg) } }
.skeleton-block{ background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.5rem;animation:shimmer 1.5s infinite }
.modal-fade-enter-active,.modal-fade-leave-active { transition:all .25s }
.modal-fade-enter-from,.modal-fade-leave-to { opacity:0 }
@keyframes shimmer{ 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }
</style>
