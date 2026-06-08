<template>
  <!-- Overlay mobile -->
  <Transition name="fade-overlay">
    <div v-if="ouvert && mobile" class="sidebar-overlay" @click="$emit('fermer')" />
  </Transition>

  <!-- Sidebar -->
  <Transition name="slide-sidebar">
    <aside v-show="ouvert || !mobile" class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon">
          <img :src="logoFe" alt="Tropical Medical" class="logo-img" />
        </div>
        <div class="logo-texts">
          <span class="logo-name">Tropical Medical</span>
          <span class="logo-role-badge" :style="{ background: roleCouleur + '20', color: roleCouleur }">
            {{ roleLabel }}
          </span>
        </div>
        <button v-if="mobile" class="sidebar-close" @click="$emit('fermer')">
          <X :size="18" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in menus"
          :key="item.route"
          :to="item.route"
          class="sidebar-link"
          :class="{ 'sidebar-link-active': estActif(item) }"
          @click="mobile && $emit('fermer')"
        >
          <component :is="item.icone" :size="18" class="sidebar-link-icon" />
          <span class="sidebar-link-label">{{ item.label }}</span>
          <span v-if="item.badge" class="sidebar-badge">{{ item.badge }}</span>
        </RouterLink>
      </nav>

      <!-- Bas : infos utilisateur + déconnexion -->
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-user-avatar" :style="{ background: roleCouleur + '20' }">
            <component :is="roleIcone" :size="18" :style="{ color: roleCouleur }" />
          </div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">{{ prenom }} {{ nom }}</div>
            <div class="sidebar-user-email">{{ email }}</div>
          </div>
        </div>
        <button class="sidebar-logout" @click="deconnecter">
          <LogOut :size="16" />
          <span>{{ t('auth.deconnexion') }}</span>
        </button>
      </div>
    </aside>
  </Transition>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { X, LogOut, ShieldCheck, Stethoscope, ClipboardList, FlaskConical, User } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth.js'
import logoFe from '../../../image medicale/fe.png'

const props = defineProps({
  menus:  { type: Array,   required: true },
  ouvert: { type: Boolean, default: true  },
})
defineEmits(['fermer'])

const { t } = useI18n()
const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const mobile = ref(false)

function checkMobile() { mobile.value = window.innerWidth < 1024 }
onMounted(() => { checkMobile(); window.addEventListener('resize', checkMobile) })
onUnmounted(() => window.removeEventListener('resize', checkMobile))

const utilisateur = computed(() => auth.utilisateur || {})
const nom    = computed(() => utilisateur.value.nom    || '')
const prenom = computed(() => utilisateur.value.prenom || '')
const email  = computed(() => utilisateur.value.email  || '')

const ROLES_CONFIG = {
  ADMIN:          { icone: ShieldCheck,   couleur: '#16A34A' },
  MEDECIN:        { icone: Stethoscope,   couleur: '#0284C7' },
  RECEPTIONNISTE: { icone: ClipboardList, couleur: '#D97706' },
  PHARMACIEN:     { icone: FlaskConical,  couleur: '#059669' },
  PATIENT:        { icone: User,          couleur: '#7C3AED' },
}

const roleConfig  = computed(() => ROLES_CONFIG[utilisateur.value.role] || ROLES_CONFIG.PATIENT)
const roleLabel   = computed(() => t('roles.' + (utilisateur.value.role || 'PATIENT')))
const roleCouleur = computed(() => roleConfig.value.couleur)
const roleIcone   = computed(() => roleConfig.value.icone)

function estActif(item) {
  if (item.exact) return route.path === item.route
  return route.path.startsWith(item.route) && (item.route !== '/' || route.path === '/')
}

function deconnecter() {
  auth.deconnexion()
  router.push('/connexion')
}
</script>

<style scoped>
/* ─── Sidebar ─────────────────────────────────────────── */
.sidebar {
  position: fixed;
  top: 0; left: 0;
  width: 256px;
  height: 100vh;
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(24px) saturate(1.8);
  -webkit-backdrop-filter: blur(24px) saturate(1.8);
  border-right: 1px solid rgba(34,197,94,0.1);
  box-shadow: 4px 0 24px rgba(34,197,94,0.06);
  display: flex;
  flex-direction: column;
  z-index: 50;
  overflow: hidden;
  transition: all .25s ease;
}

/* ─── Logo ─────────────────────────────────────────────── */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid rgba(34,197,94,0.08);
  flex-shrink: 0;
  position: relative;
}
.sidebar-logo::after {
  content: '';
  position: absolute;
  bottom: 0; left: 1rem; right: 1rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(34,197,94,.2), transparent);
}

.logo-icon {
  width: 40px; height: 40px;
  border-radius: 11px;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid rgba(34,197,94,0.25);
  box-shadow: 0 4px 14px rgba(34,197,94,.25);
}
.logo-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.logo-texts { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.logo-name {
  font-family: var(--font-display);
  font-size: .875rem; font-weight: 800;
  color: var(--color-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  letter-spacing: -.01em;
}
.logo-role-badge {
  font-size: .62rem; font-weight: 700;
  border-radius: 4px;
  padding: 1px 6px;
  text-transform: uppercase; letter-spacing: .05em;
  width: fit-content;
}
.sidebar-close {
  margin-left: auto; background: none; border: none;
  cursor: pointer; color: var(--color-text-muted);
  display: flex; align-items: center; padding: .25rem;
  flex-shrink: 0; transition: color .15s;
}
.sidebar-close:hover { color: var(--color-text); }

/* ─── Navigation ───────────────────────────────────────── */
.sidebar-nav {
  flex: 1; overflow-y: auto;
  padding: .875rem .75rem;
  display: flex; flex-direction: column; gap: .175rem;
}
.sidebar-nav::-webkit-scrollbar { width: 3px; }
.sidebar-nav::-webkit-scrollbar-thumb { background: rgba(34,197,94,.2); border-radius: 9999px; }

.sidebar-link {
  display: flex; align-items: center; gap: .75rem;
  padding: .625rem .875rem;
  border-radius: .75rem;
  font-size: .85rem; font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: all .18s cubic-bezier(.4,0,.2,1);
  position: relative; border: 1px solid transparent;
}
.sidebar-link:hover {
  background: rgba(34,197,94,.07);
  color: var(--color-primary);
  border-color: rgba(34,197,94,.12);
}
.sidebar-link-active {
  background: linear-gradient(135deg, rgba(34,197,94,.15), rgba(10,122,109,.08));
  color: var(--color-primary);
  font-weight: 600;
  border-color: rgba(34,197,94,.2);
  box-shadow: 0 2px 8px rgba(34,197,94,.1);
}
.sidebar-link-active::before {
  content: '';
  position: absolute;
  left: 0; top: 20%; bottom: 20%;
  width: 3px;
  background: var(--grad-primary);
  border-radius: 0 3px 3px 0;
}
.sidebar-link-icon { flex-shrink: 0; transition: color .15s; }
.sidebar-link-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-badge {
  background: var(--grad-danger);
  color: white;
  border-radius: 9999px;
  font-size: .62rem; font-weight: 700;
  padding: 1px 7px; min-width: 20px; text-align: center;
  box-shadow: 0 2px 6px rgba(220,38,38,.3);
}

/* ─── Footer ───────────────────────────────────────────── */
.sidebar-footer {
  border-top: 1px solid rgba(34,197,94,.08);
  padding: .875rem .75rem;
  display: flex; flex-direction: column; gap: .5rem;
  flex-shrink: 0;
  position: relative;
}
.sidebar-footer::before {
  content: '';
  position: absolute;
  top: 0; left: .75rem; right: .75rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(34,197,94,.2), transparent);
}

.sidebar-user {
  display: flex; align-items: center; gap: .625rem;
  padding: .5rem .625rem;
  border-radius: .75rem;
  background: rgba(34,197,94,.05);
  border: 1px solid rgba(34,197,94,.1);
  transition: all .18s;
  cursor: default;
}

.sidebar-user-avatar {
  width: 34px; height: 34px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,.12);
}
.sidebar-user-info { min-width: 0; flex: 1; }
.sidebar-user-name {
  font-size: .8rem; font-weight: 700; color: var(--color-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sidebar-user-email {
  font-size: .68rem; color: var(--color-text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.sidebar-logout {
  display: flex; align-items: center; gap: .5rem;
  padding: .5rem .875rem; border-radius: .75rem; border: none;
  background: rgba(220,38,38,.06);
  border: 1px solid rgba(220,38,38,.1);
  color: var(--color-danger);
  font-size: .8rem; font-weight: 600;
  cursor: pointer; width: 100%;
  transition: all .18s;
  font-family: inherit;
}
.sidebar-logout:hover {
  background: rgba(220,38,38,.12);
  border-color: rgba(220,38,38,.2);
  box-shadow: 0 2px 8px rgba(220,38,38,.15);
}

/* ─── Overlay mobile ────────────────────────────────────── */
.sidebar-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(2px);
  z-index: 49;
}

/* ─── Transitions ───────────────────────────────────────── */
.fade-overlay-enter-active, .fade-overlay-leave-active { transition: opacity .25s ease; }
.fade-overlay-enter-from, .fade-overlay-leave-to { opacity: 0; }

.slide-sidebar-enter-active, .slide-sidebar-leave-active { transition: transform .28s cubic-bezier(.4,0,.2,1); }
.slide-sidebar-enter-from, .slide-sidebar-leave-to { transform: translateX(-100%); }
</style>
