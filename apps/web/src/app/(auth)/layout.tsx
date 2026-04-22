export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-3xl font-bold text-transparent">
            HUUM
          </span>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-lg">{children}</div>
      </div>
    </div>
  );
}
