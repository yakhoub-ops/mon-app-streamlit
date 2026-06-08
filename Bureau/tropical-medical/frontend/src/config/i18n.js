import { createI18n } from 'vue-i18n'
import fr from '../locales/fr.json'
import wo from '../locales/wo.json'

export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('tm_langue') || 'fr',
  fallbackLocale: 'fr',
  messages: { fr, wo },
})
