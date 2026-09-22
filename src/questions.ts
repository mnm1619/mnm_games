export type Difficulty = 'easy' | 'normal' | 'hard'

export type TypingQuestion = {
  kana: string
  romaji: string
}

export type DifficultySetting = {
  label: string
  time: number
  questions: TypingQuestion[]
}

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
