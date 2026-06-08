<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-titre">Gestion des utilisateurs</h1>
        <p style="color:var(--color-text-muted);font-size:.875rem">{{ utilisateurs.length }} utilisateur(s)</p>
      </div>
      <button class="btn btn-primary" @click="ouvrirCreer">
        <UserPlus :size="16" /> Nouvel utilisateur
      </button>
    </div>

    <!-- Filtres -->
    <div class="card" style="margin-bottom:1.25rem;padding:.875rem 1rem;display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">
      <div class="search-wrap">
        <Search :size="15" class="search-icon" />
        <input v-model="q" type="search" class="input search-input" placeholder="Rechercher nom, prénom, email…" @input="charger" />
      </div>
      <div class="tabs-role">
        <button v-for="r in rolesOptions" :key="r.val" class="tab-btn" :class="{ active: filtreRole===r.val }" @click="filtreRole=r.val;charger()">{{ r.lbl }}</button>
      </div>
    </div>

    <div v-if="chargement" style="display:flex;flex-direction:column;gap:.5rem">
      <div class="skeleton-block" v-for="i in 8" :key="i" style="height:52px"></div>
    </div>

    <div v-else-if="utilisateurs.length" class="card table-wrap">
      <table class="table-tm">
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Téléphone</th>
            <th>Statut</th>
            <th>Inscrit le</th>
            <th style="text-align:center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in utilisateurs" :key="u.id">
            <td>
              <div class="user-cell">
                <div class="avatar-cercle" :style="{ background: avatarBg(u.role) }">{{ initiales(u) }}</div>
                <div>
                  <div style="font-weight:600;font-size:.88rem">{{ u.prenom }} {{ u.nom }}</div>
                  <div v-if="u.medecin" style="font-size:.72rem;color:var(--color-text-muted)">{{ u.medecin.specialite }}</div>
                </div>
              </div>
            </td>
            <td style="font-size:.82rem;color:var(--color-text-muted)">{{ u.email }}</td>
            <td><span class="badge" :class="roleCls(u.role)">{{ roleLbl(u.role) }}</span></td>
            <td style="font-size:.82rem">{{ u.telephone || '—' }}</td>
            <td><span class="badge" :class="u.actif ? 'badge-green' : 'badge-danger'">{{ u.actif ? 'Actif' : 'Inactif' }}</span></td>
            <td style="font-size:.78rem;color:var(--color-text-muted)">{{ fmt(u.createdAt) }}</td>
            <td>
              <div style="display:flex;justify-content:center;gap:.375rem">
                <button class="btn-icone" title="Modifier" @click="ouvrirEditer(u)"><Pencil :size="15" /></button>
                <button class="btn-icone" :class="u.actif ? 'btn-icone-danger' : 'btn-icone-green'" :title="u.actif?'Désactiver':'Activer'" @click="toggleActif(u)">
                  <UserX v-if="u.actif" :size="15" />
                  <UserCheck v-else :size="15" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="vide-center">
      <Users :size="48" style="opacity:.2;margin-bottom:.75rem" />
      <p style="color:var(--color-text-muted)">Aucun utilisateur trouvé</p>
    </div>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="modalOuvert" class="modal-overlay" @click.self="modalOuvert=false">
          <div class="modal-box">
            <div class="modal-header">
              <h2 class="modal-titre">
                <component :is="editUser ? Pencil : UserPlus" :size="18" style="color:var(--color-primary)" />
                {{ editUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur' }}
              </h2>
              <button class="modal-close" @click="modalOuvert=false"><X :size="20" /></button>
            </div>
            <form @submit.prevent="sauvegarder" class="modal-body">
              <div v-if="erreur" class="alert-erreur"><AlertCircle :size="14" /> {{ erreur }}</div>
              <div class="deux-cols">
                <div class="field"><label class="field-label">Prénom *</label><input v-model="form.prenom" type="text" class="input" required /></div>
                <div class="field"><label class="field-label">Nom *</label><input v-model="form.nom" type="text" class="input" required /></div>
              </div>
              <div class="field"><label class="field-label">Email *</label><input v-model="form.email" type="email" class="input" required /></div>
              <div class="deux-cols">
                <div class="field"><label class="field-label">Téléphone</label><input v-model="form.telephone" type="tel" class="input" placeholder="+221 7X XXX XX XX" /></div>
                <div class="field">
                  <label class="field-label">Rôle *</label>
                  <select v-model="form.role" class="input" required :disabled="!!editUser">
                    <option v-for="r in rolesOptions.slice(1)" :key="r.val" :value="r.val">{{ r.lbl }}</option>
                  </select>
                </div>
              </div>
              <template v-if="form.role === 'MEDECIN' && !editUser">
                <div class="deux-cols">
                  <div class="field"><label class="field-label">Spécialité</label><input v-model="form.specialite" type="text" class="input" placeholder="Médecine générale" /></div>
                  <div class="field"><label class="field-label">Tarif (FCFA)</label><input v-model.number="form.consultationTarif" type="number" min="0" class="input" /></div>
                </div>
              </template>
              <div v-if="!editUser" class="field">
                <label class="field-label">Mot de passe *</label>
                <div style="position:relative">
                  <input v-model="form.mot_de_passe" :type="mdpVisible?'text':'password'" class="input" required style="padding-right:2.5rem" />
                  <button type="button" class="btn-oeil" @click="mdpVisible=!mdpVisible">
                    <Eye v-if="!mdpVisible" :size="15" /><EyeOff v-else :size="15" />
                  </button>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="modalOuvert=false">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="envoi">
                  <Loader2 v-if="envoi" :size="16" class="spin" /><Check v-else :size="16" />
                  {{ envoi ? 'Enregistrement…' : (editUser ? 'Modifier' : 'Créer') }}
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
import { ref, onMounted } from 'vue'
import { Users, UserPlus, Pencil, UserX, UserCheck, Search, Check, X, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { fmt } = useDate()

const chargement  = ref(true)
const utilisateurs= ref([])
const q           = ref('')
const filtreRole  = ref('')
const modalOuvert = ref(false)
const editUser    = ref(null)
const envoi       = ref(false)
const erreur      = ref('')
const mdpVisible  = ref(false)

const formVide = () => ({ prenom:'', nom:'', email:'', telephone:'', role:'PATIENT', specialite:'', consultationTarif:5000, mot_de_passe:'' })
const form     = ref(formVide())

const rolesOptions = [
  { val:'',              lbl:'Tous' },
  { val:'PATIENT',       lbl:'Patient' },
  { val:'MEDECIN',       lbl:'Médecin' },
  { val:'RECEPTIONNISTE',lbl:'Réceptionniste' },
  { val:'PHARMACIEN',    lbl:'Pharmacien' },
  { val:'ADMIN',         lbl:'Admin' },
]

const ROLE_CLS = { PATIENT:'badge-primary', MEDECIN:'badge-info', RECEPTIONNISTE:'badge-green', PHARMACIEN:'badge-gold', ADMIN:'badge-danger' }
const ROLE_LBL = { PATIENT:'Patient', MEDECIN:'Médecin', RECEPTIONNISTE:'Réceptionniste', PHARMACIEN:'Pharmacien', ADMIN:'Admin' }
const AVATAR_BG= { PATIENT:'rgba(14,159,142,0.15)', MEDECIN:'rgba(14,165,233,0.15)', RECEPTIONNISTE:'rgba(21,128,61,0.12)', PHARMACIEN:'rgba(230,184,0,0.15)', ADMIN:'rgba(220,38,38,0.12)' }

function roleCls(r)   { return ROLE_CLS[r]||'badge-gray' }
function roleLbl(r)   { return ROLE_LBL[r]||r }
function avatarBg(r)  { return AVATAR_BG[r]||'#E2E8F0' }
function initiales(u) { return `${(u.prenom||'')[0]||''}${(u.nom||'')[0]||''}`.toUpperCase() }

async function charger() {
  chargement.value = true
  try {
    const params = new URLSearchParams()
    if (q.value)          params.set('q', q.value)
    if (filtreRole.value) params.set('role', filtreRole.value)
    utilisateurs.value = await api.get(`/admin/utilisateurs?${params}`)
  } finally { chargement.value = false }
}

function ouvrirCreer() {
  editUser.value = null; form.value = formVide(); erreur.value = ''; mdpVisible.value = false; modalOuvert.value = true
}
function ouvrirEditer(u) {
  editUser.value = u
  form.value = { prenom:u.prenom, nom:u.nom, email:u.email, telephone:u.telephone||'', role:u.role, specialite:'', consultationTarif:5000, mot_de_passe:'' }
  erreur.value = ''; modalOuvert.value = true
}

async function sauvegarder() {
  erreur.value = ''; envoi.value = true
  try {
    if (editUser.value) {
      const updated = await api.put(`/admin/utilisateurs/${editUser.value.id}`, {
        prenom: form.value.prenom, nom: form.value.nom,
        email: form.value.email, telephone: form.value.telephone || undefined,
      })
      const idx = utilisateurs.value.findIndex(u => u.id === editUser.value.id)
      if (idx >= 0) utilisateurs.value[idx] = { ...utilisateurs.value[idx], ...updated }
    } else {
      const payload = { ...form.value }
      if (!payload.specialite)       delete payload.specialite
      if (!payload.consultationTarif)delete payload.consultationTarif
      await api.post('/admin/utilisateurs', payload)
      await charger()
    }
    modalOuvert.value = false
  } catch(e) { erreur.value = e.message }
  finally { envoi.value = false }
}

async function toggleActif(u) {
  try {
    const res = await api.put(`/admin/utilisateurs/${u.id}/toggle-actif`, {})
    u.actif = res.actif
  } catch(e) { console.error(e) }
}

onMounted(charger)
</script>

<style scoped>
.page-header  { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;gap:1rem }
.page-titre   { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
.search-wrap  { position:relative;flex:1;min-width:200px;max-width:360px }
.search-icon  { position:absolute;left:.75rem;top:50%;transform:translateY(-50%);color:var(--color-text-muted) }
.search-input { padding-left:2.25rem }
.tabs-role    { display:flex;gap:.25rem;flex-wrap:wrap }
/* .tab-btn — styles globaux dans style.css */
.user-cell    { display:flex;align-items:center;gap:.625rem }
.avatar-cercle{ width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;flex-shrink:0;color:var(--color-text) }
.btn-icone    { width:30px;height:30px;border-radius:.5rem;border:1.5px solid #E2E8F0;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);transition:all .15s }
.btn-icone:hover { border-color:var(--color-primary);color:var(--color-primary) }
.btn-icone-danger:hover { border-color:var(--color-danger)!important;color:var(--color-danger)!important }
.btn-icone-green:hover  { border-color:var(--color-green)!important;color:var(--color-green)!important }
.vide-center  { display:flex;flex-direction:column;align-items:center;padding:4rem 1rem }
.deux-cols    { display:grid;grid-template-columns:1fr 1fr;gap:.875rem }
@media(max-width:480px){ .deux-cols { grid-template-columns:1fr } }
.field        { display:flex;flex-direction:column;gap:.375rem }
.field-label  { font-size:.8rem;font-weight:600;color:var(--color-text-muted) }
.btn-oeil     { position:absolute;right:.625rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex }
.modal-overlay{ position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem }
.modal-box    { background:white;border-radius:1.25rem;width:100%;max-width:520px;max-height:90vh;overflow-y:auto }
.modal-header { display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #F1F5F9 }
.modal-titre  { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:1rem;font-weight:700 }
.modal-close  { background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex }
.modal-body   { padding:1.5rem;display:flex;flex-direction:column;gap:1rem }
.modal-footer { display:flex;justify-content:flex-end;gap:.75rem;padding-top:.5rem }
.alert-erreur { display:flex;align-items:center;gap:.5rem;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,.25);color:var(--color-danger);border-radius:.75rem;padding:.625rem .875rem;font-size:.83rem }
.spin         { animation:spin 1s linear infinite }
@keyframes spin{ from{ transform:rotate(0deg) } to{ transform:rotate(360deg) } }
.skeleton-block{ background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.5rem;animation:shimmer 1.5s infinite }
.modal-fade-enter-active,.modal-fade-leave-active { transition:all .25s }
.modal-fade-enter-from,.modal-fade-leave-to { opacity:0 }
@keyframes shimmer{ 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }
</style>
