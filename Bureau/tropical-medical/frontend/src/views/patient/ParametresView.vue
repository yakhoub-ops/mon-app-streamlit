<template>
  <div style="max-width:700px">
    <h1 class="page-titre" style="margin-bottom:1.5rem">Paramètres</h1>

    <!-- ══ PHOTO DE PROFIL ══════════════════════════════════════ -->
    <div class="card section-card">
      <h2 class="section-titre"><Camera :size="18" style="color:var(--color-primary)" /> Photo de profil</h2>

      <div class="photo-layout">
        <!-- Avatar actuel -->
        <div class="photo-avatar-wrap">
          <div class="photo-ring">
            <img v-if="avatarPreview || auth.utilisateur?.avatar"
              :src="avatarPreview || auth.utilisateur?.avatar"
              class="photo-img" alt="Photo de profil" />
            <div v-else class="photo-placeholder">
              <User :size="44" />
            </div>
          </div>
          <div v-if="avatarPreview" class="photo-badge-new">Nouveau</div>
        </div>

        <!-- Actions -->
        <div class="photo-actions">
          <p class="photo-hint">Choisissez une photo JPG, PNG ou WebP. Taille max : 2 Mo. Elle sera recadrée en cercle.</p>

          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style="display:none"
            @change="onFileChange"
          />

          <div class="photo-btns">
            <button class="btn btn-primary" @click="fileInput?.click()">
              <Upload :size="15" /> Choisir une photo
            </button>
            <button
              v-if="avatarPreview"
              class="btn btn-save"
              :disabled="uploadEnCours"
              @click="sauvegarderAvatar"
            >
              <Loader2 v-if="uploadEnCours" :size="15" class="spin" />
              <CheckCircle v-else :size="15" />
              {{ uploadEnCours ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
            <button
              v-if="auth.utilisateur?.avatar && !avatarPreview"
              class="btn btn-danger-soft"
              @click="supprimerAvatar"
            >
              <Trash2 :size="15" /> Supprimer
            </button>
            <button v-if="avatarPreview" class="btn btn-ghost" @click="avatarPreview = null">
              <X :size="15" /> Annuler
            </button>
          </div>

          <div v-if="photoMsg.texte" class="photo-msg" :class="photoMsg.type">
            <CheckCircle v-if="photoMsg.type==='ok'" :size="14" />
            <AlertCircle v-else :size="14" />
            {{ photoMsg.texte }}
          </div>
        </div>
      </div>
    </div>

    <!-- ══ NOTIFICATIONS & RAPPELS ══════════════════════════════ -->
    <div class="card section-card">
      <h2 class="section-titre"><Bell :size="18" style="color:var(--color-primary)" /> Notifications & Rappels</h2>

      <div class="notif-list">
        <div class="notif-row">
          <div class="notif-row-left">
            <div class="notif-icone" style="background:rgba(74,222,128,.12);color:#16A34A">
              <CalendarClock :size="17" />
            </div>
            <div>
              <div class="notif-titre">Rappels de rendez-vous</div>
              <div class="notif-desc">Recevoir des alertes avant vos consultations (J-1, matin du jour, 2h avant)</div>
            </div>
          </div>
          <button
            class="toggle-switch"
            :class="{ active: prefStore.rappelRdv }"
            @click="toggleRappel"
            :title="prefStore.rappelRdv ? 'Désactiver' : 'Activer'"
          >
            <span class="toggle-thumb"></span>
          </button>
        </div>

        <div class="notif-row">
          <div class="notif-row-left">
            <div class="notif-icone" style="background:rgba(56,189,248,.12);color:#0284C7">
              <Monitor :size="17" />
            </div>
            <div>
              <div class="notif-titre">Notifications navigateur</div>
              <div class="notif-desc">Afficher des pop-ups sur votre bureau même quand l'onglet est en arrière-plan</div>
            </div>
          </div>
          <button
            class="toggle-switch"
            :class="{ active: notifBrowserActive }"
            @click="toggleNotifBrowser"
            :title="notifBrowserActive ? 'Révoquer la permission' : 'Activer'"
          >
            <span class="toggle-thumb"></span>
          </button>
        </div>
      </div>

      <div v-if="notifBrowserStatut === 'denied'" class="alert-info">
        <AlertCircle :size="14" />
        Les notifications navigateur sont bloquées. Cliquez sur le cadenas dans la barre d'adresse pour les autoriser.
      </div>
    </div>

    <!-- ══ THÈME D'AFFICHAGE ═════════════════════════════════════ -->
    <div class="card section-card">
      <h2 class="section-titre"><Palette :size="18" style="color:var(--color-primary)" /> Thème d'affichage</h2>
      <div class="theme-grid">
        <button v-for="t in themes" :key="t.val" class="theme-btn" :class="{ selected: prefStore.theme===t.val }" @click="choisirTheme(t.val)">
          <div class="theme-preview" :style="t.style">
            <div class="theme-preview-bar" :style="t.barStyle"></div>
            <div class="theme-preview-content">
              <div class="tp-line" :style="t.lineStyle"></div>
              <div class="tp-line short" :style="t.lineStyle"></div>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:.625rem .75rem">
            <span style="font-size:.85rem;font-weight:600">{{ t.label }}</span>
            <CheckCircle v-if="prefStore.theme===t.val" :size="16" style="color:var(--color-primary)" />
          </div>
        </button>
      </div>
    </div>

    <!-- ══ LANGUE ════════════════════════════════════════════════ -->
    <div class="card section-card">
      <h2 class="section-titre"><Languages :size="18" style="color:var(--color-primary)" /> Langue</h2>
      <div style="display:flex;gap:.75rem;flex-wrap:wrap">
        <button class="langue-btn" :class="{ selected: prefStore.langue==='fr' }" @click="choisirLangue('fr')">
          <span class="langue-flag">FR</span>
          Français
          <CheckCircle v-if="prefStore.langue==='fr'" :size="14" style="color:var(--color-primary)" />
        </button>
        <button class="langue-btn" :class="{ selected: prefStore.langue==='wo' }" @click="choisirLangue('wo')">
          <span class="langue-flag" style="background:#E6B800">WO</span>
          Wolof
          <CheckCircle v-if="prefStore.langue==='wo'" :size="14" style="color:var(--color-primary)" />
        </button>
      </div>
    </div>

    <!-- ══ MOT DE PASSE ══════════════════════════════════════════ -->
    <div class="card section-card">
      <h2 class="section-titre"><Lock :size="18" style="color:var(--color-primary)" /> Changer le mot de passe</h2>

      <div v-if="msgOk" class="alert-ok">
        <CheckCircle :size="15" /> Mot de passe mis à jour avec succès.
      </div>
      <div v-if="msgErr" class="alert-erreur">
        <AlertCircle :size="15" /> {{ msgErr }}
      </div>

      <form @submit.prevent="changerMdp" style="display:flex;flex-direction:column;gap:1rem">
        <div class="field">
          <label class="field-label"><Lock :size="13" /> Mot de passe actuel</label>
          <div class="input-wrap">
            <input v-model="mdp.actuel" :type="show.actuel?'text':'password'" class="input" required placeholder="••••••••" />
            <button type="button" class="show-btn" @click="show.actuel=!show.actuel">
              <EyeOff v-if="show.actuel" :size="16" /><Eye v-else :size="16" />
            </button>
          </div>
        </div>

        <div class="field">
          <label class="field-label"><Lock :size="13" /> Nouveau mot de passe</label>
          <div class="input-wrap">
            <input v-model="mdp.nouveau" :type="show.nouveau?'text':'password'" class="input" required placeholder="••••••••" minlength="6" />
            <button type="button" class="show-btn" @click="show.nouveau=!show.nouveau">
              <EyeOff v-if="show.nouveau" :size="16" /><Eye v-else :size="16" />
            </button>
          </div>
        </div>

        <div class="field">
          <label class="field-label"><Lock :size="13" /> Confirmer le nouveau mot de passe</label>
          <div class="input-wrap">
            <input v-model="mdp.confirm" :type="show.confirm?'text':'password'" class="input" required placeholder="••••••••" />
            <button type="button" class="show-btn" @click="show.confirm=!show.confirm">
              <EyeOff v-if="show.confirm" :size="16" /><Eye v-else :size="16" />
            </button>
          </div>
          <p v-if="mdp.nouveau&&mdp.confirm&&mdp.nouveau!==mdp.confirm" class="hint-erreur">
            <AlertCircle :size="12" /> Les mots de passe ne correspondent pas
          </p>
        </div>

        <div>
          <button type="submit" class="btn btn-primary" :disabled="envoi || (mdp.nouveau!==mdp.confirm)">
            <Loader2 v-if="envoi" :size="16" class="spin" />
            <Save v-else :size="16" />
            {{ envoi ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Palette, Languages, Lock, CheckCircle, AlertCircle, Eye, EyeOff,
  Loader2, Save, Camera, Upload, User, Bell, CalendarClock, Monitor,
  Trash2, X,
} from 'lucide-vue-next'
import { usePreferencesStore } from '../../stores/preferences.js'
import { useAuthStore } from '../../stores/auth.js'
import { useApi } from '../../composables/useApi.js'

const prefStore = usePreferencesStore()
const auth      = useAuthStore()
const api       = useApi()

/* ─── Photo de profil ─── */
const fileInput      = ref(null)
const avatarPreview  = ref(null)
const uploadEnCours  = ref(false)
const photoMsg       = reactive({ texte: '', type: 'ok' })

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    photoMsg.texte = 'Image trop lourde (max 2 Mo)'
    photoMsg.type  = 'err'
    return
  }
  photoMsg.texte = ''
  const reader = new FileReader()
  reader.onload = (ev) => {
    resizeImage(ev.target.result, 256, (resized) => { avatarPreview.value = resized })
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

function resizeImage(src, maxSize, cb) {
  const img = new Image()
  img.onload = () => {
    const size = Math.min(img.width, img.height)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = maxSize
    const ctx = canvas.getContext('2d')
    const ox = (img.width  - size) / 2
    const oy = (img.height - size) / 2
    ctx.drawImage(img, ox, oy, size, size, 0, 0, maxSize, maxSize)
    cb(canvas.toDataURL('image/jpeg', 0.85))
  }
  img.src = src
}

async function sauvegarderAvatar() {
  if (!avatarPreview.value) return
  uploadEnCours.value = true
  photoMsg.texte = ''
  try {
    const updated = await api.put('/patient/avatar', { avatar: avatarPreview.value })
    auth.updateAvatar(updated.avatar)
    avatarPreview.value = null
    photoMsg.texte = 'Photo de profil mise à jour !'
    photoMsg.type  = 'ok'
  } catch (e) {
    photoMsg.texte = e.message || 'Erreur lors de l\'enregistrement'
    photoMsg.type  = 'err'
  } finally { uploadEnCours.value = false }
}

async function supprimerAvatar() {
  if (!confirm('Supprimer votre photo de profil ?')) return
  try {
    await api.put('/patient/avatar', { avatar: '' })
    auth.updateAvatar(null)
    photoMsg.texte = 'Photo supprimée.'
    photoMsg.type  = 'ok'
  } catch { /* silencieux */ }
}

/* ─── Rappels & Notifications navigateur ─── */
const notifBrowserStatut  = ref(window.Notification?.permission || 'default')
const notifBrowserActive  = computed(() => notifBrowserStatut.value === 'granted')

function toggleRappel() {
  prefStore.setRappelRdv(!prefStore.rappelRdv)
}

async function toggleNotifBrowser() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    notifBrowserStatut.value = 'default'
    return
  }
  const result = await Notification.requestPermission()
  notifBrowserStatut.value = result
}

onMounted(() => {
  if ('Notification' in window) notifBrowserStatut.value = Notification.permission
})

/* ─── Thème & Langue ─── */
const themes = [
  { val: 'CLAIR',  label: 'Clair',        style: 'background:#F1F5F9', barStyle: 'background:#22C55E', lineStyle: 'background:#CBD5E1' },
  { val: 'SOMBRE', label: 'Sombre',       style: 'background:#1E293B', barStyle: 'background:#16A34A', lineStyle: 'background:#475569' },
  { val: 'AUTO',   label: 'Auto (système)', style: 'background:linear-gradient(135deg,#F1F5F9 50%,#1E293B 50%)', barStyle: 'background:linear-gradient(90deg,#22C55E 50%,#16A34A 50%)', lineStyle: 'background:linear-gradient(90deg,#CBD5E1 50%,#475569 50%)' },
]
function choisirTheme(val) { prefStore.setTheme(val) }
function choisirLangue(val) { prefStore.setLangue(val) }

/* ─── Mot de passe ─── */
const envoi  = ref(false)
const msgOk  = ref(false)
const msgErr = ref('')
const show   = reactive({ actuel: false, nouveau: false, confirm: false })
const mdp    = reactive({ actuel: '', nouveau: '', confirm: '' })

async function changerMdp() {
  if (mdp.nouveau !== mdp.confirm) return
  envoi.value = true; msgOk.value = false; msgErr.value = ''
  try {
    await api.put('/auth/mot-de-passe', { ancien: mdp.actuel, nouveau: mdp.nouveau })
    msgOk.value = true
    mdp.actuel = ''; mdp.nouveau = ''; mdp.confirm = ''
  } catch(e) { msgErr.value = e.message }
  finally { envoi.value = false }
}
</script>

<style scoped>
.page-titre    { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
.section-card  { padding:1.5rem;margin-bottom:1.25rem }
.section-titre { display:flex;align-items:center;gap:.625rem;font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--color-text);margin-bottom:1.25rem }

/* ── Photo de profil ── */
.photo-layout { display:flex; align-items:flex-start; gap:1.5rem; }
@media(max-width:560px) { .photo-layout { flex-direction:column; align-items:center; } }

.photo-avatar-wrap { position:relative; flex-shrink:0; }
.photo-ring {
  width:96px; height:96px; border-radius:50%;
  background:linear-gradient(135deg,#4ADE80,#059669); padding:3px;
  box-shadow:0 6px 24px rgba(34,197,94,.25);
}
.photo-img { width:100%; height:100%; border-radius:50%; object-fit:cover; border:3px solid white; }
.photo-placeholder {
  width:100%; height:100%; border-radius:50%; border:3px solid white;
  background:linear-gradient(135deg,#F0FDF4,#DCFCE7);
  display:flex; align-items:center; justify-content:center; color:#16A34A;
}
.photo-badge-new {
  position:absolute; bottom:0; right:-4px;
  background:linear-gradient(135deg,#4ADE80,#059669); color:white;
  font-size:.6rem; font-weight:800; text-transform:uppercase; letter-spacing:.06em;
  padding:.15rem .5rem; border-radius:9999px;
  border:2px solid white; box-shadow:0 2px 8px rgba(34,197,94,.4);
}

.photo-actions { flex:1; display:flex; flex-direction:column; gap:.875rem; }
.photo-hint   { font-size:.78rem; color:var(--color-text-muted); line-height:1.5; }
.photo-btns   { display:flex; gap:.625rem; flex-wrap:wrap; }

.btn { display:inline-flex;align-items:center;gap:.45rem;padding:.55rem 1.125rem;border-radius:.75rem;border:none;cursor:pointer;font-size:.85rem;font-weight:600;transition:all .2s }
.btn-primary   { background:linear-gradient(135deg,#4ADE80,#059669);color:white;box-shadow:0 4px 14px rgba(34,197,94,.3) }
.btn-primary:hover { transform:translateY(-1px);box-shadow:0 6px 20px rgba(34,197,94,.45) }
.btn-primary:disabled { opacity:.5;cursor:not-allowed;transform:none }
.btn-save      { background:linear-gradient(135deg,#38BDF8,#0284C7);color:white;box-shadow:0 4px 14px rgba(14,165,233,.3) }
.btn-save:disabled { opacity:.5;cursor:not-allowed }
.btn-ghost     { background:#F1F5F9;color:var(--color-text-muted);border:1px solid #E2E8F0 }
.btn-ghost:hover { background:#E2E8F0 }
.btn-danger-soft { background:rgba(239,68,68,.07);color:#DC2626;border:1.5px solid rgba(239,68,68,.2) }
.btn-danger-soft:hover { background:rgba(239,68,68,.14) }

.photo-msg { display:flex;align-items:center;gap:.375rem;font-size:.8rem;border-radius:.75rem;padding:.5rem .75rem; }
.photo-msg.ok  { background:rgba(34,197,94,.08);color:#16A34A;border:1px solid rgba(34,197,94,.2) }
.photo-msg.err { background:rgba(239,68,68,.08);color:#DC2626;border:1px solid rgba(239,68,68,.2) }

/* ── Notifications ── */
.notif-list { display:flex; flex-direction:column; gap:.875rem; }
.notif-row  {
  display:flex; align-items:center; justify-content:space-between; gap:1rem;
  padding:1rem; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:1rem;
}
.notif-row-left { display:flex; align-items:flex-start; gap:.875rem; flex:1; min-width:0; }
.notif-icone {
  width:38px; height:38px; border-radius:.75rem; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
}
.notif-titre { font-size:.88rem; font-weight:700; color:var(--color-text); }
.notif-desc  { font-size:.75rem; color:var(--color-text-muted); margin-top:.15rem; line-height:1.5; }

/* Toggle Switch */
.toggle-switch {
  width:48px; height:26px; border-radius:9999px; border:none; cursor:pointer;
  background:#CBD5E1; position:relative; transition:background .25s; flex-shrink:0;
}
.toggle-switch.active { background:linear-gradient(90deg,#4ADE80,#16A34A); }
.toggle-thumb {
  position:absolute; top:4px; left:4px;
  width:18px; height:18px; border-radius:50%; background:white;
  box-shadow:0 1px 4px rgba(0,0,0,.2);
  transition:transform .25s cubic-bezier(.4,0,.2,1);
}
.toggle-switch.active .toggle-thumb { transform:translateX(22px); }

.alert-info {
  display:flex;align-items:center;gap:.5rem;margin-top:.875rem;
  background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);color:#92400E;
  border-radius:.75rem;padding:.625rem .875rem;font-size:.8rem;line-height:1.4;
}

/* ── Thème & Langue ── */
.theme-grid   { display:grid;grid-template-columns:repeat(3,1fr);gap:.875rem }
@media(max-width:560px){ .theme-grid { grid-template-columns:1fr } }
.theme-btn    { border:2px solid #E2E8F0;border-radius:.875rem;overflow:hidden;background:none;cursor:pointer;transition:all .2s;text-align:left }
.theme-btn.selected { border-color:var(--color-primary);box-shadow:0 0 0 3px rgba(34,197,94,0.15) }
.theme-preview{ height:80px;display:flex;flex-direction:column;gap:.5rem;padding:.625rem;overflow:hidden }
.theme-preview-bar { height:10px;border-radius:5px }
.theme-preview-content { display:flex;flex-direction:column;gap:.375rem;padding:0 .25rem }
.tp-line      { height:6px;border-radius:3px;width:100% }
.tp-line.short{ width:60% }
.langue-btn   { display:flex;align-items:center;gap:.625rem;padding:.625rem 1.125rem;border-radius:.75rem;border:1.5px solid #E2E8F0;background:white;cursor:pointer;font-size:.88rem;font-weight:500;color:var(--color-text);transition:all .18s }
.langue-btn.selected { border-color:var(--color-primary);background:rgba(34,197,94,0.06) }
.langue-flag  { display:inline-flex;align-items:center;justify-content:center;width:28px;height:20px;border-radius:4px;background:var(--color-primary);color:white;font-size:.65rem;font-weight:800 }

/* ── Mot de passe ── */
.field        { display:flex;flex-direction:column;gap:.375rem }
.field-label  { display:flex;align-items:center;gap:.375rem;font-size:.8rem;font-weight:600;color:var(--color-text-muted) }
.input-wrap   { position:relative }
.input-wrap .input { padding-right:2.5rem }
.show-btn     { position:absolute;right:.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex;align-items:center }
.hint-erreur  { display:flex;align-items:center;gap:.3rem;font-size:.75rem;color:var(--color-danger);margin-top:.25rem }
.alert-ok     { display:flex;align-items:center;gap:.5rem;background:rgba(21,128,61,0.08);border:1px solid rgba(21,128,61,.25);color:var(--color-green);border-radius:.75rem;padding:.625rem .875rem;font-size:.85rem;margin-bottom:1rem }
.alert-erreur { display:flex;align-items:center;gap:.5rem;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,.25);color:var(--color-danger);border-radius:.75rem;padding:.625rem .875rem;font-size:.85rem;margin-bottom:1rem }
.spin { animation:spin 1s linear infinite }
@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
</style>
