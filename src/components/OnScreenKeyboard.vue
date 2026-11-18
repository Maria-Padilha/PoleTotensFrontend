<template>
  <Teleport to="body">
  <Transition name="osk">
    <div
      v-if="visible"
      ref="board"
      class="osk fixed inset-x-0 bottom-0 z-[100] select-none px-3 pb-4 pt-3 sm:px-6 sm:pb-6"
      role="application"
      aria-label="Teclado na tela"
      @pointerdown.prevent
    >
      <div class="mx-auto flex w-full max-w-5xl flex-col gap-2.5">
        <!-- barra de cima: o que está sendo digitado + esconder -->
        <div class="flex items-center justify-between px-1 text-sm font-bold uppercase tracking-[0.2em] text-white/60 sm:text-base">
          <span class="inline-flex items-center gap-2"><Keyboard :size="18" /> {{ hint }}</span>
          <button type="button" class="osk-hide" aria-label="Esconder teclado" @pointerdown.prevent="dismiss">
            <ChevronDown :size="22" /> Esconder
          </button>
        </div>

        <!-- teclado numérico (telefone) -->
        <template v-if="mode === 'numeric'">
          <div v-for="(row, r) in NUMPAD" :key="r" class="flex gap-2.5">
            <button
              v-for="key in row"
              :key="key"
              type="button"
              class="osk-key osk-num"
              @pointerdown.prevent="type(key)"
            >{{ key }}</button>
          </div>
          <div class="flex gap-2.5">
            <button type="button" class="osk-key osk-num osk-fn" aria-label="Apagar" @pointerdown.prevent="startBackspace" @pointerup="stopBackspace" @pointerleave="stopBackspace" @pointercancel="stopBackspace">
              <Delete :size="30" />
            </button>
            <button type="button" class="osk-key osk-num" @pointerdown.prevent="type('0')">0</button>
            <button type="button" class="osk-key osk-num osk-go" @pointerdown.prevent="done">{{ goLabel }}</button>
          </div>
        </template>

        <!-- teclado de letras / símbolos / acentos -->
        <template v-else>
          <div v-for="(row, r) in rows" :key="`${layer}-${r}`" class="flex justify-center gap-2" :class="r === 2 && layer === 'letters' ? '' : ''">
            <button
              v-if="r === rows.length - 1 && layer !== 'symbols'"
              type="button"
              class="osk-key osk-fn osk-wide"
              :class="shift !== 'off' ? 'osk-active' : ''"
              aria-label="Maiúsculas"
              @pointerdown.prevent="cycleShift"
            >
              <ArrowBigUpDash v-if="shift === 'caps'" :size="28" />
              <ArrowBigUp v-else :size="28" />
            </button>
            <button
              v-for="key in row"
              :key="key"
              type="button"
              class="osk-key"
              @pointerdown.prevent="type(display(key))"
            >{{ display(key) }}</button>
            <button
              v-if="r === rows.length - 1"
              type="button"
              class="osk-key osk-fn osk-wide"
              aria-label="Apagar"
              @pointerdown.prevent="startBackspace"
              @pointerup="stopBackspace"
              @pointerleave="stopBackspace"
              @pointercancel="stopBackspace"
            >
              <Delete :size="30" />
            </button>
          </div>

          <!-- linha de baixo -->
          <div class="flex gap-2">
            <button v-if="layer === 'letters'" type="button" class="osk-key osk-fn osk-wide" @pointerdown.prevent="layer = 'symbols'">123</button>
            <button v-else type="button" class="osk-key osk-fn osk-wide" @pointerdown.prevent="layer = 'letters'">ABC</button>
            <button v-if="layer === 'letters'" type="button" class="osk-key osk-fn" @pointerdown.prevent="layer = 'accents'">áé</button>
            <button v-else-if="layer === 'accents'" type="button" class="osk-key osk-fn" @pointerdown.prevent="layer = 'symbols'">123</button>
            <button v-else type="button" class="osk-key osk-fn" @pointerdown.prevent="layer = 'accents'">áé</button>

            <button v-if="showAt" type="button" class="osk-key" @pointerdown.prevent="type('@')">@</button>
            <button v-if="kind === 'handle'" type="button" class="osk-key" @pointerdown.prevent="type('_')">_</button>
            <button type="button" class="osk-key osk-space" @pointerdown.prevent="type(' ')">espaço</button>
            <button type="button" class="osk-key" @pointerdown.prevent="type('.')">.</button>
            <button v-if="kind === 'email'" type="button" class="osk-key osk-fn" @pointerdown.prevent="type('.com')">.com</button>
            <button type="button" class="osk-key osk-go osk-wide" @pointerdown.prevent="done">{{ goLabel }}</button>
          </div>
        </template>
      </div>
    </div>
  </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Delete, ArrowBigUp, ArrowBigUpDash, ChevronDown, Keyboard } from '@lucide/vue'

// Teclado na tela pro totem (sem teclado físico). Abre ao tocar em qualquer campo de
// texto da página e digita direto nele (o v-model da tela continua funcionando).
// Os botões usam pointerdown.prevent pra o campo não perder o foco ao tocar.

const NUMPAD = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']]
const LETTERS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ç'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
]
const SYMBOLS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['-', '/', ':', ';', '(', ')', '&', '@', '"', '#'],
  ['_', ',', '?', '!', "'", '+', '='],
]
const ACCENTS = [
  ['á', 'é', 'í', 'ó', 'ú', 'ã', 'õ'],
  ['à', 'è', 'â', 'ê', 'ô', 'ç', 'ü'],
  ['ñ', 'ì', 'ò', 'ù', 'î', 'û'],
]
const TEXT_TYPES = ['text', 'password', 'email', 'tel', 'search', 'number', 'url', '']

const visible = ref(false)
const layer = ref('letters') // letters | symbols | accents
const shift = ref('off') // off | once | caps
const board = ref(null)
let target = null
// `target` não é reativo; este contador faz os computed recalcularem ao trocar de campo
const focusTick = ref(0)
let repeatTimer = null
let repeatStart = null

// que tipo de campo está em foco decide o teclado
const kind = computed(() => {
  focusTick.value
  if (!target) return 'text'
  const type = (target.getAttribute('type') || 'text').toLowerCase()
  const forced = target.dataset.kb
  if (forced) return forced
  if (type === 'tel' || type === 'number' || target.getAttribute('inputmode') === 'numeric') return 'numeric'
  if (type === 'email') return 'email'
  if (type === 'password') return 'password'
  return 'text'
})
// atenção: "inputmode" é trocado pra "none" ao focar (pra não abrir o teclado do sistema), então
// o tipo numérico precisa ser guardado antes disso:
const mode = computed(() => (kind.value === 'numeric' ? 'numeric' : 'keys'))
const showAt = computed(() => kind.value === 'email' || kind.value === 'handle')
const hint = computed(() => ({ numeric: 'Digite o número', email: 'Digite o e-mail', password: 'Digite a senha', handle: 'Digite o usuário' })[kind.value] || 'Digite')
const goLabel = computed(() => {
  focusTick.value
  return hasNext() ? 'Próximo' : 'Pronto'
})

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

const rows = computed(() => {
  if (layer.value === 'symbols') return SYMBOLS
  if (layer.value === 'accents') return ACCENTS
  // e-mail, usuário e senha usam números o tempo todo: linha de números sempre à mão
  return ['email', 'handle', 'password'].includes(kind.value) ? [DIGITS, ...LETTERS] : LETTERS
})

function display(key) {
  if (layer.value === 'letters' || layer.value === 'accents') {
    return shift.value !== 'off' && key.length === 1 ? key.toLocaleUpperCase('pt-BR') : key
  }
  return key
}

function cycleShift() {
  shift.value = shift.value === 'off' ? 'once' : shift.value === 'once' ? 'caps' : 'off'
}

// nomes ganham maiúscula no começo e depois de espaço; e-mail, senha e usuário não
function wantsAutoCap() {
  return target && ['text'].includes(kind.value)
}
function applyAutoCap() {
  if (shift.value === 'caps') return
  if (!wantsAutoCap()) { shift.value = 'off'; return }
  const value = target.value || ''
  shift.value = value === '' || /\s$/.test(value) ? 'once' : 'off'
}

function setValue(el, value) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  setter.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

function caret(el) {
  let start = null
  let end = null
  try {
    start = el.selectionStart
    end = el.selectionEnd
  } catch (err) {
    // type=email/number não expõem seleção
  }
  const length = el.value.length
  return start === null ? [length, length] : [start, end]
}

function setCaret(el, pos) {
  try {
    el.setSelectionRange(pos, pos)
  } catch (err) {
    // sem suporte nesse tipo de campo
  }
}

function type(text) {
  if (!target) return
  const el = target
  const [start, end] = caret(el)
  const next = el.value.slice(0, start) + text + el.value.slice(end)
  if (el.maxLength > 0 && next.length > el.maxLength) return
  setValue(el, next)
  // campo com máscara (telefone, @usuário): a máscara reescreve o valor, então digita sempre no fim
  setCaret(el, el.dataset.mask ? el.value.length : start + text.length)
  if (shift.value === 'once') shift.value = 'off'
  applyAutoCap()
}

function backspace() {
  if (!target) return false
  const el = target
  const [start, end] = caret(el)
  if (start === 0 && end === 0) return false
  const from = start === end ? start - 1 : start
  setValue(el, el.value.slice(0, from) + el.value.slice(end))
  setCaret(el, el.dataset.mask ? el.value.length : from)
  applyAutoCap()
  return true
}

// segurar o apagar repete
function startBackspace() {
  backspace()
  stopBackspace()
  repeatStart = setTimeout(() => {
    repeatTimer = setInterval(() => {
      if (!backspace()) stopBackspace()
    }, 70)
  }, 420)
}
function stopBackspace() {
  clearTimeout(repeatStart)
  clearInterval(repeatTimer)
  repeatStart = null
  repeatTimer = null
}

function nextField() {
  if (!target?.form) return null
  const fields = [...target.form.querySelectorAll('input')].filter((i) => !i.disabled && i.type !== 'hidden' && i.offsetParent !== null && TEXT_TYPES.includes((i.getAttribute('type') || 'text').toLowerCase()))
  const index = fields.indexOf(target)
  return index >= 0 ? fields[index + 1] || null : null
}
function hasNext() {
  return Boolean(nextField())
}

function done() {
  const next = nextField()
  if (next) {
    next.focus()
    open(next)
    return
  }
  const form = target?.form
  const el = target
  hide()
  el?.blur()
  if (form) form.requestSubmit()
}

// "Esconder": além de fechar, tira o foco do campo — senão ele continuaria focado e o teclado
// reabriria sozinho assim que a tela mudasse
function dismiss() {
  const el = target
  hide()
  el?.blur()
}

function hide() {
  stopBackspace()
  visible.value = false
}

// ---- foco nos campos ----
function isTextField(el) {
  return el instanceof HTMLInputElement && TEXT_TYPES.includes((el.getAttribute('type') || 'text').toLowerCase()) && (!el.readOnly || Boolean(el.dataset.osk)) && !el.disabled
}

function open(el) {
  // guarda o tipo numérico e impede o teclado do sistema (touch) de abrir junto
  if (el.getAttribute('inputmode') === 'tel' || el.getAttribute('inputmode') === 'numeric') el.dataset.kb = el.dataset.kb || 'numeric'
  el.setAttribute('inputmode', 'none')

  const changed = target !== el
  target = el
  focusTick.value += 1
  if (changed || !visible.value) {
    layer.value = 'letters'
    shift.value = 'off'
  }
  visible.value = true
  applyAutoCap()
  revealField()
}

function onFocusIn(event) {
  if (isTextField(event.target)) open(event.target)
}

// tocar num campo que já estava focado (ex: depois de "Esconder") não gera novo focusin
function onClick(event) {
  const el = event.target
  if (isTextField(el) && !visible.value) open(el)
}

// campos com autofocus que aparecem depois (próxima etapa do totem) já nascem focados
let observer = null
function syncWithActiveElement() {
  // o campo saiu da tela (ex: etapa seguinte do totem) ou o foco foi pra outro lugar: fecha
  if (visible.value && (!target || !target.isConnected || !isTextField(document.activeElement))) {
    hide()
    return
  }
  const el = document.activeElement
  if (isTextField(el) && (!visible.value || target !== el) && el.offsetParent !== null) open(el)
}

function onFocusOut() {
  // some quando o foco vai pra algo que não é campo (o teclado não rouba foco)
  setTimeout(() => {
    if (!isTextField(document.activeElement)) hide()
  }, 120)
}

// Sobe o conteúdo da tela (sem rolagem) o suficiente pra o campo — e o botão de baixo, se couber —
// ficarem acima do teclado. Medições incluem o deslocamento atual, por isso somamos `shift`.
let liftPx = 0

function appRoot() {
  return document.getElementById('app')
}

function applyShift(value) {
  liftPx = value
  const root = appRoot()
  if (!root) return
  root.style.transition = 'transform 0.25s ease'
  root.style.transform = value > 0 ? `translateY(-${value}px)` : ''
}

async function revealField() {
  await nextTick()
  if (!target) return
  const height = board.value?.offsetHeight || 0
  const available = window.innerHeight - height - 16
  const field = target.getBoundingClientRect()
  const anchor = (target.form || target).getBoundingClientRect()

  // posição natural (sem deslocamento) do campo e da base do formulário
  const fieldTop = field.top + liftPx
  const fieldBottom = field.bottom + liftPx
  const anchorBottom = anchor.bottom + liftPx
  // prefere mostrar o formulário todo; se não couber, garante só o campo
  const needed = anchorBottom - fieldTop < available - 60 ? anchorBottom : fieldBottom
  const next = Math.min(Math.max(0, needed - available + 8), Math.max(0, fieldTop - 16))
  applyShift(next)
}

watch(visible, (open) => {
  if (!open) applyShift(0)
})

// Campos do totem são somente leitura (pra o Chrome não oferecer preenchimento automático), então
// um teclado físico conectado não escreveria neles sozinho: repassa as teclas pro mesmo caminho.
function onPhysicalKey(event) {
  if (!visible.value || !target || !target.readOnly || event.ctrlKey || event.metaKey || event.altKey) return
  if (event.key === 'Backspace') {
    event.preventDefault()
    backspace()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    done()
  } else if (event.key.length === 1) {
    event.preventDefault()
    type(event.key)
  }
}

onMounted(() => {
  document.addEventListener('keydown', onPhysicalKey)
  document.addEventListener('focusin', onFocusIn)
  document.addEventListener('focusout', onFocusOut)
  document.addEventListener('click', onClick, true)
  syncWithActiveElement()
  observer = new MutationObserver(() => setTimeout(syncWithActiveElement, 60))
  observer.observe(document.body, { childList: true, subtree: true })
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onPhysicalKey)
  document.removeEventListener('focusin', onFocusIn)
  document.removeEventListener('focusout', onFocusOut)
  document.removeEventListener('click', onClick, true)
  observer?.disconnect()
  stopBackspace()
  applyShift(0)
})
</script>

<style scoped>
.osk {
  background: linear-gradient(180deg, rgba(9, 28, 31, 0.9), rgba(5, 18, 20, 0.97));
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-top: 1.5px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 -20px 50px -20px rgba(0, 0, 0, 0.6);
}

.osk-key {
  display: flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: clamp(3.4rem, 6.4vw, 5rem);
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: clamp(1.35rem, 2.8vw, 2.1rem);
  font-weight: 600;
  line-height: 1;
  transition: background 0.08s ease, transform 0.08s ease;
  touch-action: manipulation;
}
.osk-key:active {
  transform: scale(0.94);
  background: rgba(255, 255, 255, 0.3);
}
.osk-fn {
  background: rgba(255, 255, 255, 0.07);
  font-size: clamp(1.05rem, 2.2vw, 1.6rem);
}
.osk-wide {
  flex: 1.5 1 0;
}
.osk-space {
  flex: 5 1 0;
  font-size: clamp(1rem, 2vw, 1.4rem);
  font-weight: 500;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.7);
}
.osk-active {
  background: #ffffff;
  color: #0b1f23;
}
.osk-go {
  background: #10939b;
  font-weight: 800;
  flex: 2 1 0;
}
.osk-go:active {
  background: #0f6971;
}
.osk-num {
  height: clamp(4rem, 7.4vw, 5.8rem);
  font-size: clamp(1.8rem, 3.6vw, 2.8rem);
}

.osk-hide {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  color: #fff;
}

.osk-enter-active,
.osk-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}
.osk-enter-from,
.osk-leave-to {
  transform: translateY(40%);
  opacity: 0;
}
</style>
