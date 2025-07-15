import arcjet, {
  tokenBucket,
  shield,
  detectBot,
} from "@arcjet/node";
import { ENV } from "./env.js"; 

// ✅ CORRECTED: Remove the explicit type annotation.
// Let TypeScript infer the type from the object structure itself.
const arcjetConfig = {
  key: ENV.ARCJET_KEY,
  rules: [
    shield({ mode: "LIVE" }),

    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
      ],
    }),

    tokenBucket({
      mode: "LIVE",
      refillRate: 15,
      interval: 10, 
      capacity: 25,
    }),
  ],
};

// The `arcjet` function will correctly validate the inferred type of `arcjetConfig`.
export const aj = arcjet(arcjetConfig);