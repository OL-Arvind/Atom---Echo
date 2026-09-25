import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Atom & Echo · Client Review",
    short_name: "A&E Review",
    description: "Zero-login mobile client review and 1-tap post approval portal",
    start_url: "/review",
    display: "standalone",
    background_color: "#090a0c",
    theme_color: "#090a0c",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
