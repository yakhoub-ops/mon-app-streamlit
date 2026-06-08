<template>
  <div class="skeleton-card" :class="`skeleton-card--${variant}`" :style="{ height: height || undefined }">
    <!-- Header row -->
    <div v-if="variant === 'stat'" class="sk-stat">
      <div class="sk-icon sk-shimmer" />
      <div class="sk-lines">
        <div class="sk-line sk-shimmer" style="width:60%;height:1.5rem;border-radius:.4rem" />
        <div class="sk-line sk-shimmer" style="width:40%;height:.75rem;margin-top:.35rem" />
      </div>
    </div>

    <div v-else-if="variant === 'list-item'" class="sk-list-item">
      <div class="sk-avatar sk-shimmer" />
      <div class="sk-lines" style="flex:1">
        <div class="sk-line sk-shimmer" style="width:55%;height:.85rem" />
        <div class="sk-line sk-shimmer" style="width:35%;height:.7rem;margin-top:.4rem" />
      </div>
      <div class="sk-badge sk-shimmer" />
    </div>

    <div v-else-if="variant === 'table-row'" class="sk-table-row">
      <div v-for="w in cols" :key="w" class="sk-line sk-shimmer" :style="{ flex: w, height: '.8rem' }" />
    </div>

    <div v-else class="sk-generic">
      <div class="sk-line sk-shimmer" style="width:40%;height:1rem;margin-bottom:.75rem" />
      <div class="sk-line sk-shimmer" style="width:100%;height:.8rem;margin-bottom:.4rem" />
      <div class="sk-line sk-shimmer" style="width:80%;height:.8rem;margin-bottom:.4rem" />
      <div class="sk-line sk-shimmer" style="width:60%;height:.8rem" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'card' },  // card | stat | list-item | table-row
  height:  { type: String, default: '' },
  cols:    { type: Array,  default: () => [1, 2, 1, 1] },
})
</script>

<style scoped>
.skeleton-card {
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #E2E8F0);
  border-radius: var(--radius-card, 1rem);
  padding: 1.25rem;
}

/* shimmer wave */
.sk-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-surface-2, #F1F5F9) 25%,
    var(--color-border, #E2E8F0) 50%,
    var(--color-surface-2, #F1F5F9) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  border-radius: .4rem;
}

/* stat layout */
.sk-stat { display: flex; align-items: center; gap: 1rem; }
.sk-icon { width: 44px; height: 44px; border-radius: .75rem; flex-shrink: 0; }
.sk-lines { flex: 1; }

/* list-item */
.sk-list-item { display: flex; align-items: center; gap: .75rem; }
.sk-avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
.sk-badge { width: 64px; height: 22px; border-radius: 9999px; flex-shrink: 0; }

/* table-row */
.sk-table-row { display: flex; align-items: center; gap: 1rem; }

/* generic */
.sk-generic {}

.sk-line { display: block; }

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
