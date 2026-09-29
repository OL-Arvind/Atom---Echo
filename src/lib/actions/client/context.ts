"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  tabooWordSchema,
  updateClientContextSchema,
  formatZodError,
} from "@/lib/validations";
import { requireOperatorSession } from "@/lib/auth/session";
import { revalidate } from "./helpers";

export async function addTabooWordAction(clientId: string, word: string) {
  try {
    await requireOperatorSession();
    const parsed = tabooWordSchema.safeParse({ clientId, word });
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }
    const cleanWord = parsed.data.word;

    const supabase = createAdminClient();
    const { data: ctx } = await supabase
      .from("client_contexts")
      .select("id, taboo_words")
      .eq("client_id", clientId)
      .single();

    if (ctx) {
      const currentWords = ctx.taboo_words || [];
      if (!currentWords.includes(cleanWord)) {
        await supabase
          .from("client_contexts")
          .update({ taboo_words: [...currentWords, cleanWord] })
          .eq("id", ctx.id);
      }
    } else {
      await supabase.from("client_contexts").insert({
        client_id: clientId,
        taboo_words: [cleanWord],
      });
    }

    revalidate(`/clients/${clientId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add taboo word.";
    return { success: false, error: message };
  }
}

export async function removeTabooWordAction(clientId: string, wordToRemove: string) {
  try {
    await requireOperatorSession();
    const supabase = createAdminClient();

    const { data: ctx } = await supabase
      .from("client_contexts")
      .select("id, taboo_words")
      .eq("client_id", clientId)
      .single();

    if (ctx && ctx.taboo_words) {
      const updatedWords = ctx.taboo_words.filter((w: string) => w !== wordToRemove);
      await supabase
        .from("client_contexts")
        .update({ taboo_words: updatedWords })
        .eq("id", ctx.id);
    }

    revalidate(`/clients/${clientId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to remove taboo word.";
    return { success: false, error: message };
  }
}

export async function updateClientContextAction(
  clientId: string,
  contextData: {
    positioning_statement?: string;
    target_audience_icp?: string;
    tone_archetype?: string;
    voice_guidelines?: string;
    core_pillars?: string[];
  }
) {
  try {
    await requireOperatorSession();
    const parsed = updateClientContextSchema.safeParse({
      clientId,
      ...contextData,
    });

    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const {
      positioning_statement,
      target_audience_icp,
      tone_archetype,
      voice_guidelines,
      core_pillars,
    } = parsed.data;

    const supabase = createAdminClient();

    // Check if context row already exists
    const { data: existing } = await supabase
      .from("client_contexts")
      .select("id")
      .eq("client_id", clientId)
      .maybeSingle();

    if (existing) {
      const { error: updateErr } = await supabase
        .from("client_contexts")
        .update({
          positioning_statement,
          target_audience_icp,
          tone_archetype,
          voice_guidelines,
          core_pillars,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateErr) {
        return { success: false, error: updateErr.message };
      }
    } else {
      const { error: insertErr } = await supabase.from("client_contexts").insert({
        client_id: clientId,
        positioning_statement,
        target_audience_icp,
        tone_archetype,
        voice_guidelines,
        core_pillars,
        taboo_words: [],
      });

      if (insertErr) {
        return { success: false, error: insertErr.message };
      }
    }

    revalidate(`/clients/${clientId}`);
    revalidate("/content");
    revalidate("/command-center");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update client context.";
    return { success: false, error: message };
  }
}
