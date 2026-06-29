"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/auth");
  const mainClassName = pathname === "/" ? "container-shell app-main-shell home-screen-shell" : "container-shell app-main-shell";

  if (isAuthRoute) {
    return <main>{children}</main>;
  }

  return (
    <>
      <Header />
      <main className={mainClassName}>{children}</main>
      <Footer />
    </>
  );
}
