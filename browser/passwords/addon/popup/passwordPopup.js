// Configuration
const API_URL = 'http://password.think.pad/api/index.php'; // USER: Change this to your VPS URL
const API_KEY = 'my-secret-api-key';

// State
let vault = {
  passwords: [],
  notes: [],
  totp: []
};

// TOTP refresh interval
let totpRefreshInterval = null;

// UI Elements
const tabs = {
  passwords: document.getElementById('tab-passwords'),
  notes: document.getElementById('tab-notes'),
  totp: document.getElementById('tab-totp')
};

const sections = {
  passwords: document.getElementById('passwords-section'),
  notes: document.getElementById('notes-section'),
  totp: document.getElementById('totp-section')
};

const lists = {
  passwords: document.getElementById('password-list'),
  notes: document.getElementById('notes-list'),
  totp: document.getElementById('totp-list')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  initializeIcons();
  await checkAuth();
  await loadLocalVault();
  renderVault();
  setupEventListeners();
  startTotpRefresh();
});

function initializeIcons() {
  // Login screen icon
  const loginTitle = document.getElementById('login-title');
  const lockIcon = createIcon('lock');
  loginTitle.insertBefore(lockIcon, loginTitle.firstChild);

  // Header buttons
  setButtonIcon(document.getElementById('download-btn'), 'download');
  setButtonIcon(document.getElementById('sync-btn'), 'sync');
}

async function checkAuth() {
  const password = await window.cryptoUtils.getMasterPassword();
  const loginScreen = document.getElementById('login-screen');
  if (password) {
    loginScreen.style.display = 'none';
  } else {
    loginScreen.style.display = 'flex';
  }
}

function setupEventListeners() {
  // Tab switching
  tabs.passwords.addEventListener('click', () => switchTab('passwords'));
  tabs.notes.addEventListener('click', () => switchTab('notes'));
  tabs.totp.addEventListener('click', () => switchTab('totp'));

  // Modal management
  document.getElementById('add-password-btn').addEventListener('click', () => openModal('password-modal'));
  document.getElementById('add-note-btn').addEventListener('click', () => openModal('note-modal'));
  document.getElementById('add-totp-btn').addEventListener('click', () => openModal('totp-modal'));

  document.getElementById('cancel-pw').addEventListener('click', () => closeModal('password-modal'));
  document.getElementById('cancel-note').addEventListener('click', () => closeModal('note-modal'));
  document.getElementById('cancel-totp').addEventListener('click', () => closeModal('totp-modal'));

  // Save actions
  document.getElementById('save-pw').addEventListener('click', addPassword);
  document.getElementById('save-note').addEventListener('click', addNote);
  document.getElementById('save-totp').addEventListener('click', addTotpToken);

  // Generate Password
  document.getElementById('generate-pw-btn').addEventListener('click', () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let pass = '';
    const array = new Uint32Array(16);
    crypto.getRandomValues(array);
    for (let i = 0; i < 16; i++) {
        pass += chars[array[i] % chars.length];
    }
    document.getElementById('pw-pass').value = pass;
  });

  // Sync
  document.getElementById('sync-btn').addEventListener('click', syncWithVPS);

  // Download
  document.getElementById('download-btn').addEventListener('click', downloadVault);

  // Search
  document.getElementById('search-input').addEventListener('input', (e) => {
    renderVault(e.target.value);
  });

  // Unlock
  document.getElementById('unlock-btn').addEventListener('click', async () => {
    const password = document.getElementById('master-password-input').value;
    if (password) {
      await window.cryptoUtils.setMasterPassword(password);
      await checkAuth();
      renderVault();
    }
  });

  // Allow enter key to unlock
  document.getElementById('master-password-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('unlock-btn').click();
    }
  });
}

function switchTab(tab) {
  Object.keys(tabs).forEach(t => {
    tabs[t].classList.toggle('active', t === tab);
    sections[t].classList.toggle('active', t === tab);
  });
}

function openModal(id) {
  document.getElementById(id).style.display = 'block';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

async function addPassword() {
  const site = document.getElementById('pw-site').value;
  const user = document.getElementById('pw-user').value;
  const pass = document.getElementById('pw-pass').value;

  if (!site || !user || !pass) return;

  const encryptedPass = await window.cryptoUtils.encrypt(pass);

  vault.passwords.push({
    id: Date.now(),
    site,
    user,
    pass: encryptedPass,
    updatedAt: Date.now()
  });

  await saveLocalVault();
  renderVault();
  closeModal('password-modal');

  // Clear inputs
  document.getElementById('pw-site').value = '';
  document.getElementById('pw-user').value = '';
  document.getElementById('pw-pass').value = '';
}

async function addNote() {
  const title = document.getElementById('note-title').value;
  const content = document.getElementById('note-content').value;

  if (!title || !content) return;

  const encryptedContent = await window.cryptoUtils.encrypt(content);

  vault.notes.push({
    id: Date.now(),
    title,
    content: encryptedContent,
    updatedAt: Date.now()
  });

  await saveLocalVault();
  renderVault();
  closeModal('note-modal');

  // Clear inputs
  document.getElementById('note-title').value = '';
  document.getElementById('note-content').value = '';
}

async function deleteItem(type, id) {
  const item = vault[type].find(item => item.id === id);
  if (item) {
    item.deleted = true;
    item.updatedAt = Date.now();
  }
  await saveLocalVault();
  renderVault();
}

async function copyToClipboard(e, text, isEncrypted = false) {
  let clearText = text;
  if (isEncrypted) {
    clearText = await window.cryptoUtils.decrypt(text);
  }
  navigator.clipboard.writeText(clearText);

  // Simple feedback
  const btn = e.currentTarget;
  const originalText = btn.innerText;
  btn.innerText = 'Copied!';
  btn.style.color = '#22c55e';
  setTimeout(() => {
    btn.innerText = originalText;
    btn.style.color = '';
  }, 1500);
}

async function renderVault(filter = '') {
  const f = filter.toLowerCase();

  // Render Passwords
  lists.passwords.innerHTML = '';
  vault.passwords.filter(p => !p.deleted && (p.site.toLowerCase().includes(f) || p.user.toLowerCase().includes(f))).forEach(p => {
    const div = document.createElement('div');
    div.className = 'vault-item';
    div.innerHTML = `
            <div class="item-header">
                <span class="item-title">${p.site}</span>
                <div class="item-actions">
                    <button class="delete-btn" data-id="${p.id}">Delete</button>
                </div>
            </div>
            <div class="item-details">
                <div class="detail-row">
                    <span class="label">User:</span>
                    <span class="value">${p.user}</span>
                    <button class="copy-btn" data-val="${p.user}">Copy</button>
                </div>
                <div class="detail-row">
                    <span class="label">Pass:</span>
                    <span class="value" id="val-pass-${p.id}">••••••••</span>
                    <div style="display:flex;gap:4px">
                        <button class="show-btn" data-id="${p.id}" data-val="${p.pass}" title="Show Password" style="background:none;border:none;cursor:pointer;font-size:1.1em;opacity:0.6">👁️</button>
                        <button class="copy-btn decrypt" data-val="${p.pass}">Copy</button>
                    </div>
                </div>
            </div>
        `;

    div.querySelector('.delete-btn').onclick = () => deleteItem('passwords', p.id);
    div.querySelector('.show-btn').onclick = async (e) => {
      const btn = e.currentTarget;
      const valSpan = div.querySelector(`#val-pass-${p.id}`);
      if (valSpan.innerText === '••••••••') {
        valSpan.innerText = await window.cryptoUtils.decrypt(btn.dataset.val);
        btn.style.opacity = '1';
      } else {
        valSpan.innerText = '••••••••';
        btn.style.opacity = '0.6';
      }
    };
    div.querySelectorAll('.copy-btn').forEach(btn => {
      btn.onclick = (e) => copyToClipboard(e, btn.dataset.val, btn.classList.contains('decrypt'));
    });

    lists.passwords.appendChild(div);
  });

  // Render Notes
  lists.notes.innerHTML = '';
  vault.notes.filter(n => !n.deleted && n.title.toLowerCase().includes(f)).forEach(n => {
    const div = document.createElement('div');
    div.className = 'vault-item';
    div.innerHTML = `
            <div class="item-header">
                <span class="item-title">${n.title}</span>
                <div class="item-actions">
                    <button class="delete-btn" data-id="${n.id}">Delete</button>
                    <button class="copy-btn decrypt" data-val="${n.content}">Copy</button>
                </div>
            </div>
        `;

    div.querySelector('.delete-btn').onclick = () => deleteItem('notes', n.id);
    div.querySelector('.copy-btn').onclick = (e) => copyToClipboard(e, n.content, true);

    lists.notes.appendChild(div);
  });

  // Render TOTP
  await renderTotpTokens(f);
}

// Storage Helpers
async function saveLocalVault() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ vault }, resolve);
  });
}

async function loadLocalVault() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['vault'], (result) => {
      if (result.vault) {
        vault = result.vault;
      }
      resolve();
    });
  });
}

// Sync Logic
async function syncWithVPS() {
  const syncBtn = document.getElementById('sync-btn');
  const originalHTML = syncBtn.innerHTML;
  syncBtn.disabled = true;
  syncBtn.style.opacity = '0.5';

  try {
    // 1. Fetch from VPS
    const response = await fetch(API_URL, {
      headers: { 'X-API-Key': API_KEY }
    });

    if (response.ok) {
      const text = await response.text();
      let remoteVault;
      try {
        remoteVault = text ? JSON.parse(text) : { passwords: [], notes: [] };
      } catch (err) {
        console.error('Failed to parse remote vault', text);
        remoteVault = { passwords: [], notes: [] };
      }

      // Smart merge logic based on timestamps and tombstones
      const mergeArrays = (localArr, remoteArr) => {
        const merged = [...localArr];
        remoteArr.forEach(remoteItem => {
          const localIndex = merged.findIndex(item => item.id === remoteItem.id);
          if (localIndex === -1) {
            merged.push(remoteItem);
          } else {
            const localItem = merged[localIndex];
            const localTime = localItem.updatedAt || 0;
            const remoteTime = remoteItem.updatedAt || 0;
            if (remoteTime > localTime) {
              merged[localIndex] = remoteItem;
            }
          }
        });
        return merged;
      };

      vault.passwords = mergeArrays(vault.passwords, remoteVault.passwords);
      vault.notes = mergeArrays(vault.notes, remoteVault.notes);

      // 2. Upload merged back to VPS
      await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify(vault)
      });

      await saveLocalVault();
      renderVault();
      alert('Sync complete!');
    } else {
      alert('Sync failed: ' + response.statusText);
    }
  } catch (e) {
    console.error('Sync error', e);
    alert('Sync error: ' + e.message);
  } finally {
    syncBtn.disabled = false;
    syncBtn.innerHTML = originalHTML;
    syncBtn.style.opacity = '';
  }
}

async function downloadVault() {
  const downloadBtn = document.getElementById('download-btn');
  const originalHTML = downloadBtn.innerHTML;
  downloadBtn.disabled = true;
  downloadBtn.style.opacity = '0.5';

  try {
    const decryptedVault = {
      passwords: [],
      notes: []
    };

    // Decrypt all passwords
    for (const p of vault.passwords) {
      const decryptedPass = await window.cryptoUtils.decrypt(p.pass);
      decryptedVault.passwords.push({
        ...p,
        pass: decryptedPass
      });
    }

    // Decrypt all notes
    for (const n of vault.notes) {
      const decryptedContent = await window.cryptoUtils.decrypt(n.content);
      decryptedVault.notes.push({
        ...n,
        content: decryptedContent
      });
    }

    // Create and trigger download
    const blob = new Blob([JSON.stringify(decryptedVault, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (e) {
    console.error('Download error', e);
    alert('Failed to decrypt vault for download: ' + e.message);
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = originalHTML;
    downloadBtn.style.opacity = '';
  }
}

// TOTP Functions
async function addTotpToken() {
  const issuer = document.getElementById('totp-issuer').value.trim();
  const account = document.getElementById('totp-account').value.trim();
  const secret = document.getElementById('totp-secret').value.replace(/\s/g, '').toUpperCase();

  if (!issuer || !account || !secret) {
    alert('Please fill in all fields');
    return;
  }

  if (!window.TOTP.isValidSecret(secret)) {
    alert('Invalid secret key. Please check the Base32 encoded secret.');
    return;
  }

  // Test token generation
  try {
    await window.TOTP.generateToken(secret);
  } catch (error) {
    alert('Failed to generate token. Please verify the secret key is correct.');
    return;
  }

  const encryptedSecret = await window.cryptoUtils.encrypt(secret);

  vault.totp.push({
    id: Date.now(),
    issuer,
    account,
    secret: encryptedSecret
  });

  await saveLocalVault();
  renderVault();
  closeModal('totp-modal');

  // Clear inputs
  document.getElementById('totp-issuer').value = '';
  document.getElementById('totp-account').value = '';
  document.getElementById('totp-secret').value = '';
}

async function deleteTotpToken(id) {
  vault.totp = vault.totp.filter(item => item.id !== id);
  await saveLocalVault();
  renderVault();
}

async function renderTotpTokens(filter = '') {
  const f = filter.toLowerCase();
  lists.totp.innerHTML = '';

  const filteredTokens = vault.totp.filter(t => 
    t.issuer.toLowerCase().includes(f) || 
    t.account.toLowerCase().includes(f)
  );

  for (const token of filteredTokens) {
    const div = document.createElement('div');
    div.className = 'vault-item';
    div.dataset.totpId = token.id;

    try {
      const decryptedSecret = await window.cryptoUtils.decrypt(token.secret);
      const code = await window.TOTP.generateToken(decryptedSecret);
      const remaining = window.TOTP.getRemainingSeconds();
      const progress = (remaining / 30) * 100;

      let progressClass = '';
      if (remaining <= 5) progressClass = 'danger';
      else if (remaining <= 10) progressClass = 'warning';

      div.innerHTML = `
        <div class="item-header">
          <span class="item-title">${token.issuer}</span>
          <div class="item-actions">
            <button class="delete-btn" data-id="${token.id}">Delete</button>
          </div>
        </div>
        <div class="item-details">
          <div class="detail-row">
            <span class="label">Account:</span>
            <span class="value">${token.account}</span>
          </div>
          <div class="totp-token-display">
            <div class="totp-code" data-secret="${token.secret}">${code}</div>
            <div class="totp-timer">
              <div class="totp-countdown">${remaining}s</div>
              <div class="totp-progress">
                <div class="totp-progress-bar ${progressClass}" style="width: ${progress}%"></div>
              </div>
            </div>
          </div>
          <div class="detail-row">
            <button class="copy-btn totp-copy-btn" data-secret="${token.secret}">Copy Code</button>
          </div>
        </div>
      `;

      div.querySelector('.delete-btn').onclick = () => deleteTotpToken(token.id);
      div.querySelector('.totp-copy-btn').onclick = async (e) => {
        const btn = e.currentTarget;
        const encSecret = btn.dataset.secret;
        const secret = await window.cryptoUtils.decrypt(encSecret);
        const currentCode = await window.TOTP.generateToken(secret);
        navigator.clipboard.writeText(currentCode);
        const originalText = btn.innerText;
        btn.innerText = 'Copied!';
        btn.style.color = '#22c55e';
        setTimeout(() => {
          btn.innerText = originalText;
          btn.style.color = '';
        }, 1500);
      };

      lists.totp.appendChild(div);
    } catch (error) {
      console.error('Error rendering TOTP token:', error);
      // Render error state
      div.innerHTML = `
        <div class="item-header">
          <span class="item-title">${token.issuer}</span>
          <div class="item-actions">
            <button class="delete-btn" data-id="${token.id}">Delete</button>
          </div>
        </div>
        <div class="item-details">
          <div class="detail-row">
            <span style="color: var(--danger);">Error generating token</span>
          </div>
        </div>
      `;
      div.querySelector('.delete-btn').onclick = () => deleteTotpToken(token.id);
      lists.totp.appendChild(div);
    }
  }
}

function startTotpRefresh() {
  // Clear existing interval if any
  if (totpRefreshInterval) {
   clearInterval(totpRefreshInterval);
  }

  // Update every second
  totpRefreshInterval = setInterval(async () => {
    const totpItems = document.querySelectorAll('[data-totp-id]');
    const remaining = window.TOTP.getRemainingSeconds();
    const progress = (remaining / 30) * 100;

    let progressClass = '';
    if (remaining <= 5) progressClass = 'danger';
    else if (remaining <= 10) progressClass = 'warning';

    for (const item of totpItems) {
      const codeElement = item.querySelector('.totp-code');
      const countdownElement = item.querySelector('.totp-countdown');
      const progressBar = item.querySelector('.totp-progress-bar');

      if (codeElement && codeElement.dataset.secret) {
        try {
          const decryptedSecret = await window.cryptoUtils.decrypt(codeElement.dataset.secret);
          const newCode = await window.TOTP.generateToken(decryptedSecret);
          
          // Only update if code changed (to avoid unnecessary DOM updates)
          if (codeElement.textContent !== newCode) {
            codeElement.textContent = newCode;
          }
        } catch (error) {
          console.error('Error updating TOTP:', error);
        }
      }

      if (countdownElement) {
        countdownElement.textContent = `${remaining}s`;
      }

      if (progressBar) {
        progressBar.className = `totp-progress-bar ${progressClass}`;
        progressBar.style.width = `${progress}%`;
      }
    }
  }, 1000);
}
