// Banco de dados de veículos
const veiculosDB = {
    carreta: [
        { nome: "Carreta 15.4m", c: 15.40, l: 2.50, h: 2.70, vagoes: 1 },
        { nome: "Carreta 14.6m", c: 14.60, l: 2.50, h: 2.70, vagoes: 1 }
    ],
    rodotrem: [
        { nome: "Rodo-Trem 12.50m", c: 12.50, l: 2.50, h: 2.70, vagoes: 2 }
    ],
    truck: [
        { nome: "Truck 10.4m", c: 10.40, l: 2.40, h: 2.66, vagoes: 1 },
        { nome: "Truck 9.7m", c: 9.70, l: 2.40, h: 2.66, vagoes: 1 },
        { nome: "Truck 8.5m", c: 8.50, l: 2.40, h: 2.66, vagoes: 1 }
    ],
    tres_quarto: [
        { nome: "3/4 5.5m", c: 5.5, l: 2.40, h: 2.40, vagoes: 1 },
    ],
    outros: [
        { nome: "VAN 3.1m", c: 3.10, l: 1.80, h: 1.90, vagoes: 1 },
        { nome: "IVECO BAU 3.9m", c: 3.90, l: 2.10, h: 2.10, vagoes: 1 },
    ],
    container: [
        { nome: "Container 45' HC", c: 13.50, l: 2.33, h: 2.58, vagoes: 1 },
        { nome: "Container 40' HC", c: 12.00, l: 2.33, h: 2.58, vagoes: 1 },
        { nome: "Container 20' DC", c: 5.88, l: 2.33, h: 2.26, vagoes: 1 }
    ]
};

// Função para formatar números
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ✅ NOVA FUNÇÃO
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

// Função visual (igual)
function desenharVisual(canvas, colunas, linhas, vagoes = 1) {
    const ctx = canvas.getContext("2d");
    const tamanhoCelula = 80;
    const espacamentoVagao = 20;

    const larguraVagao = colunas * tamanhoCelula;
    const alturaVagao = linhas * tamanhoCelula;

    const larguraTotal = larguraVagao + 40;
    const alturaTotal = (alturaVagao * vagoes) + (espacamentoVagao * (vagoes - 1)) + 40;

    canvas.width = larguraTotal;
    canvas.height = alturaTotal;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let v = 0; v < vagoes; v++) {
        const offsetY = 20 + v * (alturaVagao + espacamentoVagao);

        let numero = 1;
        for (let y = 0; y < linhas; y++) {
            for (let x = 0; x < colunas; x++) {
                const px = 20 + x * tamanhoCelula;
                const py = offsetY + y * tamanhoCelula;

                const grad = ctx.createLinearGradient(px, py, px + tamanhoCelula, py + tamanhoCelula);
                grad.addColorStop(0, "#10b981");
                grad.addColorStop(1, "#059669");

                ctx.fillStyle = grad;
                ctx.fillRect(px, py, tamanhoCelula - 2, tamanhoCelula - 2);

                ctx.strokeStyle = "#34d399";
                ctx.lineWidth = 1.5;
                ctx.strokeRect(px, py, tamanhoCelula - 2, tamanhoCelula - 2);

                ctx.font = `bold 28px 'Segoe UI', Arial`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#ffffff";
                ctx.fillText(numero++, px + 39, py + 39);
            }
        }
    }
}

// Evento principal
document.getElementById("pallet-form").onsubmit = function (e) {
    e.preventDefault();

    const tipo = document.getElementById("vehicle-type").value;
    const comp = parseFloat(document.getElementById("length").value);
    const larg = parseFloat(document.getElementById("width").value);
    const alt = parseFloat(document.getElementById("height").value);

    if (isNaN(comp) || isNaN(larg) || isNaN(alt) || comp <= 0 || larg <= 0 || alt <= 0) {
        alert("Por favor, insira valores válidos para as dimensões do pallet.");
        return;
    }

    document.getElementById("loading").style.display = "block";
    document.getElementById("results").style.display = "none";
    document.getElementById("results-container").innerHTML = "";

    setTimeout(() => {
        const resultados = [];

        veiculosDB[tipo].forEach(veiculo => {

            // ✅ VALIDAÇÃO AQUI
            const motivos = verificarSeCabe(veiculo, comp, larg, alt);

            if (motivos.length > 0) {
                resultados.push({
                    veiculo: veiculo.nome,
                    naoCabe: true,
                    motivo: motivos.join(", ")
                });
                return;
            }

            const A_fileirasComprimento = Math.floor(veiculo.c / comp);
            const A_fileirasLargura = Math.floor(veiculo.l / larg);
            const totalA = A_fileirasComprimento * A_fileirasLargura;

            const B_fileirasComprimento = Math.floor(veiculo.c / larg);
            const B_fileirasLargura = Math.floor(veiculo.l / comp);
            const totalB = B_fileirasComprimento * B_fileirasLargura;

            const melhor = totalB > totalA ? "B" : "A";
            const palletsPorVagao = Math.max(totalA, totalB);
            const totalPallets = palletsPorVagao * veiculo.vagoes;
            const camadas = Math.floor(veiculo.h / alt);

            const ladoCarregado = melhor === "A"
                ? "Comprimento do pallet no comprimento do veículo"
                : "Largura do pallet no comprimento do veículo";

            resultados.push({
                veiculo: veiculo.nome,
                naoCabe: false,
                total: totalPallets,
                porVagao: palletsPorVagao,
                vagoes: veiculo.vagoes,
                fileirasComprimento: melhor === "B" ? B_fileirasComprimento : A_fileirasComprimento,
                fileirasLargura: melhor === "B" ? B_fileirasLargura : A_fileirasLargura,
                camadas: camadas > 0 ? camadas : 1,
                ladoCarregado
            });
        });

        const container = document.getElementById("results-container");

        resultados.forEach((r, i) => {

            const card = document.createElement("div");
            card.className = "result-card";

            // ✅ NÃO CABE
            if (r.naoCabe) {
                card.innerHTML = `
                    <div class="result-header">
                        <h3>${r.veiculo}</h3>
                    </div>
                    <div style="color:#ef4444; text-align:center; padding:20px;">
                        ❌ Não cabe<br>
                        Motivo: ${r.motivo}
                    </div>
                `;
                container.appendChild(card);
                return;
            }

            const canvasId = "canvas_" + Date.now() + "_" + i;

            card.innerHTML = `
                <div class="result-header">
                    <h3>${r.veiculo}</h3>
                    <div class="total-pallets">
                        <div class="number">${formatNumber(r.total)}</div>
                        <div class="label">pallets totais</div>
                    </div>
                </div>
                <div class="canvas-container">
                    <canvas id="${canvasId}"></canvas>
                </div>
            `;

            container.appendChild(card);

            desenharVisual(
                document.getElementById(canvasId),
                r.fileirasComprimento,
                r.fileirasLargura,
                r.vagoes
            );
        });

        document.getElementById("loading").style.display = "none";
        document.getElementById("results").style.display = "block";
    }, 300);
};