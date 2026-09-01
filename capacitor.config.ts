// Capacitor configuration for iOS Native build
export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
    iosScheme?: string;
  };
  ios?: {
    contentInset?: string;
    preferredContentMode?: string;
    scheme?: string;
  };
  plugins?: Record<string, any>;
}

const config: CapacitorConfig = {
  appId: "com.felys.app",
  appName: "Felys",
  webDir: "out",
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "Felys",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#FAF9FC",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
