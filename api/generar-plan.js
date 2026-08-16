export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "MÃ©todo no permitido." });

  try {
    // La clave de Gemini se lee de las variables de entorno de Vercel.
    // NUNCA se escribe aquÃ­ directamente. Debes configurarla tÃº en:
    // Vercel > tu proyecto > Settings > Environment Variables > GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY no estÃ¡ configurada en Vercel (Settings > Environment Variables). Agrega tu clave real de Google AI Studio." });
    }

    const { asignatura, grado, unidad, contenido, indicador, conceptual, procedimental, actitudinal, adecuacion } = req.body || {};

    const prompt = `ActÃºa como asesor pedagÃ³gico del MINED Nicaragua. Genera un plan diario de primaria (4 momentos: ExploraciÃ³n, ConstrucciÃ³n, AplicaciÃ³n, ValoraciÃ³n). 
    Asignatura: ${asignatura}, Grado: ${grado}, Contenido: ${contenido}. 
    Indicador: ${indicador}. Criterios: ${conceptual}, ${procedimental}, ${actitudinal}. AdecuaciÃ³n: ${adecuacion}.
    Responde en HTML limpio.`;

    // Modelo econÃ³mico y con soporte a largo plazo (alias que Google actualiza automÃ¡ticamente).
    const modelo = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

    // Endpoint CORRECTO de la API de Gemini (antes apuntaba a una URL inexistente).
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      const mensajeGoogle = data?.error?.message || "Error desconocido de la API de Google.";
      console.error("Error en la API de Google:", data);
      return res.status(500).json({ error: `Error de Gemini: ${mensajeGoogle}` });
    }

    // La respuesta real de Gemini viene en candidates[0].content.parts[0].text
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!texto) {
      console.error("Respuesta de Gemini sin contenido:", data);
      const razon = data?.candidates?.[0]?.finishReason;
      return res.status(500).json({
        error: razon === "SAFETY"
          ? "Gemini bloqueÃ³ la respuesta por seguridad. Intenta con otro contenido."
          : "Gemini no devolviÃ³ contenido.",
        detalle: data
      });
    }

    return res.status(200).json({ plan: texto });

  } catch (error) {
    console.error("Error en la funciÃ³n serverless:", error);
    return res.status(500).json({ error: error.message });
  }
}
