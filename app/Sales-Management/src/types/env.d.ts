/// <reference types="expo/types" />

declare namespace NodeJS {
  interface ProcessEnv {}
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
