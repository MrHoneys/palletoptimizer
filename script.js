// ── Banco de dados de veículos ──────────────────────────────────────────────
const veiculosDB = {
    carreta: [
        { nome: "Carreta 15.4m",  c: 15.40, l: 2.50, h: 2.70, vagoes: 1 },
        { nome: "Carreta 14.6m",  c: 14.60, l: 2.50, h: 2.70, vagoes: 1 }
    ],
    rodotrem: [
        { nome: "Rodo-Trem 12.50m", c: 12.50, l: 2.50, h: 2.70, vagoes: 2 }
    ],
    truck: [
        { nome: "Truck 10.4m", c: 10.40, l: 2.40, h: 2.66, vagoes: 1 },
        { nome: "Truck 9.7m",  c: 9.70,  l: 2.40, h: 2.66, vagoes: 1 },
        { nome: "Truck 8.5m",  c: 8.50,  l: 2.40, h: 2.66, vagoes: 1 }
    ],
    tres_quarto: [
        { nome: "3/4 5.5m", c: 5.5, l: 2.40, h: 2.40, vagoes: 1 }
    ],
    outros: [
        { nome: "VAN 3.1m",       c: 3.10, l: 1.80, h: 1.90, vagoes: 1 },
        { nome: "IVECO BAU 3.9m", c: 3.90, l: 2.10, h: 2.10, vagoes: 1 }
    ],
    container: [
        { nome: "Container 45' HC", c: 13.50, l: 2.33, h: 2.58, vagoes: 1 },
        { nome: "Container 40' HC", c: 12.00, l: 2.33, h: 2.58, vagoes: 1 },
        { nome: "Container 20' DC", c: 5.88,  l: 2.33, h: 2.26, vagoes: 1 }
    ]
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function verificarSeCabe(veiculo, comp, larg, alt) {
    const motivos = [];
    if (alt > veiculo.h) motivos.push("Altura");
    const cabeA = comp <= veiculo.c && larg <= veiculo.l;
    const cabeB = larg <= veiculo.c && comp <= veiculo.l;
    if (!cabeA && !cabeB) {
        if (comp > veiculo.c || larg > veiculo.c) motivos.push("Comprimento");
        if (larg > veiculo.l || comp > veiculo.l) motivos.push("Largura");
    }
    return motivos;
}

/**
 * Calcula quantos pallets cabem dada uma orientação forçada (ou otimizada).
 * forceOrientation: null = automático, "A" = comp→comprimento, "B" = larg→comprimento
 */
function calcular(veiculo, comp, larg, forceOrientation = null) {
    const A_fc = Math.floor(veiculo.c / comp);
    const A_fl = Math.floor(veiculo.l / larg);
    const totalA = A_fc * A_fl;

    const B_fc = Math.floor(veiculo.c / larg);
    const B_fl = Math.floor(veiculo.l / comp);
    const totalB = B_fc * B_fl;

    let melhor;
    if (forceOrientation) {
        melhor = forceOrientation;
    } else {
        melhor = totalB > totalA ? "B" : "A";
    }

    const fileirasC = melhor === "A" ? A_fc : B_fc;
    const fileirasL = melhor === "A" ? A_fl : B_fl;
    const porVagao   = fileirasC * fileirasL;
    const total      = porVagao * veiculo.vagoes;

    return { melhor, fileirasC, fileirasL, porVagao, total };
}

// ── Canvas ───────────────────────────────────────────────────────────────────
function desenharVisual(canvas, colunas, linhas, vagoes = 1) {
    const ctx = canvas.getContext("2d");
    const cell = 72;
    const gap  = 18;

    const wVagao = colunas * cell;
    const hVagao = linhas  * cell;

    canvas.width  = wVagao + 40;
    canvas.height = (hVagao * vagoes) + (gap * (vagoes - 1)) + 40;
    canvas.style.width  = "100%";
    canvas.style.height = "auto";

    ctx.fillStyle = "#080c12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let n = 1;
    for (let v = 0; v < vagoes; v++) {
        const oy = 20 + v * (hVagao + gap);
        for (let y = 0; y < linhas; y++) {
            for (let x = 0; x < colunas; x++) {
                const px = 20 + x * cell;
                const py = oy  + y * cell;

                // pallet body
                const g = ctx.createLinearGradient(px, py, px + cell, py + cell);
                g.addColorStop(0, "#0e4f3a");
                g.addColorStop(1, "#0a3a2b");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.roundRect(px + 1, py + 1, cell - 4, cell - 4, 4);
                ctx.fill();

                // border
                ctx.strokeStyle = "#00e5a0";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(px + 1, py + 1, cell - 4, cell - 4, 4);
                ctx.stroke();

                // number
                ctx.font = "bold 22px 'Space Mono', monospace";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#00ff9d";
                ctx.fillText(n++, px + cell / 2 - 1, py + cell / 2);
            }
        }
    }
}

// ── Render de um card ────────────────────────────────────────────────────────
function renderCard(r, comp, larg, veiculo) {
    const card = document.createElement("div");
    card.className = "result-card";

    if (r.naoCabe) {
        card.innerHTML = `
            <div class="rc-header">
                <div class="rc-name">${r.veiculo}</div>
            </div>
            <div class="no-fit">
                <div class="icon">🚫</div>
                <div class="msg">Pallet não cabe neste veículo</div>
                <div class="reason">Limitação: ${r.motivo}</div>
            </div>`;
        return card;
    }

    const camadas = Math.max(1, Math.floor(veiculo.h / r.alt));
    const orientClass  = r.melhor === "A" ? "comp" : "larg";
    const orientLabel  = r.melhor === "A"
        ? "Comprimento → comprimento do veículo"
        : "Largura → comprimento do veículo";
    const rotLabel = r.melhor === "A"
        ? "↺ Girar: usar Largura"
        : "↺ Girar: usar Comprimento";

    const canvasId = "cv_" + Date.now() + "_" + Math.random().toString(36).slice(2);

    card.innerHTML = `
        <div class="rc-header">
            <div class="rc-name">${r.veiculo}</div>
            <div class="rc-total">
                <div class="num">${fmt(r.total)}</div>
                <div class="lbl">pallets totais</div>
            </div>
        </div>
        <div class="orient-row">
            <div class="orient-badge ${orientClass}">
                <span class="dot"></span>
                <span>${orientLabel}</span>
            </div>
            <button class="btn-rotate" title="Alternar orientação do pallet">${rotLabel}</button>
        </div>
        <div class="rc-stats">
            <div class="stat">
                <div class="sv">${r.fileirasC} × ${r.fileirasL}</div>
                <div class="sk">Fileiras (C × L)</div>
            </div>
            <div class="stat">
                <div class="sv">${r.porVagao}</div>
                <div class="sk">por vagão</div>
            </div>
            <div class="stat">
                <div class="sv">${veiculo.vagoes}</div>
                <div class="sk">vagões</div>
            </div>
            <div class="stat">
                <div class="sv">${camadas}</div>
                <div class="sk">camadas</div>
            </div>
        </div>
        <div class="rc-canvas-wrap">
            <canvas id="${canvasId}"></canvas>
        </div>`;

    // desenhar canvas após inserção
    setTimeout(() => {
        const cv = document.getElementById(canvasId);
        if (cv) desenharVisual(cv, r.fileirasC, r.fileirasL, veiculo.vagoes);
    }, 0);

    // ── botão rotacionar ──
    const rotBtn = card.querySelector(".btn-rotate");
    rotBtn.addEventListener("click", () => {
        // alterna orientação
        const novaOrient = r.melhor === "A" ? "B" : "A";
        const novos = calcular(veiculo, comp, larg, novaOrient);

        // verifica se cabe na nova orientação
        const testComp = novaOrient === "A" ? comp : larg;
        const testLarg = novaOrient === "A" ? larg : comp;
        if (testComp > veiculo.c || testLarg > veiculo.l) {
            rotBtn.textContent = "⚠️ Não cabe nessa orientação";
            rotBtn.style.borderColor = "var(--red)";
            rotBtn.style.color = "var(--red)";
            return;
        }

        // atualiza o objeto r e re-renderiza o card no lugar
        r.melhor    = novos.melhor;
        r.fileirasC = novos.fileirasC;
        r.fileirasL = novos.fileirasL;
        r.porVagao  = novos.porVagao;
        r.total     = novos.total;

        const novoCard = renderCard(r, comp, larg, veiculo);
        card.replaceWith(novoCard);
    });

    return card;
}

// ── Evento principal ──────────────────────────────────────────────────────────
document.getElementById("pallet-form").onsubmit = function (e) {
    e.preventDefault();

    const tipo = document.getElementById("vehicle-type").value;
    const comp = parseFloat(document.getElementById("length").value);
    const larg = parseFloat(document.getElementById("width").value);
    const alt  = parseFloat(document.getElementById("height").value);

    if ([comp, larg, alt].some(v => isNaN(v) || v <= 0)) {
        alert("Por favor, insira valores válidos para as dimensões do pallet.");
        return;
    }

    document.getElementById("loading").style.display = "block";
    document.getElementById("results").style.display = "none";
    document.getElementById("results-container").innerHTML = "";

    setTimeout(() => {
        const resultados = [];

        veiculosDB[tipo].forEach(veiculo => {
            const motivos = verificarSeCabe(veiculo, comp, larg, alt);

            if (motivos.length > 0) {
                resultados.push({ veiculo: veiculo.nome, naoCabe: true, motivo: motivos.join(", ") });
                return;
            }

            const c = calcular(veiculo, comp, larg, null);
            resultados.push({
                veiculo:    veiculo.nome,
                naoCabe:    false,
                alt,
                melhor:     c.melhor,
                fileirasC:  c.fileirasC,
                fileirasL:  c.fileirasL,
                porVagao:   c.porVagao,
                total:      c.total
            });
        });

        const container = document.getElementById("results-container");

        resultados.forEach(r => {
            const veiculo = veiculosDB[tipo].find(v => v.nome === r.veiculo);
            container.appendChild(renderCard(r, comp, larg, veiculo || {}));
        });

        const count = resultados.filter(r => !r.naoCabe).length;
        document.getElementById("results-tag").textContent =
            `${count} veículo${count !== 1 ? "s" : ""} compatível${count !== 1 ? "s" : ""}`;

        document.getElementById("loading").style.display = "none";
        document.getElementById("results").style.display = "block";
    }, 300);
};

// limpar
document.getElementById("clear-btn").onclick = () => {
    document.getElementById("results").style.display = "none";
    document.getElementById("results-container").innerHTML = "";
};
