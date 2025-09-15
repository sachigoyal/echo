import { CopyCode } from '@/components/ui/copy-code';
import { Template as TemplateType } from './types';

interface Props {
  appId: string;
  template: TemplateType;
}

export const Template: React.FC<Props> = ({ template, appId }) => {
  return (
    <CopyCode
      code={template.command(appId)}
      toastMessage="Run this command to create your app"
    />
  );
};
