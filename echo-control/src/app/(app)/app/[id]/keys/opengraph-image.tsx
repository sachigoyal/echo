import { appSubpageOgImage } from '@/app/_og/app';

export default async function Image({ params }: PageProps<'/app/[id]/keys'>) {
  const { id } = await params;

  return appSubpageOgImage(id, 'API Keys');
}
