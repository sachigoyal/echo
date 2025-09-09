import { ogExports } from '@/app/_og/exports';
import { staticPage } from '@/app/_og/static-page';

export const { alt, size, contentType } = ogExports('Credits');

export default async function Image() {
  return staticPage({
    title: 'Credits',
    description:
      'Echo credits can be used to make LLM requests on any Echo app',
  });
}
