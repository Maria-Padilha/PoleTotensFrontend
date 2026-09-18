import QuizPlayer from './quiz/QuizPlayer.vue'
import QuizQuestionsEditor from './quiz/QuizQuestionsEditor.vue'
import VerdadeiroFalsoPlayer from './verdadeiro-ou-falso/VerdadeiroFalsoPlayer.vue'
import VerdadeiroFalsoStatementsEditor from './verdadeiro-ou-falso/VerdadeiroFalsoStatementsEditor.vue'

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
}

export function getGameDefinition(slug) {
  return gameRegistry[slug] || null
}
