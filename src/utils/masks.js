// Máscaras dos campos de cadastro (leads). Cada função recebe o que foi digitado e devolve o
// valor já formatado; são idempotentes (aplicar de novo não muda nada).

// (65) 98439-1860  ou  (65) 3333-4444
export function maskPhone(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

// @usuario  — minúsculas, só letras/números/ponto/underscore, até 30 caracteres, sempre com @
export function maskHandle(value) {
  const handle = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, 30)
  return handle ? `@${handle}` : ''
}

// e-mail: minúsculas e sem espaços
export function maskEmail(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s/g, '')
    .slice(0, 120)
}

// nome: só letras, espaço, apóstrofo, ponto e hífen (sem números/símbolos), sem espaços duplos
export function maskName(value) {
  return String(value || '')
    .replace(/[^\p{L}\s'.-]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s+/, '')
    .slice(0, 60)
}
