import { ogExports } from '@/app/_og/exports';
import { staticPage } from '@/app/_og/static-page';

export const { alt, size, contentType } = ogExports('Referral Earnings');

export default async function Image() {
  return staticPage({
    title: 'Referral Earnings',
    description: 'View and claim your referral earnings.',
  });
}
