import { HelpCircle, ThumbsUp, Type, Search, Gift, Layers, Mic, Timer, Crosshair, Gamepad2 } from '@lucide/vue'

// Ícone de cada tipo de jogo (usado nos cartões da tela inicial do totem).
const ICONS = {
  quiz: HelpCircle,
  'verdadeiro-ou-falso': ThumbsUp,
  forca: Type,
  'caca-palavras': Search,
  'roleta-de-brindes': Gift,
  'jogo-da-memoria': Layers,
  karaoke: Mic,
  'acerte-o-tempo': Timer,
  'pare-no-alvo': Crosshair,
}

export function gameIcon(slug) {
  return ICONS[slug] || Gamepad2
}
