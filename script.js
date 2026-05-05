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

// Função para desenhar visualização - APENAS QUADRADOS VERDES, FUNDO PRETO, SEM TEXTO "VAGÃO"
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

    // FUNDO PRETO
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let v = 0; v < vagoes; v++) {
        const offsetY = 20 + v * (alturaVagao + espacamentoVagao);

        let numero = 1;
        for (let y = 0; y < linhas; y++) {
            for (let x = 0; x < colunas; x++) {
                const px = 20 + x * tamanhoCelula;
                const py = offsetY + y * tamanhoCelula;

                // QUADRADOS VERDES
                const grad = ctx.createLinearGradient(px, py, px + tamanhoCelula, py + tamanhoCelula);
                grad.addColorStop(0, "#10b981");
                grad.addColorStop(1, "#059669");
                ctx.fillStyle = grad;
                ctx.fillRect(px, py, tamanhoCelula - 2, tamanhoCelula - 2);

                ctx.strokeStyle = "#34d399";
                ctx.lineWidth = 1.5;
                ctx.strokeRect(px, py, tamanhoCelula - 2, tamanhoCelula - 2);

                // Números brancos dentro dos quadrados
                ctx.font = `bold 28px 'Segoe UI', Arial`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#ffffff";
                ctx.shadowBlur = 4;
                ctx.shadowColor = "rgba(0,0,0,0.5)";
                ctx.fillText(numero++, px + (tamanhoCelula - 2) / 2, py + (tamanhoCelula - 2) / 2);
                ctx.shadowBlur = 0;
            }
        }
    }
}

// Evento de submit do formulário
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

    // Mostrar loading
    document.getElementById("loading").style.display = "block";
    document.getElementById("results").style.display = "none";
    document.getElementById("results-container").innerHTML = "";

    setTimeout(() => {
        const resultados = [];

        veiculosDB[tipo].forEach(veiculo => {
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

            // NOVO: identificar orientação
            const ladoCarregado = melhor === "A"
                ? "Comprimento do pallet no comprimento do veículo"
                : "Largura do pallet no comprimento do veículo";

            if (totalPallets > 0 && palletsPorVagao > 0) {
                resultados.push({
                    veiculo: veiculo.nome,
                    total: totalPallets,
                    porVagao: palletsPorVagao,
                    vagoes: veiculo.vagoes,
                    fileirasComprimento: melhor === "B" ? B_fileirasComprimento : A_fileirasComprimento,
                    fileirasLargura: melhor === "B" ? B_fileirasLargura : A_fileirasLargura,
                    camadas: camadas > 0 ? camadas : 1,
                    ladoCarregado // <-- novo campo
                });
            }
        });

        resultados.sort((a, b) => b.total - a.total);

        const container = document.getElementById("results-container");

        resultados.forEach((r, i) => {
            const canvasId = "canvas_" + Date.now() + "_" + i;
            const isBest = i === 0;

            const card = document.createElement("div");
            card.className = `result-card ${isBest ? 'best' : ''}`;

            // Texto de vagões
            const vagoesTexto = r.vagoes === 2 ? `${r.porVagao} cada` : '';

            card.innerHTML = `
                <div class="result-header">
                    <h3>${r.veiculo}</h3>
                    <div class="total-pallets">
                        <div class="number">${formatNumber(r.total)}</div>
                        <div class="label">pallets totais</div>
                    </div>
                </div>
                <div class="result-info">
                    <div class="info-badge">
                        <span>📦 Por vagão</span>
                        <span>${formatNumber(r.porVagao)} pallets</span>
                    </div>
                    <div class="info-badge">
                        <span>🚛 Vagões</span>
                        <span>${r.vagoes}</span>
                    </div>
                    <div class="info-badge">
                        <span>📚 Camadas</span>
                        <span>${r.camadas}</span>
                    </div>
                    <div class="info-badge-one">
                        <span>🔄 Orientação</span>
                        <span>${r.ladoCarregado}</span>
                    </div>
                    <div class="info-badge">
                        <span>📐 Disposição</span>
                        <span>${r.fileirasComprimento}×${r.fileirasLargura}</span>
                    </div>
                </div>
                ${vagoesTexto ? `<div style="text-align: center; color: #10b981; font-size: 14px; margin-bottom: 10px;">✨ ${vagoesTexto} ✨</div>` : ''}
                <div class="canvas-container">
                    <canvas id="${canvasId}"></canvas>
                </div>
                
            `;

            container.appendChild(card);

            const canvas = document.getElementById(canvasId);
            desenharVisual(canvas, r.fileirasComprimento, r.fileirasLargura, r.vagoes);
        });

        document.getElementById("loading").style.display = "none";
        document.getElementById("results").style.display = "block";
    }, 300);
};

// Limpar resultados
document.getElementById("clear-form").onclick = () => {
    document.getElementById("results").style.display = "none";
    document.getElementById("results-container").innerHTML = "";
};

// Carga mista
document.getElementById("mixed-load").onclick = () => {
    alert("Funcionalidade de carga mista em desenvolvimento!\nEm breve você poderá calcular cargas com diferentes tipos de pallets.");
};

// Auto-update
function autoUpdate() {
    document.getElementById("pallet-form").dispatchEvent(new Event("submit"));
}

// Adicionar listeners para auto-update
const inputs = ["length", "width", "height"];
let timeoutId;
inputs.forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(autoUpdate, 500);
    });
});

document.getElementById("vehicle-type").addEventListener("change", autoUpdate);

// Executar cálculo inicial
setTimeout(autoUpdate, 100);