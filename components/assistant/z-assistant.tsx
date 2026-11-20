"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Check, ChevronDown, LoaderCircle, Send, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

type Message = { role: "user" | "assistant"; content: string };
type Draft = { name: string; email: string; subject: string; message: string };
const readPerformanceNow = () => performance.now();
const suggestions = [
  "Tell me about Varun.",
  "What projects has he built?",
  "What technologies does he use?",
  "What is Grey Hat Scout?",
  "What cybersecurity topics interest him?",
  "How can I contact him?",
];

export function ZAssistant() {
  const [open, setOpen] = useState(false),
    [bubble, setBubble] = useState(false),
    [dismissed, setDismissed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hey, I’m Z — Varun’s portfolio assistant. Ask me about his projects, interests, or how to get in touch.",
    },
  ]);
  const [input, setInput] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null),
    [sent, setSent] = useState(false),
    [review, setReview] = useState(false);
  const bottom = useRef<HTMLDivElement>(null),
    textarea = useRef<HTMLTextAreaElement>(null),
    launcher = useRef<HTMLButtonElement>(null),
    sending = useRef(false);
  const reduced = useReducedMotion();
  const pathname = usePathname();
  useEffect(() => {
    if (open || dismissed) return;
    let show: number | undefined, hide: number | undefined;
    const schedule = () => {
      show = window.setTimeout(
        () => {
          setBubble(true);
          hide = window.setTimeout(() => {
            setBubble(false);
            schedule();
          }, 2000);
        },
        15000 + Math.random() * 5000,
      );
    };
    schedule();
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [open, dismissed]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }, [messages, loading, draft, reduced]);
  const hadOpened = useRef(false);
  useEffect(() => {
    if (open) {
      hadOpened.current = true;
      textarea.current?.focus();
    } else if (hadOpened.current) {
      launcher.current?.focus();
      hadOpened.current = false;
    }
  }, [open]);
  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setBubble(false);
      setDismissed(true);
    };
    window.addEventListener("open-z-assistant", onOpen);
    return () => window.removeEventListener("open-z-assistant", onOpen);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setBubble(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function sendMessage(value = input) {
    const content = value.trim();
    if (!content || sending.current) return;
    sending.current = true;
    setError("");
    setInput("");
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setLoading(true);
    const startedAt = readPerformanceNow();
    let firstTokenAt: number | undefined;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: content,
          history: messages
            .filter((item) => item.role === "user")
            .slice(-3)
            .map((item) => ({ role: "user", content: item.content })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Z is having trouble responding.");
      }
      if (!res.body) throw new Error("Z’s response stream was unavailable. Please try again.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let intent: string | null = null;
      let completed = false;
      const appendEvent = (line: string) => {
        const payload = line.trim();
        if (!payload.startsWith("data:")) return;
        const value = payload.slice(5).trim();
        if (!value) return;
        const event = JSON.parse(value) as {
          token?: string;
          error?: string;
          done?: boolean;
          intent?: string | null;
        };
        if (event.error) throw new Error(event.error);
        if (event.token) {
          if (!firstTokenAt) firstTokenAt = readPerformanceNow();
          setMessages((items) => {
            const last = items[items.length - 1];
            if (!last || last.role !== "assistant")
              return [...items, { role: "assistant", content: event.token! }];
            return [...items.slice(0, -1), { ...last, content: last.content + event.token }];
          });
        }
        if (event.done) {
          completed = true;
          intent = event.intent ?? null;
        }
      };
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) appendEvent(line);
      }
      buffer += decoder.decode();
      if (buffer.trim()) appendEvent(buffer);
      console.info("[z-chat] Client response timing", {
        timeToFirstTokenMs: firstTokenAt ? Math.round(firstTokenAt - startedAt) : null,
        totalMs: Math.round(readPerformanceNow() - startedAt),
      });
      if (!completed || !firstTokenAt)
        throw new Error("Z’s response ended early. Please try again.");
      if (intent === "contact") {
        setDraft({ name: "", email: "", subject: "", message: "" });
        setReview(false);
        setSent(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      sending.current = false;
      setLoading(false);
    }
  }
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void sendMessage();
  }
  function openAssistant() {
    setOpen(true);
    setBubble(false);
    setDismissed(true);
  }
  function startContact() {
    setDraft({ name: "", email: "", subject: "", message: "" });
    setReview(false);
    setSent(false);
    setMessages((v) => [
      ...v,
      {
        role: "assistant",
        content:
          "I can pass a message to Varun for review. First, what name and email address should I include?",
      },
    ]);
  }
  function updateDraft(key: keyof Draft, value: string) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    setReview(false);
  }
  async function submitEnquiry() {
    if (!draft || sending.current) return;
    sending.current = true;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...draft, website: "", confirmed: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not submit enquiry.");
      setDraft(null);
      setReview(false);
      setSent(true);
      setMessages((v) => [
        ...v,
        {
          role: "assistant",
          content:
            "Your enquiry has been submitted successfully. Varun can review it in his private dashboard.",
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit enquiry.");
    } finally {
      sending.current = false;
      setLoading(false);
    }
  }
  const isReview = review && !!draft;
  if (pathname.split("/").includes("admin")) return null;
  return (
    <>
      <div className="z-dock">
        <AnimatePresence>
          {bubble && !open && (
            <motion.div
              className="z-prompt"
              initial={reduced ? false : { opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5 }}
            >
              <span>Want to know more about Varun?</span>
              <button
                aria-label="Dismiss suggestion"
                onClick={() => {
                  setBubble(false);
                  setDismissed(true);
                }}
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          ref={launcher}
          className="z-launcher"
          onClick={open ? () => setOpen(false) : openAssistant}
          aria-label={open ? "Close Z assistant" : "Open Z AI assistant"}
          aria-expanded={open}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={open ? "close" : "bot"}
              initial={reduced ? false : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
            >
              <span className="z-orbit" />
              {open ? (
                <X size={22} />
              ) : (
                <>
                  <Sparkles className="z-spark" size={14} />
                  <Bot size={22} />
                </>
              )}
            </motion.span>
          </AnimatePresence>
          <span className="sr-only">Z, AI portfolio assistant</span>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.section
            className="z-panel"
            role="dialog"
            aria-modal="false"
            aria-label="Chat with Z"
            initial={reduced ? false : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
          >
            <div className="z-head">
              <div className="z-avatar">
                <Bot size={20} />
                <i />
              </div>
              <div className="z-headcopy">
                <b>
                  Z <span>AI ASSISTANT</span>
                </b>
                <small>
                  <i /> Here to help
                </small>
              </div>
              <button
                className="z-icon-button"
                aria-label="Reset conversation"
                onClick={() => {
                  setMessages([
                    {
                      role: "assistant",
                      content:
                        "Hey, I’m Z — Varun’s portfolio assistant. Ask me about his projects, interests, or how to get in touch.",
                    },
                  ]);
                  setDraft(null);
                  setSent(false);
                  setError("");
                }}
              >
                <span>Reset</span>
              </button>
              <button
                className="z-icon-button"
                aria-label="Close Z assistant"
                onClick={() => setOpen(false)}
              >
                <ChevronDown size={18} />
              </button>
            </div>
            <div className="z-messages" aria-live="polite" aria-relevant="additions">
              {messages.map((m, i) => (
                <motion.div
                  className={`z-message ${m.role}`}
                  key={i}
                  initial={reduced ? false : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduced ? 0 : 0.2 }}
                >
                  <div className="message-avatar">
                    {m.role === "assistant" ? <Sparkles size={13} /> : "Y"}
                  </div>
                  <p>{m.content}</p>
                </motion.div>
              ))}
              {loading && (
                <div className="z-message assistant">
                  <div className="message-avatar">
                    <Sparkles size={13} />
                  </div>
                  <p className="typing">
                    <i />
                    <i />
                    <i />
                  </p>
                </div>
              )}
              {draft && !sent && (
                <div className="z-form-wrap">
                  <div className="z-form-title">
                    <b>{isReview ? "Review your enquiry" : "Enquiry details"}</b>
                    <small>
                      {isReview
                        ? "Please check everything before submitting."
                        : "Your information will be stored for Varun to review."}
                    </small>
                  </div>
                  {isReview ? (
                    <div className="enquiry-review">
                      <div>
                        <small>Name</small>
                        <b>{draft.name}</b>
                      </div>
                      <div>
                        <small>Email</small>
                        <b>{draft.email}</b>
                      </div>
                      <div>
                        <small>Subject</small>
                        <b>{draft.subject}</b>
                      </div>
                      <div>
                        <small>Message</small>
                        <p>{draft.message}</p>
                      </div>
                      <p className="review-confirm">
                        Would you like me to submit this enquiry to Varun?
                      </p>
                      <div className="review-actions">
                        <button
                          className="button button-primary"
                          disabled={loading}
                          onClick={() => void submitEnquiry()}
                        >
                          <Check size={15} /> Confirm and Submit
                        </button>
                        <button
                          className="button"
                          onClick={() => {
                            setDraft(null);
                            setReview(false);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="enquiry-fields">
                      <label>
                        Name
                        <input
                          autoComplete="name"
                          maxLength={100}
                          value={draft.name}
                          onChange={(e) => updateDraft("name", e.target.value)}
                          placeholder="Your name"
                        />
                      </label>
                      <label>
                        Email address
                        <input
                          type="email"
                          autoComplete="email"
                          maxLength={254}
                          value={draft.email}
                          onChange={(e) => updateDraft("email", e.target.value)}
                          placeholder="you@example.com"
                        />
                      </label>
                      <label>
                        Subject
                        <input
                          maxLength={160}
                          value={draft.subject}
                          onChange={(e) => updateDraft("subject", e.target.value)}
                          placeholder="What is this about?"
                        />
                      </label>
                      <label>
                        Message
                        <textarea
                          maxLength={5000}
                          rows={3}
                          value={draft.message}
                          onChange={(e) => updateDraft("message", e.target.value)}
                          placeholder="Tell Varun a little more…"
                        />
                      </label>
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => {
                          if (
                            !draft.name ||
                            !/^\S+@\S+\.\S+$/.test(draft.email) ||
                            !draft.subject ||
                            !draft.message
                          ) {
                            setError(
                              "Please complete every field with a valid email before reviewing.",
                            );
                            return;
                          }
                          setError("");
                          setReview(true);
                        }}
                      >
                        Review enquiry <ArrowIcon />
                      </button>
                    </div>
                  )}
                </div>
              )}
              {error && (
                <p className="z-error" role="alert">
                  {error}
                </p>
              )}
              {!draft && messages.length < 3 && (
                <div className="z-suggestions">
                  <span>QUICK QUESTIONS</span>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        s.startsWith("How can I contact") ? startContact() : void sendMessage(s)
                      }
                    >
                      {s}
                      <span>↗</span>
                    </button>
                  ))}
                  <button onClick={startContact}>
                    I’d like to contact Varun <span>↗</span>
                  </button>
                </div>
              )}
              <div ref={bottom} />
            </div>
            <form className="z-compose" onSubmit={onSubmit}>
              <textarea
                ref={textarea}
                rows={1}
                aria-label="Message Z"
                placeholder="Ask about Varun’s portfolio…"
                value={input}
                maxLength={1200}
                disabled={!!draft || loading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!input.trim() || loading || !!draft}
              >
                {loading ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}
              </button>
            </form>
            <div className="z-footnote">
              Z can answer about Varun’s public portfolio. <a href="/privacy">Privacy</a>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}
