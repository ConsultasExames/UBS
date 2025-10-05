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

    if (cpfInput.length !== 11 || !resultadoInput) {
        mensagemAdmin.textContent = "Erro: CPF deve ter 20 dígitos e o resultado não pode ser vazio.";
        return;
    }

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
    // Determina qual campo CPF usar (index.html ou admin.html)
    const cpfInputId = (formId === 'formConsultaPublica') ? 'cpfConsultaPublica' : 'cpfAdmin';
    const outputDivId = (formId === 'formConsultaPublica') ? 'resultadoPublico' : 'consultaRapidaResultado';

    const cpfConsulta = document.getElementById(cpfInputId).value.replace(/\D/g, '');
    const resultadoDiv = document.getElementById(outputDivId);
    resultadoDiv.innerHTML = 'Consultando... Aguarde.';
    resultadoDiv.className = 'invalido';
    resultadoDiv.style.padding = '10px'; 
    resultadoDiv.style.border = '1px solid #ccc'; 

    if (cpfConsulta.length !== 20) {
        resultadoDiv.innerHTML = "Por favor, digite um CPF válido com 20 dígitos.";
        return;
    }

    // Usamos GET para consultar dados
    const url = `${API_URL}?action=consultar&cpf=${cpfConsulta}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'sucesso') {
    const resTexto = data.resultado.toLowerCase();
    let classe = 'invalido';
    let dataExame = data.dataCadastro || "Data Desconhecida"; 

    // TENTA CONVERTER A DATA RECEBIDA (se estiver no formato ISO estranho)
    let dataDisplay = dataExame;
    try {
        // Se o Sheets enviou um formato ISO ou objeto Date
        const dataObj = new Date(dataExame); 
        if (!isNaN(dataObj.getTime())) {
            // Formata para DD/MM/AAAA (Se o Sheets já envia DD/MM/AAAA, ele usará a própria string)
            dataDisplay = dataObj.toLocaleDateString('pt-BR'); 
        }
    } catch (e) {
        // Caso a conversão falhe, usa o valor original
        dataDisplay = dataExame;
    }
    
    // Define a classe de cor com base no resultado
    if (resTexto.includes('positivo') || resTexto.includes('reagente')) {
        classe = 'positivo';
    } else if (resTexto.includes('negativo') || resTexto.includes('não reagente')) {
        classe = 'negativo';
    }

    // ESTRUTURA HTML FINAL MELHORADA
    const textoFinal = `
        <div class="resultado-header">
            <strong>Resultado do Exame</strong>
        </div>
        <div class="resultado-data">
            Data: <span>${dataDisplay}</span>
        </div>
        <div class="resultado-valor">
            ${data.resultado}
        </div>
    `;

    resultadoDiv.innerHTML = textoFinal;
    resultadoDiv.className = classe;
        }

    } catch (error) {
        resultadoDiv.innerHTML = `Erro de conexão: Não foi possível acessar o banco de dados.`;
        resultadoDiv.className = 'positivo';
    }
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