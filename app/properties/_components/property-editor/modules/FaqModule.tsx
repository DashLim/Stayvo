import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PropertyEditorPanel from '@/app/properties/_components/property-editor/PropertyEditorPanel';
import {
  EditorEmptyState,
  EditorListShell,
  FieldGroup,
} from '@/app/properties/_components/property-editor/editor-ui';
import type { PropertyFormModuleSharedProps } from '@/app/properties/_components/property-editor/property-form-types';

export default function FaqModule({
  faqs,
  setFaqs,
}: Pick<PropertyFormModuleSharedProps, 'faqs' | 'setFaqs'>) {
  return (
    <PropertyEditorPanel
      title="FAQ"
      description="Add common guest questions and answers. Leave empty to hide this section."
    >
      <div className="space-y-3">
        {faqs.length === 0 ? <EditorEmptyState>No FAQ entries yet.</EditorEmptyState> : null}
        {faqs.map((f, idx) => (
          <EditorListShell
            key={idx}
            title={`FAQ ${idx + 1}`}
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setFaqs((prev) => prev.filter((_, i) => i !== idx))}
              >
                Remove
              </Button>
            }
          >
            <div className="mt-2 grid gap-3">
              <FieldGroup label="Question">
                <Input
                  value={f.question}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFaqs((prev) =>
                      prev.map((it, i) => (i === idx ? { ...it, question: v } : it)),
                    );
                  }}
                  placeholder="e.g. What time is check-in?"
                />
              </FieldGroup>
              <FieldGroup label="Answer">
                <Textarea
                  value={f.answer}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFaqs((prev) =>
                      prev.map((it, i) => (i === idx ? { ...it, answer: v } : it)),
                    );
                  }}
                  placeholder="e.g. Check-in starts at 3 PM. Self check-in instructions are in the Check-in section."
                  rows={3}
                  className="resize-none"
                />
              </FieldGroup>
            </div>
          </EditorListShell>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => setFaqs((prev) => [...prev, { question: '', answer: '' }])}
      >
        + Add FAQ
      </Button>
    </PropertyEditorPanel>
  );
}
