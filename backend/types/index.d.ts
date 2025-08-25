import { Request } from 'express';
import { MultiPartRequest } from 'express-async-handler';
import { ClerkExpressWithAuth } from '@clerk/express';
import { ClerkAuthProp } from '@clerk/clerk-sdk-node';

declare module 'express-serve-static-core' {
  // Use `extends` to add `auth` to the `Request` interface
  // The `auth` property is added by the @clerk/express middleware
  interface Request {
    auth?: ClerkAuthProp;
  }
}
