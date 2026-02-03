# 수능형 문항 생성 프롬프트 (CSAT Question Generator)

## 개요
Reading Text DB의 지문을 기반으로 수능 영어 시험 유형의 문항을 자동 생성합니다.

---

## 수능 영어 문항 유형 체계

### 유형 A: 대의 파악 (Main Idea)

| 코드 | 유형명 | 수능 문항 번호 참고 | 최소 Lexile |
|------|--------|---------------------|-------------|
| MI-01 | 글의 목적 (Purpose) | 18번 | 700L |
| MI-02 | 주장/요지 (Main Claim) | 20번 | 700L |
| MI-03 | 주제 (Topic) | 21번 | 700L |
| MI-04 | 제목 (Title) | 22번 | 700L |

### 유형 B: 세부 정보 (Detail)

| 코드 | 유형명 | 수능 문항 번호 참고 | 최소 Lexile |
|------|--------|---------------------|-------------|
| DT-01 | 내용 일치/불일치 | 23-24번 | 500L |
| DT-02 | 도표 정보 일치 | 25번 | 500L |

### 유형 C: 추론 (Inference)

| 코드 | 유형명 | 수능 문항 번호 참고 | 최소 Lexile |
|------|--------|---------------------|-------------|
| IF-01 | 함축 의미 추론 (Implication) | 19번 | 900L |
| IF-02 | 빈칸 추론 - 단어/구 (Blank: Word) | 31-32번 | 900L |
| IF-03 | 빈칸 추론 - 문장 (Blank: Sentence) | 33-34번 | 1100L |

### 유형 D: 구조 파악 (Structure)

| 코드 | 유형명 | 수능 문항 번호 참고 | 최소 Lexile |
|------|--------|---------------------|-------------|
| ST-01 | 글의 흐름과 무관한 문장 | 35번 | 900L |
| ST-02 | 문장 삽입 (Sentence Insertion) | 38-39번 | 900L |
| ST-03 | 글의 순서 (Ordering) | 36-37번 | 900L |

### 유형 E: 어휘/문법 (Vocabulary/Grammar)

| 코드 | 유형명 | 수능 문항 번호 참고 | 최소 Lexile |
|------|--------|---------------------|-------------|
| VG-01 | 어법 판단 (Grammar) | 29번 | 700L |
| VG-02 | 어휘 판단 (Vocabulary) | 30번 | 700L |

### 유형 F: 요약/장문 (Summary/Long Passage)

| 코드 | 유형명 | 수능 문항 번호 참고 | 최소 Lexile |
|------|--------|---------------------|-------------|
| SM-01 | 요약문 완성 | 40번 | 1100L |
| SM-02 | 장문 독해 (2-3문항 세트) | 41-45번 | 900L |

---

## Genre → 문항 유형 적합성 매트릭스

| Genre | 대의파악 | 세부정보 | 추론 | 구조파악 | 어휘문법 | 요약 |
|-------|---------|---------|------|---------|---------|------|
| Narrative | MI-01 | DT-01 | IF-01 | ST-02, ST-03 | VG-01, VG-02 | - |
| Expository | MI-03, MI-04 | DT-01, DT-02 | IF-02, IF-03 | ST-01, ST-02 | VG-01, VG-02 | SM-01 |
| Informational | MI-03 | DT-01, DT-02 | IF-02 | ST-01 | VG-02 | SM-01 |
| Argumentative | MI-02, MI-04 | DT-01 | IF-01, IF-02, IF-03 | ST-01, ST-02, ST-03 | VG-01, VG-02 | SM-01 |
| Procedural | MI-01 | DT-01 | - | ST-03 | VG-01 | - |
| Literary | MI-04 | - | IF-01 | ST-02 | VG-02 | - |

---

## 문항 생성 프롬프트

### 공통 시스템 프롬프트

```
You are an expert Korean CSAT (수능) English test item writer.
You create high-quality multiple-choice questions based on provided reading passages.

GENERAL RULES:
1. Each question has exactly 5 choices (① ② ③ ④ ⑤).
2. Exactly ONE correct answer.
3. Distractors must be plausible but clearly distinguishable from the correct answer.
4. Questions must be answerable SOLELY from the given passage.
5. Language of questions and choices: follows CSAT convention (question stem in Korean, choices as specified by type).
6. Difficulty should match the Lexile level of the source text.
```

### MI-01: 글의 목적 (Purpose)

```
PASSAGE:
{text_body}

QUESTION TYPE: 글의 목적 파악 (MI-01)
SOURCE: text_id={text_id}, Lexile={lexile_score}, Genre={genre}

Generate a CSAT-style question asking the purpose of the passage.

FORMAT:
{
  "question_type": "MI-01",
  "source_text_id": "{text_id}",
  "question_stem": "다음 글의 목적으로 가장 적절한 것은?",
  "choices": [
    {"number": 1, "text": "...", "is_correct": false},
    {"number": 2, "text": "...", "is_correct": true},
    {"number": 3, "text": "...", "is_correct": false},
    {"number": 4, "text": "...", "is_correct": false},
    {"number": 5, "text": "...", "is_correct": false}
  ],
  "correct_answer": 2,
  "explanation": "Brief explanation of why the answer is correct",
  "difficulty": "medium"
}
```

### MI-02: 주장/요지 (Main Claim)

```
PASSAGE:
{text_body}

QUESTION TYPE: 주장/요지 파악 (MI-02)

Generate a CSAT-style question asking the main claim or gist.

FORMAT:
{
  "question_type": "MI-02",
  "source_text_id": "{text_id}",
  "question_stem": "다음 글에서 필자가 주장하는 바로 가장 적절한 것은?",
  "choices": [
    {"number": 1, "text": "...", "is_correct": false},
    ...
  ],
  "correct_answer": <number>,
  "explanation": "...",
  "difficulty": "medium"
}
```

### MI-03: 주제 (Topic)

```
PASSAGE:
{text_body}

QUESTION TYPE: 주제 파악 (MI-03)

Generate a CSAT-style question asking the topic.
Choices should be in English phrase form (e.g., "the importance of...", "how... affects...").

FORMAT:
{
  "question_type": "MI-03",
  "source_text_id": "{text_id}",
  "question_stem": "다음 글의 주제로 가장 적절한 것은?",
  "choices": [
    {"number": 1, "text": "the importance of...", "is_correct": false},
    ...
  ],
  "correct_answer": <number>,
  "explanation": "...",
  "difficulty": "medium"
}
```

### MI-04: 제목 (Title)

```
PASSAGE:
{text_body}

QUESTION TYPE: 제목 파악 (MI-04)

Generate a CSAT-style question asking for the best title.
Choices should be concise English titles.

FORMAT:
{
  "question_type": "MI-04",
  "source_text_id": "{text_id}",
  "question_stem": "다음 글의 제목으로 가장 적절한 것은?",
  "choices": [
    {"number": 1, "text": "...", "is_correct": false},
    ...
  ],
  "correct_answer": <number>,
  "explanation": "...",
  "difficulty": "medium"
}
```

### IF-01: 함축 의미 추론 (Implication)

```
PASSAGE:
{text_body}

QUESTION TYPE: 함축 의미 추론 (IF-01)

Select an underlined phrase from the passage and ask what it implies.

FORMAT:
{
  "question_type": "IF-01",
  "source_text_id": "{text_id}",
  "question_stem": "다음 글의 밑줄 친 \"{underlined_phrase}\"이(가) 의미하는 바로 가장 적절한 것은?",
  "underlined_phrase": "the exact phrase from the passage",
  "choices": [
    {"number": 1, "text": "...", "is_correct": false},
    ...
  ],
  "correct_answer": <number>,
  "explanation": "...",
  "difficulty": "hard"
}
```

### IF-02: 빈칸 추론 - 단어/구 (Blank: Word/Phrase)

```
PASSAGE:
{text_body}

QUESTION TYPE: 빈칸 추론 - 단어/구 (IF-02)

Choose a key word or phrase from the passage and replace it with a blank.
The blank should test understanding of the passage's logic.

FORMAT:
{
  "question_type": "IF-02",
  "source_text_id": "{text_id}",
  "question_stem": "다음 빈칸에 들어갈 말로 가장 적절한 것은?",
  "modified_passage": "The passage with __________ replacing the key word/phrase",
  "blank_original": "the original word/phrase that was removed",
  "choices": [
    {"number": 1, "text": "...", "is_correct": false},
    ...
  ],
  "correct_answer": <number>,
  "explanation": "...",
  "difficulty": "hard"
}
```

### IF-03: 빈칸 추론 - 문장 (Blank: Sentence)

```
PASSAGE:
{text_body}

QUESTION TYPE: 빈칸 추론 - 문장 (IF-03)

Replace a key sentence (or part of one) with a blank.
The blank should capture the passage's central argument or conclusion.

FORMAT:
{
  "question_type": "IF-03",
  "source_text_id": "{text_id}",
  "question_stem": "다음 빈칸에 들어갈 말로 가장 적절한 것은?",
  "modified_passage": "The passage with _________________________ replacing a sentence",
  "blank_original": "the original sentence",
  "choices": [
    {"number": 1, "text": "a full sentence option", "is_correct": false},
    ...
  ],
  "correct_answer": <number>,
  "explanation": "...",
  "difficulty": "very_hard"
}
```

### ST-01: 흐름과 무관한 문장 (Irrelevant Sentence)

```
PASSAGE:
{text_body}

QUESTION TYPE: 흐름과 무관한 문장 (ST-01)

Insert an irrelevant sentence into the passage and number all sentences ①-⑤.
The irrelevant sentence should be topically related but logically inconsistent with the passage's flow.

FORMAT:
{
  "question_type": "ST-01",
  "source_text_id": "{text_id}",
  "question_stem": "다음 글에서 전체 흐름과 관계없는 문장은?",
  "modified_passage": "① First sentence. ② Second sentence. ③ Irrelevant sentence. ④ Fourth sentence. ⑤ Fifth sentence.",
  "inserted_sentence": "The irrelevant sentence that was added",
  "correct_answer": <number of the irrelevant sentence>,
  "explanation": "...",
  "difficulty": "hard"
}
```

### ST-02: 문장 삽입 (Sentence Insertion)

```
PASSAGE:
{text_body}

QUESTION TYPE: 문장 삽입 (ST-02)

Remove one sentence from the passage and ask where it should be placed.
Mark insertion points with [A], [B], [C], [D], [E].

FORMAT:
{
  "question_type": "ST-02",
  "source_text_id": "{text_id}",
  "question_stem": "글의 흐름으로 보아, 주어진 문장이 들어가기에 가장 적절한 곳은?",
  "given_sentence": "The sentence that was removed",
  "modified_passage": "... [A] ... [B] ... [C] ... [D] ... [E] ...",
  "correct_answer": "[C]",
  "explanation": "...",
  "difficulty": "hard"
}
```

### ST-03: 글의 순서 (Ordering)

```
PASSAGE:
{text_body}

QUESTION TYPE: 글의 순서 (ST-03)

Split the passage into an intro + three body paragraphs (A), (B), (C).
Scramble (A), (B), (C) and ask for the correct order.

FORMAT:
{
  "question_type": "ST-03",
  "source_text_id": "{text_id}",
  "question_stem": "주어진 글 다음에 이어질 글의 순서로 가장 적절한 것은?",
  "intro": "The opening sentence(s)...",
  "paragraph_A": "(A) ...",
  "paragraph_B": "(B) ...",
  "paragraph_C": "(C) ...",
  "choices": [
    {"number": 1, "text": "(A)-(C)-(B)", "is_correct": false},
    {"number": 2, "text": "(B)-(A)-(C)", "is_correct": true},
    {"number": 3, "text": "(B)-(C)-(A)", "is_correct": false},
    {"number": 4, "text": "(C)-(A)-(B)", "is_correct": false},
    {"number": 5, "text": "(C)-(B)-(A)", "is_correct": false}
  ],
  "correct_answer": 2,
  "explanation": "...",
  "difficulty": "hard"
}
```

### VG-01: 어법 판단 (Grammar)

```
PASSAGE:
{text_body}

QUESTION TYPE: 어법 판단 (VG-01)

Select 3 underlined portions in the passage. Each should test a grammar point.
One of them should be grammatically INCORRECT (or correct, depending on the question).

FORMAT:
{
  "question_type": "VG-01",
  "source_text_id": "{text_id}",
  "question_stem": "다음 글의 밑줄 친 부분 중, 어법상 틀린 것은?",
  "modified_passage": "Passage with (A) [underlined1], (B) [underlined2], (C) [underlined3], (D) [underlined4], (E) [underlined5]",
  "grammar_points": [
    {"label": "(A)", "text": "...", "rule": "subject-verb agreement", "is_correct_grammar": true},
    {"label": "(B)", "text": "...", "rule": "relative pronoun", "is_correct_grammar": false},
    ...
  ],
  "correct_answer": "(B)",
  "explanation": "...",
  "difficulty": "medium"
}
```

### VG-02: 어휘 판단 (Vocabulary)

```
PASSAGE:
{text_body}

QUESTION TYPE: 어휘 판단 (VG-02)

Select 5 words in the passage and underline them.
One should be replaced with an INCORRECT word (antonym or contextually wrong).

FORMAT:
{
  "question_type": "VG-02",
  "source_text_id": "{text_id}",
  "question_stem": "다음 글의 밑줄 친 부분 중, 문맥상 낱말의 쓰임이 적절하지 않은 것은?",
  "modified_passage": "Passage with ① word1, ② word2, ③ wrong_word, ④ word4, ⑤ word5",
  "vocabulary_items": [
    {"number": 1, "used_word": "...", "is_appropriate": true},
    {"number": 2, "used_word": "...", "is_appropriate": true},
    {"number": 3, "used_word": "wrong_word", "correct_word": "right_word", "is_appropriate": false},
    ...
  ],
  "correct_answer": 3,
  "explanation": "...",
  "difficulty": "medium"
}
```

### SM-01: 요약문 완성 (Summary)

```
PASSAGE:
{text_body}

QUESTION TYPE: 요약문 완성 (SM-01)

Write a summary sentence with two blanks (A) and (B).
Provide 3 choices for each blank.

FORMAT:
{
  "question_type": "SM-01",
  "source_text_id": "{text_id}",
  "question_stem": "다음 글의 내용을 한 문장으로 요약하고자 한다. 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은?",
  "summary": "The passage argues that ___(A)___ is essential for ___(B)___.",
  "choices": [
    {"number": 1, "A": "...", "B": "...", "is_correct": false},
    {"number": 2, "A": "...", "B": "...", "is_correct": true},
    {"number": 3, "A": "...", "B": "...", "is_correct": false},
    {"number": 4, "A": "...", "B": "...", "is_correct": false},
    {"number": 5, "A": "...", "B": "...", "is_correct": false}
  ],
  "correct_answer": 2,
  "explanation": "...",
  "difficulty": "hard"
}
```

---

## 복수 문항 일괄 생성 프롬프트

```
You are an expert Korean CSAT English test item writer.

SOURCE TEXT:
- text_id: {text_id}
- Lexile: {lexile_score}
- Genre: {genre}
- Word Count: {word_count}

PASSAGE:
{text_body}

Generate the following question types for this passage:
{question_types_list}

RULES:
1. Each question must have exactly 5 choices with exactly 1 correct answer.
2. Questions should test different aspects of the passage (no overlap).
3. Distractors must be plausible but distinguishable.
4. Difficulty should be appropriate for the Lexile level.
5. Follow CSAT conventions exactly.

OUTPUT FORMAT (JSON array):
[
  { ...question1... },
  { ...question2... },
  ...
]
```

---

## Lexile → 문항 유형 자동 추천 로직

```
function getRecommendedQuestionTypes(lexileScore, genre, lengthType) {
  let types = [];

  // 모든 레벨 공통
  if (lexileScore >= 500) types.push('DT-01');       // 내용 일치
  if (lexileScore >= 700) types.push('MI-03');        // 주제
  if (lexileScore >= 700) types.push('VG-01', 'VG-02'); // 어법/어휘

  // 중급 이상
  if (lexileScore >= 900) {
    types.push('MI-02', 'MI-04');                     // 주장, 제목
    types.push('IF-01', 'IF-02');                     // 함축, 빈칸(구)
    types.push('ST-01');                              // 무관한 문장
  }

  // 상급
  if (lexileScore >= 1100) {
    types.push('IF-03');                              // 빈칸(문장)
    types.push('SM-01');                              // 요약
  }

  // 길이 기반 필터
  if (lengthType === 'Micro') {
    types = types.filter(t => ['DT-01', 'MI-03', 'VG-02'].includes(t));
  }
  if (lengthType === 'Short') {
    types = types.filter(t => !['ST-03', 'SM-01', 'IF-03'].includes(t));
  }

  // Medium/Long만 가능
  if (['Medium', 'Long'].includes(lengthType)) {
    if (lexileScore >= 900) types.push('ST-02', 'ST-03'); // 문장삽입, 순서
  }

  // 장르 기반 필터
  if (genre === 'Narrative') types.push('MI-01');     // 목적
  if (genre === 'Argumentative' && lexileScore >= 900) types.push('MI-02');
  if (genre === 'Procedural') {
    types = types.filter(t => !['IF-01', 'IF-03', 'SM-01'].includes(t));
  }

  return [...new Set(types)]; // 중복 제거
}
```
