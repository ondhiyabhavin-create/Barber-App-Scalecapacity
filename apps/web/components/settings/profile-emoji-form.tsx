"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EmojiPicker } from "@/components/shared/emoji-picker";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ProfileEmojiForm({ initialEmoji }: { initialEmoji?: string | null }) {
  const supabase = useMemo(() => createClient(), []);
  const [emoji, setEmoji] = useState(initialEmoji ?? "🙂");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      toast.error("Not signed in");
      return;
    }
    const { error } = await supabase.from("users").update({ icon_emoji: emoji }).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile emoji updated");
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      <EmojiPicker value={emoji} onChange={setEmoji} />
      <Button type="button" onClick={() => void save()} disabled={saving}>
        {saving ? "Saving..." : "Save emoji"}
      </Button>
    </div>
  );
}
