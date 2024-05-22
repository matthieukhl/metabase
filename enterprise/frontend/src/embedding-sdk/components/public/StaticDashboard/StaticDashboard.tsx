import {
  DEFAULT_EMBED_DISPLAY_OPTIONS,
  useDashboardFullscreen,
  useDashboardRefreshPeriod,
  useEmbedTheme,
  useRefreshDashboard,
} from "metabase/dashboard/hooks";
import type {
  EmbedDisplayParams,
  RefreshPeriod,
} from "metabase/dashboard/types";
import { PublicDashboardRaw } from "metabase/public/containers/PublicDashboard/PublicDashboard";
import type {
  DashboardId,
  ParameterId,
  ParameterValueOrArray,
} from "metabase-types/api";

export const StaticDashboard = ({
  dashboardId,
  parameterValues,
  refreshPeriod: initialRefreshPeriod = null,
  displayOptions = {},
}: {
  dashboardId: DashboardId;
  parameterValues: Record<ParameterId, ParameterValueOrArray | null>;
  refreshPeriod?: RefreshPeriod;
  displayOptions?: Partial<EmbedDisplayParams>;
}) => {
  const options: EmbedDisplayParams = {
    ...DEFAULT_EMBED_DISPLAY_OPTIONS,
    ...displayOptions,
  };

  const { refreshDashboard } = useRefreshDashboard({
    dashboardId,
    queryParams: parameterValues,
  });
  const { isFullscreen, onFullscreenChange } = useDashboardFullscreen();
  const { onRefreshPeriodChange, refreshPeriod, setRefreshElapsedHook } =
    useDashboardRefreshPeriod({
      onRefresh: refreshDashboard,
      initialRefreshPeriod,
    });

  const { hasNightModeToggle, isNightMode, onNightModeChange, theme } =
    useEmbedTheme(options.theme);

  return (
    <PublicDashboardRaw
      dashboardId={dashboardId}
      queryParams={parameterValues}
      bordered={options.bordered}
      font={options.font}
      hasNightModeToggle={hasNightModeToggle}
      hideDownloadButton={options.hideDownloadButton}
      hideParameters={options.hideParameters}
      isNightMode={isNightMode}
      onNightModeChange={onNightModeChange}
      theme={theme}
      titled={options.titled}
      isFullscreen={isFullscreen}
      onFullscreenChange={onFullscreenChange}
      refreshPeriod={refreshPeriod}
      onRefreshPeriodChange={onRefreshPeriodChange}
      setRefreshElapsedHook={setRefreshElapsedHook}
    />
  );
};
