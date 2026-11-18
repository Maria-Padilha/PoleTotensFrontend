<template>
  <div class="lf" :class="{ 'lf-dark': dark }" :style="{ '--lf-accent': accent }">
    <label v-for="field in fields" :key="field.key" class="lf-field">
      <span class="lf-label">{{ field.label }}</span>
      <span class="lf-box">
        <span class="lf-icon"><component :is="field.icon" :size="22" /></span>
        <input
          class="lf-input"
          type="text"
          :value="field.value"
          :placeholder="field.placeholder"
          :maxlength="field.maxlength"
          :inputmode="field.inputmode"
          :data-kb="field.kb"
          :data-mask="field.masked ? '1' : undefined"
          :required="field.required"
          :readonly="kiosk"
          :data-osk="kiosk ? '1' : undefined"
          v-bind="NO_AUTOFILL"
          :name="field.name"
          @input="onInput(field, $event)"
        />
      </span>
    </label>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { User, Phone, Mail, AtSign } from '@lucide/vue'
import { maskPhone, maskHandle, maskEmail, maskName } from '@/utils/masks'

const props = defineProps({
  // nome de quem vai jogar
  name: { type: String, default: '' },
  // { phone, email, instagram }
  lead: { type: Object, required: true },
  // tema escuro do jogo (campos de vidro claro) ou claro
  dark: { type: Boolean, default: false },
  accent: { type: String, default: '#10939b' },
  // totem: campos somente leitura pro navegador (o Chrome não oferece preenchimento automático
  // neles); quem digita é o teclado na tela
  kiosk: { type: Boolean, default: false },
})
const emit = defineEmits(['update:name', 'update:lead'])

// Impede o menu de preenchimento automático (Google/Chrome, gerenciadores de senha): nome de campo
// aleatório, tipo texto (type=tel/email chama o autofill de contato) e as dicas de cada gerenciador.
const NO_AUTOFILL = {
  autocomplete: 'off',
  autocorrect: 'off',
  autocapitalize: 'off',
  spellcheck: 'false',
  'data-lpignore': 'true',
  'data-1p-ignore': 'true',
  'data-bwignore': 'true',
  'data-form-type': 'other',
}
const salt = Math.random().toString(36).slice(2, 8)

const fields = computed(() => [
  { key: 'name', label: 'Nome', icon: User, value: props.name, placeholder: 'Seu nome completo', maxlength: 60, mask: maskName, name: `n-${salt}-a`, required: true },
  { key: 'phone', label: 'Telefone', icon: Phone, value: props.lead.phone || '', placeholder: '(00) 00000-0000', maxlength: 15, mask: maskPhone, inputmode: 'tel', kb: 'numeric', masked: true, name: `n-${salt}-b`, required: true },
  { key: 'email', label: 'E-mail', icon: Mail, value: props.lead.email || '', placeholder: 'seuemail@exemplo.com', maxlength: 120, mask: maskEmail, inputmode: 'email', kb: 'email', name: `n-${salt}-c` },
  { key: 'instagram', label: 'Instagram', icon: AtSign, value: props.lead.instagram || '', placeholder: '@seuusuario', maxlength: 31, mask: maskHandle, kb: 'handle', masked: true, name: `n-${salt}-d` },
])

function onInput(field, event) {
  const raw = event.target.value
  const masked = field.mask(raw)
  if (masked !== raw) event.target.value = masked
  if (field.key === 'name') emit('update:name', masked)
  else emit('update:lead', { ...props.lead, [field.key]: masked })
}
</script>

<style scoped>
.lf {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 1.15rem;
  text-align: left;
}

.lf-label {
  display: block;
  margin: 0 0 0.45rem 0.4rem;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(43, 43, 43, 0.55);
}

.lf-box {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.55rem 1.1rem 0.55rem 0.55rem;
  border: 2px solid rgba(43, 43, 43, 0.1);
  border-radius: 1.4rem;
  background: #ffffff;
  box-shadow: 0 10px 26px -18px rgba(0, 0, 0, 0.45);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.lf-box:focus-within {
  border-color: var(--lf-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--lf-accent) 22%, transparent), 0 10px 26px -18px rgba(0, 0, 0, 0.45);
}

.lf-icon {
  display: flex;
  height: 3.3rem;
  width: 3.3rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: color-mix(in srgb, var(--lf-accent) 16%, transparent);
  color: var(--lf-accent);
}

.lf-input {
  min-width: 0;
  flex: 1;
  border: 0;
  background: transparent;
  padding: 0.5rem 0;
  font-size: clamp(1.35rem, 2.6vw, 1.9rem);
  font-weight: 600;
  color: #2b2b2b;
  outline: none;
}
.lf-input::placeholder {
  font-weight: 400;
  color: rgba(43, 43, 43, 0.32);
}

/* tema escuro: vidro claro sobre fundo escuro */
.lf-dark .lf-label {
  color: rgba(255, 255, 255, 0.62);
}
.lf-dark .lf-box {
  border-color: rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
.lf-dark .lf-icon {
  background: color-mix(in srgb, var(--lf-accent) 34%, transparent);
  color: #ffffff;
}
.lf-dark .lf-input {
  color: #ffffff;
}
.lf-dark .lf-input::placeholder {
  color: rgba(255, 255, 255, 0.38);
}
</style>
