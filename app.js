// ROTA GB - Lógica do Cliente (Frontend)
// Função para consultar o preço oficial da DGVTT
async function consultarPrecoOficial(origem, destino) {
    try {
        // Busca o ficheiro tariffs.json que está na raiz do projeto
        const response = await fetch('tariffs.json');
        const data = await response.json();
        
        // Procura a rota correspondente na tabela oficial
        const rotaEncontrada = data.tariffs.find(t => 
            t.origin.toLowerCase() === origem.toLowerCase() && 
            t.destination.toLowerCase() === destino.toLowerCase()
        );

        if (rotaEncontrada) {
            console.log(`Preço Oficial DGVTT para ${destino}: ${rotaEncontrada.price} XOF`);
            return rotaEncontrada.price;
        } else {
            console.log("Rota não encontrada na tabela oficial da DGVTT.");
            return null;
        }
    } catch (error) {
        console.error("Erro ao carregar as tarifas:", error);
        return null;
    }
}

// Exemplo de uso prático quando o utilizador confirma a viagem
async function calcularViagemExemplo() {
    let preco = await consultarPrecoOficial("Cidade", "Aeroporto");
    if (preco) {
        alert(`O valor oficial da viagem é: ${preco} XOF`);
    }
}
let mapa;
let centroBissau = [11.8631, -15.5984]; // Coordenadas centrais de Bissau

// Função para consultar o preço oficial da DGVTT
async function consultarPrecoOficial(origem, destino) {
    try {
        const response = await fetch('tariffs.json');
        const data = await response.json();
        
        const rotaEncontrada = data.tariffs.find(t => 
            t.origin.toLowerCase() === origem.toLowerCase() && 
            t.destination.toLowerCase() === destino.toLowerCase()
        );

        if (rotaEncontrada) {
            return rotaEncontrada.price;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Erro ao carregar as tarifas:", error);
        return null;
    }
}
// Função definitiva e corrigida para atualizar os preços em todas as zonas de Bissau
function atualizarPrecosViagemAutomatico(precoBase) {
    const base = parseFloat(precoBase) || 225;

    // Fórmulas exatas de cálculo:
    const valorTaxi = base * 2;        // Ex: 250 -> 500 XOF (O dobro exato)
    const valorPrivado = base * 2.6;   // Carro Privado
    const valorMoto = base * 1.4;      // Moto-Táxi

    // Vamos procurar os elementos pelos IDs exatos. 
    // Se o ID no seu HTML for diferente, atualizamos a seguir.
    const elTaxi = document.getElementById("precoTaxi");
    const elPrivado = document.getElementById("precoPrivado");
    const elMoto = document.getElementById("precoMoto");

    if (elTaxi) elTaxi.innerText = `${valorTaxi} XOF`;
    if (elPrivado) elPrivado.innerText = `${valorPrivado} XOF`;
    if (elMoto) elMoto.innerText = `${valorMoto} XOF`;
}

// Executa a leitura sempre que o cliente muda a zona no menu superior
document.addEventListener("DOMContentLoaded", function() {
    const selectRota = document.getElementById("rotaSelect");
    
    if (selectRota) {
        // Atualiza logo ao carregar a página com a primeira opção
        const textoInicial = selectRota.options[selectRota.selectedIndex].text;
        const matchInicial = textoInicial.match(/\((\d+)\s*XOF\)/i);
        if (matchInicial && matchInicial[1]) {
            atualizarPrecosViagemAutomatico(matchInicial[1]);
        }

        // Atualiza sempre que o cliente mudar de zona
        selectRota.addEventListener("change", function() {
            const textoOpcao = this.options[this.selectedIndex].text;
            const match = textoOpcao.match(/\((\d+)\s*XOF\)/i);
            
            if (match && match[1]) {
                atualizarPrecosViagemAutomatico(match[1]);
            }
        });
    }
});

// Inicializa o mapa e ativa o botão de forma garantida
document.addEventListener("DOMContentLoaded", function() {
    if (document.getElementById("map")) {
        // Cria o mapa do Leaflet
        mapa = L.map('map', {
            center: centroBissau,
            zoom: 15,
            zoomControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(mapa);
    }

    // Liga o evento de clique ao botão dinamicamente para garantir que funciona
    const botaoConfirmar = document.querySelector("button[onclick*='confirmarLocalizacao']") || document.querySelector("button");
    if (botaoConfirmar) {
        // Remove o onclick antigo do HTML para evitar conflitos e usa addEventListener
        botaoConfirmar.removeAttribute("onclick");
        botaoConfirmar.addEventListener("click", confirmarLocalizacao);
    }
});

// Função executada quando o utilizador clica no botão
async function confirmarLocalizacao(event) {
    if (event) event.preventDefault();

    if (!mapa) {
        alert("O mapa ainda está a carregar. Tente novamente em um segundo.");
        return;
    }

    const centroAtual = mapa.getCenter(); 
    const lat = centroAtual.lat.toFixed(5);
    const lng = centroAtual.lng.toFixed(5);

    // Consulta o preço oficial no tariffs.json
    let origem = "Cidade";
    let destino = "Aeroporto";
    let preco = await consultarPrecoOficial(origem, destino);

    if (preco) {
        alert(`Destino confirmado! (${lat}, ${lng})\nPreço Oficial DGVTT (${origem} → ${destino}): ${preco} XOF`);
    } else {
        alert(`Localização registada com sucesso: ${lat}, ${lng}`);
    }
}
let markerCarro = null;

// Função para iniciar e mover o carro da ROTA GB Express em tempo real
function iniciarCarroRotaGB() {
    if (!mapa) return;

    // Remove o carro antigo se já existir para evitar duplicados estáticos
    if (markerCarro) {
        mapa.removeLayer(markerCarro);
    }

    // Criar o ícone personalizado do carro
    const carroIcon = L.divIcon({
        className: 'carro-animado',
        html: '<div style="background-color: white; padding: 6px 12px; border-radius: 20px; box-shadow: 0 3px 8px rgba(0,0,0,0.3); font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 6px; border: 1px solid #ddd;">🚗 <span>ROTA GB Express</span></div>',
        iconSize: [150, 40],
        iconAnchor: [75, 20]
    });

    // Ponto de partida inicial (perto da Estrada N1A / Centro)
    let latBase = 11.8631;
    let lngBase = -15.5984;

    markerCarro = L.marker([latBase, lngBase], { icon: carroIcon }).addTo(mapa);

    // Variável de movimento contínuo
    let t = 0;
    
    // Atualiza a posição do carro a cada 2 segundos de forma fluida
    setInterval(() => {
        t += 0.08;
        // Calcula uma rota dinâmica em círculo/elipse pelas ruas de Bissau
        let novaLat = latBase + (Math.sin(t) * 0.0035);
        let novaLng = lngBase + (Math.cos(t) * 0.0035);

        if (markerCarro) {
            markerCarro.setLatLng([novaLat, novaLng]);
        }
    }, 2000);
}

// Inicia o carro assim que o mapa estiver totalmente pronto
window.addEventListener("load", function() {
    setTimeout(() => {
        if (typeof mapa !== "undefined" && mapa) {
            iniciarCarroRotaGB();
        }
    }, 1200);
});
function updatePrice() {
    const select = document.getElementById("routeSelect");
    if (!select) return;

    // Obtém o valor numérico exato da zona selecionada no menu superior
    const base = parseFloat(select.value) || 225;

    // Fórmulas de cálculo automático (Tarifa base + comissão ROTA GB Express)
    const valorTaxi = Math.round(base * 2);       // Táxi Oficial: O dobro exato
    const valorPrivado = Math.round(base * 2.6);  // Carro Privado
    const valorMoto = Math.round(base * 1.4);     // Moto-Táxi

    // Procura os elementos por ID (se existirem) ou apanha automaticamente 
    // os três primeiros blocos de preço na página
    const todosOsPrecos = document.querySelectorAll(".price, span[id*='preco'], div[id*='preco']");
    
    const elTaxi = document.getElementById("precoTaxi") || todosOsPrecos[0];
    const elPrivado = document.getElementById("precoPrivado") || todosOsPrecos[1];
    const elMoto = document.getElementById("precoMoto") || todosOsPrecos[2];

    if (elTaxi) elTaxi.innerText = `${valorTaxi} XOF`;
    if (elPrivado) elPrivado.innerText = `${valorPrivado} XOF`;
    if (elMoto) elMoto.innerText = `${valorMoto} XOF`;
}

// Garante que os preços calculam ao carregar e ao mudar de zona
document.addEventListener("DOMContentLoaded", function() {
    updatePrice();
    const select = document.getElementById("routeSelect");
    if (select) {
        select.addEventListener("change", updatePrice);
    }
});

// ==========================================
// 1. BASE DE DADOS DOS HOTÉIS DE BISSAU
// ==========================================
const hoteisBissau = [
    {
        id: "ceiba",
        nome: "Hotel Ceiba Bissau",
        zona: "Avenida Pansau Na Isna / Centro",
        telefone: "+245 95 580 00 00",
        imagemPrincipal: "img/hoteis/ceiba_fachada.jpg",
        quartos: [
            { tipo: "Quarto Executivo", preco: 85000, desc: "Cama King, Wi-Fi, Piscina, Pequeno-almoço", img: "img/hoteis/ceiba_quarto1.jpg" },
            { tipo: "Suite Presidencial", preco: 140000, desc: "Sala privada, Vista cidade, Tudo incluído", img: "img/hoteis/ceiba_suite.jpg" }
        ]
    },
    {
        id: "royal",
        nome: "Hotel Royal Bissau",
        zona: "Centro da Cidade (Praça)",
        telefone: "+245 320 00 00",
        imagemPrincipal: "img/hoteis/royal_fachada.jpg",
        quartos: [
            { tipo: "Quarto Standard", preco: 45000, desc: "Ar condicionado, TV, Wi-Fi", img: "img/hoteis/royal_quarto1.jpg" },
            { tipo: "Quarto Duplo Superior", preco: 65000, desc: "Cama casal, Varanda, Pequeno-almoço", img: "img/hoteis/royal_quarto2.jpg" }
        ]
    },
    {
        id: "coimbra",
        nome: "Coimbra Hotel and SPA",
        zona: "Avenida Amílcar Cabral",
        telefone: "+245 321 34 67",
        imagemPrincipal: "img/hoteis/coimbra_fachada.jpg",
        quartos: [
            { tipo: "Quarto Standard", preco: 40000, desc: "Acesso à piscina, Wi-Fi, AC", img: "img/hoteis/coimbra_quarto1.jpg" },
            { tipo: "Suite SPA", preco: 70000, desc: "Cama King, Acesso SPA e Ginásio", img: "img/hoteis/coimbra_suite.jpg" }
        ]
    },
    {
        id: "dunia",
        nome: "Dunia Hotel Bissau",
        zona: "Rua Justino Lopes / Centro",
        telefone: "+245 96 600 00 00",
        imagemPrincipal: "img/hoteis/dunia_fachada.jpg",
        quartos: [
            { tipo: "Quarto Individual", preco: 35000, desc: "AC, Wi-Fi rápido, Pequeno-almoço", img: "img/hoteis/dunia_quarto1.jpg" },
            { tipo: "Quarto Executivo", preco: 55000, desc: "Espaço de trabalho, Cama casal", img: "img/hoteis/dunia_quarto2.jpg" }
        ]
    },
    {
        id: "imperio",
        nome: "Hotel Império",
        zona: "Avenida Amílcar Cabral (Centro)",
        telefone: "+245 320 12 34",
        imagemPrincipal: "img/hoteis/imperio_fachada.jpg",
        quartos: [
            { tipo: "Quarto Clássico", preco: 30000, desc: "Localização central, AC, TV", img: "img/hoteis/imperio_quarto1.jpg" },
            { tipo: "Suite Império", preco: 50000, desc: "Varanda para a avenida, Pequeno-almoço", img: "img/hoteis/imperio_suite.jpg" }
        ]
    },
    {
        id: "azalai",
        nome: "Azalaï Hotel 24 de Setembro",
        zona: "Avenida 14 de Novembro",
        telefone: "+245 325 65 00",
        imagemPrincipal: "img/hoteis/azalai_fachada.jpg",
        quartos: [
            { tipo: "Quarto Standard", preco: 75000, desc: "Piscina, Restaurante, Transfer Aeroporto", img: "img/hoteis/azalai_quarto1.jpg" }
        ]
    }
];

let mapa;
let centroBissau = [11.8631, -15.5984];
let hotelAtual = null;
let quartoAtual = null;
let markerCarro = null;

// ==========================================
// 2. FUNÇÕES DE TARIFAS E DGVTT
// ==========================================
async function consultarPrecoOficial(origem, destino) {
    try {
        const response = await fetch('tariffs.json');
        const data = await response.json();
        
        const rotaEncontrada = data.tariffs.find(t => 
            t.origin.toLowerCase() === origem.toLowerCase() && 
            t.destination.toLowerCase() === destino.toLowerCase()
        );

        return rotaEncontrada ? rotaEncontrada.price : null;
    } catch (error) {
        console.error("Erro ao carregar as tarifas:", error);
        return null;
    }
}

function updatePrice() {
    const select = document.getElementById("routeSelect") || document.getElementById("rotaSelect");
    if (!select) return;

    let base = 225;
    const textoOpcao = select.options[select.selectedIndex].text;
    const match = textoOpcao.match(/\((\d+)\s*XOF\)/i);
    if (match && match[1]) {
        base = parseFloat(match[1]);
    } else {
        base = parseFloat(select.value) || 225;
    }

    const valorTaxi = Math.round(base * 2);
    const valorPrivado = Math.round(base * 2.6);
    const valorMoto = Math.round(base * 1.4);

    const elTaxi = document.getElementById("precoTaxi");
    const elPrivado = document.getElementById("precoPrivado");
    const elMoto = document.getElementById("precoMoto");

    if (elTaxi) elTaxi.innerText = `${valorTaxi} XOF`;
    if (elPrivado) elPrivado.innerText = `${valorPrivado} XOF`;
    if (elMoto) elMoto.innerText = `${valorMoto} XOF`;
}

// ==========================================
// 3. GESTÃO DO MODAL E HOTÉIS
// ==========================================
function abrirModalHoteis() {
    const modal = document.getElementById("modalHoteis");
    if (modal) modal.style.display = "block";
    renderizarHoteis();
}

function fecharModalHoteis() {
    const modal = document.getElementById("modalHoteis");
    if (modal) modal.style.display = "none";
}

function renderizarHoteis() {
    const container = document.getElementById("listaHoteisContainer");
    if (!container) return;

    container.innerHTML = hoteisBissau.map(hotel => `
        <div style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); background: #fff; margin-bottom: 10px;">
            <img src="${hotel.imagemPrincipal}" alt="${hotel.nome}" style="width: 100%; height: 150px; object-fit: cover;">
            <div style="padding: 12px;">
                <h4 style="margin: 0 0 4px 0;">${hotel.nome}</h4>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">📍 ${hotel.zona}</p>
                <button onclick="abrirQuartosHotel('${hotel.id}')" style="width: 100%; background: #111; color: #fff; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                    Ver Quartos e Preços
                </button>
            </div>
        </div>
    `).join("");
}

function abrirQuartosHotel(hotelId) {
    hotelAtual = hoteisBissau.find(h => h.id === hotelId);
    if (!hotelAtual) return;

    quartoAtual = null;
    const listaHoteis = document.getElementById("listaHoteisContainer");
    const detalhesHotel = document.getElementById("detalhesHotelContainer");
    const btnVoltar = document.getElementById("btnVoltarHoteis");

    if (listaHoteis) listaHoteis.style.display = "none";
    if (detalhesHotel) detalhesHotel.style.display = "block";
    if (btnVoltar) btnVoltar.style.display = "inline-block";

    document.getElementById("detalheHotelNome").innerText = hotelAtual.nome;
    document.getElementById("detalheHotelZona").innerText = `📍 ${hotelAtual.zona} | 📞 ${hotelAtual.telefone}`;
    document.getElementById("resumoQuartoEscolhido").innerText = "Selecione um quarto acima para continuar";

    const quartosContainer = document.getElementById("listaQuartosContainer");
    if (quartosContainer) {
        quartosContainer.innerHTML = hotelAtual.quartos.map((q, index) => `
            <div class="cartao-quarto" onclick="escolherQuarto(${index}, this)" style="border: 2px solid #ddd; border-radius: 8px; padding: 10px; display: flex; gap: 10px; cursor: pointer; align-items: center; background: #fff; margin-bottom: 8px;">
                <img src="${q.img}" alt="${q.tipo}" style="width: 90px; height: 75px; object-fit: cover; border-radius: 6px;">
                <div style="flex: 1;">
                    <h5 style="margin: 0 0 4px 0; font-size: 15px;">${q.tipo}</h5>
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #555;">${q.desc}</p>
                    <span style="font-weight: bold; color: #008751; font-size: 14px;">${q.preco.toLocaleString()} XOF / noite</span>
                </div>
            </div>
        `).join("");
    }
}

function escolherQuarto(index, elemento) {
    quartoAtual = hotelAtual.quartos[index];
    document.querySelectorAll(".cartao-quarto").forEach(el => el.style.borderColor = "#ddd");
    elemento.style.borderColor = "#008751";
    atualizarTotalHotel();
}

function atualizarTotalHotel() {
    if (!quartoAtual) return;
    const inputNoites = document.getElementById("numNoites");
    const noites = inputNoites ? (parseInt(inputNoites.value) || 1) : 1;
    const total = quartoAtual.preco * noites;
    const resumo = document.getElementById("resumoQuartoEscolhido");
    if (resumo) {
        resumo.innerText = `${quartoAtual.tipo} (${noites} noite(s)) — Total: ${total.toLocaleString()} XOF`;
    }
}

function voltarListaHoteis() {
    const detalhesHotel = document.getElementById("detalhesHotelContainer");
    const btnVoltar = document.getElementById("btnVoltarHoteis");
    const listaHoteis = document.getElementById("listaHoteisContainer");

    if (detalhesHotel) detalhesHotel.style.display = "none";
    if (btnVoltar) btnVoltar.style.display = "none";
    if (listaHoteis) listaHoteis.style.display = "flex";
}

function finalizarReservaHotel() {
    if (!quartoAtual) {
        alert("Por favor, clique num quarto para o selecionar antes de pagar.");
        return;
    }
    const inputNoites = document.getElementById("numNoites");
    const noites = inputNoites ? (parseInt(inputNoites.value) || 1) : 1;
    const total = quartoAtual.preco * noites;
    const metodoSelect = document.getElementById("pagamentoHotelMetodo");
    const metodo = metodoSelect ? metodoSelect.value : "Mobile Money";

    alert(`Reserva efetuada com sucesso no ${hotelAtual.nome}!\nQuarto: ${quartoAtual.tipo}\nTotal Pago: ${total.toLocaleString()} XOF via ${metodo}`);
    voltarListaHoteis();
    fecharModalHoteis();
}

// ==========================================
// 4. MAPA E ANIMAÇÃO DO CARRO
// ==========================================
function iniciarCarroRotaGB() {
    if (!mapa) return;
    if (markerCarro) mapa.removeLayer(markerCarro);

    const carroIcon = L.divIcon({
        className: 'carro-animado',
        html: '<div style="background-color: white; padding: 6px 12px; border-radius: 20px; box-shadow: 0 3px 8px rgba(0,0,0,0.3); font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 6px; border: 1px solid #ddd;">🚗 <span>ROTA GB Express</span></div>',
        iconSize: [150, 40],
        iconAnchor: [75, 20]
    });

    let latBase = 11.8631;
    let lngBase = -15.5984;

    markerCarro = L.marker([latBase, lngBase], { icon: carroIcon }).addTo(mapa);

    let t = 0;
    setInterval(() => {
        t += 0.08;
        let novaLat = latBase + (Math.sin(t) * 0.0035);
        let novaLng = lngBase + (Math.cos(t) * 0.0035);
        if (markerCarro) markerCarro.setLatLng([novaLat, novaLng]);
    }, 2000);
}

// ==========================================
// 5. INICIALIZAÇÃO AUTOMÁTICA AO CARREGAR A PÁGINA
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    // Atualiza tarifas
    updatePrice();
    const selectRoute = document.getElementById("routeSelect") || document.getElementById("rotaSelect");
    if (selectRoute) {
        selectRoute.addEventListener("change", updatePrice);
    }

    // Inicializa o Mapa Leaflet
    if (document.getElementById("map")) {
        mapa = L.map('map', {
            center: centroBissau,
            zoom: 15,
            zoomControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(mapa);
    }

    // Botão de confirmar localização
    const botaoConfirmar = document.querySelector("button[onclick*='confirmarLocalizacao']") || document.querySelector("button");
    if (botaoConfirmar) {
        botaoConfirmar.removeAttribute("onclick");
        botaoConfirmar.addEventListener("click", async function(event) {
            if (event) event.preventDefault();
            if (!mapa) {
                alert("O mapa ainda está a carregar.");
                return;
            }
            const centroAtual = mapa.getCenter();
            const lat = centroAtual.lat.toFixed(5);
            const lng = centroAtual.lng.toFixed(5);
            let preco = await consultarPrecoOficial("Cidade", "Aeroporto");
            if (preco) {
                alert(`Destino confirmado! (${lat}, ${lng})\nPreço Oficial DGVTT: ${preco} XOF`);
            } else {
                alert(`Localização registada com sucesso: ${lat}, ${lng}`);
            }
        });
    }

    // Carrega os hotéis no início
    renderizarHoteis();
});

// Inicia o carro no mapa após carregar tudo
window.addEventListener("load", function() {
    setTimeout(() => {
        if (typeof mapa !== "undefined" && mapa) {
            iniciarCarroRotaGB();
        }
    }, 1200);
});
