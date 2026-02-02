"""
Lexile Reading Text DB - CLI Application
Usage: python app.py
"""
import os
import sys

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, IntPrompt, Confirm
from rich import box

import database as db
import validation as val
import generator as gen

console = Console()

SAMPLE_CSV = os.path.join(os.path.dirname(__file__), "..", "sheets-setup", "sample-data.csv")


def show_banner():
    console.print(Panel(
        "[bold cyan]Lexile Reading Text DB[/bold cyan]\n"
        "렉사일 기반 EFL 읽기 텍스트 데이터베이스",
        box=box.DOUBLE,
    ))


def show_menu():
    console.print()
    console.print("[bold]===== MENU =====[/bold]")
    console.print("[1] 전체 텍스트 목록 보기")
    console.print("[2] Coverage Matrix 보기")
    console.print("[3] 데이터 검증 실행")
    console.print("[4] 텍스트 검색 (Band/Genre 필터)")
    console.print("[5] 텍스트 상세 보기")
    console.print("[6] AI 텍스트 생성")
    console.print("[7] CSV 임포트")
    console.print("[8] CSV 내보내기")
    console.print("[9] DB 통계")
    console.print("[0] 종료")
    console.print()


def show_text_list():
    rows = db.get_all_texts()
    if not rows:
        console.print("[yellow]데이터가 없습니다. CSV 임포트(7)를 먼저 실행하세요.[/yellow]")
        return

    table = Table(title="Reading Text Master", box=box.SIMPLE_HEAVY, show_lines=False)
    table.add_column("ID", style="cyan", width=20)
    table.add_column("Band", width=8)
    table.add_column("Score", justify="right", width=5)
    table.add_column("Genre", width=14)
    table.add_column("Type", width=7)
    table.add_column("Words", justify="right", width=5)
    table.add_column("Topic", width=20)
    table.add_column("CEFR", width=6)

    for r in rows:
        table.add_row(
            r["text_id"], r["lexile_band"], str(r["lexile_score"]),
            r["genre"], r["length_type"], str(r["word_count"] or ""),
            r["topic"] or "", r["vocabulary_band"] or "",
        )

    console.print(table)
    console.print(f"[dim]총 {len(rows)}개 텍스트[/dim]")


def show_coverage_matrix():
    bands = [b[0] for b in db.LEXILE_BANDS]
    console.print("[bold]Band를 선택하세요 (Enter=전체):[/bold]")
    for i, b in enumerate(bands):
        console.print(f"  [{i+1}] {b}")

    choice = Prompt.ask("선택", default="")
    band_filter = None
    if choice.isdigit() and 1 <= int(choice) <= len(bands):
        band_filter = bands[int(choice) - 1]

    matrix = db.get_coverage_matrix(band_filter)
    if not matrix:
        console.print("[yellow]데이터가 없습니다.[/yellow]")
        return

    title = f"Coverage Matrix"
    if band_filter:
        title += f" - Lexile {band_filter}"

    table = Table(title=title, box=box.ROUNDED)
    table.add_column("Genre", style="bold", width=16)
    for lt in ["Micro", "Short", "Medium", "Long"]:
        table.add_column(lt, justify="center", width=8)
    table.add_column("Total", justify="center", width=7, style="bold")

    genres = ["Narrative", "Expository", "Informational", "Argumentative", "Procedural", "Literary"]
    for genre in genres:
        counts = matrix.get(genre, {})
        row_total = sum(counts.values())
        cells = []
        for lt in ["Micro", "Short", "Medium", "Long"]:
            c = counts.get(lt, 0)
            cells.append(f"[green]{c}[/green]" if c > 0 else f"[red]0[/red]")
        table.add_row(genre, *cells, str(row_total))

    console.print(table)


def run_validation():
    rows = db.get_all_texts()
    if not rows:
        console.print("[yellow]데이터가 없습니다.[/yellow]")
        return

    results = val.validate_all(rows)
    if not results:
        console.print("[bold green]검증 완료: 오류 없음![/bold green]")
        return

    total_errors = sum(len(errs) for errs in results.values())
    console.print(f"[bold red]검증 완료: {total_errors}개 오류 발견[/bold red]")

    for text_id, errors in results.items():
        console.print(f"\n[bold]{text_id}[/bold]:")
        for err in errors:
            console.print(f"  [red]- [{err['type']}] {err['message']}[/red]")


def search_texts():
    console.print("[bold]필터 옵션:[/bold]")
    band = Prompt.ask("Lexile Band (예: 700-900, Enter=전체)", default="")
    genre = Prompt.ask("Genre (예: Narrative, Enter=전체)", default="")

    rows = db.get_all_texts(
        band_filter=band if band else None,
        genre_filter=genre if genre else None,
    )

    if not rows:
        console.print("[yellow]결과가 없습니다.[/yellow]")
        return

    table = Table(box=box.SIMPLE)
    table.add_column("ID", style="cyan", width=20)
    table.add_column("Band", width=8)
    table.add_column("Genre", width=14)
    table.add_column("Type", width=7)
    table.add_column("Words", justify="right", width=5)
    table.add_column("Topic", width=20)

    for r in rows:
        table.add_row(
            r["text_id"], r["lexile_band"], r["genre"],
            r["length_type"], str(r["word_count"] or ""), r["topic"] or "",
        )

    console.print(table)
    console.print(f"[dim]{len(rows)}개 결과[/dim]")


def show_text_detail():
    text_id = Prompt.ask("text_id 입력")
    conn = db.get_connection()
    row = conn.execute("SELECT * FROM reading_text WHERE text_id = ?", (text_id,)).fetchone()
    conn.close()

    if not row:
        console.print(f"[red]{text_id}를 찾을 수 없습니다.[/red]")
        return

    console.print(Panel(
        f"[bold cyan]{row['text_id']}[/bold cyan]\n"
        f"Band: {row['lexile_band']} | Score: {row['lexile_score']} | "
        f"Genre: {row['genre']} | Length: {row['length_type']}\n"
        f"Age: {row['age_group']} ({row['grade_hint'] or ''}) | "
        f"CEFR: {row['vocabulary_band'] or ''} | Use: {row['intended_use'] or ''}\n"
        f"Words: {row['word_count']} | Sentences: {row['sentence_count']} | "
        f"Avg Length: {row['avg_sentence_length']}",
        title="Text Info",
        box=box.ROUNDED,
    ))

    if row["text_body"]:
        console.print(Panel(row["text_body"], title=f"Topic: {row['topic'] or 'N/A'}", box=box.SIMPLE))
    else:
        console.print("[yellow]텍스트 본문이 없습니다.[/yellow]")


def ai_generate():
    console.print("[bold]AI 텍스트 생성[/bold]")

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        api_key = Prompt.ask("Anthropic API Key 입력")
        if not api_key:
            console.print("[red]API Key가 필요합니다.[/red]")
            return

    band = Prompt.ask("Lexile Band", default="700-900")
    genre = Prompt.ask("Genre", choices=["Narrative", "Expository", "Informational", "Argumentative", "Procedural", "Literary"])
    length_type = Prompt.ask("Length Type", choices=["Micro", "Short", "Medium", "Long"])
    topic = Prompt.ask("Topic (Enter=자동)", default="")
    age_group = Prompt.ask("Age Group", default="Middle School")
    vocab = Prompt.ask("CEFR Band", default="A2/B1")

    with console.status("[bold green]텍스트 생성 중..."):
        try:
            result = gen.generate_text(
                genre=genre,
                length_type=length_type,
                lexile_band=band,
                topic=topic or None,
                age_group=age_group,
                vocabulary_band=vocab,
                api_key=api_key,
            )
        except Exception as e:
            console.print(f"[red]생성 실패: {e}[/red]")
            return

    console.print(Panel(result["text_body"], title="Generated Text", box=box.ROUNDED))
    console.print(f"Words: {result['word_count']} | Sentences: {result['sentence_count']}")

    if Confirm.ask("DB에 저장하시겠습니까?"):
        # Find lexile_score midpoint
        lo, hi = band.split("-")
        mid_score = (int(lo) + int(hi)) // 2
        if result.get("lexile_estimate"):
            mid_score = result["lexile_estimate"]

        data = {
            "lexile_band": band,
            "lexile_score": mid_score,
            "age_group": age_group,
            "genre": genre,
            "topic": topic or gen.get_default_topic(genre, age_group),
            "word_count": result["word_count"],
            "length_type": length_type,
            "text_body": result["text_body"],
            "sentence_count": result["sentence_count"],
            "avg_sentence_length": round(result["word_count"] / max(result["sentence_count"], 1), 1),
            "vocabulary_band": vocab,
            "intended_use": "수업",
        }

        text_id = db.insert_text(data)
        console.print(f"[green]저장 완료: {text_id}[/green]")


def import_csv():
    path = Prompt.ask("CSV 파일 경로", default=SAMPLE_CSV)
    if not os.path.exists(path):
        console.print(f"[red]파일을 찾을 수 없습니다: {path}[/red]")
        return

    count = db.import_csv(path)
    console.print(f"[green]{count}개 텍스트를 임포트했습니다.[/green]")


def export_csv():
    path = Prompt.ask("저장 경로", default="export_reading_text.csv")
    count = db.export_csv(path)
    if count:
        console.print(f"[green]{count}개 텍스트를 {path}에 내보냈습니다.[/green]")
    else:
        console.print("[yellow]내보낼 데이터가 없습니다.[/yellow]")


def show_stats():
    conn = db.get_connection()

    total = conn.execute("SELECT COUNT(*) FROM reading_text").fetchone()[0]
    with_text = conn.execute("SELECT COUNT(*) FROM reading_text WHERE text_body IS NOT NULL AND text_body != ''").fetchone()[0]
    bands = conn.execute("SELECT lexile_band, COUNT(*) as cnt FROM reading_text GROUP BY lexile_band ORDER BY lexile_band").fetchall()
    genres = conn.execute("SELECT genre, COUNT(*) as cnt FROM reading_text GROUP BY genre ORDER BY cnt DESC").fetchall()

    conn.close()

    console.print(Panel(
        f"[bold]총 텍스트 수:[/bold] {total}\n"
        f"[bold]본문 포함:[/bold] {with_text}\n"
        f"[bold]본문 미작성:[/bold] {total - with_text}",
        title="DB Statistics",
        box=box.ROUNDED,
    ))

    if bands:
        table = Table(title="Band별 현황", box=box.SIMPLE)
        table.add_column("Lexile Band", width=12)
        table.add_column("Count", justify="right", width=8)
        for b in bands:
            table.add_row(b["lexile_band"], str(b["cnt"]))
        console.print(table)

    if genres:
        table = Table(title="Genre별 현황", box=box.SIMPLE)
        table.add_column("Genre", width=16)
        table.add_column("Count", justify="right", width=8)
        for g in genres:
            table.add_row(g["genre"], str(g["cnt"]))
        console.print(table)


def main():
    # Initialize DB
    db.init_db()

    show_banner()
    console.print(f"[dim]DB: {db.DB_PATH}[/dim]")
    console.print(f"[dim]텍스트 수: {db.get_text_count()}[/dim]")

    actions = {
        "1": show_text_list,
        "2": show_coverage_matrix,
        "3": run_validation,
        "4": search_texts,
        "5": show_text_detail,
        "6": ai_generate,
        "7": import_csv,
        "8": export_csv,
        "9": show_stats,
    }

    while True:
        show_menu()
        choice = Prompt.ask("선택", default="0")

        if choice == "0":
            console.print("[bold]종료합니다.[/bold]")
            break

        action = actions.get(choice)
        if action:
            try:
                action()
            except KeyboardInterrupt:
                console.print("\n[yellow]취소됨[/yellow]")
            except Exception as e:
                console.print(f"[red]오류: {e}[/red]")
        else:
            console.print("[red]잘못된 선택입니다.[/red]")


if __name__ == "__main__":
    main()
