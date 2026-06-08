import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Fixe la racine du workspace sur le dossier frontend pour éviter que Turbopack
  // ne sélectionne un package-lock.json parasite situé dans un dossier parent.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
