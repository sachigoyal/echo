import { CopyCode } from '@/components/ui/copy-code';
import { Template as TemplateType } from './types';
import { motion } from 'motion/react';

interface Props {
  appId: string;
  template: TemplateType;
}

export const Template: React.FC<Props> = ({ template, appId }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <CopyCode
        code={template.command(appId)}
        toastMessage="Run this command to create your app"
      />
    </motion.div>
  );
};
