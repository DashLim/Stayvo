import IcalFeedPanel from '@/app/properties/_components/IcalFeedPanel';
import PropertyEditorPanel from '@/app/properties/_components/property-editor/PropertyEditorPanel';

export default function IcalModule({ propertyId }: { propertyId: string }) {
  return (
    <PropertyEditorPanel
      title="OTA calendar sync"
      description="Paste your Airbnb, Booking.com, or VRBO iCal export URL. Stayvo Check-in checks for new bookings about every hour and creates or extends guest links from checkout dates."
    >
      <IcalFeedPanel propertyId={propertyId} embedded />
    </PropertyEditorPanel>
  );
}
