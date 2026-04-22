'use client';

import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  alt?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const pixelMap = { sm: 32, md: 40, lg: 56, xl: 80 };

function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ src, alt, name, size = 'md', className = '' }: AvatarProps) {
  if (src) {
    return (
      <div className={`relative rounded-full overflow-hidden flex-shrink-0 ${sizeMap[size]} ${className}`}>
        <Image
          src={src}
          alt={alt || name || 'Avatar'}
          width={pixelMap[size]}
          height={pixelMap[size]}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full flex-shrink-0 bg-gradient-huum flex items-center justify-center text-white font-semibold ${sizeMap[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}

export default Avatar;
