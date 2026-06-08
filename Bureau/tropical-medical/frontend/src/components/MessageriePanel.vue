<template>
  <div class="msg-layout">

    <!-- ══ COLONNE GAUCHE : contacts / conversations ══ -->
    <div class="msg-sidebar" :class="{ 'sidebar-hidden': contactActif && isMobile }">
      <div class="sb-header">
        <h2 class="sb-titre"><MessageCircle :size="17" /> Messagerie</h2>
        <button class="btn-new" title="Nouveau message" @click="ouvrirNouveauContact"><Plus :size="16" /></button>
      </div>

      <!-- Recherche -->
      <div class="sb-search">
        <Search :size="14" class="sb-search-ic" />
        <input v-model="recherche" type="search" placeholder="Rechercher…" class="sb-input" />
      </div>

      <!-- Chargement -->
      <div v-if="chargementConvs" class="skel-list">
        <div class="skel-conv" v-for="i in 4" :key="i"></div>
      </div>

      <!-- Liste conversations -->
      <div v-else class="convs-list">
        <div v-if="!convsFiltrees.length" class="convs-vide">
          <MessageCircle :size="32" style="opacity:.2" />
          <span>Aucune conversation</span>
        </div>
        <div v-for="c in convsFiltrees" :key="c.utilisateur.id"
          class="conv-item" :class="{ active: contactActif?.id === c.utilisateur.id }"
          @click="ouvrirConversation(c.utilisateur)">
          <div class="conv-avatar" :class="roleCls(c.utilisateur.role)">
            {{ initiales(c.utilisateur) }}
          </div>
          <div class="conv-info">
            <div class="conv-name">{{ c.utilisateur.prenom }} {{ c.utilisateur.nom }}</div>
            <div class="conv-role">{{ roleLabel(c.utilisateur.role) }}</div>
            <div class="conv-last" v-if="c.dernierMessage">{{ tronquer(c.dernierMessage.message, 38) }}</div>
          </div>
          <div class="conv-right">
            <span v-if="c.nonLus > 0" class="conv-badge">{{ c.nonLus }}</span>
            <span class="conv-time" v-if="c.dernierMessage">{{ fmtHeure(c.dernierMessage.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Modal nouveau contact -->
      <Teleport to="body">
        <Transition name="modal-fade">
          <div v-if="modalContacts" class="modal-overlay" @click.self="modalContacts=false">
            <div class="modal-contacts">
              <div class="mc-header">
                <span style="font-weight:700;font-size:.95rem">Nouveau message</span>
                <button class="mc-close" @click="modalContacts=false"><X :size="18" /></button>
              </div>
              <div class="mc-search">
                <Search :size="13" class="mc-ic" />
                <input v-model="rechercheContact" type="search" placeholder="Nom, rôle…" class="mc-input" />
              </div>
              <div class="mc-list">
                <div v-for="u in contactsFiltres" :key="u.id"
                  class="mc-item" @click="choisirContact(u)">
                  <div class="conv-avatar sm" :class="roleCls(u.role)">{{ initiales(u) }}</div>
                  <div>
                    <div style="font-size:.86rem;font-weight:600">{{ u.prenom }} {{ u.nom }}</div>
                    <div style="font-size:.73rem;color:var(--color-text-muted)">{{ roleLabel(u.role) }}</div>
                  </div>
                </div>
                <div v-if="!contactsFiltres.length" class="convs-vide" style="height:120px">
                  <User :size="28" style="opacity:.2" />
                  <span>Aucun contact trouvé</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>

    <!-- ══ COLONNE DROITE : fil de messages ══ -->
    <div class="msg-main" :class="{ 'main-full': contactActif && isMobile }">

      <!-- Aucun contact sélectionné -->
      <div v-if="!contactActif" class="msg-vide">
        <div class="mv-icon"><MessageCircle :size="40" /></div>
        <p class="mv-titre">Sélectionnez une conversation</p>
        <p class="mv-sub">ou commencez un nouveau message</p>
        <button class="btn btn-primary btn-sm" @click="ouvrirNouveauContact">
          <Plus :size="14" /> Nouveau message
        </button>
      </div>

      <template v-else>
        <!-- En-tête conversation -->
        <div class="conv-header">
          <button v-if="isMobile" class="btn-back" @click="contactActif = null">
            <ChevronLeft :size="18" />
          </button>
          <div class="conv-avatar md" :class="roleCls(contactActif.role)">{{ initiales(contactActif) }}</div>
          <div>
            <div class="ch-nom">{{ contactActif.prenom }} {{ contactActif.nom }}</div>
            <div class="ch-role">{{ roleLabel(contactActif.role) }}</div>
          </div>
        </div>

        <!-- Fil de messages -->
        <div class="messages-fil" ref="filRef">
          <div v-if="chargementMsgs" class="msg-loading">
            <Loader2 :size="22" class="spin" />
          </div>
          <div v-else-if="!messages.length" class="fil-vide">
            <MessageCircle :size="32" style="opacity:.15;margin-bottom:.5rem" />
            <span>Commencez la conversation</span>
          </div>
          <template v-else>
            <div v-for="(m, i) in messages" :key="m.id"
              class="msg-groupe" :class="{ 'msg-moi': m.expediteurId === moiId }">
              <div class="msg-bubble" :class="m.expediteurId === moiId ? 'bubble-moi' : 'bubble-autre'">
                {{ m.message }}
                <span class="msg-time">{{ fmtHeure(m.createdAt) }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- Zone saisie -->
        <div class="msg-input-bar">
          <textarea
            v-model="texte"
            class="msg-textarea"
            placeholder="Écrivez un message…"
            rows="1"
            @keydown.enter.exact.prevent="envoyer"
            @input="autoResize"
            ref="textareaRef"
          ></textarea>
          <button class="btn-send" :disabled="!texte.trim() || envoi" @click="envoyer">
            <Send :size="18" />
          </button>
        </div>
      </template>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import {
  MessageCircle, Plus, Search, Send, ChevronLeft,
  Loader2, X, User,
} from 'lucide-vue-next'
import { useApi } from '../composables/useApi.js'
import { useDate } from '../composables/useDate.js'
import { useAuthStore } from '../stores/auth.js'
import { useMessagerieStore } from '../stores/messagerie.js'

const api      = useApi()
const { fmtHeure } = useDate()
const auth     = useAuthStore()
const msgStore = useMessagerieStore()

const moiId          = computed(() => auth.utilisateur?.id)
const chargementConvs= ref(true)
const chargementMsgs = ref(false)
const conversations  = ref([])
const contacts       = ref([])
const messages       = ref([])
const contactActif   = ref(null)
const texte          = ref('')
const envoi          = ref(false)
const recherche      = ref('')
const rechercheContact= ref('')
const modalContacts  = ref(false)
const filRef         = ref(null)
const textareaRef    = ref(null)
const isMobile       = ref(window.innerWidth < 768)

let pollInterval = null

const convsFiltrees = computed(() => {
  if (!recherche.value.trim()) return conversations.value
  const q = recherche.value.toLowerCase()
  return conversations.value.filter(c =>
    `${c.utilisateur.prenom} ${c.utilisateur.nom}`.toLowerCase().includes(q)
  )
})

const contactsFiltres = computed(() => {
  const q = rechercheContact.value.toLowerCase()
  return contacts.value.filter(u =>
    `${u.prenom} ${u.nom} ${u.role}`.toLowerCase().includes(q)
  )
})

async function chargerConversations() {
  try {
    conversations.value = await api.get('/messagerie/conversations')
  } catch {}
  finally { chargementConvs.value = false }
}

async function chargerContacts() {
  try { contacts.value = await api.get('/messagerie/contacts') } catch {}
}

async function ouvrirConversation(u) {
  contactActif.value = u
  chargementMsgs.value = true
  modalContacts.value  = false
  try {
    messages.value = await api.get(`/messagerie/messages/${u.id}`)
    // Mettre à jour le badge non lus
    const c = conversations.value.find(x => x.utilisateur.id === u.id)
    if (c) c.nonLus = 0
  } finally {
    chargementMsgs.value = false
    scrollBas()
  }
}

async function envoyer() {
  if (!texte.value.trim() || envoi.value || !contactActif.value) return
  envoi.value = true
  try {
    const msg = await api.post('/messagerie/envoyer', {
      destinataireId: contactActif.value.id,
      message: texte.value.trim(),
    })
    messages.value.push(msg)
    texte.value = ''
    scrollBas()
    await chargerConversations()
  } finally { envoi.value = false }
}

function ouvrirNouveauContact() {
  rechercheContact.value = ''
  modalContacts.value = true
}

function choisirContact(u) {
  ouvrirConversation(u)
  // Ajouter à la liste si pas encore présent
  if (!conversations.value.find(c => c.utilisateur.id === u.id)) {
    conversations.value.unshift({ utilisateur: u, dernierMessage: null, nonLus: 0 })
  }
}

function scrollBas() {
  nextTick(() => {
    if (filRef.value) filRef.value.scrollTop = filRef.value.scrollHeight
  })
}

function autoResize(e) {
  e.target.style.height = 'auto'
  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
}

// Polling toutes les 8 secondes si conversation active
watch(contactActif, (u) => {
  clearInterval(pollInterval)
  if (!u) return
  pollInterval = setInterval(async () => {
    const msgs = await api.get(`/messagerie/messages/${u.id}`)
    if (msgs.length > messages.value.length) {
      messages.value = msgs
      scrollBas()
    }
    await chargerConversations()
  }, 8000)
})

onMounted(async () => {
  msgStore.reset()
  await Promise.all([chargerConversations(), chargerContacts()])
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768 })
})

onUnmounted(() => {
  clearInterval(pollInterval)
  window.removeEventListener('resize', () => {})
})

function initiales(u) { return `${(u.prenom||'')[0]||''}${(u.nom||'')[0]||''}`.toUpperCase() }
function tronquer(txt, n) { return txt?.length > n ? txt.slice(0, n) + '…' : txt }
function roleLabel(r) {
  return { PATIENT:'Patient', MEDECIN:'Médecin', RECEPTIONNISTE:'Réceptionniste', PHARMACIEN:'Pharmacien', ADMIN:'Admin' }[r] || r
}
function roleCls(r) {
  return { PATIENT:'av-green', MEDECIN:'av-blue', RECEPTIONNISTE:'av-teal', PHARMACIEN:'av-gold', ADMIN:'av-red' }[r] || 'av-gray'
}
</script>

<style scoped>
@keyframes fadeInUp { from { opacity:0;transform:translateY(8px) } to { opacity:1;transform:none } }
@keyframes shimmer  { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }

.msg-layout {
  display:grid;
  grid-template-columns:300px 1fr;
  height:calc(100vh - 80px);
  max-height:780px;
  background:white;
  border:1.5px solid #E2E8F0;
  border-radius:1.25rem;
  overflow:hidden;
}
@media(max-width:767px) {
  .msg-layout { grid-template-columns:1fr; height:calc(100vh - 64px); }
  .sidebar-hidden { display:none; }
  .main-full { display:flex !important; }
}

/* ── SIDEBAR ── */
.msg-sidebar {
  display:flex;flex-direction:column;border-right:1.5px solid #F1F5F9;
  background:#FAFBFC;
}
.sb-header { display:flex;align-items:center;justify-content:space-between;padding:.875rem 1rem;border-bottom:1px solid #F1F5F9; }
.sb-titre  { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:.95rem;font-weight:700;color:var(--color-text); }
.btn-new   { width:30px;height:30px;border-radius:.625rem;border:1.5px solid #E2E8F0;background:white;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--color-primary);transition:all .15s }
.btn-new:hover { background:rgba(14,159,142,.08);border-color:var(--color-primary) }

.sb-search { position:relative;padding:.625rem .75rem;border-bottom:1px solid #F1F5F9; }
.sb-search-ic { position:absolute;left:1.25rem;top:50%;transform:translateY(-50%);color:var(--color-text-muted);pointer-events:none }
.sb-input { width:100%;padding:.45rem .75rem .45rem 2rem;border:1.5px solid #E2E8F0;border-radius:9999px;font-size:.82rem;outline:none;background:white;transition:border .15s }
.sb-input:focus { border-color:var(--color-primary) }

.convs-list { flex:1;overflow-y:auto; }
.convs-vide { display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;height:180px;color:var(--color-text-muted);font-size:.82rem }

.conv-item { display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;cursor:pointer;border-bottom:1px solid #F8FAFC;transition:background .15s }
.conv-item:hover { background:#F8FAFC }
.conv-item.active { background:rgba(14,159,142,.06);border-left:3px solid var(--color-primary) }

.conv-avatar { width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;flex-shrink:0;color:white }
.conv-avatar.sm { width:32px;height:32px;font-size:.65rem }
.conv-avatar.md { width:40px;height:40px;font-size:.75rem }
.av-green  { background:linear-gradient(135deg,#4ADE80,#059669) }
.av-blue   { background:linear-gradient(135deg,#60A5FA,#2563EB) }
.av-teal   { background:linear-gradient(135deg,#2DD4BF,#0F766E) }
.av-gold   { background:linear-gradient(135deg,#FCD34D,#D97706) }
.av-red    { background:linear-gradient(135deg,#F87171,#DC2626) }
.av-gray   { background:linear-gradient(135deg,#94A3B8,#475569) }

.conv-info { flex:1;min-width:0 }
.conv-name { font-size:.84rem;font-weight:600;color:var(--color-text) }
.conv-role { font-size:.68rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em }
.conv-last { font-size:.74rem;color:var(--color-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:.1rem }
.conv-right { display:flex;flex-direction:column;align-items:flex-end;gap:.25rem;flex-shrink:0 }
.conv-badge { background:var(--color-primary);color:white;border-radius:9999px;font-size:.65rem;font-weight:800;padding:2px 6px;min-width:18px;text-align:center }
.conv-time  { font-size:.65rem;color:var(--color-text-muted) }

.skel-conv { height:64px;margin:.375rem .75rem;background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.875rem;animation:shimmer 1.5s infinite }

/* ── MAIN ── */
.msg-main {
  display:flex;flex-direction:column;
  background:white;
}

.msg-vide { display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:.75rem;color:var(--color-text-muted) }
.mv-icon  { width:72px;height:72px;border-radius:50%;background:rgba(14,159,142,.08);display:flex;align-items:center;justify-content:center;color:var(--color-primary) }
.mv-titre { font-size:.95rem;font-weight:700;color:var(--color-text);margin:0 }
.mv-sub   { font-size:.82rem;color:var(--color-text-muted);margin:0 }

/* Header conversation */
.conv-header { display:flex;align-items:center;gap:.75rem;padding:.875rem 1.25rem;border-bottom:1.5px solid #F1F5F9;flex-shrink:0 }
.btn-back { width:32px;height:32px;border-radius:.625rem;border:1.5px solid #E2E8F0;background:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--color-text-muted) }
.ch-nom  { font-size:.9rem;font-weight:700;color:var(--color-text) }
.ch-role { font-size:.72rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em }

/* Messages */
.messages-fil { flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.625rem;background:#F8FAFC }
.msg-loading  { display:flex;justify-content:center;align-items:center;flex:1 }
.fil-vide     { display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;color:var(--color-text-muted);font-size:.82rem }

.msg-groupe { display:flex;animation:fadeInUp .2s ease both }
.msg-moi    { justify-content:flex-end }

.msg-bubble { max-width:68%;padding:.625rem .875rem;border-radius:1rem;font-size:.86rem;line-height:1.5;position:relative }
.bubble-moi   { background:linear-gradient(135deg,#4ADE80,#059669);color:white;border-bottom-right-radius:.25rem }
.bubble-autre { background:white;color:var(--color-text);border:1.5px solid #E2E8F0;border-bottom-left-radius:.25rem }
.msg-time { display:block;font-size:.63rem;opacity:.65;margin-top:.25rem;text-align:right }

/* Zone saisie */
.msg-input-bar { display:flex;align-items:flex-end;gap:.625rem;padding:.875rem 1rem;border-top:1.5px solid #F1F5F9;flex-shrink:0 }
.msg-textarea { flex:1;border:1.5px solid #E2E8F0;border-radius:.875rem;padding:.6rem .875rem;font-size:.86rem;resize:none;outline:none;font-family:var(--font-sans);max-height:120px;transition:border .15s;background:white }
.msg-textarea:focus { border-color:var(--color-primary) }
.btn-send { width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#4ADE80,#059669);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0;transition:all .2s }
.btn-send:hover:not(:disabled) { transform:scale(1.08);box-shadow:0 4px 14px rgba(34,197,94,.4) }
.btn-send:disabled { opacity:.4;cursor:not-allowed }

/* Modal contacts */
.modal-overlay{ position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:300;display:flex;align-items:center;justify-content:center;padding:1rem }
.modal-contacts{ background:white;border-radius:1.25rem;width:100%;max-width:380px;max-height:70vh;display:flex;flex-direction:column;overflow:hidden }
.mc-header { display:flex;align-items:center;justify-content:space-between;padding:.875rem 1.125rem;border-bottom:1px solid #F1F5F9 }
.mc-close  { background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex }
.mc-search { position:relative;padding:.625rem .875rem;border-bottom:1px solid #F1F5F9 }
.mc-ic     { position:absolute;left:1.5rem;top:50%;transform:translateY(-50%);color:var(--color-text-muted) }
.mc-input  { width:100%;padding:.4rem .75rem .4rem 1.875rem;border:1.5px solid #E2E8F0;border-radius:9999px;font-size:.82rem;outline:none }
.mc-list   { flex:1;overflow-y:auto }
.mc-item   { display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;cursor:pointer;border-bottom:1px solid #F8FAFC;transition:background .15s }
.mc-item:hover { background:#F8FAFC }

.spin { animation:spin 1s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
.modal-fade-enter-active,.modal-fade-leave-active { transition:all .2s ease }
.modal-fade-enter-from,.modal-fade-leave-to { opacity:0 }
</style>
