import * as Sentry from "@sentry/node";

export const initMonitoring = () => {
  const version = process.versions.node.split('.').map(Number);
  const isCompatible = version[0] > 20 || (version[0] === 20 && version[1] >= 6) || (version[0] === 18 && version[1] >= 19);

  if (!isCompatible) {
    console.warn(`[Sentry] Node version ${process.versions.node} is incompatible with Sentry ESM mode. Monitoring disabled.`);
    return;
  }

  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // Performance Monitoring
    tracesSampleRate: 1.0,
  });
};

export const captureFinanceError = (error: Error, metadata: any) => {
  Sentry.withScope((scope) => {
    scope.setExtras(metadata);
    scope.setLevel("fatal");
    Sentry.captureException(error);
  });
};
