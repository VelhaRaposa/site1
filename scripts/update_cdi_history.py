#!/usr/bin/env python3
"""
update_cdi_history.py
=======================
Atualiza assets/data/cdi-history.json com um índice acumulado do CDI
(base 1000 na primeira data disponível). Cada dia novo multiplica o
índice do dia anterior pela taxa diária do CDI — o mesmo jeito que o
mercado financeiro calcula rentabilidade acumulada. O "price" salvo
aqui não é uma cotação em reais, é um número-índice — mas funciona
exatamente como o preço do Bitcoin no cálculo do comparador: o que
importa é a proporção entre dois pontos no tempo, não o valor absoluto.

Fonte: Banco Central do Brasil, SGS, série 12 — CDI diário (% ao dia).
API pública e oficial, sem necessidade de chave.

Sabe fazer backfill completo (arquivo vazio/inexistente) e atualização
incremental (arquivo já populado), do mesmo jeito que
update_usdbrl_history.py.
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone, date

DATA_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "assets", "data", "cdi-history.json"
)
START_DATE = date(2015, 1, 1)
SERIE = 12
BASE_INDEX = 1000.0
MAX_CHUNK_DAYS = 3649


def load_data():
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


def save_data(data):
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))


def fetch_chunk(d1, d2):
    url = (
        f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{SERIE}/dados"
        f"?formato=json&dataInicial={d1.strftime('%d/%m/%Y')}&dataFinal={d2.strftime('%d/%m/%Y')}"
    )
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    out = []
    for row in payload:
        d = datetime.strptime(row["data"], "%d/%m/%Y").strftime("%Y-%m-%d")
        taxa = float(str(row["valor"]).replace(",", "."))
        out.append((d, taxa))
    return out


def main():
    data = load_data()
    existing_dates = {row["date"] for row in data}
    today = datetime.now(timezone.utc).date()
    today_str = today.strftime("%Y-%m-%d")

    from_dt = date.fromisoformat(data[-1]["date"]) + timedelta(days=1) if data else START_DATE
    index = data[-1]["price"] if data else BASE_INDEX

    if from_dt > today - timedelta(days=1):
        print(f"Já está atualizado (última data: {data[-1]['date'] if data else '—'}).")
        return

    added = 0
    cursor = from_dt
    while cursor <= today:
        chunk_end = min(cursor + timedelta(days=MAX_CHUNK_DAYS), today)
        try:
            rows = fetch_chunk(cursor, chunk_end)
        except Exception as e:
            print(f"Falha ao buscar {cursor}–{chunk_end}: {e}")
            sys.exit(1)
        for d, taxa in rows:
            if d in existing_dates or d >= today_str:
                continue
            index *= (1 + taxa / 100)
            data.append({"date": d, "price": round(index, 6)})
            existing_dates.add(d)
            added += 1
        cursor = chunk_end + timedelta(days=1)

    if added == 0:
        print("Nenhum dia novo retornado pela fonte.")
        return

    data.sort(key=lambda row: row["date"])
    save_data(data)
    print(f"OK: adicionados {added} dia(s). Novo intervalo final: {data[-1]['date']}")


if __name__ == "__main__":
    main()
