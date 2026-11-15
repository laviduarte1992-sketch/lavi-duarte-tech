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
// Função unificada para atualizar os preços de todas as categorias para QUALQUER zona
async function atualizarPrecosParaTodasAsZonas(origem, destino) {
    // Consulta o preço base oficial do tariffs.json através da função que já existe
    const precoBase = await consultarPrecoOficial(origem, destino);

    if (!precoBase) return; // Se não encontrar, sai para evitar erros

    // Aplica as fórmulas de cálculo automático e comissão para cada tipo de transporte
    const valorTaxi = Math.round(precoBase * 2);       // Ex: Base x 2
    const valorPrivado = Math.round(precoBase * 2.6);  // Ex: Base x 2.6
    const valorMoto = Math.round(precoBase * 1.4);     // Ex: Base x 1.4

    // Atualiza os cartões visuais em baixo na interface do cliente
    const elTaxi = document.getElementById("precoTaxi");
    const elPrivado = document.getElementById("precoPrivado");
    const elMoto = document.getElementById("precoMoto");

    if (elTaxi) elTaxi.innerText = `${valorTaxi} XOF`;
    if (elPrivado) elPrivado.innerText = `${valorPrivado} XOF`;
    if (elMoto) elMoto.innerText = `${valorMoto} XOF`;
}

// Liga automaticamente ao evento de mudança de zona no menu
document.addEventListener("DOMContentLoaded", function() {
    const selectRota = document.getElementById("rotaSelect");
    
    if (selectRota) {
        selectRota.addEventListener("change", async function() {
            const valorSelecionado = this.value; // ou o texto, dependendo de como estruturou as options
            
            // Exemplo assumindo que o valor ou texto contém a rota (ex: "Cidade" e o destino)
            // Se o seu select tiver o formato "Origem -> Destino", podemos extrair assim:
            const partes = this.options[this.selectedIndex].text.split("→");
            if (partes.length === 2) {
                const origem = partes[0].trim();
                const destinoLimpo = partes[1].split("(")[0].trim(); // Remove o "(250 XOF)" do texto
                
                await atualizarPrecosParaTodasAsZonas(origem, destinoLimpo);
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
