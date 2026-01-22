import 'detox';

declare module 'detox' {
  interface Device {
    setNetworkConnection?: (
      connection: 'WIFI' | 'NONE' | 'CELLULAR' | 'AIRPLANE'
    ) => Promise<void>;
  }
}
