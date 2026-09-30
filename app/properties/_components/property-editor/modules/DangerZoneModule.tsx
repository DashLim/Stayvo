import { Button } from '@/components/ui/button';
import PropertyEditorPanel from '@/app/properties/_components/property-editor/PropertyEditorPanel';

export default function DangerZoneModule({
  submitting,
  deleting,
  onDeleteProperty,
}: {
  submitting: boolean;
  deleting: boolean;
  onDeleteProperty: () => void | Promise<void>;
}) {
  return (
    <PropertyEditorPanel
      title="Danger zone"
      description="Permanently delete this property and all guest links created for it."
      className="border-destructive/30"
    >
      <Button
        type="button"
        variant="destructive"
        onClick={() => void onDeleteProperty()}
        disabled={submitting || deleting}
      >
        {deleting ? 'Deleting…' : 'Delete property'}
      </Button>
    </PropertyEditorPanel>
  );
}
