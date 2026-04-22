'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/lib/stores/auth.store';
import { authApi } from '@/lib/api/auth';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(form);
      setAuth(res.user, res.accessToken, res.refreshToken);
      router.push('/feed');
      toast.success('Welcome to HUUM!');
    } catch {
      toast.error('Registration failed. Username or email may be taken.');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-bold">Create your account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Display name" value={form.displayName} onChange={set('displayName')} required />
        <Input label="Username" value={form.username} onChange={set('username')} required />
        <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
        <Input label="Password" type="password" value={form.password} onChange={set('password')} required />
        <Button type="submit" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-gray-400">or</span>
        </div>
      </div>

      <Button
        variant="secondary"
        className="w-full"
        onClick={() => (window.location.href = '/api/auth/google')}
      >
        Sign up with Google
      </Button>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-amber-600 hover:text-amber-500">
          Log in
        </Link>
      </p>
    </>
  );
}
