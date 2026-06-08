import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '../composables/useApi.js'

export const useMessagerieStore = defineStore('messagerie', () => {
  const nonLus = ref(0)
  let intervalle = null

  async function charger() {
    try {
      const api = useApi()
      const res = await api.get('/messagerie/non-lus')
      nonLus.value = res.count ?? 0
    } catch {}
  }

  function demarrer() {
    charger()
    intervalle = setInterval(charger, 15000)
  }

  function arreter() {
    clearInterval(intervalle)
    intervalle = null
  }

  function reset() {
    nonLus.value = 0
  }

  return { nonLus, charger, demarrer, arreter, reset }
})
