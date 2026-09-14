import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Allows accessing the dev server from other devices on the same
  // network (e.g. testing on a phone via http://<lan-ip>:3000).
  // If your IP changes (new Wi-Fi, router restart, etc.), add the new
  // one here and restart `npm run dev`.
  allowedDevOrigins: ["10.179.211.31", "192.168.2.110"],
};

export default nextConfig;
