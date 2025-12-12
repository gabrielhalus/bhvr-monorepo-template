import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { Box } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@bunstack/react/components/card";
import { Skeleton } from "@bunstack/react/components/skeleton";
import { api } from "@bunstack/react/lib/http";


export const Route = createFileRoute("/_auth/verify/")({
  component: RouteComponent,
});

type Status = "pending" | "success" | "error";

function RouteComponent() {
  const location = useRouterState({ select: s => s.location });
  const searchParams = new URLSearchParams(location.searchStr);
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("pending");
  const ranOnce = useRef(false);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error");
        return;
      }

      const verifiedToken = sessionStorage.getItem("verifiedToken");
      if (token === verifiedToken) {
        setStatus("success");
        return;
      }

      try {
        const res = await api.auth.verify.$get({ query: { token } });
        const data = await res.json();

        if (data.success) {
          sessionStorage.setItem("verifiedToken", token);
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    }

    if (!ranOnce.current) {
      ranOnce.current = true;
      verify();
    }
  }, [token]);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-xl flex-col gap-8">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Box className="size-4" />
          </div>
          Bunstack.
        </a>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Let&apos;s Get You Set Up!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-1">
                {
                  status === "pending"
                    ? (
                        <>
                          <Skeleton className="h-6 w-1/3" />
                          <Skeleton className="h-5 w-1/2" />
                        </>
                      )
                    : status === "success"
                      ? (
                          <>
                            <p>🎉 Verified successfully!</p>
                            <p className="text-sm">
                              You can now close this window.
                            </p>
                          </>
                        )
                      : (
                          <>
                            <p>⚠️ Verification failed</p>
                            <p>Please check your link or try again.</p>
                          </>
                        )
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
