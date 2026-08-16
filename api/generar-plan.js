export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });

  intentar {
    const apiKey = process.env.GEMINI_API_KEY;

    si (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY no está configurado en Vercel (Configuración > Variables de entorno)." });
    }

    const { asignatura, grado, unidad, contenido, indicador, conceptual, procedimental, actitudinal, adecuacion } = req.body || {};

    const Prompt = `Actúa como asesor pedagógico del MINED Nicaragua. Genera un plan diario de primaria (4 momentos: Exploración, Construcción, Aplicación, Valoración).
    Asignatura: ${asignatura}, Grado: ${grado}, Contenido: ${contenido}.
    Indicador: ${indicador}. Criterios: ${conceptual}, ${procedimental}, ${actitudinal}. Adecuación: ${adecuación}.
    Responde en HTML limpio.`;

    // MODELO ECONÓMICO: "gemini-flash-lite-latest" es un alias que Google actualiza
    // automáticamente al modelo Flash-Lite más reciente y barato disponible.
    // AsÃ evitamos que el modelo se "retire" de golpe como pasó con gemini-2.5-flash-lite
    // (que Google descontinúa el 16 de octubre de 2026).
    const modelo = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta2/interactions`;

    const geminiResponse = await fetch(url, {
      método: "POST",
      encabezados: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      cuerpo: JSON.stringify({
        modelo: modelo,
        entrada: solicitud
      })
    });

    const data = await geminiResponse.json();

    si (!geminiResponse.ok) {
      const mensajeGoogle = datos?.error?.mensaje || "Error desconocido de la API de Google.";
      console.error("Error en la API de Google:", datos);
      return res.status(500).json({ error: `Error de Gemini: ${mensajeGoogle}` });
    }

    // La API de Interacciones devuelve un objeto "steps" en vez de "candidates".
    const pasoRespuesta = data?.steps?.find(step => step.type === "model_output");
    const texto = pasoRespuesta?.content?.find(c => c.type === "text")?.text;

    si (!texto) {
      console.error("Respuesta de Gemini sin contenido:", datos);
      return res.status(500).json({ error: "Gemini no devolvió contenido (puede haber sido bloqueado por seguridad).", detalle: data });
    }

    return res.status(200).json({ plan: texto });

  } catch (error) {
    console.error("Error en la función serverless:", error);
    return res.status(500).json({ error: error.message });
  }
}
