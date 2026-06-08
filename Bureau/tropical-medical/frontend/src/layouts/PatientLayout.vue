<template>
  <DashboardLayout :menus="menus" />
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  LayoutDashboard, Calendar, FolderOpen,
  FileText, Receipt, Video, Settings, Newspaper, MessageCircle,
} from 'lucide-vue-next'
import DashboardLayout from './DashboardLayout.vue'
import { useMessagerieStore } from '../stores/messagerie.js'

const { t }    = useI18n()
const msgStore = useMessagerieStore()

const menus = computed(() => [
  { label: t('modules.tableau_bord'),    route: '/patient/tableau-bord',     icone: LayoutDashboard, exact: true },
  { label: t('modules.mes_rdv'),         route: '/patient/rdv',              icone: Calendar      },
  { label: t('modules.mon_dossier'),     route: '/patient/dossier',          icone: FolderOpen    },
  { label: t('modules.mes_ordonnances'), route: '/patient/ordonnances',      icone: FileText      },
  { label: t('modules.mes_factures'),    route: '/patient/factures',         icone: Receipt       },
  { label: t('modules.teleconsultation'),route: '/patient/teleconsultation', icone: Video         },
  { label: 'Actualités santé',           route: '/patient/actualites',       icone: Newspaper     },
  { label: 'Messagerie',                 route: '/patient/messagerie',       icone: MessageCircle, badge: msgStore.nonLus || null },
  { label: t('modules.parametres'),      route: '/patient/parametres',       icone: Settings      },
])
</script>
