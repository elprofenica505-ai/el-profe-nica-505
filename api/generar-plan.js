export default async function handler(req, res) {
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
            return res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en Vercel.' });
        }

        // Llamada directa por REST API oficial a Gemini
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
            throw new Error(data.error?.message || 'Error al comunicarse con la API de Gemini.');
        }

        const planGenerado = data.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo extraer el contenido.";

        return res.status(200).json({ plan: planGenerado });

    } catch (error) {
        console.error("Error en serverless:", error);
        return res.status(500).json({ error: 'Error del servidor: ' + error.message });
    }
}
