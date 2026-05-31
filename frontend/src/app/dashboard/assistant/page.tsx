"use client";

import React, { useEffect, useState, useRef } from "react";
import { MessageSquare, Plus, Send, Sparkles, BrainCircuit, AlertTriangle, MessageCircle, Bot } from "lucide-react";
import { api } from "@/lib/api";
import { Conversation, ChatMessage } from "@/types";
import ChatBubble from "@/components/ChatBubble";
import { cn } from "@/lib/utils";

export default function AssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const promptChips = [
    "Explain my latest report summary.",
    "Compare my last two hemoglobin markers.",
    "What does a high WBC level suggest?",
    "Why is lipid parameter tracking crucial?",
  ];

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setSidebarLoading(true);
      const res = await api.chat.getConversations();
      const list = res.data || [];
      setConversations(list);
      
      if (list.length > 0) {
        setSelectedConvId(list[0].id);
      } else {
        // Automatically trigger a default new chat if none exist
        handleCreateNewChat("First AI Health Consultation");
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
    } finally {
      setSidebarLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    if (!convId) return;
    try {
      setChatLoading(true);
      const res = await api.chat.getMessages(convId);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);
    }
  }, [selectedConvId]);

  const handleCreateNewChat = async (titleStr?: string) => {
    try {
      const title = titleStr || `Consultation #${conversations.length + 1}`;
      const res = await api.chat.createConversation(title);
      const newConv = res.data;
      
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConvId(newConv.id);
      setMessages([]);
    } catch (err) {
      console.error("Error creating chat session:", err);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !selectedConvId || isSending) return;
    
    // Add user message locally for instant UI feedback
    const tempUserMsg: ChatMessage = {
      id: `temp-u-${Date.now()}`,
      sender: "USER",
      message_text: text,
      created_at: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, tempUserMsg]);
    setNewMessage("");
    setIsSending(true);

    try {
      // Trigger RAG chat call
      const res = await api.chat.sendMessage(selectedConvId, text);
      const assistantMsg = res.data;
      
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Error sending chat message:", err);
      
      // Append an error indicator bubble
      const tempErrorMsg: ChatMessage = {
        id: `temp-err-${Date.now()}`,
        sender: "ASSISTANT",
        message_text: "System: An error occurred while routing the query. Please verify that your Gemini API key is configured correctly in Pydantic settings.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempErrorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 animate-fade-in font-sans pb-4">
      
      {/* Left panel: Conversation Sessions index */}
      <div className="w-full md:w-64 glass rounded-3xl p-4 border border-white/5 flex flex-col justify-between h-48 md:h-full shrink-0">
        <div className="flex flex-col h-full overflow-hidden">
          <button
            onClick={() => handleCreateNewChat()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 hover:border-brand-cyan/30 bg-white/5 hover:bg-brand-cyan/5 text-zinc-200 hover:text-white font-bold text-xs shadow-md transition-all duration-300 mb-4 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-brand-cyan" />
            <span>Start New Consult</span>
          </button>

          <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2 block">
              Consultation Logs
            </span>
            {sidebarLoading ? (
              <div className="text-zinc-600 text-xs px-2 animate-pulse">Syncing logs...</div>
            ) : conversations.length === 0 ? (
              <div className="text-zinc-500 text-xs px-2 italic">No logs compiled.</div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 truncate transition-all",
                    selectedConvId === conv.id
                      ? "text-brand-cyan bg-brand-cyan/10 border-l-2 border-brand-cyan"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border-l-2 border-transparent"
                  )}
                >
                  <MessageSquare className="h-4 w-4 text-zinc-500 shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right panel: Live Chat dialogue */}
      <div className="flex-1 glass rounded-3xl p-4 border border-white/5 flex flex-col h-[calc(100vh-320px)] md:h-full justify-between relative overflow-hidden">
        
        {/* Persistent compliance disclaimer at top */}
        <div className="bg-brand-danger/5 border-b border-brand-danger/20 p-3 flex gap-3 items-center text-[10px] leading-relaxed text-zinc-400 shrink-0 -mx-4 -mt-4 mb-2 z-10 px-6">
          <AlertTriangle className="h-4.5 w-4.5 text-brand-danger shrink-0 animate-pulse" />
          <p>
            <span className="font-bold text-zinc-300">Liability Compliance Notice:</span> BioLens AI Health Assistant explains reports informational analysis only. It does not diagnose clinical conditions. Consult a GP for medical choices.
          </p>
        </div>

        {/* Scrollable messages container */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-thin py-2">
          {chatLoading && messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-zinc-600 gap-2">
              <BrainCircuit className="h-8 w-8 text-brand-cyan animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Syncing conversational context...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-zinc-500 text-center space-y-4 px-8 max-w-md mx-auto select-none">
              <div className="h-14 w-14 rounded-2xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
                <Bot className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-outfit text-base font-bold text-white tracking-tight">RAG AI Health advisor</h3>
                <p className="text-zinc-400 text-xs">
                  Ask me anything about your uploaded medical records, health trends, or lab reference ranges.
                </p>
              </div>
              
              {/* Prompt chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
                {promptChips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(chip)}
                    className="text-left p-2.5 rounded-xl border border-white/5 hover:border-brand-cyan/30 bg-white/5 hover:bg-brand-cyan/5 text-[10px] text-zinc-300 font-semibold leading-relaxed transition-all cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                sender={msg.sender}
                messageText={msg.message_text}
                timestamp={msg.created_at}
              />
            ))
          )}
          
          {isSending && (
            <div className="flex gap-3 max-w-3xl my-3.5 animate-pulse">
              <div className="h-9 w-9 rounded-xl bg-brand-cyan/10 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-brand-cyan animate-spin" />
              </div>
              <div className="flex flex-col gap-1 max-w-[85%]">
                <div className="p-4 rounded-2xl rounded-tl-none glass border border-white/5 text-zinc-500 text-xs font-semibold italic flex items-center gap-2">
                  <span>Assistant is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input form */}
        <div className="border-t border-white/5 pt-3.5 flex gap-2 shrink-0">
          <input
            type="text"
            placeholder={
              selectedConvId
                ? "Query laboratory values, health trends, or terms..."
                : "Select or initialize a consultation log..."
            }
            value={newMessage}
            disabled={!selectedConvId || isSending}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage(newMessage);
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-brand-cyan/20 focus:border-brand-cyan/50 focus:bg-white/10 outline-none text-sm text-zinc-100 placeholder-zinc-500 transition-all font-medium disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage(newMessage)}
            disabled={!selectedConvId || isSending || !newMessage.trim()}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple hover:from-brand-cyan-hover hover:to-brand-cyan text-white flex items-center justify-center shadow-lg hover:shadow-brand-cyan/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
