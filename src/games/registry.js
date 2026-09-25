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
