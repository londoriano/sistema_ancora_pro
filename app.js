// app.js - Versão PRO (Com Trava de Ativação)

const DB_KEY = "consultoria_db_pro"; // Nome diferente para não conflitar com trial
const SESSAO_KEY = "consultoria_logado_pro";
const LICENCA_KEY = "ancora_licenca_ativa"; // Onde a chave do usuário fica salva
const DEVICE_ID_KEY = "ancora_device_id";   // O ID "Fixo" desta instalação

// --- CONFIGURAÇÃO DA PROTEÇÃO ---
// Mude esta frase para algo único seu. É a "senha" que valida o cálculo.
const SEGREDO_MESTRE = "ANCORA_SISTEMA_FINANCEIRO_V1_2026_SEGREDO"; 

// --- FUNÇÕES DE SEGURANÇA (CRYPTO 90s) ---

// 1. Gera ou recupera o ID da Máquina (Simulado em LocalStorage)
function getSystemId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
        // Gera um ID aleatório tipo "ABCD-1234-EFGH"
        const part = () => Math.random().toString(36).substr(2, 4).toUpperCase();
        id = `SYS-${part()}-${part()}-${part()}`;
        localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
}

// 2. Algoritmo de Hash Simples (O "Coração" da validação)
// Transforma o ID + Segredo em uma Chave única
function gerarHashValidacao(id) {
    const textoBase = id + SEGREDO_MESTRE;
    let hash = 0;
    
    // Algoritmo matemático simples (tipo DJB2)
    for (let i = 0; i < textoBase.length; i++) {
        const char = textoBase.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Converte para 32bit integer
    }
    
    // Formata o número para parecer uma chave serial (positiva e Hexadecimal)
    const hex = Math.abs(hash).toString(16).toUpperCase();
    return `KEY-${hex.padStart(8, '0')}`; // Ex: KEY-1A2B3C4D
}

// 3. Verifica se o sistema está ativado
async function verificarAtivacao() {
    const idAtual = getSystemId();
    const licencaSalva = localStorage.getItem(LICENCA_KEY);
    const chaveEsperada = gerarHashValidacao(idAtual);

    // Se a licença salva bater com o cálculo matemático do ID atual
    if (licencaSalva === chaveEsperada) {
        console.log("Sistema Ativado. Bem-vindo, usuário PRO.");
        return true; // Liberado
    } else {
        console.warn("Bloqueio de Ativação: Chave inválida ou inexistente.");
        bloquearTelaAtivacao(idAtual); // Chama o bloqueio
        throw new Error("SISTEMA BLOQUEADO - AGUARDANDO ATIVAÇÃO");
    }
}

// 4. Tela de Bloqueio (Injection HTML)
function bloquearTelaAtivacao(id) {
    sessionStorage.clear(); // Derruba sessão
    document.body.innerHTML = `
        <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1e21 0%, #2c3e50 100%); color: white; font-family: 'Segoe UI', sans-serif; text-align: center; padding: 20px;">
            <div style="background: rgba(255,255,255,0.05); padding: 40px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.5); max-width: 500px; width: 100%;">
                <h1 style="color: #ffc107; margin-bottom: 10px;"><i class="bi bi-shield-lock-fill"></i> Ativação Necessária</h1>
                <p style="color: #adb5bd; margin-bottom: 30px;">Esta cópia do Sistema Âncora PRO ainda não foi ativada neste dispositivo.</p>
                
                <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <label style="display:block; font-size: 0.8rem; color: #6c757d; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Seu ID de Instalação</label>
                    <div style="font-family: monospace; font-size: 1.5rem; letter-spacing: 2px; color: #0dcaf0; font-weight: bold; user-select: all; cursor: pointer;" onclick="navigator.clipboard.writeText('${id}'); alert('ID copiado!')" title="Clique para copiar">
                        ${id} <i class="bi bi-clipboard" style="font-size: 1rem;"></i>
                    </div>
                </div>

                <p style="font-size: 0.9rem; color: #ced4da; margin-bottom: 20px;">Envie o ID acima para o suporte para receber sua chave.</p>

                <input type="text" id="inputLicenca" placeholder="Insira a Chave de Ativação aqui..." style="width: 100%; padding: 12px; border-radius: 5px; border: 1px solid #495057; background: #212529; color: white; text-align: center; font-family: monospace; font-size: 1.1rem; margin-bottom: 20px; outline: none; text-transform: uppercase;">
                
                <button onclick="tentarAtivar('${id}')" style="width: 100%; padding: 12px; border: none; border-radius: 5px; background: #198754; color: white; font-weight: bold; cursor: pointer; font-size: 1rem; transition: 0.2s;">
                    ATIVAR SISTEMA
                </button>
                <div id="msgErro" style="color: #dc3545; margin-top: 15px; font-weight: bold; min-height: 20px;"></div>
            </div>
            <div style="margin-top: 30px; font-size: 0.8rem; opacity: 0.5;">ID: ${id} | Âncora Consultoria PRO</div>
        </div>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    `;
}

// 5. Função chamada pelo botão "ATIVAR SISTEMA"
window.tentarAtivar = function(id) {
    const input = document.getElementById('inputLicenca');
    const msg = document.getElementById('msgErro');
    const chaveInserida = input.value.trim().toUpperCase();
    const chaveCorreta = gerarHashValidacao(id);

    if (chaveInserida === chaveCorreta) {
        localStorage.setItem(LICENCA_KEY, chaveInserida);
        msg.style.color = "#198754";
        msg.innerText = "Chave Válida! Iniciando...";
        setTimeout(() => location.reload(), 1500);
    } else {
        msg.style.color = "#dc3545";
        msg.innerText = "Chave Inválida. Verifique e tente novamente.";
        input.value = "";
        input.focus();
    }
};

// --- RESTO DO SISTEMA (ADAPTADO PARA PRO) ---

function verificarAutenticacao() {
    const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const logado = sessionStorage.getItem(SESSAO_KEY);
    if (!logado && !isIndex) window.location.href = 'index.html';
}

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

function exibirConfirmacao(texto, callbackSim) {
    const antigo = document.getElementById('modalConfirmacaoAcao');
    if (antigo) antigo.remove();

    const modalHtml = `
    <div class="modal fade" id="modalConfirmacaoAcao" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content border-0 shadow">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title text-danger fw-bold"><i class="bi bi-trash"></i> Confirmação</h5>
                </div>
                <div class="modal-body text-secondary">${texto}</div>
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
    document.getElementById('btnConfirmarSim').onclick = () => { modalObj.hide(); setTimeout(() => { modalEl.remove(); callbackSim(); }, 100); };
    modalObj.show();
}

function verificarSaida(acaoDestino) {
    if (typeof isDirty !== 'undefined' && isDirty) {
        if(!confirm("Existem dados não salvos. Deseja sair mesmo assim?")) return;
    }
    acaoDestino();
}

function navegarPara(url) { verificarSaida(() => window.location.href = url); }
function logout() { verificarSaida(() => { sessionStorage.removeItem(SESSAO_KEY); window.location.href = 'index.html'; }); }

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

// --- MENU LATERAL (VERSÃO PRO - SEM BLOQUEIOS) ---
function construirMenuLateral(clientId) {
    const container = document.getElementById('conteudoMenuLateral');
    if (!container) return; 

    // Lista Completa sem restrições
    const paginas = [
        { nome: 'Dados Pessoais', arquivo: 'dados_pessoais.html', icone: 'bi-person-vcard' },
        { nome: 'Fluxo de Caixa', arquivo: 'fluxo_caixa.html', icone: 'bi-cash-coin' },
        { nome: 'Objetivos', arquivo: 'objetivos.html', icone: 'bi-bullseye' },
        { nome: 'Endividamento', arquivo: 'endividamento.html', icone: 'bi-credit-card-2-front' },
        { nome: 'Reserva de Emergência', arquivo: 'reserva_emergencia.html', icone: 'bi-shield-check' },
        { nome: 'Proteção Patrimonial', arquivo: 'protecao_patrimonial.html', icone: 'bi-umbrella' },
        { nome: 'Aposentadoria', arquivo: 'aposentadoria.html', icone: 'bi-hourglass-split' },
        { nome: 'Investimentos', arquivo: 'investimentos.html', icone: 'bi-graph-up-arrow' },
        { nome: 'Planejamento', arquivo: 'planejamento.html', icone: 'bi-map' },
        { nome: 'Relatório Final', arquivo: 'relatorio.html', icone: 'bi-printer-fill' }
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
    html += `<div class="mt-auto p-3 text-center text-muted small border-top">
                <small class="text-success"><i class="bi bi-patch-check-fill"></i> Licença PRO Ativa</small><br>
                <small style="font-size:0.65rem; opacity:0.5">ID: ${getSystemId()}</small>
             </div>`;
    container.innerHTML = html;
}

// --- INICIALIZAÇÃO ---
window.onload = async function() {
    // 1. Verifica Ativação ANTES de tudo
    await verificarAtivacao(); // Se falhar, o código para aqui e tela de bloqueio assume
    
    // 2. Se passou, carrega o resto
    verificarAutenticacao();
    
    // Timer de inatividade (opcional no PRO, mas bom manter)
    document.onmousemove = resetarTimer;
    document.onkeypress = resetarTimer;
    resetarTimer();
};