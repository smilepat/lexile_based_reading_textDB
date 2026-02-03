"""
External CSV Importer
reading_2000.csv, reading_3000.csv, reading_5000.csv를
READING_TEXT_MASTER 스키마로 변환하여 DB에 임포트
"""
import csv
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
import database as db

# ==================== Genre 자동 분류 ====================

GENRE_KEYWORDS = {
    "Argumentative": [
        "should", "must", "argue", "debate", "opinion", "agree", "disagree",
        "pros and cons", "benefits and concerns", "worth", "banned",
        "deserve", "fair", "justice", "protest",
    ],
    "Procedural": [
        "how to", "steps", "first, second", "instructions", "guide",
        "recipe", "method", "process", "prepare",
    ],
    "Narrative": [
        "one day", "once upon", "she said", "he said", "story",
        "remember", "happened", "told", "asked", "smiled", "laughed",
        "walked", "looked", "felt", "realized", "murmured", "sighed",
    ],
    "Literary": [
        "poem", "beauty", "soul", "heart", "metaphor", "literary",
        "aesthetic", "modernism", "art and meaning",
    ],
    "Informational": [
        "report", "statistics", "according to", "data shows", "study",
        "research", "survey", "percent", "government", "country",
        "countries", "global", "billion", "million",
    ],
    "Expository": [
        "explain", "definition", "means", "refers to", "process",
        "because", "causes", "effects", "science", "how does",
        "what is", "understand", "concept", "theory",
    ],
}


def classify_genre(title, passage):
    title_lower = title.lower()
    passage_lower = passage.lower()[:500]  # 앞부분만 분석
    combined = title_lower + " " + passage_lower

    scores = {}
    for genre, keywords in GENRE_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in combined)
        scores[genre] = score

    # Title-based hints
    if any(w in title_lower for w in ["should", "banned", "worth", "deserve", "fair"]):
        scores["Argumentative"] += 3
    if any(w in title_lower for w in ["how to", "steps", "guide"]):
        scores["Procedural"] += 3
    if any(w in title_lower for w in ["what is", "how does", "how do", "how can", "why do", "why is", "why are"]):
        scores["Expository"] += 2

    # Narrative detection: dialogue or character names
    if re.search(r'[A-Z][a-z]+\s(said|asked|smiled|looked|felt|walked)', passage[:300]):
        scores["Narrative"] += 3
    if '""' in passage[:200] or '"' in passage[:200]:
        scores["Narrative"] += 1

    best = max(scores, key=scores.get)
    if scores[best] == 0:
        return "Expository"  # default
    return best


# ==================== Lexile 추정 ====================

def estimate_lexile(passage, file_level):
    """파일 레벨과 텍스트 특성으로 Lexile 추정"""
    words = passage.strip().split()
    word_count = len(words)
    sentences = [s.strip() for s in re.split(r'[.!?]+', passage) if s.strip()]
    sent_count = max(len(sentences), 1)
    avg_sent_len = word_count / sent_count

    # 평균 단어 길이
    avg_word_len = sum(len(w) for w in words) / max(len(words), 1)

    if file_level == 2000:
        base = 350
        score = base + (avg_sent_len - 10) * 8 + (avg_word_len - 4) * 15
        return max(300, min(500, int(score)))
    elif file_level == 3000:
        base = 580
        score = base + (avg_sent_len - 12) * 6 + (avg_word_len - 4.2) * 12
        return max(500, min(700, int(score)))
    elif file_level == 5000:
        base = 1200
        score = base + (avg_sent_len - 18) * 5 + (avg_word_len - 4.8) * 10
        return max(1100, min(1500, int(score)))
    return 800


def get_band(lexile_score):
    if lexile_score < 300:
        return "100-300"
    elif lexile_score < 500:
        return "300-500"
    elif lexile_score < 700:
        return "500-700"
    elif lexile_score < 900:
        return "700-900"
    elif lexile_score < 1100:
        return "900-1100"
    elif lexile_score < 1300:
        return "1100-1300"
    else:
        return "1300-1500"


def get_age_group(band):
    mapping = {
        "100-300": "Early Elementary",
        "300-500": "Upper Elementary",
        "500-700": "Transitional",
        "700-900": "Middle School",
        "900-1100": "Upper Secondary",
        "1100-1300": "Pre-CSAT",
        "1300-1500": "Academic",
    }
    return mapping.get(band, "Middle School")


def get_grade_hint(band):
    mapping = {
        "100-300": "초1-2",
        "300-500": "초3-4",
        "500-700": "초5-6",
        "700-900": "중1-2",
        "900-1100": "중3-고1",
        "1100-1300": "고2-3",
        "1300-1500": "대학",
    }
    return mapping.get(band, "")


def get_vocab_band(lexile_score):
    if lexile_score < 300:
        return "Pre-A1"
    elif lexile_score < 500:
        return "A1/A2"
    elif lexile_score < 700:
        return "A2/B1"
    elif lexile_score < 900:
        return "A2/B1"
    elif lexile_score < 1100:
        return "B1/B2"
    elif lexile_score < 1300:
        return "B2"
    else:
        return "B2/C1"


def get_length_type(word_count):
    if word_count <= 60:
        return "Micro"
    elif word_count <= 120:
        return "Short"
    elif word_count <= 230:
        return "Medium"
    elif word_count <= 420:
        return "Long"
    else:
        return "Extra Long"


# ==================== 메인 변환 ====================

def convert_file(csv_path, file_level, source_label):
    """외부 CSV를 DB 스키마로 변환하여 임포트"""
    rows_imported = 0
    conn = db.get_connection()

    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            topic_num = row.get("topic", "")
            title = row.get("title", "")
            passage = row.get("passage", "")

            if not passage.strip():
                continue

            # 자동 분류
            genre = classify_genre(title, passage)
            lexile_score = estimate_lexile(passage, file_level)
            band = get_band(lexile_score)

            # 텍스트 통계
            wc, sc, avg = db.calculate_text_stats(passage)
            length_type = get_length_type(wc)

            # intended_use 결정
            if wc <= 60:
                intended_use = "워밍업"
            elif wc <= 230:
                intended_use = "수업"
            else:
                intended_use = "다독"

            data = {
                "lexile_band": band,
                "lexile_score": lexile_score,
                "age_group": get_age_group(band),
                "grade_hint": get_grade_hint(band),
                "genre": genre,
                "topic": title,
                "word_count": wc,
                "length_type": length_type,
                "text_body": passage,
                "sentence_count": sc,
                "avg_sentence_length": avg,
                "vocabulary_band": get_vocab_band(lexile_score),
                "intended_use": intended_use,
                "created_date": "2026-02-03",
                "notes": f"Source: {source_label} (Topic {topic_num})",
            }

            text_id = db.insert_text(data, conn)
            rows_imported += 1
            print(f"  [{rows_imported:3d}] {text_id} | {band} | {genre:<15} | {length_type:<6} | {wc}w | {title[:40]}")

    conn.close()
    return rows_imported


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    db.init_db()

    base_dir = os.path.join(os.path.dirname(__file__), "..")
    files = [
        ("reading_2000.csv", 2000, "reading_2000"),
        ("reading_3000.csv", 3000, "reading_3000"),
        ("reading_5000.csv", 5000, "reading_5000"),
    ]

    total = 0
    for filename, level, label in files:
        filepath = os.path.join(base_dir, filename)
        if not os.path.exists(filepath):
            print(f"[SKIP] {filename} not found")
            continue

        print(f"\n{'='*70}")
        print(f"Importing {filename} (Level {level})")
        print(f"{'='*70}")
        count = convert_file(filepath, level, label)
        print(f"  => {count} texts imported from {filename}")
        total += count

    print(f"\n{'='*70}")
    print(f"TOTAL: {total} texts imported")
    print(f"DB total: {db.get_text_count()} texts")
    print(f"{'='*70}")

    # Coverage summary
    print("\n=== Coverage by Band ===")
    conn = db.get_connection()
    bands = conn.execute(
        "SELECT lexile_band, COUNT(*) as cnt FROM reading_text GROUP BY lexile_band ORDER BY lexile_band"
    ).fetchall()
    for b in bands:
        print(f"  {b['lexile_band']}: {b['cnt']} texts")

    print("\n=== Coverage by Genre ===")
    genres = conn.execute(
        "SELECT genre, COUNT(*) as cnt FROM reading_text GROUP BY genre ORDER BY cnt DESC"
    ).fetchall()
    for g in genres:
        print(f"  {g['genre']}: {g['cnt']} texts")

    print("\n=== Coverage by Source ===")
    sources = conn.execute(
        "SELECT SUBSTR(notes, 1, 30) as src, COUNT(*) as cnt FROM reading_text GROUP BY src ORDER BY cnt DESC"
    ).fetchall()
    for s in sources:
        print(f"  {s['src']}: {s['cnt']} texts")

    conn.close()


if __name__ == "__main__":
    main()
