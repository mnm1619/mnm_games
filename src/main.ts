import './style.css'
import { difficultySettings, type Difficulty } from './questions'

type GameStatus = 'ready' | 'playing' | 'finished'
type ScoreRecords = Partial<Record<Difficulty, number>>

const scoreStorageKey = 'mnm-games-best-scores'

const app = document.querySelector<HTMLDivElement>('#app')!
const canvas = document.createElement('canvas')
canvas.className = 'scene'
canvas.setAttribute('aria-label', 'キャラクターが進むタイピングゲームの背景')

app.innerHTML = `
  <section class="game-shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">MNM GAMES / FIRST STEP</p>
        <h1>もじもじタイピング探検</h1>
      </div>
      <div class="stats" aria-label="ゲームの記録">
        <div><span>のこり</span><strong id="time">60</strong><small>秒</small></div>
        <div><span>せいかい</span><strong id="score">0</strong></div>
        <div><span>ミス</span><strong id="misses">0</strong></div>
      </div>
    </header>
    <div class="stage-wrap"></div>
    <section class="typing-panel" aria-live="polite">
      <p id="message" class="message">スタートをおして、ぼうけんに出よう！</p>
      <div class="difficulty-choice">
        <span>むずかしさ</span>
        <select id="difficulty" aria-label="むずかしさを選ぶ">
          <option value="easy">かんたん</option>
          <option value="normal" selected>ふつう</option>
          <option value="hard">むずかしい</option>
        </select>
        <span id="best-score" class="best-score">ベスト: 0もん</span>
      </div>
      <div class="word-card">
        <p id="kana" class="kana">さくら</p>
        <p id="target" class="target">sakura</p>
      </div>
      <p class="input-help">キーボードでローマ字を入力してね</p>
      <button id="start" class="start-button" type="button">スタート</button>
    </section>
  </section>
`

document.querySelector('.stage-wrap')!.append(canvas)
const context = canvas.getContext('2d')!
const timeElement = document.querySelector<HTMLSpanElement>('#time')!
const scoreElement = document.querySelector<HTMLSpanElement>('#score')!
const missesElement = document.querySelector<HTMLSpanElement>('#misses')!
const messageElement = document.querySelector<HTMLParagraphElement>('#message')!
const kanaElement = document.querySelector<HTMLParagraphElement>('#kana')!
const targetElement = document.querySelector<HTMLParagraphElement>('#target')!
const startButton = document.querySelector<HTMLButtonElement>('#start')!
const difficultyElement = document.querySelector<HTMLSelectElement>('#difficulty')!
const bestScoreElement = document.querySelector<HTMLSpanElement>('#best-score')!

let status: GameStatus = 'ready'
let difficulty: Difficulty = 'normal'
let wordIndex = 0
let inputIndex = 0
let score = 0
let misses = 0
let remaining = difficultySettings[difficulty].time
let lastFrame = 0
let timer = 0
let audioContext: AudioContext | undefined

function getQuestions() {
  return difficultySettings[difficulty].questions
}

function getScoreRecords(): ScoreRecords {
  try {
    return JSON.parse(localStorage.getItem(scoreStorageKey) ?? '{}') as ScoreRecords
  } catch {
    return {}
  }
}

function updateBestScore() {
  const best = getScoreRecords()[difficulty] ?? 0
  bestScoreElement.textContent = `ベスト: ${best}もん`
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
  audioContext ??= new AudioContext()
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  oscillator.type = type
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0.08, audioContext.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
  oscillator.connect(gain)
  gain.connect(audioContext.destination)
  oscillator.start()
  oscillator.stop(audioContext.currentTime + duration)
}

function playClearSound() {
  playTone(523, 0.12)
  window.setTimeout(() => playTone(659, 0.12), 100)
  window.setTimeout(() => playTone(784, 0.2), 200)
}

function resizeCanvas() {
  const scale = window.devicePixelRatio > 1 ? 1.5 : 1
  canvas.width = Math.floor(canvas.clientWidth * scale)
  canvas.height = Math.floor(canvas.clientHeight * scale)
  context.setTransform(scale, 0, 0, scale, 0, 0)
}

function drawScene() {
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const progress = score / getQuestions().length

  context.clearRect(0, 0, width, height)
  context.fillStyle = '#dff0e7'
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#bddfcf'
  context.beginPath()
  context.arc(width * 0.16, height * 0.58, 90, Math.PI, 0)
  context.arc(width * 0.42, height * 0.58, 120, Math.PI, 0)
  context.arc(width * 0.78, height * 0.58, 150, Math.PI, 0)
  context.fill()
  context.fillStyle = '#f7d77f'
  context.fillRect(0, height * 0.72, width, height * 0.28)
  context.strokeStyle = '#cf9d4c'
  context.lineWidth = 4
  context.beginPath()
  context.moveTo(0, height * 0.78)
  context.quadraticCurveTo(width * 0.3, height * 0.66, width * 0.55, height * 0.78)
  context.quadraticCurveTo(width * 0.78, height * 0.88, width, height * 0.72)
  context.stroke()

  const characterX = Math.min(width - 48, 48 + progress * (width - 96))
  const characterY = height * 0.66
  context.fillStyle = '#ef6c57'
  context.beginPath()
  context.arc(characterX, characterY, 22, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#fffaf0'
  context.beginPath()
  context.arc(characterX - 8, characterY - 4, 4, 0, Math.PI * 2)
  context.arc(characterX + 8, characterY - 4, 4, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = '#473b35'
  context.lineWidth = 3
  context.beginPath()
  context.arc(characterX, characterY + 2, 9, 0.15, Math.PI - 0.15)
  context.stroke()
}

function updateWord() {
  const question = getQuestions()[wordIndex]
  kanaElement.textContent = question.kana
  targetElement.innerHTML = question.romaji
    .split('')
    .map((letter, index) => `<span class="${index < inputIndex ? 'typed' : ''}">${letter}</span>`)
    .join('')
}

function updateStats() {
  timeElement.textContent = String(remaining)
  scoreElement.textContent = String(score)
  missesElement.textContent = String(misses)
}

function finishGame() {
  status = 'finished'
  const records = getScoreRecords()
  const previousBest = records[difficulty] ?? 0
  const isNewBest = score > previousBest
  if (isNewBest) {
    records[difficulty] = score
    localStorage.setItem(scoreStorageKey, JSON.stringify(records))
  }
  messageElement.textContent = isNewBest
    ? `おしまい！ ${score}もん。ベストきろく更新！`
    : `おしまい！ ${score}もん せいかいできたよ。`
  startButton.textContent = 'もういちど遊ぶ'
  startButton.disabled = false
  difficultyElement.disabled = false
  playClearSound()
  updateBestScore()
  updateStats()
}

function startGame() {
  difficulty = difficultyElement.value as Difficulty
  status = 'playing'
  wordIndex = 0
  inputIndex = 0
  score = 0
  misses = 0
  remaining = difficultySettings[difficulty].time
  lastFrame = performance.now()
  startButton.disabled = true
  difficultyElement.disabled = true
  startButton.textContent = 'プレイ中'
  messageElement.textContent = 'ひらがなを見て、ローマ字を入力しよう！'
  updateWord()
  updateStats()
}

function handleKeydown(event: KeyboardEvent) {
  if (status !== 'playing' || event.key.length !== 1 || !/^[a-zA-Z]$/.test(event.key)) return

  const expected = getQuestions()[wordIndex].romaji[inputIndex]
  if (event.key.toLowerCase() !== expected) {
    misses += 1
    playTone(180, 0.12, 'square')
    messageElement.textContent = 'おしい！ つぎの文字を見てみよう'
    updateStats()
    return
  }

  inputIndex += 1
  if (inputIndex === getQuestions()[wordIndex].romaji.length) {
    score += 1
    playTone(660, 0.08)
    wordIndex += 1
    inputIndex = 0
    if (wordIndex === getQuestions().length) {
      finishGame()
      return
    }
  }
  updateWord()
  updateStats()
}

function tick(now: number) {
  if (status === 'playing' && now - lastFrame >= 1000) {
    remaining -= 1
    lastFrame = now
    if (remaining <= 0) finishGame()
    updateStats()
  }
  drawScene()
  timer = requestAnimationFrame(tick)
}

window.addEventListener('resize', resizeCanvas)
window.addEventListener('keydown', handleKeydown)
startButton.addEventListener('click', startGame)
difficultyElement.addEventListener('change', () => {
  if (status === 'playing') return
  difficulty = difficultyElement.value as Difficulty
  remaining = difficultySettings[difficulty].time
  updateBestScore()
  updateStats()
})
resizeCanvas()
updateWord()
updateStats()
updateBestScore()
timer = requestAnimationFrame(tick)

window.addEventListener('beforeunload', () => cancelAnimationFrame(timer))
