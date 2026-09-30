'use client';

import { DndContext, closestCorners } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import {
  FIXED_BOTTOM_SECTIONS,
  FIXED_TOP_SECTIONS,
} from '@/lib/guest-layout';
import PropertyEditorPanel from '@/app/properties/_components/property-editor/PropertyEditorPanel';
import type { PropertyFormModuleSharedProps } from '@/app/properties/_components/property-editor/property-form-types';

const SECTION_LABELS: Record<string, string> = {
  address: 'Address',
  parking: 'Parking',
  checkin: 'Check-in',
  wifi: 'Wi-Fi',
  faq: 'FAQ',
  rules: 'House rules',
  host: 'Host contact',
};

function FixedSectionRow({ sectionKey }: { sectionKey: string }) {
  const label = SECTION_LABELS[sectionKey] ?? sectionKey;
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5 opacity-90">
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="ml-auto shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Fixed
      </span>
    </li>
  );
}

function SortableSectionRow({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const label = id.startsWith('custom:')
    ? `Custom block ${id.replace('custom:', '')}`
    : (SECTION_LABELS[id] ?? id);
  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex touch-none cursor-grab select-none active:cursor-grabbing items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 [-webkit-touch-callout:none]"
    >
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </li>
  );
}

export default function SectionOrderModule({
  middleSectionKeys,
  sectionOrderSensors,
  onSectionDragEnd,
}: Pick<
  PropertyFormModuleSharedProps,
  'middleSectionKeys' | 'sectionOrderSensors' | 'onSectionDragEnd'
>) {
  return (
    <PropertyEditorPanel
      title="Section order"
      description="Drag movable sections. Top and bottom sections stay fixed on the guest page."
    >
      <DndContext
        sensors={sectionOrderSensors}
        collisionDetection={closestCorners}
        onDragEnd={onSectionDragEnd}
      >
        <ul className="space-y-2">
          {FIXED_TOP_SECTIONS.map((key) => (
            <FixedSectionRow key={key} sectionKey={key} />
          ))}
          <SortableContext
            id="guest-section-order"
            items={middleSectionKeys}
            strategy={verticalListSortingStrategy}
          >
            {middleSectionKeys.map((key) => (
              <SortableSectionRow key={key} id={key} />
            ))}
          </SortableContext>
          {FIXED_BOTTOM_SECTIONS.map((key) => (
            <FixedSectionRow key={key} sectionKey={key} />
          ))}
        </ul>
      </DndContext>
    </PropertyEditorPanel>
  );
}
