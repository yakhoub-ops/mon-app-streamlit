<template>
  <div class="salle-wrap">

    <!-- Barre supérieure -->
    <div class="salle-bar">
      <div class="salle-bar-gauche">
        <div class="salle-logo">
          <div class="logo-pt"></div>
          <span>Tropical Medical</span>
        </div>
        <div class="salle-info">
          <div class="salle-nom-room">Salle : {{ route.params.roomId }}</div>
          <div class="salle-statut">
            <span class="dot-live"></span>
            {{ chargement ? 'Connexion…' : 'En cours' }}
          </div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:.75rem">
        <div class="chrono">{{ chrono }}</div>
        <button class="btn-quitter" @click="quitter">
          <PhoneOff :size="16" />
          Quitter la consultation
        </button>
      </div>
    </div>

    <!-- Iframe Jitsi -->
    <div class="jitsi-wrap" :class="{ flou: chargement }">
      <div v-if="chargement" class="chargement-overlay">
        <div class="spinner"></div>
        <p>Connexion à la salle de consultation…</p>
      </div>
      <iframe
        ref="iframeRef"
        :src="jitsiUrl"
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        style="width:100%;height:100%;border:none"
        @load="chargement = false"
      ></iframe>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhoneOff } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth.js'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const chargement = ref(true)
const iframeRef  = ref(null)
const secondes   = ref(0)
let   timerHandle = null

const jitsiUrl = computed(() => {
  const roomId   = route.params.roomId
  const user     = auth.utilisateur
  const userName = user ? encodeURIComponent(`${user.prenom} ${user.nom}`) : 'Utilisateur'
  return `https://meet.jit.si/${roomId}#userInfo.displayName="${userName}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false`
})

const chrono = computed(() => {
  const m = Math.floor(secondes.value / 60).toString().padStart(2, '0')
  const s = (secondes.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

function quitter() {
  const user = auth.utilisateur
  const route_retour = user?.role === 'MEDECIN' ? '/medecin/teleconsultation'
    : user?.role === 'PATIENT' ? '/patient/teleconsultation'
    : '/'
  router.push(route_retour)
}

onMounted(() => {
  timerHandle = setInterval(() => { secondes.value++ }, 1000)
})

onUnmounted(() => {
  if (timerHandle) clearInterval(timerHandle)
})
</script>

<style scoped>
.salle-wrap {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: #0F172A;
  display: flex;
  flex-direction: column;
}
.salle-bar {
  height: 52px;
  background: rgba(15,23,42,0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
  gap: 1rem;
}
.salle-bar-gauche {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.salle-logo {
  display: flex;
  align-items: center;
  gap: .5rem;
  font-weight: 700;
  font-size: .9rem;
  color: white;
}
.logo-pt {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
}
.salle-info { border-left: 1px solid rgba(255,255,255,0.12); padding-left: 1rem; }
.salle-nom-room { font-size: .72rem; color: rgba(255,255,255,0.5); font-family: monospace; }
.salle-statut {
  display: flex;
  align-items: center;
  gap: .35rem;
  font-size: .76rem;
  font-weight: 600;
  color: #22C55E;
  margin-top: .1rem;
}
.dot-live {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #22C55E;
  animation: pulseLive 1.5s ease-in-out infinite;
}
@keyframes pulseLive { 0%,100%{opacity:1} 50%{opacity:.3} }
.chrono {
  font-family: monospace;
  font-size: .9rem;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
  letter-spacing: .05em;
}
.btn-quitter {
  display: flex;
  align-items: center;
  gap: .5rem;
  background: var(--color-danger);
  color: white;
  border: none;
  border-radius: .625rem;
  padding: .45rem 1rem;
  font-size: .82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .18s;
}
.btn-quitter:hover { background: #B91C1C; }
.jitsi-wrap {
  flex: 1;
  position: relative;
  overflow: hidden;
  transition: filter .3s;
}
.jitsi-wrap.flou { filter: blur(4px); }
.chargement-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: rgba(15,23,42,0.7);
  color: rgba(255,255,255,0.8);
  font-size: .9rem;
}
.spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
