/* ==========================================================================
   1. ELEMENTOS DO DOM
   ========================================================================== */
const inputCidade = document.querySelector('header input');
const btnBusca = document.querySelector('.btn-busca');
const btnLocalizacao = document.querySelector('.btn-localizacao');
const msgErro = document.querySelector('.mensagem-erro');
const elValorUV = document.querySelector('#valor-uv');
const elAlertaUV = document.querySelector('#alerta-uv');
const ctxGrafico = document.getElementById('graficoTemperatura');
let meuGrafico = null; // Guardará a instância do Chart.js para podermos atualizar

// Elementos Principais do Clima
const elementoCidade = document.querySelector('.cidade');
const elementoData = document.querySelector('.data');
const iconeClima = document.querySelector('.icone-clima');
const elementoTemperatura = document.querySelector('.temperatura');
const elementoDescricao = document.querySelector('.descricao');

// Elementos de Detalhes
const elementoUmidade = document.querySelector('.detalhes p:nth-child(1)');
const elementoVento = document.querySelector('.detalhes p:nth-child(2)');
const elementoPorSol = document.querySelector('.detalhes p:nth-child(3)');
const elementoNascerLua = document.querySelector('.detalhes p:nth-child(4)');

// Seções e Controles
const containerHoras = document.querySelector('.container-horas');
const botoesPerfil = document.querySelectorAll('.btn-perfil');
const cardAlerta = document.querySelector('.card-alerta');

// Elementos de Astronomia
const elFaseLua = document.querySelector('.fase-lua span');
const elVisibilidadeCeu = document.querySelector('.visibilidade-ceu span');
const elTextoEvento = document.querySelector('#texto-evento');

/* ==========================================================================
   2. CONFIGURAÇÕES, MAPEAMENTOS E ESTADO GLOBAL
   ========================================================================== */
const CHAVE_API = '5f58cf35d7236108d717dbcf26fe6c57';
let temperaturaAtual = 25;

// Mapeamento para SVGs animados via CDN (Bas Milius Meteocons)
const mapaIconesAnimados = {
    '01d': 'clear-day.svg',
    '01n': 'clear-night.svg',
    '02d': 'partly-cloudy-day.svg',
    '02n': 'partly-cloudy-night.svg',
    '03d': 'cloudy.svg',
    '03n': 'cloudy.svg',
    '04d': 'overcast-day.svg',
    '04n': 'overcast-night.svg',
    '09d': 'drizzle.svg',
    '09n': 'drizzle.svg',
    '10d': 'rain.svg',
    '10n': 'rain.svg',
    '11d': 'thunderstorms-day.svg',
    '11n': 'thunderstorms-night.svg',
    '13d': 'snow.svg',
    '13n': 'snow.svg',
    '50d': 'mist.svg',
    '50n': 'mist.svg'
};

const eventosAstronomicos = [
    { nome: "Chuva de Meteoros Perseidas", data: "12-08", desc: "Pico de chuva de meteoros com até 100 rastros por hora visíveis a olho nu." },
    { nome: "Superlua / Lua Cheia", data: "17-09", desc: "A Lua estará em seu ponto mais próximo da Terra, parecendo maior e mais brilhante." },
    { nome: "Eclipse Solar Anular", data: "02-10", desc: "A Lua passará entre a Terra e o Sol, criando o famoso efeito 'Anel de Fogo'." },
    { nome: "Chuva de Meteoros Gemínidas", data: "14-12", desc: "Uma das chuvas de meteoros mais intensas e brilhantes do ano." }
];

/* ==========================================================================
   3. REQUISIÇÕES DA API (FETCH)
   ========================================================================== */
// Busca o Índice UV pelas coordenadas
// Altere a chamada na função buscarIndiceUV:
async function buscarIndiceUV(lat, lon, codigoIcone) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${CHAVE_API}`;
        const resposta = await fetch(url);

        if (!resposta.ok) return;

        const dados = await resposta.json();
        atualizarCardUV(dados.value, codigoIcone);
    } catch (erro) {
        console.error('Erro ao buscar Índice UV:', erro);
    }
}

// Busca dados do clima por nome da cidade
async function buscarDadosClima(cidade) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&units=metric&lang=pt_br&appid=${CHAVE_API}`;
        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error(`Cidade não encontrada (${resposta.status})`);
        }

        const dados = await resposta.json();
        ocultarErro();
        return dados;
    } catch (erro) {
        exibirErro('Cidade não encontrada ou chave de API aguardando ativação.');
        console.error('Erro na requisição:', erro.message);
    }
}

// Busca previsão horária
async function buscarPrevisaoHoraria(cidade) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&units=metric&lang=pt_br&appid=${CHAVE_API}`;
    const resposta = await fetch(url);
    
    if (!resposta.ok) return;

    const dados = await resposta.json();
    
    renderizarPrevisaoHoraria(dados.list);
    
    // 🚀 ADICIONE ESTA LINHA AQUI:
    renderizarGraficoTemperatura(dados.list);

  } catch (erro) {
    console.error('Erro ao buscar previsão horária:', erro);
  }
}

// Função para renderizar/atualizar o gráfico de temperatura
function renderizarGraficoTemperatura(listaHoras) {
  if (!ctxGrafico) return;

  // Pegamos as próximas 8 previsões (24 horas)
  const proximasHoras = listaHoras.slice(0, 8);

  // Extrai os horários (Ex: "12:00") e as temperaturas redondeadas
  const labels = proximasHoras.map(item => {
    return new Date(item.dt * 1000).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  const temperaturas = proximasHoras.map(item => Math.round(item.main.temp));

  // Se o gráfico já existir na tela, destruímos para desenhar o novo sem sobreposição
  if (meuGrafico) {
    meuGrafico.destroy();
  }

  // Criação do Gráfico com estilo personalizado
  meuGrafico = new Chart(ctxGrafico, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Temperatura (°C)',
        data: temperaturas,
        borderColor: '#ffffff',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        fill: true,
        tension: 0.4, // Curva suave na linha
        borderWidth: 3,
        pointBackgroundColor: '#ffffff',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false } // Esconde a legenda para ficar limpo
      },
      scales: {
        x: {
          ticks: { color: '#ffffff' },
          grid: { display: false }
        },
        y: {
          ticks: { color: '#ffffff' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      }
    }
  });
}


// Busca clima via Geolocalização
async function buscarClimaPorCoordenadas(lat, lon) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${CHAVE_API}`;
        const resposta = await fetch(url);

        if (!resposta.ok) throw new Error('Erro ao buscar localização');

        const dados = await resposta.json();
        ocultarErro();

        atualizarInterface(dados);
        buscarPrevisaoHoraria(dados.name);
        localStorage.setItem('ultimaCidade', dados.name);
        inputCidade.value = dados.name;
    } catch (erro) {
        console.error('Erro na geolocalização:', erro);
    }
}

/* ==========================================================================
   4. FUNÇÃO PRINCIPAL DE FLUXO
   ========================================================================== */
async function buscarClima() {
    const cidade = inputCidade.value.trim();
    if (cidade === '') return;

    const dadosClima = await buscarDadosClima(cidade);

    if (dadosClima) {
        atualizarInterface(dadosClima);
        buscarPrevisaoHoraria(cidade);
        localStorage.setItem('ultimaCidade', cidade);
    }
}

/* ==========================================================================
   5. ATUALIZAÇÃO DA INTERFACE (DOM)
   ========================================================================== */
function atualizarInterface(dados) {
    // 1. Cidade e Data
    elementoCidade.textContent = `${dados.name}, ${dados.sys.country}`;
    const agora = new Date();
    const opcoesData = { weekday: 'long', day: 'numeric', month: 'long' };
    elementoData.textContent = agora.toLocaleDateString('pt-BR', opcoesData);

    // 2. Temperatura e Descrição
    temperaturaAtual = Math.round(dados.main.temp);
    elementoTemperatura.textContent = `${temperaturaAtual}°C`;
    elementoDescricao.textContent = dados.weather[0].description;

    // 3. Ícone Animado via CDN
    const codigoIcone = dados.weather[0].icon;
    const iconeAnimado = mapaIconesAnimados[codigoIcone] || 'clear-day.svg';
    iconeClima.src = `https://cdn.jsdelivr.net/gh/basmilius/weather-icons@dev/production/fill/svg/${iconeAnimado}`;
    iconeClima.alt = dados.weather[0].description;

    // 4. Detalhes (Umidade, Vento, Pôr do Sol)
    elementoUmidade.innerHTML = `💧 Umidade: <strong>${dados.main.humidity}%</strong>`;
    elementoVento.innerHTML = `💨 Vento: <strong>${Math.round(dados.wind.speed * 3.6)} km/h</strong>`;

    const horarioPorSol = new Date(dados.sys.sunset * 1000).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    elementoPorSol.innerHTML = `🌅 Pôr do Sol: <strong>${horarioPorSol}</strong>`;

    // 5. Módulos Adicionais
    atualizarTemaClima(codigoIcone);
    
    const perfilAtivo = document.querySelector('.btn-perfil.active') 
        ? document.querySelector('.btn-perfil.active').textContent.toLowerCase() 
        : 'pet';
    atualizarAlertaCuidados(perfilAtivo);
    
    atualizarCardAstronomia(dados);

    // Busca o UV se houver coordenadas
    if (dados.coord) {
        buscarIndiceUV(dados.coord.lat, dados.coord.lon);
    }
    if (dados.coord) {
        buscarIndiceUV(dados.coord.lat, dados.coord.lon, dados.weather[0].icon);
    }
}

// Classifica o índice UV de acordo com a OMS
function atualizarCardUV(valorUV, codigoIcone = '') {
    if (!elValorUV) return;

    // Se o ícone for de noite ('n' no final), o UV é obrigatoriamente 0
    const ehNoite = codigoIcone.endsWith('n');
    const uv = ehNoite ? 0 : (valorUV !== undefined ? Math.round(valorUV) : 0);

    elValorUV.textContent = uv;

    if (!elAlertaUV) return;

    let textoAlerta = '';

    if (uv === 0) {
        textoAlerta = '🌙 Sem radiação UV no momento (Noite).';
    } else if (uv <= 2) {
        textoAlerta = '🟢 Baixo - Seguro para ficar ao ar livre.';
    } else if (uv <= 5) {
        textoAlerta = '🟡 Moderado - Use protetor solar e óculos.';
    } else if (uv <= 7) {
        textoAlerta = '🟠 Alto - Busque sombra no meio do dia!';
    } else if (uv <= 10) {
        textoAlerta = '🔴 Muito Alto - Evite exposição direta ao sol!';
    } else {
        textoAlerta = '🟣 Extremo - Proteção máxima necessária!';
    }

    elAlertaUV.textContent = textoAlerta;
}

// Renderiza a previsão das próximas horas
function renderizarPrevisaoHoraria(listaHoras) {
    if (!containerHoras) return;
    containerHoras.innerHTML = '';

    const proximasHoras = listaHoras.slice(0, 6);

    proximasHoras.forEach(item => {
        const horaFormatada = new Date(item.dt * 1000).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const card = document.createElement('div');
        card.classList.add('card-hora');
        
        const codigoIcone = item.weather[0].icon;
        const iconeAnimado = mapaIconesAnimados[codigoIcone] || 'clear-day.svg';

        card.innerHTML = `
            <span>${horaFormatada}</span>
            <img class="icone-hora" src="https://cdn.jsdelivr.net/gh/basmilius/weather-icons@dev/production/fill/svg/${iconeAnimado}" alt="${item.weather[0].description}">
            <strong>${Math.round(item.main.temp)}°C</strong>
        `;
        containerHoras.appendChild(card);
    });
}

// Alterna o tema da página conforme as condições
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

// Alertas por Perfil (Pet, Bebê, Idoso) com transição suave e inteligência por horário
function atualizarAlertaCuidados(perfil) {
    if (!cardAlerta) return;

    cardAlerta.classList.add('saindo');

    setTimeout(() => {
        const horaAtual = new Date().getHours();
        const ehNoite = horaAtual >= 18 || horaAtual < 6;
        const ehManha = horaAtual >= 6 && horaAtual < 12;

        let mensagem = '';

        if (perfil.includes('pet')) {
            if (temperaturaAtual > 28) {
                mensagem = ehNoite 
                    ? '🐾 <strong>Dica Pet (Noite):</strong> Temperatura alta. Prefira passeios em piso de grama.'
                    : '🐾 <strong>Cuidado com o Pet:</strong> Asfalto quente! Evite passeios no sol forte.';
            } else if (temperaturaAtual < 15) {
                mensagem = ehNoite 
                    ? '🐾 <strong>Cuidado com o Pet (Noite):</strong> Noite fria! Prepare uma caminha bem aquecida.'
                    : '🐾 <strong>Cuidado com o Pet:</strong> Dia frio. Mantenha seu pet aquecido.';
            } else {
                mensagem = ehManha 
                    ? '🐾 <strong>Dica Pet (Manhã):</strong> Horário ideal para o passeio matinal!'
                    : '🐾 <strong>Dica Pet:</strong> Excelente clima para passeios no parque.';
            }
        } else if (perfil.includes('bebê') || perfil.includes('bebe')) {
            if (temperaturaAtual > 28) {
                mensagem = ehNoite 
                    ? '👶 <strong>Cuidado com o Bebê (Noite):</strong> Quarto abafado? Use roupas leves para dormir.'
                    : '👶 <strong>Cuidado com o Bebê:</strong> Calor intenso. Ofereça bastante água e prefira sombras.';
            } else if (temperaturaAtual < 18) {
                mensagem = ehNoite 
                    ? '👶 <strong>Cuidado com o Bebê (Noite):</strong> Mantenha o bebê coberto confortavelmente.'
                    : '👶 <strong>Cuidado com o Bebê:</strong> Mantenha pés e mãos bem aquecidos.';
            } else {
                mensagem = ehManha 
                    ? '👶 <strong>Dica Bebê (Manhã):</strong> Momento perfeito para o banho de sol matinal!'
                    : '👶 <strong>Dica Bebê:</strong> Temperatura ótima para passeio de carrinho.';
            }
        } else if (perfil.includes('idoso')) {
            if (temperaturaAtual > 28) {
                mensagem = ehNoite 
                    ? '👴 <strong>Cuidado com Idosos (Noite):</strong> Mantenha água por perto durante a noite.'
                    : '👴 <strong>Cuidado com Idosos:</strong> Evite exposição ao sol e reforce o consumo de líquidos.';
            } else if (temperaturaAtual < 16) {
                mensagem = ehNoite 
                    ? '👴 <strong>Cuidado com Idosos (Noite):</strong> Proteja as articulações contra o frio noturno.'
                    : '👴 <strong>Cuidado com Idosos:</strong> Atenção às mudanças bruscas de temperatura.';
            } else {
                mensagem = ehManha 
                    ? '👴 <strong>Dica Idosos (Manhã):</strong> Excelente horário para caminhada leve.'
                    : '👴 <strong>Dica Idosos:</strong> Clima favorável para realizar atividades diárias.';
            }
        }

        cardAlerta.innerHTML = mensagem;
        cardAlerta.classList.remove('saindo');
    }, 150);
}

/* ==========================================================================
   6. MÓDULO DE ASTRONOMIA E EVENTOS
   ========================================================================== */
function calcularFaseLua(data = new Date()) {
    let ano = data.getFullYear();
    let mes = data.getMonth() + 1;
    let dia = data.getDate();

    if (mes < 3) {
        ano--;
        mes += 12;
    }

    const c = 365.25 * ano;
    const e = 30.6 * mes;
    const jd = c + e + dia - 694039.09;
    const ciclo = jd / 29.5305882;
    const fase = (ciclo - Math.floor(ciclo)) * 29.53;

    if (fase < 1.8456) return { nome: "🌑 Lua Nova" };
    if (fase < 5.53699) return { nome: "🌒 Lua Crescente" };
    if (fase < 9.22831) return { nome: "🌓 Quarto Crescente" };
    if (fase < 12.91963) return { nome: "🌔 Crescente Gibosa" };
    if (fase < 16.61096) return { nome: "🌕 Lua Cheia" };
    if (fase < 20.30228) return { nome: "🌖 Minguante Gibosa" };
    if (fase < 23.99361) return { nome: "🌗 Quarto Minguante" };
    if (fase < 27.68493) return { nome: "🌘 Lua Minguante" };
    return { nome: "🌑 Lua Nova" };
}

function avaliarObservacaoCeu(porcentagemNuvens) {
    if (porcentagemNuvens <= 15) {
        return "Excelente ✨ Céu limpo para ver constelações.";
    } else if (porcentagemNuvens <= 50) {
        return "🌤️ Moderada. Nuvens esparsas no céu.";
    } else {
        return "☁️ Ruim. Alta cobertura de nuvens.";
    }
}

function obterProximoEvento() {
    const hoje = new Date();
    const mesDiaAtual = `${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    const eventoEncontrado = eventosAstronomicos.find(ev => ev.data >= mesDiaAtual);

    if (eventoEncontrado) {
        return `<strong>${eventoEncontrado.nome} (${eventoEncontrado.data.split('-').reverse().join('/')}):</strong> ${eventoEncontrado.desc}`;
    } else {
        return "Nenhum evento raro agendado para os próximos dias neste mês.";
    }
}

function atualizarCardAstronomia(dadosClima) {
    const lua = calcularFaseLua();
    
    if (elFaseLua) elFaseLua.textContent = lua.nome;

    // Atualiza a Fase Lunar exibida no painel de detalhes
    if (elementoNascerLua) elementoNascerLua.innerHTML = `🌙 Fase Lunar: <strong>${lua.nome}</strong>`;

    const porcentagemNuvens = dadosClima.clouds ? dadosClima.clouds.all : 0;
    if (elVisibilidadeCeu) elVisibilidadeCeu.textContent = avaliarObservacaoCeu(porcentagemNuvens);

    if (elTextoEvento) elTextoEvento.innerHTML = obterProximoEvento();
}

/* ==========================================================================
   7. TRATAMENTO DE ERROS E MENSAGENS
   ========================================================================== */
function exibirErro(mensagem) {
    if (msgErro) {
        msgErro.textContent = mensagem;
        msgErro.style.display = 'block';
    }
}

function ocultarErro() {
    if (msgErro) {
        msgErro.style.display = 'none';
    }
}

/* ==========================================================================
   8. LISTENERS E INICIALIZAÇÃO
   ========================================================================== */

// Eventos de Busca
btnBusca.addEventListener('click', buscarClima);
inputCidade.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') buscarClima();
});

// Geolocalização
if (btnLocalizacao) {
    btnLocalizacao.addEventListener('click', () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => buscarClimaPorCoordenadas(pos.coords.latitude, pos.coords.longitude),
                (erro) => exibirErro('Permissão de localização negada.')
            );
        } else {
            alert('Seu navegador não suporta geolocalização.');
        }
    });
}

// Troca de Perfil (Pet, Bebê, Idoso)
botoesPerfil.forEach(botao => {
    botao.addEventListener('click', () => {
        botoesPerfil.forEach(b => b.classList.remove('active'));
        botao.classList.add('active');
        atualizarAlertaCuidados(botao.textContent.toLowerCase());
    });
});

// Inicialização Automática
document.addEventListener('DOMContentLoaded', () => {
    const cidadeSalva = localStorage.getItem('ultimaCidade') || 'São Paulo';
    inputCidade.value = cidadeSalva;
    buscarClima();
});

// Seletores do Modal
const btnInfoCuidados = document.querySelector('#btn-info-cuidados');
const modalCuidados = document.querySelector('#modal-cuidados');
const btnFecharModal = document.querySelector('.btn-fechar-modal');

// Abrir o Modal ao clicar na bolinha
if (btnInfoCuidados) {
    btnInfoCuidados.addEventListener('click', () => {
        modalCuidados.classList.remove('escondido');
        const perfilAtivo = document.querySelector('.botoes-perfil-modal .btn-perfil.active')
            ? document.querySelector('.botoes-perfil-modal .btn-perfil.active').textContent.toLowerCase()
            : 'pet';
        atualizarAlertaCuidados(perfilAtivo);
    });
}

// Fechar o Modal no botão X
if (btnFecharModal) {
    btnFecharModal.addEventListener('click', () => {
        modalCuidados.classList.add('escondido');
    });
}

// Fechar o Modal se clicar na área escura fora da caixa
window.addEventListener('click', (event) => {
    if (event.target === modalCuidados) {
        modalCuidados.classList.add('escondido');
    }
});