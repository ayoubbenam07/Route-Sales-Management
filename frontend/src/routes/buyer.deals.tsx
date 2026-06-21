import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/buyer/deals")({
  component: () => <Outlet />,
});
