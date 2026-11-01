import { Cinzel, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Nav from "../components/Nav";
import VideoBg from "../components/VideoBg";
const cinzel = Cinzel({ subsets: ["latin"], variable: "--f-title" });
const corm = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-body" });
export const metadata = { title: "Virasat — Heritage Crowd Management", description: "Plan your visit to India's heritage sites: history, tickets, crowd levels, slots and live entry stats." };
export default function RootLayout({ children }) {
  return (<html lang="en"><body className={`${cinzel.variable} ${corm.variable}`}>
    <VideoBg /><Nav />{children}
  </body></html>);
}
