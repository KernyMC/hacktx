import { Nunito, Pixelify_Sans, Press_Start_2P, Quicksand, Silkscreen, VT323 } from "next/font/google";
import StyleLab from "./StyleLab";

const pixelify = Pixelify_Sans({ subsets: ["latin"], variable: "--font-pixelify" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const pressStart = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--font-press-start" });
const vt323 = VT323({ subsets: ["latin"], weight: "400", variable: "--font-vt323" });
const silkscreen = Silkscreen({ subsets: ["latin"], weight: "400", variable: "--font-silkscreen" });
const quicksand = Quicksand({ subsets: ["latin"], variable: "--font-quicksand" });

export const metadata = { title: "Familiars style lab" };

export default function StylesPage() {
  const fonts = [pixelify, nunito, pressStart, vt323, silkscreen, quicksand].map((f) => f.variable).join(" ");
  return (
    <div className={fonts}>
      <StyleLab />
    </div>
  );
}
