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

function generarCodigo() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numeros = "23456789";

  let parte = "";
  for (let i = 0; i < 4; i++) {
    parte += letras[Math.floor(Math.random() * letras.length)];
  }

  let numero = "";
  for (let i = 0; i < 4; i++) {
    numero += numeros[Math.floor(Math.random() * numeros.length)];
  }

  return `PNI-${parte}-${numero}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });

  // Autenticación profesional leyendo desde los Headers
  const claveAdmin = req.headers["admin-secret"];
  const { cantidad } = req.body || {};

  if (!claveAdmin || claveAdmin !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "No autorizado." });
  }

  try {
    const total = Math.min(Number(cantidad) || 200, 500);
    const codigosGenerados = [];
    const batch = db.batch();

    for (let i = 0; i < total; i++) {
      let codigo;
      do {
        codigo = generarCodigo();
      } while (codigosGenerados.includes(codigo));

      codigosGenerados.push(codigo);

      const ref = db.collection("codigos").doc(codigo);
      batch.set(ref, {
        usado: false,
        deviceId: null,
        fechaInicio: null,
        fechaFin: null,
        creado: new Date(),
      });
    }

    await batch.commit();

    return res.status(200).json({
      mensaje: `${total} códigos generados correctamente.`,
      codigos: codigosGenerados,
    });

  } catch (error) {
    console.error("Error generando códigos:", error);
    return res.status(500).json({ error: error.message });
  }
}
