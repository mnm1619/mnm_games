import './style.css'
import { allKeySteps, difficultySettings, homePositionSteps, type Difficulty } from './questions'

type GameStatus = 'ready' | 'playing' | 'finished'
type GameMode = 'story' | 'practice' | 'learn' | 'learn-all'
type ScoreRecords = Partial<Record<Difficulty, number>>

const scoreStorageKey = 'mnm-games-best-scores'
const modeStorageKey = 'mnm-games-mode'

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
      <section id="learn-guide" class="learn-guide" hidden>
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

modeElement.value = mode

function getQuestions() {
  return difficultySettings[difficulty].questions
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

function triggerSuccessEffect() {
  effectTime = 1
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
  context.fillStyle = '#8d6657'
  context.beginPath()
  context.ellipse(x, y - 14, 27, 31, 0, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#c4937b'
  context.beginPath()
  context.moveTo(x - 22, y - 29)
  context.quadraticCurveTo(x - 42, y - 53, x - 25, y - 58)
  context.quadraticCurveTo(x - 10, y - 47, x - 10, y - 27)
  context.moveTo(x + 22, y - 29)
  context.quadraticCurveTo(x + 42, y - 53, x + 25, y - 58)
  context.quadraticCurveTo(x + 10, y - 47, x + 10, y - 27)
  context.fill()
  context.fillStyle = '#f4d7c8'
  context.beginPath()
  context.ellipse(x, y - 13, 20, 22, 0, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#473b35'
  context.beginPath()
  context.ellipse(x - 8, y - 16, 5, 7, 0, 0, Math.PI * 2)
  context.ellipse(x + 8, y - 16, 5, 7, 0, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#fff'
  context.beginPath()
  context.arc(x - 5, y - 18, 2, 0, Math.PI * 2)
  context.arc(x + 9, y - 18, 2, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = '#9c5d65'
  context.lineWidth = 2
  context.beginPath()
  context.arc(x, y - 8, 6, 0.2, Math.PI - 0.2)
  context.stroke()
  context.fillStyle = '#d87893'
  context.beginPath()
  context.moveTo(x - 13, y + 5)
  context.quadraticCurveTo(x - 42, y + 3, x - 39, y + 26)
  context.quadraticCurveTo(x - 20, y + 23, x - 7, y + 10)
  context.moveTo(x + 13, y + 5)
  context.quadraticCurveTo(x + 42, y + 3, x + 39, y + 26)
  context.quadraticCurveTo(x + 20, y + 23, x + 7, y + 10)
  context.closePath()
  context.fill()
  context.fillStyle = '#e9a8bc'
  context.beginPath()
  context.moveTo(x - 15, y + 6)
  context.lineTo(x + 15, y + 6)
  context.lineTo(x + 10, y + 29)
  context.lineTo(x - 10, y + 29)
  context.closePath()
  context.fill()
  drawSparkle(x + 30, y - 38, 5, '#fff1a8')
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

  const characterY = height * 0.66
  drawHeroine(characterX, characterY)

  if (mode === 'story' && status !== 'finished') {
    const enemyX = Math.max(characterX + 75, width - 82)
    drawMonster(enemyX, height * 0.48)
  }

  if (effectTime > 0) {
    effectTime = Math.max(0, effectTime - 0.035)
    const effectProgress = 1 - effectTime
    const radius = 18 + effectProgress * 46
    context.strokeStyle = `rgba(255, 202, 76, ${effectTime})`
    context.lineWidth = 5
    context.beginPath()
    context.arc(effectX, effectY, radius, 0, Math.PI * 2)
    context.stroke()
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6
      const sparkleX = effectX + Math.cos(angle) * radius
      const sparkleY = effectY + Math.sin(angle) * radius
      context.fillStyle = `rgba(255, 244, 174, ${effectTime})`
      context.font = 'bold 22px sans-serif'
      context.fillText('✦', sparkleX - 8, sparkleY)
    }
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
  status = 'playing'
  wordIndex = 0
  lessonIndex = 0
  learningSteps = mode === 'learn' && difficulty === 'normal'
    ? shuffledSteps(allKeySteps)
    : mode === 'learn' ? shuffledSteps(homePositionSteps)
      : mode === 'learn-all' ? shuffledSteps(allKeySteps) : allKeySteps
  inputIndex = 0
  score = 0
  misses = 0
  remaining = isLearningMode() ? 180 : difficultySettings[difficulty].time
  lastFrame = performance.now()
  startButton.disabled = true
  modeElement.disabled = true
  difficultyElement.disabled = true
  startButton.textContent = 'プレイ中'
  messageElement.textContent = 'ひらがなを見て、ローマ字を入力しよう！'
  if (mode === 'story') messageElement.textContent = '星の魔法で、じゃまモンスターを追いはらおう！'
  if (mode === 'learn' && difficulty === 'easy') messageElement.textContent = '指をホームポジションに置いて、光るキーを押そう！'
  if (mode === 'learn' && difficulty === 'normal') messageElement.textContent = '全キーからランダムに出題！ 指を動かして押そう！'
  if (mode === 'learn-all') messageElement.textContent = 'ホームポジションから指を動かして、光るキーを押そう！'
  if (mode === 'story') messageElement.textContent = getStorySetting().goal
  learnGuide.hidden = !isLearningMode()
  updateWord()
  updateStats()
}

function handleKeydown(event: KeyboardEvent) {
  if (status !== 'playing' || event.key.length !== 1 || !/^[a-zA-Z;]$/.test(event.key)) return

  if (isLearningMode()) {
    const step = getLearningSteps()[lessonIndex]
    if (event.key.toLowerCase() !== step.key) {
      misses += 1
      playTone(180, 0.12, 'square')
      messageElement.textContent = `${step.finger}で ${step.key.toUpperCase()} を押してみよう`
      updateStats()
      return
    }
    score += 1
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
  if (event.key.toLowerCase() !== expected) {
    misses += 1
    playTone(180, 0.12, 'square')
    messageElement.textContent = mode === 'story'
      ? 'モモがそばにいるよ。ゆっくり、つぎの文字を見てみよう！'
      : 'おしい！ つぎの文字を見てみよう'
    updateStats()
    return
  }

  inputIndex += 1
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
    triggerSuccessEffect()
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
  learnGuide.hidden = !isLearningMode()
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
drawScene()
timer = requestAnimationFrame(tick)

window.addEventListener('beforeunload', () => cancelAnimationFrame(timer))
