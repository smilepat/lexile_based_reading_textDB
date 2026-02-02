"""
Lexile Reading Text DB - Data Validation Module
"""

BAND_RANGES = {
    "100-300": (100, 300),
    "300-500": (300, 500),
    "500-700": (500, 700),
    "700-900": (700, 900),
    "900-1100": (900, 1100),
    "1100-1300": (1100, 1300),
    "1300-1500": (1300, 1500),
}

LENGTH_RANGES = {
    "Micro": (40, 60),
    "Short": (80, 120),
    "Medium": (170, 230),
    "Long": (280, 420),
}

VALID_GENRES = ["Narrative", "Expository", "Informational", "Argumentative", "Procedural", "Literary"]
VALID_LENGTH_TYPES = ["Micro", "Short", "Medium", "Long"]


def validate_row(row):
    """Validate a single row of data. Returns list of error dicts."""
    errors = []

    band = row.get("lexile_band", "")
    score = row.get("lexile_score")
    genre = row.get("genre", "")
    length_type = row.get("length_type", "")
    word_count = row.get("word_count")
    text_body = row.get("text_body", "")

    # Required fields
    for field in ["lexile_band", "lexile_score", "genre", "length_type"]:
        val = row.get(field)
        if not val and val != 0:
            errors.append({
                "field": field,
                "type": "MISSING_REQUIRED",
                "message": f"{field} 필수 입력",
            })

    # Lexile score in band range
    if band and score and band in BAND_RANGES:
        lo, hi = BAND_RANGES[band]
        if not (lo <= int(score) <= hi):
            errors.append({
                "field": "lexile_score",
                "type": "SCORE_OUT_OF_BAND",
                "message": f"Lexile {score}이 band {band} 범위({lo}-{hi})를 벗어남",
            })

    # Genre validity
    if genre and genre not in VALID_GENRES:
        errors.append({
            "field": "genre",
            "type": "INVALID_GENRE",
            "message": f"유효하지 않은 장르: {genre}",
        })

    # Length type validity
    if length_type and length_type not in VALID_LENGTH_TYPES:
        errors.append({
            "field": "length_type",
            "type": "INVALID_LENGTH_TYPE",
            "message": f"유효하지 않은 길이 유형: {length_type}",
        })

    # Word count matches length type
    if word_count and length_type and length_type in LENGTH_RANGES:
        lo, hi = LENGTH_RANGES[length_type]
        if not (lo <= int(word_count) <= hi):
            errors.append({
                "field": "word_count",
                "type": "LENGTH_MISMATCH",
                "message": f"단어 수 {word_count}가 {length_type}({lo}-{hi}) 범위에 맞지 않음",
            })

    # Text body word count check
    if text_body and word_count:
        actual = len(text_body.strip().split())
        if abs(actual - int(word_count)) > 10:
            errors.append({
                "field": "text_body",
                "type": "WORD_COUNT_MISMATCH",
                "message": f"실제 단어 수({actual})와 word_count({word_count}) 불일치",
            })

    return errors


def validate_all(rows):
    """Validate all rows. Returns dict of text_id -> errors."""
    results = {}
    for row in rows:
        row_dict = dict(row) if not isinstance(row, dict) else row
        errors = validate_row(row_dict)
        if errors:
            text_id = row_dict.get("text_id", "unknown")
            results[text_id] = errors
    return results
