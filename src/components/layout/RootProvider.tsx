"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { LoadingScreen } from "@/components/shared/LoadingScreen";

export function RootProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: (failureCount, error) => {
              const status = (error as { status?: number } | undefined)?.status;
              if (status && status >= 400 && status < 500) return false;
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <LoadingScreen />
        <CommandPalette />
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "bg-card border border-border text-card-foreground shadow-lg rounded-lg",
              title: "font-semibold text-sm",
              description: "text-muted-foreground text-xs",
              actionButton: "bg-primary text-primary-foreground",
              cancelButton: "bg-muted text-muted-foreground",
              success: "border-success/30",
              error: "border-destructive/30",
            },
          }}
          richColors
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
