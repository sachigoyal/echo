import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { ExampleCards } from '@/components/docs/example-cards';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import { createGenerator } from 'fumadocs-typescript';
import { AutoTypeTable } from 'fumadocs-typescript/ui';

const generator = createGenerator();

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    ExampleCards,
    AutoTypeTable: (props: React.ComponentProps<typeof AutoTypeTable>) => (
      <AutoTypeTable {...props} generator={generator} />
    ),
    ...components,
  };
}
