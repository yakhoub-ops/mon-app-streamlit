<script setup>
import { ref, onMounted, computed } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';

const users = ref([]);
const loading = ref(true);
const search = ref('');
const showModal = ref(false);
const form = ref({ nom: '', prenom: '', email: '', telephone: '', mot_de_passe: 'tropical123', role: 'patient', specialite: '' });
const saving = ref(false);
const error = ref('');

const filtered = computed(() => {
  const q = search.value.toLowerCase();
  return users.value.filter((u) => `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(q));
});

const roleColors = { medecin: 'badge-blue', patient: 'badge-green', receptionniste: 'badge-yellow', pharmacien: 'badge-gray', admin: 'badge-red' };

onMounted(async () => {
  await load();
});

const load = async () => {
  loading.value = true;
  try { users.value = await api.get('/utilisateurs'); } finally { loading.value = false; }
};

const create = async () => {
  saving.value = true; error.value = '';
  try {
    await api.post('/utilisateurs', form.value);
    await load();
    showModal.value = false;
    form.value = { nom: '', prenom: '', email: '', telephone: '', mot_de_passe: 'tropical123', role: 'patient', specialite: '' };
  } catch (e) { error.value = e.message; } finally { saving.value = false; }
};

const toggle = async (u) => {
  await api.patch(`/utilisateurs/${u.id_util}/toggle`);
  await load();
};
</script>

<template>
  <AppLayout>
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Utilisateurs</h2>
          <p class="text-gray-500 text-sm mt-1">{{ users.length }} comptes enregistrés</p>
        </div>
        <button @click="showModal = true" class="btn btn-primary">+ Nouveau</button>
      </div>

      <div class="card">
        <input v-model="search" placeholder="Rechercher..." class="input mb-4" />
        <div v-if="loading" class="py-8 text-center text-gray-400">Chargement...</div>
        <table v-else class="table-auto w-full">
          <thead><tr>
            <th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th>
          </tr></thead>
          <tbody>
            <tr v-for="u in filtered" :key="u.id_util">
              <td class="font-medium">{{ u.prenom }} {{ u.nom }}</td>
              <td class="text-gray-500">{{ u.email }}</td>
              <td><span class="badge" :class="roleColors[u.role] || 'badge-gray'">{{ u.role }}</span></td>
              <td><span class="badge" :class="u.actif ? 'badge-green' : 'badge-red'">{{ u.actif ? 'Actif' : 'Inactif' }}</span></td>
              <td>
                <button @click="toggle(u)" class="text-xs px-2 py-1 rounded border" :class="u.actif ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'">
                  {{ u.actif ? 'Désactiver' : 'Activer' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold mb-4">Nouvel utilisateur</h3>
        <form @submit.prevent="create" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-medium text-gray-600">Prénom</label><input v-model="form.prenom" required class="input mt-1" /></div>
            <div><label class="text-xs font-medium text-gray-600">Nom</label><input v-model="form.nom" required class="input mt-1" /></div>
          </div>
          <div><label class="text-xs font-medium text-gray-600">Email</label><input v-model="form.email" type="email" required class="input mt-1" /></div>
          <div><label class="text-xs font-medium text-gray-600">Téléphone</label><input v-model="form.telephone" required class="input mt-1" /></div>
          <div><label class="text-xs font-medium text-gray-600">Rôle</label>
            <select v-model="form.role" class="input mt-1">
              <option value="patient">Patient</option>
              <option value="medecin">Médecin</option>
              <option value="receptionniste">Réceptionniste</option>
              <option value="pharmacien">Pharmacien</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div v-if="form.role === 'medecin'"><label class="text-xs font-medium text-gray-600">Spécialité</label><input v-model="form.specialite" required class="input mt-1" /></div>
          <div><label class="text-xs font-medium text-gray-600">Mot de passe</label><input v-model="form.mot_de_passe" required class="input mt-1" /></div>
          <div v-if="error" class="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{{ error }}</div>
          <div class="flex gap-2 pt-2">
            <button type="button" @click="showModal = false" class="btn btn-outline flex-1">Annuler</button>
            <button type="submit" :disabled="saving" class="btn btn-primary flex-1">{{ saving ? '...' : 'Créer' }}</button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>
