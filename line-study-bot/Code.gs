const CONFIG = {
  usersSheet: 'Users',
  questionsSheet: 'Questions',
  tokenProperty: 'LINE_CHANNEL_ACCESS_TOKEN',
}

function doGet() {
  return ContentService.createTextOutput('OK')
}

function doPost(event) {
  const contents = event.postData?.contents
  if (!contents) return ContentService.createTextOutput('OK')

  const body = JSON.parse(contents)
  body.events?.forEach(handleEvent)
  return ContentService.createTextOutput('OK')
}

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return

  const userId = event.source.userId
  const text = event.message.text.trim()
  saveUser(userId)

  if (text === '登録' || text === 'とうろく') {
    reply(event.replyToken, '登録しました。毎日の問題を受け取れます。')
    return
  }

  const question = getTodayQuestion()
  if (!question) {
    reply(event.replyToken, '今日の問題はまだ用意されていません。')
    return
  }

  const answer = text.toUpperCase()
  if (answer !== question.answer.toUpperCase()) {
    reply(event.replyToken, `おしい！答えは ${question.answer} です。\n${question.explanation}`)
    return
  }

  reply(event.replyToken, `せいかい！\n${question.explanation}`)
}

function sendDailyQuestions() {
  const question = getTodayQuestion()
  if (!question) return

  const message = `【${question.subject}】\n${question.text}\n\n答えを A / B / C で送ってね。`
  getUsers().forEach((userId) => push(userId, message))
}

function getTodayQuestion() {
  const sheet = getSpreadsheet().getSheetByName(CONFIG.questionsSheet)
  if (!sheet) throw new Error(`シート「${CONFIG.questionsSheet}」がありません`)

  const rows = sheet.getDataRange().getValues()
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd')
  const row = rows.slice(1).find((values) => String(values[0]) === today)
  if (!row) return null

  return {
    subject: String(row[1]),
    text: String(row[2]),
    answer: String(row[3]),
    explanation: String(row[4]),
  }
}

function saveUser(userId) {
  const sheet = getSpreadsheet().getSheetByName(CONFIG.usersSheet)
  if (!sheet) throw new Error(`シート「${CONFIG.usersSheet}」がありません`)
  const registeredIds = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1)
    .getValues()
    .flat()
    .map(String)

  if (!registeredIds.includes(userId)) sheet.appendRow([userId, new Date()])
}

function getUsers() {
  const sheet = getSpreadsheet().getSheetByName(CONFIG.usersSheet)
  if (!sheet || sheet.getLastRow() < 2) return []
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat().map(String).filter(Boolean)
}

function reply(replyToken, text) {
  callLine('/v2/bot/message/reply', { replyToken, messages: [{ type: 'text', text }] })
}

function push(userId, text) {
  callLine('/v2/bot/message/push', { to: userId, messages: [{ type: 'text', text }] })
}

function callLine(path, payload) {
  const token = PropertiesService.getScriptProperties().getProperty(CONFIG.tokenProperty)
  if (!token) throw new Error(`${CONFIG.tokenProperty} が設定されていません`)

  UrlFetchApp.fetch(`https://api.line.me${path}`, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${token}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  })
}

function getSpreadsheet() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')
  return spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet()
}