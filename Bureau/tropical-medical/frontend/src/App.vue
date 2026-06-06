<script setup>
import { onMounted } from 'vue';
import { useNotifStore } from './stores/notifications';
import { useAuthStore } from './stores/auth';

const auth = useAuthStore();
const notifStore = useNotifStore();

onMounted(() => {
  if (auth.isLoggedIn) {
    notifStore.listenSocket();
    notifStore.fetchUnread();
  }
});
</script>

<template>
  <router-view />
</template>
