export type Difficulty = 'easy' | 'normal' | 'hard'
export type Finger = '左小指' | '左薬指' | '左中指' | '左人差し指' | '右人差し指' | '右中指' | '右薬指' | '右小指'

export type LearningStep = {
  key: string
  finger: Finger
  title: string
  message: string
}

export type TypingQuestion = {
  kana: string
  romaji: string
}

export type DifficultySetting = {
  label: string
  time: number
  questions: TypingQuestion[]
}

export const homePositionSteps: LearningStep[] = [
  { key: 'a', finger: '左小指', title: '左手の小指', message: '左手の小指を A にそっと置こう' },
  { key: 's', finger: '左薬指', title: '左手の薬指', message: '左手の薬指を S に置こう' },
  { key: 'd', finger: '左中指', title: '左手の中指', message: '左手の中指を D に置こう' },
  { key: 'f', finger: '左人差し指', title: '左手の人差し指', message: '左手の人差し指を F に置こう' },
  { key: 'j', finger: '右人差し指', title: '右手の人差し指', message: '右手の人差し指を J に置こう' },
  { key: 'k', finger: '右中指', title: '右手の中指', message: '右手の中指を K に置こう' },
  { key: 'l', finger: '右薬指', title: '右手の薬指', message: '右手の薬指を L に置こう' },
  { key: ';', finger: '右小指', title: '右手の小指', message: '右手の小指を ; に置こう' },
]

const fingerByKey: Record<string, Finger> = {
  q: '左小指', w: '左薬指', e: '左中指', r: '左人差し指', t: '左人差し指',
  y: '右人差し指', u: '右人差し指', i: '右中指', o: '右薬指', p: '右小指',
  a: '左小指', s: '左薬指', d: '左中指', f: '左人差し指', g: '左人差し指',
  h: '右人差し指', j: '右人差し指', k: '右中指', l: '右薬指',
  z: '左小指', x: '左薬指', c: '左中指', v: '左人差し指', b: '左人差し指',
  n: '右人差し指', m: '右人差し指',
}

export const allKeySteps: LearningStep[] = Object.keys(fingerByKey).map((key) => ({
  key,
  finger: fingerByKey[key],
  title: `${key.toUpperCase()} キーの練習`,
  message: `${fingerByKey[key]}で ${key.toUpperCase()} を押してみよう`,
}))

const wordPrefixes: TypingQuestion[] = [
  { kana: 'あまい', romaji: 'amai' }, { kana: 'あおい', romaji: 'aoi' },
  { kana: 'あかるい', romaji: 'akarui' }, { kana: 'かわいい', romaji: 'kawaii' },
  { kana: 'きれいな', romaji: 'kireina' }, { kana: 'しずかな', romaji: 'shizukana' },
  { kana: 'すてきな', romaji: 'sutekina' }, { kana: 'ちいさな', romaji: 'chiisana' },
  { kana: 'つよい', romaji: 'tsuyoi' }, { kana: 'なかよしの', romaji: 'nakayoshino' },
  { kana: 'ひかる', romaji: 'hikaru' }, { kana: 'ふわふわの', romaji: 'fuwafuwano' },
  { kana: 'まるい', romaji: 'marui' }, { kana: 'みどりの', romaji: 'midorino' },
  { kana: 'やさしい', romaji: 'yasashii' }, { kana: 'ゆめみる', romaji: 'yumemiru' },
  { kana: 'よるの', romaji: 'yoruno' }, { kana: 'たのしい', romaji: 'tanoshii' },
  { kana: 'りっぱな', romaji: 'rippana' }, { kana: 'わくわくする', romaji: 'wakuwakusuru' },
]

const wordNouns: TypingQuestion[] = [
  { kana: 'もも', romaji: 'momo' }, { kana: 'フクロモモンガ', romaji: 'fukuromomonga' },
  { kana: 'みみ', romaji: 'mimi' }, { kana: 'おめめ', romaji: 'omeme' },
  { kana: 'はな', romaji: 'hana' }, { kana: 'しっぽ', romaji: 'shippo' },
  { kana: 'おなか', romaji: 'onaka' }, { kana: 'け', romaji: 'ke' },
  { kana: 'つめ', romaji: 'tsume' }, { kana: 'ひげ', romaji: 'hige' },
  { kana: 'とびら', romaji: 'tobira' }, { kana: 'とぶすがた', romaji: 'tobusugata' },
  { kana: 'ひこう', romaji: 'hikou' }, { kana: 'かぜ', romaji: 'kaze' },
  { kana: 'そら', romaji: 'sora' }, { kana: 'ほし', romaji: 'hoshi' },
  { kana: 'ほしぞら', romaji: 'hoshizora' }, { kana: 'つき', romaji: 'tsuki' },
  { kana: 'よる', romaji: 'yoru' }, { kana: 'あさ', romaji: 'asa' },
  { kana: 'もり', romaji: 'mori' }, { kana: 'き', romaji: 'ki' },
  { kana: 'えだ', romaji: 'eda' }, { kana: 'きのみ', romaji: 'kinomi' },
  { kana: 'はっぱ', romaji: 'happa' }, { kana: 'おうち', romaji: 'ouchi' },
  { kana: 'す', romaji: 'su' }, { kana: 'ゆめ', romaji: 'yume' },
  { kana: 'ぼうけん', romaji: 'bouken' }, { kana: 'たんけん', romaji: 'tanken' },
  { kana: 'ひみつ', romaji: 'himitsu' }, { kana: 'たからもの', romaji: 'takaramono' },
  { kana: 'なかま', romaji: 'nakama' }, { kana: 'ともだち', romaji: 'tomodachi' },
  { kana: 'かぞく', romaji: 'kazoku' }, { kana: 'こころ', romaji: 'kokoro' },
  { kana: 'えがお', romaji: 'egao' }, { kana: 'おんがく', romaji: 'ongaku' },
  { kana: 'おと', romaji: 'oto' }, { kana: 'こえ', romaji: 'koe' },
  { kana: 'おやつ', romaji: 'oyatsu' }, { kana: 'くだもの', romaji: 'kudamono' },
  { kana: 'りんご', romaji: 'ringo' }, { kana: 'みかん', romaji: 'mikan' },
  { kana: 'はちみつ', romaji: 'hachimitsu' }, { kana: 'みず', romaji: 'mizu' },
  { kana: 'ゆっくり', romaji: 'yukkuri' }, { kana: 'すべる', romaji: 'suberu' },
  { kana: 'ねむる', romaji: 'nemuru' }, { kana: 'あそぶ', romaji: 'asobu' },
]

export const sugarGliderQuestionPool: TypingQuestion[] = wordPrefixes.flatMap((prefix) =>
  wordNouns.map((noun) => ({
    kana: `${prefix.kana}${noun.kana}`,
    romaji: `${prefix.romaji}${noun.romaji}`,
  })),
)

export const difficultySettings: Record<Difficulty, DifficultySetting> = {
  easy: {
    label: 'かんたん',
    time: 75,
    questions: [
      { kana: 'もも', romaji: 'momo' },
      { kana: 'みみ', romaji: 'mimi' },
      { kana: 'とぶ', romaji: 'tobu' },
      { kana: 'しっぽ', romaji: 'shippo' },
    ],
  },
  normal: {
    label: 'ふつう',
    time: 60,
    questions: [
      { kana: 'ふくろ', romaji: 'fukuro' },
      { kana: 'もりのなかま', romaji: 'morinonakama' },
      { kana: 'きのみ', romaji: 'kinomi' },
      { kana: 'ほしぞら', romaji: 'hoshizora' },
      { kana: 'すべりこむ', romaji: 'suberikomu' },
    ],
  },
  hard: {
    label: 'むずかしい',
    time: 60,
    questions: [
      { kana: 'フクロモモンガ', romaji: 'fukuromomonga' },
      { kana: 'おおきなおめめ', romaji: 'ookinaomeme' },
      { kana: 'そらをすべる', romaji: 'sorawosuberu' },
      { kana: 'なかまとよるのたんけん', romaji: 'nakamatoyorunotanken' },
    ],
  },
}
