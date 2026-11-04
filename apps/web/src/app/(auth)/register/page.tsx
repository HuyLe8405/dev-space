import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata = {
  title: 'Create Account — DevSpace',
  description: 'Register for your personal 3D knowledge workspace',
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
      <RegisterForm />
    </main>
  );
}
