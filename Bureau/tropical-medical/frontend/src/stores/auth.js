import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API = import.meta.env.VITE_API_URL

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('tm_token') || null)
  const utilisateur = ref(JSON.parse(localStorage.getItem('tm_user') || 'null'))

  const estConnecte = computed(() => !!token.value && !!utilisateur.value)

  const routeParDefaut = computed(() => {
    if (!utilisateur.value) return '/'
    const map = {
      PATIENT: '/patient',
      MEDECIN: '/medecin',
      RECEPTIONNISTE: '/receptionniste',
      PHARMACIEN: '/pharmacien',
      ADMIN: '/admin',
    }
    return map[utilisateur.value.role] || '/'
  })

  async function connexion(email, motDePasse) {
    const res = await fetch(`${API}/auth/connexion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, mot_de_passe: motDePasse }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Identifiants incorrects')
    }

    const data = await res.json()
    token.value = data.token
    utilisateur.value = data.utilisateur

    localStorage.setItem('tm_token', data.token)
    localStorage.setItem('tm_user', JSON.stringify(data.utilisateur))

    return data
  }

  function updateAvatar(avatar) {
    if (!utilisateur.value) return
    utilisateur.value = { ...utilisateur.value, avatar }
    localStorage.setItem('tm_user', JSON.stringify(utilisateur.value))
  }

  function deconnexion() {
    token.value = null
    utilisateur.value = null
    localStorage.removeItem('tm_token')
    localStorage.removeItem('tm_user')
  }

  function entetes() {
    return { Authorization: `Bearer ${token.value}` }
  }

  return { token, utilisateur, estConnecte, routeParDefaut, connexion, deconnexion, entetes, updateAvatar }
})
