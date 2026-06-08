<template>
  <component
    :is="tag"
    v-bind="attrs"
    class="base-btn"
    :class="[`base-btn--${variant}`, `base-btn--${size}`, { 'base-btn--loading': loading, 'base-btn--icon-only': iconOnly }]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <!-- Ripple canvas -->
    <span class="base-btn__ripple" ref="rippleEl" />

    <!-- Loader -->
    <span v-if="loading" class="base-btn__spinner" />

    <!-- Left icon slot -->
    <span v-else-if="$slots.icon" class="base-btn__icon"><slot name="icon" /></span>

    <!-- Label -->
    <span v-if="!iconOnly" class="base-btn__label"><slot /></span>
  </component>
</template>

<script setup>
import { ref, computed, useAttrs } from 'vue'

const props = defineProps({
  variant:  { type: String, default: 'primary' },   // primary | secondary | danger | ghost | outline
  size:     { type: String, default: 'md' },         // sm | md | lg
  tag:      { type: String, default: 'button' },
  loading:  { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  iconOnly: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])
const rippleEl = ref(null)
const $attrs = useAttrs()

const attrs = computed(() => ({
  ...$attrs,
  type: props.tag === 'button' ? ($attrs.type || 'button') : undefined,
}))

function handleClick(e) {
  if (props.disabled || props.loading) return
  spawnRipple(e)
  emit('click', e)
}

function spawnRipple(e) {
  const el = rippleEl.value
  if (!el) return
  const btn  = el.parentElement
  const rect = btn.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 2
  const x    = e.clientX - rect.left - size / 2
  const y    = e.clientY - rect.top  - size / 2

  const span = document.createElement('span')
  span.style.cssText = `
    position:absolute;
    border-radius:50%;
    background:rgba(255,255,255,0.35);
    width:${size}px;height:${size}px;
    left:${x}px;top:${y}px;
    pointer-events:none;
    transform:scale(0);
    animation:ripple-anim .55s ease-out forwards;
  `
  el.appendChild(span)
  span.addEventListener('animationend', () => span.remove())
}
</script>

<style scoped>
/* ── Base ── */
.base-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .45em;
  font-family: var(--font-sans);
  font-weight: 600;
  letter-spacing: .01em;
  border: none;
  cursor: pointer;
  overflow: hidden;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background   .18s ease,
    box-shadow   .18s ease,
    transform    .15s ease,
    border-color .18s ease,
    color        .18s ease;
  border-radius: var(--radius-btn, .75rem);
  outline: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.base-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ── Hover / Active scale ── */
.base-btn:not(:disabled):hover  { transform: translateY(-1px) scale(1.015); }
.base-btn:not(:disabled):active { transform: translateY(0)    scale(.985);  }

/* ── Disabled ── */
.base-btn:disabled,
.base-btn--loading {
  opacity: .55;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* ── Sizes ── */
.base-btn--sm { height: 32px;  padding: 0 .875rem; font-size: .78rem; }
.base-btn--md { height: 40px;  padding: 0 1.25rem; font-size: .875rem; }
.base-btn--lg { height: 48px;  padding: 0 1.75rem; font-size: .975rem; }

.base-btn--icon-only.base-btn--sm { width: 32px;  padding: 0; }
.base-btn--icon-only.base-btn--md { width: 40px;  padding: 0; }
.base-btn--icon-only.base-btn--lg { width: 48px;  padding: 0; }

/* ── Variants ── */
.base-btn--primary {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 2px 10px rgba(14,159,142,.25);
}
.base-btn--primary:not(:disabled):hover {
  background: var(--color-primary-dark);
  box-shadow: 0 6px 20px rgba(14,159,142,.38);
}

.base-btn--secondary {
  background: var(--color-gold);
  color: #1a1000;
  box-shadow: 0 2px 10px rgba(230,184,0,.2);
}
.base-btn--secondary:not(:disabled):hover {
  background: #d4aa00;
  box-shadow: 0 6px 20px rgba(230,184,0,.35);
}

.base-btn--danger {
  background: var(--color-danger);
  color: #fff;
  box-shadow: 0 2px 10px rgba(220,38,38,.2);
}
.base-btn--danger:not(:disabled):hover {
  background: #b91c1c;
  box-shadow: 0 6px 20px rgba(220,38,38,.35);
}

.base-btn--ghost {
  background: transparent;
  color: var(--color-primary);
  border: 1.5px solid transparent;
}
.base-btn--ghost:not(:disabled):hover {
  background: rgba(14,159,142,.08);
  border-color: rgba(14,159,142,.2);
}

.base-btn--outline {
  background: transparent;
  color: var(--color-primary);
  border: 1.5px solid var(--color-primary);
}
.base-btn--outline:not(:disabled):hover {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 4px 14px rgba(14,159,142,.3);
}

/* ── Spinner ── */
.base-btn__spinner {
  width: 1em;
  height: 1em;
  border: 2px solid rgba(255,255,255,.35);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: btn-spin .65s linear infinite;
  flex-shrink: 0;
}

/* ── Ripple container ── */
.base-btn__ripple {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: inherit;
}

/* ── Icon ── */
.base-btn__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

@keyframes btn-spin {
  to { transform: rotate(360deg); }
}
</style>

<!-- Global ripple keyframe (injected once) -->
<style>
@keyframes ripple-anim {
  to { transform: scale(1); opacity: 0; }
}
</style>
