import { NotFoundScreen } from '@/components/error/screen';
import { ErrorComponentProps } from '@/components/error/types';

export const AppGroupNotFound: React.FC<ErrorComponentProps> = props => {
  return (
    <div className="flex flex-col flex-1">
      <div className="h-4 border-b bg-card" />
      <NotFoundScreen {...props} />
    </div>
  );
};
