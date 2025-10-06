// ======================================================================
// 1. CONFIGURAÇÕES CRÍTICAS
// ======================================================================

// ⚠️ ATUALIZE ESTA URL com o link da sua API do Google Apps Script (Deployment)
const API_URL = 'https://script.google.com/macros/s/AKfycbxiPJJEwIejR0fyZ-6qcveZxrkttBkcPE1UF3EJhyq5r-2BTc-Kd8vQvLQOzk6O9t6Y/exec'; 
const SENHA_ADMIN = 'UBS@20252026'; // Defina sua senha de administrador

// ======================================================================
// 2. FUNÇÕES DE UTILIDADE E CONTROLE DE TELA
// ======================================================================

// Exibe a área de administração após a senha
function exibirAreaAdmin() {
    const senha = prompt("Digite a senha de administrador:");
    if (senha === SENHA_ADMIN) {
        document.getElementById('area-consulta-publica').style.display = 'none';
        document.getElementById('area-admin').style.display = 'block';
        document.getElementById('link-admin').style.display = 'none';
        
        // Limpa a mensagem anterior
        document.getElementById('resultadoPublico').innerHTML = '';
        document.getElementById('resultadoPublico').className = '';
    } else if (senha !== null) {
        alert("Senha incorreta.");
    }
}

// Volta para a área de consulta pública
function voltarParaConsulta() {
    document.getElementById('area-admin').style.display = 'none';
    document.getElementById('area-consulta-publica').style.display = 'block';
    document.getElementById('link-admin').style.display = 'block';
    
    // Limpa os campos e mensagens
    document.getElementById('cpfAdmin').value = '';
    document.getElementById('resultadoAdmin').value = '';
    document.getElementById('mensagemAdmin').innerHTML = '';
    document.getElementById('consultaRapidaResultado').innerHTML = '';
}


// ======================================================================
// 3. FUNÇÃO DE CONSULTA (CHAVE PARA RESOLVER O PROBLEMA DO 'AGUARDE')
// ======================================================================

async function consultarResultado(formId) {
    // Determina a div de exibição do resultado
    const resultadoDiv = document.getElementById(formId === 'formConsultaPublica' ? 'resultadoPublico' : 'consultaRapidaResultado');
    
    // Pega o elemento do CPF (funciona para as duas áreas)
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
    
    try {
        const url = `${API_URL}?action=consultar&cpf=${cpfConsulta}`;
        
        // Timeout para garantir que o 'Aguarde' não fique para sempre (10 segundos)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); 

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId); 

        if (!response.ok) {
            throw new Error(`Erro de Rede: ${response.status}`);
        }
        
        const responseData = await response.json();

        // 2. Lógica de Sucesso ou Não Encontrado (Retorno do Google Apps Script)
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
            } catch (e) { /* Usa o formato original se falhar */ }
            
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
            // Se o CPF não foi encontrado (resolve o problema de travamento)
            resultadoDiv.className = 'invalido';
            resultadoDiv.innerHTML = "CPF não encontrado ou resultado ainda não cadastrado.";
        
        } else {
            resultadoDiv.className = 'invalido';
            resultadoDiv.innerHTML = "Erro interno do servidor. Status desconhecido.";
        }

    } catch (error) {
        // 3. O BLOCO CATCH: Garante que a mensagem de "Aguarde" seja limpa em caso de falha
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
    const cpfInput = document.getElementById('cpfAdmin').value.replace(/\D/g, '');
    const resultadoInput = document.getElementById('resultadoAdmin').value;
    const mensagemAdmin = document.getElementById('mensagemAdmin');
    
    // Nenhuma validação de comprimento de CPF (sem limites)
    if (cpfInput === '' || resultadoInput === '') {
        mensagemAdmin.className = 'invalido';
        mensagemAdmin.innerHTML = "Erro: CPF e Resultado são obrigatórios.";
        return;
    }

    mensagemAdmin.className = 'invalido';
    mensagemAdmin.innerHTML = "Salvando... Aguarde.";
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'salvar');
        formData.append('cpf', cpfInput);
        formData.append('resultado', resultadoInput);

        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Erro de Rede: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'cadastrado') {
            mensagemAdmin.className = 'positivo';
            mensagemAdmin.innerHTML = 'Resultado cadastrado com sucesso!';
        } else if (data.status === 'atualizado') {
            mensagemAdmin.className = 'positivo';
            mensagemAdmin.innerHTML = 'Resultado atualizado com sucesso!';
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

    // Listener para o botão de consulta rápida dentro do Admin (Usa 'click' e a função de consulta)
    const btnConsultaAdmin = document.getElementById('btnConsultaAdmin');
    if (btnConsultaAdmin) {
        btnConsultaAdmin.addEventListener('click', function() {
            consultarResultado('formAdmin'); 
        });
    }

    // NOTA: O formulário público usa 'onclick="consultarResultado(...)"" diretamente no HTML.
    // Se o seu index.html ainda usa <form> e type="submit", adicione o listener aqui:
    /*
    const formPublica = document.getElementById('formConsultaPublica');
    if (formPublica) {
        formPublica.addEventListener('submit', function(e) {
            e.preventDefault();
            consultarResultado('formConsultaPublica');
        });
    }
    */
}
