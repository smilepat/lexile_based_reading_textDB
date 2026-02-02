# Reading Text Generation Prompt Template

## 용도
이 프롬프트는 Claude API 또는 Claude 대화에서 Lexile 기반 EFL 읽기 텍스트를 생성할 때 사용합니다.

---

## 기본 프롬프트 (복사하여 사용)

```
You are an expert EFL (English as a Foreign Language) reading text writer for Korean students.

TASK: Generate a reading passage with the following specifications:

- **Lexile Band**: {lexile_band}
- **Genre**: {genre}
- **Target Word Count**: {target_words} words (acceptable range: {word_range})
- **Topic**: {topic}
- **Target Age Group**: {age_group}
- **Vocabulary Level**: {vocabulary_band}

GENRE GUIDELINES:
- Narrative: Write a story with characters, setting, and events in chronological order.
- Expository: Write an explanatory text that clearly explains a concept with examples.
- Informational: Write a factual text presenting objective information (news/report style).
- Argumentative: Write a text with a clear claim supported by reasons and evidence.
- Procedural: Write a how-to text with clear step-by-step instructions.
- Literary: Write an expressive essay with attention to style and emotional depth.

CONSTRAINTS:
1. Word count MUST be within the specified range. This is critical.
2. Use vocabulary and sentence structures appropriate for the Lexile band.
3. Content must be age-appropriate for Korean students in the target age group.
4. Avoid culturally sensitive, politically charged, or inappropriate content.
5. Use natural, authentic English - not simplified textbook English.
6. Each sentence should be clear and complete.
7. Maintain consistent difficulty throughout the passage.

OUTPUT FORMAT (JSON only):
{
  "text_body": "The full reading passage...",
  "sentence_count": <number>,
  "word_count": <number>,
  "vocabulary_notes": "Key vocabulary: word1 (meaning), word2 (meaning)...",
  "lexile_estimate": <estimated Lexile score>
}
```

---

## 변수 참조표

### Lexile Band별 설정

| Lexile Band | Age Group | CEFR | 문장 복잡도 가이드 |
|------------|-----------|------|-----------------|
| 100-300 | Early Elementary | Pre-A1/A1 | 단문 위주, 현재시제, 기본 어휘 |
| 300-500 | Upper Elementary | A1/A2 | 단문+복문, 과거시제 도입, 일상 어휘 |
| 500-700 | Transitional | A2/B1 | 복문 증가, 접속사 활용, 학습 어휘 |
| 700-900 | Middle School | A2/B1 | 다양한 문장 구조, 추상어 시작 |
| 900-1100 | Upper Secondary | B1/B2 | 복합문, 수동태, 학술 어휘 시작 |
| 1100-1300 | Pre-CSAT | B2 | 긴 복합문, 학술 어휘, 추상 개념 |
| 1300-1500 | Academic | B2/C1 | 학술 문체, 전문 어휘, 복잡한 논리 |

### Length Type별 설정

| Type | Target | Range | 용도 |
|------|--------|-------|------|
| Micro | 50 | 40-60 | 워밍업, 문장 훈련 |
| Short | 100 | 80-120 | 수업 핵심 독해 |
| Medium | 200 | 170-230 | 정독 훈련 |
| Long | 350 | 280-420 | 다독, 시험 대비 |

---

## 일괄 생성 프롬프트 (Batch)

여러 텍스트를 한 번에 생성할 때 사용합니다.

```
Generate {count} reading passages for Lexile Band {lexile_band}.

For each passage, use the specifications below:

{specifications_list}

RULES:
- Each passage MUST strictly follow its word count range.
- All passages should have different topics - no repetition.
- Content must be appropriate for {age_group} Korean students.

OUTPUT FORMAT (JSON array):
[
  {
    "slot": 1,
    "genre": "...",
    "length_type": "...",
    "text_body": "...",
    "sentence_count": <number>,
    "word_count": <number>,
    "topic": "...",
    "vocabulary_notes": "..."
  },
  ...
]
```

---

## 700-900L Band 생성 시 참고사항

- 평균 문장 길이: 12-18 단어
- 주요 문법: 관계대명사, 분사구문 시작, 가정법 초급
- CEFR 수준: A2/B1 (중간)
- 적합 주제: 관계, 사회현상, 기술, 자연, 문화, 과학
- 부적합 주제: 이념 논쟁, 성인 전용 주제, 과도한 전문 용어
