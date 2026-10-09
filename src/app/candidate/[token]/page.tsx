import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function CandidateLegacyRedirect({ params }: Props) {
  const { token } = await params;
  redirect(`/status/${token}`);
}
