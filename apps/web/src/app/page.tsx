'use client';

import Link from 'next/link';
import { MessageCircle, Shield, Sliders, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const features = [
  {
    icon: Sliders,
    title: 'Perspective Slider',
    description: 'Control how much you see outside your bubble. Discover new ideas on your terms.',
  },
  {
    icon: Shield,
    title: 'Community Moderation',
    description: 'Transparent, community-driven moderation with public logs. No hidden censorship.',
  },
  {
    icon: Users,
    title: 'No Echo Chambers',
    description: 'Our feed algorithm actively surfaces diverse viewpoints alongside your interests.',
  },
  {
    icon: MessageCircle,
    title: 'Threaded Discussions',
    description: 'Deep, structured conversations. Not just hot takes — real discourse.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
        <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-2xl font-bold text-transparent">
          HUUM
        </span>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Sign up</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center lg:py-36">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50" />
        <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight tracking-tight lg:text-7xl">
          Every voice matters.{' '}
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            Beyond the bubble.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600">
          HUUM is where free speech meets constructive discourse. See every perspective,
          join the conversation, shape your community.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link href="/register">
            <Button size="lg">Get started — it&apos;s free</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">Log in</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold">Built different, on purpose</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
          We designed HUUM to fix what&apos;s broken about social media.
        </p>
        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                <f.icon className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-gray-500">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-20 text-center text-white">
        <h2 className="text-3xl font-bold">Ready to hear the whole room?</h2>
        <p className="mx-auto mt-3 max-w-md opacity-90">
          Join thousands who are tired of echo chambers and ready for real conversation.
        </p>
        <Link href="/register">
          <Button variant="secondary" size="lg" className="mt-8 bg-white text-amber-600 hover:bg-gray-100">
            Create your account
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} HUUM. Every voice matters.
      </footer>
    </div>
  );
}
