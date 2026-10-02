import QRCode from "qrcode";
import { SITE_URL } from "@/lib/site-url";

export function projectShortUrl(projectId: string) {
  return `${SITE_URL}/p/${projectId}`;
}

export function projectQrSvg(projectId: string) {
  return QRCode.toString(projectShortUrl(projectId), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#022f49", light: "#ffffff" },
  });
}
