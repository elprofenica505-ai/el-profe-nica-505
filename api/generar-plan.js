const { GoogleGenAI } = require('@google/genai');

export default async function handler(req, res) {
    // Permitir solicitudes CORS básicas
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
        const { asignatura, grado, unidad, logro, tema, criterios } = req.body;

        if (!asignatura || !grado || !tema) {
            return res.status(400).json({ error: 'Faltan datos obligatorios en la solicitud.' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Falta configurar la GEMINI_API_KEY en el servidor de Vercel.' });
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });

        const prompt = `Actúa como un asesor pedagógico experto del Ministerio de Educación de Nicaragua (MINED). 
Genera un Plan de Clase diario oficial y estructurado para educación primaria cumpliendo estrictamente con los cuatro momentos metodológicos locales.

Utiliza los siguientes datos proporcionados por el docente:
- Asignatura: ${asignatura}
- Grado: ${grado}
- Unidad: ${unidad || 'N/A'}
- Indicador de Logro: ${logro || 'N/A'}
- Tema: ${tema}
- Criterios de Evaluación: ${criterios || 'N/A'}

El formato de salida debe estar organizado rigurosamente bajo la estructura didáctica nacional:
1. DATOS INFORMATIVOS (Centro educativo, Docente, Asignatura, Grado, Secciones, Fecha).
2. COMPETENCIA DE EJE / INDICADOR DE LOGRO.
3. MOMENTOS METODOLÓGICOS (Desglose claro y práctico para el docente en el aula):
   - I. Actividades Iniciales (Exploración de saberes previos, motivación).
   - II. Desarrollo (Construcción del nuevo conocimiento, ejercitación guiada).
   - III. Consolidación (Aplicación práctica, fijación del contenido).
   - IV. Actividades de Evaluación y Cierre (Comprobación del logro, tarea o metacognición).
4. RECURSOS DIDÁCTICOS Y MATERIALES.

Escribe el plan de manera profesional, clara, directa y adaptada a la realidad de las escuelas primarias en Nicaragua.`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        const planGenerado = response.text;

        return res.status(200).json({ plan: planGenerado });

    } catch (error) {
        console.error('Error al generar el plan con Gemini:', error);
        return res.status(500).json({ error: 'Error interno al procesar la solicitud con la Inteligencia Artificial.' });
    }
}
