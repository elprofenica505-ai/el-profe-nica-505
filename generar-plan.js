import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { asignatura, grado, unidad, indicador, tema, criterios } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Falta la API Key de Gemini en el servidor.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Eres un experto asesor pedagógico de educación primaria en Nicaragua. 
    Genera un plan de clase diario estructurado estrictamente bajo el formato metodológico oficial de cuatro momentos:
    1. Actividades de inicio
    2. Actividades de desarrollo
    3. Actividades de culminación
    4. Actividades de evaluación
    
    Datos de entrada proporcionados por el docente:
    - Asignatura: ${asignatura}
    - Grado: ${grado}
    - Unidad: ${unidad}
    - Indicador de logro: ${indicador}
    - Tema: ${tema}
    - Criterios de evaluación: ${criterios}

    Desarrolla el plan con alta calidad técnica y pedagógica, listo para usar en el aula de clase.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ plan: text });
  } catch (error) {
    console.error("Error al generar el plan:", error);
    return res.status(500).json({ error: error.message || 'Error interno al procesar la IA' });
  }
}