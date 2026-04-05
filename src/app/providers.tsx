import { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/features/auth/auth-context";
import { PwaProvider } from "@/features/pwa/pwa-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PwaProvider>{children}</PwaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
