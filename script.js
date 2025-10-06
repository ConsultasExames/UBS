// ======================================================================
// 1. CONFIGURAÇÕES CRÍTICAS
// ======================================================================

// ⚠️ ATUALIZE ESTA URL com o link da sua API do Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycby6vC4P1p3iU_UhIn--rIlPA4rOkHSrsHNX9dBFfRvFg3L-WF0WxVVJJkYnAC5icv0/exec'; 
const SENHA_ADMIN = '@@@UBS2025'; 

// ======================================================================
// 2. FUNÇÕES DE UTILIDADE E CONTROLE DE TELA
// ======================================================================

function exibirAreaAdmin() {
    const senha = prompt("Digite a senha de administrador:");
    if (senha === SENHA_ADMIN) {
        document.getElementById('area-consulta-publica').style.display = 'none';
        document.getElementById('area-admin').style.display = 'block';
        document.getElementById('link-admin').style.display = 'none';
        
        document.getElementById('resultadoPublico').innerHTML = '';
        document.getElementById('resultadoPublico').className = '';
    } else if (senha !== null) {
        alert("Senha incorreta.");
    }
}

function voltarParaConsulta() {
    document.getElementById('area-admin').style.display = 'none';
    document.getElementById('area-consulta-publica').style.display = 'block';
    document.getElementById('link-admin').style.display = 'block';
    
    // Limpa os campos e mensagens (CNS)
    document.getElementById('cnsAdmin').value = '';
    document.getElementById('resultadoAdmin').value = '';
    document.getElementById('mensagemAdmin').innerHTML = '';
    document.getElementById('consultaRapidaResultado').innerHTML = '';
}


// ======================================================================
// 3. FUNÇÃO DE CONSULTA (AGORA CNS - Corrigido o erro de travamento)
// ======================================================================

async function consultarResultado(formId) {
    const resultadoDiv = document.getElementById(formId === 'formConsultaPublica' ? 'resultadoPublico' : 'consultaRapidaResultado');
    
    // IDs dos inputs alterados para cnsConsultaPublica e cnsAdmin
    const cnsElement = document.getElementById(formId === 'formConsultaPublica' ? 'cnsConsultaPublica' : 'cnsAdmin');
    const cnsConsulta = cnsElement.value.replace(/\D/g, ''); // Limpa e pega o CNS

    // Validação de Campo Vazio
    if (cnsConsulta === '') {
        resultadoDiv.className = 'invalido';
        resultadoDiv.innerHTML = "Por favor, preencha o campo CNS.";
        return;
    }

    // Exibe a mensagem de 'Consultando...'
    resultadoDiv.className = 'invalido';
    resultadoDiv.innerHTML = "Consultando... Aguarde.";
    
    try {
        // O parâmetro na URL agora é 'cns'
        const url = `${API_URL}?action=consultar&cns=${cnsConsulta}`;
        
        // Timeout para evitar travamento
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); 

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId); 

        if (!response.ok) {
            throw new Error(`Erro de Rede: ${response.status}`);
        }
        
        const responseData = await response.json();

        // Lógica de Sucesso ou Não Encontrado
        if (responseData.status === 'sucesso') {
            const resTexto = responseData.resultado.toLowerCase();
            let classe = 'invalido';
            let dataExame = responseData.dataCadastro || "Data Desconhecida"; 
            
            // Trata a data para formato amigável
            let dataDisplay = dataExame;
            try {
                const dataObj = new Date(dataExame); 
                if (!isNaN(dataObj.getTime())) {
                    dataDisplay = dataObj.toLocaleDateString('pt-BR'); 
                }
            } catch (e) { /* Se falhar, usa o formato original */ }
            
            // Define a classe de cor (positivo/negativo)
            if (resTexto.includes('positivo') || resTexto.includes('reagente')) {
                classe = 'positivo';
            } else if (resTexto.includes('negativo') || resTexto.includes('não reagente')) {
                classe = 'negativo';
            }

            // Exibe o resultado formatado
            resultadoDiv.innerHTML = `
                <div class="resultado-header"><strong>Resultado do Exame</strong></div>
                <div class="resultado-data">Data: <span>${dataDisplay}</span></div>
                <div class="resultado-valor">${responseData.resultado}</div>
            `;
            resultadoDiv.className = classe; 

        } else if (responseData.status === 'nao_encontrado') {
            // Se o CNS não foi encontrado (CORREÇÃO: o Aguarde some e mostra a mensagem)
            resultadoDiv.className = 'invalido';
            resultadoDiv.innerHTML = "CNS não encontrado ou resultado ainda não cadastrado.";
        
        } else {
            resultadoDiv.className = 'invalido';
            resultadoDiv.innerHTML = "Erro interno do servidor. Status desconhecido.";
        }

    } catch (error) {
        // O BLOCO CATCH: Garante que o 'Aguarde' some em caso de falha de rede/timeout
        resultadoDiv.className = 'invalido';
        if (error.name === 'AbortError') {
             resultadoDiv.innerHTML = "Tempo limite excedido. Tente novamente mais tarde.";
        } else {
             resultadoDiv.innerHTML = `Erro na consulta. Verifique sua conexão.`;
        }
    }
}


// ======================================================================
// 4. FUNÇÃO DE SALVAR/ATUALIZAR (ADMIN)
// ======================================================================

async function salvarResultado() {
    const cnsInput = document.getElementById('cnsAdmin').value.replace(/\D/g, ''); // Agora CNS
    const resultadoInput = document.getElementById('resultadoAdmin').value;
    const mensagemAdmin = document.getElementById('mensagemAdmin');
    
    // Validação de campos vazios (sem limite de comprimento de CNS)
    if (cnsInput === '' || resultadoInput === '') {
        mensagemAdmin.className = 'invalido';
        mensagemAdmin.innerHTML = "Erro: CNS e Resultado são obrigatórios.";
        return;
    }

    mensagemAdmin.className = 'invalido';
    mensagemAdmin.innerHTML = "Salvando... Aguarde.";
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'salvar');
        formData.append('cns', cnsInput); // MUDANÇA: 'cns'
        formData.append('resultado', resultadoInput);

        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Erro de Rede: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'cadastrado' || data.status === 'atualizado') {
            mensagemAdmin.className = 'positivo';
            mensagemAdmin.innerHTML = data.status === 'cadastrado' ? 'Resultado cadastrado com sucesso!' : 'Resultado atualizado com sucesso!';
        } else {
            mensagemAdmin.className = 'invalido';
            mensagemAdmin.innerHTML = 'Erro ao salvar. Status desconhecido.';
        }

    } catch (error) {
        mensagemAdmin.className = 'negativo';
        mensagemAdmin.innerHTML = `Falha ao salvar. Erro: ${error.message}`;
    }
}

// ======================================================================
// 5. INICIALIZAÇÃO E EVENT LISTENERS
// ======================================================================

window.onload = function() {
    // Listener para o formulário de cadastro Admin (Usa 'submit')
    const formAdmin = document.getElementById('formAdmin');
    if (formAdmin) {
        formAdmin.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarResultado();
        });
    }

    // Listener para o botão de consulta rápida dentro do Admin 
    const btnConsultaAdmin = document.getElementById('btnConsultaAdmin');
    if (btnConsultaAdmin) {
        btnConsultaAdmin.addEventListener('click', function() {
            consultarResultado('formAdmin'); 
        });
    }
}