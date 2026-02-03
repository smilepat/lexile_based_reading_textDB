/**
 * Lexile Reading Text DB - CSAT Question Generator
 * Reading DB 지문 → 수능형 문항 자동 생성
 */

// ==================== 문항 유형 정의 ====================

const QUESTION_TYPES = {
  'MI-01': { name: '글의 목적', minLexile: 700, minLength: 'Short', genres: ['Narrative', 'Procedural', 'Informational'] },
  'MI-02': { name: '주장/요지', minLexile: 700, minLength: 'Short', genres: ['Argumentative', 'Expository'] },
  'MI-03': { name: '주제', minLexile: 700, minLength: 'Short', genres: ['Expository', 'Informational', 'Argumentative'] },
  'MI-04': { name: '제목', minLexile: 700, minLength: 'Short', genres: ['Expository', 'Informational', 'Argumentative', 'Literary', 'Narrative'] },
  'DT-01': { name: '내용 일치/불일치', minLexile: 500, minLength: 'Short', genres: ['all'] },
  'IF-01': { name: '함축 의미 추론', minLexile: 900, minLength: 'Short', genres: ['Narrative', 'Argumentative', 'Literary'] },
  'IF-02': { name: '빈칸 추론 (구)', minLexile: 900, minLength: 'Short', genres: ['Expository', 'Informational', 'Argumentative'] },
  'IF-03': { name: '빈칸 추론 (문장)', minLexile: 1100, minLength: 'Medium', genres: ['Expository', 'Argumentative'] },
  'ST-01': { name: '무관한 문장', minLexile: 900, minLength: 'Medium', genres: ['Expository', 'Informational', 'Argumentative'] },
  'ST-02': { name: '문장 삽입', minLexile: 900, minLength: 'Medium', genres: ['Narrative', 'Expository', 'Argumentative', 'Literary'] },
  'ST-03': { name: '글의 순서', minLexile: 900, minLength: 'Medium', genres: ['Narrative', 'Expository', 'Argumentative'] },
  'VG-01': { name: '어법 판단', minLexile: 700, minLength: 'Short', genres: ['all'] },
  'VG-02': { name: '어휘 판단', minLexile: 700, minLength: 'Short', genres: ['all'] },
  'SM-01': { name: '요약문 완성', minLexile: 1100, minLength: 'Medium', genres: ['Expository', 'Informational', 'Argumentative'] }
};

const LENGTH_ORDER = { 'Micro': 0, 'Short': 1, 'Medium': 2, 'Long': 3 };

// ==================== 추천 문항 유형 ====================

function getRecommendedTypes(lexileScore, genre, lengthType) {
  const recommended = [];

  for (const [code, config] of Object.entries(QUESTION_TYPES)) {
    if (lexileScore < config.minLexile) continue;
    if (LENGTH_ORDER[lengthType] < LENGTH_ORDER[config.minLength]) continue;
    if (!config.genres.includes('all') && !config.genres.includes(genre)) continue;
    recommended.push(code);
  }

  return recommended;
}

// ==================== 문항 생성 프롬프트 ====================

function buildQuestionPrompt_(textData, questionType) {
  const typeInfo = QUESTION_TYPES[questionType];
  if (!typeInfo) throw new Error(`Unknown question type: ${questionType}`);

  const stemMap = {
    'MI-01': '다음 글의 목적으로 가장 적절한 것은?',
    'MI-02': '다음 글에서 필자가 주장하는 바로 가장 적절한 것은?',
    'MI-03': '다음 글의 주제로 가장 적절한 것은?',
    'MI-04': '다음 글의 제목으로 가장 적절한 것은?',
    'DT-01': '다음 글의 내용과 일치하지 않는 것은?',
    'IF-01': '다음 글의 밑줄 친 부분이 의미하는 바로 가장 적절한 것은?',
    'IF-02': '다음 빈칸에 들어갈 말로 가장 적절한 것은?',
    'IF-03': '다음 빈칸에 들어갈 말로 가장 적절한 것은?',
    'ST-01': '다음 글에서 전체 흐름과 관계없는 문장은?',
    'ST-02': '글의 흐름으로 보아, 주어진 문장이 들어가기에 가장 적절한 곳은?',
    'ST-03': '주어진 글 다음에 이어질 글의 순서로 가장 적절한 것은?',
    'VG-01': '다음 글의 밑줄 친 부분 중, 어법상 틀린 것은?',
    'VG-02': '다음 글의 밑줄 친 부분 중, 문맥상 낱말의 쓰임이 적절하지 않은 것은?',
    'SM-01': '다음 글의 내용을 한 문장으로 요약하고자 한다. 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?'
  };

  return `You are an expert Korean CSAT (수능) English test item writer.

SOURCE TEXT:
- text_id: ${textData.textId}
- Lexile: ${textData.lexileScore}
- Genre: ${textData.genre}
- Length Type: ${textData.lengthType}

PASSAGE:
${textData.textBody}

TASK: Generate a CSAT-style question of type "${questionType}" (${typeInfo.name}).
Question stem: "${stemMap[questionType]}"

RULES:
1. Exactly 5 choices (numbered 1-5). Exactly 1 correct answer.
2. Distractors must be plausible but clearly wrong.
3. The question must be answerable from the passage alone.
4. Follow real CSAT format and difficulty conventions.
5. Choices for MI-03, MI-04 should be in English.
6. Choices for MI-01, MI-02 should be in Korean.

OUTPUT FORMAT (JSON only, no markdown):
{
  "question_type": "${questionType}",
  "question_type_name": "${typeInfo.name}",
  "source_text_id": "${textData.textId}",
  "question_stem": "${stemMap[questionType]}",
  "modified_passage": "Only if the question requires modifying the passage (IF-02, IF-03, ST-01, ST-02, ST-03, VG-01, VG-02), otherwise null",
  "choices": [
    {"number": 1, "text": "...", "is_correct": false},
    {"number": 2, "text": "...", "is_correct": false},
    {"number": 3, "text": "...", "is_correct": true},
    {"number": 4, "text": "...", "is_correct": false},
    {"number": 5, "text": "...", "is_correct": false}
  ],
  "correct_answer": 3,
  "explanation": "Why the answer is correct (in Korean)",
  "difficulty": "easy|medium|hard|very_hard"
}`;
}

// ==================== 선택 행 문항 생성 ====================

function generateQuestionForSelectedRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(MASTER_SHEET);
  const ui = SpreadsheetApp.getUi();
  const row = SpreadsheetApp.getActiveRange().getRow();

  if (row < 2) {
    ui.alert('데이터 행을 선택해주세요.');
    return;
  }

  const data = sheet.getRange(row, 1, 1, 16).getValues()[0];
  const textData = {
    textId: data[COL.TEXT_ID - 1],
    lexileScore: data[COL.LEXILE_SCORE - 1],
    genre: data[COL.GENRE - 1],
    lengthType: data[COL.LENGTH_TYPE - 1],
    textBody: data[COL.TEXT_BODY - 1]
  };

  if (!textData.textBody) {
    ui.alert('text_body가 비어있습니다. 먼저 텍스트를 입력해주세요.');
    return;
  }

  // 추천 유형 계산
  const recommended = getRecommendedTypes(textData.lexileScore, textData.genre, textData.lengthType);
  if (recommended.length === 0) {
    ui.alert('이 지문에 적합한 문항 유형이 없습니다.');
    return;
  }

  // 유형 선택 다이얼로그
  const typeList = recommended.map(code => `${code}: ${QUESTION_TYPES[code].name}`).join('\n');
  const result = ui.prompt(
    '문항 유형 선택',
    `추천 문항 유형:\n${typeList}\n\n생성할 유형 코드를 입력하세요 (예: MI-03):`,
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() !== ui.Button.OK) return;

  const selectedType = result.getResponseText().trim().toUpperCase();
  if (!recommended.includes(selectedType)) {
    ui.alert(`"${selectedType}"은(는) 이 지문에 적합하지 않은 유형입니다.`);
    return;
  }

  try {
    ss.toast('문항 생성 중...', 'Question Generator', -1);

    const prompt = buildQuestionPrompt_(textData, selectedType);
    const questionData = callClaudeAPI(prompt);

    // QUESTION_BANK 시트에 저장
    saveQuestion_(ss, questionData, textData);

    ss.toast('문항 생성 완료! QUESTION_BANK 시트를 확인하세요.', 'Question Generator', 5);

  } catch (error) {
    ui.alert(`문항 생성 실패: ${error.message}`);
  }
}

// ==================== 문항 저장 ====================

function saveQuestion_(ss, questionData, textData) {
  let qSheet = ss.getSheetByName('QUESTION_BANK');
  if (!qSheet) {
    qSheet = ss.insertSheet('QUESTION_BANK');
    const headers = [
      'question_id', 'source_text_id', 'question_type', 'question_type_name',
      'question_stem', 'modified_passage',
      'choice_1', 'choice_2', 'choice_3', 'choice_4', 'choice_5',
      'correct_answer', 'explanation', 'difficulty', 'created_date'
    ];
    qSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    qSheet.getRange(1, 1, 1, headers.length)
      .setBackground('#34a853')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    qSheet.setFrozenRows(1);
  }

  // question_id 생성
  const lastRow = qSheet.getLastRow();
  const seq = lastRow; // header 제외하면 데이터 행 수 = lastRow - 1, 새 번호 = lastRow
  const qId = `Q-${textData.textId}-${questionData.question_type}-${String(seq).padStart(3, '0')}`;

  const choices = questionData.choices || [];
  const newRow = [
    qId,
    questionData.source_text_id || textData.textId,
    questionData.question_type,
    questionData.question_type_name,
    questionData.question_stem,
    questionData.modified_passage || '',
    choices[0] ? choices[0].text : '',
    choices[1] ? choices[1].text : '',
    choices[2] ? choices[2].text : '',
    choices[3] ? choices[3].text : '',
    choices[4] ? choices[4].text : '',
    questionData.correct_answer,
    questionData.explanation || '',
    questionData.difficulty || '',
    new Date()
  ];

  qSheet.getRange(lastRow + 1, 1, 1, newRow.length).setValues([newRow]);

  // 정답 셀 하이라이트
  const correctCol = 6 + questionData.correct_answer; // choice_1 = col 7
  qSheet.getRange(lastRow + 1, correctCol).setBackground('#d4edda');
}

// ==================== 일괄 문항 생성 ====================

function batchGenerateQuestions() {
  const ui = SpreadsheetApp.getUi();

  const result = ui.prompt(
    '일괄 문항 생성',
    '생성할 문항 유형 코드를 쉼표로 입력하세요.\n(예: MI-03,VG-02,IF-02)\n\n비워두면 각 지문에 추천 유형 1개씩 자동 생성합니다.',
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() !== ui.Button.OK) return;

  const inputTypes = result.getResponseText().trim();
  const requestedTypes = inputTypes ? inputTypes.split(',').map(t => t.trim().toUpperCase()) : null;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(MASTER_SHEET);
  const data = sheet.getDataRange().getValues();

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const textBody = row[COL.TEXT_BODY - 1];
    if (!textBody) { skipped++; continue; }

    const textData = {
      textId: row[COL.TEXT_ID - 1],
      lexileScore: row[COL.LEXILE_SCORE - 1],
      genre: row[COL.GENRE - 1],
      lengthType: row[COL.LENGTH_TYPE - 1],
      textBody: textBody
    };

    const recommended = getRecommendedTypes(textData.lexileScore, textData.genre, textData.lengthType);
    if (recommended.length === 0) { skipped++; continue; }

    // 생성할 유형 결정
    let typesToGenerate;
    if (requestedTypes) {
      typesToGenerate = requestedTypes.filter(t => recommended.includes(t));
    } else {
      typesToGenerate = [recommended[0]]; // 추천 유형 첫 번째
    }

    if (typesToGenerate.length === 0) { skipped++; continue; }

    for (const qType of typesToGenerate) {
      try {
        ss.toast(`행 ${i + 1}: ${qType} 생성 중... (${generated + 1}번째)`, 'Batch Questions', -1);

        const prompt = buildQuestionPrompt_(textData, qType);
        const questionData = callClaudeAPI(prompt);
        saveQuestion_(ss, questionData, textData);
        generated++;

        Utilities.sleep(1000); // rate limit
      } catch (error) {
        failed++;
      }
    }
  }

  ui.alert(`일괄 문항 생성 완료!\n성공: ${generated}개\n건너뜀: ${skipped}개\n실패: ${failed}개`);
}
