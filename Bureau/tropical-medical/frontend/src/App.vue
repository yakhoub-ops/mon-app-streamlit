<template>
  <!-- Aurora background -->
  <div class="aurora" aria-hidden="true">
    <div class="aurora-orb aurora-orb-1" />
    <div class="aurora-orb aurora-orb-2" />
    <div class="aurora-orb aurora-orb-3" />
  </div>

  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="$route.name" />
    </Transition>
  </RouterView>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePreferencesStore } from './stores/preferences.js'

const prefs = usePreferencesStore()
const $route = useRoute()

onMounted(() => {
  prefs.appliquerTheme()
})
</script>

<style>
.page-enter-active {
  transition: opacity .22s ease, transform .24s ease;
}
.page-leave-active {
  transition: opacity .18s ease, transform .18s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
