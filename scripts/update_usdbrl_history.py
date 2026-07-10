#!/usr/bin/env python3
"""
update_usdbrl_history.py
=========================
Atualiza assets/data/usdbrl-history.json — cotação diária do dólar
(PTAX venda) em reais. Este arquivo não é usado diretamente pela
calculadora no navegador: é um insumo interno usado pelos scripts
update_sp500_history.py e update_gold_history.py para converter
preços cotados em dólar para reais no momento da atualização (o
navegador nunca faz essa conta).

Fonte: Banco Central do Brasil, Sistema Gerenciador de Séries Temporais
(SGS), série 1 — Dólar americano (venda), PTAX diário. API pública e
oficial, sem necessidade de chave.

Ao contrário do script de Bitcoin (que sempre parte de um arquivo já
populado), este script sabe fazer os dois: se o arquivo estiver vazio
ou não existir, busca todo o histórico desde START_DATE; se já tiver
dados, busca só os dias que faltam.
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone, date

DATA_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "assets", "data", "usdbrl-history.json"
)
START_DATE = date(2015, 1, 1)
SERIE = 1
MAX_CHUNK_DAYS = 3649  # a API do Bacen recusa intervalos maiores que 10 anos


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
        valor = float(str(row["valor"]).replace(",", "."))
        out.append((d, valor))
    return out


def main():
    data = load_data()
    existing_dates = {row["date"] for row in data}
    today = datetime.now(timezone.utc).date()
    today_str = today.strftime("%Y-%m-%d")

    from_dt = date.fromisoformat(data[-1]["date"]) + timedelta(days=1) if data else START_DATE

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
        for d, valor in rows:
            if d in existing_dates or d >= today_str:
                continue
            data.append({"date": d, "price": round(valor, 4)})
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
