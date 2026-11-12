import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: "ANVAYA – Where Heritage Connects Generations | Smart Tourism Platform",
  description:
    "ANVAYA is an intelligent heritage tourism platform that helps visitors discover India's historic destinations, book tickets and explore real-time crowd information.",
  keywords: [
    'ANVAYA',
    'heritage tourism',
    'India monuments',
    'smart tourism',
    'crowd management',
    'heritage sites',
    'taj mahal',
    'red fort',
    'qutub minar',
    'hampi',
    'sun temple',
    'ajanta caves',
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-heritage-ivory text-heritage-charcoal min-h-screen flex flex-col antialiased selection:bg-heritage-sandstone/30 selection:text-heritage-green font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
