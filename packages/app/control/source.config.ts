import { defineDocs } from 'fumadocs-mdx/config';
import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins';

export const docs = defineDocs({
  dir: 'docs',
  mdxOptions: {
    remarkPlugins: [remarkMdxMermaid],
  },
});
