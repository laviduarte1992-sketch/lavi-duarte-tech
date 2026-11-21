// Ficheiro: api/criar-pagamento.js
function calcularComissaoPorCategoria(categoria, valorBaseXOF) {
  const base = Number(valorBaseXOF) || 0;
  const cat = (categoria || "geral").toLowerCase();

  let comissao = 0;

  if (cat === "voo") {
    comissao = Math.max(10000, Math.round((base * 0.08) / 1000) * 1000);
  } else if (cat === "mobilidade") {
    comissao = Math.max(500, Math.round((base * 0.12) / 100) * 100);
  } else if (cat === "alojamento") {
    comissao = Math.max(3000, Math.round((base * 0.12) / 1000) * 1000);
  } else if (cat === "entrega") {
    comissao = Math.max(500, Math.round((base * 0.15) / 100) * 100);
  } else if (cat === "recarga") {
    comissao = Math.max(100, Math.round((base * 0.03) / 50) * 50);
  } else {
    comissao = Math.round((base * 0.10) / 100) * 100;
  }

  return comissao;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    const {
      categoria,
      servico,
      clienteNome,
      clienteEmail,
      clienteTelefone,
      detalhes,
      valorBaseXOF,
      metodoPagamento
    } = req.body;

    const baseLimpa = Number(valorBaseXOF);
    if (!clienteNome || !clienteTelefone || !baseLimpa || baseLimpa <= 0) {
      return res.status(400).json({ erro: "Dados ou valor inválidos para iniciar o pagamento." });
    }

    const comissaoXOF = calcularComissaoPorCategoria(categoria, baseLimpa);
    const totalCobrarXOF = baseLimpa + comissaoXOF;
    const referencia = "APP" + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 1. Grava na tabela pagamentos_clientes no Supabase (com a sua comissão já calculada)
    const supaResp = await fetch(`${process.env.SUPABASE_URL}/rest/v1/pagamentos_clientes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        referencia,
        categoria: categoria || "geral",
        servico: servico || "Serviço do App",
        cliente_nome: clienteNome,
        cliente_email: clienteEmail || "",
        cliente_telefone: clienteTelefone,
        detalhes: detalhes || "",
        valor_base_xof: baseLimpa,
        comissao_xof: comissaoXOF,
        total_pago_xof: totalCobrarXOF,
        metodo_pagamento: metodoPagamento || "Mobile Money",
        status_pagamento: "PENDENTE"
      })
    });

    if (!supaResp.ok) {
      const erroTexto = await supaResp.text();
      throw new Error("Erro ao gravar no Supabase: " + erroTexto);
    }

    // 2. Quando tiver a Merchant Account / Gateway ativo, chama aqui a API real do gateway
    // e devolve paymentUrl para o cliente concluir o pagamento no telemóvel/cartão.
    return res.status(200).json({
      ok: true,
      modoSimulacao: !process.env.CINETPAY_API_KEY,
      referencia,
      categoria: categoria || "geral",
      servico: servico || "Serviço do App",
      valorBaseXOF: baseLimpa,
      comissaoXOF,
      totalCobrarXOF,
      paymentUrl: null
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message || "Erro interno no servidor." });
  }
}
