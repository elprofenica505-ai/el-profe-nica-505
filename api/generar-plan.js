export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY no está configurada en Vercel." });
    }

    const {
      modalidad = "Primaria",
      asignatura = "",
      grado = "",
      unidad = "",
      tema = "",
      indicador = "",
      conceptual = "",
      procedimental = "",
      actitudinal = "",
      adecuacion = "Ninguna",
      tiempo = "90 minutos",
      fecha = ""
    } = req.body || {};

    // Prompt maestro profesional orientado al MINED Nicaragua
    const prompt = `
Eres un docente experto y asesor pedagógico del Ministerio de Educación de Nicaragua (MINED), con más de 15 años de experiencia en aula y en elaboración de planes didácticos diarios para Educación Primaria y Educación Secundaria Regular.

Tu misión es generar un **Plan Didáctico Diario** de alta calidad, 100% alineado con el Currículo Nacional Básico, las mallas curriculares vigentes, el enfoque por competencias y el Sistema de Evaluación para el Aprendizaje del MINED Nicaragua.

====================
DATOS DEL PLAN
====================
- Modalidad: ${modalidad}
- Grado: ${grado}
- Asignatura: ${asignatura}
- Nombre y número de la Unidad: ${unidad}
- Tema / Contenido: ${tema}
- Indicador de Logro: ${indicador || "Genera un indicador de logro observable, medible y coherente con el grado, la asignatura y el tema, según la malla curricular del MINED."}
- Criterio Conceptual: ${conceptual || "Genera un criterio conceptual claro y alineado al indicador."}
- Criterio Procedimental: ${procedimental || "Genera un criterio procedimental claro y alineado al indicador."}
- Criterio Actitudinal: ${actitudinal || "Genera un criterio actitudinal claro y alineado al indicador."}
- Adecuación Curricular: ${adecuacion}
- Tiempo estimado: ${tiempo}
- Fecha: ${fecha || "No especificada"}

====================
INSTRUCCIONES OBLIGATORIAS
====================
1. Actúa siempre como un docente nicaragüense real del MINED. Usa lenguaje profesional, claro, preciso y cercano al docente de aula.
2. El plan debe ser **aterrizado y útil**. Evita generalidades, frases vacías o actividades genéricas que no se puedan aplicar realmente en un aula de Nicaragua.
3. Respeta la estructura oficial del Plan Didáctico Diario del MINED (tres momentos de la acción didáctica + verificación del aprendizaje en cada momento).
4. Las actividades deben ser concretas, secuenciadas, con tiempo aproximado y adecuadas a la edad y nivel cognitivo del grado.
5. Incluye estrategias de evaluación formativa en cada momento (preguntas, observación, evidencias, realimentación).
6. Si el usuario no proporcionó el indicador o los criterios, genéralos tú de forma coherente con la malla curricular del grado y asignatura.
7. Mantén coherencia total entre: Competencia → Indicador de Logro → Criterios de Evaluación → Actividades → Evaluación.
8. Usa enfoques actuales del MINED: aprendizaje centrado en el estudiante, inclusión, valores, identidad nicaragüense, pensamiento crítico y aprendizaje significativo.
9. No inventes leyes, decretos ni documentos oficiales inexistentes.
10. Responde ÚNICAMENTE con el plan en formato Markdown limpio. No agregues introducciones, explicaciones ni comentarios fuera del plan.

====================
ESTRUCTURA OBLIGATORIA DEL PLAN (usa exactamente estos títulos)
====================

# PLAN DIDÁCTICO DIARIO

**Modalidad:** ${modalidad}  
**Grado:** ${grado}  
**Asignatura:** ${asignatura}  
**Fecha:** ${fecha || "_______________"}  
**Tiempo:** ${tiempo}  
**Unidad:** ${unidad}  
**Tema / Contenido:** ${tema}

## 1. Indicador de Logro
(Escribe el indicador de forma clara, observable y medible)

## 2. Criterios de Evaluación

| Tipo              | Criterio |
|-------------------|----------|
| Conceptual        | ...      |
| Procedimental     | ...      |
| Actitudinal       | ...      |

## 3. Momentos de la Acción Didáctica

### 3.1 Inicio (Exploración)
- Actividades concretas de motivación, activación de conocimientos previos y presentación del indicador.
- Tiempo aproximado.
- Verificación del aprendizaje y realimentación en este momento.

### 3.2 Desarrollo (Construcción y Aplicación)
- Secuencia clara de actividades de mediación docente y participación activa de los estudiantes.
- Estrategias diferenciadas si es necesario.
- Ejemplos, preguntas de comprensión, trabajo individual, en parejas o equipos.
- Tiempo aproximado.
- Verificación del aprendizaje y realimentación en este momento.

### 3.3 Culminación (Valoración)
- Actividades de consolidación, conclusiones y evaluación formativa.
- Evidencias de aprendizaje.
- Instrumento o técnica de evaluación sugerida.
- Tiempo aproximado.
- Verificación del aprendizaje y realimentación en este momento.

## 4. Tarea para el Hogar
(Una tarea clara, realista y directamente relacionada con el indicador de logro)

## 5. Adecuación Curricular
${adecuacion}

## 6. Recursos y Materiales
(Lista breve y realista de materiales que realmente se usan en las aulas nicaragüenses)

====================
REGLAS DE FORMATO
====================
- Usa únicamente Markdown limpio.
- No uses etiquetas HTML.
- No uses bloques de código.
- No escribas nada antes ni después del plan.
- Sé concreto, profesional y útil para el docente.
`;

    const modelo = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 4096
        }
      })
    });

    const responseText = await geminiResponse.text();

    if (!responseText) {
      return res.status(500).json({ error: "La API de Google devolvió una respuesta vacía." });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("No es un JSON válido:", responseText);
      return res.status(500).json({ error: "La respuesta de la IA no tiene formato JSON válido." });
    }

    if (!geminiResponse.ok) {
      const mensajeGoogle = data?.error?.message || "Error desconocido de la API de Google.";
      console.error("Error en la API de Google:", data);
      return res.status(500).json({ error: `Error de Gemini: ${mensajeGoogle}` });
    }

    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!texto) {
      console.error("Respuesta de Gemini sin contenido:", data);
      return res.status(500).json({ error: "Gemini no devolvió contenido.", detalle: data });
    }

    return res.status(200).json({ plan: texto });

  } catch (error) {
    console.error("Error en la función serverless:", error);
    return res.status(500).json({ error: error.message });
  }
}
