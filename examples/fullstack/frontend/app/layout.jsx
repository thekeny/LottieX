import Link from "next/link";
import "./styles.css";

export const metadata = { title: "LottieX Notes", icons: "/icon.png" };

export default function Layout({ children }) {
    return (
        <html lang="en">
            <body>
                <header><Link href="/">LottieX Notes</Link></header>
                <main>{children}</main>
            </body>
        </html>
    );
}
