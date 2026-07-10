#!/usr/bin/env python3
"""
update_sp500_history.py
=========================
Atualiza assets/data/sp500-history.json com o valor do S&P 500 já
convertido para reais (BRL) — o navegador não faz nenhuma conversão de
câmbio, só lê "price" como qualquer outro ativo.

Fonte primária: ^SP500TR (S&P 500 Total Return, com dividendos
reinvestidos), via API de gráfico não-oficial do Yahoo Finance (ver
scripts/_yahoo.py). Se essa série não estiver disponível, cai
automaticamente para ^GSPC (índice de preço, sem dividendos) — esse
"plano B" foi combinado e aprovado antes desta implementação.

Depende de assets/data/usdbrl-history.json já atualizado — rode
update_usdbrl_history.py antes deste script (o workflow do GitHub
Actions já respeita essa ordem).
"""
import json
import os
import sys
from datetime import datetime, timedelta, timezone, date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _yahoo import fetch_yahoo_range  # noqa: E402

BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "data")
DATA_PATH = os.path.join(BASE_DIR, "sp500-history.json")
FX_PATH = os.path.join(BASE_DIR, "usdbrl-history.json")
START_DATE = date(2015, 1, 1)
TICKER_PRIMARY = "^SP500TR"
TICKER_FALLBACK = "^GSPC"


def load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


def save_data(data):
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))


def build_fx_map(fx_rows):
    fx_map = {}
    last = None
    for row in fx_rows:
        last = row["price"]
        fx_map[row["date"]] = last
    return fx_map, last


def fetch_with_fallback(from_ts, to_ts):
    try:
        rows = fetch_yahoo_range(TICKER_PRIMARY, from_ts, to_ts)
        if rows:
            return rows, TICKER_PRIMARY
    except Exception as e:
        print(f"Aviso: falha em {TICKER_PRIMARY} ({e}), tentando {TICKER_FALLBACK}.")
    rows = fetch_yahoo_range(TICKER_FALLBACK, from_ts, to_ts)
    return rows, TICKER_FALLBACK


def main():
    data = load_json(DATA_PATH)
    fx_rows = load_json(FX_PATH)
    if not fx_rows:
        print("assets/data/usdbrl-history.json está vazio — rode update_usdbrl_history.py primeiro.")
        sys.exit(1)
    fx_map, fx_fallback = build_fx_map(fx_rows)

    existing_dates = {row["date"] for row in data}
    today = datetime.now(timezone.utc).date()
    today_str = today.strftime("%Y-%m-%d")

    from_dt = date.fromisoformat(data[-1]["date"]) + timedelta(days=1) if data else START_DATE

    if from_dt > today - timedelta(days=1):
        print(f"Já está atualizado (última data: {data[-1]['date'] if data else '—'}).")
        return

    from_ts = int(datetime.combine(from_dt, datetime.min.time(), tzinfo=timezone.utc).timestamp())
    to_ts = int(datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc).timestamp())

    try:
        rows, ticker_used = fetch_with_fallback(from_ts, to_ts)
    except Exception as e:
        print(f"Falha ao buscar dados novos do S&P 500: {e}")
        sys.exit(1)

    added = 0
    for d, close_usd in rows:
        if d in existing_dates or d >= today_str:
            continue
        rate = fx_map.get(d, fx_fallback)
        brl = close_usd * rate
        data.append({"date": d, "price": round(brl, 4)})
        existing_dates.add(d)
        added += 1

    if added == 0:
        print("Nenhum dia novo retornado pela fonte.")
        return

    data.sort(key=lambda row: row["date"])
    save_data(data)
    print(f"OK ({ticker_used}): adicionados {added} dia(s). Novo intervalo final: {data[-1]['date']}")


if __name__ == "__main__":
    main()
