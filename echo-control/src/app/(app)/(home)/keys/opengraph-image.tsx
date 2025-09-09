import { ogExports } from '@/app/_og/exports';
import { staticPage } from '@/app/_og/static-page';

export const { alt, size, contentType } = ogExports('API Keys');

export default async function Image() {
  return staticPage({
    title: 'API Keys',
    description: 'Manage and create API keys to use in Echo apps',
  });
}
