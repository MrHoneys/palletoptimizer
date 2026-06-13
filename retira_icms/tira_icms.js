// Tabela completa de alíquotas ICMS interestaduais (Origem -> Destino)
// Baseada na tabela de referência (CONFAZ). Valores em %.
// RJ possui +2% de FECP em operações destinadas ao RJ (já considerado separadamente abaixo).

const estados = [
    "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MT","MS","MG",
    "PA","PB","PR","PE","PI","RN","RS","RJ","RO","RR","SC","SP","SE","TO"
];

// Alíquota interna (diagonal, origem === destino)
const aliquotaInterna = {
    AC:19, AL:19, AM:20, AP:18, BA:20.5, CE:20, DF:20, ES:17, GO:19,
    MA:22, MT:17, MS:17, MG:18, PA:19, PB:20, PR:19.5, PE:20.5, PI:22.5,
    RN:18, RS:17, RJ:20, RO:19.5, RR:20, SC:17, SP:18, SE:19, TO:20
};

// Alíquota padrão interestadual: 12% para a maioria,
// exceto operações destinadas a AL, BA, CE, DF, ES, GO, MA, MG, MS, MT, PA, PB,
// PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, SP, TO, AC, AM, AP saindo de
// PR/SP/SC/MG/RJ/RS/ES (regiões S/SE, exceto ES) -> N/NE/CO/ES = 7%
const sulSudesteExtoES = ["PR","SP","SC","MG","RJ","RS"];
const norteNordesteCoEs = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MT","MS","PA","PB","PE","PI","RN","RO","RR","SE","TO"];

const tabelaICMS = {};

estados.forEach(origem => {
    tabelaICMS[origem] = {};
    estados.forEach(destino => {
        if (origem === destino) {
            tabelaICMS[origem][destino] = aliquotaInterna[origem];
        } else if (sulSudesteExtoES.includes(origem) && norteNordesteCoEs.includes(destino)) {
            tabelaICMS[origem][destino] = 7;
        } else {
            tabelaICMS[origem][destino] = 12;
        }
    });
});

// FECP: 2% adicional em operações com destino RJ (interno ou interestadual), conforme nota na tabela
const FECP_RJ = 2;

const origemEl = document.getElementById("origem");
const destinoEl = document.getElementById("destino");

estados.forEach(uf => {
    origemEl.innerHTML += `<option value="${uf}">${uf}</option>`;
    destinoEl.innerHTML += `<option value="${uf}">${uf}</option>`;
});

origemEl.value = "PR";
destinoEl.value = "SP";

// Formata número no padrão monetário brasileiro: 30.000,00
function formatarMoeda(valor) {
    return "R$ " + valor.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function calcular() {

    let ufOrigem = origemEl.value;
    let ufDestino = destinoEl.value;
    let valorNfe = valorNfeNumerico();

    if (!ufOrigem || !ufDestino || isNaN(valorNfe)) {
        alert("⚠️ Preencha origem, destino e o valor da NF-e.");
        return;
    }

    let aliquota = tabelaICMS[ufOrigem][ufDestino];

    // aplica FECP se o destino for RJ
    let fecp = (ufDestino === "RJ") ? FECP_RJ : 0;
    let aliquotaTotal = aliquota + fecp;

    let percentual = aliquotaTotal / 100;

    let icmsTirado = valorNfe * percentual;

    let valorFinal = valorNfe - icmsTirado;

    let aliqTexto = aliquota + "%" + (fecp > 0 ? ` + ${fecp}% FECP = ${aliquotaTotal}%` : "");

    document.getElementById("aliq").innerText = aliqTexto;
    document.getElementById("percentual").innerText = percentual.toFixed(4).replace(".", ",");
    document.getElementById("icmsTirado").innerText = formatarMoeda(icmsTirado);
    document.getElementById("valorFinal").innerText = formatarMoeda(valorFinal);

    desenharTabela(ufOrigem, ufDestino);
}

function desenharTabela(ufOrigemSel, ufDestinoSel) {

    const tabela = document.getElementById("tabela-icms");
    tabela.innerHTML = "";

    // thead
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");

    const corner = document.createElement("th");
    corner.className = "corner";
    corner.textContent = "ORI \\ DES";
    headRow.appendChild(corner);

    estados.forEach(uf => {
        const th = document.createElement("th");
        th.textContent = uf;
        if (uf === ufDestinoSel) th.style.color = "var(--green)";
        headRow.appendChild(th);
    });

    thead.appendChild(headRow);
    tabela.appendChild(thead);

    // tbody
    const tbody = document.createElement("tbody");

    estados.forEach(ufOri => {
        const row = document.createElement("tr");
        if (ufOri === ufOrigemSel) row.classList.add("hl-row");

        const th = document.createElement("th");
        th.textContent = ufOri;
        row.appendChild(th);

        estados.forEach(ufDes => {
            const td = document.createElement("td");
            const valor = tabelaICMS[ufOri][ufDes];
            td.textContent = valor;

            if (ufOri === ufDes) td.classList.add("diag");

            if (ufOri === ufOrigemSel && ufDes === ufDestinoSel) {
                td.classList.add("hl-cell");
            } else if (ufDes === ufDestinoSel) {
                td.classList.add("hl-col");
            }

            row.appendChild(td);
        });

        tbody.appendChild(row);
    });

    tabela.appendChild(tbody);
}

// desenha a tabela inicialmente
desenharTabela(origemEl.value, destinoEl.value);

// Formatação automática do campo de valor (estilo brasileiro: 30.000,00)
const valorNfeEl = document.getElementById("valorNfe");

valorNfeEl.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");

    if (v === "") {
        e.target.value = "";
        return;
    }

    v = (parseInt(v, 10) / 100).toFixed(2);

    const partes = v.split(".");
    let inteiro = partes[0];
    const decimal = partes[1];

    inteiro = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    e.target.value = inteiro + "," + decimal;
});

// converte "30.000,00" -> 30000.00 (number)
function valorNfeNumerico() {
    const v = valorNfeEl.value.trim();
    if (!v) return NaN;
    return parseFloat(v.replace(/\./g, "").replace(",", "."));
}
