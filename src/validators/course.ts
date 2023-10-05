import { z } from "zod";

export const createChapterSchema = z.object({
  title: z.string().min(2).max(100),
  units: z.array(z.string()),
});
