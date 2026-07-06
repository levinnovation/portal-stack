"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SectionTabs({
  sections,
}: {
  sections: { value: string; label: string; content: React.ReactNode }[];
}) {
  if (!sections.length) return null;
  return (
    <Tabs defaultValue={sections[0].value} className="space-y-4">
      <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
        {sections.map((s) => (
          <TabsTrigger key={s.value} value={s.value} className="text-xs sm:text-sm">
            {s.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {sections.map((s) => (
        <TabsContent key={s.value} value={s.value} className="space-y-4 mt-0">
          {s.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
