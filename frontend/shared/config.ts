// L'URL du backend est lue depuis NEXT_PUBLIC_API_URL (build-time).
// Fallback localhost en dev. En prod (Vercel) : configurer la variable
// dans les Project Settings > Environment Variables.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
