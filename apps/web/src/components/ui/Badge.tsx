type BadgeColor = 'amber' | 'coral' | 'warm' | 'green' | 'blue' | 'gray' | 'red';
type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  variant?: BadgeVariant;
  className?: string;
}

const colorMap: Record<BadgeColor, string> = {
  amber: 'bg-huum-amber-100 text-huum-amber-700',
  coral: 'bg-huum-coral-100 text-huum-coral-700',
  warm: 'bg-huum-warm-100 text-huum-warm-700',
  green: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
  red: 'bg-red-100 text-red-700',
};

const variantToColor: Record<BadgeVariant, BadgeColor> = {
  default: 'gray',
  primary: 'amber',
  success: 'green',
  warning: 'coral',
  danger: 'red',
  info: 'blue',
};

export function Badge({ children, color, variant, className = '' }: BadgeProps) {
  const resolvedColor: BadgeColor = color ?? (variant ? variantToColor[variant] : 'amber');
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[resolvedColor]} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
