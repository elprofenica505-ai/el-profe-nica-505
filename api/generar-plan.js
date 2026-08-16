import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { contenido } = req.body;

        if (!contenido) {
            return res.status(400).json({ error: 'Falta el contenido del plan.' });
        }

        // Inicializar la API de Gemini usando la variable de entorno de Vercel
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contenido,
        });

        const planGenerado = response.text;

        return res.status(200).json({ plan: planGenerado });

    } catch (error) {
        console.error("Error al conectar con Gemini:", error);
        return res.status(500).json({ error: 'Error interno al generar el plan con la IA.' });
    }
}
