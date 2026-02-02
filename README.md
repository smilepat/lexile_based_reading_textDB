# Lexile 기반 Reading Text DB

렉사일 지수·연령대·장르·텍스트 길이를 함께 고려한 **단계형 Reading Text 테이블** 시스템입니다.
Google Sheets + Apps Script 기반으로 동작하며, Claude API를 통한 텍스트 자동 생성을 지원합니다.

---

## 프로젝트 구조

```
lexile_based_reading_textDB/
├── PRDlexilereadingtext.ini          # PRD (기획 문서)
├── README.md                         # 이 파일
├── sheets-setup/
│   ├── schema.json                   # Sheets 컬럼 스키마 + CONFIG/COVERAGE 정의
│   └── sample-data.csv              # 700-900L Band 18개 샘플 텍스트 (본문 포함)
├── apps-script/
│   ├── appsscript.json              # Apps Script 프로젝트 매니페스트
│   ├── Code.gs                      # 메인 스크립트 (메뉴, ID 생성, 자동 계산, Coverage Matrix)
│   ├── Validation.gs                # 데이터 검증 (Band/Length 범위, 필수필드, 연령 적합성)
│   └── TextGenerator.gs             # AI 텍스트 생성 (Claude API 연동, 개별/일괄 생성)
└── prompts/
    └── text-generation-prompt.md    # Claude용 텍스트 생성 프롬프트 템플릿
```

---

## 핵심 기능 요약

| 기능 | 설명 |
|------|------|
| **자동 ID 생성** | `L700-NAR-100-001` 형식으로 Band-Genre-Length-순번 자동 부여 |
| **자동 계산** | text_body 입력 시 word_count, sentence_count, avg_sentence_length 자동 산출 |
| **데이터 검증** | Lexile score/Band 범위 불일치, word_count/length_type 불일치, 필수필드 누락 경고 |
| **Coverage Matrix** | Genre × Length Type 배치 현황 대시보드 자동 생성 (Band별) |
| **AI 텍스트 생성** | Claude API로 Lexile/Genre/Length/Age 조건에 맞는 텍스트 개별·일괄 생성 |
| **드롭다운 메뉴** | CONFIG 시트 기반 genre, length_type, vocabulary_band 등 선택식 입력 |
| **연령 적합성 체크** | 연령대별 허용/제한 주제 및 장르 경고 |

---

## Google Sheets 구조

### Sheet 1: READING_TEXT_MASTER (메인 DB)

| 컬럼명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| text_id | STRING | 고유 ID (자동 생성) | L700-NAR-100-001 |
| lexile_band | STRING | Lexile 범위 | 700-900 |
| lexile_score | NUMBER | 정확한 Lexile 점수 | 820 |
| age_group | STRING | 연령대 | Middle School |
| grade_hint | STRING | 학년 힌트 (한국 기준) | 중2 |
| genre | STRING | 장르 | Narrative |
| topic | STRING | 주제 | Friendship |
| word_count | NUMBER | 단어 수 (자동 계산) | 100 |
| length_type | STRING | 길이 유형 | Short |
| text_body | STRING | 실제 지문 본문 | (reading passage) |
| sentence_count | NUMBER | 문장 수 (자동 계산) | 6 |
| avg_sentence_length | NUMBER | 평균 문장 길이 (자동 계산) | 16.7 |
| vocabulary_band | STRING | CEFR 어휘 수준 | A2/B1 |
| intended_use | STRING | 용도 | 수업 / 다독 / 과제 |
| created_date | DATE | 생성일 | 2026-02-01 |
| notes | STRING | 교사용 메모 | |

### Sheet 2: CONFIG (설정 데이터)

드롭다운 및 검증 기준을 관리하는 시트입니다.

- **Lexile Bands**: 7개 Band 정의 (100-300L ~ 1300-1500L)
- **Genres**: 6개 장르 (Narrative, Expository, Informational, Argumentative, Procedural, Literary)
- **Length Types**: 4개 유형 (Micro 50w / Short 100w / Medium 200w / Long 350w)
- **CEFR Vocabulary Bands**: Pre-A1 ~ C1
- **Intended Uses**: 수업, 다독, 과제, 시험대비, 워밍업
- **연령별 주제 제한**: 연령대별 허용/제한 주제 목록

### Sheet 3: COVERAGE_MATRIX (배치 현황)

Genre × Length Type 조합별 텍스트 수를 Band별로 자동 집계하는 대시보드입니다.
메뉴에서 "Update Coverage Matrix"를 실행하면 갱신됩니다.

---

## Lexile Band × 연령대 매핑

| Lexile Band | 권장 연령대 | 교육 단계 | 핵심 목적 | CEFR |
|-------------|-----------|----------|----------|------|
| 100-300L | 초1-2 | Early Elementary | 영어 문장 감각 형성 | Pre-A1/A1 |
| 300-500L | 초3-4 | Upper Elementary | 의미 단위 읽기 | A1/A2 |
| 500-700L | 초5-6 | Transitional | 문단 이해 시작 | A2/B1 |
| 700-900L | 중1-2 | Middle School | 정보 이해 | A2/B1 |
| 900-1100L | 중3-고1 | Upper Secondary | 논리·원인결과 | B1/B2 |
| 1100-1300L | 고2-3 | Pre-CSAT | 추상 개념 | B2 |
| 1300-1500L | 대학 초반 | Academic | 학술 독해 | B2/C1 |

---

## Genre 체계

| Genre | 코드 | 사고 유형 | 예시 |
|-------|------|----------|------|
| Narrative | NAR | 시간·사건 | 이야기, 경험 |
| Expository | EXP | 설명 | 과학, 사회 |
| Informational | INF | 사실 | 기사, 보고 |
| Argumentative | ARG | 주장·근거 | 칼럼, 의견 |
| Procedural | PRO | 과정 | How-to |
| Literary | LIT | 정서·표현 | 에세이 |

---

## Length Type 설계

| Type | 목표 단어 수 | 허용 범위 | 주 용도 |
|------|------------|----------|---------|
| Micro | 50 | 40-60 | 워밍업 / 문장 훈련 |
| Short | 100 | 80-120 | 수업용 핵심 독해 |
| Medium | 200 | 170-230 | 정독 훈련 |
| Long | 350 | 280-420 | 다독 / 시험 대비 |

---

## 사용 방법

### 1단계: Google Sheets 생성

1. Google Sheets에서 새 스프레드시트를 만듭니다.

### 2단계: Apps Script 설정

1. 메뉴 > **확장 프로그램** > **Apps Script** 클릭
2. `apps-script/` 폴더의 파일 3개를 Apps Script 에디터에 복사합니다:
   - `Code.gs` → 기본 파일에 붙여넣기
   - `Validation.gs` → 새 파일 추가 후 붙여넣기
   - `TextGenerator.gs` → 새 파일 추가 후 붙여넣기
3. `appsscript.json` 내용으로 매니페스트 파일 교체 (설정 > "appsscript.json" 매니페스트 파일 표시 체크)
4. 저장 후 스프레드시트로 돌아갑니다.

### 3단계: 초기 설정 실행

1. 스프레드시트 새로고침 후 상단에 **Reading Text DB** 메뉴 확인
2. **Reading Text DB** > **Setup Sheets (초기 설정)** 클릭
3. 권한 승인 요청 시 허용

### 4단계: 샘플 데이터 임포트

1. `sheets-setup/sample-data.csv` 파일을 열어 내용을 복사합니다.
2. READING_TEXT_MASTER 시트의 A2 셀부터 붙여넣기 합니다.
3. 또는 파일 > 가져오기 > CSV 업로드로 임포트합니다.

### 5단계: AI 텍스트 생성 (선택)

1. **Reading Text DB** > **AI Text Generation** > **Set API Key** 클릭
2. Anthropic API 키를 입력합니다.
3. 메타데이터만 입력된 빈 행을 선택하고 **Generate for Selected Row** 실행
4. 또는 **Batch Generate (Empty Slots)** 로 빈 슬롯 일괄 생성

---

## Apps Script 메뉴 구성

```
Reading Text DB
├── Generate Text ID (선택 행)      # 현재 행에 text_id 자동 생성
├── Auto-fill All IDs              # 모든 빈 ID 일괄 생성
├── ─────────────────
├── Validate All Data              # 전체 데이터 검증 (오류 셀 빨간 표시)
├── Validate Selected Row          # 선택 행만 검증
├── ─────────────────
├── Update Coverage Matrix         # COVERAGE_MATRIX 시트 갱신
├── ─────────────────
├── AI Text Generation
│   ├── Generate for Selected Row  # 선택 행 텍스트 AI 생성
│   ├── Batch Generate (Empty)     # 빈 슬롯 일괄 AI 생성
│   └── Set API Key                # Claude API 키 설정
├── ─────────────────
└── Setup Sheets (초기 설정)        # 시트 구조/드롭다운/CONFIG 자동 생성
```

---

## 자동화 기능

### onEdit 트리거 (text_body 입력 시 자동 실행)
- `word_count` 자동 계산
- `sentence_count` 자동 계산
- `avg_sentence_length` 자동 계산
- `length_type` 자동 결정 (단어 수 기준)
- `created_date` 자동 설정 (최초 입력 시)

### 데이터 검증 항목
- Lexile score가 선택한 Band 범위 내인지
- word_count가 length_type 허용 범위 내인지
- text_body 실제 단어 수와 word_count 필드 일치 여부
- 필수 필드 (lexile_band, lexile_score, genre, length_type) 누락 체크
- 중복 text_id 검출

---

## 700-900L 초기 데이터 배치표

| Genre | Micro (50w) | Short (100w) | Medium (200w) | Long (300-400w) | 합계 |
|-------|:-----------:|:------------:|:-------------:|:---------------:|:----:|
| Narrative | O | O | O | O | 4 |
| Expository | O | O | O | - | 3 |
| Informational | - | O | O | - | 2 |
| Argumentative | - | - | O | - | 1 |
| Procedural | O | O | - | - | 2 |
| Literary | O | O | O | - | 3 |
| **합계** | **4** | **5** | **5** | **1** | **18** |

> 낮은 레벨일수록 Narrative·Procedural 비중 높게, 높은 레벨일수록 Argumentative·Expository 비중 높게 배치합니다.

---

## 확장 계획

- 나머지 6개 Lexile Band (100-300L ~ 1300-1500L) 텍스트 추가
- 문항 생성 DB 연동 (Reading Text → 문제 자동 생성)
- 다독 관리 시스템 연결
- 수능형 문항 생성 파이프라인
