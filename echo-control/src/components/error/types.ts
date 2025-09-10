import { NextErrorProps } from '@/types/next-error';
import { LucideIcon } from 'lucide-react';

export interface ErrorComponentProps {
  title: string;
  description: string;
  errorProps: NextErrorProps;
  Icon?: LucideIcon;
}
