import { ErrorComponentProps } from './types';

export const ErrorScreen: React.FC<ErrorComponentProps> = ({
  title,
  description,
  errorProps,
  Icon = AlertCircle,
}) => {
  return <div>ErrorScreen</div>;
};
