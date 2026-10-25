import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const PRODUCT_CATEGORIES = [
  "Audio",
  "Wearables",
  "Smart Home",
  "Accessories",
  "Computers",
  "Cameras",
] as const;

export const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  sku: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[A-Z0-9-]+$/i, "SKU may only contain letters, numbers and dashes"),
  category: z.string().trim().min(2).max(60),
  price: z.coerce.number().positive("Price must be greater than 0").max(1_000_000),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative").max(1_000_000),
  status: z.enum(["active", "draft", "archived"]).default("active"),
});

export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProductInput = z.infer<typeof productSchema>;
