import './globals.css';

export const metadata = {
  title: 'LogiAI — Logistics Control Tower',
  description: 'AI-powered logistics control tower with real-time fleet tracking, shipment management, and predictive analytics.',
  keywords: 'logistics, supply chain, fleet management, TMS, freight',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{__html: `
          (function(){
            try {
              var t = localStorage.getItem('logiai-theme') || 'dark';
              document.documentElement.setAttribute('data-theme', t);
            } catch(e){}
          })();
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
