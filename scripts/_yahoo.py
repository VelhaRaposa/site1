"""
_yahoo.py — helper compartilhado para buscar séries históricas na API de
gráfico não-oficial do Yahoo Finance.

Usado por update_ibovespa_history.py, update_sp500_history.py e
update_gold_history.py. Não é uma API documentada nem garantida pelo
Yahoo — mesma categoria de risco que a API pública da CoinGecko já
usada para o histórico de Bitcoin: gratuita, sem chave, mas pode mudar
sem aviso. Se algum desses três scripts começar a falhar, é o primeiro
lugar a checar.
"""
import json
import urllib.request
from datetime import datetime, timezone


def fetch_yahoo_range(ticker, from_ts, to_ts):
    """Retorna uma lista de tuplas (data 'AAAA-MM-DD', preço de fechamento)
    para o ticker informado, entre from_ts e to_ts (timestamps unix)."""
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
        f"?period1={from_ts}&period2={to_ts}&interval=1d"
    )
    req = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; caiogare-site-databot/1.0)",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    result = payload.get("chart", {}).get("result")
    if not result:
        raise ValueError(f"Resposta sem dados para o ticker {ticker}")

    r = result[0]
    timestamps = r.get("timestamp") or []
    quote = r.get("indicators", {}).get("quote", [{}])[0]
    closes = quote.get("close") or []

    out = []
    for ts, close in zip(timestamps, closes):
        if close is None:
            continue
        d = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
        out.append((d, float(close)))
    return out
