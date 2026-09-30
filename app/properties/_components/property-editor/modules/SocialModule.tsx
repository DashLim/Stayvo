import { Input } from '@/components/ui/input';
import PropertyEditorPanel from '@/app/properties/_components/property-editor/PropertyEditorPanel';
import { FieldGroup } from '@/app/properties/_components/property-editor/editor-ui';
import type { PropertyFormModuleSharedProps } from '@/app/properties/_components/property-editor/property-form-types';

export default function SocialModule({
  socialDirectBookingUrl,
  setSocialDirectBookingUrl,
  socialAirbnbUrl,
  setSocialAirbnbUrl,
  socialInstagramUrl,
  setSocialInstagramUrl,
  socialFacebookUrl,
  setSocialFacebookUrl,
  socialTiktokUrl,
  setSocialTiktokUrl,
  socialYoutubeUrl,
  setSocialYoutubeUrl,
  socialXUrl,
  setSocialXUrl,
}: Pick<
  PropertyFormModuleSharedProps,
  | 'socialDirectBookingUrl'
  | 'setSocialDirectBookingUrl'
  | 'socialAirbnbUrl'
  | 'setSocialAirbnbUrl'
  | 'socialInstagramUrl'
  | 'setSocialInstagramUrl'
  | 'socialFacebookUrl'
  | 'setSocialFacebookUrl'
  | 'socialTiktokUrl'
  | 'setSocialTiktokUrl'
  | 'socialYoutubeUrl'
  | 'setSocialYoutubeUrl'
  | 'socialXUrl'
  | 'setSocialXUrl'
>) {
  return (
    <PropertyEditorPanel
      title="Social links"
      description="Optional. Shown as icons at the bottom of the guest page. Leave blank to hide a platform."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup
          label="Direct booking website"
          hint='Shown as a "Booking Website" button in the Your host block (hidden when blank).'
          className="sm:col-span-2"
        >
          <Input
            value={socialDirectBookingUrl}
            onChange={(e) => setSocialDirectBookingUrl(e.target.value)}
            placeholder="https://your-site.com/book"
            inputMode="url"
            autoComplete="off"
          />
        </FieldGroup>
        <FieldGroup
          label="Airbnb listing URL"
          hint="Optional. Stored for reference and future imports."
          className="sm:col-span-2"
        >
          <Input
            value={socialAirbnbUrl}
            onChange={(e) => setSocialAirbnbUrl(e.target.value)}
            placeholder="https://www.airbnb.com/rooms/..."
            inputMode="url"
            autoComplete="off"
          />
        </FieldGroup>
        <FieldGroup label="Instagram">
          <Input
            value={socialInstagramUrl}
            onChange={(e) => setSocialInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/yourhandle"
            inputMode="url"
            autoComplete="off"
          />
        </FieldGroup>
        <FieldGroup label="Facebook">
          <Input
            value={socialFacebookUrl}
            onChange={(e) => setSocialFacebookUrl(e.target.value)}
            placeholder="https://facebook.com/..."
            inputMode="url"
            autoComplete="off"
          />
        </FieldGroup>
        <FieldGroup label="TikTok">
          <Input
            value={socialTiktokUrl}
            onChange={(e) => setSocialTiktokUrl(e.target.value)}
            placeholder="https://tiktok.com/@..."
            inputMode="url"
            autoComplete="off"
          />
        </FieldGroup>
        <FieldGroup label="YouTube">
          <Input
            value={socialYoutubeUrl}
            onChange={(e) => setSocialYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/@..."
            inputMode="url"
            autoComplete="off"
          />
        </FieldGroup>
        <FieldGroup label="X">
          <Input
            value={socialXUrl}
            onChange={(e) => setSocialXUrl(e.target.value)}
            placeholder="https://x.com/..."
            inputMode="url"
            autoComplete="off"
          />
        </FieldGroup>
      </div>
    </PropertyEditorPanel>
  );
}
