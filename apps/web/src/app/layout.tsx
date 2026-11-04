import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { ApplicationHeader } from '@/components/navigation/header';

export const metadata: Metadata = {
  title: 'DevSpace — Personal 3D Knowledge Workspace',
  description: 'Organize your world. Visualize your progress.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased bg-background text-foreground flex flex-col">
        <AuthProvider>
          <ApplicationHeader />
          <div className="flex-1 flex flex-col">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
