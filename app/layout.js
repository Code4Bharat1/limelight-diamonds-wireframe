import './globals.css';

export const metadata = {
  title: 'Limelight Diamonds — Inventory & Team App',
  description: 'Inventory tracking, dispatch, attendance and salary management for Limelight Diamonds (demo wireframe).',
  keywords: 'diamond inventory, jewellery, warehouse management, attendance, salary',
  icons: { icon: '/logo-mark.svg', apple: '/logo.jpg' },
  openGraph: {
    title: 'Limelight Diamonds — Inventory & Team App',
    description: 'Warehouse management and team operations platform',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="font-sans antialiased bg-gray-50 text-gray-800" suppressHydrationWarning>{children}</body>
    </html>
  );
}
