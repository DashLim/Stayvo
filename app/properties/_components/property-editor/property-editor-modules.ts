import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CalendarSync,
  CircleHelp,
  GripVertical,
  ImageIcon,
  LayoutList,
  Link2,
  ListChecks,
  ScrollText,
  Sparkles,
  UserRound,
} from 'lucide-react';
import type { PropertyFormSectionId } from '@/lib/property-form-sections';

/** Editor module ids align with legacy section ids where possible. */
export type PropertyEditorModuleId =
  | PropertyFormSectionId
  | 'section-order';

export type PropertyEditorModuleDef = {
  id: PropertyEditorModuleId;
  label: string;
  shortLabel?: string;
  description: string;
  icon: LucideIcon;
  /** Hidden on create flow when false */
  editOnly?: boolean;
};

export const PROPERTY_EDITOR_MODULES: PropertyEditorModuleDef[] = [
  {
    id: 'hero',
    label: 'Hero',
    description: 'Cover image at the top of the guest portal.',
    icon: ImageIcon,
  },
  {
    id: 'property-details',
    label: 'Details',
    description: 'Property name, address, Wi‑Fi, and status.',
    icon: LayoutList,
  },
  {
    id: 'checkin',
    label: 'Check-in',
    description: 'Step-by-step arrival instructions.',
    icon: ListChecks,
  },
  {
    id: 'house-rules',
    label: 'Rules',
    description: 'House rules guests must follow.',
    icon: ScrollText,
  },
  {
    id: 'faq',
    label: 'FAQ',
    description: 'Common questions and answers.',
    icon: CircleHelp,
  },
  {
    id: 'custom-blocks',
    label: 'Custom',
    description: 'Extra sections on the guest page.',
    icon: Sparkles,
  },
  {
    id: 'host-contact',
    label: 'Host',
    description: 'How guests reach you.',
    icon: UserRound,
  },
  {
    id: 'social-links',
    label: 'Social',
    description: 'Social and booking links.',
    icon: Link2,
  },
  {
    id: 'ical-sync',
    label: 'iCal',
    description: 'OTA calendar sync.',
    icon: CalendarSync,
    editOnly: true,
  },
  {
    id: 'section-order',
    label: 'Section order',
    shortLabel: 'Order',
    description: 'Reorder movable guest page sections.',
    icon: GripVertical,
    editOnly: true,
  },
  {
    id: 'danger-zone',
    label: 'Danger zone',
    description: 'Permanently delete this property.',
    icon: AlertTriangle,
    editOnly: true,
  },
];

export function modulesForMode(mode: 'create' | 'edit'): PropertyEditorModuleDef[] {
  return PROPERTY_EDITOR_MODULES.filter((m) => !m.editOnly || mode === 'edit');
}

export function propertyEditorModuleStorageKey(
  propertyId: string | undefined,
  mode: 'create' | 'edit',
) {
  return `stayvo-property-editor-module:${propertyId ?? (mode === 'create' ? 'new' : 'unknown')}`;
}
