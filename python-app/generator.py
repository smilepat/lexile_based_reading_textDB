"""
Lexile Reading Text DB - AI Text Generator Module (Claude API)
"""
import json
import os

LENGTH_TARGETS = {
    "Micro": {"words": 50, "range": "40-60"},
    "Short": {"words": 100, "range": "80-120"},
    "Medium": {"words": 200, "range": "170-230"},
    "Long": {"words": 350, "range": "280-420"},
}

GENRE_INSTRUCTIONS = {
    "Narrative": "Write a story or personal experience with characters, setting, and events in chronological order.",
    "Expository": "Write an explanatory text that clearly explains a concept or process with examples.",
    "Informational": "Write a factual text presenting objective information, similar to a news article or report.",
    "Argumentative": "Write a text that presents a clear claim supported by reasons and evidence.",
    "Procedural": "Write a how-to text with clear step-by-step instructions.",
    "Literary": "Write an expressive essay or literary piece with attention to style and emotional depth.",
}

DEFAULT_TOPICS = {
    "Middle School": {
        "Narrative": "Friendship",
        "Expository": "Science and Nature",
        "Informational": "Daily Life",
        "Argumentative": "School Rules",
        "Procedural": "Cooking",
        "Literary": "Growing Up",
    },
}

FALLBACK_TOPICS = {
    "Narrative": "Daily Life",
    "Expository": "Nature",
    "Informational": "General Knowledge",
    "Argumentative": "Opinion",
    "Procedural": "How-to",
    "Literary": "Feelings",
}


def get_default_topic(genre, age_group):
    if age_group in DEFAULT_TOPICS and genre in DEFAULT_TOPICS[age_group]:
        return DEFAULT_TOPICS[age_group][genre]
    return FALLBACK_TOPICS.get(genre, "General")


def build_prompt(genre, length_type, lexile_band, topic, age_group, vocabulary_band=None):
    target = LENGTH_TARGETS.get(length_type, LENGTH_TARGETS["Short"])
    instruction = GENRE_INSTRUCTIONS.get(genre, "")

    return f"""You are an expert EFL (English as a Foreign Language) reading text writer for Korean students.

TASK: Generate a reading passage with the following specifications:

- **Lexile Band**: {lexile_band}
- **Genre**: {genre} - {instruction}
- **Target Word Count**: {target['words']} words (acceptable range: {target['range']} words)
- **Topic**: {topic}
- **Target Age Group**: {age_group}
- **Vocabulary Level**: {vocabulary_band or 'appropriate for the Lexile band'}

CONSTRAINTS:
1. The text MUST be within the word count range ({target['range']} words). This is critical.
2. Use vocabulary and sentence structures appropriate for Lexile {lexile_band}.
3. Content must be age-appropriate for {age_group} Korean students.
4. Avoid culturally sensitive, politically charged, or inappropriate content.
5. Use natural, authentic English - not simplified textbook English.
6. Each sentence should be clear and complete.

OUTPUT FORMAT (JSON only, no markdown code blocks):
{{"text_body": "The full reading passage text here...", "sentence_count": <number>, "word_count": <number>, "vocabulary_notes": "Brief note on key vocabulary used", "lexile_estimate": <estimated Lexile score as number>}}"""


def generate_text(genre, length_type, lexile_band, topic, age_group, vocabulary_band=None, api_key=None):
    """Generate a reading text using Claude API."""
    try:
        import anthropic
    except ImportError:
        raise RuntimeError("anthropic 패키지가 필요합니다: pip install anthropic")

    key = api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError(
            "API 키가 필요합니다. ANTHROPIC_API_KEY 환경변수를 설정하거나 api_key 파라미터를 전달하세요."
        )

    if not topic:
        topic = get_default_topic(genre, age_group)

    prompt = build_prompt(genre, length_type, lexile_band, topic, age_group, vocabulary_band)

    client = anthropic.Anthropic(api_key=key)
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    content = message.content[0].text
    cleaned = content.replace("```json", "").replace("```", "").strip()
    return json.loads(cleaned)


def batch_generate(slots, api_key=None, on_progress=None):
    """Generate texts for multiple slots.
    slots: list of dicts with genre, length_type, lexile_band, topic, age_group, vocabulary_band
    on_progress: callback(index, total, result_or_error)
    Returns list of (slot, result_or_none, error_or_none)
    """
    results = []
    total = len(slots)

    for i, slot in enumerate(slots):
        try:
            result = generate_text(
                genre=slot["genre"],
                length_type=slot["length_type"],
                lexile_band=slot["lexile_band"],
                topic=slot.get("topic"),
                age_group=slot.get("age_group", "Middle School"),
                vocabulary_band=slot.get("vocabulary_band"),
                api_key=api_key,
            )
            results.append((slot, result, None))
            if on_progress:
                on_progress(i + 1, total, result)
        except Exception as e:
            results.append((slot, None, str(e)))
            if on_progress:
                on_progress(i + 1, total, str(e))

    return results
