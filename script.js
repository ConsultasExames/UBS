// ** COLE AQUI O URL DE API GERADO NO PASSO 2 (Do nosso guia anterior) **
const API_URL = 'https://script.google.com/macros/s/AKfycbxiPJJEwIejR0fyZ-6qcveZxrkttBkcPE1UF3EJhyq5r-2BTc-Kd8vQvLQOzk6O9t6Y/exec'; 
// --- Senha simples para a Área Admin ---
const SENHA_ADMIN = 'admin123'; // *** TROQUE ISSO POR UMA SENHA FORTE! ***

// --- Funções de Controle de Acesso e Visualização ---

function exibirAreaAdmin() {
    const senhaDigitada = prompt("Por favor, digite a senha de administrador:");
    if (senhaDigitada === SENHA_ADMIN) {
        document.getElementById('area-consulta-publica').style.display = 'none';
        document.getElementById('area-admin').style.display = 'block';
        alert("Acesso concedido à Área Admin.");
    } else if (senhaDigitada !== null) { // Evita a mensagem se o usuário cancelar
        alert("Senha incorreta. Acesso negado.");
    }
}

function voltarParaConsulta() {
    document.getElementById('area-consulta-publica').style.display = 'block';
    document.getElementById('area-admin').style.display = 'none';
}

// --- Lógica de Admin (Salvar/POST) ---

async function salvarResultado() {
    const cpfInput = document.getElementById('cpfAdmin').value.replace(/\D/g, '');
    const resultadoInput = document.getElementById('resultadoAdmin').value.trim();
    const mensagemAdmin = document.getElementById('mensagemAdmin');
    mensagemAdmin.textContent = 'Salvando... Aguarde.';
    mensagemAdmin.className = 'invalido'; 


    // Usamos POST para enviar dados para a API
    const url = `${API_URL}?action=salvar&cpf=${cpfInput}&resultado=${resultadoInput}`;

    try {
        const response = await fetch(url, { method: 'POST' });
        const data = await response.json();

        if (data.status === 'cadastrado' || data.status === 'atualizado') {
            const acao = (data.status === 'cadastrado') ? 'cadastrado' : 'atualizado';
            mensagemAdmin.textContent = `Resultado do CPF ${cpfInput} ${acao} com sucesso na nuvem!`;
            mensagemAdmin.className = 'negativo';
        } else {
            mensagemAdmin.textContent = 'Erro ao salvar. Verifique o Apps Script e a URL.';
            mensagemAdmin.className = 'positivo';
        }

        document.getElementById('cpfAdmin').value = '';
        document.getElementById('resultadoAdmin').value = '';

    } catch (error) {
        mensagemAdmin.textContent = `Erro de conexão: Não foi possível alcançar o Google Sheets.`;
        mensagemAdmin.className = 'positivo';
    }
}

// --- Lógica de Consulta Pública (Ler/GET) ---

async function consultarResultado(formId) {
    // A função precisa ser assíncrona (async) para usar await
async function consultarResultado(formId) {
    const resultadoDiv = document.getElementById('resultadoPublico');
    const cpfElement = document.getElementById(formId === 'formConsultaPublica' ? 'cpfConsultaPublica' : 'cpfAdmin');
    const cpfConsulta = cpfElement.value.replace(/\D/g, ''); // Limpa e pega o CPF

    // 1. Validação de Campo Vazio
    if (cpfConsulta === '') {
        resultadoDiv.className = 'invalido';
        resultadoDiv.innerHTML = "Por favor, preencha o campo CPF.";
        return;
    }

    // Exibe a mensagem de 'Consultando...'
    resultadoDiv.className = 'invalido';
    resultadoDiv.innerHTML = "Consultando... Aguarde.";
    
    // VARIÁVEL QUE VAI RECEBER A RESPOSTA
    let responseData = null;

    try {
        const url = `${API_URL}?action=consultar&cpf=${cpfConsulta}`;
        
        // Timeout para garantir que o 'Aguarde' não fique para sempre
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId); // Limpa o timeout se a resposta for rápida

        if (!response.ok) {
            throw new Error(`Erro de Rede: ${response.status}`);
        }
        
        responseData = await response.json();

        // 2. Lógica de Sucesso ou Não Encontrado
        if (responseData.status === 'sucesso') {
            const resTexto = responseData.resultado.toLowerCase();
            let classe = 'invalido';
            let dataExame = responseData.dataCadastro || "Data Desconhecida"; 
            
            // Tenta converter a data para um formato amigável (DD/MM/AAAA)
            let dataDisplay = dataExame;
            try {
                const dataObj = new Date(dataExame); 
                if (!isNaN(dataObj.getTime())) {
                    dataDisplay = dataObj.toLocaleDateString('pt-BR'); 
                }
            } catch (e) { /* Usa o formato original se falhar */ }
            
            // Define a classe de cor com base no resultado
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
            resultadoDiv.className = 'invalido';
            resultadoDiv.innerHTML = "CPF não encontrado ou resultado ainda não cadastrado.";
        
        } else {
            // Se o status for 'erro_interno' do Apps Script
            resultadoDiv.className = 'invalido';
            resultadoDiv.innerHTML = "Erro interno do servidor. Tente novamente mais tarde.";
        }

    } catch (error) {
        // 3. Lógica de Erro de Conexão/Timeout
        resultadoDiv.className = 'invalido';
        if (error.name === 'AbortError') {
             resultadoDiv.innerHTML = "Tempo limite excedido. O servidor demorou muito para responder.";
        } else {
             resultadoDiv.innerHTML = `Erro na consulta: ${error.message}`;
        }
    }
    
    // Este bloco 'finally' não é estritamente necessário se o código acima
    // sempre substituir o innerHTML, mas garante que o UI não fique travado.
}

// Adiciona os listeners após o carregamento da página
window.onload = function() {
    // Listener para o formulário de consulta pública
    const formPublica = document.getElementById('formConsultaPublica');
    if (formPublica) {
        formPublica.addEventListener('submit', function(e) {
            e.preventDefault();
            consultarResultado('formConsultaPublica');
        });
    }

    // Listener para o formulário de cadastro Admin
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
            consultarResultado('formAdmin'); // Reutiliza a função de consulta, mas com ID Admin
        });
    }
}
