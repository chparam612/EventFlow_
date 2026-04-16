import { askAttendee } from '/src/gemini.js';

export function renderAIChat() {
  return `
  <!-- Floating Button -->
  <button id="ai-chat-btn" style="position:fixed; bottom:24px; right:24px; width:56px; height:56px; border-radius:28px; background:linear-gradient(135deg,var(--green),#00E5B4); border:none; box-shadow:0 8px 24px rgba(0,196,154,0.3); font-size:24px; display:flex; justify-content:center; align-items:center; z-index:100; transition:all 0.2s;">
    🤖
  </button>

  <!-- Slide-up Panel -->
  <div id="ai-chat-panel" style="position:fixed; bottom:0; left:0; right:0; top:15vh; background:var(--bg-deep); border-top-left-radius:24px; border-top-right-radius:24px; border:1px solid var(--border); border-bottom:none; transform:translateY(100%); transition:transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index:101; display:flex; flex-direction:column; box-shadow:0 -10px 40px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="padding:16px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg, rgba(0,196,154,0.1), transparent); border-top-left-radius:24px; border-top-right-radius:24px;">
      <div>
        <div style="font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:1.1rem; color:var(--text-primary);">EventFlow AI</div>
        <div style="color:var(--text-secondary); font-size:0.75rem;">Your smart venue assistant</div>
      </div>
      <button id="ai-close-btn" style="background:var(--bg-card2); border:1px solid var(--border); color:var(--text-secondary); width:32px; height:32px; border-radius:16px;">✕</button>
    </div>

    <!-- Messages -->
    <div id="ai-messages" style="flex:1; overflow-y:auto; padding:20px 24px; display:flex; flex-direction:column; gap:16px;">
      <div style="display:flex; gap:12px; align-items:flex-start;">
        <div style="width:32px; height:32px; border-radius:16px; background:var(--green-dim); color:var(--green); display:flex; justify-content:center; align-items:center; font-size:16px;">🤖</div>
        <div style="background:var(--bg-card); padding:12px 16px; border-radius:12px; border-top-left-radius:2px; font-size:0.9rem; color:var(--text-primary); max-width:85%; line-height:1.4;">
          Hi! I can help you find the best routes, closest amenities, and smoothest exit strategies. What do you need?
        </div>
      </div>
    </div>

    <!-- Quick Chips -->
    <div style="padding:0 24px 12px 24px; display:flex; gap:8px; overflow-x:auto; white-space:nowrap; scrollbar-width:none;">
      <button class="ai-chip" style="padding:8px 16px; border-radius:16px; background:var(--bg-card2); border:1px solid var(--border); color:var(--text-secondary); font-size:0.8rem; flex-shrink:0;">Least crowded gate?</button>
      <button class="ai-chip" style="padding:8px 16px; border-radius:16px; background:var(--bg-card2); border:1px solid var(--border); color:var(--text-secondary); font-size:0.8rem; flex-shrink:0;">Fastest exit?</button>
      <button class="ai-chip" style="padding:8px 16px; border-radius:16px; background:var(--bg-card2); border:1px solid var(--border); color:var(--text-secondary); font-size:0.8rem; flex-shrink:0;">Nearest restroom?</button>
      <button class="ai-chip" style="padding:8px 16px; border-radius:16px; background:var(--bg-card2); border:1px solid var(--border); color:var(--text-secondary); font-size:0.8rem; flex-shrink:0;">Food wait times?</button>
    </div>

    <!-- Input -->
    <div style="padding:16px 24px; border-top:1px solid var(--border); background:var(--bg-deep);">
      <form id="ai-form" style="display:flex; gap:12px;">
        <input type="text" id="ai-input" placeholder="Ask anything..." style="flex:1; padding:12px 16px; border-radius:24px; background:var(--bg-card); border:1px solid var(--border-accent); color:var(--text-primary); outline:none;">
        <button type="submit" style="width:46px; height:46px; border-radius:23px; background:var(--green); border:none; display:flex; justify-content:center; align-items:center; color:#000;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    </div>
  </div>
  `;
}

export function initAIChat(getLiveDensity) {
  const btnOpen = document.getElementById('ai-chat-btn');
  const btnClose = document.getElementById('ai-close-btn');
  const panel = document.getElementById('ai-chat-panel');
  const msgs = document.getElementById('ai-messages');
  const form = document.getElementById('ai-form');
  const input = document.getElementById('ai-input');

  let isOpen = false;

  const toggle = () => {
    isOpen = !isOpen;
    panel.style.transform = isOpen ? 'translateY(0)' : 'translateY(100%)';
    btnOpen.style.transform = isOpen ? 'scale(0)' : 'scale(1)';
  };

  btnOpen.addEventListener('click', toggle);
  btnClose.addEventListener('click', toggle);

  const appendMsg = (text, isUser = false) => {
    const el = document.createElement('div');
    el.style.display = 'flex';
    el.style.gap = '12px';
    el.style.alignItems = 'flex-start';
    el.style.flexDirection = isUser ? 'row-reverse' : 'row';

    const avatar = isUser ? '' : `<div style="width:32px; height:32px; border-radius:16px; background:var(--green-dim); color:var(--green); display:flex; justify-content:center; align-items:center; font-size:16px; flex-shrink:0;">🤖</div>`;
    
    // Convert markdown bold to standard bold
    const formatted = text.replace(/\\*\\*(.*?)\\*\\*/g, '<b>$1</b>');
    
    el.innerHTML = `
      ${avatar}
      <div style="background:${isUser ? 'var(--green)' : 'var(--bg-card)'}; color:${isUser ? '#000' : 'var(--text-primary)'}; padding:12px 16px; border-radius:12px; ${isUser ? 'border-top-right-radius:2px;' : 'border-top-left-radius:2px;'} font-size:0.9rem; max-width:85%; line-height:1.4;">
        ${formatted}
      </div>`;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  };

  const handleAsk = async (text) => {
    appendMsg(text, true);
    input.value = '';
    
    const loadingId = 'loading-' + Date.now();
    const loadingEl = document.createElement('div');
    loadingEl.id = loadingId;
    loadingEl.style.display = 'flex';
    loadingEl.innerHTML = `<div style="background:var(--bg-card); padding:10px 16px; border-radius:12px; font-size:0.8rem; color:var(--text-secondary);">⏳ Thinking...</div>`;
    msgs.appendChild(loadingEl);
    msgs.scrollTop = msgs.scrollHeight;

    const density = getLiveDensity ? getLiveDensity() : {};
    const reply = await askAttendee(text, density);
    
    document.getElementById(loadingId).remove();
    appendMsg(reply);
  };

  document.querySelectorAll('.ai-chip').forEach(btn => {
    btn.addEventListener('click', () => handleAsk(btn.textContent));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value.trim()) handleAsk(input.value.trim());
  });
}
