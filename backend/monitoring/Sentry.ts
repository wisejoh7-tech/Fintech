import * as Sentry from "@sentry/node";

export const initMonitoring = () => {
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
