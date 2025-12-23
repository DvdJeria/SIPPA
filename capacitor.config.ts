import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Sippa',
  webDir: 'www',
  plugins: {
    CapacitorSQLite: {
      androidDatabaseProvider: 'system'
    }
  }
};

export default config;
