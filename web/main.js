import { streamGemini } from './gemini-api.js';

const form = document.querySelector('form');
const promptInput = document.querySelector('input[name="prompt"]');
const chatHistory = document.querySelector('.chat-history');
const micBtn = document.getElementById('mic-btn');
const newChatBtn = document.getElementById('newChatBtn');
const themeToggle = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');
const resumeUpload = document.getElementById('resumeUpload');
const fileNameDisplay = document.getElementById('fileName');
const viewProfileBtn = document.getElementById('viewProfileBtn');
const savedJobsBtn = document.getElementById('savedJobsBtn');
const profileModal = document.getElementById('profileModal');
const closeModal = document.querySelector('.close');
const profileInfo = document.getElementById('profileInfo');
const interestInput = document.getElementById('interestInput');
const saveInterestBtn = document.getElementById('saveInterestBtn');
const savedJobsModal = document.getElementById('savedJobsModal');
const closeSavedJobs = document.querySelector('.close-saved-jobs');
const savedJobsList = document.getElementById('savedJobsList');
const suggestionsContainer = document.getElementById('suggestions');
const showEventsBtn = document.getElementById('showEventsBtn');
const showMentorshipBtn = document.getElementById('showMentorshipBtn');
const COUNSELING_FORM_URL = "https://docs.google.com/forms/d/1QOs6vYM4ILpsW8Qpr3RuTvDnxK1ZlKHTro-wRbmVLaw/edit";
const FEEDBACK_FORM_URL = "https://forms.gle/wzwNPeUg7h4znVRQ8";

const sampleQuestions = [
  "How to re-enter workforce after career break?",
  "Find remote jobs in marketing",
  "Mentorship programs for women in tech",
  "Flexible work options for mothers"
];

let currentContext = {
  sessionId: `session_${Date.now()}`,
  lastTopics: []
};

const md = window.markdownit({
  breaks: true,
  linkify: true,
  highlight: function (str, lang) {
    return `<pre class="code-block"><code>${str}</code></pre>`;
  }
});

if (!localStorage.getItem('careerProfile')) {
  localStorage.setItem('careerProfile', JSON.stringify({
    interests: [],
    savedJobs: []
  }));
}

function initializeUI() {
  particlesJS('particles-js', {
    particles: {
      number: { value: 30, density: { enable: true, value_area: 800 } },
      color: { value: "#89C05A" },
      shape: { type: "circle" },
      opacity: { value: 0.5, random: true },
      size: { value: 3, random: true },
      line_linked: { enable: true, distance: 150, color: "#89C05A", opacity: 0.4, width: 1 },
      move: { enable: true, speed: 2, direction: "none", random: true, straight: false, out_mode: "out" }
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: true, mode: "grab" },
        onclick: { enable: true, mode: "push" }
      }
    }
  });

  const savedTheme = localStorage.getItem('themePreference');
  if (savedTheme) {
    setTheme(savedTheme === 'dark');
  } else {
    setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  suggestionsContainer.innerHTML = '';
  initializeSuggestions();
  addCounselingButton();
  addFeedbackButton();

  setTimeout(() => {
    addMessageToUI('asha', `Hi there! I'm Asha, your career companion. How can I help you today? Here are some things you can ask me about:
    
- Job opportunities after a career break
- Mentorship programs
- Career change advice

Try clicking one of the suggestions above or type your own question!`);
  }, 500);
}

function initializeSuggestions() {
  sampleQuestions.forEach((q, index) => {
    const btn = document.createElement('button');
    btn.textContent = q;
    btn.className = 'suggestion-btn';
    
    btn.style.backgroundColor = '#89C05A';
    btn.style.color = 'white';
    btn.style.border = 'none';
    
    btn.onclick = () => {
      promptInput.value = q;
      promptInput.focus();
      anime({
        targets: btn,
        scale: [1, 1.1, 1],
        duration: 300,
        easing: 'easeInOutQuad'
      });
    };
    suggestionsContainer.appendChild(btn);
  });
}

function addCounselingButton() {
  const counselingBtn = document.createElement('button');
  counselingBtn.className = 'quick-action-btn counseling-btn';
  counselingBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Book Counseling';
  
  counselingBtn.addEventListener('click', () => {
    window.open(COUNSELING_FORM_URL, '_blank');
  });
  
  document.querySelector('.quick-actions').appendChild(counselingBtn);
}

function addFeedbackButton() {
  const feedbackBtn = document.createElement('button');
  feedbackBtn.className = 'quick-action-btn feedback-btn';
  feedbackBtn.innerHTML = '<i class="fas fa-comment-alt"></i> Give Feedback';
  feedbackBtn.addEventListener('click', () => {
    window.open(FEEDBACK_FORM_URL, '_blank');
  });
  document.querySelector('.quick-actions').appendChild(feedbackBtn);
}

function setTheme(isDark) {
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
  localStorage.setItem('themePreference', isDark ? 'dark' : 'light');
  themeLabel.textContent = isDark ? 'Dark Mode' : 'Light Mode';
}

themeToggle.addEventListener('click', () => {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  setTheme(!isDark);
  
  anime({
    targets: themeToggle,
    scale: [1, 1.1, 1],
    duration: 300,
    easing: 'easeInOutQuad'
  });
});

viewProfileBtn.addEventListener('click', () => {
  updateProfileDisplay();
  showModal(profileModal);
});

closeModal.addEventListener('click', () => {
  hideModal(profileModal);
});

closeSavedJobs.addEventListener('click', () => {
  hideModal(savedJobsModal);
});

saveInterestBtn.addEventListener('click', () => {
  const interest = interestInput.value.trim();
  if (interest) {
    const profile = JSON.parse(localStorage.getItem('careerProfile'));
    if (!profile.interests.includes(interest)) {
      profile.interests.push(interest);
      localStorage.setItem('careerProfile', JSON.stringify(profile));
      updateProfileDisplay();
      interestInput.value = '';
      
      anime({
        targets: saveInterestBtn,
        scale: [1, 1.2, 1],
        duration: 300,
        easing: 'easeInOutQuad'
      });
      showConfetti();
    }
  }
});

savedJobsBtn.addEventListener('click', () => {
  const profile = JSON.parse(localStorage.getItem('careerProfile'));
  if (profile.savedJobs.length === 0) {
    addMessageToUI('asha', "You haven't saved any messages yet.");
  } else {
    showSavedJobsModal(profile.savedJobs);
  }
});

function showModal(modal) {
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  anime({
    targets: modal,
    opacity: [0, 1],
    duration: 300,
    easing: 'easeOutQuad'
  });
  
  anime({
    targets: modal.querySelector('.modal-content'),
    translateY: [20, 0],
    opacity: [0, 1],
    duration: 300,
    easing: 'easeOutQuad'
  });
}

function hideModal(modal) {
  anime({
    targets: modal,
    opacity: [1, 0],
    duration: 200,
    easing: 'easeInQuad',
    complete: () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

function updateProfileDisplay() {
  const profile = JSON.parse(localStorage.getItem('careerProfile'));
  profileInfo.innerHTML = `
    <h4>Your Interests:</h4>
    ${profile.interests.length > 0 
      ? `<ul class="interests-list">${
          profile.interests.map((i, index) => `
            <li>
              ${i}
              <button class="delete-interest" data-index="${index}">
                <i class="fas fa-trash-alt"></i>
              </button>
            </li>`
          ).join('')
        }</ul>`
      : '<p>No interests added yet</p>'}
  `;

  document.querySelectorAll('.delete-interest').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.closest('button').getAttribute('data-index'));
      const profile = JSON.parse(localStorage.getItem('careerProfile'));
      profile.interests.splice(index, 1);
      localStorage.setItem('careerProfile', JSON.stringify(profile));
      updateProfileDisplay();
    });
  });
}

function showSavedJobsModal(jobs) {
  savedJobsList.innerHTML = `
    <div class="saved-jobs-header">
      <h4>Your Saved Items</h4>
      <p>${jobs.length} saved ${jobs.length === 1 ? 'item' : 'items'}</p>
    </div>
    <div class="saved-jobs-grid">
      ${jobs.map(job => {
        const renderedContent = md.render(job.fullContent);
        return `
        <div class="saved-job-card">
          <div class="job-header">
            <h5>${job.title}</h5>
            <button class="remove-job" data-id="${job.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <div class="job-content">${renderedContent}</div>
          <div class="job-footer">
            <span class="job-date">${job.dateSaved}</span>
            <button class="copy-job" data-content="${encodeURIComponent(job.fullContent)}">
              <i class="far fa-copy"></i> Copy
            </button>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;

  savedJobsList.querySelectorAll('.remove-job').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('button').getAttribute('data-id');
      const profile = JSON.parse(localStorage.getItem('careerProfile'));
      profile.savedJobs = profile.savedJobs.filter(job => job.id !== id);
      localStorage.setItem('careerProfile', JSON.stringify(profile));
      showSavedJobsModal(profile.savedJobs);
      showConfetti();
    });
  });

  savedJobsList.querySelectorAll('.copy-job').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const content = decodeURIComponent(e.target.getAttribute('data-content'));
      navigator.clipboard.writeText(content).then(() => {
        showNotification('Copied to clipboard!', 'success');
        e.target.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
          e.target.innerHTML = '<i class="far fa-copy"></i> Copy';
        }, 2000);
      });
    });
  });

  showModal(savedJobsModal);
}

function saveJob(content, type) {
  const profile = JSON.parse(localStorage.getItem('careerProfile'));
  const jobId = 'job_' + Date.now();
  
  profile.savedJobs.push({
    id: jobId,
    title: type,
    dateSaved: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    fullContent: content
  });
  
  localStorage.setItem('careerProfile', JSON.stringify(profile));
  showConfetti();
  showNotification('Successfully saved!', 'success');

  setTimeout(() => {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'message asha feedback-prompt';
    feedbackDiv.innerHTML = `
      <p>Was this information helpful?</p>
      <div class="feedback-buttons">
        <button class="feedback-btn yes">👍 Yes</button>
        <button class="feedback-btn no">👎 No</button>
      </div>
    `;
    chatHistory.appendChild(feedbackDiv);
    
    feedbackDiv.querySelector('.yes').addEventListener('click', () => {
      feedbackDiv.innerHTML = '<p>Thank you for your feedback!</p>';
      setTimeout(() => feedbackDiv.remove(), 2000);
    });
    
    feedbackDiv.querySelector('.no').addEventListener('click', () => {
      feedbackDiv.innerHTML = `
        <p>We're sorry to hear that. Would you like to <a href="${FEEDBACK_FORM_URL}" target="_blank">provide more feedback</a>?</p>
      `;
    });
  }, 1000);
  
  return true;
}

function showConfetti() {
  const confettiSettings = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#89C05A', '#AD6088', '#F8F5EF']
  };
  
  if (typeof confetti === 'function') {
    confetti(confettiSettings);
  }
}

function addActionButtonsToMessage(messageDiv, fullResponse) {
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'message-actions';
  
  const copyBtn = document.createElement('button');
  copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy';
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(fullResponse).then(() => {
      showNotification('Copied to clipboard!', 'success');
      copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy';
      }, 2000);
    }).catch(err => {
      showNotification('Failed to copy', 'error');
    });
  };
  actionsDiv.appendChild(copyBtn);
  
  const saveBtn = document.createElement('button');
  saveBtn.className = 'save-job-btn';
  saveBtn.innerHTML = '<i class="far fa-bookmark"></i> Save';
  
  saveBtn.onclick = () => {
    if (saveJob(fullResponse, 'Asha AI Response')) {
      saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
      setTimeout(() => {
        saveBtn.innerHTML = '<i class="far fa-bookmark"></i> Save';
      }, 2000);
    }
  };
  
  actionsDiv.appendChild(saveBtn);
  messageDiv.appendChild(actionsDiv);
}

resumeUpload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  fileNameDisplay.textContent = file.name;
  
  try {
    const tempMessageDiv = document.createElement('div');
    tempMessageDiv.className = 'message asha';
    const tempContentDiv = document.createElement('div');
    tempContentDiv.className = 'message-content';
    tempMessageDiv.appendChild(tempContentDiv);
    chatHistory.appendChild(tempMessageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    const loadingText = document.createElement('div');
    loadingText.className = 'loading-text';
    loadingText.textContent = 'Analyzing your resume...';
    tempContentDiv.appendChild(loadingText);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload-resume', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload resume');
    }

    const result = await response.json();
    const resumeText = result.text;

    tempContentDiv.removeChild(loadingText);

    const stream = streamGemini({
      contents: `Please analyze this resume and provide career suggestions:\n\n${resumeText}`,
      sessionId: currentSessionId
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk;
      tempContentDiv.innerHTML = md.render(fullResponse);
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    addActionButtonsToMessage(tempMessageDiv, fullResponse);
    fileNameDisplay.textContent = '';
    
  } catch (error) {
    handleError(error);
    fileNameDisplay.textContent = '';
  }
});

if ('webkitSpeechRecognition' in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;

  micBtn.onclick = (e) => {
    e.preventDefault();
    if (micBtn.classList.contains('listening')) {
      recognition.stop();
      micBtn.classList.remove('listening');
      promptInput.placeholder = 'Type your message...';
    } else {
      recognition.start();
      micBtn.classList.add('listening');
      promptInput.placeholder = 'Listening...';
    }
  };

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    promptInput.value = transcript.charAt(0).toUpperCase() + transcript.slice(1);
    micBtn.classList.remove('listening');
    promptInput.placeholder = 'Press Send when ready';
    promptInput.focus();
  };

  recognition.onerror = (e) => {
    micBtn.classList.remove('listening');
    promptInput.placeholder = 'Mic error - try typing';
    if (e.error === 'no-speech') {
      addMessageToUI('asha', "I didn't hear anything. Please try again or type your message.");
    }
  };
} else {
  micBtn.style.display = 'none';
}

let currentSessionId = null;
let isStreaming = false;

form.onsubmit = async (ev) => {
  ev.preventDefault();
  const userMessage = promptInput.value.trim();
  if (!userMessage || isStreaming) return;

  if (!currentSessionId) {
    currentSessionId = 'session_' + Date.now();
  }

  addMessageToUI('user', userMessage);
  promptInput.value = '';
  isStreaming = true;
  
  const tempMessageDiv = document.createElement('div');
  tempMessageDiv.className = 'message asha';
  const tempContentDiv = document.createElement('div');
  tempContentDiv.className = 'message-content loading-message';
  tempContentDiv.innerHTML = `
    <div class="loading-spinner"></div>
    <span>Asha is thinking...</span>
  `;
  tempMessageDiv.appendChild(tempContentDiv);
  chatHistory.appendChild(tempMessageDiv);
  chatHistory.scrollTop = chatHistory.scrollHeight;

  try {
    if (userMessage.match(/update my interest to|add interest|change interest/i)) {
      const interest = userMessage.replace(/.*(update my interest to|add interest|change interest)/i, '').trim();
      if (interest) {
        const profile = JSON.parse(localStorage.getItem('careerProfile'));
        profile.interests = [interest];
        localStorage.setItem('careerProfile', JSON.stringify(profile));
        addMessageToUI('asha', `Updated your interest to: <strong>${interest}</strong>`);
        isStreaming = false;
        return;
      }
    }

    if (userMessage.match(/show my profile|view my interests/i)) {
      const profile = JSON.parse(localStorage.getItem('careerProfile'));
      const interests = profile.interests.length > 0 
        ? `Your interests: ${profile.interests.join(', ')}`
        : "You haven't set any interests yet. Try saying 'Update my interest to cybersecurity'";
      addMessageToUI('asha', interests);
      isStreaming = false;
      return;
    }

    if (userMessage.match(/show my saved messages|my saved items/i)) {
      const profile = JSON.parse(localStorage.getItem('careerProfile'));
      if (profile.savedJobs.length === 0) {
        addMessageToUI('asha', "You haven't saved any messages yet.");
      } else {
        showSavedJobsModal(profile.savedJobs);
      }
      isStreaming = false;
      return;
    }

    const stream = streamGemini({
      contents: userMessage,
      sessionId: currentSessionId
    });

    let fullResponse = '';
    let hasStartedStreaming = false;
    
    for await (const chunk of stream) {
      if (!hasStartedStreaming) {
        tempContentDiv.className = 'message-content';
        tempContentDiv.innerHTML = '';
        hasStartedStreaming = true;
      }
      fullResponse += chunk;
      tempContentDiv.innerHTML = md.render(fullResponse);
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    tempMessageDiv.classList.remove('streaming');
    addActionButtonsToMessage(tempMessageDiv, fullResponse);

  } catch (error) {
    handleError(error);
    chatHistory.removeChild(tempMessageDiv);
  } finally {
    isStreaming = false;
  }
};

function addMessageToUI(sender, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  messageDiv.innerHTML = md.render(text);
  
  messageDiv.addEventListener('mousemove', (e) => {
    const x = e.clientX - messageDiv.getBoundingClientRect().left;
    const y = e.clientY - messageDiv.getBoundingClientRect().top;
    const centerX = messageDiv.offsetWidth / 2;
    const centerY = messageDiv.offsetHeight / 2;
    
    const angleX = (y - centerY) / 20;
    const angleY = (centerX - x) / 20;
    
    messageDiv.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
  });
  
  messageDiv.addEventListener('mouseleave', () => {
    messageDiv.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  });
  
  chatHistory.appendChild(messageDiv);
  
  anime({
    targets: messageDiv,
    translateY: [20, 0],
    opacity: [0, 1],
    duration: 400,
    easing: 'easeOutQuint'
  });
  
  chatHistory.scrollTo({
    top: chatHistory.scrollHeight,
    behavior: 'smooth'
  });
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  anime({
    targets: notification,
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 300,
    easing: 'easeOutQuad',
    complete: () => {
      setTimeout(() => {
        anime({
          targets: notification,
          opacity: 0,
          translateY: -20,
          duration: 300,
          easing: 'easeInQuad',
          complete: () => notification.remove()
        });
      }, 3000);
    }
  });
}

function handleError(error) {
  console.error('Error:', error);
  const errorDiv = document.createElement('div');
  errorDiv.className = 'message asha error';
  errorDiv.innerHTML = `
    <div class="error-content">
      <p><i class="fas fa-exclamation-triangle"></i> ${error.message.includes('network') ? 'Network error - please check your connection' : 'Something went wrong'}</p>
      <button class="retry-btn">Retry</button>
    </div>
  `;
  chatHistory.appendChild(errorDiv);
  
  errorDiv.querySelector('.retry-btn').addEventListener('click', () => {
    location.reload();
  });
  
  chatHistory.scrollTop = chatHistory.scrollHeight;
  showNotification(error.message, 'error');
}

newChatBtn.onclick = () => {
  if (chatHistory.children.length <= 1) return;
  
  const confirmDiv = document.createElement('div');
  confirmDiv.className = 'message asha confirmation';
  confirmDiv.innerHTML = `
    <p>Are you sure you want to start a new chat?</p>
    <div class="confirmation-buttons">
      <button class="confirm-btn">Yes</button>
      <button class="cancel-btn">No</button>
    </div>
  `;
  chatHistory.appendChild(confirmDiv);
  
  confirmDiv.querySelector('.confirm-btn').addEventListener('click', () => {

    anime({
      targets: chatHistory.children,
      opacity: 0,
      translateX: 30,
      duration: 200,
      easing: 'easeInQuad',
      complete: () => {
        chatHistory.innerHTML = '';
        currentSessionId = null;
        fileNameDisplay.textContent = '';
        resumeUpload.value = '';
        
        setTimeout(() => {
          addMessageToUI('asha', "Let's start fresh! What would you like to discuss today?");
        }, 300);
      }
    });
  });
  
  confirmDiv.querySelector('.cancel-btn').addEventListener('click', () => {
    confirmDiv.remove();
  });
};

async function fetchEvents() {
  try {
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'message asha';
    const loadingContent = document.createElement('div');
    loadingContent.className = 'message-content';
    loadingContent.innerHTML = '<div class="loading-text">Fetching upcoming events...</div>';
    loadingMsg.appendChild(loadingContent);
    chatHistory.appendChild(loadingMsg);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    const response = await fetch('/api/events');
    if (!response.ok) throw new Error('Failed to fetch events');
    const events = await response.json();

    if (events.length === 0) {
      chatHistory.removeChild(loadingMsg);
      addMessageToUI('asha', "No upcoming events currently available. Check back later!");
      return;
    }
    
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'message asha';
    const eventsContent = document.createElement('div');
    eventsContent.className = 'message-content';
    
    let eventsHtml = `
      <div class="resources-header">
        <h4>📅 Upcoming Events</h4>
        <a href="${COUNSELING_FORM_URL}" target="_blank" class="career-counseling-btn">
          <i class="fas fa-calendar-check"></i> Counseling
        </a>
      </div>
      <div class='events-container'>
    `;
    
    events.forEach(event => {
      eventsHtml += `
      <div class="event-card">
          <h5>${event.title}</h5>
          <p>${event.description}</p>
          <div class="event-meta">
            <span><i class="far fa-calendar"></i> ${new Date(event.date).toLocaleDateString()}</span>
            <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
          </div>
          <div class="event-actions">
            <a href="${event.url}" target="_blank" class="event-link">Learn More <i class="fas fa-external-link-alt"></i></a>
            <button class="save-btn" data-content="${encodeURIComponent(
              `**${event.title}**\n\n${event.description}\n\n**Date:** ${event.date}\n**Location:** ${event.location}\n[More Info](${event.url})`
            )}">
                <i class="far fa-bookmark"></i> Save
            </button>
          </div>
      </div>`;
    });
    eventsHtml += "</div>";
    
    eventsContent.innerHTML = eventsHtml;
    eventsContainer.appendChild(eventsContent);
    chatHistory.replaceChild(eventsContainer, loadingMsg);
    
    eventsContainer.querySelectorAll('.save-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const content = decodeURIComponent(e.target.getAttribute('data-content'));
        if (saveJob(content, "Event: " + e.target.closest('.event-card').querySelector('h5').textContent)) {
          e.target.innerHTML = '<i class="fas fa-check"></i> Saved!';
          setTimeout(() => {
            e.target.innerHTML = '<i class="far fa-bookmark"></i> Save';
          }, 2000);
        }
      });
    });
    
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
  } catch (error) {
    handleError(error);
    const loadingMsg = chatHistory.querySelector('.message.asha');
    if (loadingMsg) chatHistory.removeChild(loadingMsg);
  }
}

async function fetchMentorshipPrograms() {
  try {
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'message asha';
    const loadingContent = document.createElement('div');
    loadingContent.className = 'message-content';
    loadingContent.innerHTML = '<div class="loading-text">Finding mentorship programs...</div>';
    loadingMsg.appendChild(loadingContent);
    chatHistory.appendChild(loadingMsg);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    const response = await fetch('/api/mentorship-programs');
    if (!response.ok) throw new Error('Failed to fetch programs');
    const programs = await response.json();

    if (programs.length === 0) {
      chatHistory.removeChild(loadingMsg);
      addMessageToUI('asha', "No mentorship programs currently available. Check back later!");
      return;
    }

    const programsContainer = document.createElement('div');
    programsContainer.className = 'message asha';
    const programsContent = document.createElement('div');
    programsContent.className = 'message-content';
    
    let programsHtml = `
      <div class="resources-header">
        <h4>🤝 Mentorship Programs</h4>
        <a href="${COUNSELING_FORM_URL}" target="_blank" class="career-counseling-btn">
          <i class="fas fa-calendar-check"></i> Counseling
        </a>
      </div>
      <div class='programs-container'>
    `;
    
    programs.forEach(program => {
      programsHtml += `
      <div class="program-card">
          <h5>${program.title}</h5>
          <p>${program.description}</p>
          <div class="program-meta">
            <span><i class="far fa-clock"></i> ${program.duration}</span>
            <span><i class="far fa-calendar-alt"></i> Apply by: ${new Date(program.application_deadline).toLocaleDateString()}</span>
          </div>
          <div class="program-actions">
            <button class="save-btn" 
                    data-content="${encodeURIComponent(
                      `**${program.title}**\n\n${program.description}\n\n**Duration:** ${program.duration}\n**Apply by:** ${program.application_deadline}`
                    )}">
                <i class="far fa-bookmark"></i> Save
            </button>
          </div>
      </div>`;
    });
    programsHtml += "</div>";
    
    programsContent.innerHTML = programsHtml;
    programsContainer.appendChild(programsContent);
    chatHistory.replaceChild(programsContainer, loadingMsg);
    
    programsContainer.querySelectorAll('.save-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const content = decodeURIComponent(e.target.getAttribute('data-content'));
        if (saveJob(content, "Program: " + e.target.closest('.program-card').querySelector('h5').textContent)) {
          e.target.innerHTML = '<i class="fas fa-check"></i> Saved!';
          setTimeout(() => {
            e.target.innerHTML = '<i class="far fa-bookmark"></i> Save';
          }, 2000);
        }
      });
    });
    
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
  } catch (error) {
    handleError(error);
    const loadingMsg = chatHistory.querySelector('.message.asha');
    if (loadingMsg) chatHistory.removeChild(loadingMsg);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  resumeUpload.value = '';
  fileNameDisplay.textContent = '';
  initializeUI();
  showEventsBtn.addEventListener('click', fetchEvents);
  showMentorshipBtn.addEventListener('click', fetchMentorshipPrograms);
  
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      anime({
        targets: btn,
        scale: 1.05,
        duration: 150,
        easing: 'easeOutQuad'
      });
    });
    btn.addEventListener('mouseleave', () => {
      anime({
        targets: btn,
        scale: 1,
        duration: 150,
        easing: 'easeOutQuad'
      });
    });
  });

  document.querySelector('.prompt-form button[type="submit"]').addEventListener('mouseenter', () => {
    anime({
      targets: '.prompt-form button[type="submit"]',
      scale: 1.1,
      duration: 150,
      easing: 'easeOutQuad'
    });
  });
  document.querySelector('.prompt-form button[type="submit"]').addEventListener('mouseleave', () => {
    anime({
      targets: '.prompt-form button[type="submit"]',
      scale: 1,
      duration: 150,
      easing: 'easeOutQuad'
    });
  });

  animateElements();
});

function animateElements() {
  anime({
    targets: '.sidebar > *',
    translateY: [20, 0],
    opacity: [0, 1],
    delay: anime.stagger(100),
    duration: 800,
    easing: 'easeOutElastic'
  });

  anime({
    targets: 'header',
    translateY: [-30, 0],
    opacity: [0, 1],
    duration: 1000,
    easing: 'easeOutExpo'
  });

  setInterval(() => {
    anime({
      targets: '.suggestions button',
      scale: [1, 1.05],
      direction: 'alternate',
      duration: 1500,
      easing: 'easeInOutSine',
      delay: anime.stagger(200)
    });
  }, 3000);
}
