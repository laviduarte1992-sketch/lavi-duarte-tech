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
  let dadosVooSelecionado = {
    dataISO: "",
    dataTexto: "",
    precoXOF: 0,
    tipo: "Só Ida",
    passageiros: 1,
    destino: "Lisboa",
    companhia: "TAP Air Portugal"
  };

  function obterEstadoVooAtual() {
    const destinoEl = document.getElementById("vooDestinoInput");
    const idaEl = document.getElementById("dataIda");
    const passEl = document.getElementById("vooPassageiros");
    const radioSel = document.querySelector('input[name="tipoViagemBooking"]:checked');
    const lista = (typeof voosDatasets !== "undefined" && Array.isArray(voosDatasets)) ? voosDatasets : [];
    const idx = (typeof currentVooIndex === "number") ? currentVooIndex : 0;
    const itemAtual = lista[idx] || { text: "TAP Air Portugal" };

    const companhia = (itemAtual.text.split("(")[0] || "Companhia Aérea").trim();
    const destino = (destinoEl?.value || "").trim() || "Lisboa";
    const tipo = radioSel ? radioSel.value : "Só Ida";
    const matchPass = (passEl?.value || "").match(/(\d+)/);
    const passageiros = matchPass ? Math.max(1, parseInt(matchPass[1], 10)) : 1;

    const botaoAtivo = document.querySelector('#voosDiasPrecosAuto button[data-data-voo][style*="rgb(230, 240, 255)"]');
    const dataISO = botaoAtivo?.getAttribute("data-data-voo") || idaEl?.value || "";
    const precoAttr = Number(botaoAtivo?.getAttribute("data-preco-voo") || 0);
    const precoXOF = precoAttr || Number(window.precoVooCalculado || 0);

    let dataTexto = dataISO;
    if (dataISO) {
      const d = new Date(dataISO + "T00:00:00");
      if (!isNaN(d.getTime())) {
        dataTexto = d.toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
      }
    }

    dadosVooSelecionado = {
      dataISO,
      dataTexto: dataTexto || "A definir",
      precoXOF,
      tipo,
      passageiros,
      destino,
      companhia
    };

    return dadosVooSelecionado;
  }

  function gerarCodigoReserva() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let codigo = "OXB";
    for (let i = 0; i < 5; i++) {
      codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codigo;
  }

  function mostrarBilheteEletronico(passageiro) {
    const modal = document.getElementById("voosModal");
    if (!modal) return;

    const voo = obterEstadoVooAtual();
    const pnr = gerarCodigoReserva();
    const valorFormatado = `${Number(voo.precoXOF || 0).toLocaleString("pt-PT")} XOF`;

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

    const assunto = encodeURIComponent(`Bilhete Eletrónico (${pnr}) - Bissau -> ${voo.destino}`);
    const corpo = encodeURIComponent(
`BILHETE ELETRÓNICO (E-TICKET)
Código de Reserva: ${pnr}
Passageiro: ${passageiro.nome}
Telefone: ${passageiro.telefone}
E-mail: ${passageiro.email}

Companhia: ${voo.companhia}
Rota: Bissau (OXB) -> ${voo.destino}
Tipo de Viagem: ${voo.tipo}
Data de Ida: ${voo.dataTexto}
Passageiros: ${voo.passageiros}
Total Estimado: ${valorFormatado}`
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
        <div><strong>Rota:</strong> Bissau (OXB) → ${voo.destino} (${voo.tipo})</div>
        <div><strong>Data de Ida:</strong> ${voo.dataTexto} | <strong>Passageiros:</strong> ${voo.passageiros}</div>
        <div style="margin-top:4px; font-size:13px; color:#007a33;"><strong>Valor:</strong> ${valorFormatado}</div>
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
        ">✉️ Enviar para ${passageiro.email}</a>

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
            <p><strong>Rota:</strong> Bissau (OXB) → ${voo.destino} (${voo.tipo})</p>
            <p><strong>Data de Ida:</strong> ${voo.dataTexto}</p>
            <p><strong>Passageiros:</strong> ${voo.passageiros}</p>
            <p><strong>Total:</strong> ${valorFormatado}</p>
            <script>window.onload = function(){ window.print(); };<\/script>
          </body>
        </html>
      `);
      janela.document.close();
    });
  }

  function garantirFormularioPassageiro() {
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
        const voo = obterEstadoVooAtual();
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

        formBox.style.display = "block";
        formBox.innerHTML = `
          <div style="font-size:12px; font-weight:bold; margin-bottom:8px; color:#0f172a;">
            Dados do Passageiro — ${voo.dataTexto} (${Number(voo.precoXOF || 0).toLocaleString("pt-PT")} XOF)
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
          const nome = (document.getElementById("passNomeCompleto")?.value || "").trim();
          const email = (document.getElementById("passEmailBilhete")?.value || "").trim();
          const telefone = (document.getElementById("passTelefoneContacto")?.value || "").trim();

          if (!nome || !email || !telefone) {
            alert("Preencha o nome completo, o e-mail e o contacto para emitir o bilhete eletrónico.");
            return;
          }

          mostrarBilheteEletronico({ nome, email, telefone });
        });
      });
    }
  }

  setInterval(garantirFormularioPassageiro, 400);
})();
