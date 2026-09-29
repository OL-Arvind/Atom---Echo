import type { MeetingChannel } from "@/types/domain";

export function getChannelMeta(channel: MeetingChannel) {
  switch (channel) {
    case "fathom_video":
    case "google_meet":
    case "zoom":
      return {
        label: "Video · Fathom",
        dotColor: "bg-blue-400",
      };
    case "phone_call":
      return {
        label: "Phone Call",
        dotColor: "bg-emerald-400",
      };
    case "whatsapp":
      return {
        label: "WhatsApp",
        dotColor: "bg-[#25D366]",
      };
    case "in_person":
      return {
        label: "Quick Note",
        dotColor: "bg-amber-400",
      };
    default:
      return {
        label: "Sync",
        dotColor: "bg-gray-400",
      };
  }
}
