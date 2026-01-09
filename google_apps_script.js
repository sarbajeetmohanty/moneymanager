
/**
 * FinanceFlow Pro - Backend Engine v10.0
 * Updated for simplified kid-friendly language and custom categories.
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();

function setupSheets() {
  const sheetsConfig = {
    'Users': ['id', 'username', 'email', 'password_hash', 'phoneNumber', 'upiId', 'isVerified', 'budget', 'photoURL', 'theme', 'mode', 'stylePreset', 'categories'],
    'Transactions': ['id', 'creatorId', 'type', 'amount', 'paidAmount', 'mode', 'category', 'notes', 'timestamp', 'status', 'payerId', 'friendId', 'subcategory'],
    'Splits': ['transactionId', 'userId', 'share', 'paidAmount', 'status'], 
    'Friends': ['userId1', 'userId2', 'status'],
    'Notifications': ['id', 'targetUserId', 'senderId', 'senderName', 'type', 'message', 'transactionId', 'amount', 'timestamp', 'isResolved']
  };

  for (let name in sheetsConfig) {
    let sheet = SS.getSheetByName(name);
    if (!sheet) sheet = SS.insertSheet(name);
    sheet.getRange(1, 1, 1, sheetsConfig[name].length).setValues([sheetsConfig[name]]);
    sheet.getRange(1, 1, 1, sheetsConfig[name].length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    let response;

    switch (action) {
      case 'signup': response = handleSignup(data); break;
      case 'login': response = handleLogin(data); break;
      case 'updateProfile': response = handleUpdateProfile(data); break;
      case 'saveTransaction': response = handleSaveTransaction(data); break;
      case 'fetchDashboardData': response = handleFetchDashboard(data); break;
      case 'fetchFriends': response = handleFetchFriends(data); break;
      case 'fetchNotifications': response = handleFetchNotifications(data); break;
      case 'fetchTransactionHistory': response = handleFetchHistory(data); break;
      case 'handleAction': response = handleAction(data); break;
      case 'sendFriendRequest': response = handleFriendRequest(data); break;
      case 'removeFriend': response = handleRemoveFriend(data); break;
      case 'searchUsers': response = handleSearchUsers(data); break;
      default: response = { success: false, error: 'Action not found' };
    }

    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function hash(str) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str);
  return digest.map(b => (b & 0xff).toString(16).padStart(2, '0')).join('');
}

function handleSignup(data) {
  const { username, email, password } = data;
  const sheet = getSheet('Users');
  const rows = sheet.getDataRange().getValues();
  if (rows.some(r => r[1] === username || r[2] === email)) {
    return { success: false, error: 'User already exists' };
  }
  const id = 'U' + Utilities.getUuid().split('-')[0];
  // Initial categories set to empty array as per request to remove defaults
  const initialCats = JSON.stringify([]);
  const user = [id, username, email, hash(password), '', '', false, 0, '', 'indigo', 'light', 'modern', initialCats];
  sheet.appendRow(user);
  return { success: true, user: { id, username, email, isVerified: false, budget: 0, theme: 'indigo', mode: 'light', stylePreset: 'modern', categories: [] } };
}

function handleLogin(data) {
  const { usernameOrEmail, password } = data;
  const sheet = getSheet('Users');
  const rows = sheet.getDataRange().getValues();
  const user = rows.find(r => (r[1] === usernameOrEmail || r[2] === usernameOrEmail) && r[3] === hash(password));
  if (!user) return { success: false, error: 'Invalid details' };
  
  let cats = [];
  try {
    cats = JSON.parse(user[12] || '[]');
  } catch (e) {
    cats = [];
  }

  return { 
    success: true, 
    user: { 
      id: user[0], username: user[1], email: user[2], phoneNumber: user[4], 
      upiId: user[5], isVerified: user[6], budget: user[7], photoURL: user[8],
      theme: user[9], mode: user[10], stylePreset: user[11], categories: cats
    } 
  };
}

function handleUpdateProfile(data) {
  const { userId, updates, currentPassword } = data;
  const sheet = getSheet('Users');
  const rows = sheet.getDataRange().getValues();
  const index = rows.findIndex(r => r[0] === userId);
  if (index === -1) return { success: false, error: 'User not found' };

  const sensitiveKeys = ['email', 'password', 'phoneNumber'];
  const isSensitive = Object.keys(updates).some(k => sensitiveKeys.includes(k));

  if (isSensitive) {
    if (!currentPassword || currentPassword === "dummy" || hash(currentPassword) !== rows[index][3]) {
      return { success: false, error: 'Password check failed. Please enter the correct password.' };
    }
  }

  const headers = rows[0];
  for (let key in updates) {
    const colIndex = headers.indexOf(key);
    if (colIndex !== -1) {
      let val = updates[key];
      if (key === 'password') val = hash(val);
      if (key === 'categories') val = JSON.stringify(val);
      sheet.getRange(index + 1, colIndex + 1).setValue(val);
    }
  }
  return { success: true };
}

function getSheet(name) { return SS.getSheetByName(name); }
