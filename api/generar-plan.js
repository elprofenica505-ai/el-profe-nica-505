import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');

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
            return res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en Vercel.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(contenido);
        const response = await result.response;
        const text = response.text();

        if (!text) {
            return res.status(500).json({ error: 'La IA no devolvió contenido válido.' });
        }

        return res.status(200).json({ plan: text });

    } catch (error) {
        console.error("Error crítico con la librería de Gemini:", error);
        return res.status(500).json({ error: 'Error interno: ' + error.message });
    }
}
