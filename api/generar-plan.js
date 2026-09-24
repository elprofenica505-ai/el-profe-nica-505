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
      instrumento = "Lista de cotejo",
      tiempo = "90 minutos",
      fecha = ""
    } = req.body || {};

    // Prompt maestro (version CONTENIDO REAL) orientado al MINED Nicaragua
    const prompt = `
Eres un docente experto y asesor pedagógico del Ministerio de Educación de Nicaragua (MINED), con más de 15 años de experiencia en aula y en elaboración de planes didácticos diarios para Educación Primaria y Secundaria.

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
- Adecuación Curricular: ${adecuacion || "No requiere adecuación específica (o adaptar según la necesidad)." }
- Instrumento de Evaluación solicitado: ${instrumento}
- Tiempo estimado: ${tiempo}
- Fecha: ${fecha || "No especificada"}

====================
INSTRUCCIONES OBLIGATORIAS DE CONTENIDO REAL
====================
1. PROHIBIDO USAR INSTRUCCIONES GENÉRICAS O VACÍAS:
   - NUNCA escribas: "El docente realiza preguntas de exploración", "El docente presenta una lectura", "El docente coloca ejercicios en la pizarra".
   - SIEMPRE escribe el contenido exacto:
     * Si hay preguntas, REDACTA las 3 o 4 preguntas literales con sus respuestas esperadas.
     * Si hay una lectura o caso, REDACTA la lectura completa (adaptada a la extensión de la clase).
     * Si hay ejercicios o problemas matemáticos, ESCRIBE los ejercicios completos con sus datos e incisos.
     * Si hay una dinámica o juego, EXPLICA paso a paso la regla del juego.

2. ADAPTACIÓN ESTRICTA AL GRADO Y ETAPA DEL MINED:
   - Adecúa el vocabulario, la extensión, el nivel de pensamiento (Bloom) y la metodología al grado exacto (${grado}):
     * 1.° y 2.° Grado (1.er Ciclo): Enfoque altamente ilustrativo, kinestésico, oraciones cortas, juego guiado, conciencia fonológica, silábica y manipulación de concreto.
     * 3.° y 4.° Grado (2.º Ciclo): Transición a la comprensión inferencial, redacción de párrafos cortos, operaciones combinadas básicas, trabajo en parejas.
     * 5.° y 6.° Grado (3.er Ciclo): Análisis, síntesis, redacción autónoma, resolución de problemas complejos, trabajo colaborativo.
     * Educación Secundaria: Pensamiento crítico, debate, investigación, análisis textual y formulación de hipótesis.

3. ACTITUD Y LENGUAJE:
   - Actúa como un docente nicaragüense real del MINED. Usa lenguaje pedagógico preciso, claro y de aplicación inmediata en el aula.

4. FORMATO DE ACTIVIDADES:
   - Cada actividad debe ir en una línea separada, empezando con un guion y espacio ("- ").
   - Nunca agrupes varias actividades en un solo párrafo.

5. COHERENCIA Y EVALUACIÓN:
   - Mantén coherencia total entre indicador, criterios, actividades e instrumento de evaluación.
   - El Instrumento de Evaluación debe ser una tabla Markdown funcional al final del plan, usando solo los 3 criterios (Conceptual, Procedimental y Actitudinal) con una sola fila por criterio.

6. RESTRICCIÓN DE SALIDA:
   - Responde ÚNICAMENTE con el plan didáctico y el instrumento. Sin intro ni despedidas.

====================
ESTRUCTURA OBLIGATORIA
====================
# PLAN DIDÁCTICO DIARIO
**Modalidad:** ${modalidad} | **Grado:** ${grado} | **Asignatura:** ${asignatura} | **Fecha:** ${fecha || "No especificada"} | **Tiempo:** ${tiempo}
**Unidad:** ${unidad}
**Tema:** ${tema}

## 1. Indicador de Logro
## 2. Criterios de Evaluación
| Tipo | Criterio de Evaluación |
| :--- | :--- |
| **Conceptual** | ${conceptual} |
| **Procedimental** | ${procedimental} |
| **Actitudinal** | ${actitudinal} |

## 3. Momentos de la Acción Didáctica
### 3.1 Inicio (Exploración)
(Actividades en líneas con guion "- ", tiempo aproximado, preguntas o dinámicas REDACTADAS COMPLETAMENTE)

### 3.2 Desarrollo (Construcción y Aplicación)
(Actividades en líneas con guion "- ", tiempo aproximado, texto/ejercicios/ejemplos REDACTADOS LITERALMENTE)

### 3.3 Culminación (Valoración)
(Actividades en líneas con guion "- ", tiempo aproximado, preguntas de metacognición o síntesis REDACTADAS)

## 4. Tarea para el Hogar
## 5. Adecuación Curricular
## 6. Recursos y Materiales
## 7. Instrumento de Evaluación
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
