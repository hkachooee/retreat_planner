import { Suspense } from "react";
import { auth } from "@/auth";
import { BottomNav } from "@/components/bottom-nav";

async function Nav() {
  const session = await auth();
  return session ? <BottomNav isAdmin={session.user.isAdmin} /> : null;
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="flex flex-1 flex-col pb-6">{children}</main>
      <Suspense>
        <Nav />
      </Suspense>
    </>
  );
}
