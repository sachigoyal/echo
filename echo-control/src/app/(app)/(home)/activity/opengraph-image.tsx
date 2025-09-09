import { ogExports } from '@/app/_og/exports';
import { staticPage } from '@/app/_og/static-page';

export const { alt, size, contentType } = ogExports('Activity');

export default async function Image() {
  return staticPage({
    title: 'Activity',
    description: "See what's happening with your apps",
  });
}
