<template>
  <div class="layout-public">
    <!-- NAVBAR -->
    <header class="navbar" :class="{ 'navbar-scrolled': scrolled }">
      <div class="navbar-inner">
        <!-- Logo -->
        <RouterLink to="/" class="navbar-logo">
          <div class="navbar-logo-icon">
            <img :src="logoFe" alt="Tropical Medical" class="navbar-logo-img" />
          </div>
          <div class="navbar-logo-texts">
            <span class="navbar-logo-text">Tropical Medical</span>
            <span class="navbar-logo-sub">Santé & bien-être</span>
          </div>
        </RouterLink>

        <!-- Spacer -->
        <div style="flex:1"></div>

        <!-- Liens desktop + CTA groupés à droite -->
        <div class="navbar-right">
          <nav class="nav-pill">
            <a href="#services"  class="nav-pill-link" @click.prevent="scrollTo('#services')">{{ t('nav.services') }}</a>
            <a href="#medecins"  class="nav-pill-link" @click.prevent="scrollTo('#medecins')">{{ t('nav.medecins') }}</a>
            <a href="#paiements" class="nav-pill-link" @click.prevent="scrollTo('#paiements')">{{ t('nav.paiements') }}</a>
            <a href="#contact"   class="nav-pill-link" @click.prevent="scrollTo('#contact')">{{ t('nav.contact') }}</a>
          </nav>

          <button class="langue-toggle-pub" @click="toggleLangue" :title="prefs.langue === 'fr' ? 'Wolof' : 'Français'">
            <span class="lt-actuelle">{{ prefs.langue === 'fr' ? 'FR' : 'WO' }}</span>
            <span class="lt-autre">{{ prefs.langue === 'fr' ? 'WO' : 'FR' }}</span>
          </button>
          <RouterLink to="/connexion" class="btn btn-primary btn-sm">
            <LogIn :size="15" />
            {{ t('nav.connexion') }}
          </RouterLink>
        </div>

        <!-- Burger mobile -->
        <button class="burger" @click="menuOuvert = !menuOuvert" aria-label="Menu">
          <Menu v-if="!menuOuvert" :size="22" />
          <X v-else :size="22" />
        </button>
      </div>

      <!-- Menu mobile -->
      <Transition name="slide-down">
        <div v-if="menuOuvert" class="mobile-menu">
          <a href="#services"  class="mobile-link" @click="fermerMenu('#services')">{{ t('nav.services') }}</a>
          <a href="#medecins"  class="mobile-link" @click="fermerMenu('#medecins')">{{ t('nav.medecins') }}</a>
          <a href="#paiements" class="mobile-link" @click="fermerMenu('#paiements')">{{ t('nav.paiements') }}</a>
          <a href="#contact"   class="mobile-link" @click="fermerMenu('#contact')">{{ t('nav.contact') }}</a>
          <div style="display:flex;gap:.75rem;align-items:center;margin-top:.5rem">
            <button class="langue-toggle-pub" @click="toggleLangue">
              <span class="lt-actuelle">{{ prefs.langue === 'fr' ? 'FR' : 'WO' }}</span>
              <span class="lt-autre">{{ prefs.langue === 'fr' ? 'WO' : 'FR' }}</span>
            </button>
            <RouterLink to="/connexion" class="btn btn-primary" style="flex:1;justify-content:center" @click="menuOuvert=false">
              <LogIn :size="15" /> {{ t('nav.connexion') }}
            </RouterLink>
          </div>
        </div>
      </Transition>
    </header>

    <!-- CONTENU -->
    <main>
      <RouterView />
    </main>

    <!-- FOOTER -->
    <footer class="footer" id="contact">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="footer-logo">
            <div class="footer-logo-icon">
              <img :src="logoFe" alt="Tropical Medical" class="footer-logo-img" />
            </div>
            <span>Tropical Medical</span>
          </div>
          <p class="footer-desc">
            Plateforme médicale sénégalaise — consultations, hospitalisation,
            pharmacie et téléconsultation en un seul espace sécurisé.
          </p>
          <div class="footer-contact-items">
            <span><Phone :size="14" /> +221 33 000 00 00</span>
            <span><Mail :size="14" /> contact@tropical.sn</span>
            <span><MapPin :size="14" /> Dakar, Sénégal</span>
          </div>
        </div>

        <div class="footer-links-group">
          <div>
            <div class="footer-links-title">Services</div>
            <ul class="footer-links">
              <li>Consultations</li>
              <li>Téléconsultation</li>
              <li>Pharmacie</li>
              <li>Hospitalisation</li>
              <li>Urgences</li>
            </ul>
          </div>
          <div>
            <div class="footer-links-title">Accès</div>
            <ul class="footer-links">
              <li><RouterLink to="/connexion">Connexion</RouterLink></li>
              <li>Patient</li>
              <li>Médecin</li>
              <li>Réceptionniste</li>
              <li>Pharmacien</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>&copy; 2025 Tropical Medical. Tous droits réservés.</span>
        <span>Conçu au Sénégal</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { LogIn, Menu, X, Phone, Mail, MapPin } from 'lucide-vue-next'
import { usePreferencesStore } from '../stores/preferences.js'
import logoFe from '../../image medicale/fe.png'

const { t } = useI18n()
const prefs = usePreferencesStore()

const scrolled = ref(false)
const menuOuvert = ref(false)

function toggleLangue() {
  prefs.setLangue(prefs.langue === 'fr' ? 'wo' : 'fr')
}

function onScroll() {
  scrolled.value = window.scrollY > 60
}

function scrollTo(hash) {
  menuOuvert.value = false
  const el = document.querySelector(hash)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function fermerMenu(hash) {
  setTimeout(() => scrollTo(hash), 200)
  menuOuvert.value = false
}

onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.layout-public { display: flex; flex-direction: column; min-height: 100vh; }

/* ── NAVBAR ── */
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  transition: all 0.35s cubic-bezier(.4,0,.2,1);
  padding: 0 1.5rem;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border-bottom: 1px solid rgba(14,159,142,0.1);
}
.navbar::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(14,159,142,.4), transparent);
  opacity: 0;
  transition: opacity .35s ease;
}
.navbar-scrolled {
  background: linear-gradient(135deg, #0a7a6d 0%, #0e9f8e 100%);
  border-bottom: 1px solid rgba(255,255,255,0.15);
  box-shadow: 0 4px 32px rgba(10,122,109,0.25);
}
.navbar-scrolled::after { opacity: 0; }
.navbar-scrolled .navbar-logo-text { color: white; }
.navbar-scrolled .navbar-logo-sub  { color: rgba(255,255,255,0.7); }
.navbar-scrolled .nav-link { color: rgba(255,255,255,0.85); }
.navbar-scrolled .nav-link:hover { color: white; }
.navbar-scrolled .nav-link::after { background: white; }
.navbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 2rem;
  height: 72px;
}

/* Logo */
.navbar-logo {
  display: flex;
  align-items: center;
  gap: .75rem;
  text-decoration: none;
  flex-shrink: 0;
  transition: transform .2s ease;
}
.navbar-logo:hover { transform: scale(1.03); }
.navbar-logo-icon {
  width: 42px; height: 42px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(14,159,142,0.2);
  box-shadow: 0 4px 14px rgba(14,159,142,0.2);
  flex-shrink: 0;
  transition: box-shadow .25s ease;
}
.navbar-logo:hover .navbar-logo-icon {
  box-shadow: 0 6px 20px rgba(14,159,142,0.35);
}
.navbar-logo-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.navbar-logo-texts { display: flex; flex-direction: column; gap: 1px; }
.navbar-logo-text {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.1;
  letter-spacing: -.02em;
}
.navbar-logo-sub {
  font-size: .62rem;
  font-weight: 600;
  color: var(--color-primary);
  letter-spacing: .06em;
  text-transform: uppercase;
}

/* Droite navbar */
.navbar-right {
  display: flex;
  align-items: center;
  gap: .75rem;
  flex-shrink: 0;
}

/* Pilule de navigation */
.nav-pill {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(12px);
  border: 1.5px solid rgba(14,159,142,0.15);
  border-radius: 9999px;
  padding: .25rem;
  gap: .125rem;
  box-shadow: 0 2px 12px rgba(14,159,142,0.08), inset 0 1px 0 rgba(255,255,255,0.8);
  transition: all .3s ease;
}
.navbar-scrolled .nav-pill {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.25);
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
.nav-pill-link {
  font-size: .8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-decoration: none;
  padding: .45rem .9rem;
  border-radius: 9999px;
  transition: all .22s cubic-bezier(.4,0,.2,1);
  cursor: pointer;
  white-space: nowrap;
  letter-spacing: .01em;
}
.nav-pill-link:hover {
  background: rgba(14,159,142,0.1);
  color: var(--color-primary);
}
.navbar-scrolled .nav-pill-link { color: rgba(255,255,255,0.8); }
.navbar-scrolled .nav-pill-link:hover {
  background: rgba(255,255,255,0.2);
  color: white;
}

/* Toggle langue public */
.langue-toggle-pub {
  display: flex;
  align-items: center;
  border-radius: .5rem;
  overflow: hidden;
  border: 1.5px solid rgba(255,255,255,0.35);
  cursor: pointer;
  height: 32px;
  background: transparent;
  transition: border-color .18s;
  flex-shrink: 0;
}
.navbar-scrolled .langue-toggle-pub { border-color: #E2E8F0; }
.langue-toggle-pub:hover { border-color: var(--color-primary); }
.lt-actuelle, .lt-autre {
  padding: 0 .5rem;
  font-size: .7rem;
  font-weight: 700;
  line-height: 32px;
  letter-spacing: .04em;
}
.lt-actuelle {
  background: var(--color-primary);
  color: white;
}
.lt-autre { color: rgba(255,255,255,0.8); }
.navbar-scrolled .lt-autre { color: var(--color-text-muted); }
.burger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text);
  margin-left: auto;
  padding: .25rem;
}

/* Menu mobile */
.mobile-menu {
  display: flex;
  flex-direction: column;
  gap: .25rem;
  padding: 1rem 0 1.25rem;
  background: white;
  border-top: 1px solid #E2E8F0;
}
.mobile-link {
  padding: .625rem 0;
  font-size: .9rem;
  font-weight: 500;
  color: var(--color-text);
  text-decoration: none;
  cursor: pointer;
  border-bottom: 1px solid #F1F5F9;
}
.slide-down-enter-active, .slide-down-leave-active { transition: all .25s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

/* ── FOOTER ── */
.footer {
  background: linear-gradient(135deg, #0a7a6d 0%, #0e9f8e 100%);
  color: rgba(255,255,255,0.85);
  padding: 3.5rem 1.5rem 1.5rem;
  margin-top: auto;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 3rem;
}
.footer-logo {
  display: flex;
  align-items: center;
  gap: .75rem;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
}
.footer-logo-icon {
  width: 38px; height: 38px;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.3);
  flex-shrink: 0;
}
.footer-logo-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.footer-desc {
  font-size: .85rem;
  line-height: 1.7;
  color: rgba(255,255,255,0.75);
  max-width: 360px;
  margin-bottom: 1.25rem;
}
.footer-contact-items {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  font-size: .8rem;
  color: rgba(255,255,255,0.75);
}
.footer-contact-items span {
  display: flex;
  align-items: center;
  gap: .5rem;
}
.footer-links-group {
  display: flex;
  gap: 3rem;
}
.footer-links-title {
  font-size: .75rem;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-bottom: 1rem;
}
.footer-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: .625rem;
  font-size: .85rem;
  color: rgba(255,255,255,0.75);
}
.footer-links a { color: rgba(255,255,255,0.75); text-decoration: none; }
.footer-links a:hover { color: white; }
.footer-bottom {
  max-width: 1200px;
  margin: 2.5rem auto 0;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255,255,255,0.15);
  display: flex;
  justify-content: space-between;
  font-size: .75rem;
  color: rgba(255,255,255,0.6);
}

@media (max-width: 768px) {
  .navbar-right { display: none; }
  .burger { display: flex; }
  .footer-inner { grid-template-columns: 1fr; gap: 2rem; }
  .footer-links-group { gap: 2rem; }
  .footer-bottom { flex-direction: column; gap: .5rem; }
}
</style>
