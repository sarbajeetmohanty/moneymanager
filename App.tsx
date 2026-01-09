import { GoogleGenAI } from "@google/genai";

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbyqQg_e2kGxQO6npYMZZDwd7-m3ANpY8i7AEasNUQekPbw0WKJm-0gntcpbPzBVFGTb/exec';

async function request(action: string, data: any = {}) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      body: JSON.stringify({ action, ...data }),
    });
    
    if (!response.ok) throw new Error("Network error: " + response.statusText);
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`API Error [${action}]:`, error);
    return { success: false, error: "Connection to finance cloud failed. Check your internet or script URL." };
  }
}

export const api = {
  login: (u: string, p: string) => request('login', { usernameOrEmail: u, password: p }),
  signup: (d: any) => request('signup', d),
  updateProfile: (id: string, updates: any, p?: string) => request('updateProfile', { userId: id, updates, currentPassword: p }),
  saveTransaction: (id: string, t: any) => request('saveTransaction', { userId: id, transaction: t }),
  fetchDashboard: (id: string) => request('fetchDashboardData', { userId: id }),
  fetchFriends: (id: string) => request('fetchFriends', { userId: id }),
  fetchNotifications: (id: string) => request('fetchNotifications', { userId: id }),
  fetchTransactionHistory: (id: string) => request('fetchTransactionHistory', { userId: id }),
  handleAction: (id: string, nId: string, act: string, tId: string, amount?: number) => request('handleAction', { userId: id, notificationId: nId, action: act, transactionId: tId, amount }),
  removeFriend: (id: string, fId: string) => request('removeFriend', { userId: id, friendId: fId }),
  sendFriendRequest: (userId: string, targetUsername: string) => request('sendFriendRequest', { userId, targetUsername }),
  searchUsers: (query: string) => request('searchUsers', { query }),
  
  // Gemini AI Logic Extension
  getWealthInsight: async (stats: any, recentHistory: any[]) => {
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
      const prompt = `Act as a cool financial coach for Gen-Z. 
      Analyze these stats: Net Worth: ₹${stats.total}, Income: ₹${stats.incoming}, Spent: ₹${stats.outgoing}.
      Recent logs: ${JSON.stringify(recentHistory.slice(0, 3).map(h => h.notes || h.category))}.
      Give ONE bold, short advice (max 15 words) that sounds empowering.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      return response.text || "Keep stacking that paper! 💸";
    } catch (e) {
      return "Wealth is a journey, keep tracking! 🚀";
    }
  }
};
