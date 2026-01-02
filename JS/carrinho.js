window.addEventListener('load', renderizarCarrinho);

let descontoGlobal = 0; // Armazena o desconto do cupom

function renderizarCarrinho() {
    const container = document.getElementById('cart-items-container');
    const carrinho = JSON.parse(localStorage.getItem('futplus_cart')) || [];
    let subtotal = 0;

    if (carrinho.length === 0) {
        container.innerHTML = `<p style="color: #666; text-align: center; grid-column: 1/-1;">Seu carrinho está vazio.</p>`;
        atualizarTotais(0, 0);
        return;
    }

    container.innerHTML = "";
    carrinho.forEach((item, index) => {
        // Garante que o preço base segue sua nova regra (200 para retrô, 160 para outros)
        let precoBase = (item.estilo === 'retro') ? 200 : 160;
        subtotal += precoBase;

        container.innerHTML += `
            <div class="cart-item">
                <img src="${item.foto}" alt="Produto">
                <div class="item-info">
                    <h4>${item.nome}</h4>
                    <p>Tam: ${item.tamanho} | Nome: ${item.personalizacao.nome} | Nº: ${item.personalizacao.numero}</p>
                    <span class="item-price">R$ ${precoBase.toFixed(2)}</span>
                </div>
                <button class="btn-remove" onclick="removerItem(${index})"><i class="fas fa-trash"></i></button>
            </div>`;
    });

    atualizarTotais(subtotal, descontoGlobal);
}

function removerItem(index) {
    let carrinho = JSON.parse(localStorage.getItem('futplus_cart'));
    carrinho.splice(index, 1);
    localStorage.setItem('futplus_cart', JSON.stringify(carrinho));
    descontoGlobal = 0; // Reseta o cupom se remover itens para evitar erro
    renderizarCarrinho();
}

function atualizarTotais(subtotal, desconto) {
    const totalFinal = subtotal - desconto;
    
    // Atualiza os campos do seu HTML
    if(document.getElementById('subtotal-val')) document.getElementById('subtotal-val').innerText = `R$ ${subtotal.toFixed(2)}`;
    if(document.getElementById('total-val')) {
        const el = document.getElementById('total-val');
        el.innerText = `R$ ${totalFinal.toFixed(2)}`;
        el.style.color = desconto > 0 ? "#39ff14" : "white";
    }
}

function aplicarCupom() {
    const cupomInput = document.getElementById('cupom').value.toUpperCase();
    const carrinho = JSON.parse(localStorage.getItem('futplus_cart')) || [];
    
    // Filtra apenas camisas que NÃO são Retrô para a promoção
    const itensPromo = carrinho.filter(item => item.estilo !== 'retro');
    const qtdPromo = itensPromo.length;

    if (cupomInput === "COMBO2" && qtdPromo === 2) {
        // 2 camisas de 160 = 320. Para chegar em 230, desconto de 90.
        descontoGlobal = 90;
        alert("✅ Cupom COMBO2 aplicado! Valor base: R$ 230,00");
    } 
    else if (cupomInput === "COMBO3" && qtdPromo >= 3) {
        // 3 camisas de 160 = 480. Para chegar em 330, desconto de 150.
        descontoGlobal = 150;
        alert("✅ Cupom COMBO3 aplicado! Valor base: R$ 330,00");
    } 
    else {
        alert("❌ Cupom inválido para esses itens ou quantidade. (Retrô não incluso)");
        descontoGlobal = 0;
    }
    renderizarCarrinho();
}

function checkoutWhatsApp() {
    const carrinho = JSON.parse(localStorage.getItem('futplus_cart')) || [];
    if (carrinho.length === 0) return alert("Carrinho vazio!");

    let subtotal = 0;
    let mensagem = "🔥 *NOVO PEDIDO - FUTPLUS* 🔥%0A%0A";

    carrinho.forEach(item => {
        let precoItem = (item.estilo === 'retro') ? 200 : 160;
        mensagem += `👕 *${item.nome}*%0A📏 Tam: ${item.tamanho}%0A👤 Nome: ${item.personalizacao.nome} | 🔢 Nº: ${item.personalizacao.numero}%0A💰 R$ ${precoItem.toFixed(2)}%0A%0A`;
        subtotal += precoItem;
    });

    const totalFinal = subtotal - descontoGlobal;
    if (descontoGlobal > 0) mensagem += `*Desconto Cupom:* -R$ ${descontoGlobal.toFixed(2)}%0A`;
    mensagem += `*TOTAL FINAL: R$ ${totalFinal.toFixed(2)}*`;

    window.open(`https://wa.me/5511980177729?text=${mensagem}`, '_blank');
}