<template>
  <div class="nf-page">
    <div class="nf-inner"
      v-motion :initial="{ opacity:0, y:30 }" :enter="{ opacity:1, y:0, transition:{ duration:600 } }"
    >
      <div class="nf-code">404</div>
      <div class="nf-icon">
        <SearchX :size="52" style="color:var(--color-primary)" />
      </div>
      <h1 class="nf-titre">Page introuvable</h1>
      <p class="nf-desc">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <div class="nf-actions">
        <RouterLink to="/" class="btn btn-primary">
          <Home :size="17" /> Retour à l'accueil
        </RouterLink>
        <button class="btn btn-ghost" @click="$router.back()">
          <ArrowLeft :size="17" /> Page précédente
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { SearchX, ArrowLeft, Home } from 'lucide-vue-next'
</script>

<style scoped>
.nf-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 2rem;
}
.nf-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  max-width: 420px;
}
.nf-code {
  font-family: var(--font-display);
  font-size: clamp(5rem, 15vw, 9rem);
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(135deg, var(--color-primary), #0EA5E9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: .25;
}
.nf-icon {
  width: 80px; height: 80px;
  background: rgba(14,159,142,0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -1rem;
}
.nf-titre {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text);
}
.nf-desc {
  font-size: .9rem;
  color: var(--color-text-muted);
  line-height: 1.65;
}
.nf-actions {
  display: flex;
  gap: .75rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: .5rem;
}
</style>
