// ==========================================
// 1. FUNÇÕES ORIGINAIS (PRESERVAR TUDO)
// ==========================================

window.addEventListener('load', () => {
    atualizarTudo();
    atualizarContador();
    carregarProdutos(); // Acrescentamos apenas esta chamada
});

function atualizarTudo() {
    const displayPreco = document.getElementById('total-price');
    const categoria = document.querySelector('.category').innerText.toLowerCase();
    const inputNome = document.getElementById('input-nome').value.trim();
    
    // Define o preço base (Retrô 200, outros 160)
    let precoComPersonalizacao = categoria.includes('retro') ? 200 : 160;
    let precoSemPersonalizacao = precoComPersonalizacao - 20;

    if (displayPreco) {
        if (inputNome !== "") {
            displayPreco.innerText = `R$ ${precoComPersonalizacao.toFixed(2).replace('.', ',')}`;
        } else {
            displayPreco.innerText = `R$ ${precoSemPersonalizacao.toFixed(2).replace('.', ',')}`;
        }
    }
}

function trocarFoto(src, isCostas) {
    const imgBase = document.getElementById('camisa-base');
    const nome = document.getElementById('preview-nome');
    const numero = document.getElementById('preview-numero');
    if(imgBase) imgBase.src = src;
    if(nome) nome.style.display = isCostas ? 'block' : 'none';
    if(numero) numero.style.display = isCostas ? 'block' : 'none';
}

function selecionarTamanho(tamanho, elemento) {
    document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
    elemento.classList.add('active');
    document.getElementById('tamanho-selecionado').value = tamanho;
}

function adicionarAoCarrinho() {
    const tituloEl = document.querySelector('h1');
    const inputNomeEl = document.getElementById('input-nome');
    const inputNumeroEl = document.getElementById('input-numero');
    const tamanhoEl = document.getElementById('tamanho-selecionado');
    const estiloEl = document.querySelector('.category');
    
    // CAPTURA A FOTO ATUAL DA CAMISA
    const imgBase = document.getElementById('camisa-base');
    const fotoCamisa = imgBase ? imgBase.getAttribute('src') : ""; 

    if (!tamanhoEl || !tamanhoEl.value) {
        alert("⚠️ Por favor, selecione um tamanho!");
        return;
    }

    const item = {
        nome: tituloEl ? tituloEl.innerText : "Produto",
        preco: (estiloEl && estiloEl.innerText.toLowerCase().includes('retro')) ? 200 : 160,
        foto: fotoCamisa, // SALVA O CAMINHO DA IMAGEM AQUI
        estilo: (estiloEl && estiloEl.innerText.toLowerCase().includes('retro')) ? 'retro' : 'outros',
        tamanho: tamanhoEl.value,
        personalizacao: { 
            nome: inputNomeEl.value.toUpperCase() || "Sem nome", 
            numero: inputNumeroEl.value || "00" 
        }
    };

    let carrinho = JSON.parse(localStorage.getItem('futplus_cart')) || [];
    carrinho.push(item);
    localStorage.setItem('futplus_cart', JSON.stringify(carrinho));
    atualizarContador();
    mostrarToast("Manto adicionado!");
}
function mostrarToast(mensagem) {
    const toast = document.createElement('div');
    toast.className = 'toast-confirmacao';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${mensagem}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function atualizarContador() {
    let carrinho = JSON.parse(localStorage.getItem('futplus_cart')) || [];
    const contador = document.getElementById('cart-count');
    if (contador) contador.innerText = carrinho.length;
}

function calcularFrete() {
    const cep = document.getElementById('cep-input').value;
    const resultado = document.getElementById('shipping-result');
    if (cep.length < 8) { alert("Por favor, digite um CEP válido."); return; }
    resultado.style.display = 'block';
    resultado.innerHTML = `<p>🚚 Frete para ${cep}: <b>GRÁTIS</b></p><p>🕒 Entrega estimada: 15 a 25 dias úteis.</p>`;
}

function checkoutExpresso() {
    const tamanho = document.getElementById('tamanho-selecionado').value;
    if (!tamanho) { alert("⚠️ Por favor, selecione um tamanho antes de comprar!"); return; }
    adicionarAoCarrinho();
    window.location.href = "carrinho.html";
}

function comprarAgoraDireto() {
    const tamanho = document.getElementById('tamanho-selecionado').value;
    const nome = document.getElementById('input-nome').value.toUpperCase();
    const numero = document.getElementById('input-numero').value;
    const preco = document.getElementById('total-price').innerText;
    const produtoNome = document.querySelector('h1').innerText;

    if (!tamanho) { alert("⚠️ Por favor, selecione um tamanho!"); return; }

    let mensagem = `🔥 *COMPRA RÁPIDA - FUTPLUS* 🔥%0A%0A`;
    mensagem += `👕 *Produto:* ${produtoNome}%0A`;
    mensagem += `📏 *Tamanho:* ${tamanho}%0A`;
    mensagem += `👤 *Personalização:* ${nome || 'Sem nome'} (${numero || '00'})%0A`;
    mensagem += `💰 *Valor:* ${preco}%0A%0A_Gostaria de finalizar o pagamento agora!_`;

    const fone = "5511980177729";
    window.open(`https://wa.me/${fone}?text=${mensagem}`, '_blank');
}

// ==========================================
// 2. LÓGICA DE FILTROS E BUSCA (MANTER IGUAL)
// ==========================================

function filtrarProdutos() {
    const cards = document.querySelectorAll('.product-card');
    const checkboxes = document.querySelectorAll('.filter-section input[type="checkbox"]');
    const selectPreco = document.querySelector('.filter-section select');
    const inputBusca = document.querySelector('.search-bar input');

    const estilosSelecionados = [];
    checkboxes.forEach((cb) => {
        if (cb.checked) {
            const nomeFiltro = cb.parentElement.innerText.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            estilosSelecionados.push(nomeFiltro);
        }
    });

    const filtroPreco = selectPreco.value;
    const termoBusca = inputBusca ? inputBusca.value.toLowerCase() : "";

    cards.forEach(card => {
        const estiloCard = card.getAttribute('data-estilo').toLowerCase();
        const precoCard = parseFloat(card.getAttribute('data-preco'));
        const nomeCard = card.querySelector('h4').innerText.toLowerCase();

        const atendeEstilo = estilosSelecionados.length === 0 || estilosSelecionados.some(estilo => estiloCard.includes(estilo));
        const atendePreco = (filtroPreco === "Todos os Preços") || 
                            (filtroPreco === "Até R$ 180" && precoCard <= 180) || 
                            (filtroPreco === "Acima de R$ 180" && precoCard > 180);
        const atendeBusca = nomeCard.includes(termoBusca);

        card.style.display = (atendeEstilo && atendePreco && atendeBusca) ? "block" : "none";
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const btnFiltro = document.getElementById('btn-toggle-filtros');
    const sidebar = document.getElementById('sidebar-filtros');
    const btnAplicar = document.querySelector('.btn-apply-filters');
    const inputBusca = document.querySelector('.search-bar input');

    if (btnFiltro && sidebar) {
        btnFiltro.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            btnFiltro.innerHTML = sidebar.classList.contains('active') ? 
                '<i class="fas fa-times"></i> FECHAR FILTROS' : '<i class="fas fa-filter"></i> FILTRAR PRODUTOS';
        });
    }

    if (btnAplicar) btnAplicar.addEventListener('click', filtrarProdutos);
    if (inputBusca) inputBusca.addEventListener('input', filtrarProdutos);
});

// ==========================================
// 3. NOVA FUNÇÃO DE AUTOMAÇÃO (ACRESCENTAR)
// ==========================================

async function carregarProdutos() {
    const grid = document.querySelector('.products-grid');
    if (!grid) return; // Se não estiver na página de produtos, não faz nada

    try {
        const resposta = await fetch('JS/produtos.json');
        const produtos = await resposta.json();

        grid.innerHTML = produtos.map(p => `
            <div class="product-card" data-estilo="${p.estilo}" data-preco="${p.preco}">
                <div class="product-img">
                    <img src="${p.foto}" alt="${p.nome}">
                    ${p.badge ? `<span class="badge-card">${p.badge}</span>` : ''}
                </div>
                <div class="product-info">
                    <span class="category">${p.categoria}</span>
                    <h4>${p.nome}</h4>
                    <div class="rating">
                        <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i> <span>(50)</span>
                    </div>
                    <p class="price">R$ ${p.preco.toFixed(2).replace('.', ',')}</p>
                    <a href="${p.link}" class="btn-details">VER DETALHES</a>
                </div>
            </div>
        `).join('');
    } catch (erro) {
        console.log("Aviso: Arquivo JSON não encontrado ou erro no fetch. Mantendo HTML fixo.");
    }
}

function atualizarPreview() {
    // 1. Pega os valores dos inputs de texto
    const nomeInput = document.getElementById('input-nome');
    const numeroInput = document.getElementById('input-numero');

    const nome = nomeInput ? nomeInput.value.toUpperCase() : "";
    const numero = numeroInput ? numeroInput.value : "";

    // 2. Pega os elementos que estão DENTRO do SVG na camisa
    const previewNome = document.getElementById('preview-nome');
    const previewNumero = document.getElementById('preview-numero');

    // 3. Aplica o texto usando textContent (específico para SVG)
    if (previewNome) {
        // Se o campo estiver vazio, volta para "NOME"
        previewNome.textContent = nome || "NOME";
    }
    
    if (previewNumero) {
        // Se o campo estiver vazio, volta para "10" (ou 00)
        previewNumero.textContent = numero || "10";
    }

    // 4. Chama a sua função de preço para atualizar o valor total (+ R$ 20,00)
    if (typeof atualizarTudo === "function") {
        atualizarTudo();
    }
}

// Opcional: Garante que ao carregar a página a camisa já mostre os padrões
window.onload = atualizarPreview;