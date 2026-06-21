import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LanguageToggle } from "@/components/LanguageToggle";
import { motion } from "framer-motion";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 start-1/2 size-[640px] -translate-x-1/2 rounded-full bg-brand-soft blur-3xl opacity-60" />
        <div className="absolute bottom-0 end-0 size-[420px] rounded-full bg-brand/10 blur-3xl" />
      </div>
      <div className="absolute top-4 end-4">
        <LanguageToggle />
      </div>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
