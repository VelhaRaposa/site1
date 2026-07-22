#!/usr/bin/env python3
"""
test_farside_fetch.py — TEMPORÁRIO, só para diagnóstico.
==========================================================
Estritamente investigativo: sem proxy, sem serviço terceiro, sem IP
residencial, sem tentativa de burlar proteção. Só duas requisições
diretas (urllib puro) para farside.co.uk, comparando uma requisição
mínima com uma requisição com headers completos de navegador comum —
e mostrando tudo: status, headers de resposta, corpo, redirecionamentos.

Não salva nada, não commita nada. Este arquivo e o workflow
.github/workflows/test-farside-fetch.yml são temporários — remover
assim que o diagnóstico responder a pergunta.
"""
import gzip
import sys
import urllib.error
import urllib.request

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from update_etf_flows import URL, extract

BASELINE_HEADERS = {
    "User-Agent": "Mozilla/5.0",
}

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
}


class LoggingRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Só registra cada redirecionamento seguido — o comportamento de
    seguir continua sendo o padrão do urllib, nada customizado aqui."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        print(f"   redirecionamento: {code} -> {newurl}")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def decode_body(raw_bytes, resp_headers):
    encoding = (resp_headers.get("Content-Encoding") or "").lower()
    if encoding == "gzip":
        try:
            raw_bytes = gzip.decompress(raw_bytes)
        except Exception as e:
            print(f"   [aviso] falha ao descomprimir gzip: {e}")
    return raw_bytes.decode("utf-8", errors="replace")


def do_request(label, headers):
    print(f"\n{'=' * 70}\n{label}\n{'=' * 70}")
    print("Headers enviados:")
    for k, v in headers.items():
        print(f"  {k}: {v}")

    opener = urllib.request.build_opener(LoggingRedirectHandler)
    req = urllib.request.Request(URL, headers=headers)

    try:
        with opener.open(req, timeout=30) as resp:
            status = resp.status
            final_url = resp.geturl()
            resp_headers = dict(resp.headers.items())
            raw = resp.read()
    except urllib.error.HTTPError as e:
        status = e.code
        final_url = e.geturl() if hasattr(e, "geturl") else URL
        resp_headers = dict(e.headers.items()) if e.headers else {}
        raw = e.read()
    except Exception as e:
        print(f"[FALHA DE CONEXÃO — nem chegou a ter status HTTP] {type(e).__name__}: {e}")
        return {"status": None, "headers": {}, "body": ""}

    body = decode_body(raw, resp_headers)

    print(f"\nStatus HTTP: {status}")
    print(f"URL final: {final_url}")
    print("Headers de resposta:")
    for k, v in resp_headers.items():
        print(f"  {k}: {v}")
    print(f"Tamanho do corpo: {len(body)} caracteres")
    print("Corpo (primeiros 2000 caracteres):")
    print("-" * 70)
    print(body[:2000])
    print("-" * 70)

    return {"status": status, "headers": resp_headers, "body": body}


def main():
    baseline = do_request("REQUISIÇÃO 1 — headers mínimos (mesma do teste anterior)", BASELINE_HEADERS)
    browser = do_request("REQUISIÇÃO 2 — headers completos de navegador comum", BROWSER_HEADERS)

    print(f"\n{'=' * 70}\nDIFERENÇA ENTRE AS DUAS REQUISIÇÕES\n{'=' * 70}")
    print(f"Status baseline: {baseline['status']}  |  Status com headers de navegador: {browser['status']}")
    novos_headers_enviados = set(BROWSER_HEADERS) - set(BASELINE_HEADERS)
    print(f"Headers adicionados na segunda requisição: {sorted(novos_headers_enviados)}")

    server_header = browser["headers"].get("Server") or baseline["headers"].get("Server")
    if server_header:
        print(f"Header 'Server' da resposta: {server_header}")

    print(f"\n{'=' * 70}\nCLASSIFICAÇÃO\n{'=' * 70}")
    if browser["status"] == 200:
        print("Categoria A — coletável: a requisição com headers de navegador comum funcionou (200).")
        print("Testando o parser real contra esse corpo...")
        try:
            tickers, daily_rows, totals = extract(browser["body"])
            print(f"Tickers: {tickers}")
            print(f"Linhas de data: {len(daily_rows)}")
            print(f"Totais: {totals}")
        except Exception as e:
            print(f"[parser falhou mesmo com 200] {type(e).__name__}: {e}")
    elif browser["status"] in (403, 401, 429) and baseline["status"] in (403, 401, 429):
        print(
            "Categoria C — inadequada: tanto a requisição mínima quanto a com headers "
            "completos de navegador foram bloqueadas do mesmo jeito. Isso é evidência de "
            "bloqueio por IP/política (datacenter do GitHub Actions), não falta de header — "
            "mudar headers não resolveria sem burlar a proteção, o que está fora de escopo."
        )
    else:
        print(
            "Categoria B — instável: resultado diferente entre as duas tentativas "
            f"({baseline['status']} vs {browser['status']}). Precisaria de mais execuções "
            "em horários diferentes para confirmar se é intermitente."
        )


if __name__ == "__main__":
    main()
