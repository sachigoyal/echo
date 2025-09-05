import { Body, Heading } from '../../_components/layout/page-utils';

import { LoadingActivityList } from './_components/list';

export default function ActivityLoadingPage() {
  return (
    <div>
      <Heading
        title="Activity"
        description="Here's what's been happening with your apps"
      />
      <Body>
        <LoadingActivityList />
      </Body>
    </div>
  );
}
