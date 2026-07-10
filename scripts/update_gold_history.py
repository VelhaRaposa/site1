#!/usr/bin/env python3
"""
update_gold_history.py
========================
Atualiza assets/data/gold-history.json com o preço do ouro em reais
por grama (BRL/g), já convertido — o navegador não faz nenhuma conta
de câmbio ou de unidade, só lê "price" como qualquer outro ativo.

Fonte: contrato futuro de ouro do COMEX (ticker GC=F, cotado em USD por
onça-troy), via API de gráfico não-oficial do Yahoo Finance (ver
scripts/_yahoo.py), convertido usando assets/data/usdbrl-history.json.

NOTA: a arquitetura original previa a LBMA (referência oficial mundial
do preço do ouro) como fonte. Na prática, não foi possível confirmar o
endpoint exato de dados históricos da LBMA a partir deste ambiente de
desenvolvimento (sem acesso de rede aqui). Optou-se pelo Yahoo Finance
por ser o mesmo mecanismo já usado para Ibovespa e S&P 500 — reduz a
três o número de fontes distintas, e todas com o mesmo perfil de risco
já aceito para o Bitcoin (CoinGecko).

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
DATA_PATH = os.path.join(BASE_DIR, "gold-history.json")
FX_PATH = os.path.join(BASE_DIR, "usdbrl-history.json")
START_DATE = date(2015, 1, 1)
TICKER = "GC=F"
GRAMS_PER_TROY_OUNCE = 31.1034768


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
        rows = fetch_yahoo_range(TICKER, from_ts, to_ts)
    except Exception as e:
        print(f"Falha ao buscar dados novos do ouro: {e}")
        sys.exit(1)

    added = 0
    for d, usd_per_oz in rows:
        if d in existing_dates or d >= today_str:
            continue
        rate = fx_map.get(d, fx_fallback)
        brl_per_gram = (usd_per_oz * rate) / GRAMS_PER_TROY_OUNCE
        data.append({"date": d, "price": round(brl_per_gram, 4)})
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
