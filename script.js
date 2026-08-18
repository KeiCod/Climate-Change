// 1. Elementos do Cabeçalho e Mensagens
const inputCidade = document.querySelector('header input');
const btnBusca = document.querySelector('.btn-busca');
const msgErro = document.querySelector('.mensagem-erro');

// 2. Elementos Principais do Clima
const elementoCidade = document.querySelector('.cidade');
const elementoData = document.querySelector('.data');
const iconeClima = document.querySelector('.icone-clima');
const elementoTemperatura = document.querySelector('.temperatura');
const elementoDescricao = document.querySelector('.descricao');

// 3. Elementos da Grade de Detalhes
const elementoUmidade = document.querySelector('.detalhes p:nth-child(1)');
const elementoVento = document.querySelector('.detalhes p:nth-child(2)');
const elementoPorSol = document.querySelector('.detalhes p:nth-child(3)');
const elementoNascerLua = document.querySelector('.detalhes p:nth-child(4)');

// 4. Seções de Carrossel e Cuidados
const containerHoras = document.querySelector('.container-horas');
const botoesPerfil = document.querySelectorAll('.btn-perfil');
const cardAlerta = document.querySelector('.card-alerta');

// Chave da API OpenWeatherMap
const CHAVE_API = '5f58cf35d7236108d717dbcf26fe6c57';

// Variável para armazenar a temperatura atual globalmente (usada nos alertas)
let temperaturaAtual = 25;

// 5. Função assíncrona para buscar os dados do clima atual na API
async function buscarDadosClima(cidade) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&units=metric&lang=pt_br&appid=${CHAVE_API}`;
        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error('Cidade não encontrada');
        }

        const dados = await resposta.json();
        msgErro.style.display = 'none';
        return dados;

    } catch (erro) {
        msgErro.textContent = 'Cidade não encontrada. Verifique o nome digitado.';
        msgErro.style.display = 'block';
        console.error('Erro na requisição:', erro.message);
    }
}

// 6. Função assíncrona para buscar a previsão de 5 dias/3 horas (para o carrossel)
async function buscarPrevisaoHoraria(cidade) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&units=metric&lang=pt_br&appid=${CHAVE_API}`;
        const resposta = await fetch(url);
        
        if (!resposta.ok) return;

        const dados = await resposta.json();
        renderizarPrevisaoHoraria(dados.list);
    } catch (erro) {
        console.error('Erro ao buscar previsão horária:', erro);
    }
}

// 7. Função principal de busca acionada pelo usuário
async function buscarClima() {
    const cidade = inputCidade.value.trim();
    if (cidade === '') return;

    const dadosClima = await buscarDadosClima(cidade);

    if (dadosClima) {
        atualizarInterface(dadosClima);
        buscarPrevisaoHoraria(cidade);
    }
}

// 8. Escutadores de Eventos
btnBusca.addEventListener('click', buscarClima);
inputCidade.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        buscarClima();
    }
});

// 9. Função para atualizar a interface com o clima atual
function atualizarInterface(dados) {
    elementoCidade.textContent = `${dados.name}, ${dados.sys.country}`;

    const agora = new Date();
    const opcoesData = { weekday: 'long', day: 'numeric', month: 'long' };
    elementoData.textContent = agora.toLocaleDateString('pt-BR', opcoesData);

    temperaturaAtual = Math.round(dados.main.temp);
    elementoTemperatura.textContent = `${temperaturaAtual}°C`;
    elementoDescricao.textContent = dados.weather[0].description;

    const codigoIcone = dados.weather[0].icon;
    iconeClima.src = `https://openweathermap.org/img/wn/${codigoIcone}@2x.png`;
    iconeClima.alt = dados.weather[0].description;

    elementoUmidade.innerHTML = `💧 Umidade: <strong>${dados.main.humidity}%</strong>`;
    elementoVento.innerHTML = `💨 Vento: <strong>${Math.round(dados.wind.speed * 3.6)} km/h</strong>`;

    const horarioPorSol = new Date(dados.sys.sunset * 1000).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    elementoPorSol.innerHTML = `🌅 Pôr do Sol: <strong>${horarioPorSol}</strong>`;
    elementoNascerLua.innerHTML = `🌙 Nascer da Lua: <strong>21:45</strong>`;

    atualizarTemaClima(codigoIcone);
    
    // Atualiza o alerta com base no perfil ativo
    const perfilAtivo = document.querySelector('.btn-perfil.active') ? document.querySelector('.btn-perfil.active').textContent.toLowerCase() : 'pet';
    atualizarAlertaCuidados(perfilAtivo);
}

// 10. Função para renderizar os cartões da previsão horária no carrossel
function renderizarPrevisaoHoraria(listaHoras) {
    containerHoras.innerHTML = ''; // Limpa os cartões estáticos

    // Pega as primeiras 6 previsões (próximas 18 horas)
    const proximasHoras = listaHoras.slice(0, 6);

    proximasHoras.forEach(item => {
        const horaFormatada = new Date(item.dt * 1000).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const card = document.createElement('div');
        card.classList.add('card-hora');
        card.innerHTML = `
            <span>${horaFormatada}</span>
            <img class="icone-hora" src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}">
            <strong>${Math.round(item.main.temp)}°C</strong>
        `;
        containerHoras.appendChild(card);
    });
}

// 11. Função para trocar a classe do tema dinâmico no body
function atualizarTemaClima(codigoIcone) {
    document.body.className = '';
    const ehNoite = codigoIcone.endsWith('n');

    if (codigoIcone.startsWith('09') || codigoIcone.startsWith('10') || codigoIcone.startsWith('11')) {
        document.body.classList.add('tema-chuva');
    } else if (ehNoite) {
        document.body.classList.add('tema-noite');
    } else if (codigoIcone.startsWith('01') || codigoIcone.startsWith('02')) {
        document.body.classList.add('tema-dia');
    } else {
        document.body.classList.add('tema-nublado');
    }
}

// 12. Alternância e atualização dos alertas por perfil (Pet, Bebê, Idoso)
botoesPerfil.forEach(botao => {
    botao.addEventListener('click', () => {
        botoesPerfil.forEach(b => b.classList.remove('active'));
        botao.classList.add('active');

        const perfil = botao.textContent.toLowerCase();
        atualizarAlertaCuidados(perfil);
    });
});

function atualizarAlertaCuidados(perfil) {
    let mensagem = '';

    if (perfil.includes('pet')) {
        if (temperaturaAtual > 28) {
            mensagem = '🐾 <strong>Cuidado com o Pet:</strong> O asfalto está quente! Evite passeios nos horários de pico e mantenha água fresca.';
        } else if (temperaturaAtual < 15) {
            mensagem = '🐾 <strong>Cuidado com o Pet:</strong> Mantenha seu pet aquecido e abrigado do vento frio.';
        } else {
            mensagem = '🐾 <strong>Dica Pet:</strong> Clima agradável para passeios no parque e brincadeiras ao ar livre!';
        }
    } else if (perfil.includes('bebê') || perfil.includes('bebe')) {
        if (temperaturaAtual > 28) {
            mensagem = '👶 <strong>Cuidado com o Bebê:</strong> Mantenha a hidratação reforçada e use roupas leves de algodão.';
        } else if (temperaturaAtual < 18) {
            mensagem = '👶 <strong>Cuidado com o Bebê:</strong> Vista o bebê com camadas de roupas confortáveis para mantê-lo aquecido.';
        } else {
            mensagem = '👶 <strong>Dica Bebê:</strong> Temperatura excelente para um passeio de carrinho na sombra.';
        }
    } else if (perfil.includes('idoso')) {
        if (temperaturaAtual > 28) {
            mensagem = '👴 <strong>Cuidado com Idosos:</strong> Ambiente propício para desidratação. Incentive o consumo frequente de água.';
        } else if (temperaturaAtual < 16) {
            mensagem = '👴 <strong>Cuidado com Idosos:</strong> Atenção às dores articulares e às mudanças bruscas de temperatura.';
        } else {
            mensagem = '👴 <strong>Dica Idosos:</strong> Excelente dia para caminhadas leves ao ar livre nos horários recomendados.';
        }
    }

    cardAlerta.innerHTML = mensagem;
}

// Captura do botão de localização
const btnLocalizacao = document.querySelector('.btn-localizacao');

// Função para buscar clima usando Latitude e Longitude
async function buscarClimaPorCoordenadas(lat, lon) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${CHAVE_API}`;
        const resposta = await fetch(url);

        if (!resposta.ok) throw new Error('Erro ao buscar localização');

        const dados = await resposta.json();
        
        if (msgErro) msgErro.style.display = 'none';

        atualizarInterface(dados);
        buscarPrevisaoHoraria(dados.name);

    } catch (erro) {
        console.error('Erro na geolocalização:', erro);
    }
}

// Função que aciona a API de geolocalização do navegador
function obterLocalizacaoUsuario() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (posicao) => {
                const lat = posicao.coords.latitude;
                const lon = posicao.coords.longitude;
                buscarClimaPorCoordenadas(lat, lon);
            },
            (erro) => {
                console.warn('Permissão de localização negada ou indisponível:', erro.message);
                if (msgErro) {
                    msgErro.textContent = 'Permissão de localização negada.';
                    msgErro.style.display = 'block';
                }
            }
        );
    } else {
        alert('Seu navegador não suporta geolocalização.');
    }
}

// Evento de clique no botão de localização
if (btnLocalizacao) {
    btnLocalizacao.addEventListener('click', obterLocalizacaoUsuario);
}

async function buscarClima() {
    const cidade = inputCidade.value.trim();

    if (cidade === '') return;

    const dadosClima = await buscarDadosClima(cidade);

    if (dadosClima) {
        atualizarInterface(dadosClima);
        buscarPrevisaoHoraria(cidade);
        
        // Salva a cidade no navegador do usuário
        localStorage.setItem('ultimaCidade', cidade);
    }
}

// Executado automaticamente ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    // Busca a cidade salva no localStorage ou usa 'São Paulo' como padrão
    const cidadeSalva = localStorage.getItem('ultimaCidade') || 'São Paulo';
    
    // Preenche o input com o nome da cidade e realiza a busca
    inputCidade.value = cidadeSalva;
    buscarClima();
});