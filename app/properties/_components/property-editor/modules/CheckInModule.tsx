import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import GuestImageSlot from '@/app/properties/_components/GuestImageSlot';
import PropertyEditorPanel from '@/app/properties/_components/property-editor/PropertyEditorPanel';
import { EditorEmptyState, EditorListShell } from '@/app/properties/_components/property-editor/editor-ui';
import type { PropertyFormModuleSharedProps } from '@/app/properties/_components/property-editor/property-form-types';

export default function CheckInModule({
  propertyId,
  checkInInstructions,
  setCheckInInstructions,
  mediaAllowVideo,
  guestMediaPublicBase,
  checkinStepsLimit,
}: Pick<
  PropertyFormModuleSharedProps,
  | 'propertyId'
  | 'checkInInstructions'
  | 'setCheckInInstructions'
  | 'mediaAllowVideo'
  | 'guestMediaPublicBase'
  | 'checkinStepsLimit'
>) {
  return (
    <PropertyEditorPanel
      title="Check-in instructions"
      description="Add step-by-step instructions for guests."
    >
      <div className="space-y-3">
        {checkInInstructions.length === 0 ? (
          <EditorEmptyState>No steps yet. Add your first step below.</EditorEmptyState>
        ) : null}
        {checkInInstructions.map((s, idx) => (
          <EditorListShell
            key={idx}
            title={`Step ${idx + 1}`}
            actions={
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={Boolean(s.isDisplayed)}
                    onChange={(e) =>
                      setCheckInInstructions((prev) =>
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
                  onClick={() =>
                    setCheckInInstructions((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  Remove
                </Button>
              </div>
            }
          >
            <Textarea
              rows={3}
              value={s.instruction}
              onChange={(e) => {
                const v = e.target.value;
                setCheckInInstructions((prev) =>
                  prev.map((it, i) => (i === idx ? { ...it, instruction: v } : it)),
                );
              }}
              placeholder="Step instructions (optional if you only add media)"
              className="mt-2 resize-none"
            />
            <GuestImageSlot
              propertyId={propertyId}
              slot={`checkin:${idx}`}
              value={s.guestImagePath ?? ''}
              onChange={(v) =>
                setCheckInInstructions((prev) =>
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
        disabled={checkInInstructions.length >= checkinStepsLimit}
        onClick={() =>
          setCheckInInstructions((prev) => [
            ...prev,
            { instruction: '', isDisplayed: true, guestImagePath: '' },
          ])
        }
      >
        + Add step
      </Button>
    </PropertyEditorPanel>
  );
}
