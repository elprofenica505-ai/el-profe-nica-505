export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { contenido } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        // Usamos el endpoint REST directo de Google para evitar errores de SDK
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: contenido }] }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ error: data.error?.message || 'Error de conexión' });
        }

        const plan = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ plan });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
