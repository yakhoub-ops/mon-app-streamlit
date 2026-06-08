<template>
  <div
    class="media-viewer"
    :class="[`media-viewer--${fit}`, { 'media-viewer--loaded': loaded, 'media-viewer--error': errored }]"
    :style="ratioStyle"
    ref="rootEl"
  >
    <!-- Placeholder / shimmer avant chargement -->
    <div v-if="!loaded && !errored" class="media-placeholder sk-shimmer" />

    <!-- IMAGE -->
    <img
      v-if="isImage && !errored"
      :src="lazy ? (visible ? src : undefined) : src"
      :alt="alt"
      class="media-img"
      :class="{ 'media-img--visible': loaded }"
      @load="loaded = true"
      @error="errored = true"
    />

    <!-- VIDEO -->
    <video
      v-else-if="isVideo && !errored"
      :src="lazy ? (visible ? src : undefined) : src"
      class="media-video"
      :class="{ 'media-video--visible': loaded }"
      :autoplay="autoplay"
      :loop="loop"
      :muted="muted"
      :controls="controls"
      :playsinline="true"
      @canplay="loaded = true"
      @error="errored = true"
    />

    <!-- FALLBACK -->
    <div v-if="errored" class="media-fallback">
      <slot name="fallback">
        <ImageOff :size="28" style="opacity:.35" />
        <span>Média indisponible</span>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ImageOff } from 'lucide-vue-next'

const props = defineProps({
  src:      { type: String, required: true },
  alt:      { type: String, default: '' },
  ratio:    { type: String, default: '' },    // ex: '16/9' | '4/3' | '' (auto)
  fit:      { type: String, default: 'cover' }, // cover | contain | fill
  lazy:     { type: Boolean, default: true },
  autoplay: { type: Boolean, default: false },
  loop:     { type: Boolean, default: false },
  muted:    { type: Boolean, default: true },
  controls: { type: Boolean, default: false },
})

const loaded  = ref(false)
const errored = ref(false)
const visible = ref(!props.lazy)
const rootEl  = ref(null)
let   observer = null

const VIDEO_EXT = /\.(mp4|webm|ogg|mov)$/i
const isVideo   = computed(() => VIDEO_EXT.test(props.src))
const isImage   = computed(() => !isVideo.value)

const ratioStyle = computed(() => props.ratio
  ? { aspectRatio: props.ratio.replace('/', ' / ') }
  : {}
)

onMounted(() => {
  if (!props.lazy) return
  observer = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) { visible.value = true; observer?.disconnect() } },
    { rootMargin: '200px' }
  )
  if (rootEl.value) observer.observe(rootEl.value)
})

onUnmounted(() => observer?.disconnect())
</script>

<style scoped>
.media-viewer {
  position: relative;
  overflow: hidden;
  background: var(--color-surface-2, #F1F5F9);
  border-radius: inherit;
  width: 100%;
}

.media-placeholder {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  transition: opacity .3s;
}
.media-viewer--loaded .media-placeholder { opacity: 0; pointer-events: none; }

.media-img,
.media-video {
  width: 100%;
  height: 100%;
  display: block;
  opacity: 0;
  transition: opacity .4s ease;
}
.media-img--visible,
.media-video--visible { opacity: 1; }

/* fit variants */
.media-viewer--cover  .media-img,
.media-viewer--cover  .media-video { object-fit: cover; }
.media-viewer--contain .media-img,
.media-viewer--contain .media-video { object-fit: contain; }
.media-viewer--fill   .media-img,
.media-viewer--fill   .media-video { object-fit: fill; }

.media-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  color: var(--color-text-muted);
  font-size: .82rem;
}

/* shimmer réutilisé */
.sk-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-surface-2, #F1F5F9) 25%,
    var(--color-border, #E2E8F0) 50%,
    var(--color-surface-2, #F1F5F9) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
