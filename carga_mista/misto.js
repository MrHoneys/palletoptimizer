const veiculosDB = {
    carreta: [
        { nome: "Carreta 15.4m", c: 15.40, l: 2.50, h: 2.70, vagoes: 1 },
        { nome: "Carreta 14.6m", c: 14.60, l: 2.50, h: 2.70, vagoes: 1 }
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
        { nome: "IVECO BAU 3.9m", c: 3.90, l: 2.10, h: 2.10, vagoes: 1 }
    ],
    container: [
        { nome: "45' HC", c: 13.50, l: 2.33, h: 2.58, vagoes: 1 },
        { nome: "40' HC", c: 12.00, l: 2.33, h: 2.58, vagoes: 1 },
        { nome: "20' DC", c: 5.88, l: 2.33, h: 2.26, vagoes: 1 }
    ]
};

const cores = [
"#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444",
"#ec4899","#14b8a6","#f97316","#06b6d4","#a78bfa"
];

let veiculo = null;
let numeroPallet = 1;
let tipoPallet = 0;

const carga = [];
let vagoes = [];

// Escala: pixels por metro no desenho do baú
const PX_POR_METRO = 60;

const cat = document.getElementById('categoria');
const vei = document.getElementById('veiculo');
const infoVei = document.getElementById('infoVeiculo');
const passo2 = document.getElementById('passo2');
const bau = document.getElementById('bau');
const legenda = document.getElementById('legenda');
const info = document.getElementById('info');
const total = document.getElementById('total');

Object.keys(veiculosDB).forEach(k =>
cat.add(new Option(k.charAt(0).toUpperCase() + k.slice(1), k))
);

cat.onchange = () => {

vei.innerHTML = '<option>-- Escolha o veículo --</option>';

veiculosDB[cat.value]?.forEach(v =>
vei.add(new Option(v.nome, JSON.stringify(v)))
);

};

vei.onchange = () => {

if (!vei.value) return;

veiculo = JSON.parse(vei.value);

vagoes = [];

for(let i=0;i<(veiculo.vagoes || 1);i++){

vagoes.push({
// grade ocupada: cada célula é {tipo, num} ou null
ocupado: [], // matriz [linha (comprimento)][coluna (largura)]
restante: veiculo.c,
carga:[]
});

}

infoVei.textContent =
`${veiculo.nome} → ${veiculo.vagoes || 1} vagão(ões) de ${veiculo.c}m × ${veiculo.l}m × ${veiculo.h}m`;

passo2.style.display = 'block';

limpar();

};

function limpar(){

bau.innerHTML='';
legenda.innerHTML='';
info.innerHTML='';
total.innerHTML='';

numeroPallet=1;
tipoPallet=0;

vagoes.forEach(v=>{
v.restante = veiculo.c;
v.carga=[];
v.ocupado=[];
});

carga.length=0;

}

/*
  Decide a orientação do pallet em relação ao veículo:

  - modo = "auto": tenta encaixar o pallet de forma que múltiplas unidades
    fiquem lado a lado preenchendo a largura do veículo o máximo possível
    (escolhendo automaticamente a orientação que aproveita mais espaço).
  - modo = "comprimento": força o comprimento do pallet (cp) a avançar no
    sentido do comprimento do veículo, e a largura do pallet (lp) a ocupar
    o sentido da largura do veículo (pallet "normal", não rotacionado).
  - modo = "largura": força a largura do pallet (lp) a avançar no sentido do
    comprimento do veículo, e o comprimento do pallet (cp) a ocupar o
    sentido da largura do veículo (pallet "rotacionado").

  cp = comprimento do pallet (m)
  lp = largura do pallet (m)
  comprimentoDisponivel = espaço restante no vagão (m)
  larguraVeiculo = largura interna do veículo (m)
*/
function calcularMelhorLayout(cp, lp, comprimentoDisponivel, larguraVeiculo, modo='auto'){

    // Opção 1: pallet "normal" -> lp ocupa a largura do veículo, cp avança no comprimento
    const op1_porLinha = Math.floor((larguraVeiculo + 1e-6) / lp);
    const op1_linhas   = Math.floor((comprimentoDisponivel + 1e-6) / cp);
    const op1_total    = op1_porLinha * op1_linhas;
    const op1_sobraLarg = larguraVeiculo - (op1_porLinha * lp);

    // Opção 2: pallet "rotacionado" -> cp ocupa a largura do veículo, lp avança no comprimento
    const op2_porLinha = Math.floor((larguraVeiculo + 1e-6) / cp);
    const op2_linhas   = Math.floor((comprimentoDisponivel + 1e-6) / lp);
    const op2_total    = op2_porLinha * op2_linhas;
    const op2_sobraLarg = larguraVeiculo - (op2_porLinha * cp);

    let escolhida;

    if(modo === 'comprimento'){
        // força opção 1, mesmo que não seja a mais eficiente
        escolhida = {
            ladoLargura: lp,
            avanco: cp,
            porColuna: op1_porLinha,
            colunasCabem: op1_linhas,
            max: op1_total,
            sobraLargura: op1_sobraLarg,
            rotacionado: false
        };
    } else if(modo === 'largura'){
        // força opção 2, mesmo que não seja a mais eficiente
        escolhida = {
            ladoLargura: cp,
            avanco: lp,
            porColuna: op2_porLinha,
            colunasCabem: op2_linhas,
            max: op2_total,
            sobraLargura: op2_sobraLarg,
            rotacionado: true
        };
    } else if(op2_total > op1_total){
        escolhida = {
            ladoLargura: cp,      // dimensão que ocupa a largura do veículo
            avanco: lp,           // dimensão que avança no comprimento
            porColuna: op2_porLinha,
            colunasCabem: op2_linhas,
            max: op2_total,
            sobraLargura: op2_sobraLarg,
            rotacionado: true
        };
    } else if (op1_total > 0 || op2_total === 0) {
        escolhida = {
            ladoLargura: lp,
            avanco: cp,
            porColuna: op1_porLinha,
            colunasCabem: op1_linhas,
            max: op1_total,
            sobraLargura: op1_sobraLarg,
            rotacionado: false
        };
    } else {
        escolhida = {
            ladoLargura: cp,
            avanco: lp,
            porColuna: op2_porLinha,
            colunasCabem: op2_linhas,
            max: op2_total,
            sobraLargura: op2_sobraLarg,
            rotacionado: true
        };
    }

    // "Casado" = lado a lado preenchendo (quase) toda a largura, ou seja porColuna >= 2
    // e pouca sobra de largura. Caso contrário, centraliza (porColuna pode ser 1 com sobra grande).
    escolhida.casado = escolhida.porColuna >= 2 && escolhida.sobraLargura < (escolhida.ladoLargura * 0.5);

    return escolhida;
}

document.getElementById('add').onclick = () => {

const cp = +document.getElementById('comp').value;
const lp = +document.getElementById('larg').value;
const hp = +document.getElementById('alt').value;
let desejado = +document.getElementById('qtd').value;

const modoEl = document.querySelector('input[name="orientacao"]:checked');
const modo = modoEl ? modoEl.value : 'auto';

if (!cp || !lp || !hp || !desejado) return alert("⚠️ Preencha todos os campos!");
if (hp > veiculo.h) return alert("❌ Pallet muito alto! Excede a altura do veículo (" + veiculo.h + "m).");

const modoTexto = modo === 'comprimento'
    ? 'Comprimento do pallet no sentido do comprimento (manual)'
    : modo === 'largura'
        ? 'Largura do pallet no sentido do comprimento — rotacionado (manual)'
        : 'Automático (melhor aproveitamento)';

let algumEncaixe = false;

for(let v=0; v<vagoes.length; v++){

if(desejado<=0) break;

const vagao = vagoes[v];

const layout = calcularMelhorLayout(cp,lp,vagao.restante,veiculo.l,modo);

if(layout.max===0) continue;

algumEncaixe = true;

const colocados = Math.min(desejado, layout.max);

const colunasUsadas = Math.ceil(colocados/layout.porColuna);

const avancos = colunasUsadas * layout.avanco;

vagao.restante -= avancos;

// quantas posições de empilhamento (altura) cabem
const camadas = Math.max(1, Math.floor((veiculo.h + 1e-6) / hp));

const palletInfo = {
tipo: ++tipoPallet,
cor: cores[(tipoPallet-1)%cores.length],
inicio: numeroPallet,
cp,lp,hp,
desejado:colocados,
colocados,
porColuna:layout.porColuna,
colunasUsadas,
lado: layout.ladoLargura,
avanco: layout.avanco,
sobraLargura: layout.sobraLargura,
casado: layout.casado,
rotacionado: layout.rotacionado,
modo,
modoTexto,
camadas,
vagao:v
};

vagao.carga.push(palletInfo);
carga.push(palletInfo);

numeroPallet += colocados;

desejado -= colocados;

}

if(!algumEncaixe){
    const motivo = modo === 'auto'
        ? ''
        : ' na orientação escolhida. Tente a opção "Automático" ou a outra orientação.';
    alert(`❌ Este pallet não cabe no espaço restante${motivo}`);
} else if(desejado > 0){
    alert(`⚠️ Não há espaço suficiente para ${desejado} pallet(s). Eles não foram adicionados.`);
}

['comp','larg','alt','qtd'].forEach(id => document.getElementById(id).value='');

desenhar();

};

/*
  Exclui um único tipo de pallet (todos os que foram adicionados naquele
  lançamento) da carga, recalcula o espaço livre do vagão correspondente
  e redesenha tudo.
*/
function excluirPallet(tipo){

    const idx = carga.findIndex(p => p.tipo === tipo);
    if(idx === -1) return;

    const p = carga[idx];

    if(!confirm(`Remover o pallet #${String(p.tipo).padStart(2,'0')} (${p.cp}×${p.lp}×${p.hp}m) da carga?`)) return;

    // remove da lista global
    carga.splice(idx, 1);

    // remove do vagão correspondente
    const vagao = vagoes[p.vagao];
    if(vagao){
        const idxV = vagao.carga.findIndex(x => x.tipo === tipo);
        if(idxV !== -1) vagao.carga.splice(idxV, 1);

        // recalcula o espaço restante do vagão com base no que sobrou
        const usadoVagao = vagao.carga.reduce((a,c) => a + (c.colunasUsadas * c.avanco), 0);
        vagao.restante = veiculo.c - usadoVagao;
    }

    desenhar();
}

function desenhar() {

  bau.innerHTML = '';
  legenda.innerHTML = '';
  info.innerHTML = '';

  let totalColocados = 0;
  let totalDesejado = 0;
  let totalUsado = 0;

vagoes.forEach((vagao, index) => {

  // ===== Container do vagão =====
  const containerVagao = document.createElement('div');
  containerVagao.style.display = 'flex';
  containerVagao.style.flexDirection = 'column';
  containerVagao.style.flexShrink = '0';

  const titulo = document.createElement('h3');
  titulo.textContent = `Vagão ${index + 1} — ${veiculo.c}m × ${veiculo.l}m × ${veiculo.h}m`;
  titulo.style.fontFamily = 'var(--mono)';
  titulo.style.fontSize = '12px';
  titulo.style.letterSpacing = '1px';
  titulo.style.color = 'var(--accent)';
  titulo.style.marginBottom = '10px';
  titulo.style.textTransform = 'uppercase';
  containerVagao.appendChild(titulo);

  // ===== Área visual do baú (vista de cima) =====
  const larguraPx = veiculo.l * PX_POR_METRO;
  const comprimentoPx = veiculo.c * PX_POR_METRO;

  const areaBau = document.createElement('div');
  areaBau.style.position = 'relative';
  areaBau.style.width = comprimentoPx + 'px';
  areaBau.style.height = larguraPx + 'px';
  areaBau.style.background = 'var(--surface)';
  areaBau.style.border = '2px solid var(--border)';
  areaBau.style.borderRadius = '10px';
  areaBau.style.flexShrink = '0';
  areaBau.style.overflow = 'hidden';

  // seta indicando direção cabine -> traseira
  const setaTopo = document.createElement('div');
  setaTopo.textContent = '🚚 CABINE                                                              TRASEIRA →';
  setaTopo.style.position = 'absolute';
  setaTopo.style.top = '-22px';
  setaTopo.style.left = '0';
  setaTopo.style.fontFamily = 'var(--mono)';
  setaTopo.style.fontSize = '10px';
  setaTopo.style.color = 'var(--muted)';
  setaTopo.style.letterSpacing = '1px';
  setaTopo.style.whiteSpace = 'nowrap';
  areaBau.appendChild(setaTopo);

  // posição de avanço acumulado (em metros) por vagão
  let posAvanco = 0;

  vagao.carga.forEach(p => {

      totalColocados += p.colocados;
      totalDesejado += p.desejado;

      const avancosReais = p.colunasUsadas * p.avanco;
      totalUsado += avancosReais;

      let restanteColocar = p.colocados;
      let numeroAtual = p.inicio;

      for (let col = 0; col < p.colunasUsadas; col++) {

          const qtdNestaColuna = Math.min(restanteColocar, p.porColuna);
          restanteColocar -= qtdNestaColuna;

          // posição da coluna no eixo do comprimento (X na vista de cima)
          const xMetros = posAvanco + col * p.avanco;
          const xPx = xMetros * PX_POR_METRO;
          const avancoPx = p.avanco * PX_POR_METRO;

          if (p.casado) {
              // ===== CASADO: distribui lado a lado preenchendo a largura =====
              for (let i = 0; i < qtdNestaColuna; i++) {
                  const yMetros = i * p.lado;
                  const yPx = yMetros * PX_POR_METRO;
                  const ladoPx = p.lado * PX_POR_METRO;

                  criarPalletVisual(areaBau, xPx, yPx, avancoPx, ladoPx, p, numeroAtual);
                  numeroAtual++;
              }
          } else {
              // ===== NÃO CASADO: centraliza na largura do veículo =====
              const ladoOcupadoTotal = p.lado; // por unidade nesta coluna (só 1 cabe por linha de avanço aqui)
              // Se porColuna === 1, centraliza um único pallet por "linha" de avanço.
              // Se porColuna > 1 mas não "casado" (sobra grande), ainda distribuímos em sequência,
              // mas centralizado em relação ao espaço total ocupado pelo grupo.
              const larguraGrupoMetros = qtdNestaColuna * p.lado;
              const offsetYMetros = (veiculo.l - larguraGrupoMetros) / 2;

              for (let i = 0; i < qtdNestaColuna; i++) {
                  const yMetros = offsetYMetros + i * p.lado;
                  const yPx = yMetros * PX_POR_METRO;
                  const ladoPx = p.lado * PX_POR_METRO;

                  criarPalletVisual(areaBau, xPx, yPx, avancoPx, ladoPx, p, numeroAtual);
                  numeroAtual++;
              }
          }
      }

      posAvanco += p.colunasUsadas * p.avanco;

      // ===== Legenda =====
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '10px';

      const swatch = document.createElement('div');
      swatch.style.width = '18px';
      swatch.style.height = '18px';
      swatch.style.borderRadius = '4px';
      swatch.style.background = p.cor;
      swatch.style.flexShrink = '0';

      const label = document.createElement('span');
      label.textContent = `#${String(p.tipo).padStart(2,'0')} → ${p.cp}×${p.lp}×${p.hp}m`;
      label.style.color = 'var(--text)';

      item.appendChild(swatch);
      item.appendChild(label);
      legenda.appendChild(item);

      // ===== Resumo escrito =====
      const camadaTexto = p.camadas > 1
          ? `Empilhamento: ${p.camadas} camada(s) (altura ${p.hp}m × ${p.camadas} ≤ ${veiculo.h}m)`
          : `Sem empilhamento (1 camada — altura ${p.hp}m de ${veiculo.h}m)`;

      const orientacaoTexto = p.rotacionado
          ? `Pallet posicionado de lado: ${p.cp}m no sentido da largura, ${p.lp}m no sentido do comprimento.`
          : `Pallet posicionado normal: ${p.lp}m no sentido da largura, ${p.cp}m no sentido do comprimento.`;

      const disposicaoTexto = p.casado
          ? `✅ Disposição CASADA: ${p.porColuna} pallet(s) lado a lado preenchendo ${(p.porColuna * p.lado).toFixed(2)}m de ${veiculo.l}m de largura (sobra ${p.sobraLargura.toFixed(2)}m).`
          : `↔️ Disposição CENTRALIZADA: ${p.porColuna} pallet(s) por linha, centralizados na largura (sobra de ${p.sobraLargura.toFixed(2)}m não aproveitada).`;

      const bloco = document.createElement('div');
      bloco.style.marginBottom = '16px';
      bloco.style.paddingBottom = '16px';
      bloco.style.borderBottom = '1px solid var(--border)';
      bloco.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:14px;height:14px;border-radius:3px;background:${p.cor};"></div>
            <strong style="color:var(--text);">#${String(p.tipo).padStart(2,'0')} — Pallet ${p.cp}m × ${p.lp}m × ${p.hp}m</strong>
          </div>
          <button class="btn-del-small" onclick="excluirPallet(${p.tipo})">🗑️ Excluir</button>
        </div>
        <div style="font-size:13px;color:var(--muted);line-height:1.8;">
          Vagão: <strong style="color:var(--text);">${p.vagao + 1}</strong><br>
          Orientação escolhida: <strong style="color:var(--accent);">${p.modoTexto}</strong><br>
          ${orientacaoTexto}<br>
          ${disposicaoTexto}<br>
          ${camadaTexto}<br>
          Espaço ocupado no comprimento: <strong style="color:var(--accent);">${(p.colunasUsadas * p.avanco).toFixed(2)}m</strong>
          (${p.colunasUsadas} linha(s) × ${p.avanco.toFixed(2)}m)<br>
          Pedido: ${p.desejado} pallet(s) → Colocado: <strong style="color:var(--green);">${p.colocados * p.camadas}</strong>
          ${p.camadas > 1 ? `(${p.colocados} por camada × ${p.camadas} camadas)` : ''}
          ${p.colocados < p.desejado ? `<br><span style="color:var(--red);">⚠️ Faltaram ${p.desejado - p.colocados} pallet(s) por falta de espaço no comprimento.</span>` : ''}
        </div>
      `;
      info.appendChild(bloco);

    });

  containerVagao.appendChild(areaBau);

  // ===== Indicador de espaço livre =====
  if (vagao.restante > 0.01) {
      const livre = document.createElement('div');
      livre.style.marginTop = '8px';
      livre.style.fontFamily = 'var(--mono)';
      livre.style.fontSize = '11px';
      livre.style.color = 'var(--orange)';
      livre.textContent = `Espaço livre no comprimento: ${vagao.restante.toFixed(2)}m`;
      containerVagao.appendChild(livre);
  }

  bau.appendChild(containerVagao);

  });

  const comprimentoTotal = veiculo.c * vagoes.length;
  const totalGeral = carga.reduce((a,c) => a + (c.colocados * c.camadas), 0);

  total.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;text-align:center;">
      <div>
        <div style="font-size:38px;font-weight:800;color:var(--green);">${totalGeral}</div>
        <div style="font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:1px;margin-top:4px;">TOTAL DE PALLETS</div>
      </div>
      <div>
        <div style="font-size:38px;font-weight:800;color:var(--accent);">${(comprimentoTotal - totalUsado).toFixed(2)}</div>
        <div style="font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:1px;margin-top:4px;">SOBRANDO (m)</div>
      </div>
      <div>
        <div style="font-size:38px;font-weight:800;color:var(--orange);">${totalUsado.toFixed(2)}</div>
        <div style="font-family:var(--mono);font-size:11px;color:var(--muted);letter-spacing:1px;margin-top:4px;">COMPRIMENTO UTILIZADO (m)</div>
      </div>
    </div>
  `;
}

/*
  Cria visualmente um quadrado representando o pallet na vista de cima do baú.
  x, y, w, h em pixels. p = dados do pallet. numero = número de identificação.
*/
function criarPalletVisual(container, x, y, w, h, p, numero) {

    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.width = (w - 3) + 'px';
    el.style.height = (h - 3) + 'px';
    el.style.background = p.cor;
    el.style.border = '2px solid rgba(0,0,0,.35)';
    el.style.borderRadius = '6px';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.color = '#08111f';
    el.style.fontWeight = '800';
    el.style.fontFamily = 'var(--mono)';
    el.style.fontSize = '11px';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,.3)';
    el.style.transition = 'transform .15s';
    el.style.cursor = 'default';
    el.title = `Pallet #${numero} — ${p.cp}×${p.lp}×${p.hp}m${p.camadas > 1 ? ` (${p.camadas} camadas)` : ''}`;

    el.onmouseenter = () => el.style.transform = 'scale(1.06)';
    el.onmouseleave = () => el.style.transform = 'scale(1)';

    const numEl = document.createElement('span');
    numEl.textContent = '#' + numero;
    el.appendChild(numEl);

    if (p.camadas > 1) {
        const camEl = document.createElement('span');
        camEl.textContent = `×${p.camadas}`;
        camEl.style.fontSize = '9px';
        camEl.style.opacity = '.75';
        el.appendChild(camEl);
    }

    container.appendChild(el);
}

document.getElementById('finalizar').onclick = () => {

const usados = carga.reduce((a,c)=>a+(c.colunasUsadas*c.avanco),0);

const perc = ((usados)/(veiculo.c*veiculo.vagoes)*100).toFixed(1);

const totalGeral = carga.reduce((a,c) => a + (c.colocados * c.camadas), 0);

alert(`🚛 CARGA FINALIZADA

${veiculo.nome}

${totalGeral} pallets carregados (considerando empilhamento)

${usados.toFixed(2)}m utilizados

${perc}% aproveitamento do comprimento`);

};

document.getElementById('mixed-load')?.addEventListener('click', () => {
window.location.href='misto.html';
});

document.getElementById('clear-form')?.addEventListener('click', limpar);