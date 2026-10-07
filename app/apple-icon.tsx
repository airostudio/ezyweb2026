import { ImageResponse } from "next/og";
import { assetDataUri } from "@/lib/brand-assets";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon: the aduma.io robot on a soft off-white tile. */
export default async function AppleIcon() {
  const mark = await assetDataUri("public/brand/aduma-mark.png");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f4ef" }}>
        <img src={mark} width={150} height={150} alt="" />
      </div>
    ),
    size,
  );
}
