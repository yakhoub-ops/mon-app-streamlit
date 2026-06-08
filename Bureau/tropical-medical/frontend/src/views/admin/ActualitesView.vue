<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-titre">Actualités & Publications</h1>
        <p style="color:var(--color-text-muted);font-size:.875rem">{{ actualites.length }} article(s)</p>
      </div>
      <button class="btn btn-primary" @click="ouvrirCreer">
        <Plus :size="16" /> Nouvelle actualité
      </button>
    </div>

    <div v-if="chargement" style="display:flex;flex-direction:column;gap:.875rem">
      <div class="skeleton-block" v-for="i in 4" :key="i" style="height:120px;border-radius:1rem"></div>
    </div>

    <div v-else-if="actualites.length" style="display:flex;flex-direction:column;gap:.875rem">
      <div v-for="a in actualites" :key="a.id" class="card actu-card">
        <div class="actu-img" v-if="a.image">
          <img :src="a.image" :alt="a.titre" />
        </div>
        <div class="actu-img actu-img-placeholder" v-else>
          <Newspaper :size="28" style="opacity:.3" />
        </div>
        <div class="actu-corps">
          <div class="actu-meta">
            <span class="badge" :class="a.publiee ? 'badge-green' : 'badge-gray'">
              <Eye v-if="a.publiee" :size="11" /> <EyeOff v-else :size="11" />
              {{ a.publiee ? 'Publiée' : 'Brouillon' }}
            </span>
            <span style="font-size:.75rem;color:var(--color-text-muted)">{{ fmt(a.createdAt) }}</span>
          </div>
          <h3 class="actu-titre">{{ a.titre }}</h3>
          <p class="actu-extrait">{{ extrait(a.contenu) }}</p>
        </div>
        <div class="actu-actions">
          <button class="btn-icone" title="Modifier" @click="ouvrirEditer(a)"><Pencil :size="15" /></button>
          <button class="btn-icone" :title="a.publiee?'Dépublier':'Publier'" @click="togglePubilee(a)">
            <Eye v-if="!a.publiee" :size="15" style="color:var(--color-green)" />
            <EyeOff v-else :size="15" style="color:var(--color-text-muted)" />
          </button>
          <button class="btn-icone btn-icone-danger" title="Supprimer" @click="confirmerSupp(a)">
            <Trash2 :size="15" />
          </button>
        </div>
      </div>
    </div>

    <div v-else class="vide-center">
      <Newspaper :size="48" style="opacity:.2;margin-bottom:.75rem" />
      <p style="color:var(--color-text-muted)">Aucune actualité publiée</p>
    </div>

    <!-- Confirmation suppression -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="suppConfirm" class="modal-overlay" @click.self="suppConfirm=null">
          <div class="modal-box" style="max-width:400px">
            <div class="modal-header">
              <h2 class="modal-titre"><AlertTriangle :size="18" style="color:var(--color-danger)" /> Supprimer l'actualité</h2>
              <button class="modal-close" @click="suppConfirm=null"><X :size="20" /></button>
            </div>
            <div class="modal-body">
              <p style="font-size:.9rem;color:var(--color-text)">Supprimer <strong>« {{ suppConfirm?.titre }} »</strong> ? Cette action est irréversible.</p>
              <div class="modal-footer" style="padding-top:0">
                <button class="btn btn-ghost" @click="suppConfirm=null">Annuler</button>
                <button class="btn btn-danger" @click="supprimer" :disabled="envoi">
                  <Loader2 v-if="envoi" :size="16" class="spin" /><Trash2 v-else :size="16" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal créer / éditer -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="modalOuvert" class="modal-overlay" @click.self="modalOuvert=false">
          <div class="modal-box" style="max-width:620px">
            <div class="modal-header">
              <h2 class="modal-titre">
                <component :is="editActu ? Pencil : Plus" :size="18" style="color:var(--color-primary)" />
                {{ editActu ? 'Modifier l\'actualité' : 'Nouvelle actualité' }}
              </h2>
              <button class="modal-close" @click="modalOuvert=false"><X :size="20" /></button>
            </div>
            <form @submit.prevent="sauvegarder" class="modal-body">
              <div v-if="erreur" class="alert-erreur"><AlertCircle :size="14" /> {{ erreur }}</div>

              <div class="field">
                <label class="field-label">Titre *</label>
                <input v-model="form.titre" type="text" class="input" required placeholder="Titre de l'actualité…" />
              </div>

              <div class="field">
                <label class="field-label">Contenu *</label>
                <textarea v-model="form.contenu" class="input" rows="6" required placeholder="Contenu de l'article…"></textarea>
              </div>

              <div class="field">
                <label class="field-label">URL de l'image (optionnel)</label>
                <input v-model="form.image" type="url" class="input" placeholder="https://…" />
              </div>

              <div class="field" style="flex-direction:row;align-items:center;gap:.75rem">
                <input id="publiee" v-model="form.publiee" type="checkbox" style="width:18px;height:18px;accent-color:var(--color-primary);cursor:pointer" />
                <label for="publiee" style="font-size:.88rem;font-weight:600;cursor:pointer;color:var(--color-text)">Publier immédiatement</label>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="modalOuvert=false">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="envoi">
                  <Loader2 v-if="envoi" :size="16" class="spin" /><Check v-else :size="16" />
                  {{ envoi ? 'Enregistrement…' : (editActu ? 'Modifier' : 'Publier') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Newspaper, Plus, Pencil, Eye, EyeOff, Trash2, Check, X, AlertCircle, AlertTriangle, Loader2 } from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { fmt } = useDate()

const chargement  = ref(true)
const actualites  = ref([])
const modalOuvert = ref(false)
const editActu    = ref(null)
const suppConfirm = ref(null)
const envoi       = ref(false)
const erreur      = ref('')
const formVide    = () => ({ titre:'', contenu:'', image:'', publiee:true })
const form        = ref(formVide())

function extrait(texte) { return texte?.length > 140 ? texte.slice(0, 140) + '…' : texte }

async function charger() {
  chargement.value = true
  try { actualites.value = await api.get('/admin/actualites') }
  finally { chargement.value = false }
}

function ouvrirCreer() { editActu.value = null; form.value = formVide(); erreur.value = ''; modalOuvert.value = true }
function ouvrirEditer(a) {
  editActu.value = a
  form.value = { titre: a.titre, contenu: a.contenu, image: a.image||'', publiee: a.publiee }
  erreur.value = ''; modalOuvert.value = true
}

async function sauvegarder() {
  erreur.value = ''; envoi.value = true
  try {
    const payload = { ...form.value, image: form.value.image || undefined }
    if (editActu.value) {
      const updated = await api.put(`/admin/actualites/${editActu.value.id}`, payload)
      const idx = actualites.value.findIndex(a => a.id === editActu.value.id)
      if (idx >= 0) actualites.value[idx] = updated
    } else {
      const created = await api.post('/admin/actualites', payload)
      actualites.value.unshift(created)
    }
    modalOuvert.value = false
  } catch(e) { erreur.value = e.message }
  finally { envoi.value = false }
}

async function togglePubilee(a) {
  try {
    const updated = await api.put(`/admin/actualites/${a.id}`, { publiee: !a.publiee })
    const idx = actualites.value.findIndex(x => x.id === a.id)
    if (idx >= 0) actualites.value[idx] = updated
  } catch(e) { console.error(e) }
}

function confirmerSupp(a) { suppConfirm.value = a }

async function supprimer() {
  envoi.value = true
  try {
    await api.del(`/admin/actualites/${suppConfirm.value.id}`)
    actualites.value = actualites.value.filter(a => a.id !== suppConfirm.value.id)
    suppConfirm.value = null
  } catch(e) { console.error(e) }
  finally { envoi.value = false }
}

onMounted(charger)
</script>

<style scoped>
.page-header  { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;gap:1rem }
.page-titre   { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
.actu-card    { display:flex;align-items:flex-start;gap:1rem;padding:1rem;transition:box-shadow .2s }
.actu-card:hover { box-shadow:0 6px 20px rgba(14,159,142,.1) }
.actu-img     { width:90px;height:90px;border-radius:.875rem;object-fit:cover;flex-shrink:0;overflow:hidden }
.actu-img img { width:100%;height:100%;object-fit:cover }
.actu-img-placeholder { background:#F1F5F9;display:flex;align-items:center;justify-content:center }
.actu-corps   { flex:1;min-width:0 }
.actu-meta    { display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem;flex-wrap:wrap }
.actu-titre   { font-family:var(--font-display);font-size:.95rem;font-weight:700;color:var(--color-text);margin:0;margin-bottom:.35rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.actu-extrait { font-size:.8rem;color:var(--color-text-muted);margin:0;line-height:1.5 }
.actu-actions { display:flex;flex-direction:column;gap:.375rem;flex-shrink:0 }
.btn-icone    { width:32px;height:32px;border-radius:.5rem;border:1.5px solid #E2E8F0;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);transition:all .15s }
.btn-icone:hover { border-color:var(--color-primary);color:var(--color-primary) }
.btn-icone-danger:hover { border-color:var(--color-danger)!important;color:var(--color-danger)!important }
.vide-center  { display:flex;flex-direction:column;align-items:center;padding:4rem 1rem }
.field        { display:flex;flex-direction:column;gap:.375rem }
.field-label  { font-size:.8rem;font-weight:600;color:var(--color-text-muted) }
.modal-overlay{ position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem }
.modal-box    { background:white;border-radius:1.25rem;width:100%;max-height:90vh;overflow-y:auto }
.modal-header { display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #F1F5F9 }
.modal-titre  { display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:1rem;font-weight:700 }
.modal-close  { background:none;border:none;cursor:pointer;color:var(--color-text-muted);display:flex }
.modal-body   { padding:1.5rem;display:flex;flex-direction:column;gap:1rem }
.modal-footer { display:flex;justify-content:flex-end;gap:.75rem;padding-top:.5rem }
.alert-erreur { display:flex;align-items:center;gap:.5rem;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,.25);color:var(--color-danger);border-radius:.75rem;padding:.625rem .875rem;font-size:.83rem }
.btn-danger   { background:var(--color-danger);color:white;border:none;padding:.5rem 1.125rem;border-radius:.75rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:.375rem;font-size:.875rem }
.spin         { animation:spin 1s linear infinite }
@keyframes spin{ from{ transform:rotate(0deg) } to{ transform:rotate(360deg) } }
.skeleton-block{ background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.5rem;animation:shimmer 1.5s infinite }
.modal-fade-enter-active,.modal-fade-leave-active { transition:all .25s }
.modal-fade-enter-from,.modal-fade-leave-to { opacity:0 }
@keyframes shimmer{ 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }
</style>
