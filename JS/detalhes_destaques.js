// ==========================================
// CONFIGURAÇÃO EXCLUSIVA PARA DESTAQUES
// ==========================================

// 1. Declare a variável no topo, fora de tudo
let fotoFrenteGlobal = ""; 

window.addEventListener('load', () => {
    const imgBase = document.getElementById('camisa-base');
    // Pegamos o atributo 'data-frente' se existir, senão pegamos o src atual
    if(imgBase) {
        fotoFrenteGlobal = imgBase.getAttribute('data-frente') || imgBase.src;
    }

    atualizarContador();
    atualizarTudo();
});

// helper para normalizar texto (remove acentos, lowercase)
function normalizeText(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function atualizarTudo() {
    const displayPreco = document.getElementById('total-price');
    const categoriaEl = document.querySelector('.category');
    const inputNome = document.getElementById('input-nome');

    if (!displayPreco || !categoriaEl || !inputNome) return;

    const categoria = normalizeText(categoriaEl.innerText);
    const nomeTexto = inputNome.value.trim();
    
    // Regra: Retrô 180, Normais 140
    let precoBase = categoria.includes('retro') ? 180 : 140;
    
    // Exibe base + R$20 quando houver nome
    if (nomeTexto !== "") {
        displayPreco.innerText = `R$ ${(precoBase + 20).toFixed(2).replace('.', ',')}`;
    } else {
        displayPreco.innerText = `R$ ${precoBase.toFixed(2).replace('.', ',')}`;
    }

    atualizarPreview();
}

function atualizarPreview() {
    const nomeInput = document.getElementById('input-nome');
    const numeroInput = document.getElementById('input-numero');
    const previewNome = document.getElementById('preview-nome');
    const previewNumero = document.getElementById('preview-numero');

    if (previewNome && nomeInput) {
        previewNome.textContent = nomeInput.value.toUpperCase() || "NOME";
    }
    if (previewNumero && numeroInput) {
        previewNumero.textContent = numeroInput.value || "00";
    }
}



function trocarFoto(src, isCostas) {
    const imgBase = document.getElementById('camisa-base');
    const previewNome = document.getElementById('preview-nome');
    const previewNumero = document.getElementById('preview-numero');
    
    if(imgBase) imgBase.src = src;
    
    // Controla a visibilidade do Nome/Número no SVG
    if(previewNome) previewNome.style.display = isCostas ? 'block' : 'none';
    if(previewNumero) previewNumero.style.display = isCostas ? 'block' : 'none';
}

// Funções de tamanho e frete (copiadas do original para não quebrar)
function selecionarTamanho(tamanho, elemento) {
    document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
    elemento.classList.add('active');
    document.getElementById('tamanho-selecionado').value = tamanho;
}

function calcularFrete() {
    const cep = document.getElementById('cep-input').value;
    if (!cep) { alert("Por favor, digite um CEP válido."); return; }

    // pega o preço exibido e converte para número
    const precoTxt = document.getElementById('total-price')?.innerText || 'R$ 0,00';
    const precoNum = Number(precoTxt.replace(/[R$\s\.]/g,'').replace(',', '.')) || 0;

    calcularFretePorCep(cep, { subtotal: precoNum }).catch(err => alert(err.message || 'Erro ao calcular frete'));
}

// Checkout para WhatsApp
function comprarAgoraDireto() {
    const tamanho = document.getElementById('tamanho-selecionado').value;
    if (!tamanho) { alert("Selecione um tamanho!"); return; }

    const nome = document.getElementById('input-nome').value.toUpperCase();
    const numero = document.getElementById('input-numero').value;
    const preco = document.getElementById('total-price').innerText;
    const produto = document.querySelector('h1').innerText;

    let msg = `🔥 *COMPRA DESTAQUE* 🔥%0A%0A*${produto}*%0A*Tam:* ${tamanho}%0A*Personalização:* ${nome || 'Sem nome'} (${numero || '00'})%0A*Valor:* ${preco}`;
    window.open(`https://wa.me/5511980177729?text=${msg}`, '_blank');
}


// ==========================================
// CÓDIGO ADICIONADO PARA CARREGAMENTO DO PRODUTO
// ==========================================
(async function loadProductFromQuery() {
  const params = new URLSearchParams(location.search);
  const id = Number(params.get('id'));
  if (!id) return;

  const resp = await fetch('JS/produtos.json');
  const produtos = await resp.json();
  const prod = produtos.find(p => p.id === id);
  if (!prod) return;

  document.querySelector('.product-details h1').textContent = prod.nome;
  document.getElementById('total-price').textContent = `R$ ${prod.preco.toFixed(2).replace('.',',')}`;
  document.getElementById('camisa-base').src = prod.fotoCostas;

  const thumbs = document.querySelector('.thumbnail-container');
  thumbs.innerHTML = `
    <img src="${prod.foto}" class="thumb" onclick="trocarFoto('${prod.foto}', false)">
    <img src="${prod.fotoCostas}" class="thumb" onclick="trocarFoto('${prod.fotoCostas}', true)">
  `;

  window.produtoAtual = prod;
})();

function adicionarAoCarrinho() {
  const tamanho = document.getElementById('tamanho-selecionado').value || 'M';
  const nome = document.getElementById('input-nome').value.trim();
  const numero = document.getElementById('input-numero').value;
  const titulo = document.querySelector('.product-details h1')?.innerText || 'Produto';
  // Determina estilo (retrô x normal)
  const estiloEl = document.querySelector('.product-details .category');
  const categoriaTexto = normalizeText(estiloEl ? estiloEl.innerText : '');
  const eRetro = categoriaTexto.includes('retro');
  let precoSalvar = eRetro ? 180 : 140;
  const item = {
    id: Date.now(),
    nome: titulo,
    preco: precoSalvar,
    foto: document.getElementById('camisa-base')?.src || '',
    estilo: eRetro ? 'retro' : 'normal',
    tamanho,
    personalizacao: { nome: nome || '-', numero: numero || '-' },
    quantidade: 1
  };

  const CART_KEY = 'futplus_cart';
  const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  cart.push(item);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));

  mostrarToast('Adicionado ao carrinho');
  atualizarContador();
}

// Função auxiliar para o contador (copiada para manter o arquivo independente)
function atualizarContador() {
    let carrinho = JSON.parse(localStorage.getItem('futplus_cart')) || [];
    const contador = document.getElementById('cart-count');
    if (contador) contador.innerText = carrinho.length;
}

// Função auxiliar para o Toast
function mostrarToast(mensagem) {
    const toast = document.createElement('div');
    toast.className = 'toast-confirmacao';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${mensagem}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}