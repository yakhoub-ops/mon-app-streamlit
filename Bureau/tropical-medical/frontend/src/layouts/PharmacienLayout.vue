<template>
  <DashboardLayout :menus="menus" />
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  LayoutDashboard, FileText, FlaskConical, Truck,
} from 'lucide-vue-next'
import DashboardLayout from './DashboardLayout.vue'

const { t } = useI18n()

const menus = computed(() => [
  { label: t('modules.tableau_bord'),  route: '/pharmacien/tableau-bord', icone: LayoutDashboard, exact: true },
  { label: t('modules.ordonnances'),   route: '/pharmacien/ordonnances',  icone: FileText     },
  { label: t('modules.stock'),         route: '/pharmacien/stock',        icone: FlaskConical },
  { label: t('modules.livraisons'),    route: '/pharmacien/livraisons',   icone: Truck        },
])
</script>
