# Asha AI: Your Career Companion

Welcome to **Asha AI** – a smart, intuitive career assistant designed to help women navigate the ups and downs of their professional journey. Whether you're transitioning careers, returning after a break, or simply need career advice, Asha AI has got your back. From AI-powered guidance and resume analysis to personalized mentorship and event tracking – it’s all here to make your career journey smoother and smarter. 🌟

## 🎯 What’s Inside?
Asha AI is packed with tools to help you thrive in your career:

### 1. AI-Powered Career Guidance
- **Gemini AI**: Get personalized career advice powered by Google's Gemini AI, your new career best friend.
- **Real-Time Conversations**: Chat with Asha AI like a pro with natural, context-aware discussions.
- **Bias Detection**: Say goodbye to biased language – Asha AI spots and redirects it!
- **RAG Integration**: Augment responses with real-time information to provide the most up-to-date career advice.

### 2. Your Resume Analysis
- **Upload Your Resume**: Drop your resume in PDF or DOCX format and let Asha AI analyze it.
- **AI-Powered Feedback**: Get instant, actionable career advice based on your resume.
- **Personalized Suggestions**: Receive tips tailored to your unique skills and experiences.

### 3. The Ultimate Resource Hub
- **Events Calendar**: Stay updated with career events, workshops, and webinars to level up your career.
- **Mentorship Programs**: Find and connect with industry mentors eager to help you grow.
- **Knowledge Base**: Search and access career-related resources through intelligent semantic search.

### 4. Personalized Experience, Just for You
- **Create Your Profile**: Tailor your profile to track your career preferences and goals.
- **Save What Matters**: Bookmark helpful content to revisit later.
- **Session History**: Asha remembers your journey and conversation history to offer better, contextual advice.

### 5. Engage With a Dynamic UI
- **Voice Interaction**: Simply speak your questions, and Asha will listen, thanks to speech-to-text capabilities.
- **Responsive Design**: Enjoy a beautiful, interactive interface with smooth animations.
- **Dark/Light Mode**: Toggle between day and night modes for your perfect experience.

## 🛠 How Asha AI Works – Behind the Scenes

### Frontend
- **Modular JavaScript**: Clean, maintainable code with ES6 modules.
- **Streaming API**: Real-time responses to keep you engaged.
- **State Management**: Local storage to save your preferences and history.

### Backend
- **Flask**: Simple, powerful backend with RESTful APIs.
- **Rate Limiting**: 5 requests per minute to keep things efficient and fair.
- **Document Parsing**: Text extraction from your resumes (PDFs and DOCX).
- **Semantic Search**: Retrieve the best resources using sentence transformers.

### AI Integration
- **LangChain**: Manages conversation history and context to keep things relevant.
- **Safety Filters**: Gemini ensures all outputs are safe and helpful.
- **Contextual Awareness**: Asha remembers past conversations and understands topics to offer coherent advice.

## 📦 Let’s Get It Running!

### Prerequisites
- Python 3.8+
- Node.js for frontend
- Google API Key with access to Gemini

### Backend Setup
1. **Set up a Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate      # For Linux/Mac
   venv\Scripts\activate         # For Windows
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set Your Google API Key**
   ```bash
   export GOOGLE_API_KEY=your_api_key
   ```

4. **Launch the Backend**
   ```bash
   python app.py
   ```

### Frontend Setup
1. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```

## 📁 File Structure - Here’s How We’re Organized:
```
.
├── app.py                    # The brain (Flask server)
├── web/                       # Frontend files
│   ├── index.html             # Main landing page
│   ├── style.css              # Stylesheets for that polished look
│   ├── main.js                # All the frontend magic
│   └── gemini-api.js          # Connecting to Gemini AI
├── data/                      # Static content (JSON files)
│   ├── events.json
│   ├── mentorship_programs.json
├── knowledge/                 # Semantic search materials
│   ├── jobs_for_her.json
│   ├── resume_tips.json
│   └── career_breaks.json
└── requirements.txt           # Python dependencies
```

## ⚡ Performance Boosters
- **Rate Limiting**: We’ve got you covered with a cap of 5 requests per minute to keep things running smoothly.
- **Lazy Loading**: Only fetch what you need, when you need it.
- **Client-Side Caching**: Using `localStorage` to avoid repetitive API calls.

## 🔐 Security Features – We’ve Got Your Back
- **Input Sanitization**: Filtering out biased, harmful language to create a safe space for everyone.
- **Session Isolation**: Each user’s session is isolated to ensure privacy.
- **File Validation**: We only allow safe file uploads (PDF/DOCX).
- **Environment Variables**: Sensitive keys? They stay safe outside the codebase.

## 🚀 What’s Next?
We’re always evolving, and here’s what’s coming:
- **Skill Assessments**: Get evaluated on your skills and get better at what you do.
- **Job Matching**: Imagine your career companion connecting you with job boards. That’s coming soon!
- **Community Features**: Let’s build a community of career-focused individuals with forums and chat spaces.
- **Real-Time Event and Mentorship API**: No more static content – connect to live data for events and mentorship programs!

## 💬 Join the Revolution!
Asha AI is here to help you take control of your career. Whether you’re just starting out or looking to make a big career change, we’re here to guide, advise, and help you every step of the way. 🚀
