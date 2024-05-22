import {
  useDashboardFullscreen,
  useDashboardRefreshPeriod,
  useEmbedDisplayOptions,
  useRefreshDashboard,
} from "metabase/dashboard/hooks";
import type { DashboardDisplayOptionControls } from "metabase/dashboard/types";
import { PublicDashboardRaw } from "metabase/public/containers/PublicDashboard/PublicDashboard";
import type {
  DashboardId,
  ParameterId,
  ParameterValueOrArray,
} from "metabase-types/api";

export const StaticDashboard = ({
  dashboardId,
  parameterValues,
  displayOptions,
}: {
  dashboardId: DashboardId;
  parameterValues: Record<ParameterId, ParameterValueOrArray | null>;
  displayOptions?: DashboardDisplayOptionControls;
}) => {
  const {
    bordered,
    font,
    hasNightModeToggle,
    hideDownloadButton,
    hideParameters,
    isNightMode,
    onNightModeChange,
    setBordered,
    setFont,
    setHideDownloadButton,
    setHideParameters,
    setTheme,
    setTitled,
    theme,
    titled,
  } = useEmbedDisplayOptions(displayOptions);

  const { refreshDashboard } = useRefreshDashboard({
    dashboardId,
    queryParams: parameterValues,
  });
  const { isFullscreen, onFullscreenChange } = useDashboardFullscreen();
  const { onRefreshPeriodChange, refreshPeriod, setRefreshElapsedHook } =
    useDashboardRefreshPeriod({
      onRefresh: refreshDashboard,
      initialRefreshPeriod: displayOptions?.refreshPeriod,
    });

  return (
    <PublicDashboardRaw
      dashboardId={dashboardId}
      queryParams={parameterValues}
      bordered={bordered}
      font={font}
      hasNightModeToggle={hasNightModeToggle}
      hideDownloadButton={hideDownloadButton}
      hideParameters={hideParameters}
      isNightMode={isNightMode}
      onNightModeChange={onNightModeChange}
      setBordered={setBordered}
      setFont={setFont}
      setHideDownloadButton={setHideDownloadButton}
      setHideParameters={setHideParameters}
      setTheme={setTheme}
      setTitled={setTitled}
      theme={theme}
      titled={titled}
      isFullscreen={isFullscreen}
      onFullscreenChange={onFullscreenChange}
      refreshPeriod={refreshPeriod}
      onRefreshPeriodChange={onRefreshPeriodChange}
      setRefreshElapsedHook={setRefreshElapsedHook}
    />
  );
};
