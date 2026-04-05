/* ==========================================================================
   PAINEL ADMINISTRATIVO — FUTPLUS
   admin.js — Lógica do painel de gerenciamento
   ========================================================================== */

(function () {
    'use strict';

    // ---- CONFIGURAÇÃO ----
    const ADMIN_PASSWORD = 'futplus2025';
    const ORDERS_KEY     = 'futplus_orders';
    const CART_KEY       = 'futplus_cart';
    const PRODUCTS_KEY   = 'futplus_admin_products'; // produtos adicionados via admin
    const SESSION_KEY    = 'futplus_admin_session';

    // Produtos base do catálogo (espelho do produtos.json sem depender de fetch)
    const BASE_PRODUCTS = [
        { id: 1, nome: 'Camisa Corinthians Jogador 24/25', estilo: 'brasileirao', preco: 140, categoria: 'BRASILEIRÃO', foto: 'Destaques/Corinthians_modelo1.png', badge: '-15% OFF' },
        { id: 2, nome: 'Camisa Real Madrid Home 24/25 Third', estilo: 'europeus', preco: 140, categoria: 'EUROPA / ESPANHA', foto: 'Destaques/RealMadri_Third KitAdidas1.png', badge: '-10% OFF' },
        { id: 3, nome: 'Camisa Retrô Brasil 2005/2005', estilo: 'retro selecoes', preco: 180, categoria: 'SELEÇÕES / RETRÔ', foto: 'Destaques/Brasil_2004&2005_retro_azul1.png', badge: '-5% OFF' }
    ];

    // Cupons padrão (somente leitura — hardcoded em carrinho.js)
    const DEFAULT_COUPONS = [
        { code: 'FUT10',  desc: '10% de desconto em qualquer pedido',          type: 'percent', value: 10,  req: '' },
        { code: 'COMBO2', desc: 'Desconto de R$50 na compra de 2 camisas normais', type: 'fixed',   value: 50,  req: 'Mínimo 2 camisas normais' },
        { code: 'COMBO3', desc: 'Desconto de R$90 na compra de 3 camisas normais', type: 'fixed',   value: 90,  req: 'Mínimo 3 camisas normais' }
    ];

    // ---- UTILIDADES ----

    function formatMoney(n) {
        return 'R$ ' + Number(n || 0).toFixed(2).replace('.', ',');
    }

    function formatDate(iso) {
        if (!iso) return '-';
        const d = new Date(iso);
        return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function showToast(msg, isError) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const t = document.createElement('div');
        t.className = 'toast' + (isError ? ' error' : '');
        t.textContent = msg;
        container.appendChild(t);
        setTimeout(() => t.remove(), 3500);
    }

    function getOrders() {
        return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    }

    function getExtraProducts() {
        return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    }

    function getAllProducts() {
        return [...BASE_PRODUCTS, ...getExtraProducts()];
    }

    // Valida o status contra valores permitidos para evitar injeção de classe CSS
    const VALID_STATUSES = ['enviado', 'pendente', 'cancelado'];
    function safeStatus(s) {
        return VALID_STATUSES.includes(s) ? s : 'enviado';
    }

    // Valida que a URL da foto é um caminho relativo seguro (sem javascript: ou data:)
    function safeFotoUrl(url) {
        if (!url) return '';
        const s = String(url).trim();
        if (/^(https?:|javascript:|data:)/i.test(s)) return '';
        return s;
    }

    // Escapa caracteres HTML para evitar XSS ao inserir dados do localStorage no DOM
    function esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ---- AUTENTICAÇÃO ----

    function checkSession() {
        return sessionStorage.getItem(SESSION_KEY) === '1';
    }

    function startSession() {
        sessionStorage.setItem(SESSION_KEY, '1');
    }

    function endSession() {
        sessionStorage.removeItem(SESSION_KEY);
    }

    function showLogin() {
        document.getElementById('admin-login').style.display = 'flex';
        document.getElementById('admin-layout').style.display = 'none';
    }

    function showPanel() {
        document.getElementById('admin-login').style.display = 'none';
        const layout = document.getElementById('admin-layout');
        layout.style.display = 'flex';
        refreshAll();
    }

    function handleLogin() {
        const input = document.getElementById('admin-password');
        const error = document.getElementById('login-error');
        if (input.value === ADMIN_PASSWORD) {
            startSession();
            error.style.display = 'none';
            input.value = '';
            showPanel();
        } else {
            error.style.display = 'block';
            input.focus();
        }
    }

    function handleLogout() {
        endSession();
        showLogin();
    }

    // ---- TABS ----

    function switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === 'tab-' + tabId);
        });
    }

    // ---- DASHBOARD ----

    function renderDashboard() {
        const orders = getOrders();
        const totalPedidos  = orders.length;
        const totalReceita  = orders.reduce((s, o) => s + (o.totalNum || 0), 0);
        const totalItens    = orders.reduce((s, o) => s + (o.itens || []).reduce((a, it) => a + (it.quantidade || 1), 0), 0);
        const totalProdutos = getAllProducts().length;

        document.getElementById('stat-pedidos').textContent  = totalPedidos;
        document.getElementById('stat-receita').textContent  = formatMoney(totalReceita);
        document.getElementById('stat-itens').textContent    = totalItens;
        document.getElementById('stat-produtos').textContent = totalProdutos;

        // Últimos 5 pedidos na tabela rápida
        renderRecentOrders(orders.slice(0, 5));
    }

    function renderRecentOrders(orders) {
        const tbody = document.getElementById('recent-orders-body');
        if (!tbody) return;
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-inbox"></i> Nenhum pedido ainda.</td></tr>';
            return;
        }
        tbody.innerHTML = orders.map(o => {
            const status = safeStatus(o.status);
            return `
            <tr>
                <td>#${esc(String(o.id).slice(-6))}</td>
                <td>${esc(formatDate(o.data))}</td>
                <td>${(o.itens || []).length} item(s)</td>
                <td>${esc(o.total || '-')}</td>
                <td><span class="status-badge ${status}">${esc(status)}</span></td>
            </tr>
        `;
        }).join('');
    }

    // ---- PEDIDOS ----

    let currentOrderId = null;

    function renderOrders() {
        const orders = getOrders();
        const tbody  = document.getElementById('orders-body');
        if (!tbody) return;

        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-inbox"></i> Nenhum pedido registrado ainda.<br>Os pedidos aparecem aqui quando clientes finalizam via WhatsApp.</div></td></tr>`;
            return;
        }

        tbody.innerHTML = orders.map((o, idx) => {
            const cupom = o.cupom && o.cupom !== 'Nenhum'
                ? `<span class="coupon-tag">${esc(o.cupom)}</span>`
                : '<span style="color:var(--text-gray)">—</span>';
            return `
            <tr>
                <td>#${esc(String(o.id).slice(-6))}</td>
                <td>${esc(formatDate(o.data))}</td>
                <td>${(o.itens || []).length}</td>
                <td>${esc(o.total || '-')}</td>
                <td>${cupom}</td>
                <td>
                    <button class="btn-primary btn-sm" onclick="adminViewOrder(${Number(idx)})"><i class="fas fa-eye"></i></button>
                    <button class="btn-danger btn-sm" onclick="adminDeleteOrder(${Number(idx)})" style="margin-left:6px"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
        }).join('');
    }

    window.adminViewOrder = function(idx) {
        const orders = getOrders();
        const o = orders[idx];
        if (!o) return;

        const modal = document.getElementById('order-modal');
        const body  = document.getElementById('order-modal-body');
        if (!modal || !body) return;

        const status = safeStatus(o.status);
        body.innerHTML = `
            <div style="margin-bottom:16px;font-size:0.82rem;color:var(--text-gray)">
                <strong style="color:#fff">Pedido:</strong> #${esc(String(o.id).slice(-6))} &nbsp;|&nbsp;
                <strong style="color:#fff">Data:</strong> ${esc(formatDate(o.data))} &nbsp;|&nbsp;
                <strong style="color:#fff">Status:</strong> <span class="status-badge ${status}">${esc(status)}</span>
            </div>
            <div style="margin-bottom:12px">
                ${(o.itens || []).map((it, i) => `
                    <div class="modal-item">
                        <strong>${i+1}. ${esc(it.nome)}</strong><br>
                        <span style="color:var(--text-gray)">Tamanho: ${esc(it.tamanho)} &nbsp;|&nbsp; Nome: ${esc(it.personalizacao?.nome || '-')} &nbsp;|&nbsp; Nº: ${esc(it.personalizacao?.numero || '-')}</span><br>
                        <span style="color:var(--neon-green)">${esc(formatMoney(it.preco))} × ${Number(it.quantidade) || 1}</span>
                    </div>
                `).join('')}
            </div>
            <div style="padding-top:12px;border-top:1px solid var(--dark-border);font-size:0.88rem">
                <p>Subtotal: <strong>${esc(o.subtotal || '-')}</strong></p>
                <p>Cupom: <strong>${esc(o.cupom || 'Nenhum')}</strong></p>
                <p style="font-size:1rem;margin-top:8px;color:var(--neon-green)">Total: <strong>${esc(o.total || '-')}</strong></p>
            </div>
        `;
        modal.classList.add('open');
    };

    window.adminDeleteOrder = function(idx) {
        if (!confirm('Remover este pedido do histórico?')) return;
        const orders = getOrders();
        orders.splice(idx, 1);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        renderOrders();
        renderDashboard();
        showToast('Pedido removido.');
    };

    window.adminCloseOrderModal = function() {
        document.getElementById('order-modal').classList.remove('open');
    };

    // ---- PRODUTOS ----

    function renderProducts() {
        const grid = document.getElementById('products-grid');
        if (!grid) return;
        const products = getAllProducts();

        if (products.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i> Nenhum produto cadastrado.</div>';
            return;
        }

        grid.innerHTML = products.map((p, idx) => {
            const isCustom = idx >= BASE_PRODUCTS.length;
            const fotoEsc = esc(safeFotoUrl(p.foto));
            const nomeEsc = esc(p.nome);
            const catEsc  = esc(p.categoria || p.estilo || '—');
            const badgeEsc = p.badge ? esc(p.badge) : '';
            const extraIdx = idx - BASE_PRODUCTS.length;
            return `
                <div class="product-admin-card">
                    <div class="card-img">
                        ${fotoEsc ? `<img src="${fotoEsc}" alt="${nomeEsc}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="no-img" style="display:none"><i class="fas fa-image"></i> Sem imagem</span>` : '<span class="no-img"><i class="fas fa-image"></i> Sem imagem</span>'}
                    </div>
                    <div class="card-body">
                        <span class="card-category">${catEsc}</span>
                        <span class="card-name">${nomeEsc}</span>
                        ${badgeEsc ? `<span style="font-size:0.7rem;color:var(--warning)">${badgeEsc}</span>` : ''}
                        <span class="card-price">${esc(formatMoney(p.preco))}</span>
                        ${isCustom ? `<button class="btn-danger btn-sm" onclick="adminDeleteProduct(${Number(extraIdx)})" style="margin-top:8px"><i class="fas fa-trash"></i> Remover</button>` : '<span style="font-size:0.7rem;color:var(--text-gray);margin-top:8px">Produto base</span>'}
                    </div>
                </div>
            `;
        }).join('');
    }

    window.adminDeleteProduct = function(extraIdx) {
        if (!confirm('Remover este produto?')) return;
        const extras = getExtraProducts();
        extras.splice(extraIdx, 1);
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(extras));
        renderProducts();
        renderDashboard();
        showToast('Produto removido.');
    };

    window.adminAddProduct = function(e) {
        e.preventDefault();
        const nome      = document.getElementById('p-nome').value.trim();
        const categoria = document.getElementById('p-categoria').value.trim();
        const estilo    = document.getElementById('p-estilo').value;
        const preco     = parseFloat(document.getElementById('p-preco').value);
        const foto      = document.getElementById('p-foto').value.trim();
        const badge     = document.getElementById('p-badge').value.trim();

        if (!nome || !categoria || isNaN(preco)) {
            showToast('Preencha os campos obrigatórios (Nome, Categoria, Preço).', true);
            return;
        }

        const extras = getExtraProducts();
        const novo = { id: Date.now(), nome, categoria, estilo, preco, foto, badge };
        extras.push(novo);
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(extras));

        e.target.reset();
        renderProducts();
        renderDashboard();
        showToast('Produto adicionado com sucesso!');
    };

    // ---- CUPONS ----

    function renderCoupons() {
        const list = document.getElementById('coupon-list');
        if (!list) return;
        list.innerHTML = DEFAULT_COUPONS.map(c => `
            <div class="coupon-item">
                <span class="coupon-code">${c.code}</span>
                <div>
                    <div class="coupon-desc">${c.desc}</div>
                    ${c.req ? `<div style="font-size:0.72rem;color:var(--warning);margin-top:4px"><i class="fas fa-info-circle"></i> ${c.req}</div>` : ''}
                </div>
                <div class="coupon-meta">
                    <span class="coupon-tag">${c.type === 'percent' ? c.value + '%' : formatMoney(c.value)}</span>
                    <span class="status-badge enviado">Ativo</span>
                </div>
            </div>
        `).join('');
    }

    // ---- REFRESCA TUDO ----

    function refreshAll() {
        renderDashboard();
        renderOrders();
        renderProducts();
        renderCoupons();
    }

    // ---- LIMPAR HISTÓRICO ----

    window.adminClearOrders = function() {
        if (!confirm('Tem certeza? Esta ação remove TODOS os pedidos do histórico.')) return;
        localStorage.removeItem(ORDERS_KEY);
        renderOrders();
        renderDashboard();
        showToast('Histórico de pedidos limpo.');
    };

    // ---- INIT ----

    document.addEventListener('DOMContentLoaded', function () {

        // Login
        const loginBtn = document.getElementById('btn-login');
        if (loginBtn) loginBtn.addEventListener('click', handleLogin);

        const loginForm = document.getElementById('login-form');
        if (loginForm) loginForm.addEventListener('submit', handleLogin);

        const pwInput = document.getElementById('admin-password');
        if (pwInput) pwInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') handleLogin();
        });

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                switchTab(this.dataset.tab);
            });
        });

        // Add product form
        const addProductForm = document.getElementById('add-product-form');
        if (addProductForm) addProductForm.addEventListener('submit', adminAddProduct);

        // Modal close on overlay click
        const modal = document.getElementById('order-modal');
        if (modal) modal.addEventListener('click', function(e) {
            if (e.target === modal) adminCloseOrderModal();
        });

        // Init state
        if (checkSession()) {
            showPanel();
        } else {
            showLogin();
        }
    });

})();
