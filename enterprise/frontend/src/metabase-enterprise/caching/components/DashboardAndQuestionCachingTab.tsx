import { t } from "ttag";

import { TabId } from "metabase/admin/performance/components/PerformanceApp";
import { Tab } from "metabase/admin/performance/components/PerformanceApp.styled";

export const DashboardAndQuestionCachingTab = () => {
  return (
    <Tab
      key="DashboardAndQuestionCaching"
      value={TabId.DashboardAndQuestionCaching}
    >
      {t`Dashboard and question caching`}
    </Tab>
  );
};
