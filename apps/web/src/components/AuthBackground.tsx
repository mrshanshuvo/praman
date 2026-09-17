import Image from 'next/image';

export function AuthBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* Dark Mode: Futuristic neon network constellation */}
      <div className="relative w-full h-full hidden dark:block">
        <Image
          src="/auth/auth-bg-dark.jpg"
          alt="Auth Backdrop"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Light Mode: Lush natural botanical framing */}
      <div className="relative w-full h-full block dark:hidden">
        <Image
          src="/auth/auth-bg-light.png"
          alt="Auth Backdrop"
          fill
          priority
          className="object-cover"
        />
      </div>
    </div>
  );
}
