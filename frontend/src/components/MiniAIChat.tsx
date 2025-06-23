"use client";
import { useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { X, Bot, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";


type Message = {
  from: "user" | "bot";
  text: string;
};

export const MiniAIChat = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

 const sendMessage = async () => {
  if (!input.trim()) return;

  const newMessage: Message = { from: "user", text: input };
  const newHistory = [...messages, newMessage];

  setMessages(newHistory);
  setInput("");
  setLoading(true);

  try {
    const res = await axiosInstance.post("/ai-chat", {
      prompt: input,
      history: newHistory,
    });

    const botReply: Message = { from: "bot", text: res.data.reply };
    setMessages((prev) => [...prev, botReply]);
  } catch (err: any) {
    setMessages((prev) => [
      ...prev,
      { from: "bot", text: "⚠️ Đã xảy ra lỗi khi gọi AI." },
    ]);
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      {/* Nút nổi mở chatbot */}
      <div
        className="fixed bottom-24 right-4 z-50 bg-primary text-white rounded-full p-3 shadow-lg cursor-pointer hover:scale-105 transition"
        onClick={() => setOpen(true)}
      >
        <Bot className="h-5 w-5" />
      </div>

      {/* Khung chat popup */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-80 h-[460px] bg-background border border-muted rounded-xl shadow-lg flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-muted bg-muted">
            <span className="font-semibold">Trợ lý âm nhạc AI</span>
            <X
              className="w-4 h-4 cursor-pointer"
              onClick={() => setOpen(false)}
            />
          </div>

          {/* Nội dung chat */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-md max-w-[85%] ${
                  msg.from === "user"
                    ? "ml-auto bg-primary text-white"
                    : "mr-auto bg-muted"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="text-muted-foreground text-xs italic">
                Đang nghĩ...
              </div>
            )}
          </div>

          {/* Input chat */}
          <div className="p-3 border-t border-muted">
            <div className="flex items-center gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                    }
                }}
                rows={2}
                className="flex-1 resize-none text-sm"
                placeholder="Hỏi AI bất kỳ điều gì về âm nhạc..."
                />

              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
