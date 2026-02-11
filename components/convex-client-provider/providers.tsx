"use client";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  useAuth,
  UserButton,
} from "@clerk/nextjs";
import {
  Authenticated,
  AuthLoading,
  ConvexReactClient,
  Unauthenticated,
} from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import React from "react";
import { ThemeProvider } from "../theme-provider/theme-provider";
import UnauthenticatedView from "@/app/features/auth/components/unauthenticated-view";
import AuthLoadingView from "@/app/features/auth/components/auth-loading-view";
export const Providers = ({ children }: { children: React.ReactNode }) => {
  const convex = new ConvexReactClient(
    process.env.NEXT_PUBLIC_CONVEX_URL as string,
  );
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Authenticated>
            <UserButton />
            {children}
          </Authenticated>
          <AuthLoading>
            <AuthLoadingView />
          </AuthLoading>
          <Unauthenticated>
            <UnauthenticatedView />
          </Unauthenticated>
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
