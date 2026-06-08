<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-titre">Patients</h1>
        <p style="color:var(--color-text-muted);font-size:.875rem">{{ patientsFiltres.length }} patient(s)</p>
      </div>
    </div>

    <!-- Recherche -->
    <div class="search-wrap" style="margin-bottom:1.25rem">
      <Search :size="16" class="search-icon" />
      <input v-model="recherche" type="text" class="input search-input" placeholder="Nom, prénom ou email…" />
    </div>

    <div v-if="chargement" style="display:flex;flex-direction:column;gap:.75rem">
      <div class="skeleton-block" v-for="i in 6" :key="i" style="height:64px"></div>
    </div>

    <div v-else-if="patientsFiltres.length" class="card table-wrap">
      <table class="table-tm">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Téléphone</th>
            <th>Email</th>
            <th>Assurance</th>
            <th>Dossier</th>
            <th>Inscrit le</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in patientsFiltres" :key="p.id">
            <td>
              <div style="display:flex;align-items:center;gap:.625rem">
                <div class="p-avatar"><User :size="15" /></div>
                <div>
                  <div style="font-weight:600;font-size:.88rem">{{ p.utilisateur.prenom }} {{ p.utilisateur.nom }}</div>
                  <div v-if="p.groupeSanguin" style="font-size:.72rem;color:var(--color-danger);font-weight:600">{{ p.groupeSanguin }}</div>
                </div>
              </div>
            </td>
            <td style="font-size:.83rem">{{ p.utilisateur.telephone || '—' }}</td>
            <td style="font-size:.78rem;color:var(--color-text-muted)">{{ p.utilisateur.email }}</td>
            <td>
              <span v-if="p.assurance" class="badge badge-info">{{ p.assurance.type }}</span>
              <span v-else class="badge badge-gray">Aucune</span>
            </td>
            <td>
              <span v-if="p.dossier" class="badge badge-green">
                <FolderOpen :size="11" /> #{{ p.dossier.numeroDossier }}
              </span>
              <span v-else class="badge badge-gray">—</span>
            </td>
            <td style="font-size:.78rem;color:var(--color-text-muted)">{{ fmt(p.utilisateur.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="vide-center">
      <Users :size="48" style="opacity:.25;margin-bottom:.75rem" />
      <p style="color:var(--color-text-muted)">Aucun patient trouvé</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, User, FolderOpen, Users } from 'lucide-vue-next'
import { useApi } from '../../composables/useApi.js'
import { useDate } from '../../composables/useDate.js'

const api = useApi()
const { fmt } = useDate()

const chargement = ref(true)
const patients   = ref([])
const recherche  = ref('')

const patientsFiltres = computed(() => {
  if (!recherche.value) return patients.value
  const q = recherche.value.toLowerCase()
  return patients.value.filter(p =>
    p.utilisateur.nom.toLowerCase().includes(q) ||
    p.utilisateur.prenom.toLowerCase().includes(q) ||
    p.utilisateur.email.toLowerCase().includes(q)
  )
})

onMounted(async () => {
  try { patients.value = await api.get('/receptionniste/patients') }
  finally { chargement.value = false }
})
</script>

<style scoped>
.page-header  { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem;gap:1rem }
.page-titre   { font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--color-text) }
.search-wrap  { position:relative;max-width:400px }
.search-icon  { position:absolute;left:.75rem;top:50%;transform:translateY(-50%);color:var(--color-text-muted);pointer-events:none }
.search-input { padding-left:2.25rem }
.p-avatar     { width:30px;height:30px;border-radius:50%;background:rgba(14,159,142,0.1);display:flex;align-items:center;justify-content:center;color:var(--color-primary);flex-shrink:0 }
.vide-center  { display:flex;flex-direction:column;align-items:center;padding:4rem 1rem }
.skeleton-block{ background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);background-size:200% 100%;border-radius:.625rem;animation:shimmer 1.5s infinite }
@keyframes shimmer{ 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }
</style>
