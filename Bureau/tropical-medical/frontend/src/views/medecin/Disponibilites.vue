<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '../../components/AppLayout.vue';
import { api } from '../../utils/api';
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();
const dispos = ref([]);
const saving = ref(false);
const id_medecin = ref(null);

const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

onMounted(async () => {
  const me = await api.get('/auth/me');
  id_medecin.value = me.medecin?.id_medecin;
  if (id_medecin.value) {
    const d = await api.get(`/medecins/${id_medecin.value}/disponibilites`);
    dispos.value = d.map((x) => ({
      jour_semaine: x.jour_semaine,
      heure_debut: new Date(x.heure_debut).toISOString().slice(11, 16),
      heure_fin: new Date(x.heure_fin).toISOString().slice(11, 16),
      duree_slot: x.duree_slot,
    }));
  }
});

const add = () => dispos.value.push({ jour_semaine: 1, heure_debut: '08:00', heure_fin: '17:00', duree_slot: 30 });
const remove = (i) => dispos.value.splice(i, 1);

const save = async () => {
  saving.value = true;
  try {
    await api.put(`/medecins/${id_medecin.value}/disponibilites`, { disponibilites: dispos.value });
    alert('Disponibilités enregistrées !');
  } finally { saving.value = false; }
};
</script>

<template>
  <AppLayout>
    <div class="space-y-5 max-w-2xl">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">Mes disponibilités</h2>
        <div class="flex gap-2">
          <button @click="add" class="btn btn-outline">+ Ajouter</button>
          <button @click="save" :disabled="saving" class="btn btn-primary">{{ saving ? '...' : 'Enregistrer' }}</button>
        </div>
      </div>
      <div class="card space-y-3">
        <div v-if="dispos.length === 0" class="py-6 text-center text-gray-400">Aucune disponibilité définie</div>
        <div v-for="(d, i) in dispos" :key="i" class="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
          <select v-model.number="d.jour_semaine" class="input w-32">
            <option v-for="(j, idx) in jours" :key="idx + 1" :value="idx + 1">{{ j }}</option>
          </select>
          <input v-model="d.heure_debut" type="time" class="input w-28" />
          <span class="text-gray-400 text-sm">→</span>
          <input v-model="d.heure_fin" type="time" class="input w-28" />
          <select v-model.number="d.duree_slot" class="input w-24">
            <option :value="15">15 min</option>
            <option :value="20">20 min</option>
            <option :value="30">30 min</option>
            <option :value="45">45 min</option>
            <option :value="60">60 min</option>
          </select>
          <button @click="remove(i)" class="text-red-400 hover:text-red-600">✕</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
