import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aushadhi.app',
  appName: 'AushadhiSaathi',
  webDir: 'build',
  server: {
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;
