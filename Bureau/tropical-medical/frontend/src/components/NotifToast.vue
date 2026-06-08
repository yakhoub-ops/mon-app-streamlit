<template>
  <Teleport to="body">
    <div class="toast-conteneur">
      <TransitionGroup name="toast" tag="div">
        <div v-for="t in notifs.toasts" :key="t.toastId" class="toast-item">
          <div class="toast-icone"><Bell :size="16" /></div>
          <div class="toast-corps">
            <div class="toast-titre">{{ t.titre }}</div>
            <div class="toast-msg">{{ t.message }}</div>
          </div>
          <button class="toast-close" @click="notifs.retirerToast(t.toastId)">
            <X :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { Bell, X } from 'lucide-vue-next'
import { useNotificationsStore } from '../stores/notifications.js'
const notifs = useNotificationsStore()
</script>

<style scoped>
.toast-conteneur {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9000;
  display: flex;
  flex-direction: column;
  gap: .625rem;
  pointer-events: none;
}
.toast-item {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  background: white;
  border: 1.5px solid var(--color-primary);
  border-left: 4px solid var(--color-primary);
  border-radius: .875rem;
  padding: .875rem 1rem;
  box-shadow: 0 8px 28px rgba(14,159,142,0.18);
  max-width: 340px;
  pointer-events: auto;
  cursor: default;
}
.toast-icone {
  width: 30px; height: 30px;
  border-radius: .5rem;
  background: rgba(14,159,142,0.1);
  color: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.toast-corps  { flex: 1; min-width: 0; }
.toast-titre  { font-size: .82rem; font-weight: 700; color: var(--color-text); margin-bottom: .2rem; }
.toast-msg    { font-size: .76rem; color: var(--color-text-muted); line-height: 1.45; }
.toast-close  {
  background: none; border: none; cursor: pointer;
  color: var(--color-text-muted); display: flex;
  flex-shrink: 0; padding: 2px;
}
.toast-close:hover { color: var(--color-danger); }

.toast-enter-active { transition: all .3s cubic-bezier(.22,1,.36,1); }
.toast-leave-active { transition: all .25s ease; }
.toast-enter-from   { opacity: 0; transform: translateY(20px) scale(.95); }
.toast-leave-to     { opacity: 0; transform: translateX(20px); }
.toast-move         { transition: transform .3s ease; }
</style>
