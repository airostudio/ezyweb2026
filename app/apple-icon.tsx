import { ImageResponse } from "next/og";
import { svgDataUri } from "@/lib/brand-assets";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon: the "e" mark on a soft off-white tile. */
export default async function AppleIcon() {
  const mark = await svgDataUri("app/icon.svg");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
        <img src={mark} width={140} height={140} alt="" />
      </div>
    ),
    size,
  );
}
