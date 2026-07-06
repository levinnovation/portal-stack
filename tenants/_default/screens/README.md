# Custom screens

Server Components live here. Wire them from `src/app/(frontend)/portal/.../page.tsx` using `renderCustomScreen()`.

Nav entry in `config.ts`:

```ts
{ to: "/portal/admin/my-screen", label: "My screen", icon: "LayoutDashboard", kind: "custom" }
```

See `tenants/core/screens/agents-overview.tsx` for a full example.
