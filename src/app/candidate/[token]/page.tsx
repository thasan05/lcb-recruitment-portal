import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ token: string }>;
}

export default async function CandidateLegacyRedirect({ params }: Props) {
  const { token } = await params;
  redirect(`/status/${token}`);
}
