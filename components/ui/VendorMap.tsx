/**
 * VendorMap.tsx
 * Type-only re-export so TypeScript resolves the import.
 * At runtime, Metro/Expo serves VendorMap.web.tsx (web) or VendorMap.native.tsx (iOS/Android).
 */
export type { MapVendor } from './VendorMap.web';
export { default } from './VendorMap.web';
