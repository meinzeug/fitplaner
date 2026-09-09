import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.meinzeug.fitplaner',
  appName: 'FitPlaner',
  webDir: 'dist',
  server: {
    cleartext: true,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
  }
};

export default config;
