import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth.js'
import { useSocket } from '../composables/useSocket.js'

const API = import.meta.env.VITE_API_URL

export const useNotificationsStore = defineStore('notifications', () => {
  const items  = ref([])
  const toasts = ref([])

  const nonLues = computed(() => items.value.filter(n => !n.lu).length)

  async function charger() {
    const auth = useAuthStore()
    if (!auth.estConnecte) return
    try {
      const res = await fetch(`${API}/notifications`, { headers: auth.entetes() })
      if (res.ok) items.value = await res.json()
    } catch { /* silencieux */ }
  }

  async function marquerLue(id) {
    const n = items.value.find(n => n.id === id)
    if (n) n.lu = true
    const auth = useAuthStore()
    try {
      await fetch(`${API}/notifications/${id}/lire`, { method: 'PUT', headers: auth.entetes() })
    } catch { /* silencieux */ }
  }

  async function marquerToutesLues() {
    items.value.forEach(n => { n.lu = true })
    const auth = useAuthStore()
    try {
      await fetch(`${API}/notifications/lire-toutes`, { method: 'PUT', headers: auth.entetes() })
    } catch { /* silencieux */ }
  }

  function ajouterTemporaire(notif) {
    const item = { id: Date.now(), lu: false, createdAt: new Date().toISOString(), ...notif }
    items.value.unshift(item)
    _afficherToast(item)
  }

  function connecterSocket() {
    const auth = useAuthStore()
    if (!auth.estConnecte) return

    const { connecter } = useSocket()
    const socket = connecter(auth.token, auth.utilisateur.id, auth.utilisateur.role)

    socket.off('notification')
    socket.off('appel_patient')
    socket.off('rdv_update')
    socket.off('facture_payee')

    socket.on('notification', (notif) => {
      if (!items.value.find(i => i.id === notif.id)) {
        items.value.unshift(notif)
      }
      _afficherToast(notif)
    })

    socket.on('appel_patient', (data) => {
      ajouterTemporaire({ titre: 'Vous êtes appelé(e)', message: data.message || 'Le médecin vous appelle.' })
    })

    socket.on('rdv_update', (data) => {
      const STATUTS = { CONFIRME:'Confirmé', ANNULE:'Annulé', TERMINE:'Terminé', EN_ATTENTE:'En attente' }
      ajouterTemporaire({ titre: 'Rendez-vous mis à jour', message: `Statut : ${STATUTS[data.statut] || data.statut}` })
    })

    socket.on('facture_payee', () => {
      ajouterTemporaire({ titre: 'Facture réglée', message: 'Votre facture vient d\'être encaissée.' })
    })
  }

  function deconnecterSocket() {
    const { deconnecter } = useSocket()
    deconnecter()
  }

  function _afficherToast(notif) {
    const id = `toast-${Date.now()}-${Math.random()}`
    toasts.value.push({ ...notif, toastId: id })
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.toastId !== id) }, 4500)
  }

  function retirerToast(toastId) {
    toasts.value = toasts.value.filter(t => t.toastId !== toastId)
  }

  return { items, toasts, nonLues, charger, marquerLue, marquerToutesLues, ajouterTemporaire, connecterSocket, deconnecterSocket, retirerToast }
})
