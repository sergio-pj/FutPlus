/* Namespace bridge: agrupa funções existentes sob window.FutPlus
   Mantém aliases globais para compatibilidade com chamadas inline em HTML. */
(function(){
  if (window.FutPlus) return;
  window.FutPlus = window.FutPlus || {};

  const fnNames = [
    'adicionarAoCarrinho','atualizarContador','trocarFoto','selecionarTamanho',
    'mostrarToast','atualizarTudo','removerItem','renderizarCarrinho','atualizarTotais',
    'calcularFretePorCep','calcularFreteCarrinho','checkoutWhatsApp','comprarAgoraDireto',
    'checkoutExpresso','carregarProdutos','atualizarPreview','lerEnormalizarCarrinho',
    'computeBundleTotal','formatMoneyBR','obterInfoViaCep','sendWithEmailJS','sendMailto'
  ];

  fnNames.forEach(name => {
    if (typeof window[name] === 'function') {
      try {
        window.FutPlus[name] = window[name].bind(window);
        // keep a delegating global for full compatibility
        window[name] = function(...args){ return window.FutPlus[name](...args); };
      } catch (e) {
        // ignore
        window.FutPlus[name] = window[name];
      }
    }
  });

  // Move a few variáveis globais, se existirem
  ['descontoGlobal','cupomAplicado','PACK_PRICES'].forEach(k => {
    if (Object.prototype.hasOwnProperty.call(window, k)) {
      window.FutPlus[k] = window[k];
      // keep reference on window for compatibility
      window[k] = window.FutPlus[k];
    }
  });

  // Expose small helper to check namespace
  window.FutPlus._bridged = true;
})();
