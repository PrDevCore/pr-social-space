import type { BlogPost } from "@/lib/blog";

export const aiCaptionsGuide: BlogPost = {
  slug: "write-engaging-instagram-captions-with-ai",
  title: "How to Write Engaging Instagram Captions With AI (Without Sounding Like a Robot)",
  description:
    "A practical workflow for using AI to write Instagram captions that hook readers — prompts, tone-matching, hashtag strategy and what to always edit yourself.",
  date: "2026-07-12",
  keywords: [
    "ai instagram captions",
    "ai caption generator",
    "instagram caption ideas",
    "hashtag strategy",
  ],
  readingMinutes: 6,
  blocks: [
    {
      type: "p",
      text: "AI caption generators have gone from gimmick to genuine time-saver — but only if you feed them well and edit the output. Used carelessly, they produce the same 'Unlock your best self!' paste that audiences scroll straight past. Here is a workflow that keeps your voice while cutting caption-writing time by 80%.",
    },
    { type: "h2", text: "Start with the image, not the sentence" },
    {
      type: "p",
      text: "The strongest AI captions are grounded in what is actually in the photo or video. In Social Hub, the AI assistant reads from your uploaded media and drafts captions that describe and contextualise the real content — not generic filler. That single constraint removes most of the robotic feel.",
    },
    { type: "h2", text: "Give the AI a tone, not just a topic" },
    {
      type: "ul",
      items: [
        "Name your voice: 'playful but expert', 'warm and encouraging', 'dry humour'",
        "Set the length: one-liner hooks for Reels covers, story captions for carousels",
        "Add one brand-specific phrase or inside joke you would actually use",
      ],
    },
    { type: "h2", text: "Structure every caption for scannability" },
    {
      type: "p",
      text: "Instagram truncates after roughly 125 characters. Put the hook first, add context in the middle, end with a single clear call to action. If the AI draft buries the interesting part on line four, cut lines one to three.",
    },
    { type: "h2", text: "Hashtags: relevant beats massive" },
    {
      type: "p",
      text: "Twenty trending hashtags read as spam and dilute targeting. Aim for a mix of niche tags where you can genuinely rank and a couple of community tags your audience follows. Let the assistant pull suggestions from your media, then delete anything that doesn't match the specific post.",
    },
    { type: "h2", text: "What to always edit yourself" },
    {
      type: "ul",
      items: [
        "Claims and numbers — never publish an AI-generated statistic unchecked",
        "Anything about sensitive topics or current events",
        "Your opening line: rewrite it in words you would say out loud",
      ],
    },
    {
      type: "p",
      text: "Treat AI as a fast first-draft partner. You bring the taste; it brings the volume. Together you can keep a daily posting rhythm without burning evenings writing copy.",
    },
    {
      type: "cta",
      text: "Generate captions from your media with the built-in AI assistant.",
      label: "Try it free",
      href: "/auth/register",
    },
  ],
};
