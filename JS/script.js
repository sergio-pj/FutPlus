// 1. Configurações iniciais ao carregar a página
window.addEventListener('load', () => {
    atualizarTudo();
    atualizarContador();
});

// 2. Atualiza o Preview da Camisa (Nome, Número e Preço)
function atualizarTudo() {
    const inputNome = document.getElementById('input-nome').value.toUpperCase();
    const inputNumero = document.getElementById('input-numero').value;
    
    const displayNome = document.getElementById('preview-nome');
    const displayNumero = document.getElementById('preview-numero');
    const displayPreco = document.getElementById('total-price');

    displayNome.innerText = inputNome || "NOME";
    displayNumero.innerText = inputNumero || "00";

    // Lógica de Preço: Base 140 + 20 se houver personalização
    if (inputNome.trim() !== "" || inputNumero.trim() !== "") {
        displayPreco.innerText = "R$ 160,00";
    } else {
        displayPreco.innerText = "R$ 140,00";
    }
}

// 3. Trocar Foto (Frente/Costas)
function trocarFoto(src, isCostas) {
    const imgBase = document.getElementById('camisa-base');
    const nome = document.getElementById('preview-nome');
    const numero = document.getElementById('preview-numero');
    
    imgBase.src = src;
    
    // Mostra o texto apenas se for a foto das costas
    nome.style.display = isCostas ? 'block' : 'none';
    numero.style.display = isCostas ? 'block' : 'none';
}

// 4. Seleção de Tamanho
function selecionarTamanho(tamanho, elemento) {
    document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
    elemento.classList.add('active');
    document.getElementById('tamanho-selecionado').value = tamanho;
}

// 5. Função de Adicionar ao Carrinho com POPUP (Toast)
function adicionarAoCarrinho() {
    const nomeCamisa = document.querySelector('h1').innerText;
    const inputNome = document.getElementById('input-nome').value.toUpperCase();
    const inputNumero = document.getElementById('input-numero').value;
    const tamanho = document.getElementById('tamanho-selecionado').value;

    if (!tamanho) {
        alert("⚠️ Por favor, selecione um tamanho!");
        return;
    }

    let precoFinal = inputNome.length > 0 || inputNumero.length > 0 ? 160 : 140;

    const item = {
        nome: nomeCamisa,
        preco: precoFinal,
        tamanho: tamanho,
        personalizacao: { nome: inputNome || "Sem nome", numero: inputNumero || "00" },
        foto: document.getElementById('camisa-base').src
    };

    let carrinho = JSON.parse(localStorage.getItem('futplus_cart')) || [];
    carrinho.push(item);
    localStorage.setItem('futplus_cart', JSON.stringify(carrinho));

    atualizarContador();
    mostrarToast("Manto adicionado ao carrinho!"); // Chama o popup
}

// 6. Popup de Confirmação (Toast)
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

// 7. Atualiza o número no ícone do carrinho
function atualizarContador() {
    let carrinho = JSON.parse(localStorage.getItem('futplus_cart')) || [];
    const contador = document.getElementById('cart-count');
    if (contador) contador.innerText = carrinho.length;
}

function calcularFrete() {
    const cep = document.getElementById('cep-input').value;
    const resultado = document.getElementById('shipping-result');

    if (cep.length < 8) {
        alert("Por favor, digite um CEP válido.");
        return;
    }

    resultado.style.display = 'block';
    // Aqui você pode personalizar a regra (ex: frete grátis para todo Brasil)
    resultado.innerHTML = `
        <p>🚚 Frete para ${cep}: <b>GRÁTIS</b></p>
        <p>🕒 Entrega estimada: 15 a 25 dias úteis.</p>
    `;
}

function checkoutExpresso() {
    // 1. Primeiro adicionamos o item ao carrinho usando a lógica que já criamos
    // Mas vamos fazer uma pequena alteração para não mostrar o "alert" ou "toast" aqui
    const tamanho = document.getElementById('tamanho-selecionado').value;
    
    if (!tamanho) {
        alert("⚠️ Por favor, selecione um tamanho antes de comprar!");
        return;
    }

    // Chamamos a função de adicionar (certifique-se de que ela não tenha um 'return' que trave)
    adicionarAoCarrinho();

    // 2. Redireciona imediatamente para a tela de carrinho
    // Assim o usuário já cai na tela de resumo com o botão do WhatsApp pronto
    window.location.href = "carrinho.html";
}

function comprarAgoraDireto() {
    const tamanho = document.getElementById('tamanho-selecionado').value;
    const nome = document.getElementById('input-nome').value.toUpperCase();
    const numero = document.getElementById('input-numero').value;
    const preco = document.getElementById('total-price').innerText;
    const produtoNome = document.querySelector('h1').innerText;

    if (!tamanho) {
        alert("⚠️ Por favor, selecione um tamanho!");
        return;
    }

    // Cria a mensagem focada apenas NESTE produto
    let mensagem = `🔥 *COMPRA RÁPIDA - FUTPLUS* 🔥%0A%0A`;
    mensagem += `👕 *Produto:* ${produtoNome}%0A`;
    mensagem += `📏 *Tamanho:* ${tamanho}%0A`;
    mensagem += `👤 *Personalização:* ${nome || 'Sem nome'} (${numero || '00'})%0A`;
    mensagem += `💰 *Valor:* ${preco}%0A%0A`;
    mensagem += `_Gostaria de finalizar o pagamento agora!_`;

    const fone = "5511980177729";
    window.open(`https://wa.me/${fone}?text=${mensagem}`, '_blank');
}
