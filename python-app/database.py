"""
Lexile Reading Text DB - SQLite Database Module
"""
import sqlite3
import os
import csv
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "reading_text.db")

GENRE_CODES = {
    "Narrative": "NAR",
    "Expository": "EXP",
    "Informational": "INF",
    "Argumentative": "ARG",
    "Procedural": "PRO",
    "Literary": "LIT",
}

LEXILE_BANDS = [
    ("100-300", "Early Elementary", "초1-2", "영어 문장 감각 형성"),
    ("300-500", "Upper Elementary", "초3-4", "의미 단위 읽기"),
    ("500-700", "Transitional", "초5-6", "문단 이해 시작"),
    ("700-900", "Middle School", "중1-2", "정보 이해"),
    ("900-1100", "Upper Secondary", "중3-고1", "논리·원인결과"),
    ("1100-1300", "Pre-CSAT", "고2-3", "추상 개념"),
    ("1300-1500", "Academic", "대학 초반", "학술 독해"),
]

GENRES = [
    ("NAR", "Narrative", "시간·사건"),
    ("EXP", "Expository", "설명"),
    ("INF", "Informational", "사실"),
    ("ARG", "Argumentative", "주장·근거"),
    ("PRO", "Procedural", "과정"),
    ("LIT", "Literary", "정서·표현"),
]

LENGTH_TYPES = [
    ("Micro", 50, "40-60", "워밍업 / 문장 훈련"),
    ("Short", 100, "80-120", "수업용 핵심 독해"),
    ("Medium", 200, "170-230", "정독 훈련"),
    ("Long", 350, "280-420", "다독 / 시험 대비"),
]


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS reading_text (
            text_id TEXT PRIMARY KEY,
            lexile_band TEXT NOT NULL,
            lexile_score INTEGER NOT NULL,
            age_group TEXT NOT NULL,
            grade_hint TEXT,
            genre TEXT NOT NULL,
            topic TEXT,
            word_count INTEGER,
            length_type TEXT NOT NULL,
            text_body TEXT,
            sentence_count INTEGER,
            avg_sentence_length REAL,
            vocabulary_band TEXT,
            intended_use TEXT,
            created_date TEXT,
            notes TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS config_bands (
            band TEXT PRIMARY KEY,
            age_group TEXT,
            grade TEXT,
            purpose TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS config_genres (
            code TEXT PRIMARY KEY,
            name TEXT,
            thinking_type TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS config_lengths (
            type TEXT PRIMARY KEY,
            target_words INTEGER,
            word_range TEXT,
            purpose TEXT
        )
    """)

    # Populate config tables
    for band in LEXILE_BANDS:
        c.execute(
            "INSERT OR IGNORE INTO config_bands VALUES (?, ?, ?, ?)", band
        )
    for genre in GENRES:
        c.execute(
            "INSERT OR IGNORE INTO config_genres VALUES (?, ?, ?)", genre
        )
    for length in LENGTH_TYPES:
        c.execute(
            "INSERT OR IGNORE INTO config_lengths VALUES (?, ?, ?, ?)", length
        )

    conn.commit()
    conn.close()


def generate_text_id(band, genre, word_count, conn):
    genre_code = GENRE_CODES.get(genre, "UNK")
    band_num = band.split("-")[0]
    prefix = f"L{band_num}-{genre_code}-{word_count:03d}"

    c = conn.cursor()
    c.execute(
        "SELECT text_id FROM reading_text WHERE text_id LIKE ?", (f"{prefix}%",)
    )
    rows = c.fetchall()

    max_seq = 0
    for row in rows:
        parts = row["text_id"].split("-")
        seq = int(parts[-1])
        if seq > max_seq:
            max_seq = seq

    return f"{prefix}-{max_seq + 1:03d}"


def calculate_text_stats(text_body):
    if not text_body:
        return 0, 0, 0.0

    words = text_body.strip().split()
    word_count = len(words)

    sentences = [s.strip() for s in text_body.replace("!", ".").replace("?", ".").split(".") if s.strip()]
    sentence_count = len(sentences)

    avg_length = round(word_count / sentence_count, 1) if sentence_count > 0 else 0.0
    return word_count, sentence_count, avg_length


def get_length_type(word_count):
    if word_count <= 60:
        return "Micro"
    if word_count <= 120:
        return "Short"
    if word_count <= 230:
        return "Medium"
    return "Long"


def insert_text(data, conn=None):
    close_conn = conn is None
    if conn is None:
        conn = get_connection()

    c = conn.cursor()

    # Auto-calculate stats if text_body exists
    if data.get("text_body"):
        wc, sc, avg = calculate_text_stats(data["text_body"])
        data.setdefault("word_count", wc)
        data.setdefault("sentence_count", sc)
        data.setdefault("avg_sentence_length", avg)
        data.setdefault("length_type", get_length_type(wc))

    # Auto-generate ID
    if not data.get("text_id"):
        data["text_id"] = generate_text_id(
            data["lexile_band"], data["genre"], data.get("word_count", 0), conn
        )

    data.setdefault("created_date", datetime.now().strftime("%Y-%m-%d"))

    columns = [
        "text_id", "lexile_band", "lexile_score", "age_group", "grade_hint",
        "genre", "topic", "word_count", "length_type", "text_body",
        "sentence_count", "avg_sentence_length", "vocabulary_band",
        "intended_use", "created_date", "notes",
    ]

    values = [data.get(col) for col in columns]
    placeholders = ", ".join(["?"] * len(columns))
    col_names = ", ".join(columns)

    c.execute(f"INSERT OR REPLACE INTO reading_text ({col_names}) VALUES ({placeholders})", values)
    conn.commit()

    if close_conn:
        conn.close()

    return data["text_id"]


def import_csv(csv_path):
    conn = get_connection()
    count = 0

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Convert numeric fields
            for field in ["lexile_score", "word_count", "sentence_count"]:
                if row.get(field):
                    row[field] = int(row[field])
            if row.get("avg_sentence_length"):
                row["avg_sentence_length"] = float(row["avg_sentence_length"])

            insert_text(row, conn)
            count += 1

    conn.close()
    return count


def get_all_texts(band_filter=None, genre_filter=None):
    conn = get_connection()
    query = "SELECT * FROM reading_text WHERE 1=1"
    params = []

    if band_filter:
        query += " AND lexile_band = ?"
        params.append(band_filter)
    if genre_filter:
        query += " AND genre = ?"
        params.append(genre_filter)

    query += " ORDER BY text_id"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return rows


def get_coverage_matrix(band_filter=None):
    conn = get_connection()
    query = "SELECT genre, length_type, COUNT(*) as cnt FROM reading_text"
    params = []

    if band_filter:
        query += " WHERE lexile_band = ?"
        params.append(band_filter)

    query += " GROUP BY genre, length_type"
    rows = conn.execute(query, params).fetchall()
    conn.close()

    matrix = {}
    for row in rows:
        genre = row["genre"]
        if genre not in matrix:
            matrix[genre] = {}
        matrix[genre][row["length_type"]] = row["cnt"]

    return matrix


def get_text_count():
    conn = get_connection()
    count = conn.execute("SELECT COUNT(*) FROM reading_text").fetchone()[0]
    conn.close()
    return count


def get_empty_slots():
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM reading_text WHERE text_body IS NULL OR text_body = ''"
    ).fetchall()
    conn.close()
    return rows


def export_csv(output_path):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM reading_text ORDER BY text_id").fetchall()
    conn.close()

    if not rows:
        return 0

    columns = rows[0].keys()
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        for row in rows:
            writer.writerow(dict(row))

    return len(rows)
