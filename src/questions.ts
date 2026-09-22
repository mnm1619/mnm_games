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

export const difficultySettings: Record<Difficulty, DifficultySetting> = {
  easy: {
    label: 'かんたん',
    time: 75,
    questions: [
      { kana: 'ねこ', romaji: 'neko' },
      { kana: 'いぬ', romaji: 'inu' },
      { kana: 'そら', romaji: 'sora' },
      { kana: 'はな', romaji: 'hana' },
    ],
  },
  normal: {
    label: 'ふつう',
    time: 60,
    questions: [
      { kana: 'さくら', romaji: 'sakura' },
      { kana: 'りんご', romaji: 'ringo' },
      { kana: 'でんしゃ', romaji: 'densha' },
      { kana: 'ほしぞら', romaji: 'hoshizora' },
      { kana: 'たんけん', romaji: 'tanken' },
    ],
  },
  hard: {
    label: 'むずかしい',
    time: 60,
    questions: [
      { kana: 'おはようございます', romaji: 'ohayougozaimasu' },
      { kana: 'たいぴんぐをたのしもう', romaji: 'taipinguwotanoshimou' },
      { kana: 'きょうはいいてんきです', romaji: 'kyouhaiitenkidesu' },
      { kana: 'ほしぞらをたんけんしよう', romaji: 'hoshizorawotankenshiyou' },
    ],
  },
}
