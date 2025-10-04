// ** COLE AQUI O URL DE API GERADO NO PASSO 2 **
const API_URL = 'https://script.google.com/macros/s/AKfycbxptiwOyiUvJqMiI1XxuV77hQq-NxRnd9o68BGFjGC3sYuzhQUygi3k87WdeTrSEId5/exec'; 

// --- Lógica de Admin (Salvar/POST) ---

async function salvarResultado() {
    const cpfInput = document.getElementById('cpfAdmin').value.replace(/\D/g, '');
    const resultadoInput = document.getElementById('resultadoAdmin').value.trim();
    const mensagemAdmin = document.getElementById('mensagemAdmin');
    mensagemAdmin.textContent = 'Salvando... Aguarde.';
    mensagemAdmin.className = 'invalido'; 

    if (cpfInput.length !== 11 || !resultadoInput) {
        mensagemAdmin.textContent = "Erro: CPF deve ter 11 dígitos e o resultado não pode ser vazio.";
        return;
    }

    // Usamos POST para enviar dados de forma mais segura
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

// --- Lógica de Consulta (Ler/GET) ---

async function consultarResultado() {
    const cpfConsulta = document.getElementById('cpfConsulta').value.replace(/\D/g, '');
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.innerHTML = 'Consultando... Aguarde.';
    resultadoDiv.className = 'invalido';

    if (cpfConsulta.length !== 11) {
        resultadoDiv.innerHTML = "Por favor, digite um CPF válido com 11 dígitos.";
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
            let textoFinal = `**Resultado do Exame** (Data: ${data.dataCadastro}): <br>`;

            if (resTexto.includes('positivo') || resTexto.includes('reagente')) {
                classe = 'positivo';
            } else if (resTexto.includes('negativo') || resTexto.includes('não reagente')) {
                classe = 'negativo';
            }

            // O resultado final usa a classe para a cor, mas exibe o texto completo
            textoFinal += `<span class="resultado-destaque">${data.resultado}</span>`;
            resultadoDiv.innerHTML = textoFinal;
            resultadoDiv.className = classe;

        } else if (data.status === 'nao_encontrado') {
            resultadoDiv.innerHTML = "CPF não encontrado ou resultado ainda não cadastrado.";
            resultadoDiv.className = 'invalido';
        }

    } catch (error) {
        resultadoDiv.innerHTML = `Erro de conexão: Não foi possível acessar o banco de dados.`;
        resultadoDiv.className = 'positivo';
    }
}