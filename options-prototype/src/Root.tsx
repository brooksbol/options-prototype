/**
 * Root component — route-level switch between Wheelwright surfaces.
 *
 * All operational surfaces are wrapped in AppShell (shared application chrome).
 * Engineering instruments and transitional Labs remain outside the operator shell.
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
import { SparklineGallery } from "./operator-console/SparklineGallery";
import { EngineeringApp } from "./engineering/EngineeringApp";

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

  // Deliberate subordinate engineering boundary; never part of operator navigation
  if (route === "engineering") {
    return <EngineeringApp />;
  }

  // Sparkline gallery — temporary UX experiment, outside AppShell
  if (route === "sparkline-gallery") {
    return <SparklineGallery />;
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
