import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  useCreateChatSession, 
  useGetChatMessages, 
  useSendMessage,
  useGetHotelBranding,
  useListQuickActions
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { LogOut, Send, Loader2, MapPin, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message } from "@workspace/api-client-react/generated/api.schemas";

export default function GuestDashboard() {
  const { user, isAuthenticated, logoutAuth } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();
  
  const createSessionMutation = useCreateChatSession();
  const sendMessageMutation = useSendMessage();
  
  const { data: branding } = useGetHotelBranding();
  const { data: quickActions } = useListQuickActions();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useGetChatMessages(
    sessionId!,
    {
      query: {
        enabled: !!sessionId,
      }
    }
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    } else if (user?.role !== "guest") {
      setLocation("/manager");
    }
  }, [isAuthenticated, user, setLocation]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "guest" && !sessionId) {
      createSessionMutation.mutate(undefined, {
        onSuccess: (session) => {
          setSessionId(session.id);
        }
      });
    }
  }, [isAuthenticated, user, sessionId, createSessionMutation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMessageMutation.isPending]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSend = (content: string) => {
    if (!content.trim() || !sessionId) return;

    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    sendMessageMutation.mutate(
      { sessionId, data: { content: content.trim() } },
      {
        onSuccess: () => {
          refetchMessages();
        },
        onError: (err) => {
          toast.error("Failed to send message: " + (err.data?.error || "Unknown error"));
          // Put the text back if it failed
          setInputValue(content);
        }
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logoutAuth();
        toast.success("Checkout successful");
      }
    });
  };

  if (!isAuthenticated || user?.role !== "guest") return null;

  return (
    <div className="flex flex-col h-[100dvh] bg-[#FAFAFA]">
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-100 shrink-0 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl font-medium text-zinc-900">
              {branding?.appName || "Guest Pro"}
            </h1>
            <p className="text-xs text-zinc-500 font-medium">
              Welcome, {user.firstName} • Room {user.roomNumber}
            </p>
          </div>
          <Button 
            data-testid="button-checkout"
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-zinc-500 hover:text-zinc-900 rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto px-4 py-8">
        {!sessionId || messagesLoading ? (
          <div className="space-y-6 animate-pulse">
            <Skeleton className="h-24 w-3/4 max-w-sm rounded-3xl rounded-tl-sm bg-zinc-100" />
            <div className="flex justify-end">
              <Skeleton className="h-16 w-2/3 max-w-sm rounded-3xl rounded-tr-sm bg-zinc-100" />
            </div>
            <Skeleton className="h-32 w-5/6 max-w-md rounded-3xl rounded-tl-sm bg-zinc-100" />
          </div>
        ) : messages?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 mt-12 animate-in fade-in duration-1000">
            <div className="w-24 h-24 rounded-full bg-white shadow-xl shadow-zinc-200/50 flex items-center justify-center border border-zinc-50 mb-4">
              <Sparkles className="w-10 h-10 text-zinc-400" />
            </div>
            <h2 className="text-3xl font-serif text-zinc-800">
              {branding?.welcomeText || `Good to see you, ${user.firstName}`}
            </h2>
            <p className="text-zinc-500 max-w-sm mx-auto text-lg leading-relaxed">
              I am your personal concierge. How can I make your stay exceptional today?
            </p>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {messages?.filter(m => m.role !== "system").map((msg: Message) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[85%] px-5 py-4 text-[15px] leading-relaxed shadow-sm
                    ${msg.role === "user" 
                      ? "bg-zinc-900 text-white rounded-3xl rounded-tr-sm" 
                      : "bg-white text-zinc-800 rounded-3xl rounded-tl-sm border border-zinc-100"
                    }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {sendMessageMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white border border-zinc-100 rounded-3xl rounded-tl-sm px-6 py-5 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </main>

      <div className="bg-[#FAFAFA] shrink-0 sticky bottom-0 z-20 pb-safe">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
          {/* Quick Actions */}
          {!messagesLoading && messages?.length === 0 && quickActions && quickActions.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
              {quickActions.map(action => (
                <button
                  key={action.id}
                  data-testid={`quick-action-${action.id}`}
                  onClick={() => handleSend(action.label)}
                  className="shrink-0 snap-start bg-white border border-zinc-200 shadow-sm px-4 py-2.5 rounded-full text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors whitespace-nowrap flex items-center gap-2"
                >
                  {action.icon === "map-pin" && <MapPin className="w-4 h-4 text-zinc-400" />}
                  {action.icon === "calendar" && <Calendar className="w-4 h-4 text-zinc-400" />}
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Premium Input Bar */}
          <div className="relative">
            <div className="premium-gradient-border rounded-3xl bg-white shadow-xl shadow-zinc-200/50 flex items-end p-2 relative z-10">
              <textarea
                ref={textareaRef}
                data-testid="input-message"
                value={inputValue}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask for anything..."
                rows={1}
                className="flex-1 max-h-[120px] bg-transparent border-0 resize-none outline-none focus:ring-0 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 font-sans"
                disabled={sendMessageMutation.isPending || !sessionId}
              />
              <div className="p-1 shrink-0">
                <Button 
                  data-testid="button-send"
                  size="icon"
                  className={`w-12 h-12 rounded-2xl transition-all duration-300 ${inputValue.trim() ? 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-md' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'}`}
                  disabled={!inputValue.trim() || sendMessageMutation.isPending || !sessionId}
                  onClick={() => handleSend(inputValue)}
                >
                  {sendMessageMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
