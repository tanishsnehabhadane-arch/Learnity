export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
