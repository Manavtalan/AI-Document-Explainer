import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContractStore } from "@/hooks/useContractStore";
import { supabase } from "@/integrations/supabase/client";

const SUGGESTIONS = [
  "What are my main obligations?",
  "Can I terminate this early?",
  "What are the payment penalties?",
  "Explain the liability clause",
];

const MAX_MESSAGES = 20;

const ContractChatPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { chatMessages, addChatMessage, extractedText, analysis } = useContractStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    if (chatMessages.length >= MAX_MESSAGES * 2) return;

    addChatMessage("user", text.trim());
    setInput("");
    setIsLoading(true);

    try {
      const history = [
        ...chatMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text.trim() },
      ];

      const { data, error } = await supabase.functions.invoke("contract-qa", {
        body: {
          originalText: extractedText,
          analysisResult: analysis,
          messages: history,
        },
      });

      if (error || !data?.success) {
        addChatMessage("assistant", "Sorry, I couldn't process your question. Please try again.");
      } else {
        addChatMessage("assistant", data.reply);
      }
    } catch {
      addChatMessage("assistant", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const limitReached = chatMessages.length >= MAX_MESSAGES * 2;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">Ask about your contract</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] h-[100dvh] sm:h-[600px] bg-background border border-border rounded-none sm:rounded-2xl shadow-xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-serif font-semibold text-sm">
          💬 Ask About Your Contract
        </h3>
        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Ask any question about your contract analysis.
          </p>
        )}
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              DocBrief is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {chatMessages.length === 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 border-t border-border">
        {limitReached ? (
          <p className="text-xs text-muted-foreground text-center">
            You've reached the Q&A limit for this analysis.
          </p>
        ) : (
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask a question about your contract..."
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            />
            <Button size="sm" onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractChatPanel;
