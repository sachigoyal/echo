import { Code as CodeComponent } from '@/components/ui/code';

import { BundledLanguage } from '@/components/ui/code/shiki.bundle';

export const Code: React.FC<{ value: string; lang: BundledLanguage }> = ({
  value,
  lang,
}) => {
  return (
    <div className="border rounded-md overflow-hidden bg-muted">
      <CodeComponent value={value} lang={lang} />
    </div>
  );
};
