import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vivamobile.banking',
  appName: 'Viva Mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true // Allow local API testing, set to false for strict production
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    }
  }
};

export default config;
