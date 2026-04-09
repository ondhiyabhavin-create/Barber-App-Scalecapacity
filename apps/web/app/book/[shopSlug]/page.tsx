import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  PublicBookingFlow,
  type ShopPayload,
} from "@/components/booking/public-booking-flow";

export const revalidate = 60;

type Props = { params: { shopSlug: string } };

export async function generateMetadata({ params }: Props) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { title: "Book · BarberOS" };
  }
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_shop", { p_slug: params.shopSlug });
  const payload = data as { tenant?: { name?: string } } | null;
  const name = payload?.tenant?.name;
  return {
    title: name ? `Book · ${name}` : "Book · BarberOS",
    description: "Book an appointment online.",
  };
}

export default async function BookShopPage({ params }: Props) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        Configure Supabase environment variables to load this page.
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_shop", {
    p_slug: params.shopSlug,
  });

  if (error || !data) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PublicBookingFlow
        slug={params.shopSlug}
        initialShop={data as ShopPayload}
      />
    </div>
  );
}
