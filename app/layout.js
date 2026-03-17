import './globals.css';

export const metadata = {
  title: 'LogiAI — Logistics Control Tower',
  description: 'AI-powered logistics control tower with real-time fleet tracking, shipment management, and predictive analytics.',
  keywords: 'logistics, supply chain, fleet management, TMS, freight',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
