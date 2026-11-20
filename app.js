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
  function calcularBasePorDestinoTexto(destinoTexto) {
    const limpo = (destinoTexto || "Lisboa").trim().toLowerCase();
    if (!limpo) return 290000;

    // Tarifas base de referência (em XOF) — pensadas como referência de bilhete
    if (/dakar|senegal|banjul|gambia|conakry|guine|guiné|praia|cabo verde|abidjan|lome|lomé|accra|lagos|nigeria|nigéria|bamako|mali/.test(limpo)) {
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

    // Qualquer outro país ou cidade digitada: faixa equilibrada entre 150.000 e 310.000 XOF
    let hash = 0;
    for (let i = 0; i < limpo.length; i++) {
      hash = (hash * 31 + limpo.charCodeAt(i)) % 100000;
    }
    const variacao = (hash % 160) * 1000; // 0 a 159.000 XOF
    return 150000 + variacao;
  }

  function calcularPrecoParaData(baseDestino, dataObj, multiplicadorViagem, passageiros, fatorCompanhia) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const alvo = new Date(dataObj.getFullYear(), dataObj.getMonth(), dataObj.getDate());
    const diffDias = Math.round((alvo - hoje) / (1000 * 60 * 60 * 24));
    const diaSemana = alvo.getDay(); // 0=Dom ... 6=Sab

    // Ajuste moderado por antecedência
    let fatorAntecedencia = 1.0;
    if (diffDias <= 1) fatorAntecedencia = 1.14;
    else if (diffDias <= 3) fatorAntecedencia = 1.08;
    else if (diffDias <= 7) fatorAntecedencia = 1.04;
    else if (diffDias >= 21) fatorAntecedencia = 0.90;
    else if (diffDias >= 14) fatorAntecedencia = 0.95;

    // Variação por dia da semana (terça/quarta mais económicas; sexta/domingo um pouco mais altas)
    const fatoresDiaSemana = [1.05, 0.96, 0.93, 0.94, 0.98, 1.06, 1.03];
    const fatorSemana = fatoresDiaSemana[diaSemana] || 1.0;

    // Pequena diferença entre dias consecutivos
    const fatorDia = 0.97 + ((alvo.getDate() % 5) * 0.012);

    const bruto = baseDestino * fatorAntecedencia * fatorSemana * fatorDia * multiplicadorViagem * passageiros * fatorCompanhia;
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

  function renderizarSugestoesDias(destinoLabel, tipoLabel, baseDestino, dataBaseObj, multiplicadorViagem, passageiros, fatorCompanhia) {
    const modal = document.getElementById("voosModal");
    const destinoInput = document.getElementById("vooDestinoInput");
    const dataIdaInput = document.getElementById("dataIda");
    if (!modal || !destinoInput) return;

    let painelDias = document.getElementById("voosDiasPrecosAuto");
    if (!painelDias) {
      painelDias = document.createElement("div");
      painelDias.id = "voosDiasPrecosAuto";
      painelDias.style.cssText = "margin: 6px 0 10px; padding: 8px; border-radius: 10px; background: #f5f8fc; border: 1px solid #dce5f2;";
      destinoInput.parentNode.insertBefore(painelDias, destinoInput.nextSibling);
    }

    const offsets = [0, 1, 2, 3, 5, 7];
    const botoesHTML = offsets.map((offset) => {
      const d = new Date(dataBaseObj.getFullYear(), dataBaseObj.getMonth(), dataBaseObj.getDate() + offset);
      const precoDia = calcularPrecoParaData(baseDestino, d, multiplicadorViagem, passageiros, fatorCompanhia);
      const iso = formatarDataISO(d);
      const ativa = dataIdaInput && dataIdaInput.value === iso;

      return `
        <button type="button" data-data-voo="${iso}" style="
          flex: 1 1 30%;
          min-width: 92px;
          padding: 6px;
          border-radius: 8px;
          border: 1px solid ${ativa ? "#0066cc" : "#d0d7de"};
          background: ${ativa ? "#e6f0ff" : "#ffffff"};
          color: #111;
          font-size: 10px;
          cursor: pointer;
          text-align: center;
          line-height: 1.3;
        ">
          <div style="font-weight: bold;">${formatarDataCurta(d)}</div>
          <div style="color: #007a33; font-weight: bold;">${precoDia.toLocaleString("pt-PT")} XOF</div>
          <div style="color: #555; font-size: 9px;">${tipoLabel}</div>
        </button>
      `;
    }).join("");

    painelDias.innerHTML = `
      <div style="font-size: 10px; font-weight: bold; color: #333; margin-bottom: 6px;">
        Tarifas (${tipoLabel}) por dia — Bissau → ${destinoLabel}:
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        ${botoesHTML}
      </div>
    `;

    painelDias.querySelectorAll("button[data-data-voo]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const novaData = btn.getAttribute("data-data-voo");
        if (dataIdaInput && novaData) {
          dataIdaInput.value = novaData;
          dataIdaInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
        window.atualizarMotorVoosAutomatico();
      });
    });
  }

  window.atualizarMotorVoosAutomatico = function () {
    const destinoEl = document.getElementById("vooDestinoInput");
    const idaEl = document.getElementById("dataIda");
    const tipoEl = document.getElementById("vooTipo");
    const passEl = document.getElementById("vooPassageiros");
    const captionEl = document.getElementById("voosCaption");
    const phoneEl = document.getElementById("voosPhone");

    const lista = (typeof voosDatasets !== "undefined" && Array.isArray(voosDatasets)) ? voosDatasets : [];
    const idx = (typeof currentVooIndex === "number") ? currentVooIndex : 0;
    const itemAtual = lista[idx] || {
      text: "TAP Air Portugal (Bissau -> Lisboa)",
      phone: "Guichê Osvaldo Vieira: +245 955 100 200"
    };

    const companhia = (itemAtual.text.split("(")[0] || "Voo").trim();
    const destinoDigitado = (destinoEl?.value || "").trim();
    const destinoLabel = destinoDigitado || (itemAtual.text.match(/->\s*([^)]+)/)?.[1] || "Lisboa").trim();
    const rotaTexto = `Bissau -> ${destinoLabel}`;

    const baseDestino = calcularBasePorDestinoTexto(destinoLabel);

    let passageiros = 1;
    const matchPass = (passEl?.value || "").match(/(\d+)/);
    if (matchPass) {
      passageiros = Math.max(1, parseInt(matchPass[1], 10));
    }

    const tipoLower = (tipoEl?.value || "Ida e Volta").toLowerCase();
    const isSoIda = tipoLower.includes("só") || tipoLower.includes("so");
    const tipoLabel = isSoIda ? "Só Ida" : "Ida e Volta";
    const multiplicadorViagem = isSoIda ? 1.0 : 1.65;

    let fatorCompanhia = 1.0;
    const compLower = companhia.toLowerCase();
    if (compLower.includes("tap")) fatorCompanhia = 1.04;
    else if (compLower.includes("royal")) fatorCompanhia = 0.96;
    else if (compLower.includes("asky")) fatorCompanhia = 0.90;

    const dataBase = (idaEl && idaEl.value)
      ? new Date(idaEl.value + "T00:00:00")
      : new Date();

    const precoAtual = calcularPrecoParaData(baseDestino, dataBase, multiplicadorViagem, passageiros, fatorCompanhia);
    window.precoVooCalculado = precoAtual;

    if (captionEl) {
      captionEl.textContent = `${companhia} (${rotaTexto} • ${tipoLabel}) — ${precoAtual.toLocaleString("pt-PT")} XOF`;
    }
    if (phoneEl && itemAtual.phone) {
      phoneEl.textContent = itemAtual.phone;
    }

    renderizarSugestoesDias(destinoLabel, tipoLabel, baseDestino, dataBase, multiplicadorViagem, passageiros, fatorCompanhia);
    return precoAtual;
  };

  ["change", "input", "click"].forEach((ev) => {
    document.addEventListener(ev, (e) => {
      if (e.target && e.target.closest && e.target.closest("#voosModal")) {
        setTimeout(window.atualizarMotorVoosAutomatico, 10);
      }
    });
  });

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(window.atualizarMotorVoosAutomatico, 150);
  });
})();
