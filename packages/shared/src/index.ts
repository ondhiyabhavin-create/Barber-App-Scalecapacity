export type UserRole = "owner" | "staff" | "client";

export const BUSINESS_TYPES = ["barbershop", "salon", "mobile_barber"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const PLANS = ["free", "pro", "studio", "enterprise"] as const;
export type Plan = (typeof PLANS)[number];
