import { ButtonLink, Notice } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col justify-center py-6">
      <Notice title="Page not found" action={<ButtonLink href="/trips" variant="secondary" className="h-11">Go to trips</ButtonLink>}>
        This page doesn&apos;t exist, or you don&apos;t have access to it.
      </Notice>
    </main>
  );
}
