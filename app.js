// ==========================================
// ROTA GB EXPRESS - LÓGICA DO CLIENTE (FRONTEND)
// ==========================================

let mapa;
let centroBissau = [11.8631, -15.5984]; // Coordenadas centrais de Bissau
let hotelAtual = null;
let quartoAtual = null;
let markerCarro = null;

// ==========================================
// 1. BASE DE DADOS DOS HOTÉIS DE BISSAU
// ==========================================

// ==========================================
// 2. GESTÃO DE TARIFAS E DGVTT
// ==========================================
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

function updatePrice() {
    const select = document.getElementById("routeSelect") || document.getElementById("rotaSelect");
    if (!select) return;

    let base = 225;
    try {
        const textoOpcao = select.options[select.selectedIndex].text;
        const match = textoOpcao.match(/\((\d+)\s*XOF\)/i);
        if (match && match[1]) {
            base = parseFloat(match[1]);
        } else {
            base = parseFloat(select.value) || 225;
        }
    } catch (e) {
        base = 225;
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
// 3. GESTÃO DO MODAL E RESERVAS DE HOTÉIS
// ==========================================
function abrirModalHoteis() {
    const modal = document.getElementById("modalHoteis");
    if (modal) {
        modal.style.display = "block";
        renderizarHoteis();
    } else {
        alert("Erro: O HTML do modalHoteis não foi encontrado no index.html!");
    }
}

function fecharModalHoteis() {
    const modal = document.getElementById("modalHoteis");
    if (modal) modal.style.display = "none";
}

function renderizarHoteis() {
    const container = document.getElementById("listaHoteisContainer");
    if (!container) return;

    container.innerHTML = hoteisBissau.map(hotel => `
        <div style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); background: #fff; margin-bottom: 12px;">
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

    const elNome = document.getElementById("detalheHotelNome");
    const elZona = document.getElementById("detalheHotelZona");
    const elResumo = document.getElementById("resumoQuartoEscolhido");

    if (elNome) elNome.innerText = hotelAtual.nome;
    if (elZona) elZona.innerText = `📍 ${hotelAtual.zona} | 📞 ${hotelAtual.telefone}`;
    if (elResumo) elResumo.innerText = "Selecione um quarto acima para continuar";

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
// 4. MAPA DE BISSAU E CARTÃO ROTA GB EXPRESS
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    // 1. Atualiza tarifas de táxi
    updatePrice();
    const selectRoute = document.getElementById("routeSelect") || document.getElementById("rotaSelect");
    if (selectRoute) {
        selectRoute.addEventListener("change", updatePrice);
    }

    // 2. Inicializa o Mapa Leaflet sem ficar cinzento
    if (document.getElementById("map")) {
        mapa = L.map('map', {
            center: centroBissau,
            zoom: 15,
            zoomControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(mapa);

        // Cartão flutuante idêntico à imagem de referência
        const rotaIcon = L.divIcon({
            className: 'rota-gb-marker',
            html: '<div style="background: white; padding: 8px 14px; border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 8px; white-space: nowrap; border: 1px solid #eee;">🚗 <div style="line-height: 1.2;">ROTA GB<br><span style="font-weight: normal; font-size: 12px;">Express</span></div></div>',
            iconSize: [140, 45],
            iconAnchor: [70, 22]
        });

        L.marker(centroBissau, { icon: rotaIcon }).addTo(mapa);

        // Força o redesenho dos tiles do mapa
        setTimeout(() => {
            if (mapa) mapa.invalidateSize();
        }, 300);
    }

    // 3. Botão de confirmar localização
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

    // 4. Renderiza os hotéis inicialmente
    renderizarHoteis();
});
