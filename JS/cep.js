(function () {
  function limparCep(cep) {
    return (cep || '').toString().replace(/\D/g,'');
  }

  async function obterInfoViaCep(cep) {
    const limpo = limparCep(cep);
    if(!/^\d{8}$/.test(limpo)) throw new Error('CEP inválido');
    const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
    const data = await res.json();
    if(data.erro) throw new Error('CEP não encontrado');
    return data;
  }

  function formatMoneyBR(value){
    return `R$ ${Number(value).toFixed(2).replace('.',',')}`;
  }

  function calcularFreteRegras(subtotal = 0, uf = '') {
    if (subtotal >= 200) return { frete: 0, prazo: '15 a 25 dias úteis' };
    const regioesSP = ['SP','RJ','MG','ES'];
    const regioesSul = ['PR','SC','RS'];
    if (regioesSP.includes(uf)) return { frete: 15, prazo: '5 a 8 dias úteis' };
    if (regioesSul.includes(uf)) return { frete: 20, prazo: '7 a 12 dias úteis' };
    return { frete: 25, prazo: '10 a 20 dias úteis' };
  }

  function calcularFreteLocalPorUf(uf = '', subtotal = 0) {
    // tabela simples — ajuste valores conforme quiser
    if (subtotal >= 200) return { frete: 0, prazo: '15 a 25 dias úteis', servico: 'LOCAL_GRATIS' };
    const tabela = { SP:12, RJ:12, MG:12, ES:12, PR:18, SC:18, RS:18 };
    const frete = tabela[uf] ?? 25;
    const prazo = frete <= 12 ? '5 a 8 dias úteis' : (frete <= 18 ? '7 a 12 dias úteis' : '10 a 20 dias úteis');
    return { frete, prazo, servico: 'LOCAL_' + (uf||'BR') };
  }

  async function calcularFretePorCep(cep, opts = {}) {
    const limpo = limparCep(cep);
    if(!/^\d{8}$/.test(limpo)) throw new Error('CEP inválido');

    const subtotal = typeof opts.subtotal === 'number' ? opts.subtotal :
      (JSON.parse(localStorage.getItem('futplus_cart')||'[]').reduce((s,it)=> s + ((it.preco||0)*(it.quantidade||1)),0));

    const resultEl = document.getElementById(opts.resultId || 'shipping-result') || document.getElementById('shipping-result');
    const freteValEl = document.getElementById(opts.freteValId || 'frete-val');

    try {
      // primeiro busca endereço (uf) via ViaCEP
      const info = await obterInfoViaCep(limpo);
      const uf = (info.uf || '').toUpperCase();

      // Se houver um apiUrl e não for forçar local, tenta consultar o servidor
      const shouldTryServer = !!opts.apiUrl && !window.FORCE_LOCAL_FRETE;
      if (shouldTryServer) {
        try {
          const resp = await fetch(opts.apiUrl, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ cepDestino: limpo, cepOrigem: opts.cepOrigem || undefined, peso: opts.peso || 0.5 })
          });
          const json = await resp.json();
          if (json && json.success && Array.isArray(json.servicos) && json.servicos.length) {
            const servicos = json.servicos.filter(s => !s.erro && (s.valor || s.Valor));
            if (servicos.length) {
              servicos.sort((a,b)=> (a.valor||a.Valor) - (b.valor||b.Valor));
              const melhor = servicos[0];
              const valor = Number(melhor.valor || melhor.Valor || 0);
              const freteTxt = valor === 0 ? 'GRÁTIS' : formatMoneyBR(valor);
              if(resultEl) resultEl.innerHTML = `<p>🚚 ${melhor.codigo || melhor.Codigo} — ${freteTxt} — Prazo: ${melhor.prazoEntrega || melhor.PrazoEntrega} dias úteis</p>`;
              if(freteValEl) freteValEl.innerText = freteTxt;
              if (typeof window.atualizarTotais === 'function') window.atualizarTotais(subtotal, window.descontoGlobal || 0, valor);
              return { frete: valor, prazo: melhor.prazoEntrega || melhor.PrazoEntrega, servico: melhor.codigo || melhor.Codigo, info };
            }
          }
          // se servidor respondeu mas sem serviço válido, cair para local
        } catch (errServer) {
          // ignore server error e caia no cálculo local
          console.warn('Erro servidor frete (caindo para local):', errServer.message);
        }
      }

      // Fallback local
      const local = calcularFreteLocalPorUf(uf, subtotal);
      const freteTxt = local.frete === 0 ? 'GRÁTIS' : formatMoneyBR(local.frete);
      if(resultEl) resultEl.innerHTML = `<p>🚚 Frete (estimado) para ${info.localidade} / ${info.uf} (${limpo}): <b>${freteTxt}</b></p><p>🕒 Entrega estimada: ${local.prazo}.</p><p style="opacity:.8;font-size:.9rem">*Valor estimado local — quando possível, escolha "Calcular com Correios" (requer servidor).</p>`;
      if(freteValEl) freteValEl.innerText = freteTxt;
      if (typeof window.atualizarTotais === 'function') window.atualizarTotais(subtotal, window.descontoGlobal || 0, local.frete);
      return { frete: local.frete, prazo: local.prazo, servico: local.servico, info };

    } catch (err) {
      if(resultEl) resultEl.innerHTML = `<p style="color:#ff7a7a">❌ ${err.message}</p>`;
      throw err;
    }
  }

  async function calcularFreteCarrinho() {
    const selectors = ['#cep-input', '#cep-cart', '#cep', 'input[name="cep"]', '.cep-input', '#cepCartInput'];
    const el = selectors.map(s => document.querySelector(s)).find(o => o);
    if (!el) { alert('Campo de CEP não encontrado na página.'); return; }
    const cep = el.value.trim();
    if (!cep) { alert('Por favor, digite um CEP.'); return; }

    const carrinho = JSON.parse(localStorage.getItem('futplus_cart') || '[]');
    const subtotal = carrinho.reduce((s, it) => {
      if (typeof it.preco === 'number') return s + (it.preco * (it.quantidade || 1));
      const precoPadrao = (it.estilo === 'retro') ? 180 : 140;
      return s + (precoPadrao * (it.quantidade || 1));
    }, 0);

    const resultEl = document.getElementById('result-cart') ? 'result-cart' : (document.getElementById('shipping-result') ? 'shipping-result' : undefined);
    try {
      await calcularFretePorCep(cep, { subtotal, resultId: resultEl, freteValId: 'frete-val' });
    } catch (err) {
      console.error(err);
    }
  }

  window.obterInfoViaCep = obterInfoViaCep;
  window.calcularFretePorCep = calcularFretePorCep;
  window.formatMoneyBR = formatMoneyBR;

  // opcional: forçar modo local no console
  window.FORCE_LOCAL_FRETE = window.FORCE_LOCAL_FRETE || false;

  window.calcularFreteCarrinho = calcularFreteCarrinho;

  // Exporta para namespace FutPlus
  window.FutPlus = window.FutPlus || {};
  window.FutPlus.limparCep = limparCep;
  window.FutPlus.obterInfoViaCep = obterInfoViaCep;
  window.FutPlus.calcularFretePorCep = calcularFretePorCep;
  window.FutPlus.calcularFreteCarrinho = calcularFreteCarrinho;
  window.FutPlus.calcularFreteLocalPorUf = calcularFreteLocalPorUf;
  window.FutPlus.formatMoneyBR = formatMoneyBR;
})();