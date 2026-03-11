const veiculosDB = {
    carreta: [
        { nome: "Carreta 15.4m", c: 15.40, l: 2.50, h: 2.70, vagoes: 1 },
        { nome: "Carreta 14.6m", c: 14.60, l: 2.50, h: 2.70, vagoes: 1  }
    ],
    rodotrem: [
        { nome: "Rodo-Trem 12.50m", c: 12.50, l: 2.50, h: 2.70, vagoes: 2 }
    ],
    truck: [
        { nome: "Truck 10.4m", c: 10.40, l: 2.40, h: 2.70, vagoes: 1 },
        { nome: "Truck 9.7m", c: 9.70, l: 2.40, h: 2.70, vagoes: 1 },
        { nome: "Truck 8.5m", c: 8.50, l: 2.40, h: 2.70, vagoes: 1 }
    ],
    van: [
    { nome: "VAN 3.1m", c: 3.10, l: 1.80, h: 1.90, vagoes: 1 },
	{ nome: "IVECO BAU 3.9m", c: 3.90, l: 2.10, h: 2.10, vagoes: 1 },
    ],
    container: [
        { nome: "45' HC", c: 13.50, l: 2.33, h: 2.58, vagoes: 1 },
        { nome: "40' HC", c: 12.00, l: 2.33, h: 2.58, vagoes: 1 },
        { nome: "20' DC", c: 5.88, l: 2.33, h: 2.26, vagoes: 1 }
    ]
};

function parseInputValue(value) {
    // Substitui vírgula por ponto e limita a 3 dígitos antes da vírgula/ponto
    value = value.replace(",", ".");
    const parts = value.split(".");
    if (parts[0].length > 3) parts[0] = parts[0].slice(0, 3);
    if (parts[1]) parts[1] = parts[1].slice(0, 2); // opcional: limita 2 casas decimais
    return parseFloat(parts.join("."));
}

function desenharVisual(canvas, colunas, linhas) {
    const ctx = canvas.getContext("2d");
    const containerWidth = canvas.parentElement.parentElement.clientWidth;
    const size = Math.min(containerWidth * 10.25, 1020);

    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, size, size);

    const margem = 30;
    let larguraCelula = (size - margem * 1) / colunas;
    let alturaCelula = (size - margem * 1) / linhas;

    if (colunas >= 12) {
        larguraCelula = Math.min(larguraCelula, 92);
        alturaCelula = Math.min(alturaCelula, 110);
    } else if (colunas >= 10) {
        larguraCelula = Math.min(larguraCelula, 115);
        alturaCelula = Math.min(alturaCelula, 135);
    } else {
        larguraCelula = Math.min(larguraCelula, 150);
        alturaCelula = Math.min(alturaCelula, 170);
    }

    larguraCelula = Math.max(larguraCelula, 75);
    alturaCelula = Math.max(alturaCelula, 85);

    const totalW = larguraCelula * colunas;
    const totalH = alturaCelula * linhas;
    const offsetX = (size - totalW) / 2;
    const offsetY = (size - totalH) / 2;

    let numero = 1;
    for (let x = 0; x < colunas; x++) {
        for (let y = 0; y < linhas; y++) {
            const px = offsetX + x * larguraCelula;
            const py = offsetY + y * alturaCelula;

            ctx.fillStyle = "#22c55e";
            ctx.fillRect(px + 10, py + 10, larguraCelula - 20, alturaCelula - 20);

            ctx.strokeStyle = "#166534";
            ctx.lineWidth = 7;
            ctx.strokeRect(px + 10, py + 10, larguraCelula - 20, alturaCelula - 20);

            const fontSize = Math.min(larguraCelula * 0.5, 72);
            ctx.font = `bold ${fontSize}px Inter, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.strokeStyle = "black";
            ctx.lineWidth = fontSize * 0.2;
            ctx.strokeText(numero, px + larguraCelula / 2, py + alturaCelula / 2);

            ctx.fillStyle = "white";
            ctx.fillText(numero++, px + larguraCelula / 2, py + alturaCelula / 2);
        }
    }
}

// SUBMIT DO FORMULÁRIO
document.getElementById("pallet-form").onsubmit = function(e) {
    e.preventDefault();

    // REMOVE mensagens de erro antigas
    const errorMsgOld = document.getElementById("error-msg");
    if (errorMsgOld) errorMsgOld.remove();

    const tipo = document.getElementById("vehicle-type").value;
    const comp = parseInputValue(document.getElementById("length").value);
    const larg = parseInputValue(document.getElementById("width").value);
    const alt = parseInputValue(document.getElementById("height").value);

    if (isNaN(comp) || isNaN(larg) || isNaN(alt)) {
        const form = document.getElementById("pallet-form");
        const msg = document.createElement("div");
        msg.id = "error-msg";
        msg.className = "text-red-500 font-bold text-lg col-span-2 text-center mt-4";
        msg.innerText = "Preencha todos os campos corretamente com até 3 dígitos.";
        form.appendChild(msg);
        return;
    }

    // VALIDAÇÃO: pallet maior que veículo
    const palletMaiorQueTodos = veiculosDB[tipo].every(veiculo =>
        comp > veiculo.c || larg > veiculo.l || alt > veiculo.h
    );

    if (palletMaiorQueTodos) {
        const form = document.getElementById("pallet-form");
        const msg = document.createElement("div");
        msg.id = "error-msg";
        msg.className = "text-red-500 font-bold text-lg col-span-2 text-center mt-4";
        msg.innerText = "O pallet informado é maior que as dimensões de todos os veículos disponíveis para este tipo. Reduza as dimensões para continuar.";
        form.appendChild(msg);
        return;
    }

    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("results").classList.add("hidden");
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

            if (totalPallets > 0) {
                resultados.push({
                    veiculo: veiculo.nome,
                    total: totalPallets,
                    porVagao: palletsPorVagao,
                    vagoes: veiculo.vagoes,
                    fileirasComprimento: melhor === "B" ? B_fileirasComprimento : A_fileirasComprimento,
                    fileirasLargura: melhor === "B" ? B_fileirasLargura : A_fileirasLargura,
                    orientacao: melhor === "B" ? "DE LARGURA" : "DE COMPRIDO",
                    ladoNoSentido: melhor === "B" ? larg : comp,
                    camadas
                });
            }
        });

        resultados.sort((a, b) => b.total - a.total);

        const container = document.getElementById("results-container");

        resultados.forEach((r, i) => {
            const canvasId = "canvas_" + Date.now() + "_" + i;
            const card = document.createElement("div");
            card.className = `card ${i === 0 ? "best" : ""} transform transition-all duration-500 opacity-0 translate-y-10`;

            card.innerHTML = `
                <h3 class="text-2xl font-bold mb-3">${r.veiculo}</h3>
                <p class="text-5xl font-extrabold text-green-400">${r.total}</p>
                <p class="text-gray-400 text-lg">Pallets totais</p>
                ${r.vagoes > 1 ? `
                <div class="mt-4 text-lg">
                <p>1º vagão: <span class="text-green-300 font-bold">${r.porVagao}</span></p>
                <p>2º vagão: <span class="text-green-300 font-bold">${r.porVagao}</span></p>
                </div>
                ` : ``}

                <div class="bg-blue-900/50 backdrop-blur border border-blue-700 p-4 rounded-xl text-center my-6 text-sm leading-relaxed">
                    <span class="text-yellow-300 font-bold block text-lg">Posicione o pallet ${r.orientacao}</span>
                    <span class="text-blue-300 font-bold">(${r.ladoNoSentido.toFixed(2)} m no sentido do caminhão)</span>
                </div>

                <div class="text-lg space-y-2">
                    <p>Fileiras: <span class="text-green-300 font-bold">${r.fileirasComprimento} × ${r.fileirasLargura}</span></p>
                    <p class="text-gray-400">Camadas: <span class="text-yellow-300 font-bold">${r.camadas}</span></p>
                </div>

                <div class="w-full flex justify-center mt-8">
                    <canvas id="${canvasId}" class="max-w-full h-auto rounded-lg shadow-2xl border-2 border-gray-700"></canvas>
                </div>
            `;

            container.appendChild(card);

            setTimeout(() => {
                card.classList.remove("opacity-0", "translate-y-10");
            }, i * 150);

            const canvas = document.getElementById(canvasId);
            requestAnimationFrame(() => desenharVisual(canvas, r.fileirasComprimento, r.fileirasLargura));
        });

        document.getElementById("loading").classList.add("hidden");
        document.getElementById("results").classList.remove("hidden");
    }, 400);
};

// LIMPAR RESULTADOS
document.getElementById("clear-form").onclick = () => {
    document.getElementById("results").classList.add("hidden");
    document.getElementById("results-container").innerHTML = "";

    const errorMsgOld = document.getElementById("error-msg");
    if (errorMsgOld) errorMsgOld.remove();
};

