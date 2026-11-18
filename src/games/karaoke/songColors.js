// Cor de cada música do karaokê: escolhida no cadastro ou, sem escolha, da paleta em ordem.
// Usada na lista de músicas, no palco (fundo e letra), no resultado, no ranking e na prévia do painel.

export const SONG_PALETTE = ['#e4572e', '#17a398', '#7a3fd1', '#f5a623', '#2e86de', '#d6336c', '#37b24d', '#fd7e14']

export function songColor(song, index = 0) {
  return /^#[0-9a-f]{6}$/i.test(song?.color || '') ? song.color : SONG_PALETTE[index % SONG_PALETTE.length]
}

// Fundo do palco: escuro (a letra branca com contorno precisa ler bem), mas tingido com a
// cor da música, com um brilho mais forte no alto.
export function stageBackground(color) {
  return {
    background: `radial-gradient(ellipse at 50% 28%, color-mix(in srgb, ${color} 60%, transparent), transparent 68%), linear-gradient(color-mix(in srgb, ${color} 36%, #07070f), color-mix(in srgb, ${color} 14%, #04040a))`,
  }
}

// Cor do preenchimento da letra: a da música um pouco clareada, pra se destacar
// do fundo tingido pela própria cor.
export function lyricFill(color) {
  return `color-mix(in srgb, ${color} 70%, #ffffff)`
}
