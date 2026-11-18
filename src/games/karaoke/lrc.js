// Parser de letra sincronizada. Aceita (e pode misturar):
//
// 1) LRC por frase, tempo e texto na mesma linha:
//      [00:12.40] texto da frase
//      [00:12.40][01:30.00] linha que repete (vários tempos na mesma linha)
//
// 2) LRC "enhanced" com tempo por PALAVRA (o formato do karaokê de verdade):
//      [00:12.40]<00:12.40>primeira <00:13.10>segunda <00:13.45>terceira
//    Cada palavra acende exatamente no tempo marcado.
//
// 3) Blocos "tempo numa linha, texto embaixo" (m:ss ou h:mm:ss). Parágrafos
//    longos são quebrados em frases e o tempo do bloco é distribuído entre elas.
//
// Tags de metadados ([ar:...], [ti:...]) são ignoradas. Tempo sem texto — ou com
// "[Instrumental]", "(solo)", "♪" — vira uma "pausa": não conta pra nota.

const LRC_TAG = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g
const WORD_TAG = /<(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?>([^<]*)/g
const BLOCK_TIME = /^\s*(?:(\d+):)?(\d{1,3}):(\d{2})(?:[.,]\d+)?\s*$/

// Ritmo médio de canto usado só quando não há tempo por palavra.
const CHARS_PER_SECOND = 8
const MAX_CHUNK_CHARS = 38
const MIN_CHUNK_CHARS = 12
const MIN_GAP_SECONDS = 2
const SECONDS_PER_SYLLABLE = 0.4
const SING_SHARE_OF_WINDOW = 0.9

// "[Instrumental]", "(solo)", "♪" etc. não são letra: viram pausa.
function stageDirection(text) {
  return (
    /^[[(].*[\])]$/.test(text) ||
    /^[♪♫\s]+$/.test(text) ||
    /^(instrumental|intro|solo|outro)$/i.test(text)
  )
}

function lrcSeconds(min, sec, frac) {
  const fraction = frac ? Number(`0.${frac}`) : 0
  return Number(min) * 60 + Number(sec) + fraction
}

function blockSeconds(hours, min, sec) {
  return Number(hours || 0) * 3600 + Number(min) * 60 + Number(sec)
}

// Quebra um parágrafo em frases de tamanho cantável: primeiro em . ! ? ;
// depois em vírgulas, e por fim no espaço mais próximo do meio.
function splitIntoChunks(text) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return []

  const splitLong = (piece) => {
    if (piece.length <= MAX_CHUNK_CHARS) return [piece]

    const byComma = piece.split(/(?<=,)\s+/)
    if (byComma.length > 1) return byComma.flatMap(splitLong)

    const middle = Math.floor(piece.length / 2)
    let cut = piece.lastIndexOf(' ', middle)
    if (cut < MIN_CHUNK_CHARS) cut = piece.indexOf(' ', middle)
    if (cut <= 0) return [piece]
    return [...splitLong(piece.slice(0, cut)), ...splitLong(piece.slice(cut + 1))]
  }

  const pieces = normalized.split(/(?<=[.!?;])\s+/).flatMap(splitLong)

  const merged = []
  for (const piece of pieces) {
    const last = merged[merged.length - 1]
    if (last !== undefined && last.length < MIN_CHUNK_CHARS) merged[merged.length - 1] = `${last} ${piece}`
    else merged.push(piece)
  }
  return merged
}

function expandBlock(block, nextTime) {
  const chunks = splitIntoChunks(block.text)
  if (!chunks.length) return [{ time: block.time, text: '' }]

  const totalChars = chunks.reduce((sum, c) => sum + c.length, 0)
  const blockDuration = nextTime === null ? Infinity : nextTime - block.time
  const singDuration = Math.min(blockDuration, totalChars / CHARS_PER_SECOND)

  const entries = []
  let elapsedChars = 0
  for (const chunk of chunks) {
    entries.push({ time: block.time + (elapsedChars / totalChars) * singDuration, text: chunk })
    elapsedChars += chunk.length
  }

  if (nextTime !== null && nextTime - (block.time + singDuration) > MIN_GAP_SECONDS) {
    entries.push({ time: block.time + singDuration, text: '' })
  }
  return entries
}

// Texto depois das tags de linha -> { text, words } (words só existe se a
// linha trouxe <tempo> por palavra).
function parseLineBody(body, lineTime) {
  WORD_TAG.lastIndex = 0
  const words = []
  let match
  while ((match = WORD_TAG.exec(body)) !== null) {
    const text = match[4].trim()
    if (text) words.push({ time: lrcSeconds(match[1], match[2], match[3]), text })
  }

  if (!words.length) return { text: body.trim() }

  // texto solto antes da primeira tag de palavra vira a primeira palavra, no tempo da linha
  const leading = body.slice(0, body.indexOf('<')).trim()
  if (leading) words.unshift({ time: lineTime, text: leading })

  return { text: words.map((w) => w.text).join(' '), words }
}

export function parseLrc(source) {
  const entries = []
  const blocks = []
  let openBlock = null

  for (const rawLine of String(source || '').split(/\r?\n/)) {
    const times = []
    LRC_TAG.lastIndex = 0
    let match
    while ((match = LRC_TAG.exec(rawLine)) !== null) {
      times.push(lrcSeconds(match[1], match[2], match[3]))
    }

    if (times.length) {
      openBlock = null
      const body = rawLine.replace(LRC_TAG, '')
      const parsed = parseLineBody(body, times[0])
      const isPause = !parsed.text || stageDirection(parsed.text)
      for (const time of times) {
        entries.push(isPause ? { time, text: '' } : { time, text: parsed.text, words: parsed.words })
      }
      continue
    }

    const blockMatch = rawLine.match(BLOCK_TIME)
    if (blockMatch) {
      openBlock = { time: blockSeconds(blockMatch[1], blockMatch[2], blockMatch[3]), text: '' }
      blocks.push(openBlock)
      continue
    }

    if (openBlock && rawLine.trim()) openBlock.text += ` ${rawLine.trim()}`
  }

  blocks.sort((a, b) => a.time - b.time)
  blocks.forEach((block, i) => {
    const next = blocks[i + 1]
    entries.push(...expandBlock(block, next ? next.time : null))
  })

  entries.sort((a, b) => a.time - b.time)
  return entries
}

function syllables(word) {
  const groups = word.toLowerCase().match(/[aeiouáéíóúâêôãõàü]+/g)
  return Math.max(1, groups ? groups.length : 1)
}

// Sem tempo por palavra: estima por sílaba, ocupando no máximo 90% da janela
// da frase (quem canta respira e sustenta nota — não usa o tempo todo).
function estimateWords(text, time, end) {
  const words = text.split(' ')
  const weights = words.map(syllables)
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  const singTime = Math.min((end - time) * SING_SHARE_OF_WINDOW, Math.max(1, totalWeight * SECONDS_PER_SYLLABLE))

  let before = 0
  return words.map((word, i) => {
    const start = time + (before / totalWeight) * singTime
    before += weights[i]
    return { text: word, start, end: time + (before / totalWeight) * singTime }
  })
}

// Com tempo por palavra: cada palavra vai do seu tempo até o da próxima; a
// última dura o necessário pras sílabas dela, sem passar do fim da frase.
function timedWords(words, end) {
  return words.map((word, i) => {
    const next = words[i + 1]
    const natural = word.time + Math.max(0.5, syllables(word.text) * 0.45)
    const wordEnd = next ? next.time : Math.min(end, natural)
    return { text: word.text, start: word.time, end: Math.max(wordEnd, word.time + 0.1) }
  })
}

// Cada linha ganha `end` (início da próxima; a última dura até `lastLineSeconds`
// ou o fim da música) e `words` [{ text, start, end }] — o que o jogo usa pra
// acender cada palavra na hora certa.
export function buildLyricLines(source, duration = 0, lastLineSeconds = 6) {
  const entries = parseLrc(source)

  return entries.map((entry, i) => {
    const next = entries[i + 1]
    let end = next ? next.time : entry.time + lastLineSeconds
    if (!next && duration > entry.time) end = Math.min(end, duration)
    end = Math.max(end, entry.time + 0.5)

    let words = []
    if (entry.text) {
      words = entry.words ? timedWords(entry.words, end) : estimateWords(entry.text, entry.time, end)
    }
    return { time: entry.time, end, text: entry.text, words }
  })
}

// Texto -> lista de frases cantáveis (uma por linha), sem tempos. É o que o
// sincronizador usa pra o organizador marcar o início de cada palavra.
export function lyricsToPlainLines(source) {
  return parseLrc(source)
    .filter((entry) => entry.text)
    .map((entry) => entry.text)
}

function formatTime(seconds) {
  const total = Math.max(0, seconds)
  const min = Math.floor(total / 60)
  const sec = Math.floor(total % 60)
  const centis = Math.round((total - Math.floor(total)) * 100) % 100
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
}

// Marcas do sincronizador -> LRC enhanced.
//   { time, text, line }  = início de uma palavra (line = índice da frase)
//   { time, pause: true } = instrumental
export function formatWordMarks(marks) {
  const out = []
  let current = null

  const flush = () => {
    if (!current) return
    const words = current.words.map((w) => `<${formatTime(w.time)}>${w.text}`).join(' ')
    out.push(`[${formatTime(current.words[0].time)}]${words}`)
    current = null
  }

  for (const mark of marks) {
    if (mark.pause) {
      flush()
      out.push(`[${formatTime(mark.time)}]`)
      continue
    }
    if (!current || current.line !== mark.line) {
      flush()
      current = { line: mark.line, words: [] }
    }
    current.words.push(mark)
  }
  flush()

  return out.join('\n')
}

// Diagnóstico da sincronia: aponta marcas fora de ordem e frases com tempo
// apertado demais pra serem cantadas (sinal de marcação errada naquele trecho).
const MAX_SINGABLE_CPS = 15

function mmss(seconds) {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${min}:${String(sec).padStart(2, '0')}`
}

export function analyzeLyrics(source) {
  const outOfOrder = []
  let previous = -Infinity
  for (const rawLine of String(source || '').split(/\r?\n/)) {
    LRC_TAG.lastIndex = 0
    const match = LRC_TAG.exec(rawLine)
    if (!match) continue
    const time = lrcSeconds(match[1], match[2], match[3])
    if (time < previous - 0.01) outOfOrder.push(mmss(time))
    previous = Math.max(previous, time)
  }

  const tight = buildLyricLines(source)
    .filter((line) => line.text && line.text.length / (line.end - line.time) > MAX_SINGABLE_CPS)
    .map((line) => mmss(line.time))

  return { outOfOrder, tight }
}

// Linhas prontas pra tocar: as de buildLyricLines com o ajuste fino da música
// (`offset`, em segundos; positivo atrasa a letra, negativo adianta) já somado
// aos tempos. É a mesma montagem usada no jogo e no "Testar sincronia".
export function buildPlayableLines(source, duration = 0, offset = 0) {
  const shift = Number(offset) || 0
  return buildLyricLines(source, duration).map((line) => ({
    ...line,
    time: line.time + shift,
    end: line.end + shift,
    words: line.words.map((word) => ({ ...word, start: word.start + shift, end: word.end + shift })),
  }))
}
