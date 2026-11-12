import Badge from '@/components/ui/Badge';

/**
 * ANVAYA Monument Category Pill
 * Classifies heritage epoch and archaeological significance.
 */
export default function SiteCategory({ category = 'Heritage Site', className = '' }) {
  return (
    <Badge variant="sandstone" size="sm" className={`font-semibold ${className}`}>
      {category}
    </Badge>
  );
}
