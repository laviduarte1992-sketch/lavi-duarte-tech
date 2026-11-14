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
let markerCarro;

// Função para iniciar o carro em movimento no mapa
function iniciarCarroRotaGB() {
    if (!mapa) return;

    // Criar um ícone personalizado com o carro e emoji
    const carroIcon = L.divIcon({
        className: 'carro-animado',
        html: '<div style="background-color: white; padding: 6px 10px; border-radius: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 5px;">🚗 <span>ROTA GB Express</span></div>',
        iconSize: [140, 40],
        iconAnchor: [70, 20]
    });

    // Ponto de partida (Ex: Centro / Bairro Militar) e destino (Ex: Aeroporto)
    let latAtual = 11.8631;
    let lngAtual = -15.5984;

    markerCarro = L.marker([latAtual, lngAtual], { icon: carroIcon }).addTo(mapa);

    // Simulação de movimento suave pelas ruas de Bissau a cada 2 segundos
    let passos = 0;
    setInterval(() => {
        passos += 0.0005;
        // Move o carro ligeiramente em direção ao aeroporto / periferia
        let novaLat = 11.8631 + (Math.sin(passos) * 0.005);
        let novaLng = -15.5984 + (Math.cos(passos) * 0.005);

        markerCarro.setLatLng([novaLat, novaLng]);
    }, 2500);
}

// Chamar esta função logo após o mapa carregar com sucesso
window.addEventListener("load", function() {
    setTimeout(() => {
        if (mapa) {
            iniciarCarroRotaGB();
        }
    }, 1000);
});
