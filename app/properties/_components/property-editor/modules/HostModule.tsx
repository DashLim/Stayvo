import { Input } from '@/components/ui/input';
import PropertyEditorPanel from '@/app/properties/_components/property-editor/PropertyEditorPanel';
import { FieldGroup } from '@/app/properties/_components/property-editor/editor-ui';
import type { PropertyFormModuleSharedProps } from '@/app/properties/_components/property-editor/property-form-types';

export default function HostModule({
  hostName,
  setHostName,
  hostWhatsappNumber,
  setHostWhatsappNumber,
  hostWhatsappChatNumber,
  setHostWhatsappChatNumber,
}: Pick<
  PropertyFormModuleSharedProps,
  | 'hostName'
  | 'setHostName'
  | 'hostWhatsappNumber'
  | 'setHostWhatsappNumber'
  | 'hostWhatsappChatNumber'
  | 'setHostWhatsappChatNumber'
>) {
  return (
    <PropertyEditorPanel title="Host contact" description="How guests reach you.">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Host name">
          <Input value={hostName} onChange={(e) => setHostName(e.target.value)} />
        </FieldGroup>
        <FieldGroup label="Call">
          <Input
            value={hostWhatsappNumber}
            onChange={(e) => setHostWhatsappNumber(e.target.value)}
            placeholder="+1 555 123 4567"
          />
        </FieldGroup>
        <FieldGroup label="WhatsApp" className="sm:col-span-2">
          <Input
            value={hostWhatsappChatNumber}
            onChange={(e) => setHostWhatsappChatNumber(e.target.value)}
            placeholder="+1 555 987 6543"
          />
        </FieldGroup>
      </div>
    </PropertyEditorPanel>
  );
}
