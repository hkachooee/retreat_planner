export default function Loading() {
  return (
    <main aria-busy="true" className="flex flex-1 items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-line border-t-accent" />
    </main>
  );
}
