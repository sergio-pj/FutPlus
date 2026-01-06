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
        dp[i] = Math.min(dp[i], dp[i - 1] + unitPrice);
        if (i >= 2) dp[i] = Math.min(dp[i], dp[i - 2] + PACK_PRICES[2]);
        if (i >= 3) dp[i] = Math.min(dp[i], dp[i - 3] + PACK_PRICES[3]);
      }
      return dp[qtd];
    }

    function normalizeText(s) {
      return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function renderizarCarrinho() {
      const carrinho = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      const container = criarContainerSeFaltante();
      if (!container) return;

      if (carrinho.length === 0) {
        container.innerHTML = `<p style="color:#666;text-align:center">Seu carrinho está vazio.</p>`;
        // Se o carrinho esvaziar, resetamos o desconto global
        window.descontoGlobal = 0;
        window.cupomAplicado = "Nenhum";
        atualizarTotais(0,0,0);
        atualizarContador();
        return;
      }

      let subtotal = 0;
      container.innerHTML = '';
      carrinho.forEach((item, idx) => {
        const qty = Number(item.quantidade || 1);
        const estilo = (item.estilo || '').toLowerCase();
        let lineTotal = 0;
        
        if (estilo.includes('retro')) {
          lineTotal = 180 * qty;
        } else {
          lineTotal = computeBundleTotal(qty, 140);
        }
        subtotal += lineTotal;

        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
          <img src="${item.foto}" alt="${item.nome}" />
          <div class="item-info">
            <h4>${item.nome}</h4>
            <p>Tam: ${item.tamanho} | Nome: ${item.personalizacao.nome} | Nº: ${item.personalizacao.numero}</p>
          </div>
          <div class="item-right">
            <span class="item-price">R$ ${lineTotal.toFixed(2).replace('.', ',')}</span>
            <button class="btn-remove" onclick="removerItem(${idx})"><i class="fas fa-trash"></i></button>
          </div>
        `;
        container.appendChild(el);
      });

      const freteVal = 0; 
      atualizarTotais(subtotal, window.descontoGlobal || 0, freteVal);
      atualizarContador();
    }

    window.removerItem = function(index) {
      let carrinho = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      
      if (index >= 0 && index < carrinho.length) {
        carrinho.splice(index, 1);
        localStorage.setItem(CART_KEY, JSON.stringify(carrinho));

        // LÓGICA DE VALIDAÇÃO DO CUPOM APÓS REMOÇÃO
        const qtdNormal = carrinho.filter(i => !i.estilo.toLowerCase().includes('retro')).length;
        const cupomAtivo = window.cupomAplicado || "";

        if (cupomAtivo.includes("COMBO3") && qtdNormal < 3) {
            window.descontoGlobal = 0;
            window.cupomAplicado = "Nenhum";
            console.log("Cupom COMBO3 removido: requisitos não atendidos.");
        } 
        else if (cupomAtivo.includes("COMBO2") && qtdNormal < 2) {
            window.descontoGlobal = 0;
            window.cupomAplicado = "Nenhum";
            console.log("Cupom COMBO2 removido: requisitos não atendidos.");
        }

        renderizarCarrinho();
      }
    };

    function formatMoneyBR(n) {
      return 'R$ ' + Number(n || 0).toFixed(2).replace('.', ',');
    }

    function atualizarTotais(subtotal, desconto, frete) {
      const carrinho = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      const extra = carrinho.reduce((s, it) => {
        const temNome = it.personalizacao && it.personalizacao.nome !== '-';
        return s + (temNome ? 20 : 0);
      }, 0);

      const totalFinal = subtotal + extra + frete - desconto;

      if(document.getElementById('subtotal-val')) document.getElementById('subtotal-val').innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
      if(document.getElementById('extra-val')) document.getElementById('extra-val').innerText = `R$ ${extra.toFixed(2).replace('.', ',')}`;
      if(document.getElementById('total-val')) document.getElementById('total-val').innerText = `R$ ${totalFinal.toFixed(2).replace('.', ',')}`;
    }

    window.aplicarCupom = function() {
      const code = document.getElementById('cupom')?.value?.trim().toUpperCase();
      const carrinho = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      const qtdNormal = carrinho.filter(i => !i.estilo.includes('retro')).length;

      if (code === 'FUT10') {
          const sub = parseFloat(document.getElementById('subtotal-val').innerText.replace('R$', '').replace(',', '.'));
          window.descontoGlobal = sub * 0.10;
          window.cupomAplicado = "FUT10 (10%)";
          alert("Cupom de 10% aplicado!");
      } 
      else if (code === 'COMBO2' && qtdNormal >= 2) {
          window.descontoGlobal = 50; // Exemplo: de 280 por 230
          window.cupomAplicado = "COMBO2 (Promoção 2 camisas)";
          alert("Desconto do Combo 2 Camisas aplicado!");
      }
      else if (code === 'COMBO3' && qtdNormal >= 3) {
          window.descontoGlobal = 90; // Exemplo: de 420 por 330
          window.cupomAplicado = "COMBO3 (Promoção 3 camisas)";
          alert("Desconto do Combo 3 Camisas aplicado!");
      }
      else {
          alert("Cupom inválido ou requisitos não atendidos.");
          window.descontoGlobal = 0;
          window.cupomAplicado = "Nenhum";
      }
      renderizarCarrinho();
    };

    window.checkoutWhatsApp = function() {
        const carrinho = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        if (carrinho.length === 0) return alert("Carrinho vazio!");

        const total = document.getElementById('total-val').innerText;
        const subtotal = document.getElementById('subtotal-val').innerText;
        
        let msg = `⚽ *NOVO PEDIDO - FUTPLUS* ⚽%0A%0A`;

        carrinho.forEach((item, i) => {
            msg += `*${i+1}. ${item.nome}*%0A`;
            msg += `   - Tam: ${item.tamanho}%0A`;
            msg += `   - Personalização: ${item.personalizacao.nome} (${item.personalizacao.numero})%0A%0A`;
        });

        msg += `*TOTAL FINAL:* ${total}%0A`;
        window.open(`https://wa.me/5511980177729?text=${msg}`, '_blank');
    };

    window.addEventListener('load', () => {
      lerEnormalizarCarrinho();
      setTimeout(renderizarCarrinho, 50);
      setTimeout(atualizarContador, 50);
    });

    window.renderizarCarrinho = renderizarCarrinho;
    window.removerItem = removerItem;
    window.atualizarContador = atualizarContador;
    window.atualizarTotais = atualizarTotais;
    
    // Exporta para namespace FutPlus
    window.FutPlus = window.FutPlus || {};
    window.FutPlus.lerEnormalizarCarrinho = lerEnormalizarCarrinho;
    window.FutPlus.criarContainerSeFaltante = criarContainerSeFaltante;
    window.FutPlus.computeBundleTotal = computeBundleTotal;
    window.FutPlus.PACK_PRICES = PACK_PRICES;
    window.FutPlus.removerItem = window.removerItem;
    window.FutPlus.renderizarCarrinho = renderizarCarrinho;
    window.FutPlus.atualizarContador = atualizarContador;
    window.FutPlus.atualizarTotais = atualizarTotais;
    window.FutPlus.aplicarCupom = window.aplicarCupom;
    window.FutPlus.checkoutWhatsApp = window.checkoutWhatsApp;
})();