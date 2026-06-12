#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
divide_normas.py
================
Baixa a LC 214/2025 (texto compilado) e o Decreto 12.955/2026 do Planalto e
divide cada norma em arquivos Markdown por CAPITULO (e por ANEXO), gerando:

  reforma-tributaria/
  ├── SKILL.md                      <- indice mestre p/ Claude Code (Skills)
  ├── lcp214/
  │   ├── 00-indice.md
  │   ├── 001-disposicoes-preliminares-art1-a3.md
  │   └── ...
  └── decreto-12955/
      ├── 00-indice.md
      └── ...

Uso:
    pip install requests beautifulsoup4
    python divide_normas.py                          # baixa e processa tudo
    python divide_normas.py --so lcp214              # apenas uma norma
    python divide_normas.py --html lcp214.htm --nome lcp214   # HTML ja salvo
    python divide_normas.py --sem-revogados          # remove texto tachado

Observacao: o Planalto usa encoding windows-1252 e HTML antigo (FrontPage).
O parser trabalha sobre os paragrafos de texto, nao sobre a estrutura de tags.
"""

import argparse
import re
import sys
import unicodedata
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("Instale as dependencias: pip install requests beautifulsoup4")

# ---------------------------------------------------------------------------
# Configuracao das normas
# ---------------------------------------------------------------------------

NORMAS = {
    "lcp214": {
        "titulo": "Lei Complementar nº 214, de 16 de janeiro de 2025",
        "apelido": "LC 214/2025 (IBS, CBS e Imposto Seletivo)",
        # Texto COMPILADO: ja consolida as alteracoes (ex.: LC 227/2026)
        "url": "https://www.planalto.gov.br/ccivil_03/leis/lcp/Lcp214compilado.htm",
        "url_alternativa": "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm",
        "pasta": "lcp214",
    },
    "decreto-12955": {
        "titulo": "Decreto nº 12.955, de 2026",
        "apelido": "Decreto 12.955/2026 (Regulamento do IBS/CBS)",
        "url": "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d12955.htm",
        "url_alternativa": None,
        "pasta": "decreto-12955",
    },
}

SAIDA = Path("reforma-tributaria")

# Palavras-chave extras associadas a temas (enriquecem o indice p/ busca)
KEYWORDS_TEMATICAS = {
    "incidencia": "fato gerador, hipotese de incidencia, operacoes onerosas",
    "imunidade": "imunidades, nao incidencia, exportacao",
    "aliquota": "aliquota padrao, reducao 60%, reducao 30%, teto",
    "credito": "nao cumulatividade, apropriacao de credito, estorno",
    "split": "split payment, recolhimento na liquidacao financeira",
    "cashback": "devolucao personalizada, baixa renda, CadUnico",
    "cesta basica": "cesta basica nacional, aliquota zero, NCM, alimentos",
    "simples": "Simples Nacional, MEI, regime unico",
    "seletivo": "imposto seletivo, IS, bens prejudiciais a saude e ao meio ambiente",
    "transicao": "transicao 2026-2033, extincao PIS COFINS ICMS ISS, aliquota de teste",
    "combustive": "regime especifico, monofasia, aliquota ad rem",
    "financeir": "servicos financeiros, regime especifico, spread",
    "imobiliari": "bens imoveis, regime especifico, redutor de ajuste, locacao",
    "comite gestor": "Comite Gestor do IBS, CG-IBS, governanca",
    "zona franca": "Zona Franca de Manaus, areas de livre comercio, incentivos",
}

# ---------------------------------------------------------------------------
# Utilitarios
# ---------------------------------------------------------------------------

RE_LIVRO = re.compile(r"^LIVRO\s+[IVXLCDM]+\b", re.IGNORECASE)
RE_TITULO = re.compile(r"^T[ÍI]TULO\s+[IVXLCDM]+\b", re.IGNORECASE)
RE_CAPITULO = re.compile(r"^CAP[ÍI]TULO\s+[IVXLCDM]+", re.IGNORECASE)
RE_SECAO = re.compile(r"^(Se[çc][ãa]o|Subse[çc][ãa]o)\s+", re.IGNORECASE)
RE_ANEXO = re.compile(r"^ANEXO\s+[IVXLCDM]+", re.IGNORECASE)
RE_ART = re.compile(r"^Art\s*\.?\s*(\d+)", re.IGNORECASE)


def slug(texto: str, max_len: int = 70) -> str:
    """Converte 'DISPOSIÇÕES PRELIMINARES' -> 'disposicoes-preliminares'."""
    t = unicodedata.normalize("NFKD", texto)
    t = t.encode("ascii", "ignore").decode("ascii").lower()
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t[:max_len].rstrip("-") or "sem-titulo"


def baixar_html(url: str) -> str:
    print(f"  baixando {url}")
    r = requests.get(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; divide-normas/1.0)"},
        timeout=60,
    )
    r.raise_for_status()
    # Planalto declara/usa windows-1252; apparent_encoding resolve com seguranca
    r.encoding = r.apparent_encoding or "windows-1252"
    return r.text


def extrair_paragrafos(html: str, remover_revogados: bool) -> list[str]:
    """Retorna lista de paragrafos de texto limpos, na ordem do documento."""
    soup = BeautifulSoup(html, "html.parser")

    # Texto tachado = dispositivo revogado/alterado (redacao antiga)
    if remover_revogados:
        for tag in soup.find_all(["strike", "s", "del"]):
            tag.decompose()

    paragrafos = []
    for p in soup.find_all("p"):
        texto = p.get_text(" ", strip=True)
        texto = re.sub(r"\s+", " ", texto)
        if texto:
            paragrafos.append(texto)
    return paragrafos


def eh_titulo_de_secao_estrutural(texto: str) -> bool:
    """Heuristica: linha curta, sem 'Art.', provavelmente o nome do capitulo."""
    if RE_ART.match(texto):
        return False
    if len(texto) > 200:
        return False
    return True


# ---------------------------------------------------------------------------
# Parser principal
# ---------------------------------------------------------------------------

class Chunk:
    def __init__(self, tipo, nome, livro="", titulo="", capitulo=""):
        self.tipo = tipo            # 'capitulo' | 'anexo' | 'preambulo'
        self.nome = nome            # ex.: 'CAPITULO II - DO IBS E DA CBS ...'
        self.livro = livro
        self.titulo = titulo
        self.capitulo = capitulo
        self.linhas: list[str] = []
        self.art_min: int | None = None
        self.art_max: int | None = None

    def add(self, texto: str):
        m = RE_ART.match(texto)
        if m:
            n = int(m.group(1))
            self.art_min = n if self.art_min is None else min(self.art_min, n)
            self.art_max = n if self.art_max is None else max(self.art_max, n)
            self.linhas.append(f"\n{texto}")
        else:
            self.linhas.append(texto)

    @property
    def faixa_artigos(self) -> str:
        if self.art_min is None:
            return ""
        if self.art_min == self.art_max:
            return f"art{self.art_min}"
        return f"art{self.art_min}-a{self.art_max}"

    @property
    def faixa_legivel(self) -> str:
        if self.art_min is None:
            return "—"
        if self.art_min == self.art_max:
            return f"Art. {self.art_min}"
        return f"Arts. {self.art_min} a {self.art_max}"


def dividir_em_chunks(paragrafos: list[str]) -> list[Chunk]:
    chunks: list[Chunk] = []
    atual = Chunk("preambulo", "Preambulo e ementa")
    livro = titulo = ""
    aguardando_nome_de = None  # 'livro' | 'titulo' | 'capitulo' | 'anexo'
    rotulo_pendente = ""

    def fechar_e_abrir(novo: Chunk):
        nonlocal atual
        if atual.linhas:
            chunks.append(atual)
        atual = novo

    for texto in paragrafos:
        # 1) Completa o nome de uma estrutura aberta no paragrafo anterior
        #    (Planalto quebra 'CAPITULO I' e 'DISPOSICOES PRELIMINARES' em <p> distintos)
        if aguardando_nome_de and eh_titulo_de_secao_estrutural(texto) \
                and not (RE_LIVRO.match(texto) or RE_TITULO.match(texto)
                         or RE_CAPITULO.match(texto) or RE_ANEXO.match(texto)
                         or RE_SECAO.match(texto)):
            nome_completo = f"{rotulo_pendente} — {texto}"
            if aguardando_nome_de == "livro":
                livro = nome_completo
            elif aguardando_nome_de == "titulo":
                titulo = nome_completo
            elif aguardando_nome_de == "capitulo":
                fechar_e_abrir(Chunk("capitulo", nome_completo, livro, titulo, nome_completo))
            elif aguardando_nome_de == "anexo":
                fechar_e_abrir(Chunk("anexo", nome_completo))
            aguardando_nome_de = None
            continue
        aguardando_nome_de = None

        if RE_LIVRO.match(texto):
            livro, titulo = texto, ""
            aguardando_nome_de, rotulo_pendente = "livro", texto
            continue
        if RE_TITULO.match(texto):
            titulo = texto
            aguardando_nome_de, rotulo_pendente = "titulo", texto
            # Titulo sem capitulos vira chunk proprio quando artigos chegarem
            fechar_e_abrir(Chunk("capitulo", texto, livro, titulo, ""))
            continue
        if RE_CAPITULO.match(texto):
            aguardando_nome_de, rotulo_pendente = "capitulo", texto
            fechar_e_abrir(Chunk("capitulo", texto, livro, titulo, texto))
            continue
        if RE_ANEXO.match(texto):
            aguardando_nome_de, rotulo_pendente = "anexo", texto
            fechar_e_abrir(Chunk("anexo", texto))
            continue
        if RE_SECAO.match(texto):
            atual.linhas.append(f"\n## {texto}")
            continue

        atual.add(texto)

    if atual.linhas:
        chunks.append(atual)
    return chunks


# ---------------------------------------------------------------------------
# Escrita dos arquivos
# ---------------------------------------------------------------------------

def keywords_para(nome: str) -> str:
    nome_l = slug(nome, 200).replace("-", " ")
    achadas = [v for k, v in KEYWORDS_TEMATICAS.items() if k in nome_l]
    return "; ".join(achadas)


def escrever_norma(chave: str, chunks: list[Chunk]) -> list[dict]:
    cfg = NORMAS[chave]
    pasta = SAIDA / cfg["pasta"]
    pasta.mkdir(parents=True, exist_ok=True)
    indice = []

    for i, ch in enumerate(chunks, start=1):
        partes_nome = [f"{i:03d}", slug(ch.nome)]
        if ch.faixa_artigos:
            partes_nome.append(ch.faixa_artigos)
        arquivo = "-".join(partes_nome) + ".md"

        front = [
            "---",
            f'norma: "{cfg["apelido"]}"',
            f'livro: "{ch.livro}"' if ch.livro else None,
            f'titulo: "{ch.titulo}"' if ch.titulo else None,
            f'capitulo: "{ch.nome}"',
            f"artigos: {ch.faixa_legivel}",
            f'keywords: "{keywords_para(ch.nome)}"',
            "---",
            "",
            f"# {ch.nome}",
            "",
        ]
        corpo = "\n".join(x for x in front if x is not None)
        corpo += "\n".join(ch.linhas) + "\n"
        (pasta / arquivo).write_text(corpo, encoding="utf-8")

        indice.append({
            "arquivo": arquivo,
            "nome": ch.nome,
            "artigos": ch.faixa_legivel,
            "keywords": keywords_para(ch.nome),
            "contexto": " / ".join(x for x in (ch.livro, ch.titulo) if x),
        })

    # 00-indice.md da norma
    linhas = [
        f"# Índice — {cfg['titulo']}",
        "",
        f"Fonte: {cfg['url']}",
        "",
        "| Arquivo | Capítulo/Anexo | Artigos | Contexto | Keywords |",
        "|---|---|---|---|---|",
    ]
    for e in indice:
        linhas.append(
            f"| {e['arquivo']} | {e['nome']} | {e['artigos']} | {e['contexto']} | {e['keywords']} |"
        )
    (pasta / "00-indice.md").write_text("\n".join(linhas) + "\n", encoding="utf-8")
    print(f"  -> {len(indice)} arquivos em {pasta}/")
    return indice


def escrever_skill(indices: dict[str, list[dict]]):
    linhas = [
        "---",
        "name: reforma-tributaria",
        "description: >",
        "  Base de consulta da Reforma Tributária do consumo (IBS/CBS/IS).",
        "  Contém a LC 214/2025 e o Decreto 12.955/2026 divididos por capítulo.",
        "  Use sempre que precisar de regras de incidência, alíquotas, créditos,",
        "  split payment, cashback, regimes específicos, Simples Nacional,",
        "  cesta básica, Imposto Seletivo ou regras de transição 2026-2033.",
        "---",
        "",
        "# Skill: Reforma Tributária (IBS / CBS / IS)",
        "",
        "## Como usar esta base",
        "",
        "1. NUNCA leia uma norma inteira. Comece pelo índice da norma",
        "   (`lcp214/00-indice.md` ou `decreto-12955/00-indice.md`).",
        "2. Localize o capítulo pelo tema/keywords e abra SOMENTE aquele arquivo.",
        "3. A LC 214 define as regras materiais; o Decreto 12.955 regulamenta a",
        "   operacionalização. Para dúvida de cálculo/procedimento, confira os dois.",
        "4. Cite sempre o artigo exato (ex.: 'Art. 9º, §1º, LC 214/2025') na resposta.",
        "5. Anexos contêm listas de NCM/NBS (cesta básica, reduções) — são a fonte",
        "   para classificar produtos no simulador.",
        "",
        "## Mapa rápido de temas",
        "",
    ]
    for chave, idx in indices.items():
        cfg = NORMAS[chave]
        linhas.append(f"### {cfg['apelido']} — pasta `{cfg['pasta']}/`")
        linhas.append("")
        for e in idx:
            kw = f" — _{e['keywords']}_" if e["keywords"] else ""
            linhas.append(f"- `{e['arquivo']}` — {e['nome']} ({e['artigos']}){kw}")
        linhas.append("")

    (SAIDA / "SKILL.md").write_text("\n".join(linhas) + "\n", encoding="utf-8")
    print(f"  -> SKILL.md gerado em {SAIDA}/")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--so", choices=list(NORMAS), help="processa apenas uma norma")
    ap.add_argument("--html", help="usar arquivo HTML local em vez de baixar")
    ap.add_argument("--nome", choices=list(NORMAS),
                    help="qual norma o --html representa")
    ap.add_argument("--sem-revogados", action="store_true",
                    help="remove dispositivos tachados (redação antiga)")
    args = ap.parse_args()

    SAIDA.mkdir(exist_ok=True)
    indices = {}

    if args.html:
        if not args.nome:
            sys.exit("Com --html informe tambem --nome (lcp214 ou decreto-12955)")
        html = Path(args.html).read_text(encoding="windows-1252", errors="replace")
        alvos = {args.nome: html}
    else:
        alvos = {}
        for chave, cfg in NORMAS.items():
            if args.so and chave != args.so:
                continue
            try:
                alvos[chave] = baixar_html(cfg["url"])
            except Exception as e:
                if cfg["url_alternativa"]:
                    print(f"  falhou ({e}); tentando URL alternativa…")
                    alvos[chave] = baixar_html(cfg["url_alternativa"])
                else:
                    raise

    for chave, html in alvos.items():
        print(f"\nProcessando {NORMAS[chave]['titulo']}")
        paragrafos = extrair_paragrafos(html, args.sem_revogados)
        print(f"  {len(paragrafos)} parágrafos extraídos")
        chunks = dividir_em_chunks(paragrafos)
        indices[chave] = escrever_norma(chave, chunks)

    if indices:
        escrever_skill(indices)
    print("\nConcluído. Copie a pasta 'reforma-tributaria' para "
          ".claude/skills/ do seu projeto.")


if __name__ == "__main__":
    main()