require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ✅ Servir archivos estáticos (public/index.html)
app.use(express.static("public"));

// 👉 TOKEN y STOREID (desde .env)
const PAYPHONE_TOKEN = process.env.PAYPHONE_TOKEN;
const STORE_ID = process.env.PAYPHONE_STOREID || "";

/**
 * 🔹 Configuración para el frontend
 * El index.html consume esta ruta para obtener token y storeId
 */
app.get("/config", (req, res) => {
  res.json({
    token: PAYPHONE_TOKEN || "",
    storeId: STORE_ID || "",
  });
});

/**
 * 🔹 URL de respuesta + confirmación (PayPhone → Servidor → PayPhone)
 */
app.get("/respuesta", async (req, res) => {
  const id = Number(req.query.id || 0);
  const clientTransactionId = String(req.query.clientTransactionId || "");

  if (!id || !clientTransactionId) {
    return res.status(400).send(`
      <h2>❌ Error</h2>
      <p>No llegaron los parámetros <b>id</b> y <b>clientTransactionId</b>.</p>
    `);
  }

  try {
    const confirm = await axios.post(
      "https://pay.payphonetodoesposible.com/api/button/V2/Confirm",
      { id, clientTxId: clientTransactionId },
      {
        headers: {
          Authorization: `Bearer ${PAYPHONE_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`
      <h2>✅ Pago confirmado</h2>
      <p><b>ID PayPhone:</b> ${id}</p>
      <p><b>clientTransactionId:</b> ${clientTransactionId}</p>
      <pre>${JSON.stringify(confirm.data, null, 2)}</pre>
    `);
  } catch (error) {
    res.status(500).send(`
      <h2>❌ Error al confirmar el pago</h2>
      <pre>${JSON.stringify(
        error.response?.data || error.message,
        null,
        2
      )}</pre>
    `);
  }
});

// 🔹 Levantar servidor
app.listen(3000, () => {
  console.log("✅ Servidor activo en http://localhost:3000");
});
