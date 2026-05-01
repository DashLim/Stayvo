import PropertyForm from '@/app/properties/_components/PropertyForm';
import { BASE_SECTION_KEYS } from '@/lib/guest-layout';

export default function NewPropertyPage() {
  return (
    <PropertyForm
      mode="create"
      initialValues={{
        isLive: false,
        checkInInstructions: [],
        houseRules: [],
        guidebookTips: [],
        customDetails: [],
        guestSectionOrder: [...BASE_SECTION_KEYS],
      }}
    />
  );
}

