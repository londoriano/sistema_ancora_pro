const SENHA_MESTRA = "Nimbus27@9";
const DB_KEY = "consultoria_db";
const SESSAO_KEY = "consultoria_logado";
const TENTATIVAS_KEY = "login_tentativas_falhas";

// --- CONFIGURAÇÃO DE LICENÇA (TRAVA DE DATA) ---
const DATA_EXPIRACAO_SISTEMA = "2026-12-31"; 
const CONTATO_RENOVACAO = "ancora.consultoriafinancas@gmail.com";

// --- VERIFICAÇÃO DE LICENÇA E EXIBIÇÃO DE PRAZO ---
async function verificarLicenca() {
    let hoje = new Date();
    let fonte = "Local";

    // 1. Tenta validar com horário da internet (mais seguro)
    try {
        const controller = new AbortController();
        // Timeout de 2s para não travar se a internet estiver lenta
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch('https://worldtimeapi.org/api/timezone/America/Sao_Paulo', { 
            signal: controller.signal 
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            hoje = new Date(data.datetime);
            fonte = "Online";
        }
    } catch (e) {
        console.warn("Validação de licença offline. Usando data do sistema.");
    }

    // Ajusta para comparar apenas as datas (zera horas)
    hoje.setHours(0,0,0,0);
    const validade = new Date(DATA_EXPIRACAO_SISTEMA + "T00:00:00");
    
    // Cálculo de Dias Restantes
    const diffTime = validade - hoje;
    const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log(`Licença: ${diasRestantes} dias restantes. (Fonte: ${fonte})`);

    // --- CENÁRIO 1: BLOQUEIO FATAL (Se venceu) ---
    if (diasRestantes < 0) {
        sessionStorage.clear(); // Derruba sessão imediatamente
        document.body.innerHTML = `
            <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #212529; color: white; font-family: 'Segoe UI', sans-serif; text-align: center; padding: 20px;">
                <h1 style="font-size: 3rem; margin-bottom: 20px; color: #dc3545;">🚫 Licença Expirada</h1>
                <p style="font-size: 1.2rem; max-width: 600px; margin-bottom: 30px; color: #adb5bd;">
                    O acesso ao sistema foi encerrado em <strong>${validade.toLocaleDateString('pt-BR')}</strong>.
                    <br>Por favor, entre em contato para renovar sua assinatura.
                </p>
                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; border: 1px solid #495057;">
                    <p style="margin:0; font-size: 0.9rem; color: #ced4da;">Renovação:</p>
                    <h3 style="margin: 10px 0; color: #0dcaf0;">${CONTATO_RENOVACAO}</h3>
                </div>
                <p style="margin-top: 40px; font-size: 0.7rem; color: #6c757d;">ID: ${btoa(window.location.hostname || 'LOCAL').substring(0,12)}</p>
            </div>`;
        throw new Error("LICENÇA EXPIRADA"); // Para a execução do script
    }

    // --- CENÁRIO 2: AVISO NO LOGIN (Se ainda válido) ---
    // Procura o elemento que criamos no index.html
    const msgElement = document.getElementById('licencaMsg');
    if (msgElement) {
        if (diasRestantes > 365) {
            msgElement.innerHTML = `<i class="bi bi-shield-check text-success"></i> Licença válida até ${validade.toLocaleDateString('pt-BR')}`;
        } else if (diasRestantes > 30) {
            msgElement.innerHTML = `<i class="bi bi-clock-history"></i> Licença ativa: <strong>${diasRestantes} dias</strong> restantes`;
        } else {
            // Urgência (Vermelho) se faltar menos de 30 dias
            msgElement.innerHTML = `<span class="text-danger fw-bold"><i class="bi bi-exclamation-circle-fill"></i> Atenção: Sua licença expira em ${diasRestantes} dias.</span>`;
        }
    }
}

// --- SEGURANÇA E SESSÃO ---
function verificarAutenticacao() {
    const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const logado = sessionStorage.getItem(SESSAO_KEY);
    if (!logado && !isIndex) window.location.href = 'index.html';
}

let inatividadeTime;
function resetarTimer() {
    clearTimeout(inatividadeTime);
    inatividadeTime = setTimeout(logout, 10 * 60 * 1000); // 10 minutos
}

// --- CENTRAL DE NOTIFICAÇÕES (ALERT MODERNO) ---
function exibirMensagem(texto, tipo = 'sucesso', callback = null) {
    const antigo = document.getElementById('modalAvisoGeral');
    if (antigo) antigo.remove();

    let config = { titulo: 'Sucesso!', cor: 'success', icone: 'bi-check-circle-fill' };
    if (tipo === 'erro') config = { titulo: 'Erro', cor: 'danger', icone: 'bi-x-circle-fill' };
    else if (tipo === 'aviso') config = { titulo: 'Atenção', cor: 'warning', icone: 'bi-exclamation-triangle-fill' };

    const modalHtml = `
    <div class="modal fade" id="modalAvisoGeral" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content text-center border-0 shadow">
                <div class="modal-body p-4">
                    <div class="mb-3"><i class="bi ${config.icone} text-${config.cor}" style="font-size: 3rem;"></i></div>
                    <h5 class="fw-bold text-${config.cor} mb-2">${config.titulo}</h5>
                    <p class="mb-4 text-muted">${texto}</p>
                    <button type="button" class="btn btn-${config.cor} w-100 fw-bold rounded-pill" id="btnAvisoOk">OK</button>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalElement = document.getElementById('modalAvisoGeral');
    const modalObj = new bootstrap.Modal(modalElement);
    const btnOk = document.getElementById('btnAvisoOk');
    
    const fechar = () => {
        modalObj.hide();
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
            if (callback) callback();
        });
    };

    btnOk.onclick = fechar;
    modalElement.addEventListener('keypress', (e) => { if (e.key === 'Enter') fechar(); });
    modalObj.show();
    setTimeout(() => btnOk.focus(), 100); 
}

// --- CENTRAL DE CONFIRMAÇÃO (SUBSTITUI CONFIRM) ---
function exibirConfirmacao(texto, callbackSim) {
    const antigo = document.getElementById('modalConfirmacaoAcao');
    if (antigo) antigo.remove();

    const modalHtml = `
    <div class="modal fade" id="modalConfirmacaoAcao" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content border-0 shadow">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title text-danger fw-bold"><i class="bi bi-trash"></i> Tem certeza?</h5>
                </div>
                <div class="modal-body text-secondary">
                    ${texto}
                </div>
                <div class="modal-footer border-0 pt-0">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-danger fw-bold" id="btnConfirmarSim">Sim, Confirmar</button>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('modalConfirmacaoAcao');
    const modalObj = new bootstrap.Modal(modalEl);
    
    document.getElementById('btnConfirmarSim').onclick = () => {
        modalObj.hide();
        setTimeout(() => {
            modalEl.remove();
            callbackSim();
        }, 100);
    };
    
    modalObj.show();
}

// --- NAVEGAÇÃO SEGURA (SALVAR AO SAIR) ---
function verificarSaida(acaoDestino) {
    if (typeof isDirty !== 'undefined' && isDirty) {
        if (!document.getElementById('modalNavConfirm')) {
            const modalHtml = `
            <div class="modal fade" id="modalNavConfirm" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-warning bg-opacity-10 border-0">
                            <h5 class="modal-title text-warning-emphasis"><i class="bi bi-hdd-fill"></i> Salvar alterações?</h5>
                        </div>
                        <div class="modal-body">
                            <p class="mb-0">Você tem dados pendentes. Se sair agora, eles serão perdidos.</p>
                        </div>
                        <div class="modal-footer border-0">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-danger" id="btnNavNao">Sair sem Salvar</button>
                            <button type="button" class="btn btn-success fw-bold px-4" id="btnNavSim">Salvar e Sair</button>
                        </div>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }

        const modalElement = document.getElementById('modalNavConfirm');
        const modalObj = new bootstrap.Modal(modalElement);

        document.getElementById('btnNavSim').onclick = function() {
            modalObj.hide();
            if (typeof salvarAlteracoes === 'function') {
                salvarAlteracoes(true);
                setTimeout(acaoDestino, 100);
            } else {
                acaoDestino();
            }
        };

        document.getElementById('btnNavNao').onclick = function() {
            modalObj.hide();
            isDirty = false;
            acaoDestino();
        };

        modalObj.show();
    } else {
        acaoDestino();
    }
}

function navegarPara(url) { verificarSaida(() => window.location.href = url); }
function logout() { verificarSaida(() => { sessionStorage.removeItem(SESSAO_KEY); window.location.href = 'index.html'; }); }

// --- INICIALIZAÇÃO GLOBAL (ASSÍNCRONA) ---
window.onload = async function() {
    // 1. Verifica licença ANTES de qualquer coisa (espera a web)
    await verificarLicenca();
    
    // 2. Se a licença estiver OK, ativa os timers e segurança
    document.onmousemove = resetarTimer;
    document.onkeypress = resetarTimer;
    verificarAutenticacao();
    resetarTimer();
};

// --- FUNÇÕES DE DADOS E UI ---
function getDB() { const data = localStorage.getItem(DB_KEY); return data ? JSON.parse(data) : []; }
function saveDB(data) { localStorage.setItem(DB_KEY, JSON.stringify(data)); }

function mascaraTelefone(input) {
    let v = input.value.replace(/\D/g,'');
    v = v.replace(/^(\d{2})(\d)/g,"($1) $2"); 
    v = v.replace(/(\d)(\d{4})(\d{4})$/,"$1 $2-$3");
    input.value = v;
}

function formatarMoeda(valor) {
    if(!valor && valor !== 0) return "R$ 0,00";
    return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function construirMenuLateral(clientId) {
    const container = document.getElementById('conteudoMenuLateral');
    if (!container) return; 

    const paginas = [
        { nome: 'Dados Pessoais', arquivo: 'dados_pessoais.html', icone: 'bi-person-vcard' },
        { nome: 'Fluxo de Caixa', arquivo: 'fluxo_caixa.html', icone: 'bi-cash-coin' },
        { nome: 'Objetivos', arquivo: 'objetivos.html', icone: 'bi-bullseye' },
        { nome: 'Endividamento', arquivo: 'endividamento.html', icone: 'bi-credit-card-2-front' },
        { nome: 'Reserva de Emergência', arquivo: 'reserva_emergencia.html', icone: 'bi-shield-check' },
        { nome: 'Proteção Patrimonial', arquivo: 'protecao_patrimonial.html', icone: 'bi-umbrella' },
        { nome: 'Aposentadoria', arquivo: 'aposentadoria.html', icone: 'bi-hourglass-split' },
        { nome: 'Investimentos', arquivo: 'investimentos.html', icone: 'bi-graph-up-arrow' },
        { nome: 'Planejamento', arquivo: 'planejamento.html', icone: 'bi-map' }
    ];

    let html = '<div class="list-group list-group-flush">';
    html += `
        <a href="#" onclick="navegarPara('clientes.html')" class="list-group-item list-group-item-action bg-light text-dark fw-bold">
            <i class="bi bi-arrow-left-circle-fill"></i> Sair do Cliente
        </a>
        <div class="dropdown-divider"></div>
    `;

    const paginaAtual = window.location.pathname.split("/").pop();
    paginas.forEach(p => {
        const activeClass = paginaAtual === p.arquivo ? 'active fw-bold' : '';
        const urlCompleta = `${p.arquivo}?id=${clientId}`;
        html += `<a href="#" onclick="navegarPara('${urlCompleta}')" class="list-group-item list-group-item-action ${activeClass}"><i class="bi ${p.icone} me-2"></i> ${p.nome}</a>`;
    });

    html += '</div>';
    html += `<div class="mt-auto p-3 text-center text-muted small border-top"><small>Âncora Financeira v1.8</small></div>`;
    container.innerHTML = html;
}