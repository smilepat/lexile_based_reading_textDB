"""
LLM Toolkit - Use the Reading Text DB to generate structured LLM prompts
for comprehension questions, lesson plans, vocabulary exercises, and more.

Usage:
    python llm_toolkit.py

This module provides:
1. Text retrieval by criteria (band, genre, length, topic keyword)
2. Ready-to-use LLM prompt generation for 8 task types
3. Batch prompt export for offline LLM use
4. Curriculum sequence builder
"""
import os
import sys
import json

sys.path.insert(0, os.path.dirname(__file__))
import database as db

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich import box

console = Console()

# ==================== Prompt Templates ====================

PROMPT_TEMPLATES = {
    "comprehension": {
        "name": "Reading Comprehension Questions",
        "description": "Generate comprehension questions for a reading passage",
        "template": """You are an expert EFL test item writer for Korean {age_group} students.

READING PASSAGE (Lexile {lexile_score}, {genre}, {word_count} words):
---
{text_body}
---

TASK: Create {num_questions} reading comprehension questions for this passage.

REQUIREMENTS:
- Target level: {vocabulary_band} (CEFR)
- Include a mix of question types:
  * 2 factual/detail questions (직접 정보 확인)
  * 1 inference question (추론)
  * 1 vocabulary-in-context question (문맥 어휘)
  * 1 main idea/purpose question (주제/목적)
- Each question must have 4 answer choices (A-D) with exactly 1 correct answer
- Distractors should be plausible but clearly wrong
- Use language appropriate for {age_group} Korean EFL students

OUTPUT FORMAT (JSON):
{{
  "questions": [
    {{
      "number": 1,
      "type": "factual|inference|vocabulary|main_idea",
      "question": "...",
      "choices": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
      "answer": "A",
      "explanation": "Brief explanation of why this is correct"
    }}
  ]
}}""",
    },

    "vocabulary": {
        "name": "Vocabulary Exercise",
        "description": "Generate vocabulary exercises from a reading passage",
        "template": """You are an expert EFL vocabulary instructor for Korean {age_group} students.

READING PASSAGE (Lexile {lexile_score}, {word_count} words):
---
{text_body}
---

TASK: Create vocabulary exercises based on this passage.

REQUIREMENTS:
- Select 8-10 key words/phrases from the passage
- Target CEFR level: {vocabulary_band}
- For each word, provide:
  1. The word as used in the passage (with the sentence)
  2. Korean translation
  3. English definition (student-friendly)
  4. Part of speech
  5. One example sentence (different context)
  6. A fill-in-the-blank exercise using that word

OUTPUT FORMAT (JSON):
{{
  "vocabulary": [
    {{
      "word": "...",
      "context_sentence": "The original sentence from the passage",
      "korean": "Korean translation",
      "definition": "Simple English definition",
      "pos": "noun/verb/adjective/adverb",
      "example": "A new example sentence",
      "exercise": "Fill in: The scientist ___ the data carefully. (answer: analyzed)"
    }}
  ]
}}""",
    },

    "summary": {
        "name": "Summary Writing Guide",
        "description": "Generate a summary writing task with scaffolding",
        "template": """You are an expert EFL writing instructor for Korean {age_group} students.

READING PASSAGE (Lexile {lexile_score}, {genre}, {word_count} words):
---
{text_body}
---

TASK: Create a scaffolded summary writing exercise for this passage.

PROVIDE:
1. **Key Sentence Identification**: List the 3-4 most important sentences from the passage
2. **Graphic Organizer**: A simple outline showing the text structure ({genre} structure)
3. **Sentence Starters**: 4-5 sentence starters students can use to write their summary
4. **Model Summary**: A sample summary (about {summary_length} words, appropriate for {vocabulary_band} level)
5. **Self-Check Rubric**: 3-4 criteria students can use to evaluate their own summary

OUTPUT FORMAT (JSON):
{{
  "key_sentences": ["...", "..."],
  "organizer": {{"type": "{genre}", "sections": [...]}},
  "sentence_starters": ["...", "..."],
  "model_summary": "...",
  "rubric": ["...", "..."]
}}""",
    },

    "lesson_plan": {
        "name": "Lesson Plan",
        "description": "Generate a complete lesson plan around a reading text",
        "template": """You are an expert EFL curriculum designer for Korean {age_group} students.

READING PASSAGE (Lexile {lexile_score}, {genre}, {word_count} words, Topic: {topic}):
---
{text_body}
---

TASK: Create a structured lesson plan using this reading passage.

LESSON PLAN STRUCTURE:
1. **Warm-up (5 min)**: Activating prior knowledge about "{topic}"
2. **Pre-reading (5 min)**: Key vocabulary preview (5 words), prediction activity
3. **While-reading (15 min)**:
   - First read: gist/main idea
   - Second read: detailed comprehension
   - Reading strategy focus (appropriate for {vocabulary_band} level)
4. **Post-reading (10 min)**: Discussion questions, personal connection activity
5. **Extension activity**: Homework or follow-up task
6. **Assessment**: 3 quick-check questions

Include specific instructions for the teacher, estimated timing, and materials needed.
Adapt all activities to Korean EFL classroom context.

OUTPUT: Structured lesson plan in markdown format.""",
    },

    "csat_style": {
        "name": "CSAT-Style Question (수능형)",
        "description": "Generate CSAT (수능) format questions",
        "template": """You are an expert Korean CSAT (수능) English test item writer.

READING PASSAGE (Lexile {lexile_score}, {genre}, {word_count} words):
---
{text_body}
---

TASK: Create CSAT-style (수능형) questions based on this passage.

Generate the following question types:
1. **주제 (Main Topic)**: "What is the main topic of the passage?"
2. **제목 (Title)**: "Which is the best title for the passage?"
3. **요지 (Main Point)**: "What is the main point the author is making?"
4. **빈칸 추론 (Fill in the blank)**: Remove a key phrase and ask students to infer it
5. **순서 배열 (Sentence ordering)**: Rearrange 3 sentences from the passage

REQUIREMENTS:
- Follow actual CSAT format exactly
- 5 answer choices (①-⑤) for each question
- Difficulty appropriate for Lexile {lexile_score}
- Include Korean instructions (지시문) as used in actual CSAT

OUTPUT FORMAT (JSON):
{{
  "questions": [
    {{
      "type": "주제|제목|요지|빈칸추론|순서배열",
      "instruction_kr": "Korean instruction as in CSAT",
      "question": "...",
      "choices": ["①...", "②...", "③...", "④...", "⑤..."],
      "answer": "③",
      "explanation": "..."
    }}
  ]
}}""",
    },

    "graded_reader": {
        "name": "Graded Reader (Level Adaptation)",
        "description": "Adapt a text to a different Lexile level",
        "template": """You are an expert EFL reading text adapter.

ORIGINAL PASSAGE (Lexile {lexile_score}, {word_count} words):
---
{text_body}
---

TASK: Rewrite this passage at Lexile {target_lexile} level ({target_age_group}).

ADAPTATION RULES FOR {target_lexile}:
{adaptation_rules}

REQUIREMENTS:
- Keep the SAME topic and core information
- Adjust vocabulary, sentence length, and complexity
- Target word count: {target_word_count} words
- Maintain natural, authentic English
- Content must remain age-appropriate for {target_age_group}

OUTPUT FORMAT (JSON):
{{
  "adapted_text": "...",
  "word_count": <number>,
  "sentence_count": <number>,
  "changes_made": ["List of key changes: simplified X, replaced Y with Z, etc."],
  "lexile_estimate": <number>
}}""",
    },

    "discussion": {
        "name": "Discussion Questions",
        "description": "Generate discussion and critical thinking questions",
        "template": """You are an expert EFL discussion facilitator for Korean {age_group} students.

READING PASSAGE (Lexile {lexile_score}, {genre}, Topic: {topic}):
---
{text_body}
---

TASK: Generate discussion questions at three levels of thinking.

1. **Literal Level** (2 questions): Questions answered directly from the text
2. **Interpretive Level** (2 questions): Questions requiring inference and analysis
3. **Applied Level** (2 questions): Questions connecting the text to students' lives/opinions

REQUIREMENTS:
- Use language appropriate for {vocabulary_band} level
- Include sentence frames for students who need support
  (e.g., "I think... because...", "In my opinion...")
- Add a "Think-Pair-Share" activity prompt
- Include one creative response option (drawing, role-play, writing)

OUTPUT FORMAT (JSON):
{{
  "literal": [{{"question": "...", "sentence_frame": "..."}}],
  "interpretive": [{{"question": "...", "sentence_frame": "..."}}],
  "applied": [{{"question": "...", "sentence_frame": "..."}}],
  "think_pair_share": "...",
  "creative_response": "..."
}}""",
    },

    "grammar_focus": {
        "name": "Grammar in Context",
        "description": "Extract and teach grammar patterns from the passage",
        "template": """You are an expert EFL grammar instructor for Korean {age_group} students.

READING PASSAGE (Lexile {lexile_score}, {word_count} words):
---
{text_body}
---

TASK: Create grammar-in-context exercises based on this passage.

REQUIREMENTS:
1. Identify 3 key grammar patterns that appear in the passage
2. For each pattern:
   - Extract 2 example sentences from the passage
   - Explain the grammar rule simply (in English, with Korean term in parentheses)
   - Provide 3 practice exercises (fill-in, rewrite, error correction)
   - Give 2 original sentences students can create using the pattern

Target grammar complexity: {vocabulary_band} (CEFR)

OUTPUT FORMAT (JSON):
{{
  "grammar_points": [
    {{
      "pattern": "Name of grammar pattern (Korean term)",
      "examples_from_text": ["...", "..."],
      "explanation": "Clear, simple rule explanation",
      "exercises": [
        {{"type": "fill_in", "question": "...", "answer": "..."}},
        {{"type": "rewrite", "question": "...", "answer": "..."}},
        {{"type": "error_correction", "question": "...", "answer": "..."}}
      ],
      "student_practice": "Create 2 sentences using this pattern about your own life."
    }}
  ]
}}""",
    },
}

# ==================== Adaptation Rules by Level ====================

ADAPTATION_RULES = {
    "100-300": "Use ONLY simple sentences (S+V+O), max 8-10 words per sentence. Present tense. Basic sight words only. No abstract vocabulary.",
    "300-500": "Simple and compound sentences. Use 'because', 'so', 'but'. Avg 8-12 words/sentence. Common everyday vocabulary.",
    "500-700": "Mix of simple, compound, complex sentences. Avg 10-14 words/sentence. Subordinate clauses (when, if, although). Basic academic words.",
    "700-900": "Varied structures including compound-complex. Avg 12-18 words/sentence. Participial phrases, relative clauses. General academic vocabulary.",
    "900-1100": "Complex structures with embedded clauses. Avg 15-22 words/sentence. Nominalization, discourse markers. Academic word list.",
    "1100-1300": "Sophisticated structures: appositives, reduced clauses. Avg 18-25 words/sentence. Hedging language. CSAT-style implicit reasoning.",
    "1300-1500": "Dense academic prose. Avg 20-28 words/sentence. Formal register, nominalization, advanced academic vocabulary.",
}

TARGET_WORD_COUNTS = {
    "100-300": 50,
    "300-500": 100,
    "500-700": 150,
    "700-900": 200,
    "900-1100": 250,
    "1100-1300": 300,
    "1300-1500": 350,
}


# ==================== Core Functions ====================

def search_texts(band=None, genre=None, length_type=None, keyword=None):
    """Search DB with multiple filters."""
    conn = db.get_connection()
    query = "SELECT * FROM reading_text WHERE 1=1"
    params = []

    if band:
        query += " AND lexile_band = ?"
        params.append(band)
    if genre:
        query += " AND genre = ?"
        params.append(genre)
    if length_type:
        query += " AND length_type = ?"
        params.append(length_type)
    if keyword:
        query += " AND (topic LIKE ? OR text_body LIKE ?)"
        params.extend([f"%{keyword}%", f"%{keyword}%"])

    query += " ORDER BY lexile_score"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return rows


def build_prompt(text_row, task_type, **kwargs):
    """Build an LLM prompt from a text row and task type."""
    template_info = PROMPT_TEMPLATES.get(task_type)
    if not template_info:
        raise ValueError(f"Unknown task type: {task_type}")

    row = dict(text_row)

    # Default values
    row.setdefault("num_questions", kwargs.get("num_questions", 5))
    row.setdefault("summary_length", max(row.get("word_count", 100) // 3, 30))

    # For graded reader adaptation
    if task_type == "graded_reader":
        target_band = kwargs.get("target_band", "500-700")
        row["target_lexile"] = target_band
        row["target_age_group"] = db.get_connection().execute(
            "SELECT age_group FROM config_bands WHERE band = ?", (target_band,)
        ).fetchone()
        if row["target_age_group"]:
            row["target_age_group"] = row["target_age_group"][0]
        else:
            row["target_age_group"] = "Middle School"
        row["adaptation_rules"] = ADAPTATION_RULES.get(target_band, "")
        row["target_word_count"] = TARGET_WORD_COUNTS.get(target_band, 200)

    # Merge extra kwargs
    row.update(kwargs)

    return template_info["template"].format(**row)


def export_prompt(text_row, task_type, output_path=None, **kwargs):
    """Export a prompt to a file or return as string."""
    prompt = build_prompt(text_row, task_type, **kwargs)

    if output_path:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(f"# Task: {PROMPT_TEMPLATES[task_type]['name']}\n")
            f.write(f"# Text ID: {text_row['text_id']}\n")
            f.write(f"# Lexile: {text_row['lexile_score']} ({text_row['lexile_band']})\n")
            f.write(f"# Genre: {text_row['genre']} | Topic: {text_row['topic']}\n")
            f.write(f"# Words: {text_row['word_count']}\n\n")
            f.write(prompt)
        return output_path
    return prompt


def build_curriculum_sequence(band, num_texts=5):
    """Build a progressive reading sequence within a band."""
    conn = db.get_connection()

    # Get texts in order: Micro -> Short -> Medium -> Long
    length_order = "'Micro','Short','Medium','Long','Extra Long'"
    rows = conn.execute(f"""
        SELECT * FROM reading_text
        WHERE lexile_band = ?
        ORDER BY
            CASE length_type
                WHEN 'Micro' THEN 1
                WHEN 'Short' THEN 2
                WHEN 'Medium' THEN 3
                WHEN 'Long' THEN 4
                WHEN 'Extra Long' THEN 5
            END,
            lexile_score
        LIMIT ?
    """, (band, num_texts)).fetchall()
    conn.close()
    return rows


# ==================== Interactive CLI ====================

def show_menu():
    console.print()
    console.print("[bold]===== LLM TOOLKIT =====[/bold]")
    console.print("[1] Search & Select Text")
    console.print("[2] Generate LLM Prompt")
    console.print("[3] Batch Export Prompts")
    console.print("[4] Build Curriculum Sequence")
    console.print("[5] Quick Generate (Band + Task)")
    console.print("[0] Exit")
    console.print()


def select_text():
    """Interactive text selection."""
    console.print("[bold]Filter texts:[/bold]")
    band = Prompt.ask("Lexile Band (e.g. 700-900, Enter=all)", default="")
    genre = Prompt.ask("Genre (e.g. Narrative, Enter=all)", default="")
    keyword = Prompt.ask("Topic keyword (Enter=none)", default="")

    rows = search_texts(
        band=band or None,
        genre=genre or None,
        keyword=keyword or None,
    )

    if not rows:
        console.print("[yellow]No results found.[/yellow]")
        return None

    table = Table(title=f"Results ({len(rows)} texts)", box=box.SIMPLE)
    table.add_column("#", width=4)
    table.add_column("ID", style="cyan", width=20)
    table.add_column("Band", width=8)
    table.add_column("Genre", width=14)
    table.add_column("Type", width=7)
    table.add_column("Words", justify="right", width=5)
    table.add_column("Topic", width=30)

    for i, r in enumerate(rows[:20]):
        table.add_row(
            str(i + 1), r["text_id"], r["lexile_band"],
            r["genre"], r["length_type"],
            str(r["word_count"] or ""), (r["topic"] or "")[:30],
        )

    console.print(table)
    if len(rows) > 20:
        console.print(f"[dim]... and {len(rows) - 20} more[/dim]")

    choice = Prompt.ask("Select # (or 0 to cancel)", default="1")
    idx = int(choice) - 1
    if 0 <= idx < len(rows):
        return rows[idx]
    return None


def select_task_type():
    """Interactive task type selection."""
    console.print("\n[bold]Available Task Types:[/bold]")
    tasks = list(PROMPT_TEMPLATES.keys())
    for i, key in enumerate(tasks):
        info = PROMPT_TEMPLATES[key]
        console.print(f"  [{i+1}] {info['name']} - {info['description']}")

    choice = Prompt.ask("Select task #", default="1")
    idx = int(choice) - 1
    if 0 <= idx < len(tasks):
        return tasks[idx]
    return tasks[0]


def interactive_generate():
    """Full interactive prompt generation flow."""
    text = select_text()
    if not text:
        return

    console.print(Panel(
        f"[cyan]{text['text_id']}[/cyan] | {text['lexile_band']} | "
        f"{text['genre']} | {text['word_count']}w\n"
        f"Topic: {text['topic']}",
        title="Selected Text",
    ))

    task_type = select_task_type()

    kwargs = {}
    if task_type == "comprehension":
        n = Prompt.ask("Number of questions", default="5")
        kwargs["num_questions"] = int(n)
    elif task_type == "graded_reader":
        target = Prompt.ask("Target Lexile Band", default="500-700")
        kwargs["target_band"] = target

    prompt = build_prompt(text, task_type, **kwargs)

    console.print(Panel(prompt, title=f"Generated Prompt: {PROMPT_TEMPLATES[task_type]['name']}", box=box.ROUNDED))

    if Confirm.ask("Save to file?"):
        filename = f"prompt_{text['text_id']}_{task_type}.txt"
        filepath = os.path.join(os.path.dirname(__file__), filename)
        export_prompt(text, task_type, filepath, **kwargs)
        console.print(f"[green]Saved: {filepath}[/green]")

    if Confirm.ask("Copy prompt to clipboard? (requires pyperclip)"):
        try:
            import pyperclip
            pyperclip.copy(prompt)
            console.print("[green]Copied to clipboard![/green]")
        except ImportError:
            console.print("[yellow]pyperclip not installed. pip install pyperclip[/yellow]")


def batch_export():
    """Export prompts for multiple texts."""
    band = Prompt.ask("Lexile Band", default="700-900")
    task_type = select_task_type()

    rows = search_texts(band=band)
    if not rows:
        console.print("[yellow]No texts found.[/yellow]")
        return

    output_dir = os.path.join(os.path.dirname(__file__), "prompts_export")
    os.makedirs(output_dir, exist_ok=True)

    for r in rows:
        filename = f"{r['text_id']}_{task_type}.txt"
        filepath = os.path.join(output_dir, filename)
        export_prompt(r, task_type, filepath)

    console.print(f"[green]{len(rows)} prompts exported to {output_dir}/[/green]")


def curriculum_builder():
    """Build a reading curriculum sequence."""
    band = Prompt.ask("Lexile Band", default="700-900")
    num = Prompt.ask("Number of texts", default="5")

    rows = build_curriculum_sequence(band, int(num))
    if not rows:
        console.print("[yellow]No texts found.[/yellow]")
        return

    console.print(f"\n[bold]Curriculum Sequence: Lexile {band}[/bold]")
    for i, r in enumerate(rows):
        console.print(Panel(
            f"[bold]Step {i+1}: {r['length_type']} ({r['word_count']}w)[/bold]\n"
            f"Genre: {r['genre']} | Topic: {r['topic']}\n"
            f"ID: {r['text_id']} | Lexile: {r['lexile_score']}",
            box=box.SIMPLE,
        ))

    if Confirm.ask("Export lesson plans for this sequence?"):
        output_dir = os.path.join(os.path.dirname(__file__), "curriculum_export")
        os.makedirs(output_dir, exist_ok=True)

        for i, r in enumerate(rows):
            filename = f"step{i+1}_{r['text_id']}_lesson.txt"
            filepath = os.path.join(output_dir, filename)
            export_prompt(r, "lesson_plan", filepath)

        console.print(f"[green]Curriculum exported to {output_dir}/[/green]")


def quick_generate():
    """One-step: pick band + task, get a random text and prompt."""
    band = Prompt.ask("Lexile Band", default="700-900")
    task_type = select_task_type()

    conn = db.get_connection()
    row = conn.execute(
        "SELECT * FROM reading_text WHERE lexile_band = ? AND text_body IS NOT NULL ORDER BY RANDOM() LIMIT 1",
        (band,)
    ).fetchone()
    conn.close()

    if not row:
        console.print("[yellow]No texts found.[/yellow]")
        return

    console.print(f"[dim]Selected: {row['text_id']} | {row['topic']}[/dim]")
    prompt = build_prompt(row, task_type)
    console.print(Panel(prompt, title=PROMPT_TEMPLATES[task_type]["name"], box=box.ROUNDED))


def main():
    db.init_db()

    console.print(Panel(
        "[bold cyan]LLM Toolkit[/bold cyan]\n"
        "Reading Text DB → LLM Prompt Generator",
        box=box.DOUBLE,
    ))
    console.print(f"[dim]DB: {db.get_text_count()} texts available[/dim]")

    actions = {
        "1": select_text,
        "2": interactive_generate,
        "3": batch_export,
        "4": curriculum_builder,
        "5": quick_generate,
    }

    while True:
        show_menu()
        choice = Prompt.ask("Select", default="0")
        if choice == "0":
            break
        action = actions.get(choice)
        if action:
            try:
                action()
            except (KeyboardInterrupt, EOFError):
                console.print("\n[yellow]Cancelled[/yellow]")
            except Exception as e:
                console.print(f"[red]Error: {e}[/red]")
        else:
            console.print("[red]Invalid choice[/red]")


if __name__ == "__main__":
    main()
