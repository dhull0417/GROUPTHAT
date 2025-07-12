// This file extends Clerk's types to include our custom metadata.
// It targets @clerk/types, which is the new location for core types.
declare module '@clerk/types' {
  export interface SessionClaims {
    metadata: {
      admin_for_groups?: string[];
    };
  }
}