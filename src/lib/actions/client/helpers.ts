import { revalidatePath } from "next/cache";
import { invalidateDbCache } from "@/lib/data/supabase-queries";

export function revalidate(path: string) {
  invalidateDbCache();
  revalidatePath(path);
}
