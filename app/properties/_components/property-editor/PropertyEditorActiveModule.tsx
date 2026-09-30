import type { PropertyEditorModuleId } from '@/app/properties/_components/property-editor/property-editor-modules';
import type { PropertyFormModuleSharedProps } from '@/app/properties/_components/property-editor/property-form-types';
import HeroModule from '@/app/properties/_components/property-editor/modules/HeroModule';
import DetailsModule from '@/app/properties/_components/property-editor/modules/DetailsModule';
import CheckInModule from '@/app/properties/_components/property-editor/modules/CheckInModule';
import RulesModule from '@/app/properties/_components/property-editor/modules/RulesModule';
import FaqModule from '@/app/properties/_components/property-editor/modules/FaqModule';
import CustomModule from '@/app/properties/_components/property-editor/modules/CustomModule';
import HostModule from '@/app/properties/_components/property-editor/modules/HostModule';
import SocialModule from '@/app/properties/_components/property-editor/modules/SocialModule';
import IcalModule from '@/app/properties/_components/property-editor/modules/IcalModule';
import SectionOrderModule from '@/app/properties/_components/property-editor/modules/SectionOrderModule';
import DangerZoneModule from '@/app/properties/_components/property-editor/modules/DangerZoneModule';

export default function PropertyEditorActiveModule({
  activeModule,
  ...props
}: { activeModule: PropertyEditorModuleId } & PropertyFormModuleSharedProps) {
  switch (activeModule) {
    case 'hero':
      return <HeroModule {...props} />;
    case 'property-details':
      return <DetailsModule {...props} />;
    case 'checkin':
      return <CheckInModule {...props} />;
    case 'house-rules':
      return <RulesModule {...props} />;
    case 'faq':
      return <FaqModule {...props} />;
    case 'custom-blocks':
      return <CustomModule {...props} />;
    case 'host-contact':
      return <HostModule {...props} />;
    case 'social-links':
      return <SocialModule {...props} />;
    case 'ical-sync':
      return props.propertyId ? <IcalModule propertyId={props.propertyId} /> : null;
    case 'section-order':
      return <SectionOrderModule {...props} />;
    case 'danger-zone':
      return (
        <DangerZoneModule
          submitting={props.submitting}
          deleting={props.deleting}
          onDeleteProperty={props.onDeleteProperty}
        />
      );
    default:
      return null;
  }
}
