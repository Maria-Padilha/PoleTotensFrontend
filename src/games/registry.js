import QuizPlayer from './quiz/QuizPlayer.vue'
import QuizQuestionsEditor from './quiz/QuizQuestionsEditor.vue'

export const gameRegistry = {
  quiz: {
    player: QuizPlayer,
    editor: QuizQuestionsEditor,
    editorField: 'questions',
    defaultConfig: () => ({ questions: [] }),
  },
}

export function getGameDefinition(slug) {
  return gameRegistry[slug] || null
}
