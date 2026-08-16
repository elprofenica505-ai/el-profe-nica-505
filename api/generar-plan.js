export default async function handler(req, res) {
  // Configuración CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Usa POST." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "No está configurada la variable GEMINI_API_KEY en Vercel." });
    }

    const { asignatura, grado, unidad, contenido, indicador, conceptual, procedimental, actitudinal, adecuacion } = req.body || {};

    const prompt = `Actúa como un asesor pedagógico experto del Ministerio de Educación de Nicaragua (MINED). 
    Genera un plan de clase diario de educación primaria estructurado estrictamente bajo el formato oficial de cuatro momentos metodológicos (Exploración, Construcción del Conocimiento, Aplicación y Valoración).
    
    Datos de entrada:
    - Asignatura: ${asignatura || 'No especificada'}
    - Grado: ${grado || 'No especificado'}
    - Unidad: ${unidad || 'No especificada'}
    - Contenido/Tema: ${contenido || 'No especificado'}
    - Indicador de logro: ${indicador || 'Autogenerado según el contenido'}
    - Criterios de evaluación -> Conceptual: ${conceptual || 'Autogenerado'}, Procedimental: ${procedimental || 'Autogenerado'}, Actitudinal: ${actitudinal || 'Autogenerado'}
    - Adecuación curricular: ${adecuacion || 'Ninguna'}

    Redacta el plan con un lenguaje profesional docente adecuado para Nicaragua, detallando las actividades pedagógicas claras para cada momento de la clase. Devuelve el resultado formateado en HTML limpio (con etiquetas h3, p, ul, li, strong) listo para mostrarse en pantalla.`;

    // Usamos el modelo vigente y estable actual
    const modelo = "gemini-2.0-flash";
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
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096
        }
      })
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Respuesta de Gemini:", data);
      return res.status(geminiResponse.status).json({
        error: data?.error?.message || "Gemini rechazó la solicitud."
      });
    }

    const plan = data?.candidates?.[0]?.content?.parts?.map((parte) => parte.text || "").join("").trim();

    if (!plan) {
      return res.status(502).json({ error: "Gemini no devolvió contenido." });
    }

    return res.status(200).json({ plan });

  } catch (error) {
    console.error("Error en la función serverless:", error);
    return res.status(500).json({ error: "Error interno del servidor.", detalle: error.message });
  }
}
