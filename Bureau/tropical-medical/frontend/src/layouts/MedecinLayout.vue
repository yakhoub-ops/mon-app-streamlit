<template>
  <DashboardLayout :menus="menus" />
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  LayoutDashboard, Activity, FolderOpen, Video, Settings,
  Calendar, Stethoscope, Pill, AlertTriangle, MessageCircle,
} from 'lucide-vue-next'
import DashboardLayout from './DashboardLayout.vue'
import { useMessagerieStore } from '../stores/messagerie.js'

const { t }    = useI18n()
const msgStore = useMessagerieStore()

const menus = computed(() => [
  { label: t('modules.tableau_bord'),     route: '/medecin/tableau-bord',      icone: LayoutDashboard, exact: true },
  { label: t('modules.file_attente'),     route: '/medecin/file-attente',      icone: Activity      },
  { label: 'Urgences',                    route: '/medecin/urgences',          icone: AlertTriangle },
  { label: 'Mon agenda',                  route: '/medecin/agenda',            icone: Calendar      },
  { label: 'Consultations',               route: '/medecin/consultations',     icone: Stethoscope   },
  { label: 'Ordonnances',                 route: '/medecin/ordonnances',       icone: Pill          },
  { label: t('modules.dossiers_patients'),route: '/medecin/dossiers',          icone: FolderOpen    },
  { label: t('modules.teleconsultation'), route: '/medecin/teleconsultation',  icone: Video         },
  { label: 'Messagerie',                  route: '/medecin/messagerie',        icone: MessageCircle, badge: msgStore.nonLus || null },
  { label: t('modules.parametres'),       route: '/medecin/parametres',        icone: Settings      },
])
</script>
