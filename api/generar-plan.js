export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "MÃ©todo no permitido." });

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY no estÃ¡ configurada en Vercel (Settings > Environment Variables)." });
    }

    const { asignatura, grado, unidad, contenido, indicador, conceptual, procedimental, actitudinal, adecuacion } = req.body || {};

    const prompt = `ActÃºa como asesor pedagÃ³gico del MINED Nicaragua. Genera un plan diario de primaria (4 momentos: ExploraciÃ³n, ConstrucciÃ³n, AplicaciÃ³n, ValoraciÃ³n). 
    Asignatura: ${asignatura}, Grado: ${grado}, Contenido: ${contenido}. 
    Indicador: ${indicador}. Criterios: ${conceptual}, ${procedimental}, ${actitudinal}. AdecuaciÃ³n: ${adecuacion}.
    Responde en HTML limpio.`;

    // MODELO ECONÃ“MICO: "gemini-flash-lite-latest" es un alias que Google actualiza
    // automÃ¡ticamente al modelo Flash-Lite mÃ¡s reciente y barato disponible.
    // AsÃ­ evitamos que el modelo se "retire" de golpe como pasÃ³ con gemini-2.5-flash-lite
    // (que Google descontinÃºa el 16 de octubre de 2026).
    const modelo = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta2/interactions`;

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        model: modelo,
        input: prompt
      })
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      const mensajeGoogle = data?.error?.message || "Error desconocido de la API de Google.";
      console.error("Error en la API de Google:", data);
      return res.status(500).json({ error: `Error de Gemini: ${mensajeGoogle}` });
    }

    // La Interactions API devuelve un objeto "steps" en vez de "candidates".
    const pasoRespuesta = data?.steps?.find(step => step.type === "model_output");
    const texto = pasoRespuesta?.content?.find(c => c.type === "text")?.text;

    if (!texto) {
      console.error("Respuesta de Gemini sin contenido:", data);
      return res.status(500).json({ error: "Gemini no devolviÃ³ contenido (puede haber sido bloqueado por seguridad).", detalle: data });
    }

    return res.status(200).json({ plan: texto });

  } catch (error) {
    console.error("Error en la funciÃ³n serverless:", error);
    return res.status(500).json({ error: error.message });
  }
}
