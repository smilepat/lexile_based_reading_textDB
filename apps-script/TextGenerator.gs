/**
 * Lexile Reading Text DB - AI Text Generator
 * Claude API를 활용한 텍스트 자동 생성
 */

// ==================== API 설정 ====================

function setApiKey() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    'Claude API Key 설정',
    'Anthropic API 키를 입력하세요:',
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() === ui.Button.OK) {
    PropertiesService.getScriptProperties().setProperty('CLAUDE_API_KEY', result.getResponseText().trim());
    ui.alert('API Key가 저장되었습니다.');
  }
}

function getApiKey_() {
  return PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
}

// ==================== 프롬프트 생성 ====================

function generateTextPrompt(genre, lengthType, lexileBand, topic, ageGroup, vocabularyBand) {
  const lengthTargets = {
    'Micro': { words: 50, range: '40-60' },
    'Short': { words: 100, range: '80-120' },
    'Medium': { words: 200, range: '170-230' },
    'Long': { words: 350, range: '280-420' }
  };

  const target = lengthTargets[lengthType] || lengthTargets['Short'];

  const genreInstructions = {
    'Narrative': 'Write a story or personal experience with characters, setting, and events in chronological order.',
    'Expository': 'Write an explanatory text that clearly explains a concept or process with examples.',
    'Informational': 'Write a factual text presenting objective information, similar to a news article or report.',
    'Argumentative': 'Write a text that presents a clear claim supported by reasons and evidence.',
    'Procedural': 'Write a how-to text with clear step-by-step instructions.',
    'Literary': 'Write an expressive essay or literary piece with attention to style and emotional depth.'
  };

  return `You are an expert EFL (English as a Foreign Language) reading text writer for Korean students.

TASK: Generate a reading passage with the following specifications:

- **Lexile Band**: ${lexileBand}
- **Genre**: ${genre} - ${genreInstructions[genre] || ''}
- **Target Word Count**: ${target.words} words (acceptable range: ${target.range} words)
- **Topic**: ${topic}
- **Target Age Group**: ${ageGroup}
- **Vocabulary Level**: ${vocabularyBand || 'appropriate for the Lexile band'}

CONSTRAINTS:
1. The text MUST be within the word count range (${target.range} words). This is critical.
2. Use vocabulary and sentence structures appropriate for Lexile ${lexileBand}.
3. Content must be age-appropriate for ${ageGroup} Korean students.
4. Avoid culturally sensitive, politically charged, or inappropriate content.
5. Use natural, authentic English - not simplified textbook English.
6. Each sentence should be clear and complete.

OUTPUT FORMAT (JSON only, no markdown):
{
  "text_body": "The full reading passage text here...",
  "sentence_count": <number>,
  "word_count": <number>,
  "vocabulary_notes": "Brief note on key vocabulary used",
  "lexile_estimate": <estimated Lexile score as number>
}`;
}

// ==================== Claude API 호출 ====================

function callClaudeAPI(prompt) {
  const apiKey = getApiKey_();
  if (!apiKey) {
    throw new Error('API Key가 설정되지 않았습니다. 메뉴 > AI Text Generation > Set API Key에서 설정하세요.');
  }

  const payload = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: prompt }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', options);
  const responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    throw new Error(`API Error (${responseCode}): ${response.getContentText()}`);
  }

  const result = JSON.parse(response.getContentText());
  const content = result.content[0].text;

  // JSON 파싱 (코드블록 제거)
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(jsonStr);
}

// ==================== 선택 행 텍스트 생성 ====================

function generateTextForSelectedRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(MASTER_SHEET);
  const row = SpreadsheetApp.getActiveRange().getRow();

  if (row < 2) {
    SpreadsheetApp.getUi().alert('데이터 행을 선택해주세요.');
    return;
  }

  const band = sheet.getRange(row, COL.LEXILE_BAND).getValue();
  const genre = sheet.getRange(row, COL.GENRE).getValue();
  const lengthType = sheet.getRange(row, COL.LENGTH_TYPE).getValue();
  const topic = sheet.getRange(row, COL.TOPIC).getValue();
  const ageGroup = sheet.getRange(row, COL.AGE_GROUP).getValue();
  const vocabBand = sheet.getRange(row, COL.VOCABULARY_BAND).getValue();

  if (!band || !genre || !lengthType) {
    SpreadsheetApp.getUi().alert('lexile_band, genre, length_type를 먼저 입력해주세요.');
    return;
  }

  const topicToUse = topic || getDefaultTopic_(genre, ageGroup);

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('텍스트 생성 중...', 'AI Generator', -1);

    const prompt = generateTextPrompt(genre, lengthType, band, topicToUse, ageGroup, vocabBand);
    const result = callClaudeAPI(prompt);

    // 결과 삽입
    sheet.getRange(row, COL.TEXT_BODY).setValue(result.text_body);
    sheet.getRange(row, COL.WORD_COUNT).setValue(result.word_count);
    sheet.getRange(row, COL.SENTENCE_COUNT).setValue(result.sentence_count);

    if (result.word_count && result.sentence_count) {
      const avg = Math.round((result.word_count / result.sentence_count) * 10) / 10;
      sheet.getRange(row, COL.AVG_SENTENCE_LENGTH).setValue(avg);
    }

    if (!topic) {
      sheet.getRange(row, COL.TOPIC).setValue(topicToUse);
    }

    if (!sheet.getRange(row, COL.CREATED_DATE).getValue()) {
      sheet.getRange(row, COL.CREATED_DATE).setValue(new Date());
    }

    SpreadsheetApp.getActiveSpreadsheet().toast('생성 완료!', 'AI Generator', 3);

  } catch (error) {
    SpreadsheetApp.getUi().alert(`생성 실패: ${error.message}`);
  }
}

// ==================== 일괄 생성 ====================

function batchGenerateTexts() {
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert(
    '일괄 텍스트 생성',
    'text_body가 비어있는 모든 행에 대해 텍스트를 생성합니다.\nAPI 비용이 발생할 수 있습니다. 계속하시겠습니까?',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(MASTER_SHEET);
  const data = sheet.getDataRange().getValues();

  let generated = 0;
  let failed = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const hasData = row[COL.LEXILE_BAND - 1] && row[COL.GENRE - 1] && row[COL.LENGTH_TYPE - 1];
    const hasText = row[COL.TEXT_BODY - 1];

    if (!hasData || hasText) continue;

    const rowNum = i + 1;
    const band = row[COL.LEXILE_BAND - 1];
    const genre = row[COL.GENRE - 1];
    const lengthType = row[COL.LENGTH_TYPE - 1];
    const topic = row[COL.TOPIC - 1] || getDefaultTopic_(genre, row[COL.AGE_GROUP - 1]);
    const ageGroup = row[COL.AGE_GROUP - 1];
    const vocabBand = row[COL.VOCABULARY_BAND - 1];

    try {
      ss.toast(`행 ${rowNum} 생성 중... (${generated + 1}번째)`, 'Batch Generate', -1);

      const prompt = generateTextPrompt(genre, lengthType, band, topic, ageGroup, vocabBand);
      const result = callClaudeAPI(prompt);

      sheet.getRange(rowNum, COL.TEXT_BODY).setValue(result.text_body);
      sheet.getRange(rowNum, COL.WORD_COUNT).setValue(result.word_count);
      sheet.getRange(rowNum, COL.SENTENCE_COUNT).setValue(result.sentence_count);

      if (result.word_count && result.sentence_count) {
        const avg = Math.round((result.word_count / result.sentence_count) * 10) / 10;
        sheet.getRange(rowNum, COL.AVG_SENTENCE_LENGTH).setValue(avg);
      }

      if (!row[COL.TOPIC - 1]) {
        sheet.getRange(rowNum, COL.TOPIC).setValue(topic);
      }

      sheet.getRange(rowNum, COL.CREATED_DATE).setValue(new Date());
      generated++;

      // API rate limit 방지
      Utilities.sleep(1000);

    } catch (error) {
      failed++;
      sheet.getRange(rowNum, COL.NOTES).setValue(`생성 실패: ${error.message}`);
    }
  }

  ui.alert(`일괄 생성 완료!\n성공: ${generated}개\n실패: ${failed}개`);
}

// ==================== 기본 주제 ====================

function getDefaultTopic_(genre, ageGroup) {
  const topicMap = {
    'Middle School': {
      'Narrative': 'Friendship',
      'Expository': 'Science and Nature',
      'Informational': 'Daily Life',
      'Argumentative': 'School Rules',
      'Procedural': 'Cooking',
      'Literary': 'Growing Up'
    },
    'Upper Secondary': {
      'Narrative': 'Adventure',
      'Expository': 'Technology',
      'Informational': 'World News',
      'Argumentative': 'Environment',
      'Procedural': 'Study Skills',
      'Literary': 'Identity'
    }
  };

  const defaults = {
    'Narrative': 'Daily Life',
    'Expository': 'Nature',
    'Informational': 'General Knowledge',
    'Argumentative': 'Opinion',
    'Procedural': 'How-to',
    'Literary': 'Feelings'
  };

  if (topicMap[ageGroup] && topicMap[ageGroup][genre]) {
    return topicMap[ageGroup][genre];
  }
  return defaults[genre] || 'General';
}
