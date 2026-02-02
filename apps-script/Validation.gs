/**
 * Lexile Reading Text DB - Validation Script
 * 데이터 유효성 검증 함수
 */

// ==================== Lexile Band 범위 매핑 ====================

const BAND_RANGES = {
  '100-300': { min: 100, max: 300 },
  '300-500': { min: 300, max: 500 },
  '500-700': { min: 500, max: 700 },
  '700-900': { min: 700, max: 900 },
  '900-1100': { min: 900, max: 1100 },
  '1100-1300': { min: 1100, max: 1300 },
  '1300-1500': { min: 1300, max: 1500 }
};

const LENGTH_RANGES = {
  'Micro': { min: 40, max: 60 },
  'Short': { min: 80, max: 120 },
  'Medium': { min: 170, max: 230 },
  'Long': { min: 280, max: 420 }
};

const AGE_ALLOWED_TOPICS = {
  'Early Elementary': ['family', 'animals', 'school', 'play', 'food', 'friends', 'nature'],
  'Upper Elementary': ['family', 'animals', 'school', 'nature', 'hobbies', 'sports', 'culture'],
  'Middle School': ['relationships', 'society', 'technology', 'nature', 'culture', 'science', 'friendship', 'environment'],
  'Upper Secondary': ['environment', 'technology', 'ethics', 'society', 'science', 'history', 'psychology'],
  'Pre-CSAT': ['environment', 'technology', 'ethics', 'society', 'science', 'philosophy', 'economics'],
  'Academic': ['academic', 'criticism', 'research', 'specialized']
};

// ==================== 행 단위 검증 ====================

function validateRow(rowData, rowNum) {
  const errors = [];

  const band = rowData[COL.LEXILE_BAND - 1];
  const score = rowData[COL.LEXILE_SCORE - 1];
  const ageGroup = rowData[COL.AGE_GROUP - 1];
  const genre = rowData[COL.GENRE - 1];
  const wordCount = rowData[COL.WORD_COUNT - 1];
  const lengthType = rowData[COL.LENGTH_TYPE - 1];
  const textBody = rowData[COL.TEXT_BODY - 1];

  // 1. 필수 필드 체크
  const requiredFields = [
    { col: COL.LEXILE_BAND, name: 'lexile_band', val: band },
    { col: COL.LEXILE_SCORE, name: 'lexile_score', val: score },
    { col: COL.GENRE, name: 'genre', val: genre },
    { col: COL.LENGTH_TYPE, name: 'length_type', val: lengthType }
  ];

  for (const field of requiredFields) {
    if (!field.val && field.val !== 0) {
      errors.push({
        row: rowNum,
        col: field.col,
        type: 'MISSING_REQUIRED',
        message: `${field.name} 필수 입력`
      });
    }
  }

  // 2. Lexile score가 band 범위 내인지
  if (band && score && BAND_RANGES[band]) {
    const range = BAND_RANGES[band];
    if (score < range.min || score > range.max) {
      errors.push({
        row: rowNum,
        col: COL.LEXILE_SCORE,
        type: 'SCORE_OUT_OF_BAND',
        message: `Lexile ${score}이 band ${band} 범위(${range.min}-${range.max})를 벗어남`
      });
    }
  }

  // 3. word_count와 length_type 일치 여부
  if (wordCount && lengthType && LENGTH_RANGES[lengthType]) {
    const range = LENGTH_RANGES[lengthType];
    if (wordCount < range.min || wordCount > range.max) {
      errors.push({
        row: rowNum,
        col: COL.WORD_COUNT,
        type: 'LENGTH_MISMATCH',
        message: `단어 수 ${wordCount}가 ${lengthType}(${range.min}-${range.max}) 범위에 맞지 않음`
      });
    }
  }

  // 4. text_body가 있으면 word_count 실제 검증
  if (textBody && wordCount) {
    const actualCount = textBody.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (Math.abs(actualCount - wordCount) > 5) {
      errors.push({
        row: rowNum,
        col: COL.TEXT_BODY,
        type: 'WORD_COUNT_MISMATCH',
        message: `text_body 실제 단어 수(${actualCount})와 word_count(${wordCount})가 불일치`
      });
    }
  }

  return errors;
}

// ==================== 전체 검증 ====================

function runValidation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(MASTER_SHEET);
  const data = sheet.getDataRange().getValues();
  const allErrors = [];

  // 기존 배경색 초기화
  if (data.length > 1) {
    sheet.getRange(2, 1, data.length - 1, data[0].length).setBackground(null);
  }

  for (let i = 1; i < data.length; i++) {
    // 빈 행 건너뛰기
    const hasData = data[i].some(cell => cell !== '' && cell !== null);
    if (!hasData) continue;

    const errors = validateRow(data[i], i + 1);
    allErrors.push(...errors);
  }

  // 오류 셀 하이라이트
  for (const error of allErrors) {
    sheet.getRange(error.row, error.col).setBackground('#ffcccc');
  }

  // 결과 표시
  if (allErrors.length === 0) {
    SpreadsheetApp.getUi().alert('검증 완료: 오류 없음!');
  } else {
    const summary = allErrors.map(e => `행 ${e.row}: ${e.message}`).join('\n');
    SpreadsheetApp.getUi().alert(
      `검증 완료: ${allErrors.length}개 오류 발견\n\n${summary.substring(0, 1000)}`
    );
  }

  return allErrors;
}

function validateSelectedRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(MASTER_SHEET);
  const row = SpreadsheetApp.getActiveRange().getRow();

  if (row < 2) {
    SpreadsheetApp.getUi().alert('데이터 행을 선택해주세요.');
    return;
  }

  const data = sheet.getRange(row, 1, 1, 16).getValues()[0];
  const errors = validateRow(data, row);

  if (errors.length === 0) {
    SpreadsheetApp.getUi().alert(`행 ${row}: 오류 없음!`);
  } else {
    for (const error of errors) {
      sheet.getRange(error.row, error.col).setBackground('#ffcccc');
    }
    const summary = errors.map(e => e.message).join('\n');
    SpreadsheetApp.getUi().alert(`행 ${row}: ${errors.length}개 오류\n\n${summary}`);
  }
}

// ==================== 연령 적합성 경고 ====================

function checkAgeSuitability(genre, topic, ageGroup) {
  const warnings = [];

  // 낮은 연령대에 Argumentative 장르 경고
  if (['Early Elementary', 'Upper Elementary'].includes(ageGroup) && genre === 'Argumentative') {
    warnings.push(`${ageGroup} 수준에 Argumentative 장르는 부적합할 수 있습니다.`);
  }

  // 높은 난이도 장르를 낮은 연령대에 배치 경고
  if (ageGroup === 'Early Elementary' && ['Expository', 'Informational'].includes(genre)) {
    warnings.push(`${ageGroup} 수준에 ${genre} 장르는 제한적으로 사용하세요.`);
  }

  return warnings;
}

// ==================== 중복 체크 ====================

function checkDuplicates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(MASTER_SHEET);
  const data = sheet.getDataRange().getValues();
  const ids = new Map();
  const duplicates = [];

  for (let i = 1; i < data.length; i++) {
    const id = data[i][COL.TEXT_ID - 1];
    if (!id) continue;

    if (ids.has(id)) {
      duplicates.push({ id, rows: [ids.get(id), i + 1] });
    } else {
      ids.set(id, i + 1);
    }
  }

  if (duplicates.length > 0) {
    const summary = duplicates.map(d => `ID "${d.id}": 행 ${d.rows.join(', ')}`).join('\n');
    SpreadsheetApp.getUi().alert(`중복 ID 발견:\n${summary}`);
  } else {
    SpreadsheetApp.getUi().alert('중복 ID 없음!');
  }

  return duplicates;
}
