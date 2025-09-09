import { appSubpageOgImage } from '@/app/_og/app';

export default async function Image({
  params,
}: PageProps<'/app/[id]/free-tier'>) {
  const { id } = await params;

  return appSubpageOgImage(id, 'Free Tier');
}
