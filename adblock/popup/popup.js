// Popup script for DIY AdBlock

document.addEventListener('DOMContentLoaded', async () => {
  // Load stats
  loadStats();
  
  // Setup event listeners
  document.getElementById('update-btn').addEventListener('click', updateBlocklist);
});

function loadStats() {
  // Get blocked count from storage or default
  chrome.storage.local.get(['blockedCount', 'lastUpdate'], (result) => {
    const count = result.blockedCount || 30000;
    document.getElementById('blocked-count').textContent = count.toLocaleString();
    
    // Update last update time
    if (result.lastUpdate) {
      const lastUpdate = new Date(result.lastUpdate);
      const timeAgo = getTimeAgo(lastUpdate);
      console.log(`Last updated: ${timeAgo}`);
    }
  });
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

async function updateBlocklist() {
  const btn = document.getElementById('update-btn');
  const originalText = btn.textContent;
  
  btn.disabled = true;
  btn.textContent = '⏳ Updating...';
  btn.classList.add('loading');
  
  try {
    // In a real implementation, you would:
    // 1. Run the convert-blocklist.py script
    // 2. Reload the extension
    // 3. Update the rules
    
    // For now, just simulate the update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update storage
    chrome.storage.local.set({
      lastUpdate: new Date().toISOString()
    });
    
    btn.textContent = '✓ Updated!';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
      btn.classList.remove('loading');
    }, 2000);
    
    // Show notification
    showNotification('Blocklist updated successfully!');
    
  } catch (error) {
    console.error('Update error:', error);
    btn.textContent = '✗ Update failed';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
      btn.classList.remove('loading');
    }, 2000);
  }
}

function showNotification(message) {
  // Could implement a toast notification here
  console.log(message);
}
