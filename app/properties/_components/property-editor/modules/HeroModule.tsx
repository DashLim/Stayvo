import GuestImageSlot from '@/app/properties/_components/GuestImageSlot';
import PropertyEditorPanel from '@/app/properties/_components/property-editor/PropertyEditorPanel';
import type { PropertyFormModuleSharedProps } from '@/app/properties/_components/property-editor/property-form-types';

export default function HeroModule({
  propertyId,
  heroImagePath,
  setHeroImagePath,
  guestMediaPublicBase,
}: Pick<
  PropertyFormModuleSharedProps,
  'propertyId' | 'heroImagePath' | 'setHeroImagePath' | 'guestMediaPublicBase'
>) {
  return (
    <PropertyEditorPanel
      title="Hero image"
      description="Shown at the top of the guest portal (same place as the live preview)."
    >
      <GuestImageSlot
        propertyId={propertyId}
        slot="detail:0"
        value={heroImagePath}
        onChange={setHeroImagePath}
        allowVideo={false}
        compressImages={false}
        guestMediaPublicBase={guestMediaPublicBase}
      />
    </PropertyEditorPanel>
  );
}
