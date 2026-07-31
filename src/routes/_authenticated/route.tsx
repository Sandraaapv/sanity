import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // If the URL has a Supabase access token hash, let it load to capture token
    if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      return { user: null };
    }

    // Guest Mode Check
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const isGuest = localStorage.getItem("sanity_guest") === "true";
      if (token === "guest-demo-token" || isGuest) {
        return {
          user: {
            id: "guest-demo-user",
            email: "guest@sanity.demo",
            displayName: "Guest Explorer",
            isGuest: true,
          },
        };
      }
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
