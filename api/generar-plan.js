export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Falta configurar la GEMINI_API_KEY en Vercel.' });
    }

    const { asignatura, grado, unidad, contenido, indicador, conceptual, procedimental, actitudinal, adecuacion } = req.body;

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

    // URL corregida a la versión v1 con el modelo gemini-1.5-flash soportado nativamente
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      throw new Error(data.error?.message || 'Error al comunicarse con la API de Gemini');
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar el contenido.';

    return res.status(200).json({ plan: text });

  } catch (error) {
    console.error("Error en la función serverless:", error);
    return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
}
