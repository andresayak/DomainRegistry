declare module '*.svg' {
  const content: any;
  export default content;
}
declare module '*.json' {
  const value: any;
  export default value;
}
declare const window: any;

declare global {
  interface ProcessEnv {
    APP_ORIGIN: string;
    TESTNET_APP_ORIGIN: string;
    APP_API_ORIGIN: string;
    SEPOLIA_PROVIDER_URL: string;
    HARDHAT_PROVIDER_URL: string;
  }
}
