
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbzqQgyhJr90wsY1w0rNDrqnytRNC_ETqA7CAnAxAXX_6eg-I0iPu-wx91HaHmb_rrvl/exec';

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
  // Updated handleAction to support an optional 5th argument 'amount' for partial payments and settlements
  handleAction: (id: string, nId: string, act: string, tId: string, amount?: number) => request('handleAction', { userId: id, notificationId: nId, action: act, transactionId: tId, amount }),
  removeFriend: (id: string, fId: string) => request('removeFriend', { userId: id, friendId: fId }),
  sendFriendRequest: (userId: string, targetUsername: string) => request('sendFriendRequest', { userId, targetUsername }),
  searchUsers: (query: string) => request('searchUsers', { query }),
};
