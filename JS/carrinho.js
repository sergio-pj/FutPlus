window.addEventListener('load', renderizarCarrinho);

function renderizarCarrinho() {
    const container = document.getElementById('cart-items-container');
    const carrinho = JSON.parse(localStorage.getItem('futplus_cart')) || [];
    let total = 0;

    if (carrinho.length === 0) {
        container.innerHTML = `<p style="color: #666; text-align: center; grid-column: 1/-1;">Seu carrinho está vazio.</p>`;
        atualizarTotais(0);
        return;
    }

    container.innerHTML = "";
    carrinho.forEach((item, index) => {
        total += item.preco;
        container.innerHTML += `
            <div class="cart-item">
                <img src="${item.foto}" alt="Produto">
                <div class="item-info">
                    <h4>${item.nome}</h4>
                    <p>Tam: ${item.tamanho} | Nome: ${item.personalizacao.nome} | Nº: ${item.personalizacao.numero}</p>
                    <span class="item-price">R$ ${item.preco.toFixed(2)}</span>
                </div>
                <button class="btn-remove" onclick="removerItem(${index})"><i class="fas fa-trash"></i></button>
            </div>`;
    });
    atualizarTotais(total);
}

function removerItem(index) {
    let carrinho = JSON.parse(localStorage.getItem('futplus_cart'));
    carrinho.splice(index, 1);
    localStorage.setItem('futplus_cart', JSON.stringify(carrinho));
    renderizarCarrinho();
}

function atualizarTotais(total) {
    if(document.getElementById('subtotal-val')) document.getElementById('subtotal-val').innerText = `R$ ${total.toFixed(2)}`;
    if(document.getElementById('total-val')) document.getElementById('total-val').innerText = `R$ ${total.toFixed(2)}`;
}

function checkoutWhatsApp() {
    const carrinho = JSON.parse(localStorage.getItem('futplus_cart')) || [];
    if (carrinho.length === 0) return alert("Carrinho vazio!");

    let mensagem = "🔥 *NOVO PEDIDO - FUTPLUS* 🔥%0A%0A";
    let total = 0;

    carrinho.forEach(item => {
        mensagem += `👕 *${item.nome}*%0A📏 Tam: ${item.tamanho} | 👤 Nome: ${item.personalizacao.nome} | 🔢 Nº: ${item.personalizacao.numero}%0A💰 R$ ${item.preco.toFixed(2)}%0A%0A`;
        total += item.preco;
    });

    mensagem += `*TOTAL: R$ ${total.toFixed(2)}*`;
    window.open(`https://wa.me/5511980177729?text=${mensagem}`, '_blank');
}

let descontoAplicado = 0; // Variável global para controlar o desconto

function aplicarCupom() {
    const cupomInput = document.getElementById('cupom').value.toUpperCase();
    const subtotal = calcularSubtotalAtual(); // Função auxiliar para pegar o valor sem desconto
    const totalDisplay = document.getElementById('total-val');
    
    // Configuração dos cupons
    const cuponsValidos = {
        'FUT10': 0.10,      // 10% de desconto
        'BEMVINDO': 0.15,   // 15% de desconto
        'PRIMEIRAFUT': 20   // R$ 20,00 fixos de desconto
    };

    if (cuponsValidos[cupomInput]) {
        let valorDesconto = cuponsValidos[cupomInput];
        
        // Verifica se o desconto é percentual ou fixo
        if (valorDesconto < 1) {
            descontoAplicado = subtotal * valorDesconto;
        } else {
            descontoAplicado = valorDesconto;
        }

        const novoTotal = subtotal - descontoAplicado;
        
        // Atualiza a tela
        totalDisplay.innerText = `R$ ${novoTotal.toFixed(2)}`;
        totalDisplay.style.color = "#39ff14"; // Fica verde neon para destacar
        
        alert(`✅ Cupom ${cupomInput} aplicado! Desconto de R$ ${descontoAplicado.toFixed(2)}`);
    } else {
        alert("❌ Cupom inválido ou expirado.");
        descontoAplicado = 0;
        renderizarCarrinho(); // Reseta para o valor original
    }
}

// Função auxiliar para calcular o total bruto dos itens no localStorage
function calcularSubtotalAtual() {
    const carrinho = JSON.parse(localStorage.getItem('futplus_cart')) || [];
    return carrinho.reduce((acc, item) => acc + item.preco, 0);
}

function calcularFreteCarrinho() {
    const cep = document.getElementById('cep-cart').value;
    const resultado = document.getElementById('result-cart');

    if (cep.length < 8) return alert("CEP inválido");

    resultado.style.display = 'block';
    resultado.innerHTML = `<i class="fas fa-check"></i> Frete <b>GRÁTIS</b> para sua região!`;
}