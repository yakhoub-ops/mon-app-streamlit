<template>
  <div style="max-width:700px">
    <h1 class="page-titre" style="margin-bottom:1.5rem">Paramètres</h1>

    <!-- Profil médecin -->
    <div class="card section-card">
      <h2 class="section-titre"><UserCog :size="18" style="color:var(--color-primary)" /> Profil médecin</h2>

      <div v-if="msgProfil" class="alert-ok"><CheckCircle :size="15" /> Profil mis à jour.</div>
      <div v-if="errProfil" class="alert-erreur"><AlertCircle :size="15" /> {{ errProfil }}</div>

      <form @submit.prevent="sauvegarderProfil" style="display:flex;flex-direction:column;gap:1rem">
        <div class="deux-cols">
          <div class="field">
            <label class="field-label">Prénom</label>
            <input v-model="profil.prenom" type="text" class="input" required />
          </div>
          <div class="field">
            <label class="field-label">Nom</label>
            <input v-model="profil.nom" type="text" class="input" required />
          </div>
        </div>
        <div class="deux-cols">
          <div class="field">
            <label class="field-label">Téléphone</label>
            <input v-model="profil.telephone" type="tel" class="input" placeholder="+221 7X XXX XX XX" />
          </div>
          <div class="field">
            <label class="field-label">Spécialité</label>
            <input v-model="profil.specialite" type="text" class="input" required />
          </div>
        </div>
        <div class="field">
          <label class="field-label">Description / Bio</label>
          <textarea v-model="profil.description" class="input" rows="2" style="resize:vertical"></textarea>
        </div>
        <div class="field">
          <label class="field-label"><DollarSign :size="13" /> Tarif de consultation (FCFA)</label>
          <input v-model.number="profil.consultationTarif" type="number" min="0" step="500" class="input" />
        </div>
        <div>
          <button type="submit" class="btn btn-primary" :disabled="envoiProfil">
            <Loader2 v-if="envoiProfil" :size="16" class="spin" />
            <Save v-else :size="16" />
            {{ envoiProfil ? 'Enregistrement…' : 'Sauvegarder' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Thème -->
    <div class="card section-card">
      <h2 class="section-titre"><Palette :size="18" style="color:var(--color-primary)" /> Thème</h2>
      <div class="theme-grid">
        <button v-for="t in themes" :key="t.val" class="theme-btn" :class="{ selected: prefStore.theme===t.val }" @click="prefStore.setTheme(t.val)">
          <div class="theme-preview" :style="t.style">
            <div style="height:8px;border-radius:4px;margin-bottom:6px" :style="t.barStyle"></div>
            <div style="height:5px;border-radius:3px;width:100%;margin-bottom:3px" :style="t.lineStyle"></div>
            <div style="height:5px;border-radius:3px;width:65%" :style="t.lineStyle"></div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem .75rem">
            <span style="font-size:.82rem;font-weight:600">{{ t.label }}</span>
            <CheckCircle v-if="prefStore.theme===t.val" :size="15" style="color:var(--color-primary)" />
          </div>
        </button>
      </div>
    </div>

    <!-- Langue -->
    <div class="card section-card">
      <h2 class="section-titre"><Languages :size="18" style="color:var(--color-primary)" /> Langue</h2>
      <div style="display:flex;gap:.75rem">
        <button class="langue-btn" :class="{ selected: prefStore.langue==='fr' }" @click="prefStore.setLangue('fr')">
          <span class="langue-flag">FR</span> Français
          <CheckCircle v-if="prefStore.langue==='fr'" :size="13" style="color:var(--color-primary)" />
        </button>
        <button class="langue-btn" :class="{ selected: prefStore.langue==='wo' }" @click="prefStore.setLangue('wo')">
          <span class="langue-flag" style="background:#E6B800">WO</span> Wolof
          <CheckCircle v-if="prefStore.langue==='wo'" :size="13" style="color:var(--color-primary)" />
        </button>
      </div>
    </div>

    <!-- Mot de passe -->
    <div class="card section-card">
      <h2 class="section-titre"><Lock :size="18" style="color:var(--color-primary)" /> Mot de passe</h2>
      <div v-if="msgMdp" class="alert-ok"><CheckCircle :size="15" /> Mot de passe modifié.</div>
      <div v-if="errMdp" class="alert-erreur"><AlertCircle :size="15" /> {{ errMdp }}</div>
      <form @submit.prevent="changerMdp" style="display:flex;flex-direction:column;gap:.875rem">
        <div class="field">
          <label class="field-label">Mot de passe actuel</label>
          <div class="input-wrap">
            <input v-model="mdp.actuel" :type="show.actuel?'text':'password'" class="input" required placeholder="••••••••" />
            <button type="button" class="show-btn" @click="show.actuel=!show.actuel">
              <EyeOff v-if="show.actuel" :size="16" /><Eye v-else :size="16" />
            </button>
          </div>
        </div>
        <div class="deux-cols">
          <div class="field">
            <label class="field-label">Nouveau</label>
            <div class="input-wrap">
              <input v-model="mdp.nouveau" :type="show.nouveau?'text':'password'" class="input" required minlength="6" placeholder="••••••••" />
              <button type="button" class="show-btn" @click="show.nouveau=!show.nouveau">
                <EyeOff v-if="show.nouveau" :size="16" /><Eye v-else :size="16" />
              </button>
            </div>
          </div>
          <div class="field">
            <label class="field-label">Confirmer</label>
            <div class="input-wrap">
              <input v-model="mdp.confirm" :type="show.confirm?'text':'password'" class="input" required placeholder="••••••••" />
              <button type="button" class="show-btn" @click="show.confirm=!show.confirm">
                <EyeOff v-if="show.confirm" :size="16" /><Eye v-else :size="16" />
              </button>
            </div>
          </div>
        </div>
        <div>
          <button type="submit" class="btn btn-primary" :disabled="envoiMdp || mdp.nouveau!==mdp.confirm">
            <Loader2 v-if="envoiMdp" :size="16" class="spin" />
            <Lock v-else :size="16" />
            {{ envoiMdp ? 'Enregistrement…' : 'Modifier' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import {
  UserCog, Save, Palette, Languages, Lock, CheckCircle,
  AlertCircle, Eye, EyeOff, Loader2, DollarSign,
} from 'lucide-vue-next'
import { usePreferencesStore } from '../../stores/preferences.js'
import { useApi } from '../../composables/useApi.js'

const prefStore = usePreferencesStore()
const api       = useApi()

const envoiProfil = ref(false); const msgProfil = ref(false); const errProfil = ref('')
const envoiMdp    = ref(false); const msgMdp    = ref(false); const errMdp    = ref('')

const profil = reactive({ prenom:'', nom:'', telephone:'', specialite:'', description:'', consultationTarif: 5000 })
const mdp    = reactive({ actuel:'', nouveau:'', confirm:'' })
const show   = reactive({ actuel:false, nouveau:false, confirm:false })

const themes = [
  { val:'CLAIR',  label:'Clair',         style:'background:#F1F5F9;padding:.75rem',      barStyle:'background:#0E9F8E',  lineStyle:'background:#CBD5E1' },
  { val:'SOMBRE', label:'Sombre',        style:'background:#1E293B;padding:.75rem',      barStyle:'background:#0A7A6D',  lineStyle:'background:#475569' },
  { val:'AUTO',   label:'Auto (système)',style:'background:linear-gradient(135deg,#F1F5F9 50%,#1E293B 50%);padding:.75rem', barStyle:'background:linear-gradient(90deg,#0E9F8E 50%,#0A7A6D 50%)', lineStyle:'background:linear-gradient(90deg,#CBD5E1 50%,#475569 50%)' },
]

onMounted(async () => {
  try {
    const p = await api.get('/medecin/profil')
    profil.prenom            = p.utilisateur.prenom
    profil.nom               = p.utilisateur.nom
    profil.telephone         = p.utilisateur.telephone || ''
    profil.specialite        = p.specialite
    profil.description       = p.description || ''
    profil.consultationTarif = p.consultationTarif
  } catch {}
})

async function sauvegarderProfil() {
  envoiProfil.value=true; msgProfil.value=false; errProfil.value=''
  try {
    await api.put('/medecin/profil', profil)
    msgProfil.value = true
  } catch(e) { errProfil.value = e.message }
  finally { envoiProfil.value = false }
}

async function changerMdp() {
  if (mdp.nouveau!==mdp.confirm) return
  envoiMdp.value=true; msgMdp.value=false; errMdp.value=''
  try {
    await api.put('/auth/mot-de-passe', { ancien: mdp.actuel, nouveau: mdp.nouveau })
    msgMdp.value = true
    mdp.actuel=''; mdp.nouveau=''; mdp.confirm=''
  } catch(e) { errMdp.value = e.message }
  finally { envoiMdp.value = false }
}
</script>

<style scoped>
.page-titre   { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
.section-card { padding:1.5rem;margin-bottom:1.25rem }
.section-titre{ display:flex;align-items:center;gap:.625rem;font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--color-text);margin-bottom:1.25rem }
.deux-cols    { display:grid;grid-template-columns:1fr 1fr;gap:1rem }
@media(max-width:520px){ .deux-cols { grid-template-columns:1fr } }
.field        { display:flex;flex-direction:column;gap:.375rem }
.field-label  { font-size:.8rem;font-weight:600;color:var(--color-text-muted) }
.theme-grid   { display:grid;grid-template-columns:repeat(3,1fr);gap:.875rem }
@media(max-width:500px){ .theme-grid { grid-template-columns:1fr } }
.theme-btn    { border:2px solid #E2E8F0;border-radius:.875rem;overflow:hidden;background:none;cursor:pointer;transition:all .2s;text-align:left }
.theme-btn.selected { border-color:var(--color-primary);box-shadow:0 0 0 3px rgba(14,159,142,0.12) }
.theme-preview{ height:72px }
.langue-btn   { display:flex;align-items:center;gap:.5rem;padding:.625rem 1rem;border-radius:.75rem;border:1.5px solid #E2E8F0;background:white;cursor:pointer;font-size:.85rem;font-weight:500;color:var(--color-text);transition:all .18s }
.langue-btn.selected { border-color:var(--color-primary);background:rgba(14,159,142,0.06) }
.langue-flag  { display:inline-flex;align-items:center;justify-content:center;width:26px;height:18px;border-radius:3px;background:var(--color-primary);color:white;font-size:.62rem;font-weight:800 }
.input-wrap   { position:relative }
.input-wrap .input { padding-right:2.5rem }
.show-btn     { position:absolute;right:.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex;align-items:center }
.alert-ok     { display:flex;align-items:center;gap:.5rem;background:rgba(21,128,61,0.08);border:1px solid rgba(21,128,61,.25);color:var(--color-green);border-radius:.75rem;padding:.625rem .875rem;font-size:.85rem;margin-bottom:1rem }
.alert-erreur { display:flex;align-items:center;gap:.5rem;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,.25);color:var(--color-danger);border-radius:.75rem;padding:.625rem .875rem;font-size:.85rem;margin-bottom:1rem }
.spin         { animation:spin 1s linear infinite }
@keyframes spin{ from{ transform:rotate(0deg) } to{ transform:rotate(360deg) } }
</style>
