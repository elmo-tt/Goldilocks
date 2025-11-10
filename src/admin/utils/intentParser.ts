export type NavId = "overview" | "intake" | "cases" | "tasks" | "calendar" | "marketing" | "articles" | "media" | "settings";

export type PracticeAreaRef = { key: string; label: string; url: string };

export type Command =
  | { type: "NAVIGATE"; target: NavId }
  | { type: "CALL" }
  | { type: "CONTACT" }
  | { type: "MAP"; target: "wpb" | "psl" }
  | { type: "OPEN_PRACTICE"; key: string; url: string }
  | { type: "CREATE_TASK"; title: string }
  | { type: "UNKNOWN" };

export function parseIntent(input: string): NavId | null {
  const q = input.trim().toLowerCase();
  if (!q) return null;
  if (q.startsWith("/")) {
    const cmd = q.slice(1);
    if (["overview", "intake", "cases", "tasks", "calendar", "marketing", "articles", "media", "settings"].includes(cmd)) {
      return cmd as NavId;
    }
  }
  const map: Record<string, NavId> = {
    overview: "overview",
    home: "overview",
    intake: "intake",
    calls: "intake",
    cases: "cases",
    pipeline: "cases",
    tasks: "tasks",
    todo: "tasks",
    calendar: "calendar",
    schedule: "calendar",
    marketing: "marketing",
    articles: "articles",
    posts: "articles",
    blog: "articles",
    media: "media",
    uploads: "media",
    library: "media",
    images: "media",
    settings: "settings",
    admin: "settings",
  };
  for (const key of Object.keys(map)) {
    if (q.includes(key)) return map[key];
  }
  if (q.startsWith("go to ")) {
    const next = q.replace("go to ", "").trim();
    if (map[next]) return map[next];
  }
  if (q.startsWith("open ")) {
    const next = q.replace("open ", "").trim();
    if (map[next]) return map[next];
  }
  return null;
}

export function parseCommand(input: string, practiceAreas?: PracticeAreaRef[]): Command {
  const q = input.trim().toLowerCase();
  if (!q) return { type: "UNKNOWN" };

  // Explicit task creation should take precedence over content gating or navigation fallbacks
  if (/^(\/task\b|create\s+(?:a\s+)?task\b|add\s+(?:a\s+)?task\b)/i.test(input.trim())) {
    const raw = input.trim();
    const m = raw.match(/["']([^"']+)["']/);
    let title = m ? m[1].trim() : raw.replace(/^\/?(?:task|create(?:\s+a)?\s+task|add(?:\s+a)?\s+task)[:\s]*/i, "").trim();
    if (!title) title = "Follow up";
    return { type: "CREATE_TASK", title };
  }

  // Let the LLM handle content creation, edits, and research flows (avoid hard navigation to practice pages).
  if (
    /(create|write|draft|generate|compose|summarize|research|update|edit|modify|append|revise|publish|unpublish)\b[\s\S]*\b(article|post)\b/.test(q)
    || /(update\s+the\s+article\s+titled|update\s+the\s+article\s+about)/.test(q)
    || /(meta\s*title|meta\s*description|key\s*phrase|keyphrase|canonical\s*url|\bseo\b)/.test(q)
    || /(search\s+web|web\s+search|sources?\b)/.test(q)
  ) {
    return { type: "UNKNOWN" };
  }

  if (q === "/call") return { type: "CALL" };
  if (q === "/contact" || q === "/consultation") return { type: "CONTACT" };
  if (q === "/map" || q === "/map wpb" || q === "/map west" || q === "/map west palm") return { type: "MAP", target: "wpb" };
  if (q === "/map psl" || q === "/map port" || q === "/map port st lucie") return { type: "MAP", target: "psl" };

  if (/\b(call|dial|phone)\b/.test(q) && /(goldlaw|firm|number|consult|talk)/.test(q)) {
    return { type: "CALL" };
  }
  if (/\b(contact|consultation|free consult|reach|get in touch)\b/.test(q)) {
    return { type: "CONTACT" };
  }

  if (/(map|directions|office|locat)/.test(q)) {
    if (/(port|psl|lucie)/.test(q)) return { type: "MAP", target: "psl" };
    return { type: "MAP", target: "wpb" };
  }

  // (Handled above) CREATE_TASK detection

  if (practiceAreas && practiceAreas.length) {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const nq = norm(q);
    let best: PracticeAreaRef | undefined;
    for (const pa of practiceAreas) {
      const label = norm(pa.label);
      const key = norm(pa.key);
      if (nq.includes(label) || nq.includes(key)) { best = pa; break; }
      if (/truck|trucking/.test(nq) && pa.key.includes("truck")) { best = pa; break; }
      if (/slip|fall/.test(nq) && pa.key.includes("slip")) { best = pa; break; }
      if (/tbi|brain/.test(nq) && pa.key.includes("tbi")) { best = pa; break; }
      if (/nursing/.test(nq) && pa.key.includes("nursing")) { best = pa; break; }
      if (/pedestrian|bicycle|bike/.test(nq) && (pa.key.includes("pedestrian") || pa.key.includes("bicycle"))) { best = pa; break; }
      if (/security/.test(nq) && pa.key.includes("negligent-security")) { best = pa; break; }
      if (/malpractice/.test(nq) && pa.key.includes("medical-malpractice")) { best = pa; break; }
    }
    if (best) return { type: "OPEN_PRACTICE", key: best.key, url: best.url };
  }

  if (q.includes("outlook")) {
    return { type: "NAVIGATE", target: "calendar" };
  }

  // If the input looks like a question, let the LLM handle it instead of navigating.
  const isQuestion = q.includes('?') || /^(can|could|how|what|why|where|when|which|do|does|did|will|are|is|should|would|may|might)\b/.test(q)
  if (isQuestion) return { type: "UNKNOWN" };

  const nav = parseIntent(input);
  if (nav) return { type: "NAVIGATE", target: nav };
  return { type: "UNKNOWN" };
}
