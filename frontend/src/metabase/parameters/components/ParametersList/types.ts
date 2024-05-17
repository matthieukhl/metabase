import type {
  DashboardFullscreenControls,
  DashboardHideParametersControls,
  DashboardThemeControls,
} from "metabase/dashboard/hoc/controls";
import type Question from "metabase-lib/v1/Question";
import type { Dashboard, Parameter, ParameterId } from "metabase-types/api";

export type ParametersListProps = {
  parameters: Parameter[];
} & Partial<
  {
    className?: string;
    question?: Question;
    dashboard?: Dashboard | null;
    editingParameter?: Parameter | null;
    isEditing?: boolean;
    vertical?: boolean;
    commitImmediately?: boolean;
    setParameterValueToDefault?: (parameterId: ParameterId) => void;
    setParameterValue?: (parameterId: ParameterId, value: string) => void;
    setParameterIndex?: (id: ParameterId, index: number) => void;
    setEditingParameter?: (id: ParameterId) => void;
    enableParameterRequiredBehavior?: boolean;
  } & Pick<DashboardFullscreenControls, "isFullscreen"> &
    Pick<DashboardThemeControls, "isNightMode"> &
    Pick<DashboardHideParametersControls, "hideParameters">
>;
