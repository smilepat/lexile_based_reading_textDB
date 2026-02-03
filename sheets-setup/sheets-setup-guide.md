# Google Sheets 설정 가이드

## 빠른 시작 (3단계)

### Step 1: 스프레드시트 생성
1. [Google Sheets](https://sheets.google.com)에서 새 스프레드시트 생성
2. 이름: **"Lexile Reading Text DB"**

### Step 2: 데이터 가져오기
1. **File > Import** 선택
2. `READING_TEXT_MASTER_template.tsv` 업로드
3. Import location: **"Replace current sheet"** 선택
4. Separator type: **Tab** 선택
5. 시트 이름을 `READING_TEXT_MASTER`로 변경

### Step 3: Apps Script 설정
1. **Extensions > Apps Script** 클릭
2. `apps-script/` 폴더의 파일을 각각 추가:
   - `Code.gs` → 기본 파일에 붙여넣기
   - `TextGenerator.gs` → 새 파일 추가 (+ 버튼)
   - `Validation.gs` → 새 파일 추가 (+ 버튼)
   - `appsscript.json` → 좌측 설정(⚙️)에서 "Show appsscript.json" 체크 후 편집
3. 저장 후 시트 새로고침
4. 메뉴바에 **"Reading Text DB"** 메뉴 확인
5. **Reading Text DB > Setup Sheets (초기 설정)** 실행

---

## 시트 구조

### Sheet 1: READING_TEXT_MASTER (메인 DB)

| # | 컬럼명 | 타입 | 자동/수동 | 설명 |
|---|--------|------|-----------|------|
| A | text_id | String | 자동생성 | 고유 ID (예: L700-NAR-100-001) |
| B | lexile_band | String | 드롭다운 | Lexile 범위 (예: 700-900) |
| C | lexile_score | Number | 수동입력 | 정확한 Lexile 점수 |
| D | age_group | String | 자동매핑 | 연령대 (band에 따라 결정) |
| E | grade_hint | String | 수동입력 | 한국 학년 (예: 중2) |
| F | genre | String | 드롭다운 | 장르 6종 |
| G | topic | String | 수동입력 | 주제 (예: Friendship) |
| H | word_count | Number | 자동계산 | 단어 수 |
| I | length_type | String | 자동결정 | Micro/Short/Medium/Long |
| J | text_body | String | AI생성/수동 | 실제 지문 본문 |
| K | sentence_count | Number | 자동계산 | 문장 수 |
| L | avg_sentence_length | Number | 자동계산 | 평균 문장 길이 |
| M | vocabulary_band | String | 드롭다운 | CEFR 수준 |
| N | intended_use | String | 드롭다운 | 용도 (수업/다독/과제 등) |
| O | created_date | Date | 자동생성 | 생성일 |
| P | notes | String | 수동입력 | 교사용 메모 |

### Sheet 2: CONFIG (설정 시트)
- `Setup Sheets` 실행 시 자동 생성됨
- 드롭다운 목록 관리 (Lexile Bands, Genres, Length Types, CEFR Bands, 용도)
- 수정하면 MASTER 시트의 드롭다운에 즉시 반영

### Sheet 3: COVERAGE_MATRIX (현황 대시보드)
- **Reading Text DB > Update Coverage Matrix** 실행 시 자동 갱신
- Band별 Genre x Length 배치 현황을 색상으로 표시
- 녹색 = 텍스트 있음, 빨간색 = 비어있음

---

## 드롭다운 값 참조

### lexile_band
| Band | Age Group | 한국 학년 |
|------|-----------|-----------|
| 100-300 | Early Elementary | 초1-2 |
| 300-500 | Upper Elementary | 초3-4 |
| 500-700 | Transitional | 초5-6 |
| 700-900 | Middle School | 중1-2 |
| 900-1100 | Upper Secondary | 중3-고1 |
| 1100-1300 | Pre-CSAT | 고2-3 |
| 1300-1500 | Academic | 대학 초반 |

### genre
| 코드 | 이름 | 사고 유형 |
|------|------|-----------|
| NAR | Narrative | 시간·사건 |
| EXP | Expository | 설명 |
| INF | Informational | 사실 |
| ARG | Argumentative | 주장·근거 |
| PRO | Procedural | 과정 |
| LIT | Literary | 정서·표현 |

### length_type
| 유형 | 목표 단어 수 | 허용 범위 | 용도 |
|------|-------------|-----------|------|
| Micro | 50 | 40-60 | 워밍업/문장 훈련 |
| Short | 100 | 80-120 | 수업 핵심 독해 |
| Medium | 200 | 170-230 | 정독 훈련 |
| Long | 350 | 280-420 | 다독/시험 대비 |

### vocabulary_band (CEFR)
Pre-A1 → A1 → A1/A2 → A2 → A2/B1 → B1 → B1/B2 → B2 → B2/C1 → C1

### intended_use
수업 / 다독 / 과제 / 시험대비 / 워밍업

---

## 자동 기능 안내

| 기능 | 트리거 | 설명 |
|------|--------|------|
| word_count 자동 계산 | text_body 입력 시 | 단어 수 자동 계산 |
| sentence_count 자동 계산 | text_body 입력 시 | 문장 수 자동 계산 |
| avg_sentence_length 자동 계산 | text_body 입력 시 | 평균 문장 길이 계산 |
| length_type 자동 결정 | text_body 입력 시 | 단어 수 기반 자동 분류 |
| created_date 자동 설정 | text_body 최초 입력 시 | 오늘 날짜 자동 입력 |
| text_id 생성 | 메뉴 실행 | band+genre+wordcount 기반 ID |

---

## 템플릿 슬롯 구성 (총 75개)

TSV 템플릿에는 **7개 Lexile Band x Genre x Length** 조합으로 총 75개 빈 슬롯이 포함되어 있습니다.

| Band | 슬롯 수 | 구성 |
|------|---------|------|
| 100-300L (초등 저) | 7 | NAR 3, EXP 2, PRO 2 (Micro/Short 위주) |
| 300-500L (초등 고) | 11 | NAR 4, EXP 3, INF 1, PRO 2, LIT 1 |
| 500-700L (전환기) | 14 | NAR 4, EXP 3, INF 2, ARG 1, PRO 2, LIT 2 |
| 700-900L (중등) | — | 이미 sample-data.csv에 18개 존재 |
| 900-1100L (중3-고1) | 18 | 전 장르 골고루, Long 포함 |
| 1100-1300L (수능대비) | 16 | ARG/EXP 비중 높음, Long 포함 |
| 1300-1500L (학술) | 8 | EXP/INF/ARG/LIT (Medium/Long) |

> PRD 설계 원칙에 따라 낮은 레벨은 Narrative/Procedural 비중이 높고, 높은 레벨은 Argumentative/Expository 비중이 높게 배치했습니다.
