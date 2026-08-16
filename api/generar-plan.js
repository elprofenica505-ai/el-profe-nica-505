import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
    // Asegurar que siempre respondemos con cabecera JSON
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { contenido } = req.body;

        if (!contenido) {
            return res.status(400).json({ error: 'Falta el contenido del plan.' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'La llave GEMINI_API_KEY no está configurada en el servidor.' });
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contenido,
        });

        // Validar que la respuesta contenga texto
        const planGenerado = response.text || "No se pudo generar el contenido.";

        return res.status(200).json({ plan: planGenerado });

    } catch (error) {
        console.error("Error crítico en serverless:", error);
        return res.status(500).json({ error: 'Error del servidor: ' + (error.message || error) });
    }
}
