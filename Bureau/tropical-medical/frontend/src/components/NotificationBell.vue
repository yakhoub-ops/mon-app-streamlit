<script setup>
import { ref } from 'vue';
import { useNotifStore } from '../stores/notifications';

const store = useNotifStore();
const open = ref(false);

const toggle = async () => {
  open.value = !open.value;
  if (open.value) await store.fetchAll();
};

const typeIcon = (type) => ({ rdv: '📅', urgence: '🚨', ordonnance: '💊', stock: '📦', facture: '🧾', systeme: '🔔' }[type] || '🔔');
</script>

<template>
  <div class="relative">
    <button @click="toggle" class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
      <span class="text-xl">🔔</span>
      <span v-if="store.unread > 0" class="absolute -top-0.5 -right-0.5 w-5 h-5 text-xs flex items-center justify-center rounded-full text-white font-bold" style="background:#07f113">
        {{ store.unread > 9 ? '9+' : store.unread }}
      </span>
    </button>

    <transition name="fade">
      <div v-if="open" class="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span class="font-semibold text-sm text-gray-900">Notifications</span>
          <button @click="store.markAllRead()" class="text-xs text-green-600 hover:underline">Tout lire</button>
        </div>
        <div class="max-h-72 overflow-y-auto">
          <div v-if="store.notifs.length === 0" class="py-8 text-center text-gray-400 text-sm">Aucune notification</div>
          <div
            v-for="n in store.notifs"
            :key="n.id_notification"
            @click="store.markRead(n.id_notification)"
            class="flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
            :class="!n.lu ? 'bg-green-50' : ''"
          >
            <span class="text-lg flex-shrink-0">{{ typeIcon(n.type) }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-800 leading-snug">{{ n.message }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ new Date(n.created_at).toLocaleString('fr') }}</p>
            </div>
            <div v-if="!n.lu" class="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5"></div>
          </div>
        </div>
      </div>
    </transition>

    <div v-if="open" @click="open = false" class="fixed inset-0 z-40"></div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
