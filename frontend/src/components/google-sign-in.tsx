"use client";

import * as React from "react";
import Script from "next/script";
import { signIn } from "next-auth/react";
import { GOOGLE_ID_TOKEN_PROVIDER } from "@/lib/auth-providers";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            use_fedcm_for_prompt?: boolean;
          }): void;
          prompt(): void;
          cancel(): void;
        };
      };
    };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;


function onCredential({ credential }: { credential: string }) {
  void signIn(GOOGLE_ID_TOKEN_PROVIDER, { credential });
}

// Google One Tap, shown through the browser's FedCM prompt
export function GoogleOneTap() {
  const [gsiReady, setGsiReady] = React.useState(false);

  React.useEffect(() => {
    const gsi = window.google?.accounts.id;
    if (!gsiReady || !gsi || !CLIENT_ID) return;
    gsi.initialize({
      client_id: CLIENT_ID,
      callback: onCredential,
      use_fedcm_for_prompt: true,
    });
    gsi.prompt();
    return () => gsi.cancel();
  }, [gsiReady]);

  if (!CLIENT_ID) return null;
  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onReady={() => setGsiReady(true)}
    />
  );
}
