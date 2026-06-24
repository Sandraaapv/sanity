import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // If the URL has a Supabase access token hash, do not redirect to /auth.
    // Let the page load so the auth handler can capture the token.
    if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      return { user: null };
    }

    try {
      const { data } = await api.get("/auth/me");
      return { user: data };
    } catch {
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
