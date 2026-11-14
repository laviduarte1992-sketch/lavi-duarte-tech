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
let centroBissau = { lat: 11.8631, lng: -15.5984 }; // Coordenadas centrais de Bissau

// Função de inicialização do Google Maps
function initMap() {
    mapa = new google.maps.Map(document.getElementById("map"), {
        center: centroBissau,
        zoom: 15,
        disableDefaultUI: true, // Interface limpa para o app de mobilidade
    });
}

// Função executada quando o utilizador clica em "Confirmar Esta Localização"
async function confirmarLocalizacao() {
    // Obtém o centro exato onde o pin está a apontar
    const centroAtual = mapa.getCenter();
    const lat = centroAtual.lat();
    const lng = centroAtual.lng();

    console.log(`Coordenadas capturadas - Lat: ${lat}, Lng: ${lng}`);

    // Exemplo de teste cruzando com o tariffs.json que criámos
    // (Pode substituir "Cidade" e "Aeroporto" pelas zonas dinâmicas do seu geofencing)
    let origem = "Cidade";
    let destino = "Aeroporto";

    let preco = await consultarPrecoOficial(origem, destino);

    if (preco) {
        alert(`Destino selecionado!\nPreço Oficial DGVTT para ${destino}: ${preco} XOF`);
    } else {
        alert("Localização registada com sucesso!");
    }
}
