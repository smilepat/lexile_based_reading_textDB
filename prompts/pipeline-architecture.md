# Reading DB → 수능형 문항 생성 파이프라인

## 전체 흐름도

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE SHEETS                                 │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ CONFIG           │    │ READING_TEXT  │    │ QUESTION_BANK │  │
│  │ (설정/드롭다운)   │───→│ _MASTER      │───→│ (문항 DB)      │  │
│  └──────────────────┘    │ (지문 DB)     │    └───────────────┘  │
│                          └──────┬───────┘    ┌───────────────┐  │
│                                 │            │ COVERAGE      │  │
│                                 └───────────→│ _MATRIX       │  │
│                                              │ (현황 대시보드) │  │
│                                              └───────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                   Apps Script
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  ┌──────────┐   ┌──────────┐   ┌──────────────┐
  │ Code.gs  │   │ Text     │   │ Question     │
  │ (메인)    │   │ Generator│   │ Generator.gs │
  │ +Validate│   │ .gs      │   │ (문항 생성)    │
  └──────────┘   └────┬─────┘   └──────┬───────┘
                      │                │
                      ▼                ▼
               ┌─────────────────────────┐
               │    Claude API           │
               │  (Anthropic Messages)   │
               └─────────────────────────┘
```

## Stage 1: 텍스트 생성 (Reading Text Generation)

### 입력
| 항목 | 소스 | 예시 |
|------|------|------|
| lexile_band | CONFIG 시트 드롭다운 | 700-900 |
| genre | CONFIG 시트 드롭다운 | Narrative |
| length_type | CONFIG 시트 드롭다운 | Short |
| topic | 수동 입력 또는 자동 기본값 | Friendship |
| age_group | band에 따라 자동 매핑 | Middle School |
| vocabulary_band | CONFIG 시트 드롭다운 | A2/B1 |

### 처리
1. `TextGenerator.gs` → `generateTextPrompt()` 함수가 Band별 상세 프롬프트 생성
2. `callClaudeAPI()` → Anthropic API 호출
3. 결과 JSON 파싱 → `text_body`, `word_count`, `sentence_count` 추출

### 출력
| 컬럼 | 자동/수동 | 설명 |
|------|-----------|------|
| text_id | 자동 | L{band}-{genre}-{wordcount}-{seq} |
| text_body | AI 생성 | 실제 지문 |
| word_count | 자동 계산 | 단어 수 |
| sentence_count | 자동 계산 | 문장 수 |
| avg_sentence_length | 자동 계산 | 평균 문장 길이 |
| length_type | 자동 결정 | Micro/Short/Medium/Long |
| created_date | 자동 | 생성일 |

---

## Stage 2: 문항 생성 (CSAT Question Generation)

### 입력
| 항목 | 소스 | 설명 |
|------|------|------|
| text_body | READING_TEXT_MASTER | Stage 1에서 생성된 지문 |
| lexile_score | READING_TEXT_MASTER | Lexile 점수 |
| genre | READING_TEXT_MASTER | 장르 |
| length_type | READING_TEXT_MASTER | 길이 유형 |
| question_type | 자동추천 또는 수동선택 | MI-03, VG-02 등 |

### 처리
1. `QuestionGenerator.gs` → `getRecommendedTypes()` 함수가 적합한 문항 유형 추천
2. `buildQuestionPrompt_()` → 유형별 CSAT 문항 프롬프트 생성
3. `callClaudeAPI()` → 문항 생성
4. `saveQuestion_()` → QUESTION_BANK 시트에 저장

### 문항 유형 자동 추천 규칙

```
Lexile 500-699  → DT-01 (내용 일치)
Lexile 700-899  → + MI-01/03/04, VG-01/02
Lexile 900-1099 → + MI-02, IF-01/02, ST-01/02/03
Lexile 1100+    → + IF-03, SM-01
```

```
Micro (50w)  → DT-01, MI-03, VG-02 만 가능
Short (100w) → ST-03, SM-01, IF-03 제외
Medium/Long  → 모든 유형 가능 (Lexile 조건 충족 시)
```

### 출력: QUESTION_BANK 시트

| 컬럼 | 설명 |
|------|------|
| question_id | Q-{text_id}-{type}-{seq} |
| source_text_id | 원본 지문 ID |
| question_type | MI-03, IF-02 등 |
| question_type_name | 주제, 빈칸 추론 등 |
| question_stem | 발문 (한국어) |
| modified_passage | 변형 지문 (빈칸/순서 등) |
| choice_1 ~ choice_5 | 5개 선지 |
| correct_answer | 정답 번호 |
| explanation | 해설 |
| difficulty | easy/medium/hard/very_hard |
| created_date | 생성일 |

---

## Stage 3: 품질 관리

### 자동 검증 (Validation.gs)
- Lexile score가 band 범위 내인지
- word_count와 length_type 일치 여부
- text_body 실제 단어 수 검증
- 필수 필드 누락 체크

### Coverage Matrix
- Band별 Genre x Length 배치 현황 시각화
- 빈 슬롯(빨간색) 확인 → 텍스트 생성 우선순위 결정

---

## 사용 시나리오

### 시나리오 1: 지문 + 문항 한 세트 생성
1. MASTER 시트에서 새 행에 `lexile_band`, `genre`, `length_type` 입력
2. 메뉴 → AI Text Generation → Generate for Selected Row
3. 생성된 텍스트 검토/수정
4. 메뉴 → CSAT Question Generation → Generate Question
5. 추천 유형 중 선택 → QUESTION_BANK에 저장

### 시나리오 2: 특정 Band 일괄 생성
1. TSV 템플릿에서 원하는 Band 슬롯을 MASTER에 붙여넣기
2. 메뉴 → AI Text Generation → Batch Generate
3. 전체 지문 생성 완료 후 검증 실행
4. 메뉴 → CSAT Question Generation → Batch Generate Questions
5. 유형 코드 입력 (예: MI-03,VG-02)

### 시나리오 3: 수능 모의고사 세트 구성
1. QUESTION_BANK에서 유형별로 필터링
2. Lexile 900-1300 범위 문항 선별
3. 유형 배분:
   - 18번 MI-01 (목적) x1
   - 20번 MI-02 (주장) x1
   - 21번 MI-03 (주제) x1
   - 22번 MI-04 (제목) x1
   - 29번 VG-01 (어법) x1
   - 30번 VG-02 (어휘) x1
   - 31-34번 IF-02/03 (빈칸) x4
   - 35번 ST-01 (무관 문장) x1
   - 36-37번 ST-03 (순서) x2
   - 38-39번 ST-02 (삽입) x2
   - 40번 SM-01 (요약) x1

---

## 파일 구조

```
lexile_based_reading_textDB/
├── PRDlexilereadingtext.ini        # 프로젝트 기획서
├── README.md
├── apps-script/                     # Google Apps Script 코드
│   ├── appsscript.json             # 프로젝트 설정
│   ├── Code.gs                     # 메인 (메뉴, 설정, 자동계산)
│   ├── TextGenerator.gs            # AI 텍스트 생성
│   ├── Validation.gs               # 데이터 검증
│   └── QuestionGenerator.gs        # 수능형 문항 생성 ← NEW
├── prompts/                         # 프롬프트 템플릿
│   ├── text-generation-prompt.md   # Band별 텍스트 생성 프롬프트
│   ├── csat-question-generation-prompt.md  # 문항 유형별 프롬프트 ← NEW
│   └── pipeline-architecture.md    # 연결 구조 설계 문서 ← NEW
├── sheets-setup/                    # Google Sheets 설정 파일
│   ├── schema.json                 # 시트 스키마 정의
│   ├── sample-data.csv             # 700-900L 샘플 데이터
│   ├── READING_TEXT_MASTER_template.tsv  # 전체 Band 템플릿 ← NEW
│   └── sheets-setup-guide.md       # Sheets 설정 가이드 ← NEW
└── python-app/                      # Python 로컬 앱 (보조)
    ├── app.py
    ├── database.py
    ├── generator.py
    ├── validation.py
    ├── run_demo.py
    └── requirements.txt
```
