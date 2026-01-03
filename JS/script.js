// ==========================================
// 1. FUNÇÕES ORIGINAIS (PRESERVAR TUDO)
// ==========================================

window.addEventListener('load', async () => {
    atualizarTudo();
    atualizarContador();
    carregarProdutos(); // Acrescentamos apenas esta chamada
    verificarIdProduto();
});

// Verifica se estamos na página de detalhes e carrega o produto do JSON pelo ID
async function verificarIdProduto() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const containerDetalhes = document.querySelector('.product-page');

    if (id && containerDetalhes) {
        try {
            const resposta = await fetch('JS/produtos.json');
            const produtos = await resposta.json();
            const produto = produtos.find(p => p.id == id);
            if (produto) preencherDadosProduto(produto);
        } catch (erro) {
            console.error("Erro ao carregar detalhes:", erro);
        }
    }
}

function preencherDadosProduto(p) {
    // salva produto globalmente para outras funções usarem
    window.produtoAtual = p;

    if(document.querySelector('h1')) document.querySelector('h1').innerText = p.nome;

    // garante elemento .category (cria se não existir)
    let catEl = document.querySelector('.category');
    if (!catEl) {
        catEl = document.createElement('span');
        catEl.className = 'category';
        const priceEl = document.getElementById('total-price');
        if (priceEl && priceEl.parentNode) priceEl.parentNode.insertBefore(catEl, priceEl);
        else document.querySelector('.product-details')?.prepend(catEl);
    }
    catEl.innerText = p.categoria;

    const displayPreco = document.getElementById('total-price');
    if(displayPreco) displayPreco.innerText = `R$ ${p.preco.toFixed(2).replace('.', ',')}`;

    const imgBase = document.getElementById('camisa-base');
    if(imgBase) {
        imgBase.src = p.foto;
        imgBase.setAttribute('data-frente', p.foto); 
    }

    // Seleciona as miniaturas (thumbs)
    const thumbs = document.querySelectorAll('.thumb');
    if(thumbs.length >= 2) {
        // Configura a miniatura da FRENTE
        thumbs[0].src = p.foto;
        thumbs[0].onclick = () => trocarFoto(p.foto, false);
        
        // Configura a miniatura das COSTAS (usando o novo campo do JSON)
        thumbs[1].src = p.fotoCostas || p.foto; // Se não tiver foto costas, repete a frente
        thumbs[1].onclick = () => trocarFoto(p.fotoCostas, true);
    }
    
    // IMPORTANTE: Garante que o nome/número comece escondido (frente)
    const previewNome = document.getElementById('preview-nome');
    const previewNumero = document.getElementById('preview-numero');
    if(previewNome) previewNome.style.display = 'none';
    if(previewNumero) previewNumero.style.display = 'none';

    atualizarTudo();
}

function normalizeText(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function atualizarTudo() {
    const displayPreco = document.getElementById('total-price');
    const categoriaEl = document.querySelector('.category') || document.querySelector('.badge-new');
    const inputNome = document.getElementById('input-nome');
    if (!displayPreco || !categoriaEl || !inputNome) return;

    const nomeTexto = inputNome.value.trim();
    // usa produtoAtual quando disponível
    const categoria = window.produtoAtual?.categoria ? normalizeText(window.produtoAtual.categoria) : normalizeText(categoriaEl.innerText);
    const precoBase = window.produtoAtual?.preco ? Number(window.produtoAtual.preco) : (categoria.includes('retro') ? 180 : 140);

    if (nomeTexto !== "") {
        displayPreco.innerText = `R$ ${(precoBase + 20).toFixed(2).replace('.', ',')}`;
    } else {
        displayPreco.innerText = `R$ ${precoBase.toFixed(2).replace('.', ',')}`;
    }
    atualizarPreview();
}

function trocarFoto(src, isCostas) {
    const imgBase = document.getElementById('camisa-base');
    const nome = document.getElementById('preview-nome');
    const numero = document.getElementById('preview-numero');
    
    if(imgBase) imgBase.src = src;
    
    // Voltando sua lógica original de display
    if(nome) nome.style.display = isCostas ? 'block' : 'none';
    if(numero) numero.style.display = isCostas ? 'block' : 'none';
}

function adicionarAoCarrinho() {
    const tituloEl = document.querySelector('h1');
    const inputNomeEl = document.getElementById('input-nome');
    const inputNumeroEl = document.getElementById('input-numero');
    const tamanhoEl = document.getElementById('tamanho-selecionado');
    const estiloEl = document.querySelector('.category') || document.querySelector('.badge-new');
    const imgBase = document.getElementById('camisa-base');

    if (!tamanhoEl || !tamanhoEl.value) {
        alert("⚠️ Por favor, selecione um tamanho!");
        return;
    }

    const fotoPrincipal = imgBase.getAttribute('data-frente') || imgBase.src;
    const categoriaTexto = window.produtoAtual?.categoria ? normalizeText(window.produtoAtual.categoria) : normalizeText(estiloEl ? estiloEl.innerText : '');
    const eRetro = categoriaTexto.includes('retro');
    const precoSalvar = window.produtoAtual?.preco ? Number(window.produtoAtual.preco) : (eRetro ? 180 : 140);

    const item = {
        nome: tituloEl ? tituloEl.innerText : "Produto",
        preco: precoSalvar,
        foto: fotoPrincipal, 
        estilo: eRetro ? 'retro' : 'outros',
        tamanho: tamanhoEl.value,
        personalizacao: { 
            nome: inputNomeEl.value.toUpperCase() || "", 
            numero: inputNumeroEl.value || "" 
        },
        quantidade: 1
    };

    let carrinho = JSON.parse(localStorage.getItem('futplus_cart')) || [];
    carrinho.push(item);
    localStorage.setItem('futplus_cart', JSON.stringify(carrinho));
    
    atualizarContador();
    mostrarToast("Manto adicionado ao carrinho!");
}

function mostrarToast(mensagem) {
    const toast = document.createElement('div');
    toast.className = 'toast-confirmacao';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${mensagem}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function atualizarContador() {
    let carrinho = JSON.parse(localStorage.getItem('futplus_cart')) || [];
    const contador = document.getElementById('cart-count');
    if (contador) contador.innerText = carrinho.length;
}

function selecionarTamanho(tamanho, elemento) {
    document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
    elemento.classList.add('active');
    const inputOculto = document.getElementById('tamanho-selecionado');
    if(inputOculto) inputOculto.value = tamanho;
}

function calcularFrete() {
    const cep = document.getElementById('cep-input').value;
    if (!cep) { alert("Por favor, digite um CEP."); return; }
    // usa a função central em JS/cep.js
    calcularFretePorCep(cep).catch(err => console.error(err));
}

function checkoutExpresso() {
    const tamanhoEl = document.getElementById('tamanho-selecionado');
    if (!tamanhoEl || !tamanhoEl.value) { alert("⚠️ Selecione um tamanho!"); return; }
    adicionarAoCarrinho();
    window.location.href = "carrinho.html";
}

function comprarAgoraDireto() {
    const tamanhoEl = document.getElementById('tamanho-selecionado');
    if (!tamanhoEl || !tamanhoEl.value) { alert("⚠️ Selecione um tamanho!"); return; }

    const nome = document.getElementById('input-nome').value.toUpperCase();
    const numero = document.getElementById('input-numero').value;
    const preco = document.getElementById('total-price').innerText;
    const produtoNome = document.querySelector('h1').innerText;

    let mensagem = `🔥 *COMPRA RÁPIDA - FUTPLUS* 🔥%0A%0A`;
    mensagem += `👕 *Produto:* ${produtoNome}%0A`;
    mensagem += `📏 *Tamanho:* ${tamanhoEl.value}%0A`;
    mensagem += `👤 *Personalização:* ${nome || 'Sem nome'} (${numero || '00'})%0A`;
    mensagem += `💰 *Valor:* ${preco}%0A%0A_Gostaria de finalizar o pagamento agora!_`;

    window.open(`https://wa.me/5511980177729?text=${mensagem}`, '_blank');
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
    if (!grid) return;

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
                    <a href="produto_detalhes.html?id=${p.id}" class="btn-details">VER DETALHES</a>
                </div>
            </div>
        `).join('');
    } catch (erro) {
        console.error("Erro ao carregar vitrine:", erro);
    }
}

function atualizarPreview() {
    const nomeInput = document.getElementById('input-nome');
    const numeroInput = document.getElementById('input-numero');
    const previewNome = document.getElementById('preview-nome');
    const previewNumero = document.getElementById('preview-numero');

    if (previewNome && nomeInput) previewNome.innerText = nomeInput.value.toUpperCase() || "NOME";
    if (previewNumero && numeroInput) previewNumero.innerText = numeroInput.value || "00";
}

// Opcional: Garante que ao carregar a página a camisa já mostre os padrões
window.onload = atualizarPreview;