import { ogExports } from '@/app/_og/exports';
import { staticPage } from '@/app/_og/static-page';

export const { alt, size, contentType } = ogExports('Creator Earnings');

export default async function Image() {
  return staticPage({
    title: 'Creator Earnings',
    description: 'View and claim your app markup earnings.',
  });
}
