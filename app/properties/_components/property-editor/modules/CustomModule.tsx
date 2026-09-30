import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import GuestImageSlot from '@/app/properties/_components/GuestImageSlot';
import PropertyEditorPanel from '@/app/properties/_components/property-editor/PropertyEditorPanel';
import { EditorEmptyState, EditorListShell, FieldGroup } from '@/app/properties/_components/property-editor/editor-ui';
import type { PropertyFormModuleSharedProps } from '@/app/properties/_components/property-editor/property-form-types';

export default function CustomModule({
  propertyId,
  customDetails,
  setCustomDetails,
  customBlocksCap,
  mediaAllowVideo,
  guestMediaPublicBase,
}: Pick<
  PropertyFormModuleSharedProps,
  | 'propertyId'
  | 'customDetails'
  | 'setCustomDetails'
  | 'customBlocksCap'
  | 'mediaAllowVideo'
  | 'guestMediaPublicBase'
>) {
  return (
    <PropertyEditorPanel
      title="Custom block"
      description="Add custom sections shown on the guest page."
    >
      <div className="space-y-3">
        {customDetails.length === 0 ? (
          <EditorEmptyState>No custom blocks yet.</EditorEmptyState>
        ) : null}
        {customDetails.map((d, idx) => (
          <EditorListShell
            key={idx}
            title={`Block ${idx + 1}`}
            actions={
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={Boolean(d.isDisplayed)}
                    onChange={(e) =>
                      setCustomDetails((prev) =>
                        prev.map((it, i) =>
                          i === idx ? { ...it, isDisplayed: e.target.checked } : it,
                        ),
                      )
                    }
                    className="h-4 w-4 accent-primary"
                  />
                  Display
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => setCustomDetails((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Remove
                </Button>
              </div>
            }
          >
            <div className="mt-2 grid gap-3">
              <FieldGroup label="Title">
                <Input
                  value={d.title}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCustomDetails((prev) =>
                      prev.map((it, i) => (i === idx ? { ...it, title: v } : it)),
                    );
                  }}
                />
              </FieldGroup>
              <FieldGroup label="Message">
                <Textarea
                  rows={5}
                  value={d.message}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCustomDetails((prev) =>
                      prev.map((it, i) => (i === idx ? { ...it, message: v } : it)),
                    );
                  }}
                  className="min-h-[7.5rem]"
                />
              </FieldGroup>
            </div>
            <GuestImageSlot
              propertyId={propertyId}
              slot={`detail:${idx}`}
              value={d.guestImagePath ?? ''}
              onChange={(v) =>
                setCustomDetails((prev) =>
                  prev.map((it, i) => (i === idx ? { ...it, guestImagePath: v } : it)),
                )
              }
              allowVideo={mediaAllowVideo}
              guestMediaPublicBase={guestMediaPublicBase}
            />
          </EditorListShell>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={customDetails.length >= customBlocksCap}
        onClick={() =>
          setCustomDetails((prev) => [
            ...prev,
            { title: '', message: '', isDisplayed: true, guestImagePath: '' },
          ])
        }
      >
        + Add block
      </Button>
    </PropertyEditorPanel>
  );
}
