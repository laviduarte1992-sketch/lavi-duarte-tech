// Ficheiro: api/webhook-pagamento.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    const referencia =
      req.body?.cpm_trans_id ||
      req.body?.transaction_id ||
      req.body?.referencia;

    if (!referencia) {
      return res.status(400).json({ erro: "Referência da transação não encontrada." });
    }

    const headers = {
      "Content-Type": "application/json",
      "apikey": process.env.SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
    };

    const refEncoded = encodeURIComponent(String(referencia));

    // 1. Atualiza na tabela reservas_voos (se a referência for de um voo)
    await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/reservas_voos?pnr=eq.${refEncoded}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status_pagamento: "PAGO",
          referencia_gateway: String(referencia)
        })
      }
    );

    // 2. Atualiza na tabela pagamentos_clientes (para os restantes botões/serviços)
    await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/pagamentos_clientes?referencia=eq.${refEncoded}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status_pagamento: "PAGO",
          referencia_gateway: String(referencia)
        })
      }
    );

    return res.status(200).json({ recebido: true, referencia });
  } catch (err) {
    return res.status(500).json({ erro: err.message || "Erro ao processar webhook." });
  }
}
