<template>
  <DashboardLayout :menus="menus" />
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  LayoutDashboard, Users, Stethoscope,
  Newspaper, BarChart3, Settings,
} from 'lucide-vue-next'
import DashboardLayout from './DashboardLayout.vue'

const { t } = useI18n()

const menus = computed(() => [
  { label: t('modules.tableau_bord'),  route: '/admin/tableau-bord',  icone: LayoutDashboard, exact: true },
  { label: t('modules.utilisateurs'),  route: '/admin/utilisateurs',  icone: Users        },
  { label: t('modules.medecins'),      route: '/admin/medecins',      icone: Stethoscope  },
  { label: t('modules.actualites'),    route: '/admin/actualites',    icone: Newspaper    },
  { label: t('modules.statistiques'),  route: '/admin/statistiques',  icone: BarChart3    },
  { label: t('modules.parametres_sys'),route: '/admin/parametres',    icone: Settings     },
])
</script>
