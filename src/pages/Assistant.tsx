import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2, Send, Bot, User } from "lucide-react";

type MessageRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

const Assistant = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(true);

  const [clubsCtx, setClubsCtx] = useState<any[]>([]);
  const [eventsCtx, setEventsCtx] = useState<any[]>([]);
  const [careersCtx, setCareersCtx] = useState<any[]>([]);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, loading]);

  const fetchContext = async () => {
    try {
      setContextLoading(true);
      const clubsQ = supabase
        .from("clubs")
        .select("id,name,description,category")
        .limit(50);
      const eventsQ = supabase
        .from("events")
        .select(
          "id,title,description,status,start_at,end_at,location,capacity,club_id"
        )
        .in("status", ["upcoming", "ongoing"]) // uses updated enum
        .order("start_at", { ascending: true })
        .limit(50);
      const careersQ = supabase
        .from("careers_posts")
        .select(
          "id,title,description,type,company,location,apply_url,created_at"
        )
        .order("created_at", { ascending: false })
        .limit(50);

      const [{ data: clubs }, { data: events }, { data: careers }] =
        await Promise.all([clubsQ, eventsQ, careersQ]);

      setClubsCtx(clubs || []);
      setEventsCtx(events || []);
      setCareersCtx(careers || []);
    } catch (err) {
      console.error("Error loading assistant context:", err);
      toast({
        title: "Assistant",
        description: "Failed to load context",
        variant: "destructive",
      });
    } finally {
      setContextLoading(false);
    }
  };

  useEffect(() => {
    fetchContext();
  }, []);

  // Realtime context updates
  useEffect(() => {
    const channel = supabase
      .channel("assistant-context")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clubs" },
        () => fetchContext()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => fetchContext()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "careers_posts" },
        () => fetchContext()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const buildContextSummary = (): string => {
    const clubs = clubsCtx
      .map((c) => `Club: ${c.name} — ${c.description ?? ""} [${c.category}]`)
      .slice(0, 10)
      .join("\n");
    const events = eventsCtx
      .map(
        (e) =>
          `Event: ${e.title} — ${e.status} on ${new Date(
            e.start_at
          ).toLocaleString()} at ${e.location ?? "TBA"}`
      )
      .slice(0, 10)
      .join("\n");
    const careers = careersCtx
      .map(
        (p) =>
          `Career: [${p.type}] ${p.title}${p.company ? ` @ ${p.company}` : ""}${
            p.location ? ` (${p.location})` : ""
          }`
      )
      .slice(0, 10)
      .join("\n");
    return [clubs, events, careers].filter(Boolean).join("\n");
  };

  const hfSpaceUrl = (import.meta as any)?.env?.VITE_HF_SPACE_URL as
    | string
    | undefined;
  const hfToken = (import.meta as any)?.env?.VITE_HF_API_TOKEN as
    | "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"
    | undefined;

  // OpenAI support has been removed per user request

  // Hugging Face Space (Gradio-like) integration (non-streaming)
  async function askWithHFSpace(question: string): Promise<string> {
    if (!hfSpaceUrl) throw new Error("HF Space URL not configured");
    const context = buildContextSummary();
    const prompt = `You are a helpful university assistant. Use the provided context about clubs, events, and careers to answer. If unsure, say so and suggest next steps.\n\nContext:\n${context}\n\nUser question: ${question}`;

    const urlCandidates = [
      `${hfSpaceUrl.replace(/\/$/, "")}/run/predict`,
      `${hfSpaceUrl.replace(/\/$/, "")}/api/predict`,
    ];

    let lastErr: unknown = null;
    for (const url of urlCandidates) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(hfToken ? { Authorization: `Bearer ${hfToken}` } : {}),
          },
          body: JSON.stringify({ data: [prompt] }),
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        const first = Array.isArray(json?.data) ? json.data[0] : undefined;
        if (typeof first === "string") return first;
        if (first && typeof first.text === "string") return first.text;
        if (typeof json?.prediction === "string") return json.prediction;
        return JSON.stringify(json);
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new Error("HF Space call failed");
  }

  const heuristicAnswer = (question: string): string => {
    const q = question.toLowerCase();
    if (q.includes("job") || q.includes("career") || q.includes("intern")) {
      const top = careersCtx
        .slice(0, 3)
        .map(
          (p) =>
            `- ${p.title}${p.company ? ` @ ${p.company}` : ""}${
              p.apply_url ? ` — ${p.apply_url}` : ""
            }`
        )
        .join("\n");
      return top
        ? `Here are some recent opportunities:\n${top}\nYou can browse more in Careers.`
        : "I don't see any current job or internship posts. You can create one in Careers.";
    }
    if (q.includes("event") || q.includes("happening")) {
      const next = eventsCtx
        .slice(0, 3)
        .map(
          (e) =>
            `- ${e.title} (${e.status}) on ${new Date(
              e.start_at
            ).toLocaleString()} at ${e.location ?? "TBA"}`
        )
        .join("\n");
      return next
        ? `Upcoming events:\n${next}`
        : "I don't see any upcoming events right now.";
    }
    if (q.includes("club") || q.includes("join")) {
      const list = clubsCtx
        .slice(0, 5)
        .map((c) => `- ${c.name} [${c.category}]`)
        .join("\n");
      return list
        ? `Some clubs you might like:\n${list}\nVisit Clubs to explore more and join.`
        : "I don't see any clubs yet.";
    }
    return "I can help with clubs, events, and careers. Ask me about upcoming events, how to join clubs, or recent job posts.";
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    const newUserMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setLoading(true);
    try {
      // Try to resolve specific entity details first
      const handled = await maybeHandleDetailQuery(text);
      if (handled) {
        setLoading(false);
        return;
      }
      if (hfSpaceUrl) {
        const answer = await askWithHFSpace(text);
        const newAssistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: answer,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newAssistantMsg]);
      } else {
        const answer = heuristicAnswer(text);
        const newAssistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: answer,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newAssistantMsg]);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Assistant",
        description: "Failed to get a response",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Intent detection and specific-detail responders
  const maybeHandleDetailQuery = async (q: string): Promise<boolean> => {
    const query = q.toLowerCase();

    // Helper to append assistant message
    const reply = (content: string) => {
      const newAssistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newAssistantMsg]);
      return true;
    };

    // Extract a possible name/title after keywords
    const extractAfter = (keyword: string) => {
      const idx = query.indexOf(keyword);
      if (idx === -1) return "";
      const after = q.slice(idx + keyword.length).trim();
      return after.replace(/^about\s+|^named\s+|^called\s+/i, "").trim();
    };

    // Club details
    if (query.includes("club")) {
      const needle = extractAfter("club");
      if (!needle) {
        // Try from cached list
        if (clubsCtx.length) {
          const list = clubsCtx
            .slice(0, 5)
            .map((c) => `- ${c.name} [${c.category}]`)
            .join("\n");
          return reply(`Which club? Here are some:\n${list}`);
        }
      } else {
        const { data, error } = await supabase
          .from("clubs")
          .select("id,name,description,category,created_by")
          .ilike("name", `%${needle}%`)
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          const link = `/join-club/${data.id}`;
          const summary = `Club: ${data.name}\nCategory: ${data.category}\n${
            data.description ?? "No description"
          }\nJoin: ${link}`;
          return reply(summary);
        }
      }
    }

    // Event details
    if (query.includes("event")) {
      const needle = extractAfter("event");
      if (!needle) {
        if (eventsCtx.length) {
          const list = eventsCtx
            .slice(0, 5)
            .map(
              (e) =>
                `- ${e.title} (${e.status}) on ${new Date(
                  e.start_at
                ).toLocaleDateString()}`
            )
            .join("\n");
          return reply(`Which event? Here are some upcoming/ongoing:\n${list}`);
        }
      } else {
        const { data, error } = await supabase
          .from("events")
          .select(
            "id,title,description,status,start_at,end_at,location,capacity,club_id"
          )
          .ilike("title", `%${needle}%`)
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          const when = `${new Date(
            data.start_at
          ).toLocaleString()} - ${new Date(data.end_at).toLocaleString()}`;
          const link = `/event-registration/${data.id}`;
          const summary = `Event: ${data.title} (${
            data.status
          })\nWhen: ${when}\nWhere: ${data.location ?? "TBA"}\nCapacity: ${
            data.capacity ?? "N/A"
          }\n${data.description ?? ""}\nRegister: ${link}`;
          return reply(summary);
        }
      }
    }

    // Careers (job/internship)
    if (
      query.includes("job") ||
      query.includes("internship") ||
      query.includes("career")
    ) {
      const needle =
        extractAfter("job") ||
        extractAfter("internship") ||
        extractAfter("career");
      if (!needle) {
        if (careersCtx.length) {
          const list = careersCtx
            .slice(0, 5)
            .map(
              (p) =>
                `- [${p.type}] ${p.title}${p.company ? ` @ ${p.company}` : ""}`
            )
            .join("\n");
          return reply(
            `Which opportunity? Here are some recent:\n${list}\nSee more in /careers`
          );
        }
      } else {
        const { data, error } = await supabase
          .from("careers_posts")
          .select(
            "id,title,description,type,company,location,apply_url,created_at"
          )
          .or(`title.ilike.%${needle}%,description.ilike.%${needle}%`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          const summary = `Opportunity: [${data.type}] ${data.title}${
            data.company ? ` @ ${data.company}` : ""
          }${data.location ? ` (${data.location})` : ""}\n${
            data.description ?? ""
          }${data.apply_url ? `\nApply: ${data.apply_url}` : ""}`;
          return reply(summary);
        }
      }
    }

    // Forum thread
    if (
      query.includes("forum") ||
      query.includes("thread") ||
      query.includes("post")
    ) {
      const needle =
        extractAfter("thread") || extractAfter("forum") || extractAfter("post");
      if (needle) {
        const { data, error } = await supabase
          .from("forum_threads")
          .select("id,title,content,created_at,created_by")
          .ilike("title", `%${needle}%`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          const when = new Date(data.created_at).toLocaleString();
          const summary = `Thread: ${data.title}\nCreated: ${when}\nPreview: ${(
            data.content ?? ""
          ).slice(0, 200)}...\nOpen: /forum`;
          return reply(summary);
        }
      } else if (careersCtx.length || clubsCtx.length || eventsCtx.length) {
        return reply(
          "Tell me the thread title you want to see, and I’ll fetch it."
        );
      }
    }

    return false;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">AI Assistant</h2>
          {contextLoading ? (
            <Badge variant="secondary">Loading context…</Badge>
          ) : (
            <Badge variant="outline">Context ready</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ask about clubs, events, and careers</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={listRef}
            className="h-[50vh] overflow-y-auto space-y-4 pr-2"
          >
            {messages.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Say hello and ask about upcoming events, joining clubs, or job
                opportunities.
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start gap-2 ${
                    m.role === "assistant" ? "" : "justify-end"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <Bot className="h-5 w-5 mt-1 text-muted-foreground" />
                  ) : (
                    <User className="h-5 w-5 mt-1 text-muted-foreground" />
                  )}
                  <div
                    className={`rounded-md px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === "assistant"
                        ? "bg-accent/50"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Input
              placeholder="Ask me about a club, event, or job…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
            <Button onClick={handleSend} disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Assistant;
