"""Demo script - shows all main features of the Reading Text DB."""
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box
import database as db
import validation as val

console = Console()

# === Banner ===
console.print(Panel(
    "[bold cyan]Lexile Reading Text DB[/bold cyan]\n"
    "Lexile-based EFL Reading Text Database",
    box=box.DOUBLE,
))
console.print(f"[dim]DB: {db.DB_PATH}[/dim]")
console.print(f"[dim]Total texts: {db.get_text_count()}[/dim]\n")

# === 1. DB Stats ===
conn = db.get_connection()
total = conn.execute("SELECT COUNT(*) FROM reading_text").fetchone()[0]
with_text = conn.execute(
    "SELECT COUNT(*) FROM reading_text WHERE text_body IS NOT NULL AND text_body <> ''"
).fetchone()[0]
genres = conn.execute(
    "SELECT genre, COUNT(*) as cnt FROM reading_text GROUP BY genre ORDER BY cnt DESC"
).fetchall()
conn.close()

console.print(Panel(
    f"[bold]Total texts:[/bold] {total}\n"
    f"[bold]With body:[/bold] {with_text}\n"
    f"[bold]Empty slots:[/bold] {total - with_text}",
    title="DB Statistics",
    box=box.ROUNDED,
))

gt = Table(title="Genre Summary", box=box.SIMPLE)
gt.add_column("Genre", width=16)
gt.add_column("Count", justify="right", width=8)
for g in genres:
    gt.add_row(g["genre"], str(g["cnt"]))
console.print(gt)

# === 2. Full Text List ===
rows = db.get_all_texts()
table = Table(title="Reading Text Master (700-900L)", box=box.SIMPLE_HEAVY)
table.add_column("ID", style="cyan", width=20)
table.add_column("Score", justify="right", width=5)
table.add_column("Genre", width=14)
table.add_column("Type", width=7)
table.add_column("Words", justify="right", width=5)
table.add_column("Topic", width=22)
table.add_column("CEFR", width=6)
for r in rows:
    table.add_row(
        r["text_id"], str(r["lexile_score"]), r["genre"],
        r["length_type"], str(r["word_count"] or ""),
        r["topic"] or "", r["vocabulary_band"] or "",
    )
console.print(table)

# === 3. Coverage Matrix ===
matrix = db.get_coverage_matrix("700-900")
ct = Table(title="Coverage Matrix (Lexile 700-900)", box=box.ROUNDED)
ct.add_column("Genre", style="bold", width=16)
for lt in ["Micro", "Short", "Medium", "Long"]:
    ct.add_column(lt, justify="center", width=8)
ct.add_column("Total", justify="center", width=7, style="bold")

all_genres = ["Narrative", "Expository", "Informational", "Argumentative", "Procedural", "Literary"]
for genre in all_genres:
    counts = matrix.get(genre, {})
    row_total = sum(counts.values())
    cells = []
    for lt in ["Micro", "Short", "Medium", "Long"]:
        c = counts.get(lt, 0)
        cells.append(f"[green]{c}[/green]" if c > 0 else "[red]0[/red]")
    ct.add_row(genre, *cells, str(row_total))
console.print(ct)

# === 4. Validation ===
console.print("\n[bold]== Data Validation ==[/bold]")
errors = val.validate_all(rows)
if not errors:
    console.print("[bold green]All rows valid![/bold green]")
else:
    console.print(f"[bold yellow]{len(errors)} rows with warnings:[/bold yellow]")
    for tid, errs in errors.items():
        for e in errs:
            console.print(f"  [yellow]{tid}: {e['message']}[/yellow]")

# === 5. Sample Text Detail ===
console.print()
for idx in [0, 3, 9]:
    if idx < len(rows):
        r = rows[idx]
        console.print(Panel(
            f"[bold cyan]{r['text_id']}[/bold cyan]\n"
            f"Band: {r['lexile_band']} | Score: {r['lexile_score']} | "
            f"Genre: {r['genre']} | Type: {r['length_type']}\n"
            f"Words: {r['word_count']} | Sentences: {r['sentence_count']} | "
            f"Avg: {r['avg_sentence_length']}\n"
            f"Age: {r['age_group']} ({r['grade_hint'] or ''}) | CEFR: {r['vocabulary_band'] or ''}",
            title="Text Detail",
            box=box.ROUNDED,
        ))
        body = r["text_body"] or "(no text)"
        if len(body) > 400:
            body = body[:400] + "..."
        console.print(Panel(body, title=f"Topic: {r['topic'] or 'N/A'}", box=box.SIMPLE))
        console.print()

console.print("[bold green]Demo complete![/bold green]")
