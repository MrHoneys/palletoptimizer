    const API_URL = 'https://publica.cnpj.ws/cnpj/';
    const state = { data: null };
    const $ = (selector) => document.querySelector(selector);

    const refs = {
      form: $('#searchForm'), input: $('#cnpjInput'), button: $('#consultButton'), loading: $('#loading'),
      status: $('#statusLine'), results: $('#results'), companyName: $('#companyName'), tradeName: $('#tradeName'),
      situation: $('#situation'), summaryGrid: $('#summaryGrid'), dynamicData: $('#dynamicData'), rawJson: $('#rawJson'),
      fieldCount: $('#fieldCount'), metaCnpj: $('#metaCnpj'), toggleJson: $('#toggleJson'), copyJson: $('#copyJson'), toast: $('#toast')
    };

    const icons = {
      address:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2"></circle></svg>',
      city:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l7-4v18M19 21V11l-7-4"></path></svg>',
      cnae:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M7 8h10M7 12h6M7 16h8"></path></svg>',
      phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3 5.2 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.5 2.1L9 10.6a16 16 0 0 0 4.4 4.4l1.2-1.2a2 2 0 0 1 2.1-.5c.8.4 1.7.6 2.6.7a2 2 0 0 1 1.7 2Z"></path></svg>',
      mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path></svg>',
      state:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"></path><path d="M8 8h8M8 12h8M8 16h5"></path></svg>',
      capital:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 6v12"></path></svg>',
      date:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 10h18"></path></svg>'
    };

    function onlyDigits(value=''){ return String(value).replace(/\D/g,''); }
    function maskCnpj(value){ const d=onlyDigits(value).slice(0,14); return d.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2'); }
    function formatCep(value){ const d=onlyDigits(value); return d.length===8 ? d.replace(/(\d{5})(\d{3})/,'$1-$2') : value; }
    function formatPhone(value){ const d=onlyDigits(value); if(d.length===11) return d.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3'); if(d.length===10) return d.replace(/(\d{2})(\d{4})(\d{4})/,'($1) $2-$3'); return value; }
    function isValidCnpj(cnpj){ const d=onlyDigits(cnpj); if(d.length!==14 || /^(\d)\1+$/.test(d)) return false; const calc=(base,weights)=>{let sum=0; for(let i=0;i<weights.length;i++) sum+=Number(base[i])*weights[i]; const r=sum%11; return r<2?0:11-r}; const d1=calc(d,[5,4,3,2,9,8,7,6,5,4,3,2]); const d2=calc(d,[6,5,4,3,2,9,8,7,6,5,4,3,2]); return d.endsWith(`${d1}${d2}`); }
    function isEmpty(value){ return value===null || value===undefined || value==='' || (Array.isArray(value)&&value.length===0) || (typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===0); }
    function labelize(key){ return String(key).replace(/_/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/\b\w/g,c=>c.toUpperCase()); }
    function parseDate(value){ if(typeof value!=='string') return null; if(!/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)) return null; const date=new Date(value.length===10?`${value}T12:00:00`:value); return Number.isNaN(date.getTime())?null:date; }
    function formatValue(key,value){
      if(value===null || value===undefined || value==='') return 'Não informado';
      if(typeof value==='boolean') return value ? 'Sim' : 'Não';
      const k=String(key).toLowerCase();
      if(k.includes('cnpj') && onlyDigits(value).length===14) return maskCnpj(value);
      if(k.includes('cep') && onlyDigits(value).length===8) return formatCep(value);
      if((k.includes('telefone')||k.includes('fone')||k==='phone') && [10,11].includes(onlyDigits(value).length)) return formatPhone(value);
      if(k.includes('capital_social') || k==='capital social') { const n=Number(String(value).replace(',','.')); if(Number.isFinite(n)) return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
      const date=parseDate(value); if(date) return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:String(value).includes('T')?'short':undefined}).format(date);
      return String(value);
    }
    function get(obj,path,fallback=''){ return path.split('.').reduce((acc,key)=>acc?.[key],obj) ?? fallback; }
    function first(...values){ return values.find(v=>!isEmpty(v)) ?? ''; }
    function countFilled(value){ if(isEmpty(value)) return 0; if(Array.isArray(value)) return value.reduce((sum,item)=>sum+countFilled(item),0); if(typeof value==='object') return Object.values(value).reduce((sum,item)=>sum+countFilled(item),0); return 1; }
    function escapeHtml(value){ return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }

    function setBusy(busy){ refs.button.disabled=busy; refs.input.disabled=busy; refs.loading.classList.toggle('show',busy); refs.button.querySelector('span').textContent=busy?'Consultando...':'Consultar'; }
    function setStatus(message,type=''){ refs.status.textContent=message; refs.status.className=`status-line ${type}`.trim(); }
    function showToast(message,type='success'){ refs.toast.textContent=message; refs.toast.className=`toast ${type} show`; clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>refs.toast.classList.remove('show'),2600); }

    function summaryItem(icon,label,value,mono=false){ return `<div class="info-card"><div class="info-label">${icon}<span>${escapeHtml(label)}</span></div><div class="info-value ${mono?'mono':''}">${escapeHtml(value||'Não informado')}</div></div>`; }
    function buildAddress(est){ const parts=[first(est.tipo_logradouro,''),first(est.logradouro,''),first(est.numero,''),first(est.complemento,''),first(est.bairro,'')].filter(Boolean); return parts.join(', ').replace(/, ,/g,','); }
    function findStateRegistrations(data){ const candidates=[get(data,'estabelecimento.inscricoes_estaduais',[]),data.inscricoes_estaduais,data.inscricoes_estadual].filter(Array.isArray).flat(); if(!candidates.length) return 'Não informado'; return candidates.map(item=>typeof item==='object'?first(item.inscricao_estadual,item.numero,item.inscricao,item.id,JSON.stringify(item)):item).filter(Boolean).join(' • '); }

    function renderSummary(data){
      const est=data.estabelecimento||{};
      const cityObj=first(est.cidade,est.municipio,{}) || {};
      const stateObj=first(est.estado,est.uf,{}) || {};
      const reason=first(data.razao_social,est.razao_social,'Razão social não informada');
      const fantasy=first(est.nome_fantasia,data.nome_fantasia,'Nome fantasia não informado');
      const status=first(est.situacao_cadastral,est.situacao,data.situacao_cadastral,'Não informado');
      const statusText=typeof status==='object'?first(status.descricao,status.nome,status.id,'Não informado'):status;
      refs.companyName.textContent=reason; refs.tradeName.textContent=fantasy; refs.situation.textContent=statusText;
      const normalized=String(statusText).toLowerCase(); refs.situation.className=`situation ${normalized.includes('ativ')&&!normalized.includes('inativ')?'active':normalized.includes('baix')||normalized.includes('inativ')||normalized.includes('susp')?'inactive':'neutral'}`;
      const cnpj=first(est.cnpj,data.cnpj,`${data.cnpj_raiz||''}${est.cnpj_ordem||''}${est.cnpj_digito_verificador||''}`);
      refs.metaCnpj.textContent=onlyDigits(cnpj).length===14?maskCnpj(cnpj):maskCnpj(refs.input.value);
      refs.fieldCount.textContent=countFilled(data).toLocaleString('pt-BR');
      const city=first(cityObj.nome,cityObj.descricao,est.cidade,est.municipio,'');
      const uf=first(stateObj.sigla,stateObj.nome,est.estado,est.uf,'');
      const cnaeObj=first(est.atividade_principal,est.cnae_fiscal_principal,data.atividade_principal,{}) || {};
      const cnae=typeof cnaeObj==='object'?[first(cnaeObj.subclasse,cnaeObj.id,cnaeObj.codigo),first(cnaeObj.descricao,cnaeObj.nome)].filter(Boolean).join(' — '):cnaeObj;
      const ddd=first(est.ddd1,est.ddd_telefone_1,''); const tel=first(est.telefone1,est.telefone_1,est.telefone,data.telefone,'');
      const phone=tel ? formatPhone(`${ddd}${tel}`) : 'Não informado';
      const email=first(est.email,data.email,'Não informado');
      const summary=[
        summaryItem(icons.address,'Endereço',buildAddress(est)||'Não informado'),
        summaryItem(icons.city,'Cidade / UF',[city,uf].filter(Boolean).join(' / ')||'Não informado'),
        summaryItem(icons.cnae,'CNAE principal',formatValue('cnae',cnae)||'Não informado',true),
        summaryItem(icons.phone,'Telefone',phone,true),
        summaryItem(icons.mail,'E-mail',email,true),
        summaryItem(icons.state,'Inscrições estaduais',findStateRegistrations(data),true),
        summaryItem(icons.capital,'Capital social',formatValue('capital_social',data.capital_social)),
        summaryItem(icons.date,'Atualizado em',formatValue('atualizado_em',first(data.atualizado_em,est.atualizado_em,'')))
      ];
      refs.summaryGrid.innerHTML=summary.join('');
    }

    function renderPrimitiveRows(obj){
      const entries=Object.entries(obj).filter(([,v])=>typeof v!=='object' || v===null);
      if(!entries.length) return '';
      return `<div class="primitive-list">${entries.map(([k,v])=>`<div class="primitive-row"><div class="primitive-key">${escapeHtml(labelize(k))}</div><div class="primitive-value ${isEmpty(v)?'empty':''}">${escapeHtml(formatValue(k,v))}</div></div>`).join('')}</div>`;
    }
    function renderNode(key,value,depth=0){
      if(value===null || typeof value!=='object') return `<div class="primitive-row"><div class="primitive-key">${escapeHtml(labelize(key))}</div><div class="primitive-value ${isEmpty(value)?'empty':''}">${escapeHtml(formatValue(key,value))}</div></div>`;
      const isArray=Array.isArray(value); const count=isArray?value.length:Object.keys(value).length;
      let body='';
      if(isArray){
        body=value.length?`<div class="array-items">${value.map((item,index)=>`<div class="array-item"><span class="array-index">ITEM ${index+1}</span>${typeof item==='object'&&item!==null ? renderObjectContent(item,depth+1) : `<div class="primitive-value">${escapeHtml(formatValue(key,item))}</div>`}</div>`).join('')}</div>`:'<div class="empty">Lista vazia</div>';
      } else body=renderObjectContent(value,depth+1);
      return `<details class="tree-node" ${depth===0?'open':''}><summary><span class="node-title">${escapeHtml(labelize(key))}</span><span class="node-kind">${isArray?'lista':'objeto'} · ${count}</span></summary><div class="node-content">${body}</div></details>`;
    }
    function renderObjectContent(obj,depth){
      const primitives=renderPrimitiveRows(obj); const nested=Object.entries(obj).filter(([,v])=>v!==null&&typeof v==='object').map(([k,v])=>renderNode(k,v,depth)).join('');
      return [primitives,nested?`<div class="tree" style="margin-top:${primitives?'12px':'0'}">${nested}</div>`:''].join('') || '<div class="empty">Objeto vazio</div>';
    }
    function renderAllData(data){ refs.dynamicData.innerHTML=Object.entries(data).map(([k,v])=>renderNode(k,v,0)).join('') || '<div class="empty">Nenhum dado retornado.</div>'; }

    async function consultCnpj(){
      const cnpj=onlyDigits(refs.input.value);
      setStatus(''); refs.results.classList.remove('show');
      if(cnpj.length!==14){ setStatus('Informe os 14 dígitos do CNPJ.','error'); refs.input.focus(); return; }
      if(!isValidCnpj(cnpj)){ setStatus('O CNPJ informado não passou na validação dos dígitos verificadores.','error'); refs.input.focus(); return; }
      setBusy(true);
      try{
        const response=await fetch(`${API_URL}${cnpj}`,{headers:{Accept:'application/json'}});
        let payload=null; try{payload=await response.json()}catch{payload=null}
        if(!response.ok){
          const apiMessage=payload?.detalhes || payload?.message || payload?.mensagem;
          if(response.status===404) throw new Error(apiMessage||'CNPJ não encontrado na base pública.');
          if(response.status===429) throw new Error(apiMessage||'Limite de consultas atingido. Aguarde cerca de um minuto e tente novamente.');
          if(response.status>=500) throw new Error('A API está temporariamente indisponível. Tente novamente em instantes.');
          throw new Error(apiMessage||`Não foi possível concluir a consulta (HTTP ${response.status}).`);
        }
        state.data=payload; refs.input.value=maskCnpj(cnpj); renderSummary(payload); renderAllData(payload);
        refs.rawJson.textContent=JSON.stringify(payload,null,2); refs.rawJson.classList.remove('show'); refs.toggleJson.textContent='Ver JSON';
        refs.results.classList.add('show'); setStatus('Consulta concluída com sucesso.','success'); refs.results.scrollIntoView({behavior:'smooth',block:'start'});
      }catch(error){
        const offline=!navigator.onLine; setStatus(offline?'Sem conexão com a internet. Verifique sua rede e tente novamente.':error.message||'Erro inesperado ao consultar o CNPJ.','error');
      }finally{ setBusy(false); }
    }

    refs.input.addEventListener('input',e=>{ e.target.value=maskCnpj(e.target.value); setStatus(''); });
    refs.form.addEventListener('submit',e=>{ e.preventDefault(); consultCnpj(); });
    refs.toggleJson.addEventListener('click',()=>{ const show=!refs.rawJson.classList.contains('show'); refs.rawJson.classList.toggle('show',show); refs.toggleJson.textContent=show?'Ocultar JSON':'Ver JSON'; });
    refs.copyJson.addEventListener('click',async()=>{ if(!state.data){showToast('Nenhum JSON disponível para copiar.','error');return} try{await navigator.clipboard.writeText(JSON.stringify(state.data,null,2));showToast('JSON copiado para a área de transferência.')}catch{showToast('Não foi possível copiar automaticamente.','error')} });
    $('#expandAll').addEventListener('click',()=>document.querySelectorAll('.tree-node').forEach(el=>el.open=true));
    $('#collapseAll').addEventListener('click',()=>document.querySelectorAll('.tree-node').forEach(el=>el.open=false));