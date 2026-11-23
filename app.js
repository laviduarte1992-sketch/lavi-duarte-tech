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
    // Guarda dinamicamente os preços calculados para todos os tipos de veículo
    window.precoTaxiOficial = valorTaxi;
    window.precoCarroPrivado = valorPrivado;
    window.precoMotoTaxi = valorMoto;
}

// ==========================================
// 1. BASE DE DADOS COMPLETA DOS HOTÉIS DE BISSAU (FOTOS REAIS + FALLBACK)
// ==========================================
const hoteisBissau = [
    {
        id: "ceiba",
        nome: "Hotel Ceiba Bissau",
        estrelas: "⭐⭐⭐⭐⭐",
        nota: "9.1 Fantástico",
        zona: "Avenida Francisco Mendes, Bissau",
        telefone: "+245 969 189 292",
        imagemPrincipal: "img/hoteis/ceiba_fachada.jpg",
        fallbackImg: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        quartos: [
            { tipo: "Quarto Superior Individual", preco: 75000, desc: "1 Cama Queen • Wi-Fi Grátis • Piscina • Pequeno-almoço", img: "img/hoteis/ceiba_quarto1.jpg", fallback: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=80" },
            { tipo: "Quarto Executivo Duplo", preco: 90000, desc: "1 Cama King • Secretária • Piscina • Pequeno-almoço incluído", img: "img/hoteis/ceiba_quarto2.jpg", fallback: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=400&q=80" },
            { tipo: "Quarto Twin (2 Camas)", preco: 95000, desc: "2 Camas individuais • Vista Jardim • Pequeno-almoço", img: "img/hoteis/ceiba_twin.jpg", fallback: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=400&q=80" },
            { tipo: "Suite Júnior", preco: 120000, desc: "Área de estar • Varanda • Acesso Ginásio e Piscina", img: "img/hoteis/ceiba_junior.jpg", fallback: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80" },
            { tipo: "Suite Presidencial", preco: 165000, desc: "Sala privada • Vista panorâmica • Transfer Aeroporto VIP", img: "img/hoteis/ceiba_suite.jpg", fallback: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80" }
        ]
    },
    {
        id: "royal",
        nome: "Bissau Royal Hotel",
        estrelas: "⭐⭐⭐⭐",
        nota: "8.6 Muito Bom",
        zona: "Avenida Amílcar Cabral, Bissau",
        telefone: "+245 955 888 888",
        imagemPrincipal: "img/hoteis/royal_fachada.jpg",
        fallbackImg: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
        quartos: [
            { tipo: "Quarto Standard Individual", preco: 45000, desc: "Ar condicionado • TV Cabo • Wi-Fi Grátis", img: "img/hoteis/royal_quarto1.jpg", fallback: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80" },
            { tipo: "Quarto Twin (2 Camas)", preco: 55000, desc: "2 Camas • Casa de banho privativa • Pequeno-almoço", img: "img/hoteis/royal_twin.jpg", fallback: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=400&q=80" },
            { tipo: "Quarto Duplo Superior", preco: 65000, desc: "Cama casal • Varanda • Pequeno-almoço incluído", img: "img/hoteis/royal_quarto2.jpg", fallback: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80" },
            { tipo: "Suite Royal Executiva", preco: 85000, desc: "Sala de estar • Minibar • Pequeno-almoço VIP", img: "img/hoteis/royal_suite.jpg", fallback: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=400&q=80" }
        ]
    },
    {
        id: "coimbra",
        nome: "Coimbra Hotel and SPA",
        estrelas: "⭐⭐⭐⭐",
        nota: "8.8 Fabuloso",
        zona: "Centro da Cidade, Bissau",
        telefone: "+245 966 568 526",
        imagemPrincipal: "img/hoteis/coimbra_fachada.jpg",
        fallbackImg: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
        quartos: [
            { tipo: "Quarto Standard", preco: 40000, desc: "Acesso à piscina • Wi-Fi • Ar condicionado", img: "img/hoteis/coimbra_quarto1.jpg", fallback: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=400&q=80" },
            { tipo: "Quarto Duplo Conforto", preco: 52000, desc: "Cama King • Pequeno-almoço • Piscina", img: "img/hoteis/coimbra_quarto2.jpg", fallback: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=400&q=80" },
            { tipo: "Suite SPA", preco: 70000, desc: "Cama King • Acesso livre ao SPA e Ginásio", img: "img/hoteis/coimbra_suite.jpg", fallback: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=400&q=80" },
            { tipo: "Suite Familiar", preco: 90000, desc: "2 Quartos ligados • Ideal para famílias • Pequeno-almoço", img: "img/hoteis/coimbra_familiar.jpg", fallback: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=400&q=80" }
        ]
    },
    {
        id: "dunia",
        nome: "Dunia Hotel Bissau",
        estrelas: "⭐⭐⭐⭐",
        nota: "8.4 Muito Bom",
        zona: "Avenida Pansau Na Isna, Santa Luzia, Bissau",
        telefone: "+245 955 803 000",
        imagemPrincipal: "img/hoteis/dunia_fachada.jpg",
        fallbackImg: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
        quartos: [
            { tipo: "Quarto Individual", preco: 35000, desc: "Ar condicionado • Wi-Fi rápido • Pequeno-almoço", img: "img/hoteis/dunia_quarto1.jpg", fallback: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80" },
            { tipo: "Quarto Duplo Standard", preco: 48000, desc: "Cama casal • TV • Pequeno-almoço incluído", img: "img/hoteis/dunia_duplo.jpg", fallback: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=80" },
            { tipo: "Quarto Executivo", preco: 58000, desc: "Secretária de trabalho • Cama casal • Pequeno-almoço", img: "img/hoteis/dunia_quarto2.jpg", fallback: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=400&q=80" },
            { tipo: "Suite Dunia", preco: 78000, desc: "Sala de estar • Varanda • Acesso Piscina", img: "img/hoteis/dunia_suite.jpg", fallback: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=400&q=80" }
        ]
    },
    {
        id: "imperio",
        nome: "Hôtel Império",
        estrelas: "⭐⭐⭐",
        nota: "8.1 Bom",
        zona: "Centro Histórico, Bissau",
        telefone: "+245 955 767 973",
        imagemPrincipal: "img/hoteis/imperio_fachada.jpg",
        fallbackImg: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
        quartos: [
            { tipo: "Quarto Económico", preco: 25000, desc: "1 Cama • Ar condicionado • Wi-Fi", img: "img/hoteis/imperio_eco.jpg", fallback: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=400&q=80" },
            { tipo: "Quarto Clássico", preco: 35000, desc: "Localização central • Ar condicionado • TV • Pequeno-almoço", img: "img/hoteis/imperio_quarto1.jpg", fallback: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=400&q=80" },
            { tipo: "Suite Império", preco: 50000, desc: "Varanda para a avenida • Pequeno-almoço incluído", img: "img/hoteis/imperio_suite.jpg", fallback: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=400&q=80" }
        ]
    },
{
    id: "ledger",
    nome: "Hotel Ledger Plaza Bissau",
    estrelas: "⭐⭐⭐⭐⭐",
    nota: "9.2 Excecional",
    zona: "Centro de Bissau",
    telefone: "+245 321 000 000",
    imagemPrincipal: "img/hoteis/ledger_fachada.jpg",
    fallbackImg: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    quartos: [
        { tipo: "Quarto Standard", preco: 65000, desc: "Cama King • Ar condicionado • Wi-Fi • Pequeno-almoço", img: "img/hoteis/ledger_quarto1.jpg", fallback: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=400&q=80" },
        { tipo: "Quarto Executivo", preco: 85000, desc: "Vista piscina • Secretária • Minibar • Pequeno-almoço", img: "img/hoteis/ledger_quarto2.jpg", fallback: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=400&q=80" },
        { tipo: "Suite Ledger", preco: 120000, desc: "Sala de estar separada • Conforto superior • Pequeno-almoço", img: "img/hoteis/ledger_suite.jpg", fallback: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=400&q=80" }
    ]
}
];
// ==========================================
// 3. GESTÃO DO MODAL ESTILO BOOKING (AUTO-CRIADO SEM MEXER NO INDEX.HTML)
// ==========================================
function garantirModalHoteisNoDOM() {
    if (document.getElementById("modalHoteis")) return;

    const overlay = document.createElement("div");
    overlay.id = "modalHoteisOverlay";
    overlay.style.cssText = "display:none; position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9998;";
    overlay.onclick = fecharModalHoteis;

    const modalHTML = `
    <div id="modalHoteis" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 92%; max-width: 520px; max-height: 88vh; background: #f5f7fa; z-index: 9999; border-radius: 16px; box-shadow: 0 12px 35px rgba(0,0,0,0.45); overflow-y: auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="background: #003580; color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10;">
            <div>
                <h3 style="margin: 0; font-size: 18px;">🏨 Hotéis em Bissau</h3>
                <span style="font-size: 12px; opacity: 0.85;">Reserva imediata • Confirmação ROTA GB</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
                <button onclick="voltarListaHoteis()" id="btnVoltarHoteis" style="display: none; background: rgba(255,255,255,0.2); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600;">⬅ Voltar</button>
                <button onclick="fecharModalHoteis()" style="background: rgba(255,255,255,0.2); color: white; border: none; width: 32px; height: 32px; border-radius: 50%; font-weight: bold; cursor: pointer; font-size: 15px;">✕</button>
            </div>
        </div>

        <div style="padding: 16px;">
            <div id="listaHoteisContainer" style="display: flex; flex-direction: column; gap: 14px;"></div>

            <div id="detalhesHotelContainer" style="display: none;">
                <div style="background: white; padding: 14px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
                    <h2 id="detalheHotelNome" style="margin: 0 0 4px 0; font-size: 19px; color: #111;"></h2>
                    <p id="detalheHotelZona" style="margin: 0; color: #555; font-size: 13px;"></p>
                </div>

                <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #222;">Escolha o seu quarto:</h4>
                <div id="listaQuartosContainer" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px;"></div>

               <div style="background: white; padding: 14px; border-radius: 12px; border: 1px solid #dce3ec; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #555;">Resumo da Reserva</h4>
                <p id="resumoQuartoEscolhido" style="font-weight: bold; color: #008751; margin: 0 0 12px 0; font-size: 14px;">Selecione um quarto acima</p>

                <!-- Linha 1: Datas de Check-in e Check-out -->
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <label style="font-size: 12px; font-weight: 600; color: #444;">Check-in:</label>
                        <input type="date" id="checkin" onchange="calcularTotalReserva()" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box;">
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 12px; font-weight: 600; color: #444;">Check-out:</label>
                        <input type="date" id="checkout" onchange="calcularTotalReserva()" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box;">
                    </div>
                </div>

                <!-- Linha 2: Número de Hóspedes (Adultos e Crianças) -->
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <label style="font-size: 12px; font-weight: 600; color: #444;">Adultos:</label>
                        <select id="adultos" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box;">
                            <option value="1">1 Adulto</option>
                            <option value="2" selected>2 Adultos</option>
                            <option value="3">3 Adultos</option>
                            <option value="4">4 Adultos</option>
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 12px; font-weight: 600; color: #444;">Crianças:</label>
                        <select id="criancas" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box;">
                            <option value="0" selected>0 Crianças</option>
                            <option value="1">1 Criança</option>
                            <option value="2">2 Crianças</option>
                            <option value="3">3 Crianças</option>
                        </select>
                    </div>
                </div>

                <!-- Linha 3: Método de Pagamento -->
                <label style="font-size: 12px; font-weight: 600; color: #444;">Método de Pagamento:</label>
                <select id="pagamentoHotelMetodo" style="width: 100%; padding: 8px; margin: 4px 0 12px 0; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box;">
                    <option value="Orange Money">Orange Money</option>
                    <option value="Telecel Money">Telecel Money</option>
                    <option value="Pagar no Check-in (Hotel)">Pagar no Check-in (Hotel)</option>
                    <option value="Cartão de Débito/Crédito">Cartão de Débito / Crédito</option>
                </select>

                <!-- Resumo Dinâmico de Noites e Valor Total -->
                <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin-bottom: 12px; font-size: 13px; color: #333; border: 1px solid #e9ecef;">
                    Estadia: <span id="total-noites" style="font-weight: 600;">0 noites</span> • Total: <strong id="valor-total" style="color: #006ce4;">0 XOF</strong>
                </div>

                <button type="button" onclick="finalizarReservaHotel()" style="width: 100%; background: #006ce4; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer;">
                    Reservar Agora
                </button>
            </div>
            </div>
        </div>
    </div>`;

    document.body.appendChild(overlay);
    document.body.insertAdjacentHTML("beforeend", modalHTML);
}

function abrirModalHoteis() {
    garantirModalHoteisNoDOM();
    const modal = document.getElementById("modalHoteis");
    const overlay = document.getElementById("modalHoteisOverlay");
    if (modal) modal.style.display = "block";
    if (overlay) overlay.style.display = "block";
    voltarListaHoteis();
    renderizarHoteis();
}

function fecharModalHoteis() {
    const modal = document.getElementById("modalHoteis");
    const overlay = document.getElementById("modalHoteisOverlay");
    if (modal) modal.style.display = "none";
    if (overlay) overlay.style.display = "none";
}

function renderizarHoteis() {
    const container = document.getElementById("listaHoteisContainer");
    if (!container) return;

    container.innerHTML = hoteisBissau.map(hotel => {
        const menorPreco = Math.min(...hotel.quartos.map(q => q.preco));
        return `
        <div style="border: 1px solid #e0e6ed; border-radius: 12px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.06); background: #fff;">
            <div style="position: relative;">
                <img src="${hotel.imagemPrincipal}" onerror="this.onerror=null;this.src='${hotel.fallbackImg}';" alt="${hotel.nome}" style="width: 100%; height: 165px; object-fit: cover; display: block;">
                <span style="position: absolute; top: 10px; right: 10px; background: #003580; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold;">${hotel.nota}</span>
            </div>
            <div style="padding: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                    <h4 style="margin: 0; font-size: 16px; color: #111;">${hotel.nome}</h4>
                    <span style="font-size: 11px;">${hotel.estrelas}</span>
                </div>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #006ce4;">📍 ${hotel.zona}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f0f0f0; padding-top: 10px;">
                    <div>
                        <span style="font-size: 11px; color: #666; display: block;">A partir de</span>
                        <span style="font-weight: bold; font-size: 16px; color: #111;">${menorPreco.toLocaleString()} XOF</span>
                        <span style="font-size: 11px; color: #666;">/ noite</span>
                    </div>
                    <button onclick="abrirQuartosHotel('${hotel.id}')" style="background: #006ce4; color: #fff; border: none; padding: 10px 16px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer;">
                        Ver disponibilidade
                    </button>
                </div>
            </div>
        </div>`;
    }).join("");
}

function abrirQuartosHotel(hotelId) {
    hotelAtual = hoteisBissau.find(h => h.id === hotelId);
    if (!hotelAtual) return;

    quartoAtual = null;
    document.getElementById("listaHoteisContainer").style.display = "none";
    document.getElementById("detalhesHotelContainer").style.display = "block";
    document.getElementById("btnVoltarHoteis").style.display = "inline-block";

    document.getElementById("detalheHotelNome").innerText = `${hotelAtual.nome} ${hotelAtual.estrelas}`;
    document.getElementById("detalheHotelZona").innerText = `📍 ${hotelAtual.zona}  •  📞 ${hotelAtual.telefone}`;
    document.getElementById("resumoQuartoEscolhido").innerText = "Selecione um quarto acima para continuar";

    const quartosContainer = document.getElementById("listaQuartosContainer");
    quartosContainer.innerHTML = hotelAtual.quartos.map((q, index) => `
        <div class="cartao-quarto" onclick="escolherQuarto(${index}, this)" style="border: 2px solid #e0e6ed; border-radius: 10px; padding: 10px; display: flex; gap: 12px; cursor: pointer; align-items: center; background: #fff; transition: 0.2s;">
            <img src="${q.img}" onerror="this.onerror=null;this.src='${q.fallback}';" alt="${q.tipo}" style="width: 95px; height: 80px; object-fit: cover; border-radius: 8px;">
            <div style="flex: 1;">
                <h5 style="margin: 0 0 4px 0; font-size: 15px; color: #111;">${q.tipo}</h5>
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #555; line-height: 1.3;">${q.desc}</p>
                <span style="font-weight: bold; color: #008751; font-size: 14px;">${q.preco.toLocaleString()} XOF <small style="color:#666; font-weight:normal;">/ noite</small></span>
            </div>
        </div>
    `).join("");
}

function escolherQuarto(index, elemento) {
    quartoAtual = hotelAtual.quartos[index];
    document.querySelectorAll(".cartao-quarto").forEach(el => el.style.borderColor = "#e0e6ed");
    elemento.style.borderColor = "#006ce4";
    atualizarTotalHotel();
}

function atualizarTotalHotel() {
    if (!quartoAtual) return;
    const inputNoites = document.getElementById("numNoites");
    const noites = inputNoites ? (parseInt(inputNoites.value) || 1) : 1;
    const total = quartoAtual.preco * noites;
    document.getElementById("resumoQuartoEscolhido").innerText = `${quartoAtual.tipo} (${noites} noite(s)) — Total: ${total.toLocaleString()} XOF`;
}

function voltarListaHoteis() {
    const detalhes = document.getElementById("detalhesHotelContainer");
    const btnVoltar = document.getElementById("btnVoltarHoteis");
    const lista = document.getElementById("listaHoteisContainer");
    if (detalhes) detalhes.style.display = "none";
    if (btnVoltar) btnVoltar.style.display = "none";
    if (lista) lista.style.display = "flex";
}

function calcularTotalReserva() {
    const checkinInput = document.getElementById("checkin");
    const checkoutInput = document.getElementById("checkout");
    const totalNoitesSpan = document.getElementById("total-noites");
    const valorTotalSpan = document.getElementById("valor-total");

    if (!checkinInput || !checkinInput.value) return;

    // Impede selecionar data de saída igual ou anterior à entrada
    const dataEntrada = new Date(checkinInput.value);
    const dataMinimaSaida = new Date(dataEntrada);
    dataMinimaSaida.setDate(dataMinimaSaida.getDate() + 1);
    if (checkoutInput) {
        checkoutInput.min = dataMinimaSaida.toISOString().split("T")[0];
    }

    if (checkinInput.value && checkoutInput && checkoutInput.value && quartoAtual) {
        const dataSaida = new Date(checkoutInput.value);
        const diferencaTempo = dataSaida - dataEntrada;
        const noites = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));

        if (noites > 0) {
            const total = noites * quartoAtual.preco;
            if (totalNoitesSpan) totalNoitesSpan.textContent = `${noites} ${noites === 1 ? 'noite' : 'noites'}`;
            if (valorTotalSpan) valorTotalSpan.textContent = `${total.toLocaleString()} XOF`;
        } else {
            if (totalNoitesSpan) totalNoitesSpan.textContent = "Data inválida";
            if (valorTotalSpan) valorTotalSpan.textContent = "0 XOF";
        }
    }
}

function finalizarReservaHotel() {
    if (!quartoAtual) {
        alert("Por favor, clique num quarto para o selecionar antes de reservar.");
        return;
    }

    const checkin = document.getElementById("checkin")?.value;
    const checkout = document.getElementById("checkout")?.value;

    if (!checkin || !checkout) {
        alert("Por favor, selecione as datas de Check-in e Check-out.");
        return;
    }

    const dataEntrada = new Date(checkin);
    const dataSaida = new Date(checkout);
    const noites = Math.ceil((dataSaida - dataEntrada) / (1000 * 60 * 60 * 24));

    if (noites <= 0) {
        alert("A data de saída (Check-out) deve ser posterior à data de entrada.");
        return;
    }

    const adultos = document.getElementById("adultos")?.value || "1";
    const criancas = document.getElementById("criancas")?.value || "0";
    const total = quartoAtual.preco * noites;
    const metodo = document.getElementById("pagamentoHotelMetodo")?.value || "Mobile Money";

    alert(`✅ Reserva confirmada no ${hotelAtual.nome}!\nQuarto: ${quartoAtual.tipo}\nCheck-in: ${checkin} | Check-out: ${checkout} (${noites} noites)\nHóspedes: ${adultos} Adulto(s), ${criancas} Criança(s)\nTotal: ${total.toLocaleString()} XOF (${metodo})`);
    
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
(function () {
  const EMAILJS_CONFIG = {
    enabled: false,
    publicKey: "SUA_PUBLIC_KEY_AQUI",
    serviceId: "SEU_SERVICE_ID_AQUI",
    templateId: "SEU_TEMPLATE_ID_AQUI"
  };

  let pesquisaRealizada = false;

  function carregarEmailJSSDK(callback) {
    if (!EMAILJS_CONFIG.enabled) return callback(false);
    if (window.emailjs) return callback(true);

    const existente = document.getElementById("emailjs-sdk-script");
    if (existente) {
      existente.addEventListener("load", () => callback(Boolean(window.emailjs)));
      return;
    }

    const script = document.createElement("script");
    script.id = "emailjs-sdk-script";
    script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    script.onload = () => {
      try {
        if (window.emailjs && EMAILJS_CONFIG.publicKey) {
          window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
        }
        callback(Boolean(window.emailjs));
      } catch (e) {
        callback(false);
      }
    };
    script.onerror = () => callback(false);
    document.head.appendChild(script);
  }

  function calcularValorLocalTexto(texto) {
    const limpo = (texto || "").trim().toLowerCase();
    if (!limpo) return 290000;

    if (/bissau|oxb|dakar|senegal|banjul|gambia|conakry|guine|guiné|praia|cabo verde|abidjan|lome|lomé|accra|lagos|nigeria|nigéria|bamako|mali/.test(limpo)) {
      return 110000;
    }
    if (/casablanca|marrocos|tunes|tunisia|tunísia|argel|argelia|argélia|cairo|egito/.test(limpo)) {
      return 185000;
    }
    if (/lisboa|porto|portugal|madrid|barcelona|espanha|paris|franca|frança|londres|uk|reino unido|bruxelas|amsterdao|amsterdão|roma|italia|itália|berlim|alemanha/.test(limpo)) {
      return 295000;
    }
    if (/brasil|sao paulo|são paulo|rio|estados unidos|eua|miami|nova iorque|new york|toronto|canada|canadá/.test(limpo)) {
      return 390000;
    }

    let hash = 0;
    for (let i = 0; i < limpo.length; i++) {
      hash = (hash * 31 + limpo.charCodeAt(i)) % 100000;
    }
    return 150000 + ((hash % 160) * 1000);
  }

  function calcularBasePorRota(origemTexto, destinoTexto) {
    const orig = (origemTexto || "Bissau (OXB)").trim().toLowerCase();
    const dest = (destinoTexto || "Lisboa").trim().toLowerCase();

    // Se for a mesma cidade/país, tarifa regional/curta base
    if (orig === dest) return 115000;

    // Rota direta Bissau <-> Dakar
    const envolveBissau = /bissau|oxb/.test(orig) || /bissau|oxb/.test(dest);
    const envolveDakar = /dakar|senegal/.test(orig) || /dakar|senegal/.test(dest);
    if (envolveBissau && envolveDakar) return 105000;

    const vOrig = calcularValorLocalTexto(orig);
    const vDest = calcularValorLocalTexto(dest);

    // Combina origem e destino para que qualquer sentido (ex: Lisboa -> Bissau ou Dakar -> Lisboa) tenha tarifa coerente
    const base = Math.round(((vOrig * 0.35 + vDest * 0.85)) / 1000) * 1000;
    return Math.max(95000, base);
  }

  function calcularPrecoParaData(baseRota, dataObj, multiplicadorViagem, passageiros, fatorCompanhia, fatorClasse) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const alvo = new Date(dataObj.getFullYear(), dataObj.getMonth(), dataObj.getDate());
    const diffDias = Math.round((alvo - hoje) / (1000 * 60 * 60 * 24));
    const diaSemana = alvo.getDay();

    let fatorAntecedencia = 1.0;
    if (diffDias <= 1) fatorAntecedencia = 1.14;
    else if (diffDias <= 3) fatorAntecedencia = 1.08;
    else if (diffDias <= 7) fatorAntecedencia = 1.04;
    else if (diffDias >= 21) fatorAntecedencia = 0.90;
    else if (diffDias >= 14) fatorAntecedencia = 0.95;

    const fatoresDiaSemana = [1.05, 0.96, 0.93, 0.94, 0.98, 1.06, 1.03];
    const fatorSemana = fatoresDiaSemana[diaSemana] || 1.0;
    const fatorDia = 0.97 + ((alvo.getDate() % 5) * 0.012);

    const bruto = baseRota * fatorAntecedencia * fatorSemana * fatorDia * multiplicadorViagem * passageiros * fatorCompanhia * fatorClasse;
    return Math.round(bruto / 1000) * 1000;
  }

  function formatarDataISO(dataObj) {
    const y = dataObj.getFullYear();
    const m = String(dataObj.getMonth() + 1).padStart(2, "0");
    const d = String(dataObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatarDataCurta(dataObj) {
    return dataObj.toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit", month: "2-digit" });
  }

  function encontrarCampoOrigem(destinoInput) {
    const modal = document.getElementById("voosModal");
    if (!modal) return null;

    const porId = document.getElementById("vooOrigemInput") || document.getElementById("origemVoo") || document.getElementById("vooOrigem");
    if (porId) return porId;

    const inputs = Array.from(modal.querySelectorAll('input[type="text"], input:not([type])'));
    for (const inp of inputs) {
      if (inp === destinoInput) continue;
      const val = (inp.value || inp.placeholder || "").toLowerCase();
      if (val.includes("bissau") || val.includes("oxb") || val.includes("origem")) {
        return inp;
      }
    }
    return null;
  }

  function habilitarOrigemLivre() {
    const destinoInput = document.getElementById("vooDestinoInput");
    if (!destinoInput) return;

    const origemInput = encontrarCampoOrigem(destinoInput);
    if (origemInput) {
      origemInput.id = origemInput.id || "vooOrigemInput";
      origemInput.readOnly = false;
      origemInput.disabled = false;
      origemInput.style.backgroundColor = "#ffffff";
      origemInput.style.cursor = "text";
      origemInput.placeholder = "Origem (Ex: Bissau (OXB), Lisboa, Dakar...)";
      if (!origemInput.value || origemInput.value.trim() === "") {
        origemInput.value = "Bissau (OXB)";
      }
    }

    if (!document.getElementById("btnInverterRotaAuto") && destinoInput.parentNode) {
      const btnSwap = document.createElement("button");
      btnSwap.id = "btnInverterRotaAuto";
      btnSwap.type = "button";
      btnSwap.textContent = "⇄ Inverter Origem e Destino";
      btnSwap.style.cssText = `
        width: 100%;
        margin: 4px 0 6px;
        padding: 7px 10px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: #f1f5f9;
        color: #0f172a;
        font-weight: 600;
        font-size: 11px;
        cursor: pointer;
      `;
      destinoInput.parentNode.insertBefore(btnSwap, destinoInput);

      btnSwap.addEventListener("click", () => {
        const origEl = encontrarCampoOrigem(destinoInput);
        if (!origEl) return;
        const atualOrig = (origEl.value || "Bissau (OXB)").trim();
        const atualDest = (destinoInput.value || "").trim();
        origEl.value = atualDest || "Lisboa";
        destinoInput.value = atualOrig || "Bissau (OXB)";
        if (pesquisaRealizada) {
          window.atualizarMotorVoosAutomatico();
        }
      });
    }
  }

  function limparPrecoFixoCabecalho() {
    const captionEl = document.getElementById("voosCaption");
    const phoneEl = document.getElementById("voosPhone");
    const lista = (typeof voosDatasets !== "undefined" && Array.isArray(voosDatasets)) ? voosDatasets : [];
    const idx = (typeof currentVooIndex === "number") ? currentVooIndex : 0;
    const itemAtual = lista[idx] || {
      text: "Atlantic",
      phone: "Guichê Atlantic Bissau: +245 955 700 800"
    };

    const companhia = (itemAtual.text.split("(")[0] || "Companhia Aérea").trim();
    if (captionEl) {
      captionEl.textContent = `${companhia} • Voos Internacionais & Regionais`;
    }
    if (phoneEl && itemAtual.phone) {
      phoneEl.textContent = itemAtual.phone;
    }
  }

  function gerarCodigoReserva() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let codigo = "FLT";
    for (let i = 0; i < 5; i++) {
      codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codigo;
  }

  function obterMetodoPagamentoAtual() {
    const modal = document.getElementById("voosModal");
    if (!modal) return "Mobile Money (Orange / Telecel)";
    const selects = modal.querySelectorAll("select");
    for (const sel of selects) {
      if (sel.id !== "classeCabineBooking" && sel.id !== "vooTipo" && sel.id !== "vooPassageiros") {
        return sel.value || "Mobile Money (Orange / Telecel)";
      }
    }
    return "Mobile Money (Orange / Telecel)";
  }

  function lerDadosPassageiro() {
    const nome = (document.getElementById("passNomeCompleto")?.value || "").trim();
    const email = (document.getElementById("passEmailBilhete")?.value || "").trim();
    const telefone = (document.getElementById("passTelefoneContacto")?.value || "").trim();
    return { nome, email, telefone };
  }

  async function emitirBilheteEEnviarEmail(passageiro, voo, statusTargetEl) {
    const pnr = gerarCodigoReserva();
    const valorFormatado = `${Number(voo.precoXOF || 0).toLocaleString("pt-PT")} XOF`;
    const metodoPagamento = obterMetodoPagamentoAtual();

    const statusEmailTexto = EMAILJS_CONFIG.enabled
      ? "A enviar e-mail automático..."
      : "Pronto para envio por e-mail (configure EmailJS para envio 100% automático).";

    const areaBilhete = renderizarBilheteEletronico({
      pnr,
      passageiro,
      voo,
      valorFormatado,
      metodoPagamento,
      statusEmailTexto
    });

    const alvoStatus = statusTargetEl || areaBilhete?.querySelector("#statusEnvioEmailAuto");

    if (EMAILJS_CONFIG.enabled && EMAILJS_CONFIG.publicKey && EMAILJS_CONFIG.serviceId && EMAILJS_CONFIG.templateId) {
      carregarEmailJSSDK(async (ok) => {
        if (!ok || !window.emailjs) {
          if (alvoStatus) {
            alvoStatus.textContent = "Não foi possível carregar o serviço de e-mail automático. Use o botão de e-mail abaixo.";
          }
          return;
        }
        try {
          await window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
            to_email: passageiro.email,
            passenger_name: passageiro.nome,
            passenger_phone: passageiro.telefone,
            pnr_code: pnr,
            airline: voo.companhia,
            origin: voo.origem,
            destination: voo.destino,
            route: `${voo.origem} -> ${voo.destino}`,
            trip_type: voo.tipo,
            departure_date: voo.dataTexto,
            passengers_count: voo.passageiros,
            total_price: valorFormatado,
            payment_method: metodoPagamento
          });
          if (alvoStatus) {
            alvoStatus.style.color = "#007a33";
            alvoStatus.textContent = `✅ Bilhete eletrónico enviado automaticamente para ${passageiro.email}!`;
          }
        } catch (err) {
          if (alvoStatus) {
            alvoStatus.style.color = "#b45309";
            alvoStatus.textContent = "Aviso no envio automático. Pode enviar usando o botão 'Enviar por E-mail' abaixo.";
          }
        }
      });
    }
  }

  function renderizarBilheteEletronico({ pnr, passageiro, voo, valorFormatado, metodoPagamento, statusEmailTexto }) {
    const modal = document.getElementById("voosModal");
    if (!modal) return null;

    let areaBilhete = document.getElementById("bilheteEletronicoGerado");
    if (!areaBilhete) {
      areaBilhete = document.createElement("div");
      areaBilhete.id = "bilheteEletronicoGerado";
      areaBilhete.style.cssText = `
        margin-top: 12px;
        padding: 14px;
        border-radius: 12px;
        border: 2px dashed #006ce4;
        background: #ffffff;
        color: #111;
        font-size: 12px;
      `;
      modal.appendChild(areaBilhete);
    }

    const assunto = encodeURIComponent(`Bilhete Eletrónico (${pnr}) - ${voo.origem} -> ${voo.destino}`);
    const corpo = encodeURIComponent(
`BILHETE ELETRÓNICO (E-TICKET)
Código de Reserva: ${pnr}
Passageiro: ${passageiro.nome}
Telefone: ${passageiro.telefone}
E-mail: ${passageiro.email}

Companhia: ${voo.companhia}
Rota: ${voo.origem} -> ${voo.destino}
Tipo de Viagem: ${voo.tipo}
Data de Ida: ${voo.dataTexto}
Passageiros: ${voo.passageiros}
Pagamento: ${metodoPagamento}
Total: ${valorFormatado}`
    );

    areaBilhete.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e5e7eb; padding-bottom:8px; margin-bottom:10px;">
        <div>
          <div style="font-size:11px; color:#006ce4; font-weight:bold;">BILHETE ELETRÓNICO EMITIDO</div>
          <div style="font-size:15px; font-weight:bold;">Reserva: ${pnr}</div>
        </div>
        <span style="background:#e6f7ed; color:#007a33; padding:4px 8px; border-radius:999px; font-size:10px; font-weight:bold;">E-TICKET</span>
      </div>

      <div style="line-height:1.6; margin-bottom:10px;">
        <div><strong>Passageiro:</strong> ${passageiro.nome}</div>
        <div><strong>E-mail:</strong> ${passageiro.email}</div>
        <div><strong>Contacto:</strong> ${passageiro.telefone}</div>
        <div><strong>Companhia:</strong> ${voo.companhia}</div>
        <div><strong>Rota:</strong> ${voo.origem} → ${voo.destino} (${voo.tipo})</div>
        <div><strong>Data de Ida:</strong> ${voo.dataTexto} | <strong>Passageiros:</strong> ${voo.passageiros}</div>
        <div><strong>Pagamento:</strong> ${metodoPagamento}</div>
        <div style="margin-top:4px; font-size:13px; color:#007a33;"><strong>Valor:</strong> ${valorFormatado}</div>
      </div>

      <div id="statusEnvioEmailAuto" style="margin-bottom:10px; font-size:11px; font-weight:600; color:#334155;">
        ${statusEmailTexto}
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:8px;">
        <a href="mailto:${encodeURIComponent(passageiro.email)}?subject=${assunto}&body=${corpo}" style="
          flex:1 1 45%;
          text-align:center;
          text-decoration:none;
          padding:9px 10px;
          border-radius:8px;
          background:#006ce4;
          color:#fff;
          font-weight:bold;
          font-size:11px;
        ">✉️ Enviar por E-mail</a>

        <button type="button" id="btnImprimirBilheteAuto" style="
          flex:1 1 45%;
          padding:9px 10px;
          border-radius:8px;
          border:1px solid #006ce4;
          background:#eef5ff;
          color:#006ce4;
          font-weight:bold;
          font-size:11px;
          cursor:pointer;
        ">🖨️ Imprimir / Guardar PDF</button>
      </div>
    `;

    areaBilhete.scrollIntoView({ behavior: "smooth", block: "nearest" });

    document.getElementById("btnImprimirBilheteAuto")?.addEventListener("click", () => {
      const janela = window.open("", "_blank", "width=600,height=700");
      if (!janela) return;
      janela.document.write(`
        <html>
          <head><title>Bilhete Eletrónico - ${pnr}</title></head>
          <body style="font-family:Arial,sans-serif; padding:24px; color:#111;">
            <h2>Bilhete Eletrónico (E-Ticket)</h2>
            <p><strong>Código de Reserva:</strong> ${pnr}</p>
            <hr>
            <p><strong>Passageiro:</strong> ${passageiro.nome}</p>
            <p><strong>E-mail:</strong> ${passageiro.email}</p>
            <p><strong>Contacto:</strong> ${passageiro.telefone}</p>
            <p><strong>Companhia:</strong> ${voo.companhia}</p>
            <p><strong>Rota:</strong> ${voo.origem} → ${voo.destino} (${voo.tipo})</p>
            <p><strong>Data de Ida:</strong> ${voo.dataTexto}</p>
            <p><strong>Passageiros:</strong> ${voo.passageiros}</p>
            <p><strong>Pagamento:</strong> ${metodoPagamento}</p>
            <p><strong>Total:</strong> ${valorFormatado}</p>
            <script>window.onload = function(){ window.print(); };<\/script>
          </body>
        </html>
      `);
      janela.document.close();
    });

    return areaBilhete;
  }

  function garantirFormularioPassageiro(vooAtual) {
    const painelDias = document.getElementById("voosDiasPrecosAuto");
    if (!painelDias || painelDias.style.display === "none") return;

    if (!document.getElementById("btnAvancarDadosPassageiro")) {
      const btnAvancar = document.createElement("button");
      btnAvancar.id = "btnAvancarDadosPassageiro";
      btnAvancar.type = "button";
      btnAvancar.textContent = "Avançar para Dados do Passageiro →";
      btnAvancar.style.cssText = `
        width: 100%;
        margin-top: 8px;
        padding: 10px;
        border: none;
        border-radius: 8px;
        background: #007a33;
        color: #fff;
        font-weight: bold;
        font-size: 12px;
        cursor: pointer;
      `;
      painelDias.appendChild(btnAvancar);

      btnAvancar.addEventListener("click", () => {
        let formBox = document.getElementById("formDadosPassageiroVoo");
        if (!formBox) {
          formBox = document.createElement("div");
          formBox.id = "formDadosPassageiroVoo";
          formBox.style.cssText = `
            margin-top: 10px;
            padding: 12px;
            border-radius: 10px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
          `;
          painelDias.parentNode.insertBefore(formBox, painelDias.nextSibling);
        }

        const estado = window.__ultimoEstadoVoo || vooAtual;
        formBox.style.display = "block";
        formBox.innerHTML = `
          <div style="font-size:12px; font-weight:bold; margin-bottom:8px; color:#0f172a;">
            Dados do Passageiro (${estado.origem} → ${estado.destino}) — ${estado.dataTexto} (${Number(estado.precoXOF || 0).toLocaleString("pt-PT")} XOF)
          </div>

          <div style="margin-bottom:8px;">
            <label style="display:block; font-size:11px; font-weight:600; margin-bottom:3px;">Nome completo</label>
            <input id="passNomeCompleto" type="text" placeholder="Ex: Mamadu Baldé" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; font-size:12px;">
          </div>

          <div style="margin-bottom:8px;">
            <label style="display:block; font-size:11px; font-weight:600; margin-bottom:3px;">E-mail para receber o bilhete eletrónico</label>
            <input id="passEmailBilhete" type="email" placeholder="Ex: cliente@email.com" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; font-size:12px;">
          </div>

          <div style="margin-bottom:10px;">
            <label style="display:block; font-size:11px; font-weight:600; margin-bottom:3px;">Contacto / Telefone</label>
            <input id="passTelefoneContacto" type="tel" placeholder="Ex: +245 955 000 000" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; font-size:12px;">
          </div>

          <button id="btnEmitirBilheteEletronico" type="button" style="
            width:100%;
            padding:10px;
            border:none;
            border-radius:8px;
            background:#006ce4;
            color:#fff;
            font-weight:bold;
            font-size:12px;
            cursor:pointer;
          ">🎫 Emitir e Enviar Bilhete Eletrónico</button>
        `;

        formBox.scrollIntoView({ behavior: "smooth", block: "nearest" });

        document.getElementById("btnEmitirBilheteEletronico")?.addEventListener("click", () => {
          const passageiro = lerDadosPassageiro();
          if (!passageiro.nome || !passageiro.email || !passageiro.telefone) {
            alert("Preencha o nome completo, o e-mail e o contacto para emitir o bilhete eletrónico.");
            return;
          }
          emitirBilheteEEnviarEmail(passageiro, window.__ultimoEstadoVoo || estado);
        });
      });
    }
  }

  function ligarBotaoConfirmarEPagar() {
    const modal = document.getElementById("voosModal");
    if (!modal || modal.dataset.checkoutLigado === "1") return;
    modal.dataset.checkoutLigado = "1";

    modal.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const textoBtn = (btn.textContent || "").toLowerCase();
      if (textoBtn.includes("confirmar") && textoBtn.includes("pagar")) {
        const passageiro = lerDadosPassageiro();
        const estado = window.__ultimoEstadoVoo;
        if (estado && passageiro.nome && passageiro.email && passageiro.telefone) {
          setTimeout(() => {
            emitirBilheteEEnviarEmail(passageiro, estado);
          }, 50);
        }
      }
    });
  }

  function garantirBarraBookingEBotao() {
    const destinoInput = document.getElementById("vooDestinoInput");
    const tipoEl = document.getElementById("vooTipo");
    const voltaEl = document.getElementById("dataVolta");
    const idaEl = document.getElementById("dataIda");
    if (!destinoInput) return;

    habilitarOrigemLivre();
    ligarBotaoConfirmarEPagar();

    const containerDatas = idaEl ? idaEl.closest("div")?.parentElement : null;
    if (containerDatas && !document.getElementById("barraOpcoesVooBooking")) {
      const barra = document.createElement("div");
      barra.id = "barraOpcoesVooBooking";
      barra.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin: 8px 0;
        padding: 8px 10px;
        border-radius: 10px;
        border: 1.5px solid #febb02;
        background: #ffffff;
        font-size: 12px;
        color: #1a1a1a;
      `;
      barra.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
          <label style="display:flex; align-items:center; gap:5px; cursor:pointer; font-weight:600;">
            <input type="radio" name="tipoViagemBooking" value="Ida e Volta" checked style="accent-color:#006ce4; width:15px; height:15px;">
            Ida e Volta
          </label>
          <label style="display:flex; align-items:center; gap:5px; cursor:pointer; font-weight:600;">
            <input type="radio" name="tipoViagemBooking" value="Só Ida" style="accent-color:#006ce4; width:15px; height:15px;">
            Só Ida
          </label>
        </div>
        <select id="classeCabineBooking" style="border:none; background:transparent; font-size:12px; font-weight:600; color:#1a1a1a; cursor:pointer; outline:none;">
          <option value="economica">Classe: Económica</option>
          <option value="executiva">Classe: Executiva</option>
        </select>
      `;
      containerDatas.parentNode.insertBefore(barra, containerDatas);

      barra.querySelectorAll('input[name="tipoViagemBooking"]').forEach((radio) => {
        radio.addEventListener("change", () => {
          if (tipoEl) {
            const alvo = radio.value.toLowerCase();
            for (let i = 0; i < tipoEl.options.length; i++) {
              const txt = tipoEl.options[i].text.toLowerCase();
              if ((alvo.includes("só") && (txt.includes("só") || txt.includes("so"))) ||
                  (!alvo.includes("só") && txt.includes("volta"))) {
                tipoEl.selectedIndex = i;
                break;
              }
            }
          }
          window.atualizarMotorVoosAutomatico();
        });
      });

      document.getElementById("classeCabineBooking")?.addEventListener("change", () => {
        window.atualizarMotorVoosAutomatico();
      });
    }

    const radioSelecionado = document.querySelector('input[name="tipoViagemBooking"]:checked');
    const valorTipoAtual = (radioSelecionado ? radioSelecionado.value : (tipoEl?.value || "Ida e Volta")).toLowerCase();
    const finalIsSoIda = valorTipoAtual.includes("só") || valorTipoAtual.includes("so");

    if (voltaEl) {
      voltaEl.disabled = finalIsSoIda;
      voltaEl.style.opacity = finalIsSoIda ? "0.4" : "1";
      voltaEl.style.backgroundColor = finalIsSoIda ? "#f0f2f5" : "";
      if (finalIsSoIda) voltaEl.value = "";
    }

    if (!document.getElementById("btnPesquisarVoosAuto")) {
      const btn = document.createElement("button");
      btn.id = "btnPesquisarVoosAuto";
      btn.type = "button";
      btn.textContent = "🔍 Pesquisar Voos & Datas";
      btn.style.cssText = `
        width: 100%;
        margin: 8px 0 10px;
        padding: 11px;
        border: none;
        border-radius: 10px;
        background: #006ce4;
        color: #ffffff;
        font-weight: bold;
        font-size: 13px;
        cursor: pointer;
      `;
      destinoInput.parentNode.insertBefore(btn, destinoInput.nextSibling);

      btn.addEventListener("click", () => {
        const destVal = (destinoInput.value || "").trim();
        if (!destVal) {
          alert("Por favor, digite o país ou cidade de destino (Ex: Lisboa, Dakar, Bissau, Brasil...).");
          destinoInput.focus();
          return;
        }
        pesquisaRealizada = true;
        window.atualizarMotorVoosAutomatico();
      });
    }
  }

  window.atualizarMotorVoosAutomatico = function () {
    limparPrecoFixoCabecalho();
    garantirBarraBookingEBotao();

    const destinoEl = document.getElementById("vooDestinoInput");
    const origemEl = encontrarCampoOrigem(destinoEl);
    const idaEl = document.getElementById("dataIda");
    const tipoEl = document.getElementById("vooTipo");
    const passEl = document.getElementById("vooPassageiros");
    const classeEl = document.getElementById("classeCabineBooking");
    const btnPesquisar = document.getElementById("btnPesquisarVoosAuto");

    let painelDias = document.getElementById("voosDiasPrecosAuto");

    if (!pesquisaRealizada) {
      if (painelDias) painelDias.style.display = "none";
      return;
    }

    const origemLabel = (origemEl?.value || "").trim() || "Bissau (OXB)";
    const destinoLabel = (destinoEl?.value || "").trim();
    if (!destinoLabel) {
      if (painelDias) painelDias.style.display = "none";
      return;
    }

    const lista = (typeof voosDatasets !== "undefined" && Array.isArray(voosDatasets)) ? voosDatasets : [];
    const idx = (typeof currentVooIndex === "number") ? currentVooIndex : 0;
    const itemAtual = lista[idx] || { text: "Atlantic" };
    const companhia = (itemAtual.text.split("(")[0] || "Voo").trim();

    let fatorCompanhia = 1.0;
    const compLower = companhia.toLowerCase();
    if (compLower.includes("tap")) fatorCompanhia = 1.04;
    else if (compLower.includes("royal")) fatorCompanhia = 0.96;
    else if (compLower.includes("asky")) fatorCompanhia = 0.90;

    let passageiros = 1;
    const matchPass = (passEl?.value || "").match(/(\d+)/);
    if (matchPass) {
      passageiros = Math.max(1, parseInt(matchPass[1], 10));
    }

    const radioSel = document.querySelector('input[name="tipoViagemBooking"]:checked');
    const tipoTexto = (radioSel ? radioSel.value : (tipoEl?.value || "Ida e Volta")).toLowerCase();
    const isSoIda = tipoTexto.includes("só") || tipoTexto.includes("so");
    const tipoLabel = isSoIda ? "Só Ida" : "Ida e Volta";
    const multiplicadorViagem = isSoIda ? 1.0 : 1.65;
    const fatorClasse = (classeEl && classeEl.value === "executiva") ? 1.45 : 1.0;

    const baseRota = calcularBasePorRota(origemLabel, destinoLabel);
    const dataBase = (idaEl && idaEl.value)
      ? new Date(idaEl.value + "T00:00:00")
      : new Date();

    const precoAtual = calcularPrecoParaData(baseRota, dataBase, multiplicadorViagem, passageiros, fatorCompanhia, fatorClasse);
    window.precoVooCalculado = precoAtual;
    window.__ultimoEstadoVoo = {
      dataISO: formatarDataISO(dataBase),
      dataTexto: dataBase.toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }),
      precoXOF: precoAtual,
      tipo: tipoLabel,
      passageiros,
      origem: origemLabel,
      destino: destinoLabel,
      companhia
    };

    if (!painelDias && btnPesquisar) {
      painelDias = document.createElement("div");
      painelDias.id = "voosDiasPrecosAuto";
      painelDias.style.cssText = "margin: 4px 0 10px; padding: 8px; border-radius: 10px; background: #f5f8fc; border: 1px solid #dce5f2;";
      btnPesquisar.parentNode.insertBefore(painelDias, btnPesquisar.nextSibling);
    }

    if (!painelDias) return;
    painelDias.style.display = "block";

    const offsets = [0, 1, 2, 3, 5, 7];
    const botoesHTML = offsets.map((offset) => {
      const d = new Date(dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate() + offset);
      const precoDia = calcularPrecoParaData(baseRota, d, multiplicadorViagem, passageiros, fatorCompanhia, fatorClasse);
      const iso = formatarDataISO(d);
      const ativa = idaEl && idaEl.value === iso;

      return `
        <button type="button" data-data-voo="${iso}" data-preco-voo="${precoDia}" style="
          flex: 1 1 30%;
          min-width: 92px;
          padding: 6px;
          border-radius: 8px;
          border: 1px solid ${ativa ? "#006ce4" : "#d0d7de"};
          background: ${ativa ? "#e6f0ff" : "#ffffff"};
          color: #111;
          font-size: 10px;
          cursor: pointer;
          text-align: center;
          line-height: 1.3;
        ">
          <div style="font-weight: bold;">${formatarDataCurta(d)}</div>
          <div style="color: #007a33; font-weight: bold;">${precoDia.toLocaleString("pt-PT")} XOF</div>
          <div style="color: #555; font-size: 9px;">${tipoLabel} • ${passageiros} Pass.</div>
        </button>
      `;
    }).join("");

    painelDias.innerHTML = `
      <div style="font-size: 11px; font-weight: bold; color: #1a1a1a; margin-bottom: 6px;">
        Resultados (${tipoLabel}) — ${origemLabel} → ${destinoLabel} (${companhia}):
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        ${botoesHTML}
      </div>
      <div style="margin-top: 6px; font-size: 11px; color: #006ce4; font-weight: bold; text-align: right;">
        Selecionado: ${precoAtual.toLocaleString("pt-PT")} XOF (${tipoLabel})
      </div>
    `;

    painelDias.querySelectorAll("button[data-data-voo]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const novaData = btn.getAttribute("data-data-voo");
        if (idaEl && novaData) {
          idaEl.value = novaData;
        }
        window.atualizarMotorVoosAutomatico();
      });
    });

    garantirFormularioPassageiro(window.__ultimoEstadoVoo);
  };

  ["change", "input", "click"].forEach((ev) => {
    document.addEventListener(ev, (e) => {
      if (e.target && e.target.closest && e.target.closest("#voosModal")) {
        setTimeout(() => {
          limparPrecoFixoCabecalho();
          garantirBarraBookingEBotao();
          if (pesquisaRealizada) {
            window.atualizarMotorVoosAutomatico();
          }
        }, 25);
      }
    });
  });

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      limparPrecoFixoCabecalho();
      garantirBarraBookingEBotao();
    }, 150);
  });
})();
(function () {
  if (window.__superAppMobilidadeV8) return;
  window.__superAppMobilidadeV8 = true;

  const GRUPOS_ROTAS_DGVTT = [
    {
      grupo: "📍 Partidas: Centro da Cidade (Praça / Centro)",
      rotas: [
        { nome: "Cidade → Mercado de Bandim", baseXOF: 225 },
        { nome: "Cidade → Cristo Redentor", baseXOF: 250 },
        { nome: "Cidade → Belém / Missira", baseXOF: 325 },
        { nome: "Cidade → Bairro d'Ajuda 1º e 2º fase", baseXOF: 350 },
        { nome: "Cidade → Hospital 3 de Agosto", baseXOF: 375 },
        { nome: "Cidade → Bairro Internacional", baseXOF: 425 },
        { nome: "Cidade → Hotel Emb. América", baseXOF: 200 },
        { nome: "Cidade → Bairro Militar / Prédio Nino", baseXOF: 450 },
        { nome: "Cidade → Bairro Militar Somec", baseXOF: 475 },
        { nome: "Cidade → B. Militar / Terminal TUB", baseXOF: 525 },
        { nome: "Cidade → Brá / Seminário", baseXOF: 550 },
        { nome: "Cidade → Paragem Central", baseXOF: 475 },
        { nome: "Cidade → Guimetal", baseXOF: 525 },
        { nome: "Cidade → São Paulo", baseXOF: 550 },
        { nome: "Cidade → Háfia / Cruzamento", baseXOF: 575 },
        { nome: "Cidade → Paragem Manjaco", baseXOF: 650 },
        { nome: "Cidade → Rotunda do Aeroporto", baseXOF: 675 },
        { nome: "Cidade → Aeroporto", baseXOF: 700 },
        { nome: "Cidade → Base Aérea / PRAKLAS", baseXOF: 750 },
        { nome: "Cidade → Bissalanca Poilão", baseXOF: 800 },
        { nome: "Cidade → Enterramento", baseXOF: 200 },
        { nome: "Cidade → STENACKS / Safim", baseXOF: 950 },
        { nome: "Cidade → ENA (CENFA)", baseXOF: 650 },
        { nome: "Cidade → Av. Brasil", baseXOF: 700 },
        { nome: "Cidade → Paulo Barros", baseXOF: 775 },
        { nome: "Cidade → Caracol", baseXOF: 175 },
        { nome: "Cidade → Padaria Nhonho", baseXOF: 250 },
        { nome: "Cidade → Zona 7", baseXOF: 275 },
        { nome: "Cidade → Bairro Plano", baseXOF: 325 },
        { nome: "Cidade → Bairro Ministro", baseXOF: 375 },
        { nome: "Cidade → SHEL Quelelê", baseXOF: 425 },
        { nome: "Cidade → Sobrade", baseXOF: 475 },
        { nome: "Cidade → Ponta Neto", baseXOF: 525 },
        { nome: "Cidade → Bôr / Terminal TUB", baseXOF: 550 },
        { nome: "Cidade → Aldeia SOS", baseXOF: 575 },
        { nome: "Cidade → Cemitério de N'hala", baseXOF: 600 },
        { nome: "Cidade → Bairro Bissack (Ponte Cibe)", baseXOF: 275 },
        { nome: "Cidade → Bissack / Terminal TUB", baseXOF: 325 },
        { nome: "Cidade → Estado Major / QG", baseXOF: 275 },
        { nome: "Cidade → Igreja Católica de Antula", baseXOF: 450 },
        { nome: "Cidade → Pluba / Abílio Santos", baseXOF: 475 },
        { nome: "Cidade → Pefine", baseXOF: 650 },
        { nome: "Cidade → Estádio 24 de Setembro", baseXOF: 800 }
      ]
    },
    {
      grupo: "📍 Partidas: Mercado de Bandim",
      rotas: [
        { nome: "Mercado Bandim → SHEL / Palmeiras", baseXOF: 225 },
        { nome: "Mercado Bandim → Chapa de Bissau", baseXOF: 275 },
        { nome: "Mercado Bandim → Bairro d'Ajuda", baseXOF: 325 },
        { nome: "Mercado Bandim → Hospital 3 de Agosto", baseXOF: 350 },
        { nome: "Mercado Bandim → Bairro Internacional", baseXOF: 375 },
        { nome: "Mercado Bandim → Bairro Militar Prédio Nino", baseXOF: 450 },
        { nome: "Mercado Bandim → Bº Militar / Terminal TUB", baseXOF: 525 },
        { nome: "Mercado Bandim → Paragem Central", baseXOF: 550 },
        { nome: "Mercado Bandim → Enterramento", baseXOF: 575 },
        { nome: "Mercado Bandim → Seminário Brá", baseXOF: 650 },
        { nome: "Mercado Bandim → Aeroporto", baseXOF: 325 },
        { nome: "Mercado Bandim → Safim", baseXOF: 550 }
      ]
    }
  ];

  const TODAS_ROTAS = GRUPOS_ROTAS_DGVTT.flatMap((g) => g.rotas);

  const VEICULOS = [
    { id: "TAXI", rotulo: "TAXI", nome: "Táxi Oficial", emoji: "🚕", mult: 2.0 },
    { id: "PRIVADO", rotulo: "CARRO PRIVADO", nome: "Carro Privado", emoji: "🚗", mult: 2.6 },
    { id: "MOTO", rotulo: "MOTO-TAXI", nome: "Moto-Táxi", emoji: "🏍️", mult: 1.4 }
  ];

  const METODOS_PAGAMENTO = ["Orange Money", "Telecel", "Cartão", "Dinheiro Vivo"];

  const MOTORISTAS_DEMO_POR_TIPO = {
    TAXI: [
      {
        nomeCompleto: "Amadu Baldé (Demo)",
        modeloVeiculo: "Toyota Corolla Azul/Branco",
        placaVeiculo: "GB-204-TX",
        telefone: "+245955000101",
        origem: "Demo"
      },
      {
        nomeCompleto: "Mamadú Djaló (Demo)",
        modeloVeiculo: "Mercedes 190 Azul/Branco",
        placaVeiculo: "GB-512-TX",
        telefone: "+245955000102",
        origem: "Demo"
      }
    ],
    PRIVADO: [
      {
        nomeCompleto: "Fátima Djassi (Demo)",
        modeloVeiculo: "Hyundai i10 Cinza",
        placaVeiculo: "GB-819-PR",
        telefone: "+245955000202",
        origem: "Demo"
      },
      {
        nomeCompleto: "Carlos Mendes (Demo)",
        modeloVeiculo: "Toyota Yaris Branco",
        placaVeiculo: "GB-630-PR",
        telefone: "+245955000203",
        origem: "Demo"
      }
    ],
    MOTO: [
      {
        nomeCompleto: "Braima Camará (Demo)",
        modeloVeiculo: "Haojue 125cc Vermelha",
        placaVeiculo: "GB-441-MT",
        telefone: "+245955000303",
        origem: "Demo"
      },
      {
        nomeCompleto: "Suleimane Embaló (Demo)",
        modeloVeiculo: "Sanlg 125cc Preta",
        placaVeiculo: "GB-778-MT",
        telefone: "+245955000304",
        origem: "Demo"
      }
    ]
  };

  let rotaAtual = TODAS_ROTAS[0];
  let veiculoAtual = VEICULOS[0];
  let metodoAtual = "Orange Money";
  let listaMotoristasDisponiveis = [];
  let indiceMotoristaAtual = 0;
  let motoristaAtribuido = null;
  let avisoTrocaMotorista = "";
  let mensagemRapida = "Olá! Estou no ponto de referência em Bissau.";
  let faseViagem = "IDLE"; // IDLE | PROCURANDO | ENCONTRADO | EM_CURSO | CANCELADA
  let timerCrono = null;
  let timerEtapa1 = null;
  let timerEtapa2 = null;
  let segundos = 0;

  function calcularPrecoXOF() {
    return Math.round(rotaAtual.baseXOF * veiculoAtual.mult);
  }

  function limparTimers() {
    if (timerCrono) clearInterval(timerCrono);
    if (timerEtapa1) clearTimeout(timerEtapa1);
    if (timerEtapa2) clearTimeout(timerEtapa2);
    timerCrono = null;
    timerEtapa1 = null;
    timerEtapa2 = null;
  }

  function formatarTempo(seg) {
    const mm = String(Math.floor(seg / 60)).padStart(2, "0");
    const ss = String(seg % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function normalizarMotoristaLinha(row) {
    if (!row || typeof row !== "object") return null;
    const nomeCompleto =
      row.nome_completo || row.nome || row.full_name || row.motorista_nome || "Condutor Registado";
    const modeloVeiculo =
      row.modelo_veiculo || row.modelo_carro || row.veiculo_modelo || row.modelo || "Veículo Registado";
    const placaVeiculo =
      row.placa_veiculo || row.matricula || row.numero_matricula || row.placa || "Sem matrícula";
    const telefone = row.telefone || row.phone || row.telemovel || "";

    return {
      nomeCompleto: String(nomeCompleto).trim(),
      modeloVeiculo: String(modeloVeiculo).trim(),
      placaVeiculo: String(placaVeiculo).trim(),
      telefone: String(telefone).trim(),
      origem: "Supabase"
    };
  }

  async function carregarListaMotoristas(tipoVeiculoId) {
    const listaDemo = MOTORISTAS_DEMO_POR_TIPO[tipoVeiculoId] || MOTORISTAS_DEMO_POR_TIPO.TAXI;
    try {
      const client =
        window.supabaseClient ||
        window.sb ||
        (window.supabase && typeof window.supabase.from === "function" ? window.supabase : null);

      if (client && typeof client.from === "function") {
        const { data, error } = await client.from("motoristas").select("*").limit(50);
        if (!error && Array.isArray(data) && data.length > 0) {
          const filtrados = data.filter((m) => {
            const dispOk = m.disponivel === undefined || m.disponivel === null || m.disponivel === true;
            const aprovOk = m.aprovado === undefined || m.aprovado === null || m.aprovado === true;
            const serv = String(m.tipo_servico || m.tipo_veiculo || m.categoria || "").toUpperCase();
            if (!dispOk || !aprovOk) return false;
            if (!serv) return true;
            if (tipoVeiculoId === "MOTO") return serv.includes("MOTO");
            if (tipoVeiculoId === "PRIVADO") return serv.includes("PRIV") || serv.includes("CARRO");
            return serv.includes("TAXI") && !serv.includes("MOTO");
          });

          const base = filtrados.length > 0 ? filtrados : data;
          const normalizados = base.map(normalizarMotoristaLinha).filter(Boolean);
          if (normalizados.length > 0) return normalizados;
        }
      }
    } catch (_) {
      // Fallback seguro para lista de demonstração
    }
    return listaDemo;
  }

  function iniciarSequenciaEtapas(container) {
    limparTimers();
    faseViagem = "PROCURANDO";
    segundos = 0;
    renderizarPainel(container);

    timerCrono = setInterval(() => {
      segundos += 1;
      const elCrono = container.querySelector("#cronometro-viagem-v8");
      if (elCrono) elCrono.textContent = formatarTempo(segundos);
    }, 1000);

    timerEtapa1 = setTimeout(() => {
      if (faseViagem === "PROCURANDO") {
        faseViagem = "ENCONTRADO";
        renderizarPainel(container);
        timerEtapa2 = setTimeout(() => {
          if (faseViagem === "ENCONTRADO") {
            faseViagem = "EM_CURSO";
            renderizarPainel(container);
          }
        }, 4500);
      }
    }, 3000);
  }

  function refrescarMapaBissau() {
    [window.map, window.mapa, window.mapaBissau, window.leafletMap].forEach((m) => {
      if (m && typeof m.invalidateSize === "function") {
        setTimeout(() => m.invalidateSize(), 120);
      }
    });

    document.querySelectorAll("[id*='map'], [class*='map'], .leaflet-container").forEach((el) => {
      if (el.id === "superapp-painel-viagem") return;
      const cs = window.getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") {
        el.style.display = "block";
        el.style.visibility = "visible";
      }
      if (el.clientHeight < 220) {
        el.style.minHeight = "260px";
      }
    });
  }

  function renderizarOpcoesRotas() {
    return GRUPOS_ROTAS_DGVTT.map(
      (grupo) => `
        <optgroup label="${grupo.grupo}">
          ${grupo.rotas
            .map(
              (r) =>
                `<option value="${r.baseXOF}" data-rota="${r.nome.replace(/"/g, "&quot;")}" ${
                  r.nome === rotaAtual.nome ? "selected" : ""
                }>${r.nome} (${r.baseXOF} XOF)</option>`
            )
            .join("")}
        </optgroup>
      `
    ).join("");
  }

  function renderizarCamposPagamento() {
    if (metodoAtual === "Dinheiro Vivo") {
      return `
        <div style="margin-bottom:12px;padding:12px;border-radius:12px;background:#f0fdf4;border:1px solid #86efac;">
          <div style="font-size:13px;font-weight:700;color:#166534;margin-bottom:4px;">
            💵 Pagamento em Dinheiro Vivo ao condutor
          </div>
          <div style="font-size:12px;color:#374151;">
            Não precisa de número de conta nem cartão. O valor final será pago em dinheiro vivo (XOF) diretamente ao condutor.
          </div>
        </div>
      `;
    }

    if (metodoAtual === "Cartão") {
      return `
        <div style="margin-bottom:12px;padding:12px;border-radius:12px;background:#f8fafc;border:1px solid #cbd5e1;">
          <label style="display:block;font-size:12px;font-weight:700;color:#1e293b;margin-bottom:6px;">
            Número do cartão (16 dígitos)
          </label>
          <input
            id="input-cartao-numero-v8"
            type="text"
            inputmode="numeric"
            maxlength="19"
            placeholder="0000 0000 0000 0000"
            style="width:100%;padding:11px;border-radius:10px;border:1px solid #cbd5e1;font-size:14px;letter-spacing:1px;margin-bottom:10px;box-sizing:border-box;background:#fff;"
          />
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div>
              <label style="display:block;font-size:11px;font-weight:700;color:#334155;margin-bottom:4px;">
                Validade (MM/AA)
              </label>
              <input
                id="input-cartao-validade-v8"
                type="text"
                inputmode="numeric"
                maxlength="5"
                placeholder="MM/AA"
                style="width:100%;padding:10px;border-radius:10px;border:1px solid #cbd5e1;font-size:13px;box-sizing:border-box;background:#fff;"
              />
            </div>
            <div>
              <label style="display:block;font-size:11px;font-weight:700;color:#334155;margin-bottom:4px;">
                Código secreto (3 dígitos)
              </label>
              <input
                id="input-cartao-cvv-v8"
                type="password"
                inputmode="numeric"
                maxlength="3"
                placeholder="123"
                style="width:100%;padding:10px;border-radius:10px;border:1px solid #cbd5e1;font-size:13px;box-sizing:border-box;background:#fff;"
              />
            </div>
          </div>
          <div id="aviso-cartao-v8" style="font-size:11px;color:#b45309;margin-top:8px;">
            Modo Demonstração: simulação local de cartão de débito/crédito (não introduza dados reais de cartão).
          </div>
        </div>
      `;
    }

    return `
      <input
        id="input-tel-v8"
        type="tel"
        placeholder="+245 955..."
        style="width:100%;padding:11px;border-radius:10px;border:1px solid #d1d5db;font-size:13px;margin-bottom:12px;box-sizing:border-box;"
      />
    `;
  }

  function renderizarCartaoMotorista() {
    const fallback = (MOTORISTAS_DEMO_POR_TIPO[veiculoAtual.id] || MOTORISTAS_DEMO_POR_TIPO.TAXI)[0];
    const mot = motoristaAtribuido || fallback;
    const totalDisponiveis = listaMotoristasDisponiveis.length || 1;
    const telLimpo = (mot.telefone || "").replace(/[^\d+]/g, "");
    const telDigitos = (mot.telefone || "").replace(/\D/g, "");
    const textoMsg = encodeURIComponent(
      `Olá ${mot.nomeCompleto}, estou na rota ${rotaAtual.nome} (${veiculoAtual.nome}). ${mensagemRapida}`
    );

    const linkLigar = telLimpo ? `tel:${telLimpo}` : "javascript:void(0)";
    const linkSms = telLimpo ? `sms:${telLimpo}?body=${textoMsg}` : "javascript:void(0)";
    const linkWhatsApp = telDigitos ? `https://wa.me/${telDigitos}?text=${textoMsg}` : "https://wa.me/?text=" + textoMsg;

    return `
      <div style="margin-top:12px;margin-bottom:12px;padding:12px;border-radius:12px;background:#ffffff;border:1px solid #d1d5db;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:6px;">
          <span style="font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;">
            Dados do Motorista (${mot.origem} · ${indiceMotoristaAtual + 1}/${totalDisponiveis})
          </span>
          <span style="font-size:11px;font-weight:700;color:#111827;background:#f3f4f6;padding:2px 8px;border-radius:999px;">
            ${mot.placaVeiculo}
          </span>
        </div>
        <div style="font-size:15px;font-weight:800;color:#111827;">${mot.nomeCompleto}</div>
        <div style="font-size:13px;color:#374151;margin-top:2px;">
          <strong>Veículo:</strong> ${mot.modeloVeiculo} · <strong>Matrícula:</strong> ${mot.placaVeiculo}
        </div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px;">
          <strong>Telefone:</strong> ${mot.telefone || "Não informado"}
        </div>

        <div style="margin-top:10px;">
          <label style="display:block;font-size:11px;font-weight:700;color:#374151;margin-bottom:4px;">
            Mensagem caso o motorista atrase ou não encontre si:
          </label>
          <input
            id="input-msg-motorista-v8"
            type="text"
            value="${mensagemRapida.replace(/"/g, "&quot;")}"
            style="width:100%;padding:9px;border-radius:9px;border:1px solid #d1d5db;font-size:12px;box-sizing:border-box;margin-bottom:8px;"
          />
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px;">
            <a href="${linkLigar}" style="text-align:center;text-decoration:none;padding:9px 6px;border-radius:9px;background:#16a34a;color:#fff;font-size:12px;font-weight:700;">
              📞 Ligar
            </a>
            <a id="link-wa-v8" href="${linkWhatsApp}" target="_blank" rel="noopener noreferrer" style="text-align:center;text-decoration:none;padding:9px 6px;border-radius:9px;background:#0f766e;color:#fff;font-size:12px;font-weight:700;">
              💬 WhatsApp
            </a>
            <a id="link-sms-v8" href="${linkSms}" style="text-align:center;text-decoration:none;padding:9px 6px;border-radius:9px;background:#2563eb;color:#fff;font-size:12px;font-weight:700;">
              ✉️ SMS
            </a>
          </div>

          <button
            type="button"
            id="btn-trocar-motorista-v8"
            style="width:100%;padding:9px;border-radius:9px;border:1px solid #d97706;background:#fffbeb;color:#92400e;font-size:12px;font-weight:700;cursor:pointer;"
          >
            🔄 Motorista demorou ou não atende? Tentar outro disponível
          </button>
          ${
            avisoTrocaMotorista
              ? `<div style="font-size:11px;color:#b45309;margin-top:6px;">${avisoTrocaMotorista}</div>`
              : ""
          }
        </div>
      </div>
    `;
  }

  function renderizarBlocoEstado(preco) {
    if (faseViagem === "PROCURANDO" || faseViagem === "ENCONTRADO" || faseViagem === "EM_CURSO") {
      const fallback = (MOTORISTAS_DEMO_POR_TIPO[veiculoAtual.id] || MOTORISTAS_DEMO_POR_TIPO.TAXI)[0];
      const mot = motoristaAtribuido || fallback;
      const titulo =
        faseViagem === "PROCURANDO"
          ? `A procurar ${veiculoAtual.nome} disponível em Bissau...`
          : faseViagem === "ENCONTRADO"
          ? `Motorista encontrado: ${mot.nomeCompleto} (${mot.placaVeiculo}) · A caminho...`
          : `Viagem em curso com ${mot.nomeCompleto} (${veiculoAtual.nome})`;

      const fundo = faseViagem === "EM_CURSO" ? "#ecfdf5" : "#fffbeb";
      const borda = faseViagem === "EM_CURSO" ? "#10b981" : "#f59e0b";

      return `
        <div style="margin-top:16px;padding:16px;border-radius:12px;background:${fundo};border:1.5px solid ${borda};">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:#92400e;margin-bottom:6px;">
            Modo Demonstração / Parcerias em Ativação
          </div>
          <div style="font-size:16px;font-weight:800;color:#111827;margin-bottom:6px;">
            ${titulo}
          </div>
          <div style="font-size:13px;color:#374151;margin-bottom:8px;">
            <strong>Valor:</strong> ${preco} XOF (${veiculoAtual.rotulo} · ${metodoAtual}) · <strong>Rota:</strong> ${rotaAtual.nome}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:12px;margin-bottom:10px;">
            <span style="padding:4px 8px;border-radius:999px;background:#fef3c7;font-weight:700;">1. A procurar motorista</span>
            <span style="padding:4px 8px;border-radius:999px;background:${
              faseViagem !== "PROCURANDO" ? "#d1fae5" : "#f3f4f6"
            };font-weight:700;">2. A caminho</span>
            <span style="padding:4px 8px;border-radius:999px;background:${
              faseViagem === "EM_CURSO" ? "#d1fae5" : "#f3f4f6"
            };font-weight:700;">3. Viagem em curso</span>
          </div>

          ${faseViagem !== "PROCURANDO" ? renderizarCartaoMotorista() : ""}

          <div id="cronometro-viagem-v8" style="font-size:22px;font-weight:800;color:#b45309;margin-bottom:12px;">${formatarTempo(
            segundos
          )}</div>
          <button type="button" id="btn-cancelar-v8" style="width:100%;padding:12px;border:none;border-radius:10px;background:#dc2626;color:#fff;font-weight:700;font-size:14px;cursor:pointer;">
            Cancelar Viagem &amp; Reembolso Imediato (Modo Demo)
          </button>
          <div style="font-size:11px;color:#6b7280;margin-top:8px;">
            Regra de reembolso: cancelamento antes da chegada ou sem motorista disponível devolve 100% do valor simulado sem taxa.
          </div>
        </div>
      `;
    }

    if (faseViagem === "CANCELADA") {
      return `
        <div style="margin-top:16px;padding:14px;border-radius:12px;background:#fef2f2;border:1px solid #fca5a5;color:#991b1b;font-size:14px;">
          <strong>Viagem cancelada.</strong> Nenhum valor real foi cobrado (Modo Demonstração / Parcerias em Ativação). Pode escolher outro veículo ou rota acima.
        </div>
      `;
    }

    return "";
  }

  function renderizarPainel(container) {
    const preco = calcularPrecoXOF();
    const comissaoEstimada = Math.round(preco * 0.1);

    window.__veiculoSelecionado = {
      nome: veiculoAtual.nome,
      tipo: veiculoAtual.rotulo,
      precoXOF: preco
    };

    container.innerHTML = `
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,0.04);">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
          <span style="font-size:12px;font-weight:700;color:#065f46;background:#d1fae5;padding:4px 10px;border-radius:999px;">
            3 PASSOS RÁPIDOS · ROTA OFICIAL DGVTT BISSAU
          </span>
          <span style="font-size:11px;font-weight:700;color:#92400e;background:#fef3c7;padding:4px 10px;border-radius:999px;">
            Modo Demonstração / Parcerias em Ativação
          </span>
        </div>

        <label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">
          1. Escolha para onde quer ir e o ponto de referência
        </label>
        <select id="select-rota-v8" style="width:100%;padding:11px;border-radius:10px;border:1px solid #d1d5db;font-size:14px;margin-bottom:10px;background:#fff;">
          ${renderizarOpcoesRotas()}
        </select>

        <input id="input-ref-v8" type="text" placeholder="Ponto de referência (ex: Perto do Mercado, portão...)" style="width:100%;padding:11px;border-radius:10px;border:1px solid #d1d5db;font-size:14px;margin-bottom:14px;box-sizing:border-box;" />

        <label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">
          2. Escolha o veículo (preço final do veículo selecionado)
        </label>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">
          ${VEICULOS.map((v) => {
            const ativo = v.id === veiculoAtual.id;
            const p = Math.round(rotaAtual.baseXOF * v.mult);
            return `
              <button type="button" data-veiculo-v8="${v.id}" style="padding:12px 8px;border-radius:12px;cursor:pointer;text-align:center;border:${
                ativo ? "2px solid #16a34a" : "1px solid #d1d5db"
              };background:${ativo ? "#f0fdf4" : "#ffffff"};">
                <div style="font-size:18px;">${v.emoji}</div>
                <div style="font-size:12px;font-weight:700;color:#111827;margin-top:2px;">${v.nome}</div>
                <div style="font-size:15px;font-weight:800;color:#111827;margin-top:4px;">${p} XOF</div>
              </button>
            `;
          }).join("")}
        </div>

        <div style="padding:12px;border-radius:12px;background:#f9fafb;border:1px solid #e5e7eb;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;color:#111827;">
            <span>Total (${veiculoAtual.nome}):</span>
            <span style="color:#15803d;font-size:17px;">${preco} XOF</span>
          </div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px;">
            Rota base: ${rotaAtual.nome} (${rotaAtual.baseXOF} XOF) · Comissão estimada da plataforma: ~${comissaoEstimada} XOF. Débito automático real será ativado após acordo com operadoras/parceiros.
          </div>
        </div>

        <label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">
          3. Método e dados para confirmar o pedido
        </label>
        <select id="select-metodo-v8" style="width:100%;padding:11px;border-radius:10px;border:1px solid #d1d5db;font-size:13px;margin-bottom:10px;background:#fff;">
          ${METODOS_PAGAMENTO.map(
            (m) => `<option value="${m}" ${metodoAtual === m ? "selected" : ""}>${m}</option>`
          ).join("")}
        </select>

        ${renderizarCamposPagamento()}

        <button type="button" id="btn-pedir-v8" style="width:100%;padding:14px;border:none;border-radius:12px;background:#16a34a;color:#ffffff;font-weight:800;font-size:15px;cursor:pointer;">
          Pedir ${veiculoAtual.nome} · ${preco} XOF
        </button>

        ${renderizarBlocoEstado(preco)}
      </div>
    `;

    const selRota = container.querySelector("#select-rota-v8");
    if (selRota) {
      selRota.addEventListener("change", () => {
        const opt = selRota.options[selRota.selectedIndex];
        const nomeRota = opt ? opt.getAttribute("data-rota") : "";
        rotaAtual = TODAS_ROTAS.find((r) => r.nome === nomeRota) || TODAS_ROTAS[0];
        renderizarPainel(container);
      });
    }

    container.querySelectorAll("[data-veiculo-v8]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-veiculo-v8");
        veiculoAtual = VEICULOS.find((v) => v.id === id) || VEICULOS[0];
        renderizarPainel(container);
      });
    });

    const selMetodo = container.querySelector("#select-metodo-v8");
    if (selMetodo) {
      selMetodo.addEventListener("change", () => {
        metodoAtual = selMetodo.value || "Orange Money";
        renderizarPainel(container);
      });
    }

    const inputNumCartao = container.querySelector("#input-cartao-numero-v8");
    if (inputNumCartao) {
      inputNumCartao.addEventListener("input", () => {
        const digitos = inputNumCartao.value.replace(/\D/g, "").slice(0, 16);
        inputNumCartao.value = digitos.replace(/(\d{4})(?=\d)/g, "$1 ");
      });
    }

    const inputValidade = container.querySelector("#input-cartao-validade-v8");
    if (inputValidade) {
      inputValidade.addEventListener("input", () => {
        const digitos = inputValidade.value.replace(/\D/g, "").slice(0, 4);
        inputValidade.value = digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
      });
    }

    const inputCvv = container.querySelector("#input-cartao-cvv-v8");
    if (inputCvv) {
      inputCvv.addEventListener("input", () => {
        inputCvv.value = inputCvv.value.replace(/\D/g, "").slice(0, 3);
      });
    }

    const inputMsg = container.querySelector("#input-msg-motorista-v8");
    if (inputMsg) {
      inputMsg.addEventListener("input", () => {
        mensagemRapida = inputMsg.value;
        const fallback = (MOTORISTAS_DEMO_POR_TIPO[veiculoAtual.id] || MOTORISTAS_DEMO_POR_TIPO.TAXI)[0];
        const mot = motoristaAtribuido || fallback;
        const telDigitos = (mot.telefone || "").replace(/\D/g, "");
        const telLimpo = (mot.telefone || "").replace(/[^\d+]/g, "");
        const textoEncoded = encodeURIComponent(
          `Olá ${mot.nomeCompleto}, estou na rota ${rotaAtual.nome} (${veiculoAtual.nome}). ${mensagemRapida}`
        );
        const wa = container.querySelector("#link-wa-v8");
        const sms = container.querySelector("#link-sms-v8");
        if (wa) wa.href = telDigitos ? `https://wa.me/${telDigitos}?text=${textoEncoded}` : "https://wa.me/?text=" + textoEncoded;
        if (sms && telLimpo) sms.href = `sms:${telLimpo}?body=${textoEncoded}`;
      });
    }

    const btnTrocar = container.querySelector("#btn-trocar-motorista-v8");
    if (btnTrocar) {
      btnTrocar.addEventListener("click", () => {
        if (!listaMotoristasDisponiveis.length) return;
        if (listaMotoristasDisponiveis.length === 1) {
          avisoTrocaMotorista = "Só existe 1 motorista disponível nesta categoria neste momento.";
          renderizarPainel(container);
          return;
        }
        indiceMotoristaAtual = (indiceMotoristaAtual + 1) % listaMotoristasDisponiveis.length;
        motoristaAtribuido = listaMotoristasDisponiveis[indiceMotoristaAtual];
        avisoTrocaMotorista = `Novo motorista solicitado (${indiceMotoristaAtual + 1} de ${listaMotoristasDisponiveis.length}).`;
        iniciarSequenciaEtapas(container);
      });
    }

    const btnPedir = container.querySelector("#btn-pedir-v8");
    if (btnPedir) {
      btnPedir.addEventListener("click", async () => {
        let referenciaCliente = (container.querySelector("#input-tel-v8")?.value || "").trim();

        if (metodoAtual === "Dinheiro Vivo") {
          referenciaCliente = "Dinheiro Vivo ao condutor";
        } else if (metodoAtual === "Cartão") {
          const numLimpo = (container.querySelector("#input-cartao-numero-v8")?.value || "").replace(/\D/g, "");
          const cvvLimpo = (container.querySelector("#input-cartao-cvv-v8")?.value || "").replace(/\D/g, "");
          const aviso = container.querySelector("#aviso-cartao-v8");

          if (numLimpo.length !== 16 || cvvLimpo.length !== 3) {
            if (aviso) {
              aviso.style.color = "#dc2626";
              aviso.textContent = "Preencha os 16 dígitos do cartão e o código secreto de 3 dígitos (CVV).";
            }
            return;
          }
          referenciaCliente = `Cartão **** ${numLimpo.slice(-4)}`;
        }

        avisoTrocaMotorista = "";
        listaMotoristasDisponiveis = await carregarListaMotoristas(veiculoAtual.id);
        indiceMotoristaAtual = 0;
        motoristaAtribuido = listaMotoristasDisponiveis[0];

        const ref = (container.querySelector("#input-ref-v8")?.value || "").trim();
        const valor = calcularPrecoXOF();

        if (typeof window.iniciarPagamentoComComissao === "function") {
          window
            .iniciarPagamentoComComissao({
              categoria: "mobilidade",
              servico: veiculoAtual.nome,
              clienteNome: "Cliente App Bissau",
              clienteEmail: "",
              clienteTelefone: referenciaCliente || "+245000000000",
              detalhes: `${rotaAtual.nome}${ref ? " (" + ref + ")" : ""}`,
              valorBaseXOF: valor,
              metodoPagamento: `${metodoAtual} [DEMO]`
            })
            .catch(() => {});
        }

        iniciarSequenciaEtapas(container);
      });
    }

    const btnCancelar = container.querySelector("#btn-cancelar-v8");
    if (btnCancelar) {
      btnCancelar.addEventListener("click", () => {
        limparTimers();
        faseViagem = "CANCELADA";
        renderizarPainel(container);
      });
    }
  }

  function montarPainel() {
    refrescarMapaBissau();
    const existente = document.getElementById("superapp-painel-viagem");
    if (existente) {
      renderizarPainel(existente);
      return;
    }

    const botaoAntigo = Array.from(document.querySelectorAll("button")).find((b) =>
      /pagar\s*&\s*pedir\s*viagem|pedir\s*viagem/i.test(b.textContent || "")
    );
    if (!botaoAntigo) return;

    let alvo = botaoAntigo.parentElement;
    for (let i = 0; i < 6 && alvo && alvo.parentElement; i++) {
      const txt = alvo.textContent || "";
      if (/t[áa]xi\s*oficial/i.test(txt) && /moto-?t[áa]xi/i.test(txt) && /rota/i.test(txt)) {
        break;
      }
      alvo = alvo.parentElement;
    }

    if (!alvo || !alvo.parentElement) return;

    const painel = document.createElement("div");
    painel.id = "superapp-painel-viagem";
    alvo.parentElement.insertBefore(painel, alvo);
    alvo.style.display = "none";

    renderizarPainel(painel);
  }

  window.addEventListener("load", () => {
    setTimeout(montarPainel, 300);
    setTimeout(refrescarMapaBissau, 600);
  });

  document.addEventListener("click", () => {
    setTimeout(refrescarMapaBissau, 200);
  });

  setTimeout(montarPainel, 350);
})();
(function () {
  if (window.__superAppCompletoV11) return;
  window.__superAppCompletoV11 = true;

  // =========================================================================
  // CONFIGURAÇÃO DA CONTA COMERCIANTE (ALTERE AQUI OS SEUS DADOS REAIS)
  // =========================================================================
  const MERCHANT_ORANGE = "955 00 00 00 (Código Merchant: 000000)";
  const MERCHANT_TELECEL = "966 00 00 00 (Conta Comerciante)";
  const WHATSAPP_SUPORTE = "245955000000";
  const PIN_CONDUTOR_PADRAO = "2450";

  // =========================================================================
  // 1. PAINEL DO CONDUTOR: PRIVACIDADE DE GANHOS + RECARGA MERCHANT ACCOUNT
  // =========================================================================
  let ganhosDesbloqueados = false;
  let painelRecargaAberto = false;
  let valorRecargaEscolhido = "2.000 XOF";
  let operadoraRecarga = "Orange Money";
  let idTransacaoSms = "";

  function verificarSessaoMotorista() {
    if (ganhosDesbloqueados) return true;
    try {
      if (sessionStorage.getItem("rotagb_motorista_verificado") === "1") {
        ganhosDesbloqueados = true;
        return true;
      }
    } catch (_) {}
    return false;
  }

  function lerDadosCondutorNaTela() {
    const bodyTxt = document.body ? document.body.innerText || "" : "";
    const nomeMatch = bodyTxt.match(/Nome:\s*([^\n\r]+)/i);
    const placaMatch = bodyTxt.match(/Matr[íi]cula\s*\(?Placa\)?:\s*([^\n\r]+)/i);
    return {
      nome: nomeMatch ? nomeMatch[1].trim() : "Condutor RotaGB",
      placa: placaMatch ? placaMatch[1].trim() : "Sem matrícula"
    };
  }

  function montarBlocoRecargaMerchant() {
    const condutor = lerDadosCondutorNaTela();
    const numeroAtivo = operadoraRecarga === "Orange Money" ? MERCHANT_ORANGE : MERCHANT_TELECEL;
    const msgComprovativo = encodeURIComponent(
      `Olá Suporte RotaGB! Fiz uma recarga de saldo de comissão (${valorRecargaEscolhido}) via ${operadoraRecarga}.\n` +
        `Motorista: ${condutor.nome}\n` +
        `Matrícula: ${condutor.placa}\n` +
        `ID Transação / Ref: ${idTransacaoSms || "Em anexo"}`
    );

    return `
      <div id="cartao-recarga-merchant" style="margin-top:12px;margin-bottom:12px;padding:16px;border-radius:14px;background:#f0fdf4;border:1.5px solid #86efac;text-align:left;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
          <span style="font-size:13px;font-weight:800;color:#14532d;">💳 Carteira &amp; Saldo de Comissão</span>
          <span style="font-size:11px;font-weight:700;color:#166534;background:#dcfce7;padding:2px 8px;border-radius:999px;">Cadastro 100% Gratuito</span>
        </div>
        <div style="font-size:12px;color:#374151;margin-bottom:10px;">
          O registo na plataforma é gratuito. Carregue saldo apenas quando precisar de cobrir a comissão das corridas pagas em dinheiro vivo.
        </div>
        <button type="button" id="btn-toggle-recarga-merchant" style="width:100%;padding:11px;border:none;border-radius:10px;background:#15803d;color:#fff;font-size:13px;font-weight:800;cursor:pointer;">
          ${painelRecargaAberto ? "▲ Fechar Dados de Pagamento Merchant" : "➕ Carregar Saldo via Merchant Account"}
        </button>
        ${
          painelRecargaAberto
            ? `
          <div style="margin-top:12px;padding:12px;border-radius:11px;background:#ffffff;border:1px solid #bbf7d0;">
            <label style="display:block;font-size:11px;font-weight:700;color:#374151;margin-bottom:4px;">1. Escolha a operadora Merchant</label>
            <select id="select-operadora-merchant" style="width:100%;padding:9px;border-radius:8px;border:1px solid #d1d5db;font-size:13px;margin-bottom:8px;background:#fff;">
              <option value="Orange Money" ${operadoraRecarga === "Orange Money" ? "selected" : ""}>Orange Money (Merchant)</option>
              <option value="Telecel" ${operadoraRecarga === "Telecel" ? "selected" : ""}>Telecel (Merchant)</option>
            </select>
            <div style="padding:10px;border-radius:9px;background:#f8fafc;border:1px dashed #94a3b8;margin-bottom:10px;">
              <div style="font-size:11px;color:#475569;font-weight:700;">Conta Oficial RotaGB (${operadoraRecarga}):</div>
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:4px;">
                <span style="font-size:13px;font-weight:800;color:#0f172a;">${numeroAtivo}</span>
                <button type="button" id="btn-copiar-merchant" style="padding:5px 9px;border:none;border-radius:6px;background:#0f172a;color:#fff;font-size:11px;font-weight:700;cursor:pointer;">Copiar</button>
              </div>
              <div id="aviso-copia-merchant" style="font-size:11px;color:#15803d;margin-top:4px;"></div>
            </div>
            <label style="display:block;font-size:11px;font-weight:700;color:#374151;margin-bottom:4px;">2. Valor carregado &amp; ID da transação SMS</label>
            <div style="display:grid;grid-template-columns:1fr 1.2fr;gap:6px;margin-bottom:10px;">
              <select id="select-valor-merchant" style="padding:9px;border-radius:8px;border:1px solid #d1d5db;font-size:12px;background:#fff;">
                <option value="2.000 XOF" ${valorRecargaEscolhido === "2.000 XOF" ? "selected" : ""}>2.000 XOF</option>
                <option value="5.000 XOF" ${valorRecargaEscolhido === "5.000 XOF" ? "selected" : ""}>5.000 XOF</option>
                <option value="10.000 XOF" ${valorRecargaEscolhido === "10.000 XOF" ? "selected" : ""}>10.000 XOF</option>
              </select>
              <input id="input-id-transacao-merchant" type="text" value="${idTransacaoSms.replace(/"/g, "&quot;")}" placeholder="ID SMS (ex: PP2611...)" style="padding:9px;border-radius:8px;border:1px solid #d1d5db;font-size:12px;box-sizing:border-box;" />
            </div>
            <a id="link-comprovativo-merchant" href="https://wa.me/${WHATSAPP_SUPORTE}?text=${msgComprovativo}" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;text-decoration:none;padding:11px;border-radius:9px;background:#16a34a;color:#fff;font-size:13px;font-weight:800;">
              📲 Enviar Comprovativo no WhatsApp
            </a>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  function ligarEventosRecargaMerchant(wrapper) {
    const btnToggle = wrapper.querySelector("#btn-toggle-recarga-merchant");
    if (btnToggle) {
      btnToggle.addEventListener("click", () => {
        painelRecargaAberto = !painelRecargaAberto;
        wrapper.innerHTML = montarBlocoRecargaMerchant();
        ligarEventosRecargaMerchant(wrapper);
      });
    }
    const selOp = wrapper.querySelector("#select-operadora-merchant");
    if (selOp) {
      selOp.addEventListener("change", () => {
        operadoraRecarga = selOp.value;
        wrapper.innerHTML = montarBlocoRecargaMerchant();
        ligarEventosRecargaMerchant(wrapper);
      });
    }
    const selVal = wrapper.querySelector("#select-valor-merchant");
    if (selVal) {
      selVal.addEventListener("change", () => {
        valorRecargaEscolhido = selVal.value;
        wrapper.innerHTML = montarBlocoRecargaMerchant();
        ligarEventosRecargaMerchant(wrapper);
      });
    }
    const inputId = wrapper.querySelector("#input-id-transacao-merchant");
    if (inputId) {
      inputId.addEventListener("input", () => {
        idTransacaoSms = inputId.value;
        const condutor = lerDadosCondutorNaTela();
        const msg = encodeURIComponent(
          `Olá Suporte RotaGB! Fiz uma recarga de saldo de comissão (${valorRecargaEscolhido}) via ${operadoraRecarga}.\n` +
            `Motorista: ${condutor.nome}\n` +
            `Matrícula: ${condutor.placa}\n` +
            `ID Transação / Ref: ${idTransacaoSms || "Em anexo"}`
        );
        const link = wrapper.querySelector("#link-comprovativo-merchant");
        if (link) link.href = `https://wa.me/${WHATSAPP_SUPORTE}?text=${msg}`;
      });
    }
    const btnCopiar = wrapper.querySelector("#btn-copiar-merchant");
    if (btnCopiar) {
      btnCopiar.addEventListener("click", () => {
        const texto = operadoraRecarga === "Orange Money" ? MERCHANT_ORANGE : MERCHANT_TELECEL;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(texto).catch(() => {});
        }
        const aviso = wrapper.querySelector("#aviso-copia-merchant");
        if (aviso) aviso.textContent = "Número/código copiado! Cole na aplicação Orange Money ou Telecel.";
      });
    }
  }

  function atualizarPainelCondutor() {
    const candidatos = Array.from(document.querySelectorAll("div, section, article"));
    const cartao = candidatos.find((el) => {
      if (el.getAttribute("data-ganhos-protegidos") === "1") return false;
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
      return /resumo\s*de\s*ganhos\s*hoje/i.test(txt) && /comiss[aã]o\s*retida/i.test(txt) && txt.length < 220;
    });

    if (!cartao || !cartao.parentElement) return;

    if (!cartao.parentElement.querySelector("#wrapper-recarga-merchant")) {
      const wrapperRecarga = document.createElement("div");
      wrapperRecarga.id = "wrapper-recarga-merchant";
      wrapperRecarga.innerHTML = montarBlocoRecargaMerchant();
      cartao.parentElement.insertBefore(wrapperRecarga, cartao.nextSibling);
      ligarEventosRecargaMerchant(wrapperRecarga);
    }

    if (verificarSessaoMotorista()) {
      const bloqueio = cartao.parentElement.querySelector("#bloqueio-ganhos-motorista");
      if (bloqueio) bloqueio.remove();
      cartao.style.display = "";
      return;
    }

    cartao.style.display = "none";
    cartao.setAttribute("data-ganhos-protegidos", "1");

    if (cartao.parentElement.querySelector("#bloqueio-ganhos-motorista")) return;

    const aviso = document.createElement("div");
    aviso.id = "bloqueio-ganhos-motorista";
    aviso.style.cssText =
      "margin-top:12px;margin-bottom:12px;padding:16px;border-radius:14px;background:#f8fafc;border:1px solid #cbd5e1;text-align:left;";

    aviso.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="font-size:13px;font-weight:800;color:#0f172a;">🔒 Resumo de Ganhos Diários (Privado)</span>
        <span style="font-size:11px;font-weight:700;color:#475569;background:#e2e8f0;padding:2px 8px;border-radius:999px;">Acesso Condutor</span>
      </div>
      <div style="font-size:12px;color:#475569;margin-bottom:10px;">
        Os ganhos diários e comissões ficam ocultos para clientes. Apenas o motorista titular pode visualizar estes valores.
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <input id="input-pin-condutor" type="password" inputmode="numeric" maxlength="6" placeholder="PIN do motorista" style="flex:1;padding:10px;border-radius:9px;border:1px solid #cbd5e1;font-size:13px;background:#fff;" />
        <button type="button" id="btn-desbloquear-ganhos" style="padding:10px 14px;border:none;border-radius:9px;background:#0f172a;color:#fff;font-size:12px;font-weight:700;cursor:pointer;">Ver Ganhos</button>
      </div>
      <div id="msg-pin-condutor" style="font-size:11px;color:#64748b;margin-top:6px;">
        Nota: Em produção, este acesso será validado automaticamente pelo login do motorista no Supabase.
      </div>
    `;

    cartao.parentElement.insertBefore(aviso, cartao);

    const btn = aviso.querySelector("#btn-desbloquear-ganhos");
    const input = aviso.querySelector("#input-pin-condutor");
    const msg = aviso.querySelector("#msg-pin-condutor");

    btn.addEventListener("click", () => {
      const pinDigitado = (input.value || "").trim();
      const pinSalvo = window.__pinMotoristaAtivo || PIN_CONDUTOR_PADRAO;

      if (pinDigitado === String(pinSalvo)) {
        ganhosDesbloqueados = true;
        try { sessionStorage.setItem("rotagb_motorista_verificado", "1"); } catch (_) {}
        aviso.remove();
        cartao.style.display = "";
      } else {
        msg.style.color = "#dc2626";
        msg.textContent = "PIN incorreto. Acesso restrito apenas ao condutor registado.";
      }
    });
  }

  // =========================================================================
  // 2. SISTEMA DE FARMÁCIAS EM BISSAU (LOJA + CATÁLOGO DE MEDICAMENTOS + PAGAMENTO)
  // =========================================================================
  const FARMACIAS_BISSAU = [
    {
      id: "farm-mocambique",
      nome: "Farmácia Moçambique",
      bairro: "Rua Moçambique × Angola, Bissau",
      telefone: "+245 955 131 313",
      horario: "Seg-Sex: 08h-21h · Sáb: 08h-14h",
      destaque: "Teste de paludismo na hora · Amplo stock",
      imagem: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "farm-municipal",
      nome: "Farmácia Municipal",
      bairro: "Av. Pansau Na Isna, Bissau",
      telefone: "+245 955 850 085",
      horario: "Seg-Sex: 08h-19h · Sáb: 08h-13h",
      destaque: "Próxima ao Hospital Simão Mendes",
      imagem: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "farm-moderna",
      nome: "Farmácia Moderna",
      bairro: "Rua 2 / Bissau Velho",
      telefone: "+245 966 663 128",
      horario: "Seg-Sáb: 08h-19h",
      destaque: "Atendimento no Centro Histórico",
      imagem: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "farm-portuguesa",
      nome: "Farmácia Portuguesa",
      bairro: "Av. Amílcar Cabral / Rua Justino Lopes",
      telefone: "+245 955 942 994",
      horario: "Seg-Sáb: 08h-20h",
      destaque: "Medicamentos importados & dermocosmética",
      imagem: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "farm-nurdin",
      nome: "Farmácia Nur-Din",
      bairro: "Praça / Rotunda de Amura, Bissau",
      telefone: "+245 955 924 145",
      horario: "Seg-Sex: 08h-21h · Sáb: 08h-13h",
      destaque: "Atendimento rápido no Centro",
      imagem: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "farm-caracol",
      nome: "Farmácia de Caracol",
      bairro: "Rotunda de Caracol, Bissau",
      telefone: "+245 956 330 015",
      horario: "Todos os dias: 08h-23h",
      destaque: "Horário noturno até às 23h",
      imagem: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=900&q=80"
    }
  ];

  const MEDICAMENTOS_CATALOGO = [
    { id: "med-paracetamol", nome: "Paracetamol 500mg (20 comp.)", categoria: "Dor & Febre", precoXOF: 1000, receita: false },
    { id: "med-coartem", nome: "Antipalúdico Arteméter + Lumefantrina", categoria: "Paludismo", precoXOF: 3500, receita: true },
    { id: "med-ibuprofeno", nome: "Ibuprofeno 400mg (10 comp.)", categoria: "Anti-inflamatório", precoXOF: 1500, receita: false },
    { id: "med-amoxicilina", nome: "Amoxicilina 500mg (12 cáps.)", categoria: "Antibiótico", precoXOF: 2500, receita: true },
    { id: "med-soro", nome: "Sais de Reidratação Oral (3 saquetas)", categoria: "Hidratação", precoXOF: 900, receita: false },
    { id: "med-vitc", nome: "Vitamina C 1000mg Efervescente", categoria: "Vitaminas", precoXOF: 2200, receita: false },
    { id: "med-alcool", nome: "Álcool Etílico 70% + Algodão + Pensos", categoria: "Primeiros Socorros", precoXOF: 1800, receita: false },
    { id: "med-omeprazol", nome: "Omeprazol 20mg (14 cáps.)", categoria: "Estômago", precoXOF: 2000, receita: false }
  ];

  let farmaciaSelecionada = null;
  let buscaMedicamento = "";
  let carrinhoFarmacia = {};
  let observacaoFarmacia = "";
  let metodoPagFarmacia = "Orange Money";
  let estadoPedidoFarmacia = "IDLE"; // IDLE | CONFIRMADO

  function calcularTotalFarmacia() {
    let subtotal = 0;
    let qtdTotal = 0;
    Object.keys(carrinhoFarmacia).forEach((id) => {
      const qtd = carrinhoFarmacia[id] || 0;
      const item = MEDICAMENTOS_CATALOGO.find((m) => m.id === id);
      if (item && qtd > 0) {
        subtotal += item.precoXOF * qtd;
        qtdTotal += qtd;
      }
    });
    const taxaEntrega = qtdTotal > 0 ? 500 : 0;
    return { subtotal, taxaEntrega, total: subtotal + taxaEntrega, qtdTotal };
  }

  function renderizarFarmaciaUI(wrapper) {
    const { subtotal, taxaEntrega, total, qtdTotal } = calcularTotalFarmacia();

    // TELA 1: LISTA DE FARMÁCIAS EM BISSAU
    if (!farmaciaSelecionada) {
      wrapper.innerHTML = `
        <div style="text-align:left;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
            <span style="font-size:11px;font-weight:800;color:#065f46;background:#d1fae5;padding:4px 10px;border-radius:999px;">
              ENTREGA RÁPIDA EM BISSAU · ESCOLHA A FARMÁCIA
            </span>
            <span style="font-size:11px;font-weight:700;color:#92400e;background:#fef3c7;padding:3px 9px;border-radius:999px;">
              Modo Demonstração
            </span>
          </div>

          <div style="display:grid;grid-template-columns:1fr;gap:12px;max-height:66vh;overflow-y:auto;padding-right:2px;">
            ${FARMACIAS_BISSAU.map(
              (f) => `
              <div style="border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;background:#ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <div style="position:relative;height:132px;background:#e2e8f0;">
                  <img src="${f.imagem}" alt="${f.nome}" style="width:100%;height:100%;object-fit:cover;display:block;" />
                  <span style="position:absolute;top:10px;left:10px;background:rgba(15,23,42,0.85);color:#fff;font-size:11px;font-weight:700;padding:4px 9px;border-radius:999px;">
                    ${f.horario}
                  </span>
                </div>
                <div style="padding:12px;">
                  <div style="font-size:16px;font-weight:800;color:#111827;">${f.nome}</div>
                  <div style="font-size:12px;color:#4b5563;margin-top:2px;">📍 ${f.bairro}</div>
                  <div style="font-size:12px;color:#0f766e;font-weight:600;margin-top:4px;">✓ ${f.destaque}</div>
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:10px;">
                    <a href="tel:${f.telefone.replace(/\s+/g, "")}" style="font-size:12px;font-weight:700;color:#2563eb;text-decoration:none;">
                      📞 ${f.telefone}
                    </a>
                    <button type="button" data-entrar-farmacia="${f.id}" style="padding:9px 14px;border:none;border-radius:10px;background:#16a34a;color:#fff;font-size:13px;font-weight:800;cursor:pointer;">
                      Entrar na Farmácia →
                    </button>
                  </div>
                </div>
              </div>
            `
            ).join("")}
          </div>
        </div>
      `;

      wrapper.querySelectorAll("[data-entrar-farmacia]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-entrar-farmacia");
          farmaciaSelecionada = FARMACIAS_BISSAU.find((f) => f.id === id) || FARMACIAS_BISSAU[0];
          estadoPedidoFarmacia = "IDLE";
          renderizarFarmaciaUI(wrapper);
        });
      });
      return;
    }

    // TELA 2: DENTRO DA FARMÁCIA (MEDICAMENTOS + CARRINHO + PAGAMENTO)
    const filtrados = MEDICAMENTOS_CATALOGO.filter(
      (m) =>
        m.nome.toLowerCase().includes(buscaMedicamento.toLowerCase()) ||
        m.categoria.toLowerCase().includes(buscaMedicamento.toLowerCase())
    );

    wrapper.innerHTML = `
      <div style="text-align:left;max-height:74vh;overflow-y:auto;padding-right:2px;">
        <button type="button" id="btn-voltar-farmacias" style="margin-bottom:10px;padding:7px 12px;border:1px solid #d1d5db;border-radius:9px;background:#f9fafb;color:#111827;font-size:12px;font-weight:700;cursor:pointer;">
          ← Voltar às Farmácias de Bissau
        </button>

        <div style="border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:12px;background:#fff;">
          <img src="${farmaciaSelecionada.imagem}" alt="${farmaciaSelecionada.nome}" style="width:100%;height:115px;object-fit:cover;display:block;" />
          <div style="padding:10px 12px;">
            <div style="font-size:16px;font-weight:800;color:#111827;">${farmaciaSelecionada.nome}</div>
            <div style="font-size:12px;color:#4b5563;">📍 ${farmaciaSelecionada.bairro} · 📞 ${farmaciaSelecionada.telefone}</div>
          </div>
        </div>

        <label style="display:block;font-size:12px;font-weight:800;color:#111827;margin-bottom:6px;">
          1. Escolha os medicamentos ou produtos
        </label>
        <input
          id="input-busca-med"
          type="text"
          value="${buscaMedicamento.replace(/"/g, "&quot;")}"
          placeholder="Pesquisar medicamento (ex: Paracetamol, Paludismo, Soro...)"
          style="width:100%;padding:10px;border-radius:10px;border:1px solid #d1d5db;font-size:13px;margin-bottom:10px;box-sizing:border-box;"
        />

        <div style="display:grid;grid-template-columns:1fr;gap:8px;margin-bottom:12px;">
          ${filtrados
            .map((m) => {
              const qtd = carrinhoFarmacia[m.id] || 0;
              return `
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px;border-radius:11px;border:1px solid ${
                qtd > 0 ? "#16a34a" : "#e5e7eb"
              };background:${qtd > 0 ? "#f0fdf4" : "#fff"};">
                <div style="flex:1;">
                  <div style="font-size:13px;font-weight:700;color:#111827;">${m.nome}</div>
                  <div style="font-size:11px;color:#6b7280;">
                    ${m.categoria} ${m.receita ? "· ⚠️ Pode exigir receita médica" : ""}
                  </div>
                  <div style="font-size:13px;font-weight:800;color:#15803d;margin-top:2px;">${m.precoXOF} XOF</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <button type="button" data-menos-med="${m.id}" style="width:30px;height:30px;border-radius:8px;border:1px solid #d1d5db;background:#fff;font-weight:800;cursor:pointer;">-</button>
                  <span style="min-width:18px;text-align:center;font-size:13px;font-weight:800;">${qtd}</span>
                  <button type="button" data-mais-med="${m.id}" style="width:30px;height:30px;border-radius:8px;border:none;background:#16a34a;color:#fff;font-weight:800;cursor:pointer;">+</button>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>

        <input
          id="input-obs-farmacia"
          type="text"
          value="${observacaoFarmacia.replace(/"/g, "&quot;")}"
          placeholder="Outro medicamento, receita ou ponto de entrega em Bissau..."
          style="width:100%;padding:10px;border-radius:10px;border:1px solid #d1d5db;font-size:13px;margin-bottom:12px;box-sizing:border-box;"
        />

        <div style="padding:12px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;">
            <span>Medicamentos (${qtdTotal} itens):</span>
            <span>${subtotal} XOF</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;margin-top:4px;">
            <span>Entrega Moto-Estafeta Bissau:</span>
            <span>${taxaEntrega} XOF</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;color:#111827;margin-top:6px;padding-top:6px;border-top:1px solid #cbd5e1;">
            <span>Total a Pagar:</span>
            <span style="color:#15803d;">${total} XOF</span>
          </div>
        </div>

        <label style="display:block;font-size:12px;font-weight:800;color:#111827;margin-bottom:6px;">
          2. Método de Pagamento
        </label>
        <select id="select-pag-farmacia" style="width:100%;padding:10px;border-radius:10px;border:1px solid #d1d5db;font-size:13px;margin-bottom:10px;background:#fff;">
          <option value="Orange Money" ${metodoPagFarmacia === "Orange Money" ? "selected" : ""}>Orange Money</option>
          <option value="Telecel" ${metodoPagFarmacia === "Telecel" ? "selected" : ""}>Telecel</option>
          <option value="Cartão de Débito" ${metodoPagFarmacia === "Cartão de Débito" ? "selected" : ""}>Cartão de Débito / Crédito</option>
        </select>

        ${
          metodoPagFarmacia === "Cartão de Débito"
            ? `
          <div style="padding:10px;border-radius:10px;background:#f8fafc;border:1px solid #cbd5e1;margin-bottom:10px;">
            <input id="farm-cartao-num" type="text" inputmode="numeric" maxlength="19" placeholder="Número do Cartão (16 dígitos)" style="width:100%;padding:9px;border-radius:8px;border:1px solid #cbd5e1;font-size:13px;margin-bottom:8px;box-sizing:border-box;" />
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <input id="farm-cartao-val" type="text" inputmode="numeric" maxlength="5" placeholder="Validade (MM/AA)" style="padding:9px;border-radius:8px;border:1px solid #cbd5e1;font-size:13px;box-sizing:border-box;" />
              <input id="farm-cartao-cvv" type="password" inputmode="numeric" maxlength="3" placeholder="CVV (3 dígitos)" style="padding:9px;border-radius:8px;border:1px solid #cbd5e1;font-size:13px;box-sizing:border-box;" />
            </div>
          </div>
        `
            : `
          <input id="farm-tel-pag" type="tel" placeholder="Número ${metodoPagFarmacia} (+245...)" style="width:100%;padding:10px;border-radius:10px;border:1px solid #d1d5db;font-size:13px;margin-bottom:10px;box-sizing:border-box;" />
        `
        }

        <div id="aviso-erro-farmacia" style="font-size:12px;color:#dc2626;margin-bottom:8px;"></div>

        <button type="button" id="btn-confirmar-farmacia" style="width:100%;padding:13px;border:none;border-radius:12px;background:#16a34a;color:#fff;font-size:15px;font-weight:800;cursor:pointer;">
          Confirmar &amp; Pagar · ${total} XOF
        </button>

        ${
          estadoPedidoFarmacia === "CONFIRMADO"
            ? `
          <div style="margin-top:12px;padding:12px;border-radius:12px;background:#ecfdf5;border:1.5px solid #10b981;color:#065f46;font-size:13px;">
            <strong>✅ Pedido enviado para ${farmaciaSelecionada.nome}!</strong><br/>
            Total: <strong>${total} XOF</strong> via <strong>${metodoPagFarmacia}</strong> (Modo Demonstração). Um estafeta em Bissau fará a recolha e entrega.
          </div>
        `
            : ""
        }
      </div>
    `;

    const btnVoltar = wrapper.querySelector("#btn-voltar-farmacias");
    if (btnVoltar) {
      btnVoltar.addEventListener("click", () => {
        farmaciaSelecionada = null;
        renderizarFarmaciaUI(wrapper);
      });
    }

    const inputBusca = wrapper.querySelector("#input-busca-med");
    if (inputBusca) {
      inputBusca.addEventListener("input", () => {
        buscaMedicamento = inputBusca.value;
        renderizarFarmaciaUI(wrapper);
        const novoInput = wrapper.querySelector("#input-busca-med");
        if (novoInput) {
          novoInput.focus();
          novoInput.setSelectionRange(novoInput.value.length, novoInput.value.length);
        }
      });
    }

    wrapper.querySelectorAll("[data-mais-med]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-mais-med");
        carrinhoFarmacia[id] = (carrinhoFarmacia[id] || 0) + 1;
        renderizarFarmaciaUI(wrapper);
      });
    });

    wrapper.querySelectorAll("[data-menos-med]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-menos-med");
        if ((carrinhoFarmacia[id] || 0) > 0) {
          carrinhoFarmacia[id] -= 1;
        }
        renderizarFarmaciaUI(wrapper);
      });
    });

    const inputObs = wrapper.querySelector("#input-obs-farmacia");
    if (inputObs) {
      inputObs.addEventListener("input", () => {
        observacaoFarmacia = inputObs.value;
      });
    }

    const selPag = wrapper.querySelector("#select-pag-farmacia");
    if (selPag) {
      selPag.addEventListener("change", () => {
        metodoPagFarmacia = selPag.value;
        renderizarFarmaciaUI(wrapper);
      });
    }

    const cNum = wrapper.querySelector("#farm-cartao-num");
    if (cNum) {
      cNum.addEventListener("input", () => {
        const d = cNum.value.replace(/\D/g, "").slice(0, 16);
        cNum.value = d.replace(/(\d{4})(?=\d)/g, "$1 ");
      });
    }

    const cVal = wrapper.querySelector("#farm-cartao-val");
    if (cVal) {
      cVal.addEventListener("input", () => {
        const d = cVal.value.replace(/\D/g, "").slice(0, 4);
        cVal.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
      });
    }

    const cCvv = wrapper.querySelector("#farm-cartao-cvv");
    if (cCvv) {
      cCvv.addEventListener("input", () => {
        cCvv.value = cCvv.value.replace(/\D/g, "").slice(0, 3);
      });
    }

    const btnConfirmar = wrapper.querySelector("#btn-confirmar-farmacia");
    if (btnConfirmar) {
      btnConfirmar.addEventListener("click", () => {
        const avisoErro = wrapper.querySelector("#aviso-erro-farmacia");
        const { total: totalFinal, qtdTotal: qtd } = calcularTotalFarmacia();

        if (qtd === 0 && !observacaoFarmacia.trim()) {
          if (avisoErro) avisoErro.textContent = "Selecione pelo menos 1 medicamento ou escreva o pedido no campo acima.";
          return;
        }

        let telRef = (wrapper.querySelector("#farm-tel-pag")?.value || "").trim();
        if (metodoPagFarmacia === "Cartão de Débito") {
          const n = (wrapper.querySelector("#farm-cartao-num")?.value || "").replace(/\D/g, "");
          const cv = (wrapper.querySelector("#farm-cartao-cvv")?.value || "").replace(/\D/g, "");
          if (n.length !== 16 || cv.length !== 3) {
            if (avisoErro) avisoErro.textContent = "Preencha os 16 dígitos do cartão de débito e o CVV de 3 dígitos.";
            return;
          }
          telRef = `Cartão **** ${n.slice(-4)}`;
        }

        const resumoItens = Object.keys(carrinhoFarmacia)
          .filter((id) => carrinhoFarmacia[id] > 0)
          .map((id) => {
            const m = MEDICAMENTOS_CATALOGO.find((x) => x.id === id);
            return `${carrinhoFarmacia[id]}x ${m ? m.nome : id}`;
          })
          .join(", ");

        if (typeof window.iniciarPagamentoComComissao === "function") {
          window.iniciarPagamentoComComissao({
            categoria: "farmacia",
            servico: farmaciaSelecionada.nome,
            clienteNome: "Cliente Farmácia Bissau",
            clienteEmail: "",
            clienteTelefone: telRef || "+245000000000",
            detalhes: `${resumoItens}${observacaoFarmacia ? " | Obs: " + observacaoFarmacia : ""}`,
            valorBaseXOF: totalFinal || 1500,
            metodoPagamento: `${metodoPagFarmacia} [DEMO]`
          }).catch(() => {});
        }

        estadoPedidoFarmacia = "CONFIRMADO";
        renderizarFarmaciaUI(wrapper);
      });
    }
  }

  function modernizarModalFarmacias() {
    const titulos = Array.from(document.querySelectorAll("h1, h2, h3, h4, div, span"));
    const tituloModal = titulos.find(
      (el) => /farm[áa]cias\s+principais\s+em\s+bissau/i.test((el.textContent || "").trim()) && (el.textContent || "").trim().length < 45
    );
    if (!tituloModal) return;

    let modalBox = tituloModal.parentElement;
    for (let i = 0; i < 5 && modalBox && modalBox.parentElement; i++) {
      if (modalBox.querySelector("select") || /confirmar\s*&\s*pagar/i.test(modalBox.textContent || "")) {
        break;
      }
      modalBox = modalBox.parentElement;
    }
    if (!modalBox || modalBox.getAttribute("data-farmacia-modernizada") === "1") return;

    modalBox.setAttribute("data-farmacia-modernizada", "1");

    // Esconde os elementos antigos do carrossel dentro do modal (mantendo o cabeçalho e o botão X)
    Array.from(modalBox.children).forEach((child) => {
      if (child.contains(tituloModal)) return;
      if (/^cancelar$/i.test((child.textContent || "").trim())) return;
      child.style.display = "none";
    });

    const wrapper = document.createElement("div");
    wrapper.id = "superapp-farmacia-moderna";
    modalBox.insertBefore(wrapper, modalBox.children[1] || null);
    renderizarFarmaciaUI(wrapper);
  }

  // =========================================================================
  // 3. SISTEMA DE MOBILIDADE E PEDIDO DE VIAGEM (55 ROTAS DGVTT + SUPABASE)
  // =========================================================================
  const GRUPOS_ROTAS_DGVTT = [
    {
      grupo: "📍 Partidas: Centro da Cidade (Praça / Centro)",
      rotas: [
        { nome: "Cidade → Mercado de Bandim", baseXOF: 225 },
        { nome: "Cidade → Cristo Redentor", baseXOF: 250 },
        { nome: "Cidade → Belém / Missira", baseXOF: 325 },
        { nome: "Cidade → Bairro d'Ajuda 1º e 2º fase", baseXOF: 350 },
        { nome: "Cidade → Hospital 3 de Agosto", baseXOF: 375 },
        { nome: "Cidade → Bairro Internacional", baseXOF: 425 },
        { nome: "Cidade → Hotel Emb. América", baseXOF: 200 },
        { nome: "Cidade → Bairro Militar / Prédio Nino", baseXOF: 450 },
        { nome: "Cidade → Bairro Militar Somec", baseXOF: 475 },
        { nome: "Cidade → B. Militar / Terminal TUB", baseXOF: 525 },
        { nome: "Cidade → Brá / Seminário", baseXOF: 550 },
        { nome: "Cidade → Paragem Central", baseXOF: 475 },
        { nome: "Cidade → Guimetal", baseXOF: 525 },
        { nome: "Cidade → São Paulo", baseXOF: 550 },
        { nome: "Cidade → Háfia / Cruzamento", baseXOF: 575 },
        { nome: "Cidade → Paragem Manjaco", baseXOF: 650 },
        { nome: "Cidade → Rotunda do Aeroporto", baseXOF: 675 },
        { nome: "Cidade → Aeroporto", baseXOF: 700 },
        { nome: "Cidade → Base Aérea / PRAKLAS", baseXOF: 750 },
        { nome: "Cidade → Bissalanca Poilão", baseXOF: 800 },
        { nome: "Cidade → Enterramento", baseXOF: 200 },
        { nome: "Cidade → STENACKS / Safim", baseXOF: 950 },
        { nome: "Cidade → ENA (CENFA)", baseXOF: 650 },
        { nome: "Cidade → Av. Brasil", baseXOF: 700 },
        { nome: "Cidade → Paulo Barros", baseXOF: 775 },
        { nome: "Cidade → Caracol", baseXOF: 175 },
        { nome: "Cidade → Padaria Nhonho", baseXOF: 250 },
        { nome: "Cidade → Zona 7", baseXOF: 275 },
        { nome: "Cidade → Bairro Plano", baseXOF: 325 },
        { nome: "Cidade → Bairro Ministro", baseXOF: 375 },
        { nome: "Cidade → SHEL Quelelê", baseXOF: 425 },
        { nome: "Cidade → Sobrade", baseXOF: 475 },
        { nome: "Cidade → Ponta Neto", baseXOF: 525 },
        { nome: "Cidade → Bôr / Terminal TUB", baseXOF: 550 },
        { nome: "Cidade → Aldeia SOS", baseXOF: 575 },
        { nome: "Cidade → Cemitério de N'hala", baseXOF: 600 },
        { nome: "Cidade → Bairro Bissack (Ponte Cibe)", baseXOF: 275 },
        { nome: "Cidade → Bissack / Terminal TUB", baseXOF: 325 },
        { nome: "Cidade → Estado Major / QG", baseXOF: 275 },
        { nome: "Cidade → Igreja Católica de Antula", baseXOF: 450 },
        { nome: "Cidade → Pluba / Abílio Santos", baseXOF: 475 },
        { nome: "Cidade → Pefine", baseXOF: 650 },
        { nome: "Cidade → Estádio 24 de Setembro", baseXOF: 800 }
      ]
    },
    {
      grupo: "📍 Partidas: Mercado de Bandim",
      rotas: [
        { nome: "Mercado Bandim → SHEL / Palmeiras", baseXOF: 225 },
        { nome: "Mercado Bandim → Chapa de Bissau", baseXOF: 275 },
        { nome: "Mercado Bandim → Bairro d'Ajuda", baseXOF: 325 },
        { nome: "Mercado Bandim → Hospital 3 de Agosto", baseXOF: 350 },
        { nome: "Mercado Bandim → Bairro Internacional", baseXOF: 375 },
        { nome: "Mercado Bandim → Bairro Militar Prédio Nino", baseXOF: 450 },
        { nome: "Mercado Bandim → Bº Militar / Terminal TUB", baseXOF: 525 },
        { nome: "Mercado Bandim → Paragem Central", baseXOF: 550 },
        { nome: "Mercado Bandim → Enterramento", baseXOF: 575 },
        { nome: "Mercado Bandim → Seminário Brá", baseXOF: 650 },
        { nome: "Mercado Bandim → Aeroporto", baseXOF: 325 },
        { nome: "Mercado Bandim → Safim", baseXOF: 550 }
      ]
    }
  ];

  const TODAS_ROTAS = GRUPOS_ROTAS_DGVTT.flatMap((g) => g.rotas);

  const VEICULOS = [
    { id: "TAXI", rotulo: "TAXI", nome: "Táxi Oficial", emoji: "🚕", mult: 2.0 },
    { id: "PRIVADO", rotulo: "CARRO PRIVADO", nome: "Carro Privado", emoji: "🚗", mult: 2.6 },
    { id: "MOTO", rotulo: "MOTO-TAXI", nome: "Moto-Táxi", emoji: "🏍️", mult: 1.4 }
  ];

  const METODOS_PAGAMENTO = ["Orange Money", "Telecel", "Cartão", "Dinheiro Vivo"];

  const MOTORISTAS_DEMO_POR_TIPO = {
    TAXI: [
      { nomeCompleto: "Amadu Baldé (Demo)", modeloVeiculo: "Toyota Corolla Azul/Branco", placaVeiculo: "GB-204-TX", telefone: "+245955000101", origem: "Demo" },
      { nomeCompleto: "Mamadú Djaló (Demo)", modeloVeiculo: "Mercedes 190 Azul/Branco", placaVeiculo: "GB-512-TX", telefone: "+245955000102", origem: "Demo" }
    ],
    PRIVADO: [
      { nomeCompleto: "Fátima Djassi (Demo)", modeloVeiculo: "Hyundai i10 Cinza", placaVeiculo: "GB-819-PR", telefone: "+245955000202", origem: "Demo" },
      { nomeCompleto: "Carlos Mendes (Demo)", modeloVeiculo: "Toyota Yaris Branco", placaVeiculo: "GB-630-PR", telefone: "+245955000203", origem: "Demo" }
    ],
    MOTO: [
      { nomeCompleto: "Braima Camará (Demo)", modeloVeiculo: "Haojue 125cc Vermelha", placaVeiculo: "GB-441-MT", telefone: "+245955000303", origem: "Demo" },
      { nomeCompleto: "Suleimane Embaló (Demo)", modeloVeiculo: "Sanlg 125cc Preta", placaVeiculo: "GB-778-MT", telefone: "+245955000304", origem: "Demo" }
    ]
  };

  let rotaAtual = TODAS_ROTAS[0];
  let veiculoAtual = VEICULOS[0];
  let metodoAtual = "Orange Money";
  let listaMotoristasDisponiveis = [];
  let indiceMotoristaAtual = 0;
  let motoristaAtribuido = null;
  let avisoTrocaMotorista = "";
  let mensagemRapida = "Olá! Estou no ponto de referência em Bissau.";
  let faseViagem = "IDLE";
  let timerCrono = null;
  let timerEtapa1 = null;
  let timerEtapa2 = null;
  let segundos = 0;

  function calcularPrecoXOF() {
    return Math.round(rotaAtual.baseXOF * veiculoAtual.mult);
  }

  function limparTimers() {
    if (timerCrono) clearInterval(timerCrono);
    if (timerEtapa1) clearTimeout(timerEtapa1);
    if (timerEtapa2) clearTimeout(timerEtapa2);
    timerCrono = null;
    timerEtapa1 = null;
    timerEtapa2 = null;
  }

  function formatarTempo(seg) {
    const mm = String(Math.floor(seg / 60)).padStart(2, "0");
    const ss = String(seg % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function normalizarMotoristaLinha(row) {
    if (!row || typeof row !== "object") return null;
    return {
      nomeCompleto: String(row.nome_completo || row.nome || row.full_name || "Condutor Registado").trim(),
      modeloVeiculo: String(row.modelo_veiculo || row.modelo_carro || row.modelo || "Veículo Registado").trim(),
      placaVeiculo: String(row.placa_veiculo || row.matricula || row.placa || "Sem matrícula").trim(),
      telefone: String(row.telefone || row.phone || "").trim(),
      origem: "Supabase"
    };
  }

  async function carregarListaMotoristas(tipoVeiculoId) {
    const listaDemo = MOTORISTAS_DEMO_POR_TIPO[tipoVeiculoId] || MOTORISTAS_DEMO_POR_TIPO.TAXI;
    try {
      const client = window.supabaseClient || window.sb || (window.supabase && typeof window.supabase.from === "function" ? window.supabase : null);
      if (client && typeof client.from === "function") {
        const { data, error } = await client.from("motoristas").select("*").limit(50);
        if (!error && Array.isArray(data) && data.length > 0) {
          const filtrados = data.filter((m) => {
            const dispOk = m.disponivel === undefined || m.disponivel === null || m.disponivel === true;
            const aprovOk = m.aprovado === undefined || m.aprovado === null || m.aprovado === true;
            const serv = String(m.tipo_servico || m.tipo_veiculo || m.categoria || "").toUpperCase();
            if (!dispOk || !aprovOk) return false;
            if (!serv) return true;
            if (tipoVeiculoId === "MOTO") return serv.includes("MOTO");
            if (tipoVeiculoId === "PRIVADO") return serv.includes("PRIV") || serv.includes("CARRO");
            return serv.includes("TAXI") && !serv.includes("MOTO");
          });
          const base = filtrados.length > 0 ? filtrados : data;
          const normalizados = base.map(normalizarMotoristaLinha).filter(Boolean);
          if (normalizados.length > 0) return normalizados;
        }
      }
    } catch (_) {}
    return listaDemo;
  }

  function iniciarSequenciaEtapas(container) {
    limparTimers();
    faseViagem = "PROCURANDO";
    segundos = 0;
    renderizarPainel(container);

    timerCrono = setInterval(() => {
      segundos += 1;
      const elCrono = container.querySelector("#cronometro-viagem-v11");
      if (elCrono) elCrono.textContent = formatarTempo(segundos);
    }, 1000);

    timerEtapa1 = setTimeout(() => {
      if (faseViagem === "PROCURANDO") {
        faseViagem = "ENCONTRADO";
        renderizarPainel(container);
        timerEtapa2 = setTimeout(() => {
          if (faseViagem === "ENCONTRADO") {
            faseViagem = "EM_CURSO";
            renderizarPainel(container);
          }
        }, 4500);
      }
    }, 3000);
  }

  function refrescarMapaBissau() {
    [window.map, window.mapa, window.mapaBissau, window.leafletMap].forEach((m) => {
      if (m && typeof m.invalidateSize === "function") setTimeout(() => m.invalidateSize(), 120);
    });
    document.querySelectorAll("[id*='map'], [class*='map'], .leaflet-container").forEach((el) => {
      if (el.id === "superapp-painel-viagem") return;
      const cs = window.getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") {
        el.style.display = "block";
        el.style.visibility = "visible";
      }
      if (el.clientHeight < 220) el.style.minHeight = "260px";
    });
  }

  function renderizarOpcoesRotas() {
    return GRUPOS_ROTAS_DGVTT.map(
      (grupo) => `
        <optgroup label="${grupo.grupo}">
          ${grupo.rotas.map((r) => `<option value="${r.baseXOF}" data-rota="${r.nome.replace(/"/g, "&quot;")}" ${r.nome === rotaAtual.nome ? "selected" : ""}>${r.nome} (${r.baseXOF} XOF)</option>`).join("")}
        </optgroup>
      `
    ).join("");
  }

  function renderizarCamposPagamento() {
    if (metodoAtual === "Dinheiro Vivo") {
      return `
        <div style="margin-bottom:12px;padding:12px;border-radius:12px;background:#f0fdf4;border:1px solid #86efac;">
          <div style="font-size:13px;font-weight:700;color:#166534;margin-bottom:4px;">💵 Pagamento em Dinheiro Vivo ao condutor</div>
          <div style="font-size:12px;color:#374151;">Não precisa de número de conta nem cartão. O valor final será pago em dinheiro vivo (XOF) diretamente ao condutor.</div>
        </div>
      `;
    }
    if (metodoAtual === "Cartão") {
      return `
        <div style="margin-bottom:12px;padding:12px;border-radius:12px;background:#f8fafc;border:1px solid #cbd5e1;">
          <label style="display:block;font-size:12px;font-weight:700;color:#1e293b;margin-bottom:6px;">Número do cartão (16 dígitos)</label>
          <input id="input-cartao-numero-v11" type="text" inputmode="numeric" maxlength="19" placeholder="0000 0000 0000 0000" style="width:100%;padding:11px;border-radius:10px;border:1px solid #cbd5e1;font-size:14px;letter-spacing:1px;margin-bottom:10px;box-sizing:border-box;background:#fff;" />
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div>
              <label style="display:block;font-size:11px;font-weight:700;color:#334155;margin-bottom:4px;">Validade (MM/AA)</label>
              <input id="input-cartao-validade-v11" type="text" inputmode="numeric" maxlength="5" placeholder="MM/AA" style="width:100%;padding:10px;border-radius:10px;border:1px solid #cbd5e1;font-size:13px;box-sizing:border-box;background:#fff;" />
            </div>
            <div>
              <label style="display:block;font-size:11px;font-weight:700;color:#334155;margin-bottom:4px;">Código secreto (3 dígitos)</label>
              <input id="input-cartao-cvv-v11" type="password" inputmode="numeric" maxlength="3" placeholder="123" style="width:100%;padding:10px;border-radius:10px;border:1px solid #cbd5e1;font-size:13px;box-sizing:border-box;background:#fff;" />
            </div>
          </div>
          <div id="aviso-cartao-v11" style="font-size:11px;color:#b45309;margin-top:8px;">Modo Demonstração: simulação local de cartão (não introduza dados reais).</div>
        </div>
      `;
    }
    return `<input id="input-tel-v11" type="tel" placeholder="+245 955..." style="width:100%;padding:11px;border-radius:10px;border:1px solid #d1d5db;font-size:13px;margin-bottom:12px;box-sizing:border-box;" />`;
  }

  function renderizarCartaoMotorista() {
    const fallback = (MOTORISTAS_DEMO_POR_TIPO[veiculoAtual.id] || MOTORISTAS_DEMO_POR_TIPO.TAXI)[0];
    const mot = motoristaAtribuido || fallback;
    const totalDisponiveis = listaMotoristasDisponiveis.length || 1;
    const telLimpo = (mot.telefone || "").replace(/[^\d+]/g, "");
    const telDigitos = (mot.telefone || "").replace(/\D/g, "");
    const textoMsg = encodeURIComponent(`Olá ${mot.nomeCompleto}, estou na rota ${rotaAtual.nome} (${veiculoAtual.nome}). ${mensagemRapida}`);

    return `
      <div style="margin-top:12px;margin-bottom:12px;padding:12px;border-radius:12px;background:#ffffff;border:1px solid #d1d5db;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:6px;">
          <span style="font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;">Dados do Motorista (${mot.origem} · ${indiceMotoristaAtual + 1}/${totalDisponiveis})</span>
          <span style="font-size:11px;font-weight:700;color:#111827;background:#f3f4f6;padding:2px 8px;border-radius:999px;">${mot.placaVeiculo}</span>
        </div>
        <div style="font-size:15px;font-weight:800;color:#111827;">${mot.nomeCompleto}</div>
        <div style="font-size:13px;color:#374151;margin-top:2px;"><strong>Veículo:</strong> ${mot.modeloVeiculo} · <strong>Matrícula:</strong> ${mot.placaVeiculo}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px;"><strong>Telefone:</strong> ${mot.telefone || "Não informado"}</div>

        <div style="margin-top:10px;">
          <label style="display:block;font-size:11px;font-weight:700;color:#374151;margin-bottom:4px;">Mensagem caso o motorista atrase ou não encontre si:</label>
          <input id="input-msg-motorista-v11" type="text" value="${mensagemRapida.replace(/"/g, "&quot;")}" style="width:100%;padding:9px;border-radius:9px;border:1px solid #d1d5db;font-size:12px;box-sizing:border-box;margin-bottom:8px;" />
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px;">
            <a href="${telLimpo ? `tel:${telLimpo}` : "javascript:void(0)"}" style="text-align:center;text-decoration:none;padding:9px 6px;border-radius:9px;background:#16a34a;color:#fff;font-size:12px;font-weight:700;">📞 Ligar</a>
            <a id="link-wa-v11" href="${telDigitos ? `https://wa.me/${telDigitos}?text=${textoMsg}` : "https://wa.me/?text=" + textoMsg}" target="_blank" rel="noopener noreferrer" style="text-align:center;text-decoration:none;padding:9px 6px;border-radius:9px;background:#0f766e;color:#fff;font-size:12px;font-weight:700;">💬 WhatsApp</a>
            <a id="link-sms-v11" href="${telLimpo ? `sms:${telLimpo}?body=${textoMsg}` : "javascript:void(0)"}" style="text-align:center;text-decoration:none;padding:9px 6px;border-radius:9px;background:#2563eb;color:#fff;font-size:12px;font-weight:700;">✉️ SMS</a>
          </div>
          <button type="button" id="btn-trocar-motorista-v11" style="width:100%;padding:9px;border-radius:9px;border:1px solid #d97706;background:#fffbeb;color:#92400e;font-size:12px;font-weight:700;cursor:pointer;">🔄 Motorista demorou ou não atende? Tentar outro disponível</button>
          ${avisoTrocaMotorista ? `<div style="font-size:11px;color:#b45309;margin-top:6px;">${avisoTrocaMotorista}</div>` : ""}
        </div>
      </div>
    `;
  }

  function renderizarBlocoEstado(preco) {
    if (faseViagem === "PROCURANDO" || faseViagem === "ENCONTRADO" || faseViagem === "EM_CURSO") {
      const fallback = (MOTORISTAS_DEMO_POR_TIPO[veiculoAtual.id] || MOTORISTAS_DEMO_POR_TIPO.TAXI)[0];
      const mot = motoristaAtribuido || fallback;
      const titulo = faseViagem === "PROCURANDO" ? `A procurar ${veiculoAtual.nome} disponível em Bissau...` : faseViagem === "ENCONTRADO" ? `Motorista encontrado: ${mot.nomeCompleto} (${mot.placaVeiculo}) · A caminho...` : `Viagem em curso com ${mot.nomeCompleto} (${veiculoAtual.nome})`;
      const fundo = faseViagem === "EM_CURSO" ? "#ecfdf5" : "#fffbeb";
      const borda = faseViagem === "EM_CURSO" ? "#10b981" : "#f59e0b";

      return `
        <div style="margin-top:16px;padding:16px;border-radius:12px;background:${fundo};border:1.5px solid ${borda};">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:#92400e;margin-bottom:6px;">Modo Demonstração / Parcerias em Ativação</div>
          <div style="font-size:16px;font-weight:800;color:#111827;margin-bottom:6px;">${titulo}</div>
          <div style="font-size:13px;color:#374151;margin-bottom:8px;"><strong>Valor:</strong> ${preco} XOF (${veiculoAtual.rotulo} · ${metodoAtual}) · <strong>Rota:</strong> ${rotaAtual.nome}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:12px;margin-bottom:10px;">
            <span style="padding:4px 8px;border-radius:999px;background:#fef3c7;font-weight:700;">1. A procurar motorista</span>
            <span style="padding:4px 8px;border-radius:999px;background:${faseViagem !== "PROCURANDO" ? "#d1fae5" : "#f3f4f6"};font-weight:700;">2. A caminho</span>
            <span style="padding:4px 8px;border-radius:999px;background:${faseViagem === "EM_CURSO" ? "#d1fae5" : "#f3f4f6"};font-weight:700;">3. Viagem em curso</span>
          </div>
          ${faseViagem !== "PROCURANDO" ? renderizarCartaoMotorista() : ""}
          <div id="cronometro-viagem-v11" style="font-size:22px;font-weight:800;color:#b45309;margin-bottom:12px;">${formatarTempo(segundos)}</div>
          <button type="button" id="btn-cancelar-v11" style="width:100%;padding:12px;border:none;border-radius:10px;background:#dc2626;color:#fff;font-weight:700;font-size:14px;cursor:pointer;">Cancelar Viagem &amp; Reembolso Imediato (Modo Demo)</button>
          <div style="font-size:11px;color:#6b7280;margin-top:8px;">Regra de reembolso: cancelamento antes da chegada ou sem motorista disponível devolve 100% do valor simulado sem taxa.</div>
        </div>
      `;
    }
    if (faseViagem === "CANCELADA") {
      return `<div style="margin-top:16px;padding:14px;border-radius:12px;background:#fef2f2;border:1px solid #fca5a5;color:#991b1b;font-size:14px;"><strong>Viagem cancelada.</strong> Nenhum valor real foi cobrado (Modo Demonstração). Pode escolher outro veículo ou rota acima.</div>`;
    }
    return "";
  }

  function renderizarPainel(container) {
    const preco = calcularPrecoXOF();
    const comissaoEstimada = Math.round(preco * 0.1);

    window.__veiculoSelecionado = { nome: veiculoAtual.nome, tipo: veiculoAtual.rotulo, precoXOF: preco };

    container.innerHTML = `
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,0.04);">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
          <span style="font-size:12px;font-weight:700;color:#065f46;background:#d1fae5;padding:4px 10px;border-radius:999px;">3 PASSOS RÁPIDOS · ROTA OFICIAL DGVTT BISSAU</span>
          <span style="font-size:11px;font-weight:700;color:#92400e;background:#fef3c7;padding:4px 10px;border-radius:999px;">Modo Demonstração / Parcerias em Ativação</span>
        </div>

        <label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">1. Escolha para onde quer ir e o ponto de referência</label>
        <select id="select-rota-v11" style="width:100%;padding:11px;border-radius:10px;border:1px solid #d1d5db;font-size:14px;margin-bottom:10px;background:#fff;">${renderizarOpcoesRotas()}</select>
        <input id="input-ref-v11" type="text" placeholder="Ponto de referência (ex: Perto do Mercado, portão...)" style="width:100%;padding:11px;border-radius:10px;border:1px solid #d1d5db;font-size:14px;margin-bottom:14px;box-sizing:border-box;" />

        <label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">2. Escolha o veículo (preço final do veículo selecionado)</label>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">
          ${VEICULOS.map((v) => {
            const ativo = v.id === veiculoAtual.id;
            const p = Math.round(rotaAtual.baseXOF * v.mult);
            return `
              <button type="button" data-veiculo-v11="${v.id}" style="padding:12px 8px;border-radius:12px;cursor:pointer;text-align:center;border:${ativo ? "2px solid #16a34a" : "1px solid #d1d5db"};background:${ativo ? "#f0fdf4" : "#ffffff"};">
                <div style="font-size:18px;">${v.emoji}</div>
                <div style="font-size:12px;font-weight:700;color:#111827;margin-top:2px;">${v.nome}</div>
                <div style="font-size:15px;font-weight:800;color:#111827;margin-top:4px;">${p} XOF</div>
              </button>
            `;
          }).join("")}
        </div>

        <div style="padding:12px;border-radius:12px;background:#f9fafb;border:1px solid #e5e7eb;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;color:#111827;">
            <span>Total (${veiculoAtual.nome}):</span>
            <span style="color:#15803d;font-size:17px;">${preco} XOF</span>
          </div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px;">Rota base: ${rotaAtual.nome} (${rotaAtual.baseXOF} XOF) · Comissão estimada da plataforma: ~${comissaoEstimada} XOF.</div>
        </div>

        <label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">3. Método e dados para confirmar o pedido</label>
        <select id="select-metodo-v11" style="width:100%;padding:11px;border-radius:10px;border:1px solid #d1d5db;font-size:13px;margin-bottom:10px;background:#fff;">
          ${METODOS_PAGAMENTO.map((m) => `<option value="${m}" ${metodoAtual === m ? "selected" : ""}>${m}</option>`).join("")}
        </select>

        ${renderizarCamposPagamento()}

        <button type="button" id="btn-pedir-v11" style="width:100%;padding:14px;border:none;border-radius:12px;background:#16a34a;color:#ffffff;font-weight:800;font-size:15px;cursor:pointer;">Pedir ${veiculoAtual.nome} · ${preco} XOF</button>

        ${renderizarBlocoEstado(preco)}
      </div>
    `;

    const selRota = container.querySelector("#select-rota-v11");
    if (selRota) {
      selRota.addEventListener("change", () => {
        const opt = selRota.options[selRota.selectedIndex];
        rotaAtual = TODAS_ROTAS.find((r) => r.nome === opt?.getAttribute("data-rota")) || TODAS_ROTAS[0];
        renderizarPainel(container);
      });
    }

    container.querySelectorAll("[data-veiculo-v11]").forEach((btn) => {
      btn.addEventListener("click", () => {
        veiculoAtual = VEICULOS.find((v) => v.id === btn.getAttribute("data-veiculo-v11")) || VEICULOS[0];
        renderizarPainel(container);
      });
    });

    const selMetodo = container.querySelector("#select-metodo-v11");
    if (selMetodo) {
      selMetodo.addEventListener("change", () => {
        metodoAtual = selMetodo.value || "Orange Money";
        renderizarPainel(container);
      });
    }

    const inputNumCartao = container.querySelector("#input-cartao-numero-v11");
    if (inputNumCartao) {
      inputNumCartao.addEventListener("input", () => {
        const digitos = inputNumCartao.value.replace(/\D/g, "").slice(0, 16);
        inputNumCartao.value = digitos.replace(/(\d{4})(?=\d)/g, "$1 ");
      });
    }

    const inputValidade = container.querySelector("#input-cartao-validade-v11");
    if (inputValidade) {
      inputValidade.addEventListener("input", () => {
        const digitos = inputValidade.value.replace(/\D/g, "").slice(0, 4);
        inputValidade.value = digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
      });
    }

    const inputCvv = container.querySelector("#input-cartao-cvv-v11");
    if (inputCvv) {
      inputCvv.addEventListener("input", () => {
        inputCvv.value = inputCvv.value.replace(/\D/g, "").slice(0, 3);
      });
    }

    const inputMsg = container.querySelector("#input-msg-motorista-v11");
    if (inputMsg) {
      inputMsg.addEventListener("input", () => {
        mensagemRapida = inputMsg.value;
        const fallback = (MOTORISTAS_DEMO_POR_TIPO[veiculoAtual.id] || MOTORISTAS_DEMO_POR_TIPO.TAXI)[0];
        const mot = motoristaAtribuido || fallback;
        const telDigitos = (mot.telefone || "").replace(/\D/g, "");
        const telLimpo = (mot.telefone || "").replace(/[^\d+]/g, "");
        const textoEncoded = encodeURIComponent(`Olá ${mot.nomeCompleto}, estou na rota ${rotaAtual.nome} (${veiculoAtual.nome}). ${mensagemRapida}`);
        const wa = container.querySelector("#link-wa-v11");
        const sms = container.querySelector("#link-sms-v11");
        if (wa) wa.href = telDigitos ? `https://wa.me/${telDigitos}?text=${textoEncoded}` : "https://wa.me/?text=" + textoEncoded;
        if (sms && telLimpo) sms.href = `sms:${telLimpo}?body=${textoEncoded}`;
      });
    }

    const btnTrocar = container.querySelector("#btn-trocar-motorista-v11");
    if (btnTrocar) {
      btnTrocar.addEventListener("click", () => {
        if (!listaMotoristasDisponiveis.length) return;
        if (listaMotoristasDisponiveis.length === 1) {
          avisoTrocaMotorista = "Só existe 1 motorista disponível nesta categoria neste momento.";
          renderizarPainel(container);
          return;
        }
        indiceMotoristaAtual = (indiceMotoristaAtual + 1) % listaMotoristasDisponiveis.length;
        motoristaAtribuido = listaMotoristasDisponiveis[indiceMotoristaAtual];
        avisoTrocaMotorista = `Novo motorista solicitado (${indiceMotoristaAtual + 1} de ${listaMotoristasDisponiveis.length}).`;
        iniciarSequenciaEtapas(container);
      });
    }

    const btnPedir = container.querySelector("#btn-pedir-v11");
    if (btnPedir) {
      btnPedir.addEventListener("click", async () => {
        let referenciaCliente = (container.querySelector("#input-tel-v11")?.value || "").trim();

        if (metodoAtual === "Dinheiro Vivo") {
          referenciaCliente = "Dinheiro Vivo ao condutor";
        } else if (metodoAtual === "Cartão") {
          const numLimpo = (container.querySelector("#input-cartao-numero-v11")?.value || "").replace(/\D/g, "");
          const cvvLimpo = (container.querySelector("#input-cartao-cvv-v11")?.value || "").replace(/\D/g, "");
          const aviso = container.querySelector("#aviso-cartao-v11");

          if (numLimpo.length !== 16 || cvvLimpo.length !== 3) {
            if (aviso) {
              aviso.style.color = "#dc2626";
              aviso.textContent = "Preencha os 16 dígitos do cartão e o código secreto de 3 dígitos (CVV).";
            }
            return;
          }
          referenciaCliente = `Cartão **** ${numLimpo.slice(-4)}`;
        }

        avisoTrocaMotorista = "";
        listaMotoristasDisponiveis = await carregarListaMotoristas(veiculoAtual.id);
        indiceMotoristaAtual = 0;
        motoristaAtribuido = listaMotoristasDisponiveis[0];

        const ref = (container.querySelector("#input-ref-v11")?.value || "").trim();
        const valor = calcularPrecoXOF();

        if (typeof window.iniciarPagamentoComComissao === "function") {
          window.iniciarPagamentoComComissao({
            categoria: "mobilidade",
            servico: veiculoAtual.nome,
            clienteNome: "Cliente App Bissau",
            clienteEmail: "",
            clienteTelefone: referenciaCliente || "+245000000000",
            detalhes: `${rotaAtual.nome}${ref ? " (" + ref + ")" : ""}`,
            valorBaseXOF: valor,
            metodoPagamento: `${metodoAtual} [DEMO]`
          }).catch(() => {});
        }

        iniciarSequenciaEtapas(container);
      });
    }

    const btnCancelar = container.querySelector("#btn-cancelar-v11");
    if (btnCancelar) {
      btnCancelar.addEventListener("click", () => {
        limparTimers();
        faseViagem = "CANCELADA";
        renderizarPainel(container);
      });
    }
  }

  function montarPainel() {
    refrescarMapaBissau();
    const existente = document.getElementById("superapp-painel-viagem");
    if (existente) return;

    const botaoAntigo = Array.from(document.querySelectorAll("button")).find((b) =>
      /pagar\s*&\s*pedir\s*viagem|pedir\s*viagem/i.test(b.textContent || "")
    );
    if (!botaoAntigo) return;

    let alvo = botaoAntigo.parentElement;
    for (let i = 0; i < 6 && alvo && alvo.parentElement; i++) {
      const txt = alvo.textContent || "";
      if (/t[áa]xi\s*oficial/i.test(txt) && /moto-?t[áa]xi/i.test(txt) && /rota/i.test(txt)) {
        break;
      }
      alvo = alvo.parentElement;
    }

    if (!alvo || !alvo.parentElement) return;

    const painel = document.createElement("div");
    painel.id = "superapp-painel-viagem";
    alvo.parentElement.insertBefore(painel, alvo);
    alvo.style.display = "none";

    renderizarPainel(painel);
  }

  // =========================================================================
  // 4. INICIALIZAÇÃO CONJUNTA (MOBILIDADE + CONDUTOR + FARMÁCIAS)
  // =========================================================================
  function executarTudo() {
    atualizarPainelCondutor();
    montarPainel();
    modernizarModalFarmacias();
  }

  window.addEventListener("load", () => {
    setTimeout(executarTudo, 300);
    setTimeout(refrescarMapaBissau, 600);
  });

  document.addEventListener("click", () => {
    setTimeout(executarTudo, 150);
  });

  setTimeout(executarTudo, 350);
})();
