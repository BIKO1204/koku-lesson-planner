// app/bridge-auth-provider.tsx
"use client";

import { ReactNode } from "react";
import { useBridgeNextAuthToFirebase } from "@/lib/bridgeAuth";

export default function BridgeAuthProvider({ children }: { children: ReactNode }) {
  useBridgeNextAuthToFirebase();
  return <>{children}</>;
}
