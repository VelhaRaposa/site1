#!/usr/bin/env python3
"""
etf_flows_research.py
======================
Instrumento SEPARADO e TEMPORÁRIO: descobre, com evidência real (não
suposição), em que horário a Farside costuma terminar de publicar os
números definitivos de um dia. Roda de hora em hora (ver
.github/workflows/research-etf-flows-timing.yml), só de observação —
NUNCA escreve em assets/data/ nem afeta o site.

Reaproveita fetch_html()/extract() de update_etf_flows.py (mesma
requisição, mesmo parser) — não faz nenhuma chamada extra à Farside além
da que este próprio processo já faz.

MECÂNICA:
- Para cada uma das TRACK_LAST_N_DATES datas mais recentes que a Farside
  está publicando, registra quantos ETFs estão preenchidos nesta
  execução e quantos valores mudaram desde a execução anterior da MESMA
  data (etf-flows-timing-window.json, reescrito inteiro a cada
  execução — janela ATIVA, só com datas ainda "em aberto").
- Na primeira execução em que uma data está 100% preenchida, grava
  first_complete_at_utc/_brt.
- Depois de GRADUATE_UNCHANGED_RUNS execuções seguidas sem nenhuma
  mudança (contadas a partir da 1a vez completa), a data "gradua": sai
  da janela ativa e vira 1 linha compacta permanente em
  etf-flows-timing-log.jsonl (só apêndice, nunca reescrito — por isso
  cresce de forma limitada, ~1 linha/dia). Datas que nunca completam são
  forçadas a graduar depois de MAX_TRACK_DAYS, para a janela ativa nunca
  crescer sem limite.
- Depois de ~1 mês de coleta, etf-flows-timing-log.jsonl tem ~1 linha
  por dia com o horário exato (UTC + Brasília) em que cada dia ficou
  completo pela primeira vez — a base para decidir estatisticamente
  (percentis) o horário definitivo do workflow de produção.

Este arquivo e o workflow que o chama devem ser removidos assim que essa
decisão for tomada — não são parte permanente do pipeline.
"""
import json
import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from update_etf_flows import fetch_html, extract

RESEARCH_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "research")
WINDOW_PATH = os.path.join(RESEARCH_DIR, "etf-flows-timing-window.json")
LOG_PATH = os.path.join(RESEARCH_DIR, "etf-flows-timing-log.jsonl")

TRACK_LAST_N_DATES = 10       # quantas datas recentes acompanhar por execução
GRADUATE_UNCHANGED_RUNS = 3   # execuções seguidas sem mudança após completa -> gradua
MAX_TRACK_DAYS = 21           # nunca acompanhar uma data por mais tempo que isso


def load_window():
    try:
        with open(WINDOW_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def save_window(window):
    os.makedirs(RESEARCH_DIR, exist_ok=True)
    with open(WINDOW_PATH, "w", encoding="utf-8") as f:
        json.dump(window, f, separators=(",", ":"))


def append_log(record):
    os.makedirs(RESEARCH_DIR, exist_ok=True)
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, separators=(",", ":")) + "\n")


def graduar(date, entry):
    runs_to_complete = None
    if entry["first_complete_at_utc"] is not None:
        for i, obs in enumerate(entry["observations"], start=1):
            if obs["all_filled"]:
                runs_to_complete = i
                break
    append_log({
        "date": date,
        "first_complete_at_utc": entry["first_complete_at_utc"],
        "first_complete_at_brt": entry["first_complete_at_brt"],
        "runs_to_complete": runs_to_complete,
        "changed_after_complete": entry["changed_after_complete"],
    })


def main():
    try:
        html_text = fetch_html()
        tickers, new_rows, _ = extract(html_text)
    except Exception as e:
        # Pesquisa nunca deve falhar o job nem afetar o pipeline principal.
        print(f"[pesquisa] falhou (sem impacto no site): {e}")
        return

    now_utc = datetime.now(timezone.utc)
    now_brt = now_utc.astimezone(ZoneInfo("America/Sao_Paulo"))
    total = len(tickers)

    rows_by_date = {row["date"]: row["flows"] for row in new_rows}
    recent_dates = sorted(rows_by_date)[-TRACK_LAST_N_DATES:]

    window = load_window()

    for date in recent_dates:
        flows = rows_by_date[date]
        filled = sum(1 for t in tickers if flows.get(t) is not None)
        missing = [t for t in tickers if flows.get(t) is None]
        all_filled = filled == total

        entry = window.get(date)
        if entry is None:
            entry = {
                "first_seen_at_utc": now_utc.isoformat(),
                "observations": [],
                "first_complete_at_utc": None,
                "first_complete_at_brt": None,
                "changed_after_complete": False,
                "consecutive_unchanged_since_complete": 0,
            }

        prev_flows = entry["observations"][-1]["flows"] if entry["observations"] else None
        changed_from_previous = None
        if prev_flows is not None:
            changed_from_previous = sum(1 for t in tickers if flows.get(t) != prev_flows.get(t))

        entry["observations"].append({
            "at_utc": now_utc.isoformat(),
            "filled": filled,
            "missing": missing,
            "all_filled": all_filled,
            "changed_from_previous": changed_from_previous,
            "flows": flows,
        })

        if all_filled and entry["first_complete_at_utc"] is None:
            entry["first_complete_at_utc"] = now_utc.isoformat()
            entry["first_complete_at_brt"] = now_brt.isoformat()
        elif entry["first_complete_at_utc"] is not None:
            if changed_from_previous:
                entry["changed_after_complete"] = True
                entry["consecutive_unchanged_since_complete"] = 0
            else:
                entry["consecutive_unchanged_since_complete"] += 1

        window[date] = entry

    # graduação: completas e estáveis há tempo suficiente, ou velhas
    # demais sem nunca completar
    for date in list(window.keys()):
        entry = window[date]
        primeira_vista = datetime.fromisoformat(entry["first_seen_at_utc"])
        dias_na_janela = (now_utc - primeira_vista).days
        pronta = (
            entry["first_complete_at_utc"] is not None
            and entry["consecutive_unchanged_since_complete"] >= GRADUATE_UNCHANGED_RUNS
        )
        expirou = dias_na_janela >= MAX_TRACK_DAYS
        if pronta or expirou:
            graduar(date, entry)
            del window[date]

    save_window(window)
    print(
        f"[pesquisa] {len(recent_dates)} data(s) observada(s) às "
        f"{now_utc.isoformat()} UTC ({now_brt.isoformat()} BRT). "
        f"Datas na janela ativa: {len(window)}."
    )


if __name__ == "__main__":
    main()
