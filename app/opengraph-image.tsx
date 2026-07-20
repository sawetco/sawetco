import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = "sawet — full stack developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const profileImage = await readFile(
    join(process.cwd(), "public/images/samet.png"),
  );
  const profileDataUrl = `data:image/png;base64,${profileImage.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ededed",
        background: "#000000",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
          textAlign: "center",
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: ImageResponse içinde next/image kullanılamaz. */}
        <img
          src={profileDataUrl}
          width={150}
          height={150}
          alt=""
          style={{
            border: "1px solid #262626",
            borderRadius: 999,
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 82,
            fontWeight: 600,
            letterSpacing: -6,
            lineHeight: 1,
          }}
        >
          {siteConfig.name}
        </div>
        <div
          style={{
            display: "flex",
            color: "#888888",
            fontSize: 44,
            letterSpacing: -2,
            lineHeight: 1,
          }}
        >
          full stack developer
        </div>
      </div>
    </div>,
    size,
  );
}
