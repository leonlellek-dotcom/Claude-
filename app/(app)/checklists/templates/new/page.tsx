"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { createTemplate } from "../../actions";

export default function NewTemplatePage() {
  const router = useRouter();
  const [items, setItems] = useState<string[]>([""]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Neue Checklisten-Vorlage</h1>
        <p className="text-muted-foreground">z.B. "Vor Rausgehen", "Öffnung", "Schließung"</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vorlage</CardTitle>
          <CardDescription>Trage jeden Punkt der Checkliste ein</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (fd) => {
              items.forEach((i) => {
                if (i.trim()) fd.append("item", i);
              });
              await createTemplate(fd);
              router.push("/checklists");
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required placeholder="z.B. Vor Rausgehen" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequenz / Anlass</Label>
              <Input id="frequency" name="frequency" placeholder="z.B. Vor jedem Rausgehen, Täglich morgens" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea id="description" name="description" rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Checklisten-Punkte *</Label>
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = e.target.value;
                      setItems(next);
                    }}
                    placeholder={`Punkt ${idx + 1}`}
                  />
                  {items.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setItems(items.filter((_, i) => i !== idx))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, ""])}>
                <Plus className="h-4 w-4" /> Punkt hinzufügen
              </Button>
            </div>

            <div className="flex gap-2">
              <Button type="submit">Anlegen</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/checklists")}>
                Abbrechen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
