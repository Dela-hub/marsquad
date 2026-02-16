import { redirect } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return { title: `${roomId} — Explorer` };
}

export default async function Explorer3DPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  redirect(`/room/${roomId}/explorer`);
}
