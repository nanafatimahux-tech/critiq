import type { ComponentType } from "react";
import { BookOpen, Compass, Crosshair, FlaskConical, PenTool, Scale, TrendingUp, Users } from "./icons";
import type { Tone } from "./ui";
import type { DimensionKey } from "@/lib/types";

// Each rubric dimension gets its own icon and colour, used in tiles and the skill graph.
export const DIMENSION_LOOK: Record<DimensionKey, { icon: ComponentType<{ className?: string }>; tone: Tone; short: string }> = {
  problem_framing: { icon: Crosshair, tone: "accent", short: "Framing" },
  product_thinking: { icon: Compass, tone: "sky", short: "Product" },
  decision_quality: { icon: Scale, tone: "pink", short: "Decisions" },
  ux_reasoning: { icon: FlaskConical, tone: "strong", short: "UX reasoning" },
  visual_craft: { icon: PenTool, tone: "xp", short: "Craft" },
  impact_outcomes: { icon: TrendingUp, tone: "strong", short: "Impact" },
  ownership_collaboration: { icon: Users, tone: "sky", short: "Ownership" },
  storytelling: { icon: BookOpen, tone: "pink", short: "Story" },
};
