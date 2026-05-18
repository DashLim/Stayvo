import Link from 'next/link';
import { STAYVO_PRO_PROFILE_HREF } from '@/lib/stayvo-pro';

type StayvoProLinkProps = {
  className?: string;
};

export default function StayvoProLink({ className = '' }: StayvoProLinkProps) {
  return (
    <Link
      href={STAYVO_PRO_PROFILE_HREF}
      className={`font-semibold text-brand underline-offset-2 hover:underline ${className}`.trim()}
    >
      Stayvo Pro
    </Link>
  );
}
