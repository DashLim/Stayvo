import Link from 'next/link';
import { stayvoBtnPrimaryClass, stayvoCardGlassClass, stayvoMutedTextClass, stayvoSectionTitleClass } from '@/lib/stayvo-ui-classes';

export default function NoPropertiesEmptyState({ returnTo }: { returnTo: string }) {
  return (
    <div className={`${stayvoCardGlassClass} p-6 text-center md:p-8`}>
      <h2 className={stayvoSectionTitleClass}>No properties yet</h2>
      <p className={`mx-auto mt-2 max-w-md ${stayvoMutedTextClass}`}>
        Add your first property to start sharing check-in details, house rules, and guest links.
      </p>
      <Link
        href={`/properties/new?returnTo=${encodeURIComponent(returnTo)}`}
        prefetch={false}
        className={`mt-5 ${stayvoBtnPrimaryClass}`}
      >
        + Add your first property
      </Link>
    </div>
  );
}
