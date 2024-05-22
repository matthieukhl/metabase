import { useCallback, useEffect } from "react";

import { setDisplayTheme } from "metabase/dashboard/actions";
import { getDisplayTheme } from "metabase/dashboard/selectors";
import { useDispatch, useSelector } from "metabase/lib/redux";
import type { DisplayTheme } from "metabase/public/lib/types";
import { setOptions } from "metabase/redux/embed";

import type { EmbedThemeControls } from "../types";

export const useEmbedTheme = (
  initialValue: DisplayTheme,
): EmbedThemeControls => {
  const dispatch = useDispatch();

  const theme = useSelector(getDisplayTheme);
  const setTheme = useCallback(
    (theme: DisplayTheme) => dispatch(setDisplayTheme(theme)),
    [dispatch],
  );

  const onNightModeChange = (isNightMode: boolean) => {
    setTheme(isNightMode ? "night" : null);
  };

  const isNightMode = theme === "night";

  const hasNightModeToggle = theme !== "transparent";

  useEffect(() => {
    if (initialValue) {
      setTheme(initialValue);
    }
  }, [initialValue, setTheme]);

  useEffect(() => {
    dispatch(setOptions({ theme }));
  }, [dispatch, theme]);

  return {
    theme,
    setTheme,
    onNightModeChange,
    hasNightModeToggle,
    isNightMode,
  };
};
