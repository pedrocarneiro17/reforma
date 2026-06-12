# -*- coding: utf-8 -*-
"""
Gera o Guia Técnico do ReformaCalc (PDF) — público: profissionais de contabilidade.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem, HRFlowable, NextPageTemplate
)

# ─── Paleta ──────────────────────────────────────────────────────────────────
INK        = colors.HexColor("#2B2722")
INK_SOFT   = colors.HexColor("#5F5A52")
GOLD       = colors.HexColor("#B6912E")
GOLD_SOFT  = colors.HexColor("#F4E8C8")
GREEN      = colors.HexColor("#2F7D57")
GREEN_SOFT = colors.HexColor("#E7F4ED")
RED        = colors.HexColor("#B42318")
RED_SOFT   = colors.HexColor("#FDECEC")
BLUE       = colors.HexColor("#315C8C")
BLUE_SOFT  = colors.HexColor("#EAF1FA")
CREAM      = colors.HexColor("#FBFAF7")
SUBTLE     = colors.HexColor("#F4F0E8")
BORDER     = colors.HexColor("#E4DDD2")

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm
CONTENT_W = PAGE_W - 2 * MARGIN

styles = getSampleStyleSheet()
def S(name, **kw):
    base = kw.pop("parent", styles["Normal"])
    return ParagraphStyle(name, parent=base, **kw)

st_h1     = S("h1", fontName="Helvetica-Bold", fontSize=16, leading=20, textColor=INK, spaceBefore=6, spaceAfter=8)
st_h2     = S("h2", fontName="Helvetica-Bold", fontSize=12, leading=15, textColor=GOLD, spaceBefore=10, spaceAfter=4)
st_body   = S("body", fontName="Helvetica", fontSize=10, leading=14.5, textColor=INK, alignment=TA_JUSTIFY, spaceAfter=6)
st_small  = S("small", fontName="Helvetica", fontSize=8.5, leading=12, textColor=INK_SOFT)
st_li     = S("li", fontName="Helvetica", fontSize=9.7, leading=13.5, textColor=INK)
st_note   = S("note", fontName="Helvetica", fontSize=9.3, leading=13.5, textColor=INK)
st_note_b = S("note_b", fontName="Helvetica-Bold", fontSize=9.3, leading=13.5, textColor=INK)
st_th     = S("th", fontName="Helvetica-Bold", fontSize=8.6, leading=11, textColor=colors.white)
st_td     = S("td", fontName="Helvetica", fontSize=8.6, leading=11.5, textColor=INK)
st_tdc    = S("tdc", parent=st_td, alignment=TA_CENTER)
st_tdb    = S("tdb", fontName="Helvetica-Bold", fontSize=8.6, leading=11.5, textColor=INK)

def nota(titulo, texto, tom="info"):
    cor_bg = {"info": BLUE_SOFT, "ok": GREEN_SOFT, "alerta": RED_SOFT, "gold": GOLD_SOFT}[tom]
    cor_br = {"info": BLUE, "ok": GREEN, "alerta": RED, "gold": GOLD}[tom]
    inner = []
    if titulo:
        inner.append(Paragraph(titulo, S("nb", parent=st_note_b, textColor=cor_br)))
    inner.append(Paragraph(texto, st_note))
    t = Table([[inner]], colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), cor_bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, cor_br),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 9), ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return t

def bullets(itens):
    return ListFlowable(
        [ListItem(Paragraph(t, st_li), leftIndent=6, value="•") for t in itens],
        bulletType="bullet", bulletColor=GOLD, leftIndent=14, bulletFontSize=9,
        spaceBefore=2, spaceAfter=6)

def tabela(header, rows, col_widths, aligns=None):
    head = [Paragraph(h, st_th) for h in header]
    data = [head]
    for r in rows:
        row = []
        for j, c in enumerate(r):
            stl = st_td
            if aligns and aligns[j] == "c": stl = st_tdc
            if aligns and aligns[j] == "b": stl = st_tdb
            row.append(Paragraph(str(c), stl))
        data.append(row)
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, BORDER),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style.append(("BACKGROUND", (0, i), (-1, i), CREAM))
    t.setStyle(TableStyle(style))
    return t

def on_page(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(BORDER); canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 14 * mm, PAGE_W - MARGIN, 14 * mm)
    canvas.setFont("Helvetica", 8); canvas.setFillColor(INK_SOFT)
    canvas.drawString(MARGIN, 9.5 * mm, "ReformaCalc · Guia Técnico para Contabilidades")
    canvas.drawRightString(PAGE_W - MARGIN, 9.5 * mm, "Página %d" % doc.page)
    canvas.setFont("Helvetica", 7)
    canvas.drawCentredString(PAGE_W / 2, 5.5 * mm,
        "Material técnico de apoio — não substitui apuração profissional. Base: LC 214/2025 · LC 227/2026.")
    canvas.restoreState()

def on_cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(INK); canvas.rect(0, PAGE_H - 70 * mm, PAGE_W, 70 * mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD); canvas.rect(0, PAGE_H - 72 * mm, PAGE_W, 2 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white); canvas.setFont("Helvetica-Bold", 30)
    canvas.drawString(MARGIN, PAGE_H - 36 * mm, "ReformaCalc")
    canvas.setFillColor(GOLD_SOFT); canvas.setFont("Helvetica", 13)
    canvas.drawString(MARGIN, PAGE_H - 45 * mm, "Guia Técnico para Profissionais de Contabilidade")
    canvas.setFillColor(colors.HexColor("#CFC8BB")); canvas.setFont("Helvetica", 10)
    canvas.drawString(MARGIN, PAGE_H - 53 * mm, "Simulador de Impacto da Reforma Tributária — IVA Dual (CBS + IBS)")
    canvas.setStrokeColor(BORDER); canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 14 * mm, PAGE_W - MARGIN, 14 * mm)
    canvas.setFont("Helvetica", 7); canvas.setFillColor(INK_SOFT)
    canvas.drawCentredString(PAGE_W / 2, 9.5 * mm,
        "Material técnico de apoio — não substitui apuração profissional. Base: LC 214/2025 · LC 227/2026.")
    canvas.restoreState()

story = []

# ── Capa ──
story.append(Spacer(1, 80 * mm))
story.append(Paragraph(
    "Documentação técnica do motor de cálculo do ReformaCalc, destinada ao contador que vai operar e validar a "
    "ferramenta. Cobre o escopo, os cenários tratados, as alíquotas aplicadas por regime e — ponto central — as "
    "premissas e estimativas adotadas onde a legislação ainda não fixou valores.", st_body))
story.append(Spacer(1, 7 * mm))
story.append(nota("Como usar este documento no teste da ferramenta",
    "Confronte os resultados do simulador com suas apurações. As divergências esperadas concentram-se nas "
    "premissas da seção 11 (alíquota de referência, eficiência de crédito, margens, ISS municipal). Reporte cada "
    "diferença apontando a premissa de origem.", "gold"))
story.append(Spacer(1, 5 * mm))
story.append(Paragraph("Versão: junho/2026  ·  Base legal: LC 214/2025 · LC 227/2026 · LC 123/2006 · Lei 15.270/2025 · MP 1.206/2024", st_small))
story.append(PageBreak())

# ── Sumário ──
story.append(Paragraph("Conteúdo", st_h1))
story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))
for s in [
    "1.   Escopo e finalidade",
    "2.   Operação da ferramenta",
    "3.   Casos e cenários abordados",
    "4.   Alíquotas por regime (referência)",
    "5.   Mecânica de apuração: entradas, saídas e créditos",
    "6.   Situações societárias: sócios em várias empresas e holdings",
    "7.   Transição 2026–2033 (linha do tempo)",
    "8.   Leitura do relatório e notas de modelagem",
    "9.   Exemplo prático (estudo de caso)",
    "10. Checklist de dados do cliente",
    "11. Premissas e limitações",
    "12. Avisos",
]:
    story.append(Paragraph(s, S("sum", parent=st_li, fontSize=11, leading=19)))
story.append(PageBreak())

# ── 1. Escopo ──
story.append(Paragraph("1. Escopo e finalidade", st_h1))
story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))
story.append(Paragraph(
    "O ReformaCalc compara a carga tributária no regime atual com a carga estimada no IVA Dual (CBS + IBS), "
    "aplicando as reduções de alíquota por setor, os regimes específicos e diferenciados, e a regra de transição "
    "2026–2033. Destina-se a apoiar o diagnóstico e a conversa com o cliente, não a substituir a escrituração.", st_body))
story.append(Paragraph("Abrange", st_h2))
story.append(bullets([
    "Carga atual em Simples Nacional, MEI, Lucro Presumido, Lucro Real e Profissional Liberal (PF).",
    "Carga no IVA Dual com não-cumulatividade sobre insumos e despesas creditáveis.",
    "Régua de transição (redução de ICMS/ISS 2029–2032; extinção em 2033).",
    "Split payment (custo do float), grupo societário no Simples, holding patrimonial e pró-labore.",
]))
story.append(Paragraph("Não abrange", st_h2))
story.append(bullets([
    "Imposto Seletivo (alíquota não fixada em lei) — apenas sinalizado.",
    "Alíquotas ad rem de combustíveis (regime monofásico, valores não publicados).",
    "Benefícios regionais/setoriais não listados na seção 3.",
]))
story.append(PageBreak())

# ── 2. Operação ──
story.append(Paragraph("2. Operação da ferramenta", st_h1))
story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))
story.append(bullets([
    "<b>Perfil:</b> regime atual, setor (define a faixa de redução do IVA), UF (habilita ICMS débito × crédito no LP/LR) e perfil de clientes (B2C / B2B / Misto).",
    "<b>Dados financeiros:</b> faturamento e insumos mensais médios, ou histórico real de 12 meses (apura alíquota efetiva observada).",
    "<b>Módulos:</b> Grupo Societário (Simples/MEI), Holding Patrimonial e Pró-labore de sócios.",
    "<b>Campos condicionais</b> (surgem conforme regime/setor): gorjeta, créditos presumidos rural/transporte, bens de capital (Art. 108), despesas creditáveis adicionais, % de medicamentos, regime automotivo e tipo de bem da ZFM.",
]))
story.append(nota("Perfil de clientes é parâmetro, não cosmético",
    "Em B2B/Misto o IVA destacado é creditável pelo adquirente — o relatório trata o valor como repasse, não "
    "como acréscimo de carga da operação. Em B2C o tributo é ônus final. A escolha altera o resumo executivo e a "
    "análise do Simples Híbrido.", "info"))
story.append(PageBreak())

# ── 3. Casos e cenários ──
story.append(Paragraph("3. Casos e cenários abordados", st_h1))
story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))

story.append(Paragraph("Regimes de origem", st_h2))
story.append(bullets([
    "Simples Nacional (Anexos I–V, inclusive atividade mista §4-A e Fator R §5-J).",
    "MEI · Lucro Presumido · Lucro Real · Profissional Liberal (PF) · Produtor Rural.",
]))

story.append(Paragraph("Setores por faixa de redução do IVA (exemplos)", st_h2))
story.append(bullets([
    "<b>Alíquota cheia:</b> comércio, indústria, TI/SaaS, consultoria, marketing, beleza, segurança, logística.",
    "<b>Redução 30%</b> (Art. 127): advocacia, contabilidade, engenharia/arquitetura, veterinária.",
    "<b>Redução 40%</b> (Arts. 275/281/284–289): restaurantes, hotelaria, parques, transporte coletivo intermunicipal/aéreo regional, agências de turismo.",
    "<b>Redução 50%</b> (Art. 261): construção e incorporação; corretagem/administração imobiliária.",
    "<b>Redução 60%</b> (Art. 128): educação, saúde, dispositivos médicos, agro in natura, insumos agropecuários, academias (Art. 141).",
    "<b>Redução 70%</b> (Art. 261 §ún.): locação de imóveis.",
    "<b>Alíquota zero</b> (Arts. 125/143–156/285): cesta básica, hortifruti/frutas/ovos, medicamentos do Art. 146, transporte urbano, livros, radiodifusão.",
]))

story.append(Paragraph("Regimes específicos e diferenciados", st_h2))
story.append(bullets([
    "Serviços financeiros e seguros · SAF · cooperativas · combustíveis (monofásico) · revenda de bens usados (base sobre margem) · apostas (GGR).",
    "Zona Franca de Manaus (créditos presumidos) e regime automotivo (crédito presumido CBS).",
]))

story.append(Paragraph("Cesta mista por composição informada", st_h2))
story.append(bullets([
    "<b>Supermercados:</b> a alíquota efetiva é ponderada pela composição da cesta — % em alíquota zero (cesta básica/hortifruti), % em redução 60% (Anexos VII/VIII) e o restante na alíquota cheia.",
    "<b>Farmácias:</b> a alíquota efetiva pondera o % da receita em medicamentos (redução 60% — Art. 133) e o restante na alíquota cheia.",
]))

story.append(Paragraph("Situações especiais e alertas", st_h2))
story.append(bullets([
    "Grupo societário (somatório de receita — incisos IV e V do Art. 3º §4º LC 123/2006); holding (redutor social residencial, limiar de contribuinte da PF).",
    "Crédito de bens de capital (Art. 108), alíquota zero a não-contribuintes (Art. 110), exportador habilitável (Art. 82), reequilíbrio de contratos administrativos (Arts. 373–377), cashback ao consumidor (Art. 118) e Imposto Seletivo (Anexo XVII).",
]))
story.append(PageBreak())

# ── 4. Alíquotas por regime ──
story.append(Paragraph("4. Alíquotas por regime (referência)", st_h1))
story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))

story.append(Paragraph("4.1 Simples Nacional — alíquotas nominais por anexo (LC 123/2006, vigência 01/2018)", st_h2))
story.append(tabela(
    ["Faixa (RBT12)", "Anexo I", "Anexo II", "Anexo III", "Anexo IV", "Anexo V"],
    [
        ["1ª — até 180k", "4,00%", "4,50%", "6,00%", "4,50%", "15,50%"],
        ["2ª — até 360k", "7,30%", "7,80%", "11,20%", "9,00%", "18,00%"],
        ["3ª — até 720k", "9,50%", "10,00%", "13,50%", "10,20%", "19,50%"],
        ["4ª — até 1,8M", "10,70%", "11,20%", "16,00%", "14,00%", "20,50%"],
        ["5ª — até 3,6M", "14,30%", "14,70%", "21,00%", "22,00%", "23,00%"],
        ["6ª — até 4,8M", "19,00%", "30,00%", "33,00%", "33,00%", "30,50%"],
    ],
    [30 * mm] + [(CONTENT_W - 30 * mm) / 5] * 5,
    aligns=["b", "c", "c", "c", "c", "c"]))
story.append(Spacer(1, 3))
story.append(Paragraph(
    "Alíquota efetiva = (RBT12 × nominal - PD) / RBT12, com as parcelas a deduzir (PD) de cada faixa. A parcela de "
    "CBS dentro do DAS (PIS+COFINS), usada para o crédito ao adquirente, varia de ~14% a ~34% conforme anexo/faixa.", st_small))

story.append(Paragraph("4.2 Lucro Presumido — alíquota efetiva sobre a receita", st_h2))
story.append(tabela(
    ["Tipo", "Composição", "Efetiva"],
    [
        ["Serviços", "IRPJ 4,80 + CSLL 2,88 + PIS/COFINS 3,65 + ISS 3,00", "14,33%"],
        ["Comércio", "IRPJ 1,20 + CSLL 1,08 + PIS/COFINS 3,65 + ICMS 12,00", "17,93%"],
        ["Indústria", "IRPJ 1,20 + CSLL 1,08 + PIS/COFINS 3,65 + ICMS 12,00 + IPI 5,00", "22,93%"],
    ],
    [24 * mm, CONTENT_W - 24 * mm - 20 * mm, 20 * mm],
    aligns=["b", "td", "c"]))
story.append(Paragraph(
    "Presunções: IRPJ 32% (serviços) / 8% (com.-ind.); CSLL 32% / 12%. PIS/COFINS cumulativo 0,65%+3,00%. IRPJ "
    "adicional de 10% sobre o lucro presumido mensal acima de R$ 20.000 é somado à parte. ICMS 12% e ISS 3% são "
    "médias — informe a UF para apuração de ICMS por débito × crédito.", st_small))

story.append(Paragraph("4.3 Lucro Real — alíquota efetiva estimada", st_h2))
story.append(tabela(
    ["Tipo", "Premissa", "Efetiva"],
    [
        ["Serviços", "PIS/COFINS 9,25% líq. crédito 25% + ISS 3% + IRPJ/CSLL s/ margem 10%", "12,34%"],
        ["Comércio", "PIS/COFINS líq. + ICMS 17% líq. crédito 40% + IRPJ/CSLL s/ margem 5%", "15,10%"],
        ["Indústria", "PIS/COFINS líq. + ICMS 12% + IPI 5% líq. crédito 60% + IRPJ/CSLL s/ margem 5%", "11,70%"],
    ],
    [24 * mm, CONTENT_W - 24 * mm - 20 * mm, 20 * mm],
    aligns=["b", "td", "c"]))
story.append(Paragraph("Estimativas de alta variância — dependem da margem real e da eficiência de crédito da empresa.", st_small))
story.append(PageBreak())

story.append(Paragraph("4.4 IVA Dual — faixas de redução (sobre alíquota padrão estimada de 26,5%)", st_h2))
story.append(tabela(
    ["Redução", "Alíq. efetiva", "Base legal", "Exemplos"],
    [
        ["0% (cheia)", "26,50%", "—", "comércio, indústria, TI, consultoria"],
        ["30%", "18,55%", "Art. 127", "advocacia, contabilidade, engenharia"],
        ["40%", "15,90%", "Arts. 275/281/286/289", "restaurantes, hotelaria, transporte, agências de turismo"],
        ["50%", "13,25%", "Art. 261 caput", "construção, incorporação, imobiliário"],
        ["60%", "10,60%", "Art. 128 / 141", "educação, saúde, agro in natura, academias"],
        ["70%", "7,95%", "Art. 261 §ún.", "locação de imóveis"],
        ["100% (zero)", "0,00%", "Arts. 125/143–156", "cesta básica, hortifruti, medic. Art. 146, livros"],
    ],
    [20 * mm, 20 * mm, 32 * mm, CONTENT_W - 72 * mm],
    aligns=["b", "c", "td", "td"]))

story.append(Paragraph("4.5 Regimes específicos e diferenciados", st_h2))
story.append(tabela(
    ["Regime", "Tratamento no IVA", "Base legal"],
    [
        ["Serviços financeiros / seguros", "IBS+CBS 10,85% (2027–28), crescente até 2033", "Art. 233 (LC 227)"],
        ["SAF", "CBS de 1% sobre a receita", "Arts. 292–296"],
        ["Cooperativas (atos c/ associado)", "alíquota zero", "Arts. 271–272"],
        ["Combustíveis", "monofásico, alíquota ad rem (não fixada)", "Arts. 172–180"],
        ["Revenda de bens usados (de PF)", "base = margem (venda - compra)", "Art. 171"],
        ["Apostas (bets)", "base = GGR (receita líq. de prêmios)", "Arts. 244–250"],
        ["ZFM — indústria incentivada", "créd. presumido IBS 55/75/90,25/100% + CBS 2%", "Art. 450"],
        ["Regime automotivo", "créd. presumido CBS 11,60/10/8,70%", "Arts. 309–316"],
    ],
    [42 * mm, CONTENT_W - 42 * mm - 28 * mm, 28 * mm],
    aligns=["b", "td", "td"]))

story.append(Paragraph("4.6 Holding patrimonial e pessoa física", st_h2))
story.append(tabela(
    ["Item", "Valor / regra"],
    [
        ["IBS/CBS sobre locação", "7,95% (redução 70% — Art. 261 §ún.)"],
        ["Redutor social — locação residencial", "R$ 600/mês por imóvel (Art. 260)"],
        ["Holding em Lucro Presumido", "11,33% (IRPJ 4,80 + CSLL 2,88 + PIS/COFINS 3,65)"],
        ["Holding em Lucro Real (estimado)", "20,79% (margem 50%, créditos PIS/COFINS 5%)"],
        ["PF locadora vira contribuinte", "> 3 imóveis E receita > R$ 240k/ano (Art. 251 §1º)"],
        ["IRPF (PF / pró-labore)", "tabela MP 1.206/2024 + isenção até R$ 5.000 (Lei 15.270/2025)"],
        ["INSS autônomo / patronal", "20% até teto R$ 8.157,41 / 20% sobre pró-labore"],
        ["Crédito presumido rural / transporte autônomo", "10,6% (Art. 168) / 15,9% (Art. 169)"],
    ],
    [62 * mm, CONTENT_W - 62 * mm],
    aligns=["b", "td"]))
story.append(PageBreak())

# ── 5. Mecânica de apuração ──
story.append(Paragraph("5. Mecânica de apuração: entradas, saídas e créditos", st_h1))
story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))
story.append(Paragraph(
    "O IVA Dual é não-cumulativo: o imposto devido é o débito sobre as saídas menos o crédito sobre as entradas. "
    "O simulador reproduz essa mecânica de forma agregada (médias mensais ou totais de 12 meses), não documento a "
    "documento.", st_body))
story.append(tabela(
    ["Campo informado", "Natureza", "Efeito na apuração"],
    [
        ["Faturamento", "Saída (venda)", "Gera débito = base × alíquota do setor"],
        ["Insumos / compras", "Entrada", "Gera crédito = insumos × alíquota de crédito"],
        ["Bens de capital (Art. 108)", "Entrada", "Crédito integral e imediato no mês da compra"],
        ["Despesas creditáveis adicionais", "Entrada", "Crédito sobre o que o PIS/COFINS não credita hoje"],
        ["Exportações", "Saída imune", "Débito zero, com manutenção do crédito das entradas"],
        ["% fornecedores no Simples", "Ajuste de crédito", "Reduz o crédito da entrada (fornecedor remete menos)"],
    ],
    [42 * mm, 26 * mm, CONTENT_W - 68 * mm], aligns=["b", "td", "td"]))
story.append(Spacer(1, 3))
story.append(Paragraph(
    "Imposto líquido = débito - (créditos de insumos + bens de capital + despesas + presumidos). O resultado "
    "aparece na seção <b>Detalhamento da Apuração</b> e no card <b>Créditos e Débitos de IVA</b>.", st_body))
story.append(nota("Limites de granularidade",
    "Entradas e saídas são agregadas, não escrituradas nota a nota. As compras entram num campo único de insumos "
    "(além dos campos dedicados de capital e despesas), sem separar revenda / uso-consumo / imobilizado. Não há "
    "carregamento de saldo credor acumulado entre meses.", "info"))
story.append(PageBreak())

# ── 6. Situações societárias ──
story.append(Paragraph("6. Situações societárias: sócios em várias empresas e holdings", st_h1))
story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))

story.append(Paragraph("6.1 Sócio com participação em mais de uma empresa (Simples)", st_h2))
story.append(Paragraph(
    "Para o limite do Simples (R$ 4,8M/ano), o faturamento de empresas do mesmo sócio é somado quando se "
    "configuram os gatilhos do Art. 3º §4º da LC 123/2006. Excedido o limite global, todas as empresas do grupo "
    "são desenquadradas.", st_body))
story.append(tabela(
    ["Gatilho", "Condição", "Soma a receita?"],
    [
        ["Inciso IV", "Sócio com MAIS de 10% do capital de outra empresa", "Sim, acima de 10%"],
        ["Inciso V", "Sócio administrador de outra PJ com fins lucrativos", "Sim, sem piso de 10%"],
        ["Abaixo dos gatilhos", "Participação de até 10% e não administrador", "Não"],
    ],
    [24 * mm, CONTENT_W - 24 * mm - 32 * mm, 32 * mm], aligns=["b", "td", "td"]))
story.append(Paragraph(
    "No módulo <b>Grupo Societário</b>, informe cada empresa, a participação (%) e marque se o sócio é "
    "administrador (aciona o inciso V mesmo abaixo de 10%). A barra mostra o consumo do limite e sinaliza o "
    "desenquadramento.", st_body))

story.append(Paragraph("6.2 Holding patrimonial", st_h2))
story.append(Paragraph(
    "Compara manter os imóveis em uma PJ (holding) versus na pessoa física, sobre a renda de locação.", st_body))
story.append(tabela(
    ["Item", "Tratamento no simulador"],
    [
        ["IBS/CBS sobre locação", "7,95% (redução de 70% — Art. 261 §ún.)"],
        ["Redutor social residencial", "Deduz R$ 600/mês por imóvel residencial da base (Art. 260)"],
        ["Uso gratuito ao sócio", "Tributado só se a holding tomou crédito na aquisição (LC 227 — 'sem crédito, sem tributo')"],
        ["Tributos correntes (holding)", "LP 11,33% ou LR 20,79% (estimado) sobre a receita de aluguel"],
        ["PF locadora contribuinte", "Se > 3 imóveis E receita > R$ 240k/ano, a PF também paga IBS/CBS na comparação (Art. 251 §1º)"],
        ["Comparativo", "Carga total da holding × IRPF da PF (carnê-leão), com economia mensal/anual"],
    ],
    [44 * mm, CONTENT_W - 44 * mm], aligns=["b", "td"]))
story.append(nota("Por que o limiar da PF importa",
    "Para carteiras grandes (acima de 3 imóveis e R$ 240k/ano), a PF também é contribuinte de IBS/CBS — então o "
    "diferencial entre holding e PF passa a ser apenas IRPJ/CSLL/PIS/COFINS × IRPF, não o IVA, que incide nos dois.", "info"))
story.append(PageBreak())

# ── 7. Transição ──
story.append(Paragraph("7. Transição 2026–2033 (linha do tempo)", st_h1))
story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))
story.append(tabela(
    ["Ano", "O que muda"],
    [
        ["2026", "Período de teste: CBS 0,9% + IBS 0,1%, compensáveis com PIS/COFINS. Carga praticamente inalterada."],
        ["2027", "CBS entra em alíquota cheia e extingue PIS/COFINS. IS passa a incidir. IBS ainda em fase inicial."],
        ["2028", "Manutenção; IBS em fase inicial. ICMS/ISS ainda integrais."],
        ["2029", "IBS começa a subir; ICMS e ISS reduzidos em 10%."],
        ["2030", "ICMS e ISS reduzidos em 20%."],
        ["2031", "ICMS e ISS reduzidos em 30%."],
        ["2032", "ICMS e ISS reduzidos em 40%."],
        ["2033", "ICMS e ISS extintos. IVA Dual pleno (CBS + IBS)."],
    ],
    [16 * mm, CONTENT_W - 16 * mm], aligns=["b", "td"]))
story.append(Spacer(1, 3))
story.append(Paragraph(
    "O simulador trata 2026–2028 como troca aproximadamente neutra (CBS no lugar de PIS/COFINS) e aplica a redução de "
    "ICMS/ISS de 2029 a 2032 (Arts. 501 e 508). O cronograma com os valores do caso aparece na seção "
    "<b>Cronograma de Transição</b> do relatório.", st_body))
story.append(PageBreak())

# ── 8. Leitura ──
story.append(Paragraph("8. Leitura do relatório e notas de modelagem", st_h1))
story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))
story.append(tabela(
    ["Seção", "Conteúdo"],
    [
        ["Resumo executivo", "Síntese factual do caso (variação, repasse B2B, isenção, etc.)."],
        ["Carga Atual / IVA Dual / Variação", "Cards de topo; o selo 'estimativa' marca a alíquota de 26,5%."],
        ["Detalhamento da apuração", "Faturamento, imposto bruto, créditos e imposto líquido."],
        ["Créditos e débitos de IVA", "Aproveitamento de crédito sobre insumos."],
        ["Comparador de regimes", "Mesma empresa em todos os regimes, lado a lado."],
        ["Simulador de crescimento", "Sensibilidade da carga ao faturamento."],
        ["Split payment", "Custo do float = imposto retido × CDI × (30/365)."],
        ["Cronograma de transição", "Carga 2026–2033 (redução ICMS/ISS Arts. 501/508)."],
    ],
    [48 * mm, CONTENT_W - 48 * mm], aligns=["b", "td"]))
story.append(Spacer(1, 4))
story.append(nota("Notas de modelagem relevantes",
    "(1) Em B2B o aumento de imposto destacado é apresentado como repasse creditável, não como custo. "
    "(2) O custo do split payment considera float de ~30 dias (intervalo entre recebimento e recolhimento), não o "
    "ano cheio. (3) O RBT12 do Simples usa o faturamento informado anualizado, não os 12 meses históricos.", "info"))
story.append(PageBreak())

# ── 9. Exemplo prático ──
story.append(Paragraph("9. Exemplo prático (estudo de caso)", st_h1))
story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))
story.append(Paragraph(
    "Empresa de TI no <b>Lucro Presumido</b>, vendas <b>B2B</b>, faturamento de R$ 100.000/mês e insumos "
    "creditáveis de R$ 20.000/mês. Setor sem redução (alíquota cheia).", st_body))
story.append(tabela(
    ["Item", "Regime atual (LP)", "IVA Dual"],
    [
        ["Faturamento", "R$ 100.000", "R$ 100.000"],
        ["Imposto bruto", "R$ 15.530 (14,33% + adicional IRPJ)", "R$ 26.500 (26,5%)"],
        ["Crédito sobre insumos", "—", "- R$ 5.300 (26,5% × 20.000)"],
        ["Imposto líquido", "R$ 15.530", "R$ 21.200"],
        ["Alíquota efetiva", "15,53%", "21,20%"],
    ],
    [42 * mm, (CONTENT_W - 42 * mm) / 2, (CONTENT_W - 42 * mm) / 2],
    aligns=["b", "c", "c"]))
story.append(Spacer(1, 3))
story.append(nota("Leitura correta do caso (B2B)",
    "A variação aparente é de +R$ 5.670/mês, mas como as vendas são B2B o IVA destacado (R$ 26.500) é creditado "
    "integralmente pelos clientes — é repasse na cadeia, não custo da operação. O ganho relevante aqui é a "
    "não-cumulatividade (crédito de R$ 5.300 sobre insumos, que o LP não aproveita). O foco do diagnóstico passa a "
    "ser preço e fluxo de caixa (split payment), não 'aumento de carga'.", "ok"))
story.append(PageBreak())

# ── 10. Checklist ──
story.append(Paragraph("10. Checklist de dados do cliente", st_h1))
story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))
story.append(Paragraph("Reúna estes dados antes de simular, para reduzir retrabalho e divergências:", st_body))
story.append(bullets([
    "<b>Regime atual</b>; se Simples, anexo(s) e folha de pagamento (Fator R).",
    "<b>Faturamento</b> mensal médio ou histórico de 12 meses; <b>perfil de clientes</b> (B2C / B2B / Misto).",
    "<b>Compras/insumos</b> mensais e <b>% de fornecedores no Simples</b>.",
    "<b>UF</b> (para o ICMS no LP/LR) e <b>setor</b> de atuação.",
    "Para <b>cesta mista</b> (supermercado/farmácia): composição (% zero / 60% / cheia ou % de medicamentos).",
    "<b>Investimento em bens de capital</b> e <b>despesas creditáveis adicionais</b> (aluguel, energia, TI, etc.).",
    "<b>Exportações</b> e <b>vendas ao governo</b>, se houver.",
    "<b>Sócios:</b> participações em outras empresas e se é administrador (Simples).",
    "<b>Holding:</b> imóveis, receita de aluguel, uso (residencial/comercial), destinatário e se houve crédito na aquisição.",
    "<b>Pró-labore</b> dos sócios (LP/LR).",
]))
story.append(PageBreak())

# ── 11. Premissas ──
story.append(Paragraph("11. Premissas e limitações", st_h1))
story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))
story.append(Paragraph(
    "Onde a legislação ainda não fixou valores, o simulador adota estimativas, todas listadas abaixo. É nesses "
    "pontos que diferenças em relação a uma apuração real devem ser interpretadas.", st_body))
story.append(tabela(
    ["Premissa", "Valor usado", "Natureza"],
    [
        ["Alíquota padrão IVA (CBS+IBS)", "26,5%", "Estimativa de mercado — não fixada em lei"],
        ["Partilha IBS/CBS (ZFM)", "~17,7% IBS / 8,8% CBS", "Estimativa da divisão dentro dos 26,5%"],
        ["LP comércio/indústria", "ICMS 12% fixo", "Simplificação; informe UF p/ débito × crédito"],
        ["Lucro Real", "margens 10% / 5% + eficiência de crédito", "Estimativa de alta variância"],
        ["Float do split payment", "30 dias", "Premissa (recebimento a recolhimento)"],
        ["Revenda de bens usados", "margem de 30%", "Premissa — ajustável à operação"],
        ["Holding em Lucro Real", "margem 50% · créditos PIS/COFINS 5%", "Premissa"],
        ["RBT12 do Simples", "faturamento anualizado", "Proxy — não os 12 meses reais"],
        ["ISS médio (serviços)", "3%", "Varia 2%–5% por município"],
        ["Crédito de fornecedor Simples", "~5,88%", "Média ponderada estimada"],
        ["Composição da cesta (mercado/farmácia)", "informada pelo usuário", "Sem a composição, usa alíquota cheia"],
        ["Limites R$ 600 / 240k / 4,8M", "valor nominal", "A lei corrige por IPCA; usa-se o nominal"],
        ["Imposto Seletivo", "não calculado", "Alíquota não fixada em lei"],
    ],
    [50 * mm, 46 * mm, CONTENT_W - 96 * mm],
    aligns=["b", "td", "td"]))
story.append(Spacer(1, 5))
story.append(nota("Reporte de divergências",
    "Para cada diferença encontrada no teste, indique a premissa de origem e, se possível, o valor que você "
    "consideraria mais adequado (margem, ISS local, eficiência de crédito). Esses parâmetros podem ser ajustados.", "ok"))
story.append(PageBreak())

# ── 12. Avisos ──
story.append(Paragraph("12. Avisos", st_h1))
story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=8))
story.append(bullets([
    "<b>Sistema destinado a simulações.</b> Caso encontre divergências nos resultados, entre em contato para que sejam verificadas.",
    "Base legal: LC 214/2025, LC 227/2026, LC 123/2006, Lei 15.270/2025 e MP 1.206/2024, vigentes na data deste guia; a regulamentação segue em evolução.",
    "A alíquota padrão de 26,5% <b>não é fixada</b> pela LC 214/2025. A lei estabelece que as alíquotas de referência da CBS e do IBS serão fixadas por <b>Resolução do Senado Federal</b>, a partir de cálculos do TCU, calibradas para manter a carga tributária total (princípio da neutralidade). Os 26,5% são a projeção do Ministério da Fazenda de onde essa alíquota deve se situar.",
]))
story.append(Spacer(1, 5))
story.append(nota("Posicionamento",
    "Use o ReformaCalc para dimensionar direção e ordem de grandeza do impacto da reforma na carteira de clientes "
    "e priorizar quem precisa de atenção. Os números definitivos dependem de regulamentação ainda em curso.", "gold"))

doc = BaseDocTemplate(
    "Guia-ReformaCalc.pdf", pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN, topMargin=MARGIN, bottomMargin=20 * mm,
    title="ReformaCalc — Guia Técnico para Contabilidades", author="ReformaCalc")
frame = Frame(MARGIN, 20 * mm, CONTENT_W, PAGE_H - MARGIN - 20 * mm, id="main")
doc.addPageTemplates([
    PageTemplate(id="cover", frames=[frame], onPage=on_cover),
    PageTemplate(id="content", frames=[frame], onPage=on_page),
])
doc.build([NextPageTemplate("content")] + story)
print("OK: Guia-ReformaCalc.pdf gerado")
