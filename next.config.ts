import type { NextConfig } from "next";
const config: NextConfig = {
  serverExternalPackages: ["pg"],
  turbopack: { root: process.cwd() },
};
export default config;
