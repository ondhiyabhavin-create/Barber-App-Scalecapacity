"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Props = {
  clientId: string;
  tenantId: string;
  initialNotes: string;
  initialTags: string[];
};

export function ClientNotesForm({
  clientId,
  tenantId,
  initialNotes,
  initialTags,
}: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [tagInput, setTagInput] = useState(initialTags.join(", "));
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const supabase = createClient();
    const { error } = await supabase
      .from("clients")
      .update({
        haircut_notes: notes || null,
        tags,
      })
      .eq("id", clientId)
      .eq("tenant_id", tenantId);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved");
    router.refresh();
  }

  return (
    <div className="glass-panel space-y-4 rounded-2xl border border-border/60 p-6">
      <div className="space-y-2">
        <Label htmlFor="notes">Haircut notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Fade length, beard shape, allergies…"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="VIP, Regular, At-Risk"
        />
      </div>
      <Button onClick={() => void save()} disabled={loading}>
        {loading ? "Saving…" : "Save profile"}
      </Button>
    </div>
  );
}
