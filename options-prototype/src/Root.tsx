/**
 * Root component — route-level switch between Wheelwright surfaces.
 *
 * Listens to popstate for browser back/forward navigation.
 */

import { useState, useEffect, useCallback } from "react";
import { resolveRoute, type AppRoute } from "./router";
import App from "./App";
import { WriteDesk } from "./components/WriteDesk";
import { OperatorConsole } from "./components/OperatorConsole";
import { ProductionView } from "./production/ProductionView";

export function Root() {
  const [route, setRoute] = useState<AppRoute>(resolveRoute);

  const handleRouteChange = useCallback(() => {
    setRoute(resolveRoute());
  }, []);

  useEffect(() => {
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, [handleRouteChange]);

  if (route === "operator-console") {
    return <OperatorConsole />;
  }

  if (route === "write-desk") {
    return <WriteDesk />;
  }

  if (route === "production") {
    return <ProductionView />;
  }

  return <App />;
}
