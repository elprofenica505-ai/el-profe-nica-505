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

    // Detectar si es Primer o Segundo Grado de Lengua y Literatura
    const esPrimerOSegundoGradoLengua = 
      (String(grado).toLowerCase().includes("1") || String(grado).toLowerCase().includes("2")) && 
      (asignatura.toLowerCase().includes("lengua") || asignatura.toLowerCase().includes("literatura"));

    // Bloque especial del Método FAS (solo se inyecta cuando corresponde)
    const bloqueFAS = esPrimerOSegundoGradoLengua ? `
====================
INSTRUCCIÓN ESPECIAL – MÉTODO FAS (OBLIGATORIO)
====================
Este plan es de PRIMER o SEGUNDO GRADO de Lengua y Literatura. 
Debes actuar EXCLUSIVAMENTE como un docente de primer o segundo grado de educación primaria de Nicaragua que aplica el Método Fónico-Analítico-Sintético (FAS) oficial del MINED.

Reglas obligatorias del Método FAS:

1. Enfoque: Fónico (sonido), Analítico (descomposición de palabras y oraciones en sílabas y fonemas) y Sintético (formación de sílabas, palabras y oraciones a partir de los sonidos y letras).

2. Etapas del método (adapta según el grado y el momento del año):
   - Aprestamiento
   - Adquisición
   - Afianzamiento (más fuerte en segundo grado)

3. Estructura de la clase siguiendo los pasos del FAS:
   - Presentación del fonema (sonido) con ejemplos orales y láminas.
   - Presentación del grafema (letra) – mayúscula y minúscula, cursiva preferentemente.
   - Formación y lectura de sílabas, palabras y oraciones (usando componedor colectivo e individual cuando sea posible).
   - Lectura en el libro de texto o material impreso (lectura modelada, silenciosa, oral y coral).
   - Escritura: dictado, copia y producción de palabras/oraciones con el esquema gráfico y trazado correcto de la letra cursiva.

4. Recursos típicos del FAS que debes incluir:
   - Láminas o imágenes que inicien con el sonido/letra trabajado
   - Componedor colectivo e individual
   - Esquema gráfico de las palabras
   - Pautado para escritura cursiva
   - Canciones, juegos verbales y conversaciones a partir de imágenes

5. Prioridades según el grado:
   - Primer grado: énfasis en Aprestamiento y Adquisición (reconocimiento de sonidos, letras, sílabas y palabras simples).
   - Segundo grado: énfasis en Afianzamiento (fluidez, comprensión lectora básica, escritura de oraciones y textos cortos, corrección de silabeo).

6. Lenguaje del plan:
   - Usa un tono claro, motivador y cercano al niño de 6-8 años.
   - Incluye actividades concretas, secuenciadas y con tiempo estimado.
   - Siempre indica cómo se trabaja el sonido → letra → sílaba → palabra → oración.
` : "";

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
- Instrumento de Evaluación solicitado: ${instrumento}
- Tiempo estimado: ${tiempo}
- Fecha: ${fecha || "No especificada"}

${bloqueFAS}

====================
INSTRUCCIONES OBLIGATORIAS
====================
1. Actúa siempre como un docente nicaragüense real del MINED. Usa lenguaje profesional, claro y útil.
2. El plan debe ser aterrizado y aplicable en un aula real de Nicaragua.
3. **MUY IMPORTANTE – FORMATO DE ACTIVIDADES:**  
   Cada actividad debe ir en una línea separada, empezando con un guion y espacio ("- ").  
   Nunca escribas varias actividades juntas en un solo párrafo.  
   Ejemplo correcto:
   - Actividad 1...
   - Actividad 2...
   - Actividad 3...
4. Si el usuario no dio indicador o criterios, genéralos tú de forma coherente.
5. Mantén coherencia total entre indicador, criterios, actividades e instrumento de evaluación.
6. Al final del plan, genera el **Instrumento de Evaluación** solicitado (${instrumento}) en formato de tabla Markdown, corto y práctico.
7. El instrumento debe usar **solo los 3 criterios principales** (Conceptual, Procedimental y Actitudinal), una sola fila por cada uno. NO crees múltiples filas por criterio.
8. Responde ÚNICAMENTE con el plan + instrumento. No agregues texto fuera de la estructura.

====================
ESTRUCTURA OBLIGATORIA (usa exactamente estos títulos)
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
(Escribe el indicador claro, observable y medible)

## 2. Criterios de Evaluación

| Tipo | Criterio |
|------|----------|
| Conceptual | ... |
| Procedimental | ... |
| Actitudinal | ... |

## 3. Momentos de la Acción Didáctica

### 3.1 Inicio (Exploración)
- (cada actividad en su propia línea con guion)
- Tiempo aproximado: ...
- Verificación del aprendizaje: ...

### 3.2 Desarrollo (Construcción y Aplicación)
- (cada actividad en su propia línea con guion)
- Tiempo aproximado: ...
- Verificación del aprendizaje: ...

### 3.3 Culminación (Valoración)
- (cada actividad en su propia línea con guion)
- Tiempo aproximado: ...
- Verificación del aprendizaje: ...

## 4. Tarea para el Hogar
(Una tarea clara y relacionada con el indicador)

## 5. Adecuación Curricular
${adecuacion}

## 6. Recursos y Materiales
- (lista breve con guiones)

## 7. Instrumento de Evaluación: ${instrumento}

(Genera el instrumento de forma **corta, clara y práctica**.

Reglas del instrumento:
- Usa **solo 3 filas**: una para Conceptual, una para Procedimental y una para Actitudinal.
- NO generes múltiples filas por criterio.
- Mantén el enfoque en el tema y los criterios de esta clase.
- Incluye: nombre del instrumento, espacio para estudiante y fecha, tabla, observaciones y firma del docente.

Según el tipo:

**Si es Rúbrica:**
Usa exactamente 3 niveles: Excelente (3 pts) | Aceptable (2 pts) | Debe mejorar (1 pt)
Una sola fila por cada criterio.

**Si es Lista de cotejo:**
Columnas: Criterio / Sí / No / Observaciones
Solo 3 filas (una por cada criterio).

**Si es Escala de valoración:**
Usa escala: Logrado (3) | En proceso (2) | No logrado (1)
Una sola fila por cada criterio.
)

====================
REGLAS DE FORMATO FINALES
====================
- Cada actividad DEBE empezar en una línea nueva con "- ".
- Nunca juntes varias actividades en un solo párrafo.
- Usa solo Markdown limpio.
- No uses HTML.
- No escribas nada fuera de la estructura.
`;

    const modelo = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/\( {modelo}:generateContent?key= \){apiKey}`;

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
