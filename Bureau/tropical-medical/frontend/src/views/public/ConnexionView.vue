<template>
  <div class="connexion-page" :style="{ backgroundImage: `url(${bgImage})` }">
    <!-- Overlay sombre -->
    <div class="connexion-overlay"></div>

    <div class="connexion-wrapper">

      <!-- Carte connexion -->
      <div class="connexion-card">

        <!-- Logo + nom -->
        <div class="card-top">
          <div class="card-logo">
            <img :src="logoFe" alt="Tropical Medical" class="card-logo-img" />
          </div>
          <div class="card-top-texts">
            <div class="card-title">Tropical Medical</div>
            <div class="card-subtitle">{{ t('app.tagline') }}</div>
          </div>
        </div>

        <!-- Message d'erreur -->
        <div v-if="erreur" class="alert-erreur">
          <AlertCircle :size="15" /> {{ erreur }}
        </div>

        <form @submit.prevent="seConnecter" class="form-fields">
          <!-- Email -->
          <div class="field">
            <label class="field-label"><Mail :size="13" /> {{ t('auth.email') }}</label>
            <div class="input-icon-wrap">
              <Mail :size="16" class="input-icon" />
              <input v-model="form.email" type="email" class="input-glass"
                placeholder="exemple@tropical.sn" autocomplete="email" required />
            </div>
          </div>

          <!-- Mot de passe -->
          <div class="field">
            <label class="field-label"><Lock :size="13" /> {{ t('auth.motDePasse') }}</label>
            <div class="input-icon-wrap">
              <Lock :size="16" class="input-icon" />
              <input v-model="form.motDePasse" :type="voirPwd ? 'text' : 'password'"
                class="input-glass" placeholder="••••••••"
                autocomplete="current-password" required />
              <button type="button" class="btn-voir-pwd" @click="voirPwd = !voirPwd" tabindex="-1">
                <Eye v-if="!voirPwd" :size="17" />
                <EyeOff v-else :size="17" />
              </button>
            </div>
          </div>

          <button type="submit" class="btn-connexion-submit" :disabled="chargement">
            <span class="btn-connexion-inner">
              <Loader2 v-if="chargement" :size="18" class="spin" />
              <LogIn v-else :size="18" />
              {{ chargement ? t('auth.chargement') : t('auth.seConnecter') }}
            </span>
          </button>
        </form>

        <!-- Séparateur -->
        <div class="separateur">
          <span class="separateur-ligne"></span>
          <span class="separateur-texte">{{ t('auth.accesRapide') }}</span>
          <span class="separateur-ligne"></span>
        </div>

        <!-- Accès rapide -->
        <div class="acces-rapide">
          <button v-for="role in rolesDemo" :key="role.email" type="button"
            class="btn-role" :style="{ '--role-color': role.couleur }"
            @click="connexionRapide(role)" :disabled="chargement">
            <div class="btn-role-icon" :style="{ background: role.couleur + '30' }">
              <component :is="role.icone" :size="14" :style="{ color: role.couleur }" />
            </div>
            <span>{{ role.label }}</span>
          </button>
        </div>

        <div class="card-footer">Tropical Medical &copy; 2025</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Mail, Lock, Eye, EyeOff, LogIn, Loader2,
  AlertCircle, ShieldCheck, Stethoscope, ClipboardList,
  FlaskConical, User,
} from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth.js'
import bgImage from '../../../image medicale/ime.png'
import logoFe  from '../../../image medicale/fe.png'

const { t } = useI18n()

const router = useRouter()
const auth = useAuthStore()

const form = ref({ email: '', motDePasse: '' })
const erreur = ref('')
const chargement = ref(false)
const voirPwd = ref(false)

const rolesDemo = [
  { label: 'Administrateur',  email: 'admin@tropical.sn',          pwd: 'Admin123!',   icone: ShieldCheck,   couleur: '#0A7A6D', bg: 'rgba(14,159,142,0.08)' },
  { label: 'Médecin',         email: 'medecin@tropical.sn',         pwd: 'Medecin123!', icone: Stethoscope,   couleur: '#0EA5E9', bg: 'rgba(14,165,233,0.08)' },
  { label: 'Réceptionniste',  email: 'receptionniste@tropical.sn',  pwd: 'Recep123!',   icone: ClipboardList, couleur: '#92740d', bg: 'rgba(230,184,0,0.08)'  },
  { label: 'Pharmacien',      email: 'pharmacien@tropical.sn',      pwd: 'Pharma123!',  icone: FlaskConical,  couleur: '#15803D', bg: 'rgba(21,128,61,0.08)'  },
  { label: 'Patient',         email: 'patient@tropical.sn',         pwd: 'Patient123!', icone: User,          couleur: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
]

async function seConnecter() {
  erreur.value = ''
  chargement.value = true
  try {
    await auth.connexion(form.value.email, form.value.motDePasse)
    router.push(auth.routeParDefaut)
  } catch (e) {
    erreur.value = e.message || 'Identifiants incorrects'
  } finally {
    chargement.value = false
  }
}

function connexionRapide(role) {
  form.value.email = role.email
  form.value.motDePasse = role.pwd
  seConnecter()
}
</script>

<style scoped>
.connexion-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  overflow: hidden;
  padding: 1.5rem;
}

.connexion-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(10, 122, 109, 0.72) 0%,
    rgba(14, 31, 42, 0.78) 100%
  );
  backdrop-filter: blur(1px);
  pointer-events: none;
}

.connexion-wrapper {
  width: 100%;
  max-width: 460px;
  position: relative;
  z-index: 1;
}

/* ── Carte glassmorphism ── */
.connexion-card {
  border-radius: 2rem;
  overflow: hidden;
  padding: 2rem;
  background: rgba(255,255,255,0.13);
  backdrop-filter: blur(28px) saturate(1.6);
  -webkit-backdrop-filter: blur(28px) saturate(1.6);
  border: 1.5px solid rgba(255,255,255,0.25);
  box-shadow:
    0 32px 80px rgba(0,0,0,0.4),
    0 0 0 1px rgba(255,255,255,0.08) inset,
    0 1px 0 rgba(255,255,255,0.35) inset;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

/* Logo + nom en haut */
.card-top {
  display: flex;
  align-items: center;
  gap: .875rem;
}
.card-logo {
  width: 54px; height: 54px;
  border-radius: 14px;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.4);
  box-shadow: 0 6px 20px rgba(0,0,0,0.25);
  flex-shrink: 0;
}
.card-logo-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.card-top-texts { color: white; }
.card-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: -.03em;
  line-height: 1.1;
  color: white;
  text-shadow: 0 2px 12px rgba(0,0,0,0.35);
}
.card-subtitle {
  font-size: .72rem;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  margin-top: 3px;
  letter-spacing: .03em;
}

/* Badge "Connexion" */
.connexion-badge {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  align-self: flex-start;
  padding: .55rem 1.25rem;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgba(14,159,142,0.9), rgba(10,122,109,0.95));
  border: 1.5px solid rgba(255,255,255,0.3);
  color: white;
  font-family: var(--font-display);
  font-size: .92rem;
  font-weight: 800;
  letter-spacing: .02em;
  box-shadow: 0 4px 18px rgba(14,159,142,0.5), inset 0 1px 0 rgba(255,255,255,0.2);
  backdrop-filter: blur(8px);
}

/* Erreur */
.alert-erreur {
  display: flex;
  align-items: center;
  gap: .5rem;
  background: rgba(220,38,38,0.2);
  border: 1px solid rgba(220,38,38,0.35);
  color: #fca5a5;
  border-radius: .875rem;
  padding: .625rem .875rem;
  font-size: .83rem;
}

/* Champs */
.form-fields { display: flex; flex-direction: column; gap: .875rem; }
.field { display: flex; flex-direction: column; gap: .4rem; }
.field-label {
  display: flex;
  align-items: center;
  gap: .35rem;
  font-size: .75rem;
  font-weight: 800;
  color: rgba(255,255,255,0.9);
  text-transform: uppercase;
  letter-spacing: .08em;
  text-shadow: 0 1px 6px rgba(0,0,0,0.3);
}

/* Input glassmorphism */
.input-icon-wrap { position: relative; }
.input-icon {
  position: absolute;
  left: .875rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255,255,255,0.5);
  pointer-events: none;
  transition: color .2s;
}
.input-icon-wrap:focus-within .input-icon { color: white; }
.input-glass {
  width: 100%;
  height: 48px;
  padding-left: 2.75rem;
  padding-right: 1rem;
  border-radius: .875rem;
  border: 1.5px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(8px);
  color: white;
  font-size: .9rem;
  outline: none;
  transition: all .25s ease;
  font-family: inherit;
}
.input-glass::placeholder { color: rgba(255,255,255,0.4); }
.input-glass:focus {
  border-color: rgba(255,255,255,0.55);
  background: rgba(255,255,255,0.18);
  box-shadow: 0 0 0 3px rgba(255,255,255,0.1), 0 4px 16px rgba(14,159,142,0.2);
}

/* Voir mot de passe */
.btn-voir-pwd {
  position: absolute;
  right: .875rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255,255,255,0.5);
  display: flex;
  align-items: center;
  padding: .25rem;
  transition: color .18s;
}
.btn-voir-pwd:hover { color: white; }

/* Bouton connexion */
.btn-connexion-submit {
  width: 100%;
  padding: 0;
  border: none;
  border-radius: .875rem;
  cursor: pointer;
  background: linear-gradient(135deg, #05c49a 0%, #0e9f8e 50%, #0a7a6d 100%);
  box-shadow: 0 6px 24px rgba(5,196,154,0.6), 0 2px 8px rgba(0,0,0,0.2);
  transition: all .25s cubic-bezier(.4,0,.2,1);
  position: relative; overflow: hidden;
}
.btn-connexion-submit::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%);
  pointer-events: none;
}
.btn-connexion-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(5,196,154,0.7), 0 4px 12px rgba(0,0,0,0.2);
  background: linear-gradient(135deg, #07daa9 0%, #10b89f 50%, #0a8a7a 100%);
}
.btn-connexion-submit:active:not(:disabled) { transform: translateY(0); }
.btn-connexion-submit:disabled { opacity: .55; cursor: not-allowed; }
.btn-connexion-inner {
  display: flex; align-items: center; justify-content: center; gap: .625rem;
  padding: .925rem 1.5rem;
  color: white; font-size: 1rem; font-weight: 800;
  font-family: var(--font-display); letter-spacing: .04em;
  text-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

/* Séparateur */
.separateur { display: flex; align-items: center; gap: .75rem; }
.separateur-ligne { flex: 1; height: 1px; background: rgba(255,255,255,0.2); }
.separateur-texte {
  font-size: .68rem; font-weight: 800;
  color: rgba(255,255,255,0.65);
  text-transform: uppercase; letter-spacing: .1em; white-space: nowrap;
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

/* Accès rapide 2 colonnes */
.acces-rapide { display: grid; grid-template-columns: 1fr 1fr; gap: .45rem; }
.btn-role {
  display: flex; align-items: center; gap: .5rem;
  padding: .5rem .75rem;
  border-radius: .75rem;
  font-size: .76rem; font-weight: 700;
  cursor: pointer;
  border: 1.5px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.12);
  color: white;
  transition: all .2s ease;
  backdrop-filter: blur(6px);
  font-family: inherit;
  text-shadow: 0 1px 4px rgba(0,0,0,0.25);
}
.btn-role-icon {
  width: 26px; height: 26px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.btn-role:hover:not(:disabled) {
  border-color: rgba(255,255,255,0.4);
  background: rgba(255,255,255,0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0,0,0,0.2);
}
.btn-role:disabled { opacity: .45; cursor: not-allowed; }

/* Pied */
.card-footer {
  text-align: center;
  font-size: .67rem;
  color: rgba(255,255,255,0.35);
  padding-top: .25rem;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
