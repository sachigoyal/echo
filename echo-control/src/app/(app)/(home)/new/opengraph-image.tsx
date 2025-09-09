import { ogExports } from '@/app/_og/exports';
import { staticPage } from '@/app/_og/static-page';

export const { alt, size, contentType } = ogExports('New App');

export default async function Image() {
  return staticPage({
    title: 'New App',
    description: 'Create a new Echo app to start earning on LLM requests',
  });
}
