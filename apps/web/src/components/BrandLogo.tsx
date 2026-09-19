import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BrandLogoProps {
  /** Target link destination. Pass null or empty string to render as a plain non-clickable div. */
  href?: string | null;
  /** Size variant: sm (compact), md (navbar standard), lg (hero/auth display) */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to render the stylized bilingual text labels alongside the logo icon */
  showText?: boolean;
  /** Priority loading flag for Next.js Image */
  priority?: boolean;
  /** Custom wrapper CSS classes */
  className?: string;
}

const sizeConfig = {
  sm: {
    container: 'gap-2',
    iconWrapper: 'w-8 h-8',
    imageSize: 24,
    englishText: 'text-xl sm:text-2xl',
    bengaliText: 'text-base sm:text-lg',
  },
  md: {
    container: 'gap-2.5',
    iconWrapper: 'w-12 h-12',
    imageSize: 32,
    englishText: 'text-2xl sm:text-3xl',
    bengaliText: 'text-lg sm:text-xl',
  },
  lg: {
    container: 'gap-3',
    iconWrapper: 'w-16 h-16',
    imageSize: 48,
    englishText: 'text-3xl sm:text-4xl',
    bengaliText: 'text-xl sm:text-2xl',
  },
};

export function BrandLogo({
  href = '/',
  size = 'md',
  showText = true,
  priority = false,
  className,
}: BrandLogoProps) {
  const config = sizeConfig[size];

  const content = (
    <div className={cn('flex items-center group', config.container, className)}>
      <div className={cn('flex items-center justify-center shrink-0', config.iconWrapper)}>
        <Image
          src="/praman_light_mode_logo.svg"
          alt="Praman Logo"
          width={config.imageSize}
          height={config.imageSize}
          className="w-full h-full object-contain dark:hidden"
          priority={priority}
        />
        <Image
          src="/praman_dark_mode_logo.svg"
          alt="Praman Logo"
          width={config.imageSize}
          height={config.imageSize}
          className="w-full h-full object-contain hidden dark:block"
          priority={priority}
        />
      </div>
      {showText && (
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'font-berkshire text-brand-cyan font-normal tracking-wide leading-none select-none',
              config.englishText,
            )}
          >
            praman
          </span>
          <span
            className={cn(
              'font-galada text-brand-pink leading-none select-none',
              config.bengaliText,
            )}
          >
            প্রমাণ
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg transition-opacity hover:opacity-90"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export { BrandLogo as Logo };
