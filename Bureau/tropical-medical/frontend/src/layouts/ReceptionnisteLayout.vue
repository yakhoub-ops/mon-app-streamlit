<template>
  <DashboardLayout :menus="menus" />
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  LayoutDashboard, Calendar, Activity,
  BedDouble, Users, Receipt, Newspaper, MessageCircle,
} from 'lucide-vue-next'
import DashboardLayout from './DashboardLayout.vue'
import { useMessagerieStore } from '../stores/messagerie.js'

const { t }    = useI18n()
const msgStore = useMessagerieStore()

const menus = computed(() => [
  { label: t('modules.tableau_bord'),  route: '/receptionniste/tableau-bord', icone: LayoutDashboard, exact: true },
  { label: t('modules.rdv'),           route: '/receptionniste/rdv',          icone: Calendar      },
  { label: t('modules.file_attente'),  route: '/receptionniste/file-attente', icone: Activity      },
  { label: t('modules.gestion_lits'),  route: '/receptionniste/lits',         icone: BedDouble     },
  { label: t('modules.patients'),      route: '/receptionniste/patients',     icone: Users         },
  { label: t('modules.facturation'),   route: '/receptionniste/factures',     icone: Receipt       },
  { label: 'Actualités',               route: '/receptionniste/actualites',   icone: Newspaper     },
  { label: 'Messagerie',               route: '/receptionniste/messagerie',   icone: MessageCircle, badge: msgStore.nonLus || null },
])
</script>
