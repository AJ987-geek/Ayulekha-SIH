/**
 * AyuLekha Client Application Logic
 * Powered by TinyFish AI Web Agent & Clinical Recovery Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // App State
  const state = {
    sessionId: 'ayulekha_' + Math.random().toString(36).substring(2, 9),
    chiefComplaint: '',
    patientInfo: {
      age: '',
      gender: 'Not specified',
      preexisting: '',
      painScore: 0,
      specialist: 'General Physician / Family Doctor'
    },
    tinyFishConfig: {
      apiKey: 'sk-tinyfish-vPU_30jVDkbiI7tKppupuA2G6vkMTz6E',
      baseUrl: 'https://agent.tinyfish.ai/api'
    },
    isRecording: false
  };

  // DOM Elements
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const typingIndicator = document.getElementById('typingIndicator');
  const typingText = document.getElementById('typingText');
  const resetChatBtn = document.getElementById('resetChatBtn');
  const voiceInputBtn = document.getElementById('voiceInputBtn');

  // Emergency & Status elements
  const criticalEmergencyBanner = document.getElementById('criticalEmergencyBanner');
  const emergencyBannerText = document.getElementById('emergencyBannerText');
  const dismissBannerBtn = document.getElementById('dismissBannerBtn');
  const openSosBtn = document.getElementById('openSosBtn');
  const sosModal = document.getElementById('sosModal');
  const closeSosBtn = document.getElementById('closeSosBtn');
  const tinyfishStatusBtn = document.getElementById('tinyfishStatusBtn');

  // Sidebar elements
  const patientAgeInput = document.getElementById('patientAge');
  const patientGenderSelect = document.getElementById('patientGender');
  const patientPreexistingInput = document.getElementById('patientPreexisting');
  const painRange = document.getElementById('painRange');
  const painScoreDisplay = document.getElementById('painScoreDisplay');
  const triageBadge = document.getElementById('triageBadge');
  const exportReportBtn = document.getElementById('exportReportBtn');

  // Settings Modal elements
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const sidebarConfigBtn = document.getElementById('sidebarConfigBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const tinyfishApiKeyInput = document.getElementById('tinyfishApiKeyInput');
  const tinyfishBaseUrlInput = document.getElementById('tinyfishBaseUrlInput');
  const testConnectionBtn = document.getElementById('testConnectionBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const settingsFeedback = document.getElementById('settingsFeedback');

  // Summary Report Modal elements
  const summaryModal = document.getElementById('summaryModal');
  const closeSummaryBtn = document.getElementById('closeSummaryBtn');
  const copySummaryBtn = document.getElementById('copySummaryBtn');
  const printSummaryBtn = document.getElementById('printSummaryBtn');
  const summaryDate = document.getElementById('summaryDate');
  const summaryAge = document.getElementById('summaryAge');
  const summaryGender = document.getElementById('summaryGender');
  const summaryAllergies = document.getElementById('summaryAllergies');
  const summaryPain = document.getElementById('summaryPain');
  const summaryChiefComplaint = document.getElementById('summaryChiefComplaint');
  const summarySpecialist = document.getElementById('summarySpecialist');

  initEvents();

  function initEvents() {
    // Chat Submit
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = messageInput.value.trim();
      if (text) {
        handleUserMessage(text);
        messageInput.value = '';
      }
    });

    // Quick Symptom Chips
    document.querySelectorAll('.quick-symptom-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-symptom');
        if (text) {
          handleUserMessage(text);
        }
      });
    });

    // Pain range slider
    painRange.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.patientInfo.painScore = val;
      let label = `Level ${val} (None)`;
      if (val >= 1 && val <= 3) label = `Level ${val} (Mild)`;
      else if (val >= 4 && val <= 6) label = `Level ${val} (Moderate)`;
      else if (val >= 7 && val <= 9) label = `Level ${val} (Severe)`;
      else if (val === 10) label = `Level 10 (Very Severe)`;
      painScoreDisplay.textContent = label;
    });

    // Patient info inputs
    patientAgeInput.addEventListener('change', (e) => {
      state.patientInfo.age = e.target.value;
    });
    patientGenderSelect.addEventListener('change', (e) => {
      state.patientInfo.gender = e.target.value;
    });
    patientPreexistingInput.addEventListener('change', (e) => {
      state.patientInfo.preexisting = e.target.value;
    });

    // Reset Chat
    resetChatBtn.addEventListener('click', resetChat);

    // Emergency Modal
    openSosBtn.addEventListener('click', () => sosModal.classList.remove('hidden'));
    closeSosBtn.addEventListener('click', () => sosModal.classList.add('hidden'));
    dismissBannerBtn.addEventListener('click', () => criticalEmergencyBanner.classList.add('hidden'));

    // Settings Modal
    openSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    sidebarConfigBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    tinyfishStatusBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
    saveSettingsBtn.addEventListener('click', saveSettings);
    testConnectionBtn.addEventListener('click', testTinyFishConnection);

    // Export Summary Modal
    exportReportBtn.addEventListener('click', openSummaryReport);
    closeSummaryBtn.addEventListener('click', () => summaryModal.classList.add('hidden'));
    printSummaryBtn.addEventListener('click', () => window.print());
    copySummaryBtn.addEventListener('click', copyReportText);

    // Voice Input
    setupVoiceInput();
  }

  /**
   * Send user message and receive immediate step-by-step solutions
   */
  async function handleUserMessage(userText) {
    if (!state.chiefComplaint) {
      state.chiefComplaint = userText;
    }

    appendUserBubble(userText);
    showTyping('AyuLekha is generating your step-by-step treatment plan with TinyFish...');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          sessionId: state.sessionId,
          vitals: state.patientInfo,
          apiKey: state.tinyFishConfig.apiKey
        })
      });

      const data = await response.json();
      hideTyping();

      if (data.isEmergency) {
        criticalEmergencyBanner.classList.remove('hidden');
        emergencyBannerText.textContent = data.reply;
        sosModal.classList.remove('hidden');
        triageBadge.className = 'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse';
        triageBadge.textContent = 'Emergency Alert';
      } else if (data.categoryName) {
        triageBadge.className = 'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-ayulekha-800 border border-blue-200';
        triageBadge.textContent = data.categoryName;
      }

      if (data.specialist) {
        state.patientInfo.specialist = data.specialist;
      }

      appendAyuLekhaSolutionBubble(data);

    } catch (err) {
      hideTyping();
      appendAyuLekhaSimpleBubble(`⚠️ Could not reach health assistant: ${err.message}. Please check your connection.`);
    }
  }

  function appendUserBubble(text) {
    const bubble = document.createElement('div');
    bubble.className = 'flex justify-end gap-3 max-w-3xl ml-auto message-bubble-enter';
    bubble.innerHTML = `
      <div class="space-y-1 text-right max-w-[85%] sm:max-w-[75%]">
        <div class="bg-gradient-to-r from-ayulekha-700 to-ayulekha-800 text-white p-3.5 rounded-2xl rounded-tr-none text-sm leading-relaxed shadow-sm">
          ${escapeHtml(text)}
        </div>
        <span class="text-[10px] text-slate-400 font-medium pr-1">You</span>
      </div>
      <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-2xs">
        <i class="fa-solid fa-user"></i>
      </div>
    `;
    chatMessages.appendChild(bubble);
    scrollToBottom();
  }

  function appendAyuLekhaSolutionBubble(data) {
    const bubble = document.createElement('div');
    bubble.className = 'flex gap-3 max-w-3xl message-bubble-enter';

    let webInsightsHtml = '';
    if (data.webInsights && data.webInsights.results && data.webInsights.results.length > 0) {
      webInsightsHtml = `
        <div class="mt-3 pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          <span class="font-semibold text-ayulekha-700 flex items-center gap-1">
            <i class="fa-solid fa-earth-americas text-blue-600"></i>
            TinyFish Web References:
          </span>
          ${data.webInsights.results.map(r => `
            <a href="${r.url}" target="_blank" class="px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-ayulekha-700 hover:border-blue-300 transition text-[10px] flex items-center gap-1 shadow-2xs">
              <span>${escapeHtml(r.title.substring(0, 32))}...</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[8px]"></i>
            </a>
          `).join('')}
        </div>
      `;
    }

    bubble.innerHTML = `
      <div class="w-9 h-9 rounded-full bg-ayulekha-700 text-white flex-shrink-0 flex items-center justify-center text-sm shadow">
        <i class="fa-solid fa-leaf"></i>
      </div>
      <div class="flex-1 space-y-1 max-w-[92%]">
        <div class="bg-slate-100/90 text-slate-800 p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed border border-slate-200/80 shadow-2xs">
          <div class="prose prose-sm text-slate-800 leading-relaxed">
            ${formatMarkdown(data.reply)}
          </div>
          ${webInsightsHtml}
        </div>
        <div class="flex items-center justify-between text-[10px] text-slate-400 font-medium pl-1">
          <span>AyuLekha • Specialist: <strong class="text-slate-600">${escapeHtml(data.specialist || 'General Physician')}</strong></span>
          <button class="speak-btn text-slate-400 hover:text-ayulekha-700" title="Listen to this recovery plan">
            <i class="fa-solid fa-volume-high"></i>
          </button>
        </div>
      </div>
    `;

    chatMessages.appendChild(bubble);

    const speakBtn = bubble.querySelector('.speak-btn');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        speakText(data.reply);
      });
    }

    scrollToBottom();
  }

  function appendAyuLekhaSimpleBubble(text) {
    const bubble = document.createElement('div');
    bubble.className = 'flex gap-3 max-w-3xl message-bubble-enter';
    bubble.innerHTML = `
      <div class="w-9 h-9 rounded-full bg-ayulekha-700 text-white flex-shrink-0 flex items-center justify-center text-sm shadow">
        <i class="fa-solid fa-leaf"></i>
      </div>
      <div class="flex-1 space-y-1">
        <div class="bg-slate-100 text-slate-800 p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed border border-slate-200/70 shadow-2xs">
          <div class="prose prose-sm">
            ${formatMarkdown(text)}
          </div>
        </div>
        <span class="text-[10px] text-slate-400 font-medium pl-1">AyuLekha Health Assistant</span>
      </div>
    `;
    chatMessages.appendChild(bubble);
    scrollToBottom();
  }

  function showTyping(msg) {
    typingText.textContent = msg || 'AyuLekha is generating your solution...';
    typingIndicator.classList.remove('hidden');
    scrollToBottom();
  }

  function hideTyping() {
    typingIndicator.classList.add('hidden');
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function resetChat() {
    state.sessionId = 'ayulekha_' + Math.random().toString(36).substring(2, 9);
    state.chiefComplaint = '';
    triageBadge.className = 'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600';
    triageBadge.textContent = 'Ready';
    criticalEmergencyBanner.classList.add('hidden');

    chatMessages.innerHTML = `
      <div class="flex gap-3 max-w-3xl">
        <div class="w-9 h-9 rounded-full bg-ayulekha-700 text-white flex-shrink-0 flex items-center justify-center text-sm shadow">
          <i class="fa-solid fa-user-doctor"></i>
        </div>
        <div class="flex-1 space-y-2">
          <div class="bg-slate-100/90 text-slate-800 p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed border border-slate-200/70 shadow-2xs">
            <p class="font-bold text-slate-900 text-base mb-1">New Consultation Started</p>
            <p class="text-slate-600">Please describe your symptoms, and I will directly give you a complete step-by-step action plan to recover.</p>
          </div>
          <span class="text-[10px] text-slate-400 font-medium pl-1">AyuLekha Health Assistant</span>
        </div>
      </div>
    `;
  }

  function setupVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      voiceInputBtn.title = 'Speech recognition not supported in this browser';
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    voiceInputBtn.addEventListener('click', () => {
      if (state.isRecording) {
        recognition.stop();
      } else {
        try {
          recognition.start();
          state.isRecording = true;
          voiceInputBtn.classList.add('mic-recording');
        } catch (e) {
          console.error(e);
        }
      }
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      messageInput.value = transcript;
    };

    recognition.onend = () => {
      state.isRecording = false;
      voiceInputBtn.classList.remove('mic-recording');
    };

    recognition.onerror = () => {
      state.isRecording = false;
      voiceInputBtn.classList.remove('mic-recording');
    };
  }

  function speakText(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*_#`>-]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  async function saveSettings() {
    const key = tinyfishApiKeyInput.value.trim();
    const url = tinyfishBaseUrlInput.value.trim();
    state.tinyFishConfig.apiKey = key;
    state.tinyFishConfig.baseUrl = url;

    settingsFeedback.className = 'p-2.5 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-800';
    settingsFeedback.textContent = 'Settings saved and applied!';
    settingsFeedback.classList.remove('hidden');

    await fetch('/api/tinyfish/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key, baseUrl: url })
    });

    setTimeout(() => {
      settingsModal.classList.add('hidden');
      settingsFeedback.classList.add('hidden');
    }, 1200);
  }

  async function testTinyFishConnection() {
    const key = tinyfishApiKeyInput.value.trim();
    settingsFeedback.className = 'p-2.5 rounded-lg text-xs font-medium bg-blue-100 text-ayulekha-800';
    settingsFeedback.textContent = 'Testing connection with TinyFish agent...';
    settingsFeedback.classList.remove('hidden');

    try {
      const res = await fetch('/api/tinyfish/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      });
      const data = await res.json();
      if (data.success) {
        settingsFeedback.className = 'p-2.5 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-800';
        settingsFeedback.textContent = 'TinyFish API connection verified and active!';
      } else {
        settingsFeedback.className = 'p-2.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-800';
        settingsFeedback.textContent = data.message || 'Verification noted.';
      }
    } catch (e) {
      settingsFeedback.className = 'p-2.5 rounded-lg text-xs font-medium bg-red-100 text-red-800';
      settingsFeedback.textContent = `Error: ${e.message}`;
    }
  }

  function openSummaryReport() {
    summaryDate.textContent = new Date().toLocaleString();
    summaryAge.textContent = state.patientInfo.age || 'Not specified';
    summaryGender.textContent = state.patientInfo.gender || 'Not specified';
    summaryAllergies.textContent = state.patientInfo.preexisting || 'None reported';
    summaryPain.textContent = `${state.patientInfo.painScore}/10`;
    summaryChiefComplaint.textContent = state.chiefComplaint || 'General health consultation';
    summarySpecialist.textContent = state.patientInfo.specialist || 'General Physician / Family Doctor';

    summaryModal.classList.remove('hidden');
  }

  function copyReportText() {
    const text = `
=== AYULEKHA HEALTH CONSULTATION REPORT ===
Date: ${new Date().toLocaleString()}
Patient Age: ${state.patientInfo.age || 'N/A'} | Gender: ${state.patientInfo.gender || 'N/A'}
Allergies / Existing: ${state.patientInfo.preexisting || 'None'}
Discomfort Score: ${state.patientInfo.painScore}/10

SYMPTOMS / CHIEF COMPLAINT:
${state.chiefComplaint || 'General health issue'}

Recommended Specialist: ${state.patientInfo.specialist}
===========================================
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      copySummaryBtn.innerHTML = `<i class="fa-solid fa-check text-emerald-600"></i><span>Copied!</span>`;
      setTimeout(() => {
        copySummaryBtn.innerHTML = `<i class="fa-regular fa-copy"></i><span>Copy Text</span>`;
      }, 2000);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatMarkdown(text) {
    if (!text) return '';
    let parsed = escapeHtml(text);
    
    // Headers: ### Title
    parsed = parsed.replace(/^###\s*(.*?)$/gm, '<h4 class="font-bold text-slate-900 text-sm mt-3 mb-1">$1</h4>');
    parsed = parsed.replace(/^##\s*(.*?)$/gm, '<h3 class="font-bold text-slate-900 text-base mt-3 mb-1.5">$1</h3>');

    // Horizontal Rule: ---
    parsed = parsed.replace(/^---$/gm, '<hr class="my-2.5 border-slate-200" />');

    // Bold: **text**
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
    
    // Italic: *text*
    parsed = parsed.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Inline code: `code`
    parsed = parsed.replace(/`([^`]+)`/g, '<code class="bg-slate-200/80 px-1.5 py-0.5 rounded text-xs font-mono font-semibold text-slate-800">$1</code>');

    // Numbered lists: 1. text
    parsed = parsed.replace(/^(\d+)\.\s*(.*?)$/gm, '<div class="flex items-start gap-2 my-1.5"><span class="font-bold text-ayulekha-700 min-w-4">$1.</span><span>$2</span></div>');

    // Bullet points: • or - text
    parsed = parsed.replace(/^[•\-]\s*(.*?)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-ayulekha-600 font-bold">•</span><span>$1</span></div>');

    // Blockquote: > text
    parsed = parsed.replace(/^>\s*(.*?)$/gm, '<blockquote class="border-l-3 border-ayulekha-600 bg-blue-50/50 p-2.5 my-2 text-slate-700 italic text-xs rounded-r">$1</blockquote>');

    // Line breaks
    parsed = parsed.replace(/\n\n/g, '<br/>');
    parsed = parsed.replace(/\n/g, '<br/>');

    return parsed;
  }
});
