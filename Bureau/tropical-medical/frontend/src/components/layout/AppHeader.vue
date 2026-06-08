<template>
  <header class="app-header">
    <!-- Bouton hamburger (mobile) -->
    <button class="hamburger" @click="$emit('toggleSidebar')" aria-label="Menu">
      <Menu :size="20" />
    </button>

    <!-- Titre de la page -->
    <div class="header-titre">
      <component v-if="titreMeta.icone" :is="titreMeta.icone" :size="18" style="color:var(--color-primary);flex-shrink:0" />
      <h1 class="header-h1">{{ titreMeta.label }}</h1>
    </div>

    <div class="header-actions">
      <!-- Toggle thème -->
      <button class="header-btn" @click="toggleTheme" :title="prefs.theme === 'SOMBRE' ? t('theme.clair') : t('theme.sombre')">
        <Sun v-if="prefs.theme === 'SOMBRE'" :size="18" />
        <Moon v-else :size="18" />
      </button>

      <!-- Toggle langue FR / WO -->
      <button class="langue-toggle" @click="toggleLangue" :title="prefs.langue === 'fr' ? 'Wolof' : 'Français'">
        <span class="langue-actuelle">{{ prefs.langue === 'fr' ? 'FR' : 'WO' }}</span>
        <span class="langue-autre">{{ prefs.langue === 'fr' ? 'WO' : 'FR' }}</span>
      </button>

      <!-- Notifications -->
      <div class="notif-wrap" ref="notifRef">
        <button class="header-btn notif-btn" @click="panneauOuvert = !panneauOuvert">
          <Bell :size="18" />
          <span v-if="notifs.nonLues > 0" class="notif-count">{{ notifs.nonLues > 9 ? '9+' : notifs.nonLues }}</span>
        </button>

        <!-- Panneau notifications -->
        <Transition name="dropdown">
          <div v-if="panneauOuvert" class="notif-panel">
            <div class="notif-panel-header">
              <span class="notif-panel-title">{{ t('notifs.titre') }}</span>
              <button v-if="notifs.nonLues > 0" class="notif-tout-lire" @click="notifs.marquerToutesLues()">
                {{ t('notifs.tout_lire') }}
              </button>
            </div>

            <div class="notif-list" v-if="notifs.items.length">
              <div
                v-for="n in notifs.items.slice(0, 8)"
                :key="n.id"
                class="notif-item"
                :class="{ 'notif-item-nonlue': !n.lu }"
                @click="notifs.marquerLue(n.id)"
              >
                <div class="notif-dot" v-if="!n.lu"></div>
                <div class="notif-content">
                  <div class="notif-titre">{{ n.titre }}</div>
                  <div class="notif-msg">{{ n.message }}</div>
                  <div class="notif-date">{{ formatDate(n.createdAt) }}</div>
                </div>
              </div>
            </div>

            <div v-else class="notif-vide">
              <BellOff :size="28" style="opacity:.3" />
              <span>{{ t('notifs.aucune') }}</span>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Avatar utilisateur -->
      <div class="user-pill">
        <div class="user-avatar" :style="{ background: roleCouleur + '20' }">
          <img
            v-if="utilisateur.avatar"
            :src="utilisateur.avatar"
            class="user-avatar-img"
            :alt="prenom"
          />
          <component v-else :is="roleIcone" :size="16" :style="{ color: roleCouleur }" />
        </div>
        <div class="user-info">
          <span class="user-name">{{ prenom }} {{ nom }}</span>
          <span class="user-role">{{ roleLabel }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Menu, Bell, BellOff, Sun, Moon,
  ShieldCheck, Stethoscope, ClipboardList, FlaskConical, User,
  LayoutDashboard, Calendar, FolderOpen, FileText, Receipt,
  Video, Settings, Users, Newspaper, BarChart3, BedDouble,
  FlaskRound, Truck, Activity,
} from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth.js'
import { usePreferencesStore } from '../../stores/preferences.js'
import { useNotificationsStore } from '../../stores/notifications.js'

defineEmits(['toggleSidebar'])

const { t } = useI18n()
const route  = useRoute()
const auth   = useAuthStore()
const prefs  = usePreferencesStore()
const notifs = useNotificationsStore()

const panneauOuvert = ref(false)
const notifRef = ref(null)

function clickExterieur(e) {
  if (notifRef.value && !notifRef.value.contains(e.target)) panneauOuvert.value = false
}
onMounted(() => {
  document.addEventListener('click', clickExterieur, true)
  notifs.charger()
})
onUnmounted(() => document.removeEventListener('click', clickExterieur, true))

// Mapping route → clé module + icône (traduit via computed)
const TITRES_META = {
  PatientDashboard:    { key: 'tableau_bord',      icone: LayoutDashboard },
  PatientRdv:          { key: 'mes_rdv',           icone: Calendar        },
  PatientDossier:      { key: 'mon_dossier',       icone: FolderOpen      },
  PatientOrdonnances:  { key: 'mes_ordonnances',   icone: FileText        },
  PatientFactures:     { key: 'mes_factures',      icone: Receipt         },
  PatientTeleconsult:  { key: 'teleconsultation',  icone: Video           },
  PatientParametres:   { key: 'parametres',        icone: Settings        },

  MedecinDashboard:    { key: 'tableau_bord',      icone: LayoutDashboard },
  MedecinFileAttente:  { key: 'file_attente',      icone: Activity        },
  MedecinConsultation: { key: 'consultations',     icone: Stethoscope     },
  MedecinDossiers:     { key: 'dossiers_patients', icone: FolderOpen      },
  MedecinTeleconsult:  { key: 'teleconsultation',  icone: Video           },
  MedecinParametres:   { key: 'parametres',        icone: Settings        },

  RecepDashboard:      { key: 'tableau_bord',      icone: LayoutDashboard },
  RecepRdv:            { key: 'rdv',               icone: Calendar        },
  RecepFileAttente:    { key: 'file_attente',      icone: Activity        },
  RecepLits:           { key: 'gestion_lits',      icone: BedDouble       },
  RecepPatients:       { key: 'patients',          icone: Users           },
  RecepFactures:       { key: 'facturation',       icone: Receipt         },

  PharmaDashboard:     { key: 'tableau_bord',      icone: LayoutDashboard },
  PharmaOrdonnances:   { key: 'ordonnances',       icone: FileText        },
  PharmaStock:         { key: 'stock',             icone: FlaskRound      },
  PharmaLivraisons:    { key: 'livraisons',        icone: Truck           },

  AdminDashboard:      { key: 'tableau_bord',      icone: LayoutDashboard },
  AdminUtilisateurs:   { key: 'utilisateurs',      icone: Users           },
  AdminMedecins:       { key: 'medecins',          icone: Stethoscope     },
  AdminActualites:     { key: 'actualites',        icone: Newspaper       },
  AdminStats:          { key: 'statistiques',      icone: BarChart3       },
  AdminParametres:     { key: 'parametres_sys',    icone: Settings        },
}

const titreMeta = computed(() => {
  const meta = TITRES_META[route.name]
  if (!meta) return { label: t('app.name'), icone: null }
  return { label: t('modules.' + meta.key), icone: meta.icone }
})

const utilisateur = computed(() => auth.utilisateur || {})
const nom    = computed(() => utilisateur.value.nom    || '')
const prenom = computed(() => utilisateur.value.prenom || '')

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

function toggleTheme() {
  prefs.setTheme(prefs.theme === 'SOMBRE' ? 'CLAIR' : 'SOMBRE')
}

function toggleLangue() {
  prefs.setLangue(prefs.langue === 'fr' ? 'wo' : 'fr')
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now - d) / 60000)
  if (diff < 1)    return t('notifs.a_linstant')
  if (diff < 60)   return t('notifs.il_y_a_min', { n: diff })
  if (diff < 1440) return t('notifs.il_y_a_h',   { n: Math.floor(diff/60) })
  return d.toLocaleDateString('fr-SN', { day: '2-digit', month: 'short' })
}
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 256px;
  right: 0;
  height: 64px;
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border-bottom: 1px solid rgba(34,197,94,0.1);
  box-shadow: 0 1px 12px rgba(34,197,94,0.06);
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  gap: 1rem;
  z-index: 40;
}
.app-header::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--color-primary), rgba(34,197,94,0.2), transparent);
  pointer-events: none;
}
.hamburger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: .25rem;
  flex-shrink: 0;
}

/* Toggle langue */
.langue-toggle {
  display: flex;
  align-items: center;
  gap: 0;
  border-radius: .5rem;
  overflow: hidden;
  border: 1.5px solid #E2E8F0;
  cursor: pointer;
  flex-shrink: 0;
  height: 36px;
  background: var(--color-bg);
  transition: border-color .18s;
}
.langue-toggle:hover { border-color: var(--color-primary); }
.langue-actuelle, .langue-autre {
  padding: 0 .55rem;
  font-size: .72rem;
  font-weight: 700;
  line-height: 36px;
  letter-spacing: .04em;
  transition: all .18s;
}
.langue-actuelle {
  background: var(--color-primary);
  color: white;
}
.langue-autre {
  color: var(--color-text-muted);
}
.header-titre {
  display: flex;
  align-items: center;
  gap: .5rem;
  flex: 1;
  min-width: 0;
}
.header-h1 {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: .5rem;
  flex-shrink: 0;
}
.header-btn {
  width: 38px; height: 38px;
  border-radius: .625rem;
  border: 1px solid transparent;
  background: var(--color-bg);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .2s cubic-bezier(.4,0,.2,1);
  position: relative;
}
.header-btn:hover {
  background: rgba(34,197,94,0.07);
  border-color: rgba(34,197,94,0.15);
  color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(34,197,94,0.1);
}

/* Notifications */
.notif-wrap { position: relative; }
.notif-count {
  position: absolute;
  top: -4px; right: -4px;
  background: var(--color-danger);
  color: white;
  border-radius: 9999px;
  font-size: .6rem;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  border: 2px solid white;
}
.notif-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 340px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  overflow: hidden;
  z-index: 200;
}
.notif-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .875rem 1rem;
  border-bottom: 1px solid #F1F5F9;
}
.notif-panel-title {
  font-size: .875rem;
  font-weight: 700;
  color: var(--color-text);
}
.notif-tout-lire {
  font-size: .75rem;
  font-weight: 600;
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
}
.notif-list { max-height: 360px; overflow-y: auto; }
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  padding: .875rem 1rem;
  border-bottom: 1px solid #F8FAFC;
  cursor: pointer;
  transition: background .15s;
}
.notif-item:hover { background: #F8FAFC; }
.notif-item-nonlue { background: rgba(34,197,94,0.04); }
.notif-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
  margin-top: 4px;
}
.notif-content { flex: 1; min-width: 0; }
.notif-titre {
  font-size: .82rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: .2rem;
}
.notif-msg {
  font-size: .78rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notif-date { font-size: .7rem; color: #94A3B8; margin-top: .25rem; }
.notif-vide {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .5rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: .85rem;
}

/* User pill */
.user-pill {
  display: flex;
  align-items: center;
  gap: .625rem;
  padding: .375rem .875rem .375rem .5rem;
  background: rgba(34,197,94,0.05);
  border-radius: 9999px;
  border: 1.5px solid rgba(34,197,94,0.15);
  cursor: default;
  transition: all .2s ease;
}
.user-pill:hover {
  background: rgba(34,197,94,0.1);
  border-color: rgba(34,197,94,0.3);
}
.user-avatar {
  width: 30px; height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(255,255,255,0.8);
  overflow: hidden;
}
.user-avatar-img {
  width: 100%; height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.user-info { display: flex; flex-direction: column; line-height: 1.2; }
.user-name { font-size: .78rem; font-weight: 700; color: var(--color-text); }
.user-role { font-size: .67rem; color: var(--color-primary); font-weight: 600; }

/* Dropdown transition */
.dropdown-enter-active, .dropdown-leave-active { transition: all .2s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }

@media (max-width: 1023px) {
  .app-header { left: 0; }
  .hamburger  { display: flex; }
  .user-info  { display: none; }
  .user-pill  { padding: .375rem; border-radius: 50%; }
}
</style>
