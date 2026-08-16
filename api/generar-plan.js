export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const { asignatura, grado, unidad, contenido, indicador, conceptual, procedimental, actitudinal, adecuacion } = req.body || {};

    const prompt = `Actúa como asesor pedagógico del MINED Nicaragua. Genera un plan diario de primaria (4 momentos: Exploración, Construcción, Aplicación, Valoración). 
    Asignatura: ${asignatura}, Grado: ${grado}, Contenido: ${contenido}. 
    Indicador: ${indicador}. Criterios: ${conceptual}, ${procedimental}, ${actitudinal}. Adecuación: ${adecuacion}.
    Responde en HTML limpio.`;

    // CAMBIO CLAVE: Usamos la versión estable 'v1' y el modelo 'gemini-1.5-flash'
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(500).json({ error: "Error en la API de Google", detalle: data });
    }

    const plan = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ plan });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
