import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Using Gemini 2.5 Flash model for faster, more efficient responses
// This model is optimized for real-time chat applications
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_VERSION = "v1";

// System prompt to restrict chatbot to RoomBridge platform only
const SYSTEM_PROMPT = `You are RoomBridge AI Assistant, a helpful chatbot for the RoomBridge platform - a room rental and roommate matching service.

IMPORTANT RULES:
1. ONLY answer questions about RoomBridge platform features, functionality, and usage
2. DO NOT answer questions about other topics (politics, news, general knowledge, etc.)
3. If asked about non-RoomBridge topics, politely redirect: "I can only help with RoomBridge platform questions. How can I assist you with finding rooms or roommates?"

ROOMBRIDGE PLATFORM FEATURES:
- Browse Listings: View available rooms (Long-Term, PG, Short Stay, Emergency, Flatmate)
- Post Listings: List your room for rent with photos, amenities, preferences
- Room Requests: Post what you're looking for, others can contact you
- Smart Matching: AI-powered compatibility scoring based on location, college, profession, gender preferences
- Distance-Based Search: See how far listings are from your location
- Emergency Rooms: Urgent listings that expire after 3 days
- Messaging: Chat with room owners and seekers
- Ratings & Reviews: Rate users after interactions
- Profile Verification: Upload Student ID, Aadhaar/PAN, Live Selfie
- Reports & Moderation: Report inappropriate users, auto-moderation system
- Admin Dashboard: Manage users, listings, reports, verifications

SMART SECTIONS:
- 🚨 Emergency Rooms: Urgent listings
- 🔥 Best Matches: 70%+ compatibility score
- 📍 Nearby Rooms: Within 10km of your location
- 🎓 Same College: Listings near your college
- 🌍 Same Hometown: Listings from your hometown

Keep responses concise, friendly, and helpful. Use emojis occasionally.`;

export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! 👋 I'm RoomBridge AI Assistant. Ask me anything about finding rooms, posting listings, or using the platform!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
      toast({
        title: "API Key Missing",
        description: "Please add your Gemini API key to .env file",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call Gemini API with Gemini 2.5 Flash model
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${SYSTEM_PROMPT}\n\nUser Question: ${userMessage.content}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
              topP: 0.95,
              topK: 40,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();
      const aiResponse =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't generate a response. Please try again.";

      const assistantMessage: Message = {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });

      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:shadow-violet-500/50 transition-shadow"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Bot className="w-6 h-6" />
            </motion.div>
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-96 h-[600px] bg-card rounded-2xl shadow-2xl border border-border z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">RoomBridge AI</h3>
                  <p className="text-xs text-white/80 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-violet-50/30 to-transparent dark:from-violet-950/10">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-3 h-3 text-violet-600" />
                        <span className="text-xs font-semibold text-violet-600">
                          AI Assistant
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p
                      className={`text-[10px] mt-1 ${
                        message.role === "user"
                          ? "text-white/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                    <span className="text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about RoomBridge..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
