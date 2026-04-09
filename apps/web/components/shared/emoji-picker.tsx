"use client";

import { useMemo, useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const EMOJIS = [
  "💈","✂️","🪒","💇","💇‍♂️","💇‍♀️","🧔","🧑‍🦱","🧑‍🦲","✨",
  "🔥","⭐","🎯","🎨","🏪","🏬","📍","🌆","🌇","🏙️","🚀","🫧","💎","🪄",
];

export function EmojiPicker({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    if (!query.trim()) return EMOJIS;
    return EMOJIS.filter((emoji) => emoji.includes(query.trim()));
  }, [query]);

  return (
    <>
      <Button type="button" variant="outline" className="h-11 w-full justify-start rounded-xl" onClick={() => setOpen(true)}>
        <span className="mr-2 text-xl">{value || "🙂"}</span>
        <span className="text-sm text-muted-foreground">Choose emoji</span>
        <Smile className="ml-auto size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Pick an emoji</DialogTitle>
          </DialogHeader>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by emoji" />
          <div className="grid max-h-64 grid-cols-8 gap-2 overflow-auto">
            {list.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onChange(emoji);
                  setOpen(false);
                }}
                className="rounded-lg border border-border/60 p-2 text-2xl hover:bg-muted"
              >
                {emoji}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
