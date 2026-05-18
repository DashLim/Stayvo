import StayvoProLink from '@/app/_components/StayvoProLink';

const STAYVO_PRO = 'Stayvo Pro';

/** Renders plain text with every “Stayvo Pro” phrase as a themed profile link. */
export default function StayvoProMessage({ text }: { text: string }) {
  if (!text.includes(STAYVO_PRO)) {
    return <>{text}</>;
  }

  const parts = text.split(STAYVO_PRO);
  return (
    <>
      {parts.map((part, index) => (
        <span key={index}>
          {part}
          {index < parts.length - 1 ? <StayvoProLink /> : null}
        </span>
      ))}
    </>
  );
}
