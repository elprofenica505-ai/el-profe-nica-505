import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // Configuración de cabeceras para evitar problemas de CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { contenido } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en Vercel.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // ESTA ES LA DEFINICIÓN ESTÁNDAR QUE NO DEBE DAR ERROR 404
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(contenido);
        const text = result.response.text();

        return res.status(200).json({ plan: text });

    } catch (error) {
        return res.status(500).json({ error: 'Error de IA: ' + error.message });
    }
}
