/**
 * Lexile Reading Text DB - Main Script
 * Google Sheets용 메인 Apps Script
 */

// ==================== 상수 ====================
const MASTER_SHEET = 'READING_TEXT_MASTER';
const CONFIG_SHEET = 'CONFIG';
const COVERAGE_SHEET = 'COVERAGE_MATRIX';

const COL = {
  TEXT_ID: 1,
  LEXILE_BAND: 2,
  LEXILE_SCORE: 3,
  AGE_GROUP: 4,
  GRADE_HINT: 5,
  GENRE: 6,
  TOPIC: 7,
  WORD_COUNT: 8,
  LENGTH_TYPE: 9,
  TEXT_BODY: 10,
  SENTENCE_COUNT: 11,
  AVG_SENTENCE_LENGTH: 12,
  VOCABULARY_BAND: 13,
  INTENDED_USE: 14,
  CREATED_DATE: 15,
  NOTES: 16
};

const GENRE_CODES = {
  'Narrative': 'NAR',
  'Expository': 'EXP',
  'Informational': 'INF',
  'Argumentative': 'ARG',
  'Procedural': 'PRO',
  'Literary': 'LIT'
};

// ==================== 메뉴 ====================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Reading Text DB')
    .addItem('Generate Text ID (선택 행)', 'generateTextIdForSelectedRow')
    .addItem('Auto-fill All IDs', 'autoFillAllIds')
    .addSeparator()
    .addItem('Validate All Data', 'runValidation')
    .addItem('Validate Selected Row', 'validateSelectedRow')
    .addSeparator()
    .addItem('Update Coverage Matrix', 'createCoverageMatrix')
    .addSeparator()
    .addSubMenu(ui.createMenu('AI Text Generation')
      .addItem('Generate for Selected Row', 'generateTextForSelectedRow')
      .addItem('Batch Generate (Empty Slots)', 'batchGenerateTexts')
      .addItem('Set API Key', 'setApiKey'))
    .addSeparator()
    .addItem('Setup Sheets (초기 설정)', 'setupSheets')
    .addToUi();
}

// ==================== 초기 설정 ====================

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // READING_TEXT_MASTER 시트
  let master = ss.getSheetByName(MASTER_SHEET);
  if (!master) {
    master = ss.insertSheet(MASTER_SHEET);
  }
  const headers = [
    'text_id', 'lexile_band', 'lexile_score', 'age_group', 'grade_hint',
    'genre', 'topic', 'word_count', 'length_type', 'text_body',
    'sentence_count', 'avg_sentence_length', 'vocabulary_band',
    'intended_use', 'created_date', 'notes'
  ];
  master.getRange(1, 1, 1, headers.length).setValues([headers]);
  master.getRange(1, 1, 1, headers.length)
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  master.setFrozenRows(1);

  // CONFIG 시트
  setupConfigSheet_(ss);

  // COVERAGE_MATRIX 시트
  let coverage = ss.getSheetByName(COVERAGE_SHEET);
  if (!coverage) {
    coverage = ss.insertSheet(COVERAGE_SHEET);
  }

  // 데이터 검증 (드롭다운) 설정
  setupDataValidation_(master);

  SpreadsheetApp.getUi().alert('Setup Complete! 초기 설정이 완료되었습니다.');
}

function setupConfigSheet_(ss) {
  let config = ss.getSheetByName(CONFIG_SHEET);
  if (!config) {
    config = ss.insertSheet(CONFIG_SHEET);
  }
  config.clear();

  // Lexile Bands
  config.getRange('A1').setValue('Lexile Bands').setFontWeight('bold');
  const bands = [
    ['100-300', 'Early Elementary', '초1-2', '영어 문장 감각 형성'],
    ['300-500', 'Upper Elementary', '초3-4', '의미 단위 읽기'],
    ['500-700', 'Transitional', '초5-6', '문단 이해 시작'],
    ['700-900', 'Middle School', '중1-2', '정보 이해'],
    ['900-1100', 'Upper Secondary', '중3-고1', '논리·원인결과'],
    ['1100-1300', 'Pre-CSAT', '고2-3', '추상 개념'],
    ['1300-1500', 'Academic', '대학 초반', '학술 독해']
  ];
  config.getRange('A2').setValue('Band');
  config.getRange('B2').setValue('Age Group');
  config.getRange('C2').setValue('Grade');
  config.getRange('D2').setValue('Purpose');
  config.getRange(2, 1, 1, 4).setFontWeight('bold');
  config.getRange(3, 1, bands.length, 4).setValues(bands);

  // Genres (F열)
  config.getRange('F1').setValue('Genres').setFontWeight('bold');
  config.getRange('F2').setValue('Code');
  config.getRange('G2').setValue('Name');
  config.getRange('H2').setValue('Thinking Type');
  config.getRange(2, 6, 1, 3).setFontWeight('bold');
  const genres = [
    ['NAR', 'Narrative', '시간·사건'],
    ['EXP', 'Expository', '설명'],
    ['INF', 'Informational', '사실'],
    ['ARG', 'Argumentative', '주장·근거'],
    ['PRO', 'Procedural', '과정'],
    ['LIT', 'Literary', '정서·표현']
  ];
  config.getRange(3, 6, genres.length, 3).setValues(genres);

  // Length Types (J열)
  config.getRange('J1').setValue('Length Types').setFontWeight('bold');
  config.getRange('J2').setValue('Type');
  config.getRange('K2').setValue('Target Words');
  config.getRange('L2').setValue('Range');
  config.getRange('M2').setValue('Purpose');
  config.getRange(2, 10, 1, 4).setFontWeight('bold');
  const lengths = [
    ['Micro', 50, '40-60', '워밍업 / 문장 훈련'],
    ['Short', 100, '80-120', '수업용 핵심 독해'],
    ['Medium', 200, '170-230', '정독 훈련'],
    ['Long', 350, '280-420', '다독 / 시험 대비']
  ];
  config.getRange(3, 10, lengths.length, 4).setValues(lengths);

  // Vocabulary Bands (O열)
  config.getRange('O1').setValue('CEFR Bands').setFontWeight('bold');
  const vocabBands = [['Pre-A1'], ['A1'], ['A1/A2'], ['A2'], ['A2/B1'], ['B1'], ['B1/B2'], ['B2'], ['B2/C1'], ['C1']];
  config.getRange(2, 15, vocabBands.length, 1).setValues(vocabBands);

  // Intended Uses (P열)
  config.getRange('P1').setValue('Intended Uses').setFontWeight('bold');
  const uses = [['수업'], ['다독'], ['과제'], ['시험대비'], ['워밍업']];
  config.getRange(2, 16, uses.length, 1).setValues(uses);
}

function setupDataValidation_(master) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = ss.getSheetByName(CONFIG_SHEET);
  const lastRow = 1000; // 검증 적용 범위

  // lexile_band 드롭다운
  const bandRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(config.getRange('A3:A9'))
    .setAllowInvalid(false)
    .build();
  master.getRange(2, COL.LEXILE_BAND, lastRow).setDataValidation(bandRule);

  // genre 드롭다운
  const genreRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(config.getRange('G3:G8'))
    .setAllowInvalid(false)
    .build();
  master.getRange(2, COL.GENRE, lastRow).setDataValidation(genreRule);

  // length_type 드롭다운
  const lengthRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(config.getRange('J3:J6'))
    .setAllowInvalid(false)
    .build();
  master.getRange(2, COL.LENGTH_TYPE, lastRow).setDataValidation(lengthRule);

  // vocabulary_band 드롭다운
  const vocabRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(config.getRange('O2:O11'))
    .setAllowInvalid(false)
    .build();
  master.getRange(2, COL.VOCABULARY_BAND, lastRow).setDataValidation(vocabRule);

  // intended_use 드롭다운
  const useRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(config.getRange('P2:P6'))
    .setAllowInvalid(false)
    .build();
  master.getRange(2, COL.INTENDED_USE, lastRow).setDataValidation(useRule);
}

// ==================== Text ID 생성 ====================

function generateTextId(band, genre, wordCount, sheet) {
  const genreCode = GENRE_CODES[genre] || 'UNK';
  const bandNum = band.split('-')[0];

  // 기존 ID에서 같은 조합의 시퀀스 번호 찾기
  const data = sheet.getDataRange().getValues();
  const prefix = `L${bandNum}-${genreCode}-${wordCount}`;
  let maxSeq = 0;

  for (let i = 1; i < data.length; i++) {
    const id = data[i][0];
    if (id && id.startsWith(prefix)) {
      const seq = parseInt(id.split('-').pop(), 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  return `${prefix}-${String(maxSeq + 1).padStart(3, '0')}`;
}

function generateTextIdForSelectedRow() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MASTER_SHEET);
  const row = SpreadsheetApp.getActiveRange().getRow();

  if (row < 2) {
    SpreadsheetApp.getUi().alert('데이터 행을 선택해주세요.');
    return;
  }

  const band = sheet.getRange(row, COL.LEXILE_BAND).getValue();
  const genre = sheet.getRange(row, COL.GENRE).getValue();
  const wordCount = sheet.getRange(row, COL.WORD_COUNT).getValue();

  if (!band || !genre || !wordCount) {
    SpreadsheetApp.getUi().alert('lexile_band, genre, word_count를 먼저 입력해주세요.');
    return;
  }

  const id = generateTextId(band, genre, wordCount, sheet);
  sheet.getRange(row, COL.TEXT_ID).setValue(id);
}

function autoFillAllIds() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MASTER_SHEET);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][COL.TEXT_ID - 1]) continue; // 이미 ID가 있으면 건너뜀
    const band = data[i][COL.LEXILE_BAND - 1];
    const genre = data[i][COL.GENRE - 1];
    const wordCount = data[i][COL.WORD_COUNT - 1];

    if (band && genre && wordCount) {
      const id = generateTextId(band, genre, wordCount, sheet);
      sheet.getRange(i + 1, COL.TEXT_ID).setValue(id);
    }
  }
}

// ==================== 자동 계산 (onEdit) ====================

function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== MASTER_SHEET) return;

  const row = e.range.getRow();
  const col = e.range.getColumn();

  if (row < 2) return;

  // text_body가 편집되면 word_count, sentence_count, avg_sentence_length 자동 계산
  if (col === COL.TEXT_BODY) {
    const text = e.range.getValue();
    if (!text) return;

    const stats = calculateTextStats(text);
    sheet.getRange(row, COL.WORD_COUNT).setValue(stats.wordCount);
    sheet.getRange(row, COL.SENTENCE_COUNT).setValue(stats.sentenceCount);
    sheet.getRange(row, COL.AVG_SENTENCE_LENGTH).setValue(stats.avgSentenceLength);

    // length_type 자동 결정
    sheet.getRange(row, COL.LENGTH_TYPE).setValue(getlengthType(stats.wordCount));

    // created_date 자동 설정 (비어있을 때만)
    if (!sheet.getRange(row, COL.CREATED_DATE).getValue()) {
      sheet.getRange(row, COL.CREATED_DATE).setValue(new Date());
    }
  }
}

function calculateTextStats(text) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const avgSentenceLength = sentenceCount > 0
    ? Math.round((wordCount / sentenceCount) * 10) / 10
    : 0;

  return { wordCount, sentenceCount, avgSentenceLength };
}

function getlengthType(wordCount) {
  if (wordCount <= 60) return 'Micro';
  if (wordCount <= 120) return 'Short';
  if (wordCount <= 230) return 'Medium';
  return 'Long';
}

// ==================== Coverage Matrix ====================

function createCoverageMatrix() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const master = ss.getSheetByName(MASTER_SHEET);
  let coverage = ss.getSheetByName(COVERAGE_SHEET);

  if (!coverage) {
    coverage = ss.insertSheet(COVERAGE_SHEET);
  }
  coverage.clear();

  const data = master.getDataRange().getValues();
  const genres = ['Narrative', 'Expository', 'Informational', 'Argumentative', 'Procedural', 'Literary'];
  const lengths = ['Micro', 'Short', 'Medium', 'Long'];

  // Band별 그룹핑
  const bandGroups = {};
  for (let i = 1; i < data.length; i++) {
    const band = data[i][COL.LEXILE_BAND - 1];
    const genre = data[i][COL.GENRE - 1];
    const lengthType = data[i][COL.LENGTH_TYPE - 1];

    if (!band || !genre || !lengthType) continue;

    if (!bandGroups[band]) bandGroups[band] = {};
    const key = `${genre}|${lengthType}`;
    bandGroups[band][key] = (bandGroups[band][key] || 0) + 1;
  }

  let currentRow = 1;
  coverage.getRange(currentRow, 1).setValue('COVERAGE MATRIX - Genre x Length Type')
    .setFontWeight('bold').setFontSize(14);
  currentRow += 2;

  const sortedBands = Object.keys(bandGroups).sort();
  if (sortedBands.length === 0) {
    // 빈 매트릭스 표시
    sortedBands.push('(No Data)');
  }

  for (const band of sortedBands) {
    coverage.getRange(currentRow, 1).setValue(`Lexile Band: ${band}`)
      .setFontWeight('bold').setFontSize(12).setBackground('#e8f0fe');
    currentRow++;

    // 헤더
    coverage.getRange(currentRow, 1).setValue('Genre');
    lengths.forEach((l, idx) => {
      coverage.getRange(currentRow, idx + 2).setValue(l);
    });
    coverage.getRange(currentRow, lengths.length + 2).setValue('Total');
    coverage.getRange(currentRow, 1, 1, lengths.length + 2).setFontWeight('bold');
    currentRow++;

    // 데이터
    for (const genre of genres) {
      coverage.getRange(currentRow, 1).setValue(genre);
      let rowTotal = 0;
      for (let j = 0; j < lengths.length; j++) {
        const key = `${genre}|${lengths[j]}`;
        const count = (bandGroups[band] && bandGroups[band][key]) || 0;
        coverage.getRange(currentRow, j + 2).setValue(count);
        if (count > 0) {
          coverage.getRange(currentRow, j + 2).setBackground('#d4edda');
        } else {
          coverage.getRange(currentRow, j + 2).setBackground('#f8d7da');
        }
        rowTotal += count;
      }
      coverage.getRange(currentRow, lengths.length + 2).setValue(rowTotal);
      currentRow++;
    }
    currentRow += 2;
  }
}
