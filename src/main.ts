import './style.css'
import { allKeySteps, difficultySettings, homePositionSteps, sugarGliderQuestionPool, type Difficulty, type TypingQuestion } from './questions'

type GameStatus = 'ready' | 'countdown' | 'playing' | 'finished'
type GameMode = 'story' | 'practice' | 'learn' | 'learn-all'
type ScoreRecords = Partial<Record<Difficulty, number>>
type SugarGliderMorph = {
  name: string
  fur: string
  ear: string
  belly: string
  membrane: string
}
type EffectParticle = {
  x: number
  y: number
  velocityX: number
  velocityY: number
  life: number
  size: number
  symbol: string
  color: string
}

const scoreStorageKey = 'mnm-games-best-scores'
const modeStorageKey = 'mnm-games-mode'
const sugarGliderMorphs: SugarGliderMorph[] = [
  { name: 'スノーモモ', fur: '#fff8ef', ear: '#f3c2c4', belly: '#fffdf8', membrane: '#ffe0e6' },
  { name: 'ミルクモモ', fur: '#f3e5cf', ear: '#e8b9aa', belly: '#fff9ed', membrane: '#f8d9cf' },
  { name: 'グレーモモ', fur: '#b7a9a3', ear: '#d4aeb1', belly: '#eee7e3', membrane: '#ead4df' },
  { name: 'モザイクモモ', fur: '#e8d9d0', ear: '#e7b9bd', belly: '#fff8f2', membrane: '#f7d9e4' },
]

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
      <div class="mode-choice">
        <span>あそびかた</span>
        <select id="mode" aria-label="あそびかたを選ぶ">
          <option value="story">ストーリー</option>
          <option value="practice">れんしゅう</option>
          <option value="learn">まなぶ</option>
          <option value="learn-all">ぜんぶのキー</option>
        </select>
        <span id="story-progress" class="story-progress">第1章 ほしの森</span>
        <span id="morph-label" class="morph-label">モモ: スノーモモ</span>
      </div>
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
      <section id="learn-guide" class="learn-guide">
        <p id="lesson-title" class="lesson-title">ホームポジション</p>
        <p id="lesson-finger" class="lesson-finger">左手の小指を A に置こう</p>
        <div class="keyboard" aria-label="キーボードのホームポジション">
          <span data-key="q">Q</span><span data-key="w">W</span><span data-key="e">E</span><span data-key="r">R</span><span data-key="t">T</span>
          <span data-key="y">Y</span><span data-key="u">U</span><span data-key="i">I</span><span data-key="o">O</span><span data-key="p">P</span>
          <span data-key="a">A</span><span data-key="s">S</span><span data-key="d">D</span><span data-key="f">F</span><span data-key="g">G</span>
          <span data-key="h">H</span><span data-key="j">J</span><span data-key="k">K</span><span data-key="l">L</span><span data-key=";">;</span>
          <span data-key="z">Z</span><span data-key="x">X</span><span data-key="c">C</span><span data-key="v">V</span><span data-key="b">B</span>
          <span data-key="n">N</span><span data-key="m">M</span>
        </div>
      </section>
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
const modeElement = document.querySelector<HTMLSelectElement>('#mode')!
const difficultyElement = document.querySelector<HTMLSelectElement>('#difficulty')!
const bestScoreElement = document.querySelector<HTMLSpanElement>('#best-score')!
const storyProgressElement = document.querySelector<HTMLSpanElement>('#story-progress')!
const morphLabelElement = document.querySelector<HTMLSpanElement>('#morph-label')!
const learnGuide = document.querySelector<HTMLElement>('#learn-guide')!
const lessonTitle = document.querySelector<HTMLParagraphElement>('#lesson-title')!
const lessonFinger = document.querySelector<HTMLParagraphElement>('#lesson-finger')!
const keyboardKeys = document.querySelectorAll<HTMLSpanElement>('[data-key]')

let status: GameStatus = 'ready'
let mode: GameMode = (localStorage.getItem(modeStorageKey) as GameMode) || 'story'
let difficulty: Difficulty = 'normal'
let wordIndex = 0
let lessonIndex = 0
let learningSteps = homePositionSteps
let currentQuestions: TypingQuestion[] = difficultySettings[difficulty].questions
let currentMorph = sugarGliderMorphs[0]
let inputIndex = 0
let score = 0
let misses = 0
let remaining = difficultySettings[difficulty].time
let lastFrame = 0
let timer = 0
let audioContext: AudioContext | undefined
let effectTime = 0
let effectX = 0
let effectY = 0
let feedbackTime = 0
let feedbackText = ''
let feedbackKind: 'success' | 'miss' = 'success'
let sceneTime = 0
let effectParticles: EffectParticle[] = []
let countdown = 0
let countdownUntil = 0

modeElement.value = mode

function chooseRandomMorph() {
  currentMorph = sugarGliderMorphs[Math.floor(Math.random() * sugarGliderMorphs.length)]
  morphLabelElement.textContent = `モモ: ${currentMorph.name}`
}

function getQuestions() {
  return currentQuestions
}

function isLearningMode() {
  return (mode === 'learn' || mode === 'learn-all') && !(mode === 'learn' && difficulty === 'hard')
}

function getLearningSteps() {
  return learningSteps
}

function shuffledSteps(steps: typeof homePositionSteps) {
  return [...steps].sort(() => Math.random() - 0.5)
}

function shuffledQuestions(questions: TypingQuestion[]) {
  return [...questions].sort(() => Math.random() - 0.5)
}

function chooseQuestions() {
  const pool = difficulty === 'easy'
    ? difficultySettings.easy.questions
    : difficulty === 'hard'
      ? sugarGliderQuestionPool.filter((question) => question.romaji.length >= 10)
      : sugarGliderQuestionPool
  const questionCount = difficulty === 'easy' ? 4 : 10
  currentQuestions = shuffledQuestions(pool).slice(0, questionCount)
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

function getStorySetting() {
  if (difficulty === 'easy') return { chapter: '第1章 ほしの森', goal: 'モモと星のしずくを3つ集めよう！' }
  if (difficulty === 'normal') return { chapter: '第2章 ひみつの木', goal: 'モモと森の小道を進もう！' }
  return { chapter: '第3章 きらめきの夜空', goal: 'モモと星空の門をひらこう！' }
}

function updateStorySetting() {
  const setting = getStorySetting()
  storyProgressElement.textContent = setting.chapter
  if (status !== 'playing' && mode === 'story') messageElement.textContent = setting.goal
}

function updateLearningView() {
  const step = getLearningSteps()[lessonIndex]
  lessonTitle.textContent = step.title
  lessonFinger.textContent = step.message
  keyboardKeys.forEach((key) => {
    key.classList.toggle('home-key', key.dataset.key === step.key)
  })
  kanaElement.textContent = `つぎは ${step.key.toUpperCase()} キー`
  targetElement.textContent = step.key.toUpperCase()
  learnGuide.hidden = false
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

function playSuccessSound() {
  playTone(523, 0.08)
  window.setTimeout(() => playTone(659, 0.08), 70)
  window.setTimeout(() => playTone(784, 0.12), 140)
}

function triggerSuccessEffect(x: number, y: number) {
  effectTime = 1
  effectX = x
  effectY = y
  effectParticles = Array.from({ length: 24 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 24 + Math.random() * 0.2
    const speed = 1.8 + Math.random() * 2.8
    return {
      x,
      y,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed - 1.2,
      life: 1,
      size: 10 + Math.random() * 10,
      symbol: index % 3 === 0 ? '♥' : index % 3 === 1 ? '✦' : '●',
      color: index % 2 === 0 ? '#ffd75e' : '#f08bb3',
    }
  })
}

function showFeedback(text: string, kind: 'success' | 'miss') {
  feedbackText = text
  feedbackKind = kind
  feedbackTime = 1
}

function flashKeyboardKey(key: string, kind: 'success' | 'miss') {
  const keyboardKey = document.querySelector<HTMLSpanElement>(`[data-key="${key}"]`)
  if (!keyboardKey) return
  keyboardKey.classList.remove('key-success', 'key-miss')
  void keyboardKey.offsetWidth
  keyboardKey.classList.add(kind === 'success' ? 'key-success' : 'key-miss')
  window.setTimeout(() => keyboardKey.classList.remove('key-success', 'key-miss'), 420)
}

function resizeCanvas() {
  const scale = window.devicePixelRatio > 1 ? 1.5 : 1
  canvas.width = Math.floor(canvas.clientWidth * scale)
  canvas.height = Math.floor(canvas.clientHeight * scale)
  context.setTransform(scale, 0, 0, scale, 0, 0)
}

function drawSparkle(x: number, y: number, size: number, color: string) {
  context.fillStyle = color
  context.beginPath()
  context.moveTo(x, y - size)
  context.lineTo(x + size * 0.28, y - size * 0.28)
  context.lineTo(x + size, y)
  context.lineTo(x + size * 0.28, y + size * 0.28)
  context.lineTo(x, y + size)
  context.lineTo(x - size * 0.28, y + size * 0.28)
  context.lineTo(x - size, y)
  context.lineTo(x - size * 0.28, y - size * 0.28)
  context.closePath()
  context.fill()
}

function drawHeroine(x: number, y: number) {
  context.save()
  context.lineCap = 'round'
  context.lineJoin = 'round'

  context.strokeStyle = '#f0dfd4'
  context.lineWidth = 10
  context.beginPath()
  context.moveTo(x + 20, y + 12)
  context.bezierCurveTo(x + 50, y + 32, x + 67, y + 5 + Math.sin(sceneTime / 280) * 4, x + 53, y - 18)
  context.stroke()
  context.strokeStyle = '#fff3e9'
  context.lineWidth = 4
  context.beginPath()
  context.moveTo(x + 20, y + 12)
  context.bezierCurveTo(x + 50, y + 32, x + 67, y + 5 + Math.sin(sceneTime / 280) * 4, x + 53, y - 18)
  context.stroke()

  context.fillStyle = currentMorph.fur
  context.beginPath()
  context.ellipse(x, y + 1, 27, 31, 0, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = currentMorph.ear
  context.beginPath()
  context.moveTo(x - 22, y - 29)
  context.quadraticCurveTo(x - 42, y - 58, x - 25, y - 63)
  context.quadraticCurveTo(x - 9, y - 51, x - 10, y - 27)
  context.moveTo(x + 22, y - 29)
  context.quadraticCurveTo(x + 42, y - 58, x + 25, y - 63)
  context.quadraticCurveTo(x + 9, y - 51, x + 10, y - 27)
  context.fill()

  context.fillStyle = currentMorph.belly
  context.beginPath()
  context.ellipse(x, y - 10, 20, 22, 0, 0, Math.PI * 2)
  context.fill()

  context.strokeStyle = '#e8d4ca'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(x, y - 34)
  context.lineTo(x, y + 20)
  context.stroke()

  context.fillStyle = '#17151c'
  context.beginPath()
  context.ellipse(x - 8, y - 13, 6, 9, 0, 0, Math.PI * 2)
  context.ellipse(x + 8, y - 13, 6, 9, 0, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#fff'
  context.beginPath()
  context.arc(x - 6, y - 17, 2.5, 0, Math.PI * 2)
  context.arc(x + 10, y - 17, 2.5, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#ef9daa'
  context.beginPath()
  context.ellipse(x, y - 3, 5, 4, 0, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = '#b96f7a'
  context.lineWidth = 2
  context.beginPath()
  context.arc(x, y + 1, 5, 0.2, Math.PI - 0.2)
  context.stroke()

  context.strokeStyle = 'rgba(174, 135, 132, 0.7)'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(x - 4, y - 1)
  context.lineTo(x - 25, y - 5)
  context.moveTo(x - 4, y + 2)
  context.lineTo(x - 25, y + 5)
  context.moveTo(x + 4, y - 1)
  context.lineTo(x + 25, y - 5)
  context.moveTo(x + 4, y + 2)
  context.lineTo(x + 25, y + 5)
  context.stroke()

  context.fillStyle = currentMorph.membrane
  context.globalAlpha = 0.76
  context.beginPath()
  context.moveTo(x - 21, y + 5)
  context.quadraticCurveTo(x - 48, y + 9, x - 43, y + 29)
  context.quadraticCurveTo(x - 25, y + 31, x - 11, y + 16)
  context.moveTo(x + 21, y + 5)
  context.quadraticCurveTo(x + 48, y + 9, x + 43, y + 29)
  context.quadraticCurveTo(x + 25, y + 31, x + 11, y + 16)
  context.closePath()
  context.fill()
  context.globalAlpha = 1

  context.fillStyle = '#fffdf8'
  context.beginPath()
  context.ellipse(x, y + 10, 15, 20, 0, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#c985a1'
  context.beginPath()
  context.arc(x - 13, y + 4, 4, 0, Math.PI * 2)
  context.arc(x + 13, y + 4, 4, 0, Math.PI * 2)
  context.fill()

  context.strokeStyle = '#6d4e47'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(x - 15, y + 31)
  context.lineTo(x - 18, y + 38)
  context.moveTo(x + 15, y + 31)
  context.lineTo(x + 18, y + 38)
  context.stroke()
  context.fillStyle = '#d87893'
  context.beginPath()
  context.arc(x, y + 40, 5, 0, Math.PI * 2)
  context.fill()

  drawSparkle(x + 31, y - 40, 5, '#fff1a8')
  context.restore()
}

function drawMonster(x: number, y: number) {
  context.fillStyle = '#9a76c6'
  context.beginPath()
  context.moveTo(x - 23, y + 20)
  context.quadraticCurveTo(x - 31, y - 10, x - 19, y - 22)
  context.lineTo(x - 9, y - 35)
  context.lineTo(x, y - 23)
  context.lineTo(x + 11, y - 35)
  context.lineTo(x + 20, y - 22)
  context.quadraticCurveTo(x + 31, y - 8, x + 23, y + 20)
  context.quadraticCurveTo(x, y + 31, x - 23, y + 20)
  context.fill()
  context.fillStyle = '#fff4fa'
  context.beginPath()
  context.ellipse(x - 9, y - 5, 6, 9, 0, 0, Math.PI * 2)
  context.ellipse(x + 9, y - 5, 6, 9, 0, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#473b35'
  context.beginPath()
  context.arc(x - 9, y - 3, 3, 0, Math.PI * 2)
  context.arc(x + 9, y - 3, 3, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = '#473b35'
  context.lineWidth = 2
  context.beginPath()
  context.arc(x, y + 7, 7, 0.2, Math.PI - 0.2)
  context.stroke()
}

function drawAdventureDecor(width: number, height: number) {
  context.fillStyle = '#d8bfdc'
  context.beginPath()
  context.arc(width * 0.1, height * 0.63, 42, Math.PI, 0)
  context.arc(width * 0.19, height * 0.63, 58, Math.PI, 0)
  context.arc(width * 0.88, height * 0.62, 48, Math.PI, 0)
  context.fill()
  context.fillStyle = '#f6c7d8'
  context.beginPath()
  context.arc(width * 0.78, height * 0.18, 25, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#fff5ba'
  context.beginPath()
  context.arc(width * 0.77, height * 0.17, 21, 0, Math.PI * 2)
  context.fill()
  drawSparkle(width * 0.66, height * 0.18, 7, '#fff6c7')
  drawSparkle(width * 0.91, height * 0.28, 5, '#fff6c7')
  context.fillStyle = '#c68eaa'
  context.beginPath()
  context.arc(width * 0.28, height * 0.65, 5, 0, Math.PI * 2)
  context.arc(width * 0.3, height * 0.6, 5, 0, Math.PI * 2)
  context.arc(width * 0.32, height * 0.65, 5, 0, Math.PI * 2)
  context.fill()
}

function drawScene() {
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const progress = score / getQuestions().length

  context.clearRect(0, 0, width, height)
  context.fillStyle = '#f9e8f0'
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#ead8ee'
  context.beginPath()
  context.arc(width * 0.16, height * 0.58, 90, Math.PI, 0)
  context.arc(width * 0.42, height * 0.58, 120, Math.PI, 0)
  context.arc(width * 0.78, height * 0.58, 150, Math.PI, 0)
  context.fill()
  context.fillStyle = '#f8dce5'
  context.fillRect(0, height * 0.72, width, height * 0.28)
  drawAdventureDecor(width, height)
  context.strokeStyle = '#d89db9'
  context.lineWidth = 4
  context.beginPath()
  context.moveTo(0, height * 0.78)
  context.quadraticCurveTo(width * 0.3, height * 0.66, width * 0.55, height * 0.78)
  context.quadraticCurveTo(width * 0.78, height * 0.88, width, height * 0.72)
  context.stroke()

  const characterX = Math.min(width - 48, 48 + progress * (width - 96))
  for (let index = 0; index < 5; index += 1) {
    const petalX = width * (0.12 + index * 0.2)
    const petalY = height * (0.18 + (index % 2) * 0.12)
    drawSparkle(petalX, petalY, 4 + (index % 2) * 2, '#fff7fc')
  }

  const characterY = height * 0.76 + Math.sin(sceneTime / 420) * 2
  drawHeroine(characterX, characterY)

  context.strokeStyle = '#fff4c9'
  context.lineWidth = 6
  context.beginPath()
  context.moveTo(30, height * 0.86)
  context.lineTo(width - 30, height * 0.86)
  context.stroke()
  for (let index = 0; index < 6; index += 1) {
    const markerX = 42 + index * ((width - 84) / 5)
    context.fillStyle = index <= Math.round(progress * 5) ? '#d86691' : '#efd1df'
    context.beginPath()
    context.arc(markerX, height * 0.86, 7, 0, Math.PI * 2)
    context.fill()
  }

  if (feedbackTime > 0) {
    feedbackTime = Math.max(0, feedbackTime - 0.04)
    const feedbackX = Math.min(width - 82, characterX + 50)
    const feedbackY = characterY - 58 - (1 - feedbackTime) * 12
    context.globalAlpha = Math.min(1, feedbackTime * 2)
    context.fillStyle = feedbackKind === 'success' ? '#fff3a8' : '#d9c9e7'
    context.beginPath()
    context.ellipse(feedbackX, feedbackY, 76, 30, 0, 0, Math.PI * 2)
    context.fill()
    context.beginPath()
    context.moveTo(feedbackX - 24, feedbackY + 22)
    context.lineTo(feedbackX - 40, feedbackY + 42)
    context.lineTo(feedbackX - 5, feedbackY + 26)
    context.fill()
    context.fillStyle = '#5f4662'
    context.font = 'bold 20px sans-serif'
    context.textAlign = 'center'
    context.fillText(feedbackText, feedbackX, feedbackY + 5)
    context.textAlign = 'start'
    if (feedbackKind === 'success') {
      drawSparkle(feedbackX + 45, feedbackY - 17, 5, '#f0b64f')
    } else {
      const tearProgress = 1 - feedbackTime
      const tearY = characterY - 12 + tearProgress * 30
      context.fillStyle = '#91b9df'
      context.beginPath()
      context.ellipse(characterX - 8, tearY, 3.5, 6, -0.25, 0, Math.PI * 2)
      context.ellipse(characterX + 8, tearY + 3, 3.5, 6, 0.25, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = 'rgba(255, 255, 255, 0.8)'
      context.beginPath()
      context.arc(characterX - 9, tearY - 2, 1.2, 0, Math.PI * 2)
      context.arc(characterX + 7, tearY + 1, 1.2, 0, Math.PI * 2)
      context.fill()
    }
    context.globalAlpha = 1
  }

  effectParticles = effectParticles.filter((particle) => particle.life > 0)
  effectParticles.forEach((particle) => {
    particle.x += particle.velocityX
    particle.y += particle.velocityY
    particle.velocityY += 0.06
    particle.life -= 0.025
    context.globalAlpha = Math.max(0, particle.life)
    context.fillStyle = particle.color
    context.font = `bold ${particle.size}px sans-serif`
    context.fillText(particle.symbol, particle.x, particle.y)
  })
  context.globalAlpha = 1

  if (mode === 'story' && status !== 'finished') {
    const enemyX = Math.max(characterX + 75, width - 82)
    drawMonster(enemyX, height * 0.48)
  }

  if (effectTime > 0) {
    effectTime = Math.max(0, effectTime - 0.035)
    const effectProgress = 1 - effectTime
    const radius = 22 + effectProgress * 76
    context.strokeStyle = `rgba(255, 202, 76, ${effectTime})`
    context.lineWidth = 10
    context.beginPath()
    context.arc(effectX, effectY, radius, 0, Math.PI * 2)
    context.stroke()
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6
      const sparkleX = effectX + Math.cos(angle) * radius
      const sparkleY = effectY + Math.sin(angle) * radius
      context.fillStyle = `rgba(255, 244, 174, ${effectTime})`
      context.font = 'bold 30px sans-serif'
      context.fillText('✦', sparkleX - 8, sparkleY)
    }
  }

  if (status === 'countdown') {
    context.fillStyle = 'rgba(95, 70, 98, 0.28)'
    context.fillRect(0, 0, width, height)
    context.fillStyle = '#fffafd'
    context.font = '800 76px sans-serif'
    context.textAlign = 'center'
    context.fillText(String(countdown), width / 2, height / 2 + 25)
    context.font = '700 18px sans-serif'
    context.fillText('モモのぼうけん、スタート！', width / 2, height / 2 + 58)
    context.textAlign = 'start'
  }
}

function updateWord() {
  if (isLearningMode()) {
    updateLearningView()
    return
  }
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
  messageElement.textContent = mode === 'story'
    ? `${getStorySetting().chapter}クリア！ モモといっしょに${score}もんできたよ。`
    : isLearningMode()
      ? `${mode === 'learn-all' ? 'ぜんぶのキー' : 'ホームポジション'}の練習クリア！ 指の場所を覚えたね。`
      : isNewBest
        ? `おしまい！ ${score}もん。ベストきろく更新！`
        : `おしまい！ ${score}もん せいかいできたよ。`
  startButton.textContent = 'もういちど遊ぶ'
  startButton.disabled = false
  modeElement.disabled = false
  difficultyElement.disabled = false
  playClearSound()
  updateBestScore()
  updateStats()
}

function startGame() {
  mode = modeElement.value as GameMode
  difficulty = difficultyElement.value as Difficulty
  audioContext ??= new AudioContext()
  void audioContext.resume()
  status = 'countdown'
  wordIndex = 0
  lessonIndex = 0
  learningSteps = mode === 'learn' && difficulty === 'normal'
    ? shuffledSteps(allKeySteps)
    : mode === 'learn' ? shuffledSteps(homePositionSteps)
      : mode === 'learn-all' ? shuffledSteps(allKeySteps) : allKeySteps
  inputIndex = 0
  score = 0
  misses = 0
  if (!isLearningMode()) chooseQuestions()
  chooseRandomMorph()
  remaining = isLearningMode() ? 180 : difficultySettings[difficulty].time
  countdown = 3
  countdownUntil = performance.now() + 3000
  window.setTimeout(() => {
    if (status !== 'countdown') return
    status = 'playing'
    lastFrame = performance.now()
    startButton.textContent = 'プレイ中'
    messageElement.textContent = mode === 'story' ? getStorySetting().goal : 'ひらがなを見て、ローマ字を入力しよう！'
  }, 3000)
  lastFrame = performance.now()
  startButton.disabled = true
  modeElement.disabled = true
  difficultyElement.disabled = true
  startButton.textContent = 'じゅんび中'
  messageElement.textContent = 'ひらがなを見て、ローマ字を入力しよう！'
  if (mode === 'story') messageElement.textContent = '星の魔法で、じゃまモンスターを追いはらおう！'
  if (mode === 'learn' && difficulty === 'easy') messageElement.textContent = '指をホームポジションに置いて、光るキーを押そう！'
  if (mode === 'learn' && difficulty === 'normal') messageElement.textContent = '全キーからランダムに出題！ 指を動かして押そう！'
  if (mode === 'learn-all') messageElement.textContent = 'ホームポジションから指を動かして、光るキーを押そう！'
  if (mode === 'story') messageElement.textContent = getStorySetting().goal
  learnGuide.hidden = false
  updateWord()
  updateStats()
}

function handleKeydown(event: KeyboardEvent) {
  if (status !== 'playing' || event.key.length !== 1 || !/^[a-zA-Z;]$/.test(event.key)) return

  if (isLearningMode()) {
    const step = getLearningSteps()[lessonIndex]
    flashKeyboardKey(event.key.toLowerCase(), event.key.toLowerCase() === step.key ? 'success' : 'miss')
    if (event.key.toLowerCase() !== step.key) {
      misses += 1
      showFeedback('ざんねん…', 'miss')
      playTone(180, 0.12, 'square')
      messageElement.textContent = `${step.finger}で ${step.key.toUpperCase()} を押してみよう`
      updateStats()
      return
    }
    score += 1
    showFeedback('せいかい！', 'success')
    triggerSuccessEffect(canvas.clientWidth * 0.18, canvas.clientHeight * 0.66)
    playSuccessSound()
    lessonIndex += 1
    if (lessonIndex === getLearningSteps().length) {
      finishGame()
      return
    }
    updateLearningView()
    updateStats()
    return
  }

  const expected = getQuestions()[wordIndex].romaji[inputIndex]
  flashKeyboardKey(event.key.toLowerCase(), event.key.toLowerCase() === expected ? 'success' : 'miss')
  if (event.key.toLowerCase() !== expected) {
    misses += 1
    showFeedback('ざんねん…', 'miss')
    playTone(180, 0.12, 'square')
    messageElement.textContent = mode === 'story'
      ? 'モモがそばにいるよ。ゆっくり、つぎの文字を見てみよう！'
      : 'おしい！ つぎの文字を見てみよう'
    updateStats()
    return
  }

  inputIndex += 1
  showFeedback('せいかい！', 'success')
  if (inputIndex === getQuestions()[wordIndex].romaji.length) {
    score += 1
    if (mode === 'story') {
      const left = getQuestions().length - score
      messageElement.textContent = left > 0
        ? `すごい！ モモが星を見つけたよ。あと${left}もん！`
        : 'すごい！ モモとゴールへ進もう！'
    }
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    effectX = Math.min(width - 48, 48 + (score / getQuestions().length) * (width - 96))
    effectY = height * 0.66
    triggerSuccessEffect(effectX, effectY)
    playSuccessSound()
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
  sceneTime = now
  if (status === 'countdown') {
    const nextCountdown = Math.ceil((countdownUntil - now) / 1000)
    countdown = Math.max(0, nextCountdown)
    if (countdown <= 0) {
      status = 'playing'
      lastFrame = now
      startButton.textContent = 'プレイ中'
      messageElement.textContent = mode === 'story' ? getStorySetting().goal : 'ひらがなを見て、ローマ字を入力しよう！'
    }
  }
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
modeElement.addEventListener('change', () => {
  if (status === 'playing') return
  mode = modeElement.value as GameMode
  localStorage.setItem(modeStorageKey, mode)
  learnGuide.hidden = false
  messageElement.textContent = mode === 'story'
    ? '星の森を進んで、じゃまモンスターを追いはらおう！'
    : mode === 'learn'
      ? 'ホームポジションから、指の使い方を覚えよう！'
      : mode === 'learn-all'
        ? 'ぜんぶのキーを、指の使い方つきで覚えよう！'
      : '好きなだけ練習して、入力の力をつけよう！'
  updateStorySetting()
  updateWord()
})
difficultyElement.addEventListener('change', () => {
  if (status === 'playing') return
  difficulty = difficultyElement.value as Difficulty
  remaining = difficultySettings[difficulty].time
  if (!isLearningMode()) chooseQuestions()
  learnGuide.hidden = !isLearningMode()
  updateWord()
  updateBestScore()
  updateStats()
  updateStorySetting()
})
resizeCanvas()
updateWord()
updateStats()
updateBestScore()
updateStorySetting()
chooseRandomMorph()
drawScene()
timer = requestAnimationFrame(tick)

window.addEventListener('beforeunload', () => cancelAnimationFrame(timer))
