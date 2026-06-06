<script setup>
import { ref } from 'vue';
import AppLayout from '../components/AppLayout.vue';
import { api } from '../utils/api';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const error = ref('');
const success = ref('');
const saving = ref(false);

const pwForm = ref({ ancien: '', nouveau: '', confirm: '' });

const changePassword = async () => {
  if (pwForm.value.nouveau !== pwForm.value.confirm) {
    error.value = 'Les mots de passe ne correspondent pas';
    return;
  }
  saving.value = true; error.value = ''; success.value = '';
  try {
    await api.put('/auth/password', { ancien: pwForm.value.ancien, nouveau: pwForm.value.nouveau });
    success.value = 'Mot de passe modifié avec succès';
    pwForm.value = { ancien: '', nouveau: '', confirm: '' };
  } catch (e) { error.value = e.message; } finally { saving.value = false; }
};
</script>

<template>
  <AppLayout>
    <div class="max-w-lg space-y-5">
      <h2 class="text-2xl font-bold text-gray-900">Mon profil</h2>

      <div class="card">
        <div class="flex items-center gap-4 mb-5">
          <div class="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 font-bold text-2xl">
            {{ auth.user?.prenom?.[0] }}{{ auth.user?.nom?.[0] }}
          </div>
          <div>
            <div class="text-xl font-bold text-gray-900">{{ auth.user?.prenom }} {{ auth.user?.nom }}</div>
            <div class="text-sm text-gray-500">{{ auth.user?.email }}</div>
            <div class="badge badge-green mt-1">{{ auth.user?.role }}</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><span class="text-gray-500">Téléphone</span><div class="font-medium mt-1">{{ auth.user?.telephone }}</div></div>
          <div><span class="text-gray-500">Compte créé</span><div class="font-medium mt-1">{{ new Date(auth.user?.created_at).toLocaleDateString('fr') }}</div></div>
        </div>
      </div>

      <div class="card">
        <h3 class="font-semibold text-gray-900 mb-4">Changer le mot de passe</h3>
        <form @submit.prevent="changePassword" class="space-y-3">
          <div><label class="text-sm font-medium text-gray-700">Mot de passe actuel</label>
            <input v-model="pwForm.ancien" type="password" required class="input mt-1" /></div>
          <div><label class="text-sm font-medium text-gray-700">Nouveau mot de passe</label>
            <input v-model="pwForm.nouveau" type="password" required minlength="6" class="input mt-1" /></div>
          <div><label class="text-sm font-medium text-gray-700">Confirmer</label>
            <input v-model="pwForm.confirm" type="password" required class="input mt-1" /></div>
          <div v-if="error" class="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{{ error }}</div>
          <div v-if="success" class="text-sm text-green-600 bg-green-50 rounded px-3 py-2">{{ success }}</div>
          <button type="submit" :disabled="saving" class="btn btn-primary">{{ saving ? '...' : 'Modifier' }}</button>
        </form>
      </div>
    </div>
  </AppLayout>
</template>
