import "regenerator-runtime/runtime";

// Use of classList.add and .remove in Background and FitViewPort Hocs requires
// this polyfill so that those work in older browsers
import "classlist-polyfill";

import "number-to-locale-string";

// This is conditionally aliased in the webpack config.
// If EE isn't enabled, it loads an empty file.
// Should be imported before any other metabase import
import "ee-overrides"; // eslint-disable-line import/no-duplicates

import "metabase/lib/dayjs";

// If enabled this monkeypatches `t` and `jt` to return blacked out
// strings/elements to assist in finding untranslated strings.
import "metabase/lib/i18n-debug";

// set the locale before loading anything else
import "metabase/lib/i18n";

// NOTE: why do we need to load this here?
import "metabase/lib/colors";

// NOTE: this loads all builtin plugins
import "metabase/plugins/builtin";

// This is conditionally aliased in the webpack config.
// If EE isn't enabled, it loads an empty file.
import "ee-plugins"; // eslint-disable-line import/no-duplicates

import { createHistory } from "history";
import { DragDropContextProvider } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Router, useRouterHistory } from "react-router";
import { syncHistoryWithStore } from "react-router-redux";

import { createTracker } from "metabase/lib/analytics";
import api from "metabase/lib/api";
import { initializeEmbedding } from "metabase/lib/embed";
import { captureConsoleErrors } from "metabase/lib/errors";
import MetabaseSettings from "metabase/lib/settings";
import { PLUGIN_APP_INIT_FUCTIONS } from "metabase/plugins";
import { refreshSiteSettings } from "metabase/redux/settings";
import { EmotionCacheProvider } from "metabase/styled-components/components/EmotionCacheProvider";
import { GlobalStyles } from "metabase/styled-components/containers/GlobalStyles";
import { ThemeProvider } from "metabase/ui";
import registerVisualizations from "metabase/visualizations/register";

import { getStore } from "./store";

// remove trailing slash
const BASENAME = window.MetabaseRoot.replace(/\/+$/, "");

api.basename = BASENAME;

// eslint-disable-next-line react-hooks/rules-of-hooks
const browserHistory = useRouterHistory(createHistory)({
  basename: BASENAME,
});

function _init(reducers, getRoutes, callback) {
  const store = getStore(reducers, browserHistory);
  const routes = getRoutes(store);
  const history = syncHistoryWithStore(browserHistory, store);

  createTracker(store);

  initializeEmbedding(store);

  ReactDOM.render(
    <Provider store={store}>
      <EmotionCacheProvider>
        <DragDropContextProvider backend={HTML5Backend} context={{ window }}>
          <ThemeProvider>
            <GlobalStyles />
            <Router history={history}>{routes}</Router>
          </ThemeProvider>
        </DragDropContextProvider>
      </EmotionCacheProvider>
    </Provider>,
    document.getElementById("root"),
  );

  registerVisualizations();

  store.dispatch(refreshSiteSettings());

  PLUGIN_APP_INIT_FUCTIONS.forEach(init => init());

  window.Metabase = window.Metabase || {};
  window.Metabase.store = store;
  window.Metabase.settings = MetabaseSettings;

  if (callback) {
    callback(store);
  }
}

export function init(...args) {
  if (document.readyState !== "loading") {
    _init(...args);
  } else {
    document.addEventListener("DOMContentLoaded", () => _init(...args));
  }
}

captureConsoleErrors();

function partyMode() {
  const partyLeader =
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaHduajhkaDVnbWRtMHFmanZhbHBod3g0Nmlwejl6bDQ3cXdpaGN3MiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/eiBPiTPWuRyEaDXnuS/source.gif";

  const getPartyColor = () => `hsl(${Math.random() * 360}, 100%, 50%)`;

  setInterval(() => {
    document.querySelector("link[rel~='icon']").href = partyLeader;

    document.querySelectorAll(".Icon").forEach(partyLeaderFrame => {
      partyLeaderFrame.outerHTML = `<img width="20" height="20" src=${partyLeader} />`;
    });

    document.querySelectorAll("body, *").forEach(partyBox => {
      partyBox.style.backgroundColor = getPartyColor();
      partyBox.style.color = getPartyColor();
    });
  }, 500);
}

let ringBuffer = "";
document.addEventListener("keydown", function (e) {
  if ("party".includes(e.key)) {
    ringBuffer += e.key;
  }

  if (ringBuffer.includes("party")) {
    partyMode();
    ringBuffer = "";
  }
});
