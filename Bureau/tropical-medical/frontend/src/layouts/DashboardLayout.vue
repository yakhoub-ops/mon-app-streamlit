<template>
  <div class="dashboard-layout">
    <AppSidebar :menus="menus" :ouvert="sidebarOuvert" @fermer="sidebarOuvert = false" />

    <div class="dashboard-main" :class="{ 'sidebar-collapsed': !sidebarOuvert && mobile }">
      <AppHeader @toggleSidebar="sidebarOuvert = !sidebarOuvert" />

      <div class="dashboard-content">
        <RouterView />
      </div>
    </div>

    <NotifToast />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppSidebar from '../components/layout/AppSidebar.vue'
import AppHeader  from '../components/layout/AppHeader.vue'
import NotifToast from '../components/NotifToast.vue'
import { useNotificationsStore } from '../stores/notifications.js'
import { useMessagerieStore }    from '../stores/messagerie.js'

defineProps({
  menus: { type: Array, required: true },
})

const notifs        = useNotificationsStore()
const msgStore      = useMessagerieStore()
const sidebarOuvert = ref(true)
const mobile        = ref(false)

function checkMobile() {
  mobile.value = window.innerWidth < 1024
  sidebarOuvert.value = !mobile.value
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  notifs.connecterSocket()
  notifs.charger()
  msgStore.demarrer()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  notifs.deconnecterSocket()
  msgStore.arreter()
})
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}
.dashboard-main {
  flex: 1;
  margin-left: 256px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left .25s ease;
}
.dashboard-content {
  padding: calc(60px + 1.5rem) 1.5rem 1.5rem;
  flex: 1;
}

@media (max-width: 1023px) {
  .dashboard-main { margin-left: 0; }
}
</style>
