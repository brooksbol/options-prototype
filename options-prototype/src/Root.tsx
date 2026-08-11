/**
 * Root component — route-level switch between Wheelwright surfaces.
 *
 * All operational surfaces are wrapped in AppShell (shared application chrome).
 * Labs remain outside the shell — they are engineering tooling, not operator surfaces.
 *
 * Listens to popstate for browser back/forward navigation.
 */

import { useState, useEffect, useCallback } from "react";
import { resolveRoute, type AppRoute } from "./router";
import { AppShell } from "./components/AppShell";
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

  // Labs remain outside the Application Shell — engineering tooling, not operator surface
  if (route === "labs") {
    return <App />;
  }

  // All operational surfaces render inside the shared Application Shell
  return (
    <AppShell route={route}>
      {route === "operator-console" && <OperatorConsole />}
      {route === "write-desk" && <WriteDesk />}
      {route === "production" && <ProductionView />}
    </AppShell>
  );
}
