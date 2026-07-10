#!/usr/bin/env python3
"""
update_ibovespa_history.py
============================
Atualiza assets/data/ibovespa-history.json com o valor de fechamento
diário do índice Ibovespa.

Fonte: API de gráfico não-oficial do Yahoo Finance, ticker ^BVSP — ver
scripts/_yahoo.py. Já em pontos de índice, sem necessidade de câmbio
(o Ibovespa é um índice brasileiro).

NOTA: a arquitetura original previa a B3 (fonte oficial) como origem
deste dado. Na prática, a B3 distribui a série histórica como arquivo
para download em vez de uma API JSON estável, e não foi possível
confirmar o formato exato a partir deste ambiente de desenvolvimento
(sem acesso de rede a b3.com.br aqui). Optou-se pelo Yahoo Finance por
ser o mesmo mecanismo já usado para S&P 500 e Ouro — um único padrão de
integração para os três, mais fácil de manter. Risco de manutenção
nessa fonte: mesma categoria da CoinGecko usada para Bitcoin.
"""
import json
import os
import sys
from datetime import datetime, timedelta, timezone, date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _yahoo import fetch_yahoo_range  # noqa: E402

DATA_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "assets", "data", "ibovespa-history.json"
)
START_DATE = date(2015, 1, 1)
TICKER = "^BVSP"


def load_data():
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


def save_data(data):
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))


def main():
    data = load_data()
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
        rows = fetch_yahoo_range(TICKER, from_ts, to_ts)
    except Exception as e:
        print(f"Falha ao buscar dados novos do Ibovespa: {e}")
        sys.exit(1)

    added = 0
    for d, close in rows:
        if d in existing_dates or d >= today_str:
            continue
        data.append({"date": d, "price": round(close, 2)})
        existing_dates.add(d)
        added += 1

    if added == 0:
        print("Nenhum dia novo retornado pela fonte.")
        return

    data.sort(key=lambda row: row["date"])
    save_data(data)
    print(f"OK: adicionados {added} dia(s). Novo intervalo final: {data[-1]['date']}")


if __name__ == "__main__":
    main()
