import type { Location } from "history";

import type { DashboardId } from "metabase-types/api";

import type { DashboardDisplayOptionControls } from "../types";

export type DashboardControlsProps = {
  location: Location;
  dashboardId?: DashboardId;
  params?: {
    uuid?: string;
    token?: string;
  } & Record<string, string | string[] | null | undefined>;
};

export type DashboardControlsPassedProps = DashboardDisplayOptionControls & {
  location: Location;
  dashboardId: DashboardId;
} & {
  queryParams: Record<string, string | string[] | null | undefined>;
};
