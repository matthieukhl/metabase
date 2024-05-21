import { useLayoutEffect, useRef, useState } from "react";
import type { Route } from "react-router";
import { t } from "ttag";

import { PLUGIN_CACHING } from "metabase/plugins";
import type { TabsValue } from "metabase/ui";
import { Tabs } from "metabase/ui";

import { Tab, TabBody, TabsList, TabsPanel } from "./PerformanceApp.styled";
import { StrategyEditorForDatabases } from "./StrategyEditorForDatabases";

export enum TabId {
  DataCachingSettings = "dataCachingSettings",
  DashboardAndQuestionCaching = "dashboardAndQuestionCaching",
}
const validTabIds = new Set(Object.values(TabId).map(String));
const isValidTabId = (tab: TabsValue): tab is TabId =>
  !!tab && validTabIds.has(tab);

export const PerformanceApp = ({ route }: { route: Route }) => {
  const [tabId, setTabId] = useState<TabId>(TabId.DataCachingSettings);
  const [tabsHeight, setTabsHeight] = useState<number>(300);
  const tabsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const handleResize = () => {
      const tabs = tabsRef?.current;
      if (!tabs) {
        return;
      }
      const tabsElementTop = tabs.getBoundingClientRect().top;
      const newHeight = window.innerHeight - tabsElementTop - tabs.clientTop;
      setTabsHeight(newHeight);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    // TODO: Is this needed?
    // setTimeout(handleResize, 50);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [tabsRef, setTabsHeight]);

  return (
    <Tabs
      value={tabId}
      onTabChange={value => {
        if (isValidTabId(value)) {
          setTabId(value);
        } else {
          console.error("Invalid tab value", value);
        }
      }}
      style={{ display: "flex", flexDirection: "column" }}
      ref={tabsRef}
      bg="bg-light"
      h={tabsHeight}
    >
      <TabsList>
        <Tab key="DataCachingSettings" value={TabId.DataCachingSettings}>
          {t`Data caching settings`}
        </Tab>
        <PLUGIN_CACHING.DashboardAndQuestionCachingTab />
      </TabsList>
      <TabsPanel key={tabId} value={tabId} p="1rem 2.5rem">
        {tabId === TabId.DataCachingSettings && (
          <TabBody>
            <StrategyEditorForDatabases route={route} />
          </TabBody>
        )}
        {tabId === TabId.DashboardAndQuestionCaching && (
          <TabBody>
            <PLUGIN_CACHING.StrategyEditorForOverrides route={route} />
          </TabBody>
        )}
      </TabsPanel>
    </Tabs>
  );
};
