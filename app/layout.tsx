import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Esphacio — Find your space. Stay your way.',
  description: 'Furnished condo rental discovery across Metro Manila. Clear costs, flexible stays. Demo marketplace MVP.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header className="shell header">
          <Link className="brand" href="/">
            esphacio<span>.</span>
          </Link>

          <nav aria-label="Main navigation">
            <Link href="/map">Map</Link>
            <Link href="/#stays">Stays</Link>
            <Link href="/?filter=Saved#stays">Saved</Link>
            <Link href="/account">Inquiries</Link>
          </nav>

          <div className="header-actions">
            <Link className="host-link" href="/host">Become a Host</Link>
            <span className="language">EN <span aria-hidden="true">|</span> PHP</span>
            <button className="icon-button" aria-label="Notifications" type="button">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
            </button>
            <Link className="avatar" href="/account" aria-label="Open account">ES</Link>
          </div>

          <details className="mobile-menu">
            <summary aria-label="Open menu">☰</summary>
            <nav>
              <Link href="/map">Map</Link>
              <Link href="/#stays">Stays</Link>
              <Link href="/?filter=Saved#stays">Saved</Link>
              <Link href="/account">Inquiries & account</Link>
              <Link href="/host">Become a Host</Link>
            </nav>
          </details>
        </header>

        {children}

        <footer>
          <div className="shell">
            <span className="footer-brand">esphacio<span>.</span></span>
            <p style={{ margin: 0 }}>
              Launch concept · Demo properties only · No bookings or payments
            </p>
            <Link href="/admin" style={{ fontSize: 12, color: '#999' }}>Admin</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
