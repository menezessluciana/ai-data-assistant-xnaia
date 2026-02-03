interface XnaiaLogoProps {
  size?: number;
  variant?: 'gradient' | 'white';
  className?: string;
}

export default function XnaiaLogo({ 
  size = 120, 
  variant = 'gradient',
  className = '' 
}: XnaiaLogoProps) {
  const imageSrc = variant === 'gradient' 
    ? '/images/logo-gradient.png' 
    : '/images/logo-white.png';
  
  return (
    <img 
      src={imageSrc}
      alt="Xnaia Logo"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}

// Icon version - uses the white background logo cropped/smaller
export function XnaiaIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <img 
      src="/images/logo-white.png"
      alt="Xnaia"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
