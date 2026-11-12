import Link from 'next/link';
import { Landmark, ArrowLeft, Compass } from 'lucide-react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';

/**
 * ANVAYA 404 Not Found Page for Heritage Monuments
 */
export default function SiteNotFound() {
  return (
    <div className="py-20 sm:py-32 bg-heritage-ivory min-h-[70vh] flex items-center">
      <Container size="sm" className="text-center">
        <div className="w-16 h-16 rounded-full bg-heritage-sandstone-100 flex items-center justify-center text-heritage-sandstone-700 mx-auto mb-6 border border-heritage-sandstone-300 shadow-heritage-sm">
          <Landmark className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-heritage-sandstone-700 bg-heritage-sandstone-100 px-3 py-1 rounded-md border border-heritage-sandstone-200">
          Monument Record Not Found
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-heritage-charcoal mt-4 mb-3">
          Heritage Destination Unavailable
        </h1>

        <p className="text-sm text-heritage-charcoal-500 font-sans leading-relaxed max-w-md mx-auto mb-8">
          The requested historical destination does not match any monument registered in our pilot directory. Please browse our active directory of heritage sites.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button href="/explore" variant="primary" size="md" leftIcon={Compass}>
            Explore Available Monuments
          </Button>
          <Button href="/" variant="outline" size="md" leftIcon={ArrowLeft}>
            Return to Home
          </Button>
        </div>
      </Container>
    </div>
  );
}
