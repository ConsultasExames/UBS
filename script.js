// --- Lógica de Admin (Salvar) ---

function salvarResultado() {
    const cpfInput = document.getElementById('cpfAdmin').value.replace(/\D/g, ''); // Remove não-dígitos
    const resultadoInput = document.getElementById('resultadoAdmin').value.trim();
    const mensagemAdmin = document.getElementById('mensagemAdmin');

    if (cpfInput.length !== 11) {
        mensagemAdmin.textContent = "Erro: O CPF deve ter 11 dígitos.";
        mensagemAdmin.className = 'invalido';
        return;
    }

    if (!resultadoInput) {
        mensagemAdmin.textContent = "Erro: O campo de resultado não pode estar vazio.";
        mensagemAdmin.className = 'invalido';
        return;
    }

    // 1. Pega os resultados existentes (ou um array vazio se não houver nada)
    let resultados = JSON.parse(localStorage.getItem('resultadosExames')) || [];

    // 2. Verifica se o CPF já existe
    const index = resultados.findIndex(res => res.cpf === cpfInput);

    const novoRegistro = {
        cpf: cpfInput,
        resultado: resultadoInput,
        data: new Date().toLocaleDateString('pt-BR')
    };

    if (index > -1) {
        // Atualiza o resultado
        resultados[index] = novoRegistro;
        mensagemAdmin.textContent = `Resultado do CPF ${cpfInput} atualizado com sucesso!`;
    } else {
        // Adiciona um novo resultado
        resultados.push(novoRegistro);
        mensagemAdmin.textContent = `Novo resultado para o CPF ${cpfInput} cadastrado com sucesso!`;
    }

    // 3. Salva a lista de volta no localStorage
    localStorage.setItem('resultadosExames', JSON.stringify(resultados));

    // Limpa os campos após salvar
    document.getElementById('cpfAdmin').value = '';
    document.getElementById('resultadoAdmin').value = '';

    // Atualiza a tabela de resultados na página admin
    if (document.getElementById('tabelaResultados')) {
        carregarTabelaResultados();
    }
}

// --- Lógica de Consulta (Ler) ---

function consultarResultado() {
    const cpfConsulta = document.getElementById('cpfConsulta').value.replace(/\D/g, '');
    const resultadoDiv = document.getElementById('resultado');

    if (cpfConsulta.length !== 11) {
        resultadoDiv.innerHTML = "Por favor, digite um CPF válido com 11 dígitos.";
        resultadoDiv.className = 'invalido';
        return;
    }

    // Pega os resultados
    const resultados = JSON.parse(localStorage.getItem('resultadosExames')) || [];

    // Busca o resultado pelo CPF
    const resultado = resultados.find(res => res.cpf === cpfConsulta);

    if (resultado) {
        const resTexto = resultado.resultado.toLowerCase();
        let classe = 'invalido';
        let textoFinal = `**Resultado do Exame** (${resultado.data}): <br>`;

        if (resTexto.includes('positivo') || resTexto.includes('reagente')) {
            classe = 'positivo';
            textoFinal += `<span class="resultado-destaque">${resultado.resultado}</span>`;
        } else if (resTexto.includes('negativo') || resTexto.includes('não reagente')) {
            classe = 'negativo';
            textoFinal += `<span class="resultado-destaque">${resultado.resultado}</span>`;
        } else {
            // Outros resultados (aguardando, inconclusivo, etc.)
            classe = 'invalido';
            textoFinal += `<span class="resultado-destaque">${resultado.resultado}</span>`;
        }

        resultadoDiv.innerHTML = textoFinal;
        resultadoDiv.className = classe;

    } else {
        resultadoDiv.innerHTML = "CPF não encontrado ou resultado ainda não cadastrado.";
        resultadoDiv.className = 'invalido';
    }
}

// --- Funções para a Tabela Admin ---

function carregarTabelaResultados() {
    const tabelaBody = document.querySelector('#tabelaResultados tbody');
    if (!tabelaBody) return; // Sai se não estiver na página admin

    tabelaBody.innerHTML = ''; // Limpa as linhas existentes
    const resultados = JSON.parse(localStorage.getItem('resultadosExames')) || [];

    resultados.forEach(res => {
        const row = tabelaBody.insertRow();
        const cellCPF = row.insertCell();
        const cellResultado = row.insertCell();
        const cellData = row.insertCell();
        const cellAcoes = row.insertCell();

        cellCPF.textContent = formatarCPF(res.cpf);
        cellResultado.textContent = res.resultado;
        cellData.textContent = res.data;

        const btnExcluir = document.createElement('button');
        btnExcluir.textContent = 'Excluir';
        btnExcluir.onclick = () => excluirResultado(res.cpf);
        btnExcluir.style.backgroundColor = '#dc3545';
        btnExcluir.style.color = 'white';
        btnExcluir.style.width = 'auto';
        btnExcluir.style.padding = '5px 10px';
        btnExcluir.style.margin = '0';
        cellAcoes.appendChild(btnExcluir);
    });
}

function excluirResultado(cpf) {
    if (confirm(`Tem certeza que deseja excluir o resultado do CPF ${formatarCPF(cpf)}?`)) {
        let resultados = JSON.parse(localStorage.getItem('resultadosExames')) || [];
        resultados = resultados.filter(res => res.cpf !== cpf);
        localStorage.setItem('resultadosExames', JSON.stringify(resultados));
        carregarTabelaResultados();
    }
}

function formatarCPF(cpf) {
    // Formata o CPF como XXX.XXX.XXX-XX
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// --- Adiciona listeners para rodar as funções ---

// Executa carregarTabelaResultados quando a página admin.html carregar
if (document.getElementById('tabelaResultados')) {
    window.onload = carregarTabelaResultados;
}

// Exemplo de como aplicar o listener em admin.html (Será colocado lá)
// document.getElementById('formAdmin').addEventListener('submit', function(e) {
//     e.preventDefault();
//     salvarResultado();
// });