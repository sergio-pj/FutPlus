(function () {

  const CART_KEY = 'futplus_cart';

  function lerEnormalizarCarrinho() {
    const rawKey = localStorage.getItem(CART_KEY) ? CART_KEY : (localStorage.getItem('cart') ? 'cart' : CART_KEY);
    const raw = JSON.parse(localStorage.getItem(rawKey) || '[]');
    const normalized = raw.map(it => ({
      id: it.id || Date.now(),
      nome: it.nome || it.title || 'Produto',
      preco: Number(it.preco || it.price) || (it.estilo === 'retro' ? 180 : 140),
      foto: it.foto || it.image || '',
      fotoCostas: it.fotoCostas || it.fotoCostas || '',
      estilo: it.estilo || 'normal',
      tamanho: it.tamanho || 'M',
      personalizacao: it.personalizacao ? { nome: it.personalizacao.nome || it.personalizacao.nomePersonalizado || it.nomePersonalizado || '-', numero: it.personalizacao.numero || it.personalizacao.numero || it.numero || '-' } : { nome: it.nomePersonalizado || it.nome || '-', numero: it.numero || '-' },
      quantidade: it.quantidade || 1
    }));
    localStorage.setItem(CART_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function atualizarContador() {
    const countEl = document.getElementById('cart-count') || document.querySelector('.cart-count');
    const carrinho = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const total = carrinho.reduce((s,i) => s + (i.quantidade || 1), 0);
    if (countEl) countEl.innerText = total;
    return total;
  }

  function criarContainerSeFaltante() {
    const container = document.getElementById('cart-items-container') || document.querySelector('.cart-items') || document.querySelector('.cart-list');
    if (container) return container;
    const parent = document.querySelector('.cart-wrap') || document.querySelector('main') || document.body;
    const c = document.createElement('div');
    c.id = 'cart-items-container';
    c.className = 'cart-items';
    parent.prepend(c);
    return c;
  }

  // preço de pacote (valores fixos)
  const PACK_PRICES = { 1: null /* usará unitPrice */, 2: 230, 3: 330 };

  // retorna menor custo para `qtd` itens usando preços 1/2/3 (1 usa unitPrice)
  function computeBundleTotal(qtd, unitPrice) {
    if (qtd <= 0) return 0;
    const dp = Array(qtd + 1).fill(Infinity);
    dp[0] = 0;
    for (let i = 1; i <= qtd; i++) {
      // pacote 1
      dp[i] = Math.min(dp[i], dp[i - 1] + unitPrice);
      // pacote 2
      if (i >= 2) dp[i] = Math.min(dp[i], dp[i - 2] + PACK_PRICES[2]);
      // pacote 3
      if (i >= 3) dp[i] = Math.min(dp[i], dp[i - 3] + PACK_PRICES[3]);
    }
    return dp[qtd];
  }

  function normalizeText(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

  function renderizarCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    console.log('renderizarCarrinho -> itens:', carrinho);
    const container = criarContainerSeFaltante();
    if (!container) return;

    if (carrinho.length === 0) {
      container.innerHTML = `<p style="color:#666;text-align:center">Seu carrinho está vazio.</p>`;
      atualizarTotais(0,0,0);
      atualizarContador();
      return;
    }

    let subtotal = 0;
    container.innerHTML = '';
    carrinho.forEach((item, idx) => {
      const qty = Number(item.quantidade || 1);
      const estiloNorm = normalizeText(item.estilo || '');
      let lineTotal = 0;
      if (estiloNorm.includes('retro')) {
        lineTotal = Number(item.preco || 180) * qty;
      } else {
        const unitPrice = Number(item.preco || 140);
        lineTotal = computeBundleTotal(qty, unitPrice);
      }
      subtotal += lineTotal;

      const nomePersonal = item.personalizacao?.nome ?? '-';
      const numeroPersonal = item.personalizacao?.numero ?? '-';

      const el = document.createElement('div');
      el.className = 'cart-item';
      el.innerHTML = `
        <img src="${item.foto}" alt="${item.nome}" />
        <div class="item-info">
          <h4>${item.nome}</h4>
          <p>Tam: ${item.tamanho || '-'} | Nome: ${nomePersonal} | Nº: ${numeroPersonal}</p>
        </div>
        <div class="item-right">
          <span class="item-price">R$ ${lineTotal.toFixed(2).replace('.',',')}</span>
          <button class="btn-remove" data-index="${idx}"><i class="fas fa-trash"></i></button>
        </div>
      `;
      container.appendChild(el);
    });

    container.querySelectorAll('.btn-remove').forEach(b => b.addEventListener('click', (ev) => {
      const idx = Number(ev.currentTarget.getAttribute('data-index'));
      removerItem(idx);
    }));

    const freteVal = Number(document.getElementById('frete-val')?.innerText.replace(/[^\d,\.]/g,'')?.replace(',','.') || 0);
    atualizarTotais(subtotal, window.descontoGlobal || 0, window.fretegratis ? 0 : freteVal);
    atualizarContador();
  }

  function removerItem(index) {
    const carrinho = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (index >= 0 && index < carrinho.length) {
      carrinho.splice(index, 1);
      localStorage.setItem(CART_KEY, JSON.stringify(carrinho));
      renderizarCarrinho();
      mostrarToast && mostrarToast('Item removido');
    }
  }

  function formatMoneyBR(n) {
    return 'R$ ' + Number(n || 0).toFixed(2).replace('.', ',');
  }

  function atualizarTotais(subtotal = 0, desconto = 0, frete = 0) {
    const carrinho = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const extra = carrinho.reduce((s, it) => {
      const temNome = it.personalizacao && (it.personalizacao.nome || '').trim() && it.personalizacao.nome !== '-';
      return s + (temNome ? 20 * (it.quantidade || 1) : 0);
    }, 0);
    const total = Math.max(0, subtotal + extra + Number(frete || 0) - Number(desconto || 0));
    const elSub = document.getElementById('subtotal-val');
    const elExtra = document.getElementById('extra-val');
    const elTotal = document.getElementById('total-val');
    if (elSub) elSub.innerText = formatMoneyBR(subtotal);
    if (elExtra) elExtra.innerText = formatMoneyBR(extra);
    if (elTotal) elTotal.innerText = formatMoneyBR(total);
    // retorna para debugging/testes
    return { subtotal, extra, frete, desconto, total };
  }
  window.atualizarTotais = atualizarTotais;

  const VALID_COUPONS = {
    'FUT10': { type: 'percent', value: 10, label: '10% OFF' },
    'DESCONTO20': { type: 'fixed', value: 20, label: 'R$20 OFF' },
    'FRETEGRATIS': { type: 'frete', value: 0, label: 'Frete Grátis' }
    // removidos COMBO2/COMBO3 porque bundles são padrão agora
  };

  function validarCupom(code) {
    if(!code) return null;
    return VALID_COUPONS[code.trim().toUpperCase()] || null;
  }

  function aplicarCupom() {
    const input = document.getElementById('coupon-code');
    const code = input?.value?.trim().toUpperCase() || '';
    const info = validarCupom(code);
    if (!info) {
      mostrarToast && mostrarToast('Cupom inválido');
      window.descontoGlobal = 0;
      window.fretegratis = false;
      localStorage.removeItem('futplus_coupon');
      const subtotal = JSON.parse(localStorage.getItem(CART_KEY) || '[]').reduce((s,i)=> s + (Number(i.preco||0)*(i.quantidade||1)), 0);
      atualizarTotais(subtotal, 0, window.fretegratis ? 0 : Number(document.getElementById('frete-val')?.innerText?.replace(/[^\d,\.]/g,'')?.replace(',','.') || 0));
      return;
    }

    // calcula desconto com base no carrinho
    const carrinho = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const subtotal = carrinho.reduce((s,i)=> s + (Number(i.preco||0)*(i.quantidade||1)), 0);
    let desconto = 0;
    if (info.type === 'percent') desconto = subtotal * (info.value/100);
    if (info.type === 'fixed') desconto = info.value;
    if (info.type === 'frete') {
      window.fretegratis = true;
    } else {
      window.fretegratis = false;
    }

    window.descontoGlobal = Number(desconto.toFixed(2));
    localStorage.setItem('futplus_coupon', JSON.stringify({ code, info, desconto: window.descontoGlobal, fretegratis: !!window.fretegratis }));
    mostrarToast && mostrarToast(`Cupom ${code} aplicado: ${info.label || ''}`);
    const freteVal = window.fretegratis ? 0 : Number(document.getElementById('frete-val')?.innerText?.replace(/[^\d,\.]/g,'')?.replace(',','.') || 0);
    atualizarTotais(subtotal, window.descontoGlobal, freteVal);
    atualizarCupomUI();
  }

  function carregarCupomSalvo() {
    const saved = JSON.parse(localStorage.getItem('futplus_coupon') || 'null');
    if (!saved) return;
    window.descontoGlobal = saved.desconto || 0;
    window.fretegratis = !!saved.fretegratis;
    const input = document.getElementById('coupon-code');
    if (input) input.value = saved.code || '';
    atualizarCupomUI();
    // recalcula totais com cupom carregado
    const subtotal = JSON.parse(localStorage.getItem(CART_KEY) || '[]').reduce((s,i)=> s + (Number(i.preco||0)*(i.quantidade||1)), 0);
    const freteVal = window.fretegratis ? 0 : Number(document.getElementById('frete-val')?.innerText?.replace(/[^\d,\.]/g,'')?.replace(',','.') || 0);
    atualizarTotais(subtotal, window.descontoGlobal || 0, freteVal);
  }

  function atualizarCupomUI() {
    const info = JSON.parse(localStorage.getItem('futplus_coupon') || 'null');
    const el = document.getElementById('discount-val') || document.querySelector('.discount-val');
    if (!el) return;
    if (!info) {
      el.innerText = 'R$ 0,00';
      return;
    }
    el.innerText = (info.info && info.info.type === 'percent') ? `${info.info.value}%` : formatMoneyBR(info.desconto || 0);
  }

  window.addEventListener('load', () => {
    lerEnormalizarCarrinho();
    setTimeout(renderizarCarrinho, 50);
    setTimeout(atualizarContador, 50);
  });

  window.renderizarCarrinho = renderizarCarrinho;
  window.removerItem = removerItem;
  window.atualizarContador = atualizarContador;
})();