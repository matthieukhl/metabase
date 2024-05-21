import { useMemo, useState } from "react";
import type { InjectedRouter, Route } from "react-router";
import { withRouter } from "react-router";
import { t } from "ttag";
import { findWhere } from "underscore";

import {
  Panel,
  TabWrapper,
} from "metabase/admin/performance/components/StrategyEditorForDatabases.styled";
import { StrategyForm } from "metabase/admin/performance/components/StrategyForm";
import { useCacheConfigs } from "metabase/admin/performance/hooks/useCacheConfigs";
import { useConfirmIfFormIsDirty } from "metabase/admin/performance/hooks/useConfirmIfFormIsDirty";
import { useSaveStrategy } from "metabase/admin/performance/hooks/useSaveStrategy";
import { useVerticallyOverflows } from "metabase/admin/performance/hooks/useVerticallyOverflows";
import type { UpdateTarget } from "metabase/admin/performance/strategies";
import { rootId } from "metabase/admin/performance/strategies";
import { StyledTable } from "metabase/common/components/Table";
import { DelayedLoadingAndErrorWrapper } from "metabase/components/LoadingAndErrorWrapper/DelayedLoadingAndErrorWrapper";
import { Box, Stack } from "metabase/ui";
import type { CacheableModel, CacheConfig } from "metabase-types/api";
import { CacheDurationUnit } from "metabase-types/api";

const StrategyEditorForOverrides_Base = ({
  router,
  route,
}: {
  router: InjectedRouter;
  route?: Route;
}) => {
  const [
    // The targetId is the id of the object that is currently being edited
    targetId,
    setTargetId,
  ] = useState<number | null>(null);

  const [targetModel, setTargetModel] = useState<CacheableModel | null>(null);

  const configurableModels: CacheableModel[] = useMemo(() => {
    return ["dashboard", "question"];
  }, []);

  const {
    configs,
    setConfigs,
    error: configsError,
    loading: areConfigsLoading,
  } = useCacheConfigs({ configurableModels });

  /** The config for the model currently being edited */
  const targetConfig = targetModel
    ? findWhere(configs, {
        model_id: targetId ?? undefined,
        model: targetModel,
      })
    : undefined;
  const savedStrategy = targetConfig?.strategy;

  if (savedStrategy?.type === "duration") {
    savedStrategy.unit = CacheDurationUnit.Hours;
  }

  const {
    askBeforeDiscardingChanges,
    confirmationModal,
    isStrategyFormDirty,
    setIsStrategyFormDirty,
  } = useConfirmIfFormIsDirty(router, route);

  /** Change the target, but first confirm if the form is unsaved */
  const updateTarget: UpdateTarget = (
    { id: newTargetId, model: newTargetModel },
    isFormDirty,
  ) => {
    if (targetId !== newTargetId || targetModel !== newTargetModel) {
      const update = () => {
        setTargetId(newTargetId);
        setTargetModel(newTargetModel);
      };
      isFormDirty ? askBeforeDiscardingChanges(update) : update();
    }
  };

  const {
    verticallyOverflows: formPanelVerticallyOverflows,
    ref: formPanelRef,
  } = useVerticallyOverflows();

  const saveStrategy = useSaveStrategy(
    targetId,
    configs,
    setConfigs,
    "database",
  );

  const error = configsError;
  const loading = areConfigsLoading;
  if (error || loading) {
    return <DelayedLoadingAndErrorWrapper error={error} loading={loading} />;
  }

  return (
    <TabWrapper role="region" aria-label={t`Data caching settings`}>
      <Stack spacing="xl" lh="1.5rem" maw="32rem" mb="1.5rem">
        <aside>
          {t`Dashboards and questions that have their own caching policies.`}
        </aside>
      </Stack>
      {confirmationModal}
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(5rem, 30rem) minmax(5rem, auto)",
          overflow: "hidden",
        }}
        w="100%"
        mx="0"
        mb="1rem"
      >
        <StyledTable<CacheConfig>
          data-testid="overrides-table"
          columns={[
            { key: "name", name: t`Name` },
            { key: "collection", name: t`Collection` },
            { key: "policy", name: t`Policy` },
          ]}
          rows={configs}
          rowRenderer={override => (
            <OverrideRow
              updateTarget={updateTarget}
              currentTargetId={targetId}
              currentTargetModel={targetModel}
              forId={override.id}
              override={override}
              isFormDirty={isStrategyFormDirty}
            />
          )}
        />
        <Panel
          ref={formPanelRef}
          verticallyOverflows={formPanelVerticallyOverflows}
        >
          {targetId !== null && targetModel !== null && (
            <StrategyForm
              targetId={targetId}
              targetModel={targetModel}
              targetName={"targetName"} // FIXME:
              setIsDirty={setIsStrategyFormDirty}
              saveStrategy={saveStrategy}
              savedStrategy={savedStrategy}
              shouldAllowInvalidation={true}
              shouldShowName={targetId !== rootId}
            />
          )}
        </Panel>
      </Box>
    </TabWrapper>
  );
};

export const StrategyEditorForOverrides = withRouter(
  StrategyEditorForOverrides_Base,
);

export type Override = {
  id: number;
  name: string;
  model: CacheableModel;
  collection: string;
  policy: string;
};

export const OverrideRow = ({
  override,
  currentTargetId,
  currentTargetModel,
  updateTarget,
  isFormDirty,
}: {
  override: Override;
  forId: number;
  currentTargetId: number | null;
  currentTargetModel: CacheableModel | null;
  updateTarget: UpdateTarget;
  isFormDirty: boolean;
}) => {
  const { id, name, model, collection, policy } = override;
  const launchForm = () => {
    if (
      currentTargetId !== override.id &&
      currentTargetModel !== override.model
    ) {
      updateTarget({ id, model }, isFormDirty);
    }
  };
  return (
    <tr>
      <td>{name}</td>
      <td>{collection}</td>
      <td>
        <button onClick={launchForm}>{policy}</button>
      </td>
    </tr>
  );
};
