import PropertyForm from '@/app/properties/_components/PropertyForm';

export default function NewPropertyPage() {
  return (
    <PropertyForm
      mode="create"
      initialValues={{
        isLive: false,
        checkInInstructions: [],
        houseRules: [],
        guidebookTips: [],
      }}
    />
  );
}

