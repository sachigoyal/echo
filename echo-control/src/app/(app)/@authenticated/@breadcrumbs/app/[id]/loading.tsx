import { LoadingBreadcrumb } from '../../_components/breadcrumb';
import { Separator } from '../../_components/separator';

export default function Loading() {
  return (
    <>
      <Separator />
      <LoadingBreadcrumb />
      <Separator />
      <LoadingBreadcrumb />
    </>
  );
}
