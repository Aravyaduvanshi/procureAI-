import { initializeApp, cert, getApps } from "firebase-admin/app";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp = null;

try {
  const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");
  if (fs.existsSync(serviceAccountPath)) {
    const raw = fs.readFileSync(serviceAccountPath, "utf-8");
    const serviceAccount = JSON.parse(raw);
    if (serviceAccount.project_id && serviceAccount.private_key && !serviceAccount.private_key.includes("EXAMPLE")) {
      firebaseApp = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccount) }) : getApps()[0];
      console.log("[Auth:Firebase] Firebase Admin SDK initialized successfully.");
    } else {
      console.log("[Auth:Firebase] Placeholder service account detected. Using dev mock auth.");
    }
  } else {
    console.log("[Auth:Firebase] No serviceAccountKey.json found. Using dev mock auth.");
  }
} catch (err) {
  console.warn(`[Auth:Firebase] Warning: Could not initialize Firebase Admin SDK (${err.message}). Using dev mock auth.`);
}

export const app = firebaseApp;
