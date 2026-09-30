import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PropertyEditorPanel from '@/app/properties/_components/property-editor/PropertyEditorPanel';
import { EditorEmptyState, EditorListShell } from '@/app/properties/_components/property-editor/editor-ui';
import type { PropertyFormModuleSharedProps } from '@/app/properties/_components/property-editor/property-form-types';

export default function RulesModule({
  houseRules,
  setHouseRules,
}: Pick<PropertyFormModuleSharedProps, 'houseRules' | 'setHouseRules'>) {
  return (
    <PropertyEditorPanel title="House rules" description="Add rules guests must follow.">
      <div className="space-y-3">
        {houseRules.length === 0 ? (
          <EditorEmptyState>No rules yet. Add a rule below.</EditorEmptyState>
        ) : null}
        {houseRules.map((r, idx) => (
          <EditorListShell
            key={idx}
            title={`Rule ${idx + 1}`}
            actions={
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={Boolean(r.isDisplayed)}
                    onChange={(e) =>
                      setHouseRules((prev) =>
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
                  onClick={() => setHouseRules((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Remove
                </Button>
              </div>
            }
          >
            <Input
              value={r.ruleText}
              onChange={(e) => {
                const v = e.target.value;
                setHouseRules((prev) =>
                  prev.map((it, i) => (i === idx ? { ...it, ruleText: v } : it)),
                );
              }}
              className="mt-2"
            />
          </EditorListShell>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => setHouseRules((prev) => [...prev, { ruleText: '', isDisplayed: true }])}
      >
        + Add rule
      </Button>
    </PropertyEditorPanel>
  );
}
