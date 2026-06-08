import { defineStore } from 'pinia'
import { ref } from 'vue'
import { i18n } from '../config/i18n.js'

export const usePreferencesStore = defineStore('preferences', () => {
  const theme      = ref(localStorage.getItem('tm_theme')  || 'CLAIR')
  const langue     = ref(localStorage.getItem('tm_langue') || 'fr')
  const rappelRdv  = ref(localStorage.getItem('tm_rappel_rdv') !== 'false')

  function appliquerTheme() {
    const html = document.documentElement
    if (theme.value === 'SOMBRE') {
      html.classList.add('dark')
    } else if (theme.value === 'AUTO') {
      html.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
    } else {
      html.classList.remove('dark')
    }
  }

  function setTheme(val) {
    theme.value = val
    localStorage.setItem('tm_theme', val)
    appliquerTheme()
  }

  function setLangue(val) {
    langue.value = val
    localStorage.setItem('tm_langue', val)
    i18n.global.locale.value = val
  }

  function setRappelRdv(val) {
    rappelRdv.value = val
    localStorage.setItem('tm_rappel_rdv', val ? 'true' : 'false')
  }

  appliquerTheme()

  return { theme, langue, rappelRdv, appliquerTheme, setTheme, setLangue, setRappelRdv }
})
