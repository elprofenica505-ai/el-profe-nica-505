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
const DIAS_MEMBRESIA = 30;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });

  try {
    const { codigo, deviceId } = req.body || {};

    if (!codigo || !deviceId) {
      return res.status(400).json({ error: "Falta el código o el identificador de dispositivo." });
    }

    const codigoNormalizado = String(codigo).trim().toUpperCase();
    const ref = db.collection("codigos").doc(codigoNormalizado);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Código no válido." });
    }

    const data = doc.data();
    const ahora = new Date();

    // Caso 1: el código ya fue activado antes
    if (data.usado) {
      // Si es el mismo dispositivo, solo devolvemos el estado actual (permite reingresar)
      if (data.deviceId === deviceId) {
        const fechaFin = data.fechaFin.toDate();
        const diasRestantes = Math.ceil((fechaFin - ahora) / (1000 * 60 * 60 * 24));
        return res.status(200).json({
          activo: diasRestantes > 0,
          diasRestantes: Math.max(diasRestantes, 0),
          fechaFin: fechaFin.toISOString(),
        });
      }
      // Si es otro dispositivo, se bloquea (evita piratería)
      return res.status(403).json({ error: "Este código ya está activado en otro dispositivo." });
    }

    // Caso 2: primera activación de este código
    const fechaInicio = ahora;
    const fechaFin = new Date(ahora.getTime() + DIAS_MEMBRESIA * 24 * 60 * 60 * 1000);

    await ref.update({
      usado: true,
      deviceId,
      fechaInicio,
      fechaFin,
    });

    return res.status(200).json({
      activo: true,
      diasRestantes: DIAS_MEMBRESIA,
      fechaFin: fechaFin.toISOString(),
    });

  } catch (error) {
    console.error("Error activando código:", error);
    return res.status(500).json({ error: error.message });
  }
}