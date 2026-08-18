import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });

  try {
    const { deviceId } = req.body || {};

    if (!deviceId) {
      return res.status(400).json({ error: "Falta el identificador de dispositivo." });
    }

    const snapshot = await db.collection("codigos")
      .where("deviceId", "==", deviceId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ activo: false, error: "No hay membresía activada en este dispositivo." });
    }

    const data = snapshot.docs[0].data();
    const fechaFin = data.fechaFin.toDate();
    const ahora = new Date();
    const diasRestantes = Math.ceil((fechaFin - ahora) / (1000 * 60 * 60 * 24));

    return res.status(200).json({
      activo: diasRestantes > 0,
      diasRestantes: Math.max(diasRestantes, 0),
      fechaFin: fechaFin.toISOString(),
    });

  } catch (error) {
    console.error("Error verificando membresía:", error);
    return res.status(500).json({ error: error.message });
  }
}