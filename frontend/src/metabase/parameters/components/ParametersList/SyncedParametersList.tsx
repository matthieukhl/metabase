import { useSyncedQueryString } from "metabase/hooks/use-synced-query-string";
import { getParameterValuesBySlug } from "metabase-lib/v1/parameters/utils/parameter-values";

import { ParametersList } from "./ParametersList";
import type { ParametersListProps } from "./types";

export const SyncedParametersList = ({
  parameters,
  editingParameter,
  question,
  dashboard,

  className,
  hideParameters,

  isFullscreen,
  isNightMode,
  isEditing,
  commitImmediately,

  setParameterValue,
  setParameterIndex,
  setEditingParameter,
  setParameterValueToDefault,
  enableParameterRequiredBehavior,
}: ParametersListProps) => {
  useSyncedQueryString(
    () => getParameterValuesBySlug(parameters),
    [parameters],
  );

  return (
    <ParametersList
      className={className}
      parameters={parameters}
      question={question}
      dashboard={dashboard}
      editingParameter={editingParameter}
      isFullscreen={isFullscreen}
      isNightMode={isNightMode}
      hideParameters={hideParameters}
      isEditing={isEditing}
      commitImmediately={commitImmediately}
      setParameterValue={setParameterValue}
      setParameterIndex={setParameterIndex}
      setEditingParameter={setEditingParameter}
      setParameterValueToDefault={setParameterValueToDefault}
      enableParameterRequiredBehavior={enableParameterRequiredBehavior}
    />
  );
};
