// Aparência da tela inicial do totem (personalizada por evento no painel).
// `resolveAppearance` junta o que o organizador escolheu com os padrões e já
// calcula as cores "automáticas" (que dependem de haver imagem de fundo).

// Fontes oferecidas. `weights` = pesos que a família realmente tem no Google
// Fonts (pedir um peso que não existe quebra o carregamento da família toda).
export const FONT_OPTIONS = [
  { name: 'Playfair Display', weights: [400, 500, 600, 700, 800, 900], sample: 'Elegante' },
  { name: 'Roboto', weights: [300, 400, 500, 700, 900], sample: 'Neutra' },
  { name: 'Montserrat', weights: [300, 400, 500, 600, 700, 800, 900], sample: 'Moderna' },
  { name: 'Poppins', weights: [300, 400, 500, 600, 700, 800, 900], sample: 'Arredondada' },
  { name: 'Raleway', weights: [300, 400, 500, 600, 700, 800, 900], sample: 'Fina' },
  { name: 'Lato', weights: [300, 400, 700, 900], sample: 'Amigável' },
  { name: 'Merriweather', weights: [300, 400, 700, 900], sample: 'Clássica' },
  { name: 'Oswald', weights: [300, 400, 500, 600, 700], sample: 'Impactante' },
  { name: 'Bebas Neue', weights: [400], sample: 'IMPACTO' },
  { name: 'Anton', weights: [400], sample: 'FORTE' },
  { name: 'Abril Fatface', weights: [400], sample: 'Destaque' },
  { name: 'Fredoka', weights: [300, 400, 500, 600, 700], sample: 'Divertida' },
  { name: 'Bangers', weights: [400], sample: 'Quadrinhos' },
  { name: 'Lobster', weights: [400], sample: 'Manuscrita' },
  { name: 'Pacifico', weights: [400], sample: 'Descontraída' },
  { name: 'Dancing Script', weights: [400, 500, 600, 700], sample: 'Cursiva' },
  { name: 'Archivo Narrow', weights: [400, 500, 600, 700], sample: 'Condensada', local: true },
]

export const WEIGHT_LABELS = {
  300: 'Leve',
  400: 'Normal',
  500: 'Médio',
  600: 'Semi-negrito',
  700: 'Negrito',
  800: 'Extra-negrito',
  900: 'Preto',
}

export const DEFAULT_APPEARANCE = {
  background_url: '',
  logo_url: '',
  overlay_opacity: 55,
  overlay_tone: 'dark',
  title_font: 'Playfair Display',
  title_weight: 700,
  title_color: '',
  title_spacing: -0.02,
  title_size: 100,
  text_font: 'Roboto',
  text_weight: 500,
  text_color: '',
  text_spacing: 0,
  accent_color: '#10939b',
  card_style: 'auto',
  welcome_text: 'Escolha um jogo pra começar',
  // visual da lista de jogos
  games_layout: 'auto', // auto | list | grid2 | grid3 | poster
  card_radius: 'round', // round | soft | square
  icon_size: 100, // % do tamanho padrão do ícone
  game_name_size: 100, // % do tamanho padrão do nome do jogo
  ranking_style: 'auto', // botões de ranking: auto (segue os cartões) | glass | accent
  show_game_type: true, // etiqueta com o tipo do jogo (ex.: "JOGO DA MEMÓRIA")
  title_glow: false, // brilho na cor de destaque em volta do título
  fx_float: false, // cartões flutuando de leve
  fx_shine: false, // brilho que atravessa os cartões
  fx_glow: false, // ícones e botões pulsando
  fx_particles: 'none', // none | bubbles | stars | confetti
}

export function fontOption(name) {
  return FONT_OPTIONS.find((f) => f.name === name) || null
}

// Pesos disponíveis pra uma fonte (se o peso salvo não existir nela, usa o mais próximo).
export function weightsFor(name) {
  return fontOption(name)?.weights || [400, 700]
}

export function nearestWeight(name, weight) {
  const list = weightsFor(name)
  return list.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best), list[0])
}

const loadedFonts = new Set()

// Injeta o CSS da fonte do Google Fonts uma vez só.
export function loadFont(name) {
  const option = fontOption(name)
  if (!option || option.local || loadedFonts.has(name)) return
  loadedFonts.add(name)

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@${option.weights.join(';')}&display=swap`
  document.head.appendChild(link)
}

export function fontStack(name) {
  const fallback = fontOption(name)?.sample === 'Manuscrita' ? 'cursive' : 'sans-serif'
  return `'${name}', ${fallback}`
}

export function resolveAppearance(raw) {
  const clean = {}
  for (const [key, value] of Object.entries(raw || {})) {
    if (value !== '' && value !== null && value !== undefined) clean[key] = value
  }
  const a = { ...DEFAULT_APPEARANCE, ...clean }

  const hasBg = Boolean(a.background_url)
  const onDarkBg = hasBg && a.overlay_tone === 'dark'

  return {
    ...a,
    hasBg,
    onDarkBg,
    title_weight: nearestWeight(a.title_font, Number(a.title_weight)),
    text_weight: nearestWeight(a.text_font, Number(a.text_weight)),
    titleColor: a.title_color || (onDarkBg ? '#ffffff' : hasBg ? '#16282b' : '#2b2b2b'),
    textColor: a.text_color || (onDarkBg ? 'rgba(255,255,255,0.88)' : hasBg ? '#2a393c' : '#555a5a'),
    cardStyle: a.card_style === 'auto' ? (hasBg ? 'glass' : 'light') : a.card_style,
  }
}

// Fundo da tela: imagem com cortina (escura ou clara) por cima, ou o degradê padrão.
export function backgroundStyle(ap) {
  if (!ap.hasBg) {
    return { background: 'radial-gradient(circle at 20% 15%, #d9e8e6 0%, #fcf8f5 48%, #f3eddf 100%)' }
  }
  const opacity = Number(ap.overlay_opacity) / 100
  const rgb = ap.overlay_tone === 'dark' ? '5, 22, 26' : '252, 248, 245'
  const top = `rgba(${rgb}, ${Math.max(0, opacity - 0.15).toFixed(2)})`
  const bottom = `rgba(${rgb}, ${Math.min(1, opacity + 0.15).toFixed(2)})`
  return {
    backgroundImage: `linear-gradient(${top}, ${bottom}), url(${ap.background_url})`,
    backgroundSize: 'cover, cover',
    backgroundPosition: 'center, center',
  }
}

// ---------------------------------------------------------------------------
// Tipografia dos jogos (config.typography). Mesmas chaves da aparência do evento:
// title_font/weight/color/spacing e text_font/weight/color/spacing. Valor vazio
// (''/null) = "usar o padrão do jogo".

export const TYPOGRAPHY_KEYS = [
  'title_font', 'title_weight', 'title_color', 'title_spacing', 'title_size',
  'text_font', 'text_weight', 'text_color', 'text_spacing',
]

function filled(value) {
  return value !== '' && value !== null && value !== undefined
}

// Variáveis CSS lidas pela classe .game-typo (main.css). Só entram as que o
// organizador definiu; as demais seguem o visual original de cada jogo.
export function typographyVars(typo) {
  const t = typo || {}
  const vars = {}
  if (filled(t.title_font)) vars['--gt-title-font'] = fontStack(t.title_font)
  if (filled(t.title_weight)) vars['--gt-title-weight'] = String(t.title_weight)
  if (filled(t.title_spacing)) vars['--gt-title-spacing'] = `${t.title_spacing}em`
  if (filled(t.title_size)) vars['--gt-title-scale'] = String(Number(t.title_size) / 100)
  if (filled(t.text_font)) vars['--gt-text-font'] = fontStack(t.text_font)
  if (filled(t.text_weight)) vars['--gt-text-weight'] = String(t.text_weight)
  if (filled(t.text_spacing)) vars['--gt-text-spacing'] = `${t.text_spacing}em`
  return vars
}

export function loadTypographyFonts(typo) {
  if (!typo) return
  if (filled(typo.title_font)) loadFont(typo.title_font)
  if (filled(typo.text_font)) loadFont(typo.text_font)
}

// O que a aparência do evento vira na configuração de um jogo (usado ao
// replicar os estilos do evento pros jogos, ou ao copiar dentro de um jogo).
export function gameConfigFromAppearance(raw) {
  const ap = resolveAppearance(raw)
  const config = {
    typography: {
      title_font: ap.title_font,
      title_weight: ap.title_weight,
      title_color: raw?.title_color || '',
      title_spacing: Number(ap.title_spacing),
      text_font: ap.text_font,
      text_weight: ap.text_weight,
      text_color: raw?.text_color || '',
      text_spacing: Number(ap.text_spacing),
    },
    primary_color: ap.accent_color,
  }
  if (ap.hasBg) {
    config.background_url = ap.background_url
    config.theme = ap.onDarkBg ? 'escuro' : 'claro'
  }
  if (ap.logo_url) config.logo_url = ap.logo_url
  return config
}
