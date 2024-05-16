import type { BarSeriesOption, LineSeriesOption } from "echarts/charts";
import type { CallbackDataParams } from "echarts/types/dist/shared";
import type { SeriesLabelOption } from "echarts/types/src/util/types";
import _ from "underscore";

import { getTextColorForBackground } from "metabase/lib/colors/palette";
import { getObjectValues } from "metabase/lib/objects";
import { isNotNull } from "metabase/lib/types";
import {
  NEGATIVE_STACK_TOTAL_DATA_KEY,
  ORIGINAL_INDEX_DATA_KEY,
  POSITIVE_STACK_TOTAL_DATA_KEY,
  X_AXIS_DATA_KEY,
} from "metabase/visualizations/echarts/cartesian/constants/dataset";
import {
  CHART_STYLE,
  LINE_SIZE,
} from "metabase/visualizations/echarts/cartesian/constants/style";
import type {
  SeriesModel,
  CartesianChartModel,
  DataKey,
  StackTotalDataKey,
  ChartDataset,
  Datum,
  XAxisModel,
  TimeSeriesXAxisModel,
  NumericXAxisModel,
  NumericAxisScaleTransforms,
  LabelFormatter,
  StackModel,
} from "metabase/visualizations/echarts/cartesian/model/types";
import type { EChartsSeriesOption } from "metabase/visualizations/echarts/cartesian/option/types";
import type {
  ComputedVisualizationSettings,
  RenderingContext,
} from "metabase/visualizations/types";
import type { SeriesSettings } from "metabase-types/api";

import type { ChartMeasurements } from "../chart-measurements/types";
import {
  isCategoryAxis,
  isNumericAxis,
  isTimeSeriesAxis,
} from "../model/guards";
import { getStackTotalValue } from "../model/series";
import { buildEChartsScatterSeries } from "../scatter/series";

import { getSeriesYAxisIndex } from "./utils";

const getBlurLabelStyle = (
  settings: ComputedVisualizationSettings,
  hasMultipleSeries: boolean,
) => ({
  show: settings["graph.show_values"] && !hasMultipleSeries,
  opacity: 1,
});

export const getBarLabelLayout =
  (
    dataset: ChartDataset,
    settings: ComputedVisualizationSettings,
    seriesDataKey: DataKey,
  ): BarSeriesOption["labelLayout"] =>
  params => {
    const { dataIndex, rect } = params;
    if (dataIndex == null) {
      return {};
    }

    const labelValue = dataset[dataIndex][seriesDataKey];
    if (typeof labelValue !== "number") {
      return {};
    }

    const barHeight = rect.height;
    const labelOffset =
      barHeight / 2 +
      CHART_STYLE.seriesLabels.size / 2 +
      CHART_STYLE.seriesLabels.offset;
    return {
      hideOverlap: settings["graph.label_value_frequency"] === "fit",
      dy: labelValue < 0 ? labelOffset : -labelOffset,
    };
  };

export const getBarInsideLabelLayout =
  (
    dataset: ChartDataset,
    settings: ComputedVisualizationSettings,
    seriesDataKey: DataKey,
  ): BarSeriesOption["labelLayout"] =>
  params => {
    const { dataIndex, rect, labelRect } = params;
    if (dataIndex == null) {
      return {};
    }

    const canFitWithoutRotation =
      rect.width > labelRect.width && rect.height > labelRect.height;

    if (!canFitWithoutRotation) {
      return {
        fontSize: 0,
      };
    }

    const labelValue = dataset[dataIndex][seriesDataKey];
    if (typeof labelValue !== "number") {
      return {};
    }

    return {
      hideOverlap: settings["graph.label_value_frequency"] === "fit",
    };
  };

export function getDataLabelFormatter(
  dataKey: DataKey,
  yAxisScaleTransforms: NumericAxisScaleTransforms,
  formatter: LabelFormatter,
) {
  return (params: CallbackDataParams) => {
    const value = (params.data as Datum)[dataKey];

    if (typeof value !== "number") {
      return " ";
    }
    return formatter(yAxisScaleTransforms.fromEChartsAxisValue(value));
  };
}

export const buildEChartsLabelOptions = (
  seriesModel: SeriesModel,
  yAxisScaleTransforms: NumericAxisScaleTransforms,
  renderingContext: RenderingContext,
  formatter?: LabelFormatter,
  position?: "top" | "bottom" | "inside",
): SeriesLabelOption => {
  return {
    silent: true,
    show: !!formatter,
    position,
    opacity: 1,
    fontFamily: renderingContext.fontFamily,
    fontWeight: CHART_STYLE.seriesLabels.weight,
    fontSize: CHART_STYLE.seriesLabels.size,
    color: renderingContext.getColor("text-dark"),
    textBorderColor: renderingContext.getColor("white"),
    textBorderWidth: 3,
    formatter:
      formatter &&
      getDataLabelFormatter(
        seriesModel.dataKey,
        yAxisScaleTransforms,
        formatter,
      ),
  };
};

export const computeContinuousScaleBarWidth = (
  xAxisModel: TimeSeriesXAxisModel | NumericXAxisModel,
  boundaryWidth: number,
  barSeriesCount: number,
  yAxisWithBarSeriesCount: number,
  stackedOrSingleSeries: boolean,
) => {
  let barWidth =
    (boundaryWidth / (xAxisModel.intervalsCount + 2)) *
    CHART_STYLE.series.barWidth;

  if (!stackedOrSingleSeries) {
    barWidth /= barSeriesCount;
  }

  barWidth /= yAxisWithBarSeriesCount;

  return barWidth;
};

export const computeBarWidth = (
  xAxisModel: XAxisModel,
  boundaryWidth: number,
  barSeriesCount: number,
  yAxisWithBarSeriesCount: number,
  isStacked: boolean,
) => {
  const stackedOrSingleSeries = isStacked || barSeriesCount === 1;
  const isNumericOrTimeSeries =
    isNumericAxis(xAxisModel) || isTimeSeriesAxis(xAxisModel);

  if (isNumericOrTimeSeries) {
    return computeContinuousScaleBarWidth(
      xAxisModel,
      boundaryWidth,
      barSeriesCount,
      yAxisWithBarSeriesCount,
      stackedOrSingleSeries,
    );
  }

  let barWidth: string | number | undefined = undefined;

  if (isCategoryAxis(xAxisModel) && xAxisModel.isHistogram) {
    const barWidthPercent = stackedOrSingleSeries
      ? CHART_STYLE.series.histogramBarWidth
      : CHART_STYLE.series.histogramBarWidth / barSeriesCount;
    barWidth = `${barWidthPercent * 100}%`;
  }

  return barWidth;
};

export const buildEChartsStackLabelOptions = (
  seriesModel: SeriesModel,
  formatter: LabelFormatter | undefined,
  originalDataset: ChartDataset,
  renderingContext: RenderingContext,
): SeriesLabelOption | undefined => {
  if (!formatter) {
    return;
  }

  return {
    silent: true,
    position: "inside",
    opacity: 1,
    show: true,
    fontFamily: renderingContext.fontFamily,
    fontWeight: CHART_STYLE.seriesLabels.weight,
    fontSize: CHART_STYLE.seriesLabels.size,
    color: getTextColorForBackground(
      seriesModel.color,
      renderingContext.getColor,
    ),
    formatter: (params: CallbackDataParams) => {
      const transformedDatum = params.data as Datum;
      const originalIndex =
        transformedDatum[ORIGINAL_INDEX_DATA_KEY] ?? params.dataIndex;
      const datum = originalDataset[originalIndex];
      const value = datum[seriesModel.dataKey];

      if (typeof value !== "number") {
        return " ";
      }
      return formatter(value);
    },
  };
};

const buildEChartsBarSeries = (
  dataset: ChartDataset,
  originalDataset: ChartDataset,
  xAxisModel: XAxisModel,
  yAxisScaleTransforms: NumericAxisScaleTransforms,
  chartMeasurements: ChartMeasurements,
  seriesModel: SeriesModel,
  stackName: string | undefined,
  settings: ComputedVisualizationSettings,
  yAxisIndex: number,
  barSeriesCount: number,
  yAxisWithBarSeriesCount: number,
  hasMultipleSeries: boolean,
  labelFormatter: LabelFormatter | undefined,
  renderingContext: RenderingContext,
): BarSeriesOption => {
  const isStacked = stackName != null;

  return {
    id: seriesModel.dataKey,
    emphasis: {
      focus: hasMultipleSeries ? "series" : "self",
      itemStyle: {
        color: seriesModel.color,
      },
    },
    blur: {
      label: getBlurLabelStyle(settings, hasMultipleSeries),
      itemStyle: {
        opacity: CHART_STYLE.opacity.blur,
      },
    },
    type: "bar",
    z: CHART_STYLE.series.zIndex,
    yAxisIndex,
    barGap: 0,
    stack: stackName,
    barWidth: computeBarWidth(
      xAxisModel,
      chartMeasurements.boundaryWidth,
      barSeriesCount,
      yAxisWithBarSeriesCount,
      !!stackName,
    ),
    encode: {
      y: seriesModel.dataKey,
      x: X_AXIS_DATA_KEY,
    },
    label: isStacked
      ? buildEChartsStackLabelOptions(
          seriesModel,
          labelFormatter,
          originalDataset,
          renderingContext,
        )
      : buildEChartsLabelOptions(
          seriesModel,
          yAxisScaleTransforms,
          renderingContext,
          labelFormatter,
        ),
    labelLayout: isStacked
      ? getBarInsideLabelLayout(dataset, settings, seriesModel.dataKey)
      : getBarLabelLayout(dataset, settings, seriesModel.dataKey),
    itemStyle: {
      color: seriesModel.color,
    },
  };
};

function getShowSymbol(
  seriesModel: SeriesModel,
  seriesSettings: SeriesSettings,
  dataset: ChartDataset,
  chartWidth: number,
) {
  // "line.marker_enabled" corresponds to the "Show dots on lines" series setting
  // and can be true, false, or undefined
  // true = on
  // false = off
  // undefined = auto
  const isAuto = seriesSettings["line.marker_enabled"] == null;
  if (!isAuto) {
    return seriesSettings["line.marker_enabled"];
  }
  if (chartWidth <= 0) {
    return false;
  }
  const numDots =
    seriesSettings["line.missing"] !== "none"
      ? dataset.length
      : dataset.filter(datum => datum[seriesModel.dataKey] != null).length;

  // symbolSize is the dot's diameter
  return chartWidth / numDots > CHART_STYLE.symbolSize;
}

const buildEChartsLineAreaSeries = (
  seriesModel: SeriesModel,
  stackName: string | undefined,
  seriesSettings: SeriesSettings,
  dataset: ChartDataset,
  yAxisScaleTransforms: NumericAxisScaleTransforms,
  settings: ComputedVisualizationSettings,
  yAxisIndex: number,
  hasMultipleSeries: boolean,
  chartWidth: number,
  labelFormatter: LabelFormatter | undefined,
  renderingContext: RenderingContext,
): LineSeriesOption => {
  const isSymbolVisible = getShowSymbol(
    seriesModel,
    seriesSettings,
    dataset,
    chartWidth,
  );

  const blurOpacity = hasMultipleSeries ? CHART_STYLE.opacity.blur : 1;

  return {
    emphasis: {
      focus: hasMultipleSeries ? "series" : "self",
      itemStyle: {
        color: seriesModel.color,
      },
    },
    blur: {
      label: getBlurLabelStyle(settings, hasMultipleSeries),
      itemStyle: {
        opacity: isSymbolVisible ? blurOpacity : 0,
      },
      lineStyle: {
        opacity: blurOpacity,
      },
      areaStyle: { opacity: CHART_STYLE.opacity.area },
    },
    z: CHART_STYLE.series.zIndexLineArea,
    id: seriesModel.dataKey,
    type: "line",
    lineStyle: {
      type: seriesSettings["line.style"],
      width: seriesSettings["line.size"]
        ? LINE_SIZE[seriesSettings["line.size"]]
        : LINE_SIZE.M,
    },
    yAxisIndex,
    showSymbol: true,
    symbolSize: CHART_STYLE.symbolSize,
    smooth: seriesSettings["line.interpolate"] === "cardinal",
    connectNulls: seriesSettings["line.missing"] === "interpolate",
    step:
      seriesSettings["line.interpolate"] === "step-after" ? "end" : undefined,
    stack: stackName,
    areaStyle:
      seriesSettings.display === "area"
        ? { opacity: CHART_STYLE.opacity.area }
        : undefined,
    encode: {
      y: seriesModel.dataKey,
      x: X_AXIS_DATA_KEY,
    },
    label: buildEChartsLabelOptions(
      seriesModel,
      yAxisScaleTransforms,
      renderingContext,
      labelFormatter,
      "top",
    ),
    labelLayout: {
      hideOverlap: settings["graph.label_value_frequency"] === "fit",
    },
    itemStyle: {
      color: seriesModel.color,
      opacity: isSymbolVisible ? 1 : 0, // Make the symbol invisible to keep it for event trigger for tooltip
    },
  };
};

const generateStackOption = (
  yAxisScaleTransforms: NumericAxisScaleTransforms,
  settings: ComputedVisualizationSettings,
  signKey: StackTotalDataKey,
  stackDataKeys: DataKey[],
  seriesOptionFromStack: LineSeriesOption | BarSeriesOption,
  labelFormatter: LabelFormatter | undefined,
  renderingContext: RenderingContext,
) => {
  const stackName = seriesOptionFromStack.stack;

  const seriesOption = {
    yAxisIndex: seriesOptionFromStack.yAxisIndex,
    silent: true,
    symbolSize: 0,
    lineStyle: {
      opacity: 0,
    },
    id: `${stackName}_${signKey}`,
    stack: stackName,
    encode: {
      y: signKey,
      x: X_AXIS_DATA_KEY,
    },
    label: {
      ...seriesOptionFromStack.label,
      show: true,
      position:
        signKey === POSITIVE_STACK_TOTAL_DATA_KEY
          ? ("top" as const)
          : ("bottom" as const),
      formatter:
        labelFormatter &&
        getStackedDataLabelFormatter(
          yAxisScaleTransforms,
          signKey,
          stackDataKeys,
          labelFormatter,
        ),
      fontFamily: renderingContext.fontFamily,
      fontWeight: CHART_STYLE.seriesLabels.weight,
      fontSize: CHART_STYLE.seriesLabels.size,
      color: renderingContext.getColor("text-dark"),
      textBorderColor: renderingContext.getColor("white"),
      textBorderWidth: 3,
    },
    labelLayout: {
      hideOverlap: settings["graph.label_value_frequency"] === "fit",
    },
    z: CHART_STYLE.seriesLabels.zIndex,
    blur: {
      label: {
        opacity: 1,
      },
    },
  };

  if (seriesOptionFromStack.type === "bar") {
    return { ...seriesOption, type: "bar" as const };
  }

  return { ...seriesOption, type: "line" as const };
};

function getStackedDataLabelFormatter(
  yAxisScaleTransforms: NumericAxisScaleTransforms,
  signKey: StackTotalDataKey,
  stackDataKeys: DataKey[],
  formatter: LabelFormatter,
) {
  return (params: CallbackDataParams) => {
    const stackValue = getStackTotalValue(
      params.data as Datum,
      stackDataKeys,
      signKey,
    );

    if (stackValue === null) {
      return " ";
    }

    return formatter(yAxisScaleTransforms.fromEChartsAxisValue(stackValue));
  };
}

export const getStackTotalsSeries = (
  chartModel: CartesianChartModel,
  yAxisScaleTransforms: NumericAxisScaleTransforms,
  settings: ComputedVisualizationSettings,
  seriesOptions: (LineSeriesOption | BarSeriesOption)[],
  renderingContext: RenderingContext,
) => {
  const seriesByStackName = _.groupBy(
    seriesOptions.filter(s => s.stack != null),
    "stack",
  );

  return getObjectValues(seriesByStackName).flatMap(seriesOptions => {
    const stackDataKeys = seriesOptions // we set string dataKeys as series IDs
      .map(s => s.id)
      .filter(isNotNull) as string[];
    const firstSeriesInStack = seriesOptions[0];

    const labelFormatter = firstSeriesInStack.stack
      ? chartModel?.stackedLabelsFormatters?.[
          firstSeriesInStack.stack as "bar" | "area"
        ]
      : undefined;

    if (!labelFormatter) {
      return [];
    }

    return [
      generateStackOption(
        yAxisScaleTransforms,
        settings,
        POSITIVE_STACK_TOTAL_DATA_KEY,
        stackDataKeys,
        firstSeriesInStack,
        labelFormatter,
        renderingContext,
      ),
      generateStackOption(
        yAxisScaleTransforms,
        settings,
        NEGATIVE_STACK_TOTAL_DATA_KEY,
        stackDataKeys,
        firstSeriesInStack,
        labelFormatter,
        renderingContext,
      ),
    ];
  });
};

const getDisplaySeriesSettingsByDataKey = (
  seriesModels: SeriesModel[],
  stackModels: StackModel[] | null,
  settings: ComputedVisualizationSettings,
) => {
  const seriesSettingsByKey = seriesModels.reduce((acc, seriesModel) => {
    acc[seriesModel.dataKey] = settings.series(
      seriesModel.legacySeriesSettingsObjectKey,
    );
    return acc;
  }, {} as Record<DataKey, SeriesSettings>);

  if (stackModels != null) {
    stackModels.forEach(({ display, seriesKeys }) => {
      seriesKeys.forEach(seriesKey => {
        seriesSettingsByKey[seriesKey].display = display;
      });
    });
  }

  return seriesSettingsByKey;
};

export const buildEChartsSeries = (
  chartModel: CartesianChartModel,
  settings: ComputedVisualizationSettings,
  chartWidth: number,
  chartMeasurements: ChartMeasurements,
  renderingContext: RenderingContext,
): EChartsSeriesOption[] => {
  const seriesSettingsByDataKey = getDisplaySeriesSettingsByDataKey(
    chartModel.seriesModels,
    chartModel.stackModels,
    settings,
  );

  const seriesYAxisIndexByDataKey = chartModel.seriesModels.reduce(
    (acc, seriesModel) => {
      acc[seriesModel.dataKey] = getSeriesYAxisIndex(
        seriesModel.dataKey,
        chartModel,
      );
      return acc;
    },
    {} as Record<DataKey, number>,
  );

  const barSeriesCountByYAxisIndex = chartModel.seriesModels.reduce(
    (acc, seriesModel) => {
      const isBar =
        seriesSettingsByDataKey[seriesModel.dataKey].display === "bar";

      if (isBar) {
        const yAxisIndex = seriesYAxisIndexByDataKey[seriesModel.dataKey];
        acc[yAxisIndex] = (acc[yAxisIndex] ?? 0) + 1;
      }

      return acc;
    },
    {} as Record<number, number>,
  );

  const yAxisWithBarSeriesCount = Object.keys(
    barSeriesCountByYAxisIndex,
  ).length;

  const barSeriesCount = Object.values(seriesSettingsByDataKey).filter(
    seriesSettings => seriesSettings.display === "bar",
  ).length;

  const hasMultipleSeries = chartModel.seriesModels.length > 1;

  const series = chartModel.seriesModels
    .map(seriesModel => {
      const seriesSettings = seriesSettingsByDataKey[seriesModel.dataKey];
      const yAxisIndex = seriesYAxisIndexByDataKey[seriesModel.dataKey];
      const stackName =
        chartModel.stackModels == null
          ? undefined
          : chartModel.stackModels.find(stackModel =>
              stackModel.seriesKeys.includes(seriesModel.dataKey),
            )?.display;

      switch (seriesSettings.display) {
        case "line":
        case "area":
          return buildEChartsLineAreaSeries(
            seriesModel,
            stackName,
            seriesSettings,
            chartModel.transformedDataset,
            chartModel.yAxisScaleTransforms,
            settings,
            yAxisIndex,
            hasMultipleSeries,
            chartWidth,
            chartModel?.seriesLabelsFormatters?.[seriesModel.dataKey],
            renderingContext,
          );
        case "bar":
          return buildEChartsBarSeries(
            chartModel.transformedDataset,
            chartModel.dataset,
            chartModel.xAxisModel,
            chartModel.yAxisScaleTransforms,
            chartMeasurements,
            seriesModel,
            stackName,
            settings,
            yAxisIndex,
            barSeriesCount,
            yAxisWithBarSeriesCount,
            hasMultipleSeries,
            chartModel?.seriesLabelsFormatters?.[seriesModel.dataKey],
            renderingContext,
          );
        case "scatter":
          return buildEChartsScatterSeries(
            seriesModel,
            chartModel.bubbleSizeDomain,
            yAxisIndex,
            renderingContext,
          );
      }
    })
    .flat()
    .filter(isNotNull);

  const hasStackedSeriesTotalLabels =
    settings["graph.show_values"] &&
    settings["stackable.stack_type"] === "stacked" &&
    (settings["graph.show_stack_values"] === "total" ||
      settings["graph.show_stack_values"] === "all");
  if (hasStackedSeriesTotalLabels) {
    series.push(
      ...getStackTotalsSeries(
        chartModel,
        chartModel.yAxisScaleTransforms,
        settings,
        // It's guranteed that no series here will be scatter, since with
        // scatter plots the `stackable.stack_type` is undefined. We can maybe
        // remove this later after refactoring the scatter implementation to a
        // separate codepath.
        series as (LineSeriesOption | BarSeriesOption)[],
        renderingContext,
      ),
    );
  }

  return series;
};
