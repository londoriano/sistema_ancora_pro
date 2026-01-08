// app.js - Versão PRO (Corrigida e Completa)

const DB_KEY = "consultoria_db_pro";
const SESSAO_KEY = "consultoria_logado_pro";
const LICENCA_KEY = "ancora_licenca_ativa";
const DEVICE_ID_KEY = "ancora_device_id";
const SEGREDO_MESTRE = "ANCORA_SISTEMA_FINANCEIRO_V1_2026_SEGREDO"; 

// --- 1. PROTEÇÃO / ATIVAÇÃO ---

function getSystemId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
        const part = () => Math.random().toString(36).substr(2, 4).toUpperCase();
        id = `SYS-${part()}-${part()}-${part()}`;
        localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
}

function gerarHashValidacao(id) {
    const textoBase = id + SEGREDO_MESTRE;
    let hash = 0;
    for (let i = 0; i < textoBase.length; i++) {
        const char = textoBase.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; 
    }
    const hex = Math.abs(hash).toString(16).toUpperCase();
    return `KEY-${hex.padStart(8, '0')}`;
}

async function verificarAtivacao() {
    const idAtual = getSystemId();
    const licencaSalva = localStorage.getItem(LICENCA_KEY);
    const chaveEsperada = gerarHashValidacao(idAtual);

    if (licencaSalva === chaveEsperada) {
        return true; 
    } else {
        bloquearTelaAtivacao(idAtual); 
        throw new Error("BLOQUEIO_ATIVACAO");
    }
}

function bloquearTelaAtivacao(id) {
    sessionStorage.clear();
    document.body.innerHTML = `
        <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #212529; color: white; font-family: sans-serif; text-align: center;">
            <div style="background: rgba(255,255,255,0.05); padding: 40px; border-radius: 10px; max-width: 500px;">
                <h2 style="color: #ffc107;">Ativação Necessária</h2>
                <p>ID de Instalação:</p>
                <h1 style="font-family: monospace; color: #0dcaf0; cursor: pointer;" onclick="navigator.clipboard.writeText('${id}'); alert('ID Copiado!')" title="Clique para copiar">${id}</h1>
                <p style="margin-top:20px; font-size: 0.9rem; color: #aaa;">Envie este ID para o suporte.</p>
                <input type="text" id="inputLicenca" placeholder="Insira sua chave..." style="padding: 10px; width: 80%; text-align: center; text-transform: uppercase; margin-bottom: 15px;">
                <br>
                <button onclick="tentarAtivar('${id}')" style="padding: 10px 20px; background: #198754; color: white; border: none; font-weight: bold; cursor: pointer;">ATIVAR SISTEMA</button>
                <div id="msgErro" style="color: #dc3545; margin-top: 10px; font-weight: bold;"></div>
            </div>
        </div>
    `;
}

window.tentarAtivar = function(id) {
    const input = document.getElementById('inputLicenca');
    const msg = document.getElementById('msgErro');
    const chave = input.value.trim().toUpperCase();
    if (chave === gerarHashValidacao(id)) {
        localStorage.setItem(LICENCA_KEY, chave);
        msg.style.color = "#198754";
        msg.innerText = "Sucesso! Reiniciando...";
        setTimeout(() => location.reload(), 1000);
    } else {
        msg.innerText = "Chave Inválida.";
    }
};

// --- 2. CORE DO SISTEMA ---

function verificarAutenticacao() {
    const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const logado = sessionStorage.getItem(SESSAO_KEY);
    if (!logado && !isIndex) window.location.href = 'index.html';
}

// Modal unificado (Sucesso, Erro, Aviso)
function exibirMensagem(texto, tipo = 'sucesso', callback = null) {
    const antigo = document.getElementById('modalAvisoGeral');
    if (antigo) antigo.remove();

    let cor = tipo === 'erro' ? 'danger' : (tipo === 'aviso' ? 'warning' : 'success');
    let icone = tipo === 'erro' ? 'bi-x-circle' : (tipo === 'aviso' ? 'bi-exclamation-triangle' : 'bi-check-circle');
    let titulo = tipo === 'erro' ? 'Erro' : (tipo === 'aviso' ? 'Atenção' : 'Sucesso');

    const html = `
    <div class="modal fade" id="modalAvisoGeral" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content text-center border-0 shadow">
                <div class="modal-body p-4">
                    <div class="mb-3"><i class="bi ${icone}-fill text-${cor}" style="font-size: 3rem;"></i></div>
                    <h5 class="fw-bold text-${cor} mb-3">${titulo}</h5>
                    <p class="text-muted mb-4">${texto}</p>
                    <button type="button" class="btn btn-${cor} w-100 rounded-pill" id="btnAvisoOk">OK</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    
    const el = document.getElementById('modalAvisoGeral');
    const modal = new bootstrap.Modal(el);
    const btn = document.getElementById('btnAvisoOk');
    
    const fechar = () => {
        modal.hide();
        el.addEventListener('hidden.bs.modal', () => { 
            el.remove(); 
            if(callback) callback(); 
        }, { once: true });
    };
    btn.onclick = fechar;
    modal.show();
    setTimeout(() => btn.focus(), 100);
}

// Modal de Confirmação (Sim/Não)
function exibirConfirmacao(texto, callbackSim) {
    const antigo = document.getElementById('modalConfirmacaoAcao');
    if (antigo) antigo.remove();

    const html = `
    <div class="modal fade" id="modalConfirmacaoAcao" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content border-0 shadow">
                <div class="modal-body text-center p-4">
                    <i class="bi bi-question-circle-fill text-primary mb-3" style="font-size: 2rem;"></i>
                    <p class="mb-4">${texto}</p>
                    <div class="d-flex gap-2 justify-content-center">
                        <button class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                        <button class="btn btn-primary fw-bold" id="btnConfirmarSim">Confirmar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    
    const el = document.getElementById('modalConfirmacaoAcao');
    const modal = new bootstrap.Modal(el);
    document.getElementById('btnConfirmarSim').onclick = () => {
        modal.hide();
        setTimeout(() => { 
            el.remove(); 
            callbackSim(); 
        }, 200);
    };
    modal.show();
}

// Navegação Segura
function verificarSaida(acaoDestino) {
    if (typeof isDirty !== 'undefined' && isDirty) {
        const antigo = document.getElementById('modalNavConfirm');
        if (antigo) antigo.remove();

        const html = `
        <div class="modal fade" id="modalNavConfirm" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0 pb-0"><h5 class="modal-title text-warning">Salvar alterações?</h5></div>
                    <div class="modal-body text-muted">Você tem dados não salvos. Se sair, eles serão perdidos.</div>
                    <div class="modal-footer border-0">
                        <button class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                        <button class="btn btn-danger" id="btnNavNao">Sair sem Salvar</button>
                        <button class="btn btn-success fw-bold" id="btnNavSim">Salvar e Sair</button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        
        const el = document.getElementById('modalNavConfirm');
        const modal = new bootstrap.Modal(el);

        document.getElementById('btnNavNao').onclick = () => {
            isDirty = false;
            modal.hide();
            el.addEventListener('hidden.bs.modal', () => {
                el.remove();
                acaoDestino();
            }, { once: true });
        };

        document.getElementById('btnNavSim').onclick = () => {
            modal.hide();
            if (typeof salvarAlteracoes === 'function') {
                salvarAlteracoes(true);
                el.addEventListener('hidden.bs.modal', () => {
                    el.remove();
                    acaoDestino();
                }, { once: true });
            } else {
                acaoDestino();
            }
        };
        modal.show();
    } else {
        acaoDestino();
    }
}

function navegarPara(url) { verificarSaida(() => window.location.href = url); }
function logout() { verificarSaida(() => { sessionStorage.removeItem(SESSAO_KEY); window.location.href = 'index.html'; }); }

function getDB() { const d = localStorage.getItem(DB_KEY); return d ? JSON.parse(d) : []; }
function saveDB(d) { localStorage.setItem(DB_KEY, JSON.stringify(d)); }

function formatarMoeda(v) { return parseFloat(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function mascaraTelefone(i) {
    let v = i.value.replace(/\D/g,'');
    v = v.replace(/^(\d{2})(\d)/g,"($1) $2");
    v = v.replace(/(\d)(\d{4})(\d{4})$/,"$1 $2-$3");
    i.value = v;
}

// --- 3. TIMER DE INATIVIDADE (A Função que faltava) ---
let inatividadeTime;
function resetarTimer() {
    clearTimeout(inatividadeTime);
    // Logout após 30 minutos de inatividade
    inatividadeTime = setTimeout(logout, 30 * 60 * 1000); 
}

// --- 4. INTERFACE ---

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
        { nome: 'Planejamento', arquivo: 'planejamento.html', icone: 'bi-map' },
        { nome: 'Relatório Final', arquivo: 'relatorio.html', icone: 'bi-printer-fill' }
    ];
    let html = `<div class="list-group list-group-flush"><a href="#" onclick="navegarPara('clientes.html')" class="list-group-item list-group-item-action bg-light fw-bold"><i class="bi bi-arrow-left-circle-fill"></i> Sair do Cliente</a><div class="dropdown-divider"></div>`;
    const atual = window.location.pathname.split("/").pop();
    paginas.forEach(p => {
        const active = atual === p.arquivo ? 'active fw-bold' : '';
        html += `<a href="#" onclick="navegarPara('${p.arquivo}?id=${clientId}')" class="list-group-item list-group-item-action ${active}"><i class="bi ${p.icone} me-2"></i> ${p.nome}</a>`;
    });
    html += '</div>';
    html += `<div class="mt-auto p-3 text-center text-muted small border-top"><small>Licença PRO: ${getSystemId()}</small></div>`;
    container.innerHTML = html;
}

// --- 5. INICIALIZAÇÃO GERAL ---
window.onload = async function() {
    try { 
        await verificarAtivacao(); 
        verificarAutenticacao(); 
        resetarTimer(); 
    } catch(e) {
        console.error("Erro na inicialização:", e);
    }
   // document.onmousemove removido intencionalmente para performance
    window.onclick = resetarTimer;   // Reseta apenas ao clicar
    window.onkeypress = resetarTimer; // Reseta ao digitar

};