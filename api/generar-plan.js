export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY no está configurada en Vercel (Settings > Environment Variables)." });
    }

    const { asignatura, grado, unidad, contenido, indicador, conceptual, procedimental, actitudinal, adecuacion } = req.body || {};

    const prompt = `Actúa como asesor pedagógico del MINED Nicaragua. Genera un plan diario de primaria (4 momentos: Exploración, Construcción, Aplicación, Valoración). 
    Asignatura: ${asignatura}, Grado: ${grado}, Contenido: ${contenido}. 
    Indicador: ${indicador}. Criterios: ${conceptual}, ${procedimental}, ${actitudinal}. Adecuación: ${adecuacion}.
    Responde en HTML limpio.`;

    const modelo = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      const mensajeGoogle = data?.error?.message || "Error desconocido de la API de Google.";
      console.error("Error en la API de Google:", data);
      return res.status(500).json({ error: `Error de Gemini: ${mensajeGoogle}` });
    }

    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!texto) {
      console.error("Respuesta de Gemini sin contenido:", data);
      return res.status(500).json({ error: "Gemini no devolvió contenido (puede haber sido bloqueado por seguridad).", detalle: data });
    }

    return res.status(200).json({ plan: texto });

  } catch (error) {
    console.error("Error en la función serverless:", error);
    return res.status(500).json({ error: error.message });
  }
}
