<template>
  <div style="display:flex;flex-direction:column;gap:1.25rem">

    <!-- Profil admin -->
    <div class="card section">
      <h2 class="section-titre"><User :size="16" /> Mon profil administrateur</h2>
      <form @submit.prevent="sauvegarderProfil" style="display:flex;flex-direction:column;gap:.875rem">
        <div v-if="msgProfil" class="alert-ok"><CheckCircle :size="14" /> {{ msgProfil }}</div>
        <div v-if="errProfil" class="alert-erreur"><AlertCircle :size="14" /> {{ errProfil }}</div>

        <div class="deux-cols">
          <div class="field"><label class="field-label">Prénom</label><input v-model="profil.prenom" type="text" class="input" /></div>
          <div class="field"><label class="field-label">Nom</label><input v-model="profil.nom" type="text" class="input" /></div>
        </div>
        <div class="field"><label class="field-label">Email</label><input v-model="profil.email" type="email" class="input" /></div>
        <div class="field"><label class="field-label">Téléphone</label><input v-model="profil.telephone" type="tel" class="input" placeholder="+221 7X XXX XX XX" /></div>

        <div style="display:flex;justify-content:flex-end">
          <button type="submit" class="btn btn-primary" :disabled="envoiProfil">
            <Loader2 v-if="envoiProfil" :size="16" class="spin" /><Save v-else :size="16" />
            {{ envoiProfil ? 'Enregistrement…' : 'Sauvegarder le profil' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Apparence -->
    <div class="card section">
      <h2 class="section-titre"><Palette :size="16" /> Apparence</h2>

      <div style="margin-bottom:1.25rem">
        <div class="field-label" style="margin-bottom:.625rem">Thème</div>
        <div class="themes-grille">
          <button v-for="th in themes" :key="th.val"
            type="button" class="theme-carte" :class="{ selectionne: prefStore.theme === th.val }"
            @click="prefStore.setTheme(th.val)">
            <div class="theme-apercu" :style="th.style">
              <div class="theme-cercle"></div>
              <div class="theme-barres">
                <div class="theme-barre"></div>
                <div class="theme-barre" style="width:60%"></div>
              </div>
            </div>
            <span class="theme-nom">{{ th.nom }}</span>
          </button>
        </div>
      </div>

      <div>
        <div class="field-label" style="margin-bottom:.625rem">Langue</div>
        <div class="langues-wrap">
          <button v-for="lg in langues" :key="lg.val" type="button"
            class="langue-btn" :class="{ actif: prefStore.langue === lg.val }"
            @click="prefStore.setLangue(lg.val)">
            {{ lg.nom }}
          </button>
        </div>
      </div>
    </div>

    <!-- Sécurité -->
    <div class="card section">
      <h2 class="section-titre"><Lock :size="16" /> Sécurité</h2>
      <form @submit.prevent="changerMotDePasse" style="display:flex;flex-direction:column;gap:.875rem">
        <div v-if="msgMdp" class="alert-ok"><CheckCircle :size="14" /> {{ msgMdp }}</div>
        <div v-if="errMdp" class="alert-erreur"><AlertCircle :size="14" /> {{ errMdp }}</div>

        <div class="field">
          <label class="field-label">Mot de passe actuel</label>
          <div style="position:relative">
            <input v-model="mdp.ancien" :type="voirAncien?'text':'password'" class="input" required style="padding-right:2.5rem" />
            <button type="button" class="btn-oeil" @click="voirAncien=!voirAncien">
              <Eye v-if="!voirAncien" :size="15" /><EyeOff v-else :size="15" />
            </button>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Nouveau mot de passe</label>
          <div style="position:relative">
            <input v-model="mdp.nouveau" :type="voirNouveau?'text':'password'" class="input" required minlength="6" style="padding-right:2.5rem" />
            <button type="button" class="btn-oeil" @click="voirNouveau=!voirNouveau">
              <Eye v-if="!voirNouveau" :size="15" /><EyeOff v-else :size="15" />
            </button>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end">
          <button type="submit" class="btn btn-primary" :disabled="envoiMdp">
            <Loader2 v-if="envoiMdp" :size="16" class="spin" /><Lock v-else :size="16" />
            {{ envoiMdp ? 'Modification…' : 'Modifier le mot de passe' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Informations système -->
    <div class="card section">
      <h2 class="section-titre"><Info :size="16" /> Informations système</h2>
      <div class="sys-grille">
        <div v-for="s in sysInfos" :key="s.lbl" class="sys-item">
          <span class="sys-lbl">{{ s.lbl }}</span>
          <span class="sys-val">{{ s.val }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { User, Palette, Lock, Save, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useAuthStore } from '../../stores/auth.js'
import { usePreferencesStore } from '../../stores/preferences.js'

const api       = useApi()
const auth      = useAuthStore()
const prefStore = usePreferencesStore()

const envoiProfil = ref(false)
const envoiMdp    = ref(false)
const msgProfil   = ref('')
const errProfil   = ref('')
const msgMdp      = ref('')
const errMdp      = ref('')
const voirAncien  = ref(false)
const voirNouveau = ref(false)

const profil = ref({ prenom:'', nom:'', email:'', telephone:'' })
const mdp    = ref({ ancien:'', nouveau:'' })

const themes = [
  { val:'clair',  nom:'Clair',  style:{ background:'#F1F5F9', color:'#1E293B' } },
  { val:'sombre', nom:'Sombre', style:{ background:'#1E293B', color:'#F1F5F9' } },
  { val:'auto',   nom:'Auto',   style:{ background:'linear-gradient(135deg,#F1F5F9 50%,#1E293B 50%)', color:'#0E9F8E' } },
]

const langues = [
  { val:'fr', nom:'Français' },
  { val:'wo', nom:'Wolof' },
]

const sysInfos = [
  { lbl:'Plateforme',   val:'Tropical Medical v1.0' },
  { lbl:'Backend',      val:'Node.js + Express 5 + Prisma 5' },
  { lbl:'Base de données', val:'SQLite (dev) / PostgreSQL (prod)' },
  { lbl:'Frontend',     val:'Vue 3 + Vite + Tailwind CSS v4' },
  { lbl:'Déployé le',   val:'2026' },
]

onMounted(() => {
  const u = auth.utilisateur
  if (u) { profil.value = { prenom:u.prenom||'', nom:u.nom||'', email:u.email||'', telephone:u.telephone||'' } }
})

async function sauvegarderProfil() {
  msgProfil.value = ''; errProfil.value = ''; envoiProfil.value = true
  try {
    await api.put('/auth/profil', profil.value)
    auth.utilisateur = { ...auth.utilisateur, ...profil.value }
    msgProfil.value = 'Profil mis à jour.'
    setTimeout(() => { msgProfil.value = '' }, 3000)
  } catch(e) { errProfil.value = e.message }
  finally { envoiProfil.value = false }
}

async function changerMotDePasse() {
  msgMdp.value = ''; errMdp.value = ''; envoiMdp.value = true
  try {
    await api.put('/auth/mot-de-passe', { ancien: mdp.value.ancien, nouveau: mdp.value.nouveau })
    mdp.value = { ancien:'', nouveau:'' }
    msgMdp.value = 'Mot de passe modifié avec succès.'
    setTimeout(() => { msgMdp.value = '' }, 3000)
  } catch(e) { errMdp.value = e.message }
  finally { envoiMdp.value = false }
}
</script>

<style scoped>
.section      { padding:1.5rem;display:flex;flex-direction:column;gap:1rem }
.section-titre{ display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:.95rem;font-weight:700;color:var(--color-text);padding-bottom:.75rem;border-bottom:1px solid #F1F5F9;margin-bottom:.25rem }
.deux-cols    { display:grid;grid-template-columns:1fr 1fr;gap:.875rem }
@media(max-width:480px){ .deux-cols { grid-template-columns:1fr } }
.field        { display:flex;flex-direction:column;gap:.375rem }
.field-label  { font-size:.8rem;font-weight:600;color:var(--color-text-muted) }
.btn-oeil     { position:absolute;right:.625rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex }
.themes-grille{ display:flex;gap:.875rem;flex-wrap:wrap }
.theme-carte  { display:flex;flex-direction:column;align-items:center;gap:.5rem;background:none;border:2px solid #E2E8F0;border-radius:1rem;padding:.75rem;cursor:pointer;transition:all .18s;min-width:90px }
.theme-carte.selectionne{ border-color:var(--color-primary);box-shadow:0 0 0 3px rgba(14,159,142,.15) }
.theme-apercu { width:72px;height:48px;border-radius:.625rem;display:flex;align-items:center;gap:.5rem;padding:.5rem;overflow:hidden }
.theme-cercle { width:18px;height:18px;border-radius:50%;background:currentColor;opacity:.6;flex-shrink:0 }
.theme-barres { display:flex;flex-direction:column;gap:.25rem;flex:1 }
.theme-barre  { height:5px;background:currentColor;border-radius:2px;opacity:.4;width:100% }
.theme-nom    { font-size:.78rem;font-weight:600;color:var(--color-text) }
.langues-wrap { display:flex;gap:.5rem }
.langue-btn   { padding:.425rem 1.125rem;border-radius:.75rem;border:2px solid #E2E8F0;font-size:.85rem;font-weight:600;cursor:pointer;background:white;color:var(--color-text-muted);transition:all .15s }
.langue-btn.actif{ background:var(--color-primary);border-color:var(--color-primary);color:white }
.sys-grille   { display:grid;grid-template-columns:1fr 1fr;gap:.625rem }
@media(max-width:600px){ .sys-grille { grid-template-columns:1fr } }
.sys-item     { display:flex;justify-content:space-between;align-items:center;padding:.5rem .75rem;background:#F8FAFC;border-radius:.625rem }
.sys-lbl      { font-size:.78rem;color:var(--color-text-muted);font-weight:500 }
.sys-val      { font-size:.78rem;font-weight:700;color:var(--color-text) }
.alert-ok     { display:flex;align-items:center;gap:.5rem;background:rgba(21,128,61,0.08);border:1px solid rgba(21,128,61,.25);color:var(--color-green);border-radius:.75rem;padding:.625rem .875rem;font-size:.83rem }
.alert-erreur { display:flex;align-items:center;gap:.5rem;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,.25);color:var(--color-danger);border-radius:.75rem;padding:.625rem .875rem;font-size:.83rem }
.spin         { animation:spin 1s linear infinite }
@keyframes spin{ from{ transform:rotate(0deg) } to{ transform:rotate(360deg) } }
</style>
