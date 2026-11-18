import QuizPlayer from './quiz/QuizPlayer.vue'
import QuizQuestionsEditor from './quiz/QuizQuestionsEditor.vue'
import VerdadeiroFalsoPlayer from './verdadeiro-ou-falso/VerdadeiroFalsoPlayer.vue'
import VerdadeiroFalsoStatementsEditor from './verdadeiro-ou-falso/VerdadeiroFalsoStatementsEditor.vue'
import ForcaPlayer from './forca/ForcaPlayer.vue'
import ForcaWordsEditor from './forca/ForcaWordsEditor.vue'
import CacaPalavrasPlayer from './caca-palavras/CacaPalavrasPlayer.vue'
import CacaPalavrasWordsEditor from './caca-palavras/CacaPalavrasWordsEditor.vue'
import MemoriaPlayer from './jogo-da-memoria/MemoriaPlayer.vue'
import MemoriaCardsEditor from './jogo-da-memoria/MemoriaCardsEditor.vue'
import KaraokePlayer from './karaoke/KaraokePlayer.vue'
import KaraokeSongsEditor from './karaoke/KaraokeSongsEditor.vue'
import AcerteTempoPlayer from './acerte-o-tempo/AcerteTempoPlayer.vue'
import AcerteTempoEditor from './acerte-o-tempo/AcerteTempoEditor.vue'
import PareNoAlvoPlayer from './pare-no-alvo/ParePlayer.vue'
import PareNoAlvoEditor from './pare-no-alvo/PareEditor.vue'
import RoletaPlayer from './roleta-de-brindes/RoletaPlayer.vue'
import RoletaPrizesEditor from './roleta-de-brindes/RoletaPrizesEditor.vue'

export const gameRegistry = {
  quiz: {
    player: QuizPlayer,
    editor: QuizQuestionsEditor,
    editorField: 'questions',
    defaultConfig: () => ({ questions: [] }),
  },
  'verdadeiro-ou-falso': {
    player: VerdadeiroFalsoPlayer,
    editor: VerdadeiroFalsoStatementsEditor,
    editorField: 'statements',
    defaultConfig: () => ({ statements: [] }),
  },
  forca: {
    player: ForcaPlayer,
    editor: ForcaWordsEditor,
    editorField: 'words',
    defaultConfig: () => ({ words: [] }),
  },
  'caca-palavras': {
    player: CacaPalavrasPlayer,
    editor: CacaPalavrasWordsEditor,
    editorField: 'words',
    defaultConfig: () => ({ words: [] }),
  },
  'jogo-da-memoria': {
    player: MemoriaPlayer,
    editor: MemoriaCardsEditor,
    editorField: 'cards',
    defaultConfig: () => ({ cards: [] }),
  },
  karaoke: {
    player: KaraokePlayer,
    editor: KaraokeSongsEditor,
    editorField: 'songs',
    defaultConfig: () => ({ songs: [] }),
    // o ranking do karaokê é buscado pelo próprio jogo, que precisa do token
    wantsPublicToken: true,
  },
  'acerte-o-tempo': {
    player: AcerteTempoPlayer,
    editor: AcerteTempoEditor,
    editorField: 'timing',
    defaultConfig: () => ({ timing: { min_seconds: 0.1, max_seconds: 5, hide_clock: false, hide_after: 2 } }),
    // o ranking (por tentativa) é buscado pelo próprio jogo
    wantsPublicToken: true,
    ownsRanking: true,
  },
  'pare-no-alvo': {
    player: PareNoAlvoPlayer,
    editor: PareNoAlvoEditor,
    editorField: 'zone',
    defaultConfig: () => ({ zone: { lives: 3, speed: 1 } }),
    // o ranking (por tentativa) é buscado pelo próprio jogo
    wantsPublicToken: true,
    ownsRanking: true,
  },
  'roleta-de-brindes': {
    player: RoletaPlayer,
    editor: RoletaPrizesEditor,
    editorField: 'prizes',
    defaultConfig: () => ({ prizes: [] }),
  },
}

export function getGameDefinition(slug) {
  return gameRegistry[slug] || null
}
