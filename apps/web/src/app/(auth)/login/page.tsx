import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata = {
  title: 'Sign In — DevSpace',
  description: 'Sign in to your personal 3D knowledge workspace',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
      <Suspense fallback={<div className="text-xs text-muted-foreground">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
