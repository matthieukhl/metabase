import type {
  DashboardFullscreenControls,
  EmbedHideParametersControls,
  EmbedThemeControls,
} from "metabase/dashboard/hoc/controls";
import type Question from "metabase-lib/v1/Question";
import type { Dashboard, Parameter, ParameterId } from "metabase-types/api";

export type ParametersListProps = {
  parameters: Parameter[];
  setParameterValue: (parameterId: ParameterId, value: any) => void;
} & Partial<
  {
    className: string;
    question: Question | null;
    dashboard: Dashboard | null;
    editingParameter?: Parameter | null;
    isEditing: boolean;
    vertical: boolean;
    commitImmediately: boolean;
    setParameterValueToDefault: (parameterId: ParameterId) => void;
    setParameterIndex: (id: ParameterId, index: number) => void;
    setEditingParameter: (id: ParameterId) => void;
    enableParameterRequiredBehavior: boolean;
  } & Pick<DashboardFullscreenControls, "isFullscreen"> &
    Pick<EmbedThemeControls, "isNightMode"> &
    Pick<EmbedHideParametersControls, "hideParameters">
>;
