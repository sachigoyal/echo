import { LoadingBreadcrumb } from '../../_components/breadcrumb';
import { Separator } from '../../_components/separator';

export const LoadingAppBreadcrumbs = () => {
  return (
    <>
      <Separator />
      <LoadingBreadcrumb />
      <Separator />
      <LoadingBreadcrumb />
    </>
  );
};
