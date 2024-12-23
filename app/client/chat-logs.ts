import { ChatMessage, ChatSession } from "../store/chat";
import { nanoid } from "nanoid";
import { getLang } from "../locales";
import { ServiceProvider } from "../constant";

export interface ChatLogApi {
  createMessage(message: Partial<ChatMessage>): Promise<ChatMessage>;
  createSession(): Promise<ChatSession>;
  addMessage(sessionId: string, message: ChatMessage): Promise<void>;
  updateSession(session: ChatSession): Promise<void>;
}

class ChatLogApiClient implements ChatLogApi {
  private apiUrl = "/api/chat-logs";

  async createMessage(override: Partial<ChatMessage>): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: nanoid(),
      date: new Date().toLocaleString(),
      role: "user",
      content: "",
      ...override,
    };

    const response = await fetch(`${this.apiUrl}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Failed to create message: ${response.statusText}`);
    }

    return message;
  }

  async createSession(): Promise<ChatSession> {
    const session: ChatSession = {
      id: nanoid(),
      topic: "New Chat",
      memoryPrompt: "",
      messages: [],
      stat: {
        tokenCount: 0,
        wordCount: 0,
        charCount: 0,
      },
      lastUpdate: Date.now(),
      lastSummarizeIndex: 0,
      mask: {
        id: nanoid(),
        name: "Default",
        avatar: "default-avatar",
        context: [],
        syncGlobalConfig: true,
        createdAt: Date.now(),
        modelConfig: {
          model: "gpt-3.5-turbo",
          providerName: ServiceProvider.OpenAI,
          temperature: 1,
          top_p: 1,
          max_tokens: 2000,
          presence_penalty: 0,
          frequency_penalty: 0,
          sendMemory: true,
          historyMessageCount: 4,
          compressMessageLengthThreshold: 1000,
          compressModel: "gpt-3.5-turbo",
          enableInjectSystemPrompts: true,
          template: "",
          size: "1024x1024",
          quality: "standard",
          compressProviderName: "openai",
          style: "natural",
        },
        lang: getLang(),
        builtin: false,
      },
    };

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    return session;
  }

  async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${sessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Failed to add message: ${response.statusText}`);
    }
  }

  async updateSession(session: ChatSession): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${session.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });

    if (!response.ok) {
      throw new Error(`Failed to update session: ${response.statusText}`);
    }
  }
}

export const chatLogApi = new ChatLogApiClient();
