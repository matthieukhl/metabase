import { useEffect, useState } from "react";

import { useEmbedTheme } from "metabase/dashboard/hooks/use-embed-theme";
import { isWithinIframe } from "metabase/lib/dom";
import { useDispatch } from "metabase/lib/redux";
import { setOptions } from "metabase/redux/embed";

import type { EmbedDisplayControls, EmbedDisplayParams } from "../types";

export const DEFAULT_EMBED_DISPLAY_OPTIONS: EmbedDisplayParams = {
  bordered: false,
  titled: true,
  hideDownloadButton: null,
  hideParameters: null,
  font: null,
  theme: "light",
};

export const useEmbedDisplayOptions = (
  defaultOptions = DEFAULT_EMBED_DISPLAY_OPTIONS,
): EmbedDisplayControls => {
  const [bordered, setBordered] = useState(
    isWithinIframe() || defaultOptions.bordered,
  );
  const [titled, setTitled] = useState(defaultOptions.titled);
  const [hideDownloadButton, setHideDownloadButton] = useState(
    defaultOptions.hideDownloadButton,
  );
  const [font, setFont] = useState(defaultOptions.font);
  const [hideParameters, setHideParameters] = useState(
    defaultOptions.hideParameters,
  );
  const {
    hasNightModeToggle,
    isNightMode,
    onNightModeChange,
    setTheme,
    theme,
  } = useEmbedTheme(defaultOptions.theme);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(
      setOptions({
        font: font ?? undefined,
      }),
    );
  }, [dispatch, font]);

  return {
    bordered,
    setBordered,
    titled,
    setTitled,
    hideDownloadButton,
    setHideDownloadButton,
    hideParameters,
    setHideParameters,
    font,
    setFont,
    hasNightModeToggle,
    isNightMode,
    onNightModeChange,
    setTheme,
    theme,
  };
};
