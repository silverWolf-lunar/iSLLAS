import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { AuthProvider } from './components/AuthProvider';
import { AppProvider } from './components/AppContext';
import { ClientShell } from './components/ClientShell';
import { ThemeProvider } from './components/ThemeProvider';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'SLLAS — Smart Land Lease and Allocation System (Zimbabwe)',
  description: 'National land registry, lease workflow, and idle land allocation platform for the Republic of Zimbabwe.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#090D16" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <ClientShell>{children}</ClientShell>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
