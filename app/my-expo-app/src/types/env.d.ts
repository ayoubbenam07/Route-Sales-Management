/// <reference types="expo/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_POWERSYNC_URL?: string;
    EXPO_PUBLIC_POWERSYNC_DEV_TOKEN?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
