import './globals.css';

export const metadata = {
  title: 'Heritage Site Crowd Management System | Smart Tourism Platform',
  description:
    'A smart-tourism and crowd analytics platform for historical monuments, museums, and cultural heritage destinations across India.',
  keywords: [
    'heritage',
    'tourism',
    'crowd management',
    'monuments',
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
      <body className="bg-heritage-ivory text-heritage-charcoal min-h-screen flex flex-col antialiased selection:bg-heritage-sandstone/30 selection:text-heritage-green">
        {children}
      </body>
    </html>
  );
}
