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
});

carga.length=0;

}

function calcularMelhorLayout(cp, lp, comprimentoDisponivel, larguraVeiculo){

const op1_porLinha = Math.floor(larguraVeiculo / lp);
const op1_linhas = Math.floor(comprimentoDisponivel / cp);
const op1_total = op1_porLinha * op1_linhas;

const op2_porLinha = Math.floor(larguraVeiculo / cp);
const op2_linhas = Math.floor(comprimentoDisponivel / lp);
const op2_total = op2_porLinha * op2_linhas;

if(op2_total > op1_total){
return {
lado: cp,
avanco: lp,
porColuna: op2_porLinha,
colunasCabem: op2_linhas,
max: op2_total
}
}

return {
lado: lp,
avanco: cp,
porColuna: op1_porLinha,
colunasCabem: op1_linhas,
max: op1_total
}

}

document.getElementById('add').onclick = () => {

const cp = +document.getElementById('comp').value;
const lp = +document.getElementById('larg').value;
const hp = +document.getElementById('alt').value;
let desejado = +document.getElementById('qtd').value;

if (!cp || !lp || !hp || !desejado) return alert("⚠️ Preencha todos os campos!");
if (hp > veiculo.h) return alert("❌ Pallet muito alto!");

for(let v=0; v<vagoes.length; v++){

if(desejado<=0) break;

const vagao = vagoes[v];

const layout = calcularMelhorLayout(cp,lp,vagao.restante,veiculo.l);

if(layout.max===0) continue;

const colocados = Math.min(desejado, layout.max);

const colunasUsadas = Math.ceil(colocados/layout.porColuna);

const avancos = colunasUsadas * layout.avanco;

vagao.restante -= avancos;

const palletInfo = {
tipo: ++tipoPallet,
cor: cores[(tipoPallet-1)%cores.length],
inicio: numeroPallet,
cp,lp,hp,
desejado:colocados,
colocados,
porColuna:layout.porColuna,
colunasUsadas,
lado:layout.lado,
avanco:layout.avanco,
vagao:v
};

vagao.carga.push(palletInfo);
carga.push(palletInfo);

numeroPallet += colocados;

desejado -= colocados;

}

['comp','larg','alt','qtd'].forEach(id => document.getElementById(id).value='');

desenhar();

};

function desenhar() {

  bau.innerHTML = '';
  legenda.innerHTML = '';
  info.innerHTML = '<strong class="text-xl text-primary">Instruções de carregamento:</strong><br><br>';

  let totalColocados = 0;
  let totalDesejado = 0;
  let totalUsado = 0;

vagoes.forEach((vagao, index) => {

  const containerVagao = document.createElement('div');
  containerVagao.className = "flex flex-col mr-10";

  const titulo = document.createElement('h3');
  titulo.textContent = `Vagão ${index + 1}`;
  titulo.className = "text-lg font-bold mb-3";

  const grid = document.createElement('div');
  grid.className = "flex gap-4";

  containerVagao.appendChild(titulo);
  containerVagao.appendChild(grid);
  bau.appendChild(containerVagao);

  vagao.carga.forEach(p => {

      totalColocados += p.colocados;
      totalDesejado += p.desejado;

      const avancosReais = p.colunasUsadas * p.avanco;
      totalUsado += avancosReais;

      const item = document.createElement('div');
      item.className = 'flex items-center gap-4 bg-slate/50 px-6 py-4 rounded-xl border border-gray-700';
      item.innerHTML =
      `<div class="w-10 h-10 rounded-lg shadow-lg" style="background:${p.cor}"></div>
      <span class="font-bold text-lg">#${String(p.tipo).padStart(2,'0')} → ${p.cp} × ${p.lp} × ${p.hp} m</span>`;

      legenda.appendChild(item);

      for (let c = 0; c < p.colunasUsadas; c++) {

        const coluna = document.createElement('div');
        coluna.className = 'flex flex-col items-center gap-3';

        const qtdNesta = Math.min(p.colocados - c * p.porColuna, p.porColuna);

        for (let i = 0; i < qtdNesta; i++) {

          const pallet = document.createElement('div');
          pallet.className = 'w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-black shadow-2xl transform hover:scale-110 transition';
          pallet.style.background = p.cor;
          pallet.textContent = p.inicio + c * p.porColuna + i;

          coluna.appendChild(pallet);
        }

        grid.appendChild(coluna);
      }

      info.innerHTML += `
      <div class="mb-6 p-5 bg-slate/50 rounded-xl border border-gray-700">
        <strong>#${String(p.tipo).padStart(2,'0')} → ${p.cp} × ${p.lp} × ${p.hp} m</strong><br>
        Vagão: <strong>${p.vagao + 1}</strong><br>
        Carregar no lado de <strong>${p.lado.toFixed(2)} m</strong><br>
        Pedido: ${p.desejado} pallets → Carregado: ${p.colocados}
        ${p.colocados < p.desejado ? `(faltaram ${p.desejado - p.colocados})` : ''}<br>
        Distribuição: ${p.porColuna} pallets por linha × ${p.colunasUsadas} linhas → Total: ${p.colocados}
      </div>`;
    });

  });

  const comprimentoTotal = veiculo.c * vagoes.length;

  total.innerHTML = `
    <div class="grid grid-cols-3 gap-8 text-center mt-6">
      <div>
        <div class="text-5xl font-black text-success">${totalColocados}</div>
        <div class="text-gray-400 uppercase text-sm tracking-wider">TOTAL PALLETS</div>
      </div>
      <div>
        <div class="text-5xl font-black text-primary">${(comprimentoTotal - totalUsado).toFixed(2)}</div>
        <div class="text-gray-400 uppercase text-sm tracking-wider">SOBRANDO (m)</div>
      </div>
      <div>
        <div class="text-5xl font-black text-yellow-400">${totalUsado.toFixed(2)}</div>
        <div class="text-gray-400 uppercase text-sm tracking-wider">TOTAL FECHADO (m)</div>
      </div>
    </div>
  `;
}

document.getElementById('finalizar').onclick = () => {

const usados = carga.reduce((a,c)=>a+(c.colunasUsadas*c.avanco),0);

const perc = ((usados)/(veiculo.c*veiculo.vagoes)*100).toFixed(1);

alert(`🚛 CARGA FINALIZADA

${veiculo.nome}

${carga.reduce((a,c)=>a+c.colocados,0)} pallets carregados

${usados.toFixed(2)}m utilizados

${perc}% aproveitamento`);

};

document.getElementById('mixed-load')?.addEventListener('click', () => {
window.location.href='misto.html';
});

document.getElementById('clear-form').onclick = limpar;