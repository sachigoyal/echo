import { ogExports } from '@/app/_og/exports';
import { staticPage } from '@/app/_og/static-page';

export const { alt, size, contentType } = ogExports('My Apps');

export default async function Image() {
  return staticPage({
    title: 'My Apps',
    description: 'View and manage your Echo apps',
  });
}
