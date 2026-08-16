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

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const respuestaGemini = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: contenido }]
                }]
            })
        });

        const data = await respuestaGemini.json();

        if (!respuestaGemini.ok) {
            const mensajeError = data.error?.message || 'Error desconocido en la API de Gemini.';
            return res.status(500).json({ error: mensajeError });
        }

        const planGenerado = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!planGenerado) {
            return res.status(500).json({ error: 'La IA no devolvió contenido válido.' });
        }

        return res.status(200).json({ plan: planGenerado });

    } catch (error) {
        console.error("Error crítico en serverless:", error);
        return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
}
