/** Example custom screen stub for new tenants — copy pattern from tenants/core/screens/. */
export function ExampleCustomScreen() {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
      <p className="font-medium text-foreground">Custom screen placeholder</p>
      <p className="text-sm mt-2">
        Replace this component and wire a route under <code>src/app/(frontend)/portal/…</code> with{" "}
        <code>renderCustomScreen()</code>.
      </p>
    </div>
  );
}
