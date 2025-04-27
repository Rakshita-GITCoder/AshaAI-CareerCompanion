import json
import os
import re
import logging
from datetime import datetime
from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_google_genai import ChatGoogleGenerativeAI
import PyPDF2
import docx
from io import BytesIO
from datetime import datetime, timedelta
import json
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
google_api_key = os.getenv("GOOGLE_API_KEY")
if not google_api_key:
    raise ValueError("GOOGLE_API_KEY not found in environment variables")
logging.basicConfig(level=logging.INFO)

embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

def load_knowledge_base():
    try:
        with open('knowledge_base.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Warning: knowledge_base.json not found, using sample data")
        return [
            {"text": "Sample career advice...", "source": "Sample Source"}
        ]

knowledge_base = load_knowledge_base()

knowledge_embeddings = embedding_model.encode([doc["text"] for doc in knowledge_base])

class ContextManager:
    def __init__(self):
        self.sessions = {}
        
    def get_context(self, session_id):
        self.cleanup()
        return self.sessions.get(session_id, {"last_topics": [], "entities": {}})
    
    def update_context(self, session_id, topic, entities):
        if session_id not in self.sessions:
            self.sessions[session_id] = {"last_topics": [], "entities": {}}
        self.sessions[session_id]["last_topics"].insert(0, topic)[:3]  
        self.sessions[session_id]["entities"].update(entities)
        self.sessions[session_id]["last_updated"] = datetime.now()
    
    def cleanup(self, max_age=1800):
        now = datetime.now()
        expired = [k for k,v in self.sessions.items() 
                 if (now - v["last_updated"]) > timedelta(seconds=max_age)]
        for k in expired:
            del self.sessions[k]

context_manager = ContextManager()


limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["10 per minute"]
)

def extract_text_from_pdf(file_stream):
    reader = PyPDF2.PdfReader(file_stream)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text

def extract_text_from_docx(file_stream):
    doc = docx.Document(file_stream)
    return "\n".join([para.text for para in doc.paragraphs])

def check_for_bias(text):
    if not text or not isinstance(text, str):
        return None

    
    bias_patterns = {
        
        r"\b(women|females|girls|wives|mothers)\s+(should|must|ought to|are expected to|belong)\s+(stay|care|quit|nurture|raise|home|kitchen)\b": {
            "suggestion": "career options for professionals with caregiving responsibilities",
            "resources": ["flexible-work-arrangements", "return-to-work-programs"]
        },
        r"\b(women|females)\s+(don't|can't|shouldn't)\s+\w+\s+(tech|engineering|coding|programming|science|math)\b": {
            "suggestion": "successful women in STEM fields and how to get started",
            "resources": ["women-in-tech-programs", "stem-scholarships"]
        },
        r"\bmothers\s+(belong|should be)\s+at\s+home\b": {
            "suggestion": "workplace accommodations for parents and successful working mothers",
            "resources": ["parental-leave-policies", "childcare-support"]
        },
        r"\bwomen\s+are\s+too\s+(emotional|soft|sensitive|fragile)\s+for\s+(leadership|management|tech)\b": {
            "suggestion": "research on emotional intelligence in leadership and diverse management styles",
            "resources": ["women-leadership", "emotional-intelligence-training"]
        },
        
        r"\b(too old|too young)\s+for\s+(tech|this job|this role)\b": {
            "suggestion": "age diversity success stories and skills-based hiring practices",
            "resources": ["career-change-at-any-age", "upskilling-programs"]
        },
        
        r"\b(attractive|pretty|beautiful|ugly)\s+(women|female)\s+(get|don't get)\s+(promoted|hired)\b": {
            "suggestion": "how to highlight skills and qualifications in the hiring process",
            "resources": ["interview-preparation", "salary-negotiation"]
        },
        

        r"\b(married|unmarried|single|divorced)\s+women\s+(should|shouldn't)\s+(work|stay home)\b": {
            "suggestion": "individual career choices and work-life balance strategies",
            "resources": ["work-life-balance", "career-planning"]
        },
        r"\bwomen\s+with\s+(kids|children)\s+(can't|shouldn't)\s+(work|travel|commit)\b": {
            "suggestion": "successful working mothers and companies with family-friendly policies",
            "resources": ["working-mothers", "family-friendly-companies"]
        },

        r"\bwomen\s+(don't|can't)\s+(code|program|hack)\b": {
            "suggestion": "women pioneers in computer science and coding resources for beginners",
            "resources": ["women-in-computing-history", "learn-to-code"]
        },
        r"\b(female|woman)\s+founder\s+(won't|can't)\s+succeed\b": {
            "suggestion": "successful female entrepreneurs and startup funding opportunities",
            "resources": ["female-founders", "startup-funding"]
        },
        r"\bwomen\s+in\s+tech\s+is\s+(just|only)\s+a\s+diversity\s+quota\b": {
            "suggestion": "the business case for diversity and inclusion in tech companies",
            "resources": ["diversity-research", "inclusion-best-practices"]
        }
    }

    text_lower = text.lower()
    detected_bias = []
    
    for pattern, response in bias_patterns.items():
        if re.search(pattern, text_lower):
            detected_bias.append({
                "pattern": pattern,
                "suggestion": response["suggestion"],
                "resources": response["resources"]
            })
    
    if detected_bias:
        return {
            "type": "bias_intervention",
            "title": "Let's focus on skills and opportunities",
            "message": "Our career companion promotes inclusive, skills-based career development. Here are some positive alternatives:",
            "suggestions": [{
                "original_phrase": b["pattern"],
                "alternative": b["suggestion"],
                "resources": b["resources"]
            } for b in detected_bias],
            "educational_resources": [
                "The business case for gender diversity (McKinsey research)",
                "How to recognize and overcome unconscious bias",
                "Success stories of women in male-dominated fields"
            ]
        }
    return None

class ChatMessageHistory:
    def __init__(self):
        self.messages = []
        self.created_at = datetime.now()
    
    def add_message(self, message):
        self.messages.append(message)
    
    def clear(self):
        self.messages = []

store = {}

class SessionChatMessageHistory(BaseChatMessageHistory):
    def __init__(self, session_id: str):
        self.session_id = session_id
        if session_id not in store:
            store[session_id] = ChatMessageHistory()

    @property
    def messages(self):
        return store[self.session_id].messages

    def add_message(self, message):
        store[self.session_id].add_message(message)

    def clear(self):
        if self.session_id in store:
            store[self.session_id].clear()

@app.route('/')
def home():
    return send_file('web/index.html')

@app.route("/api/generate", methods=["POST"])
@limiter.limit("5 per minute")
def generate_api():
    try:
        req_body = request.get_json()
        user_input = req_body.get("contents", "").strip()
        
        if not user_input or user_input.isspace():
            return jsonify({"error": "Please enter a valid question"}), 400
            
        bias_response = check_for_bias(user_input)
        if bias_response:
            return jsonify(bias_response), 200

        
        model = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0.3,
            safety_settings={
                1: 1, 2: 1, 3: 1, 4: 1
            }
        )

        session_id = request.headers.get('X-Session-ID', 'default')
        chat_history = SessionChatMessageHistory(session_id)
        messages = chat_history.messages[-4:]
        messages.append(HumanMessage(content=user_input))
        
        def generate_stream():
            full_response = ""
            for chunk in model.stream(messages):
                full_response += chunk.content
                yield f"data: {json.dumps({'text': chunk.content})}\n\n"
            chat_history.add_message(AIMessage(content=full_response))
        
        return app.response_class(
            generate_stream(),
            mimetype="text/event-stream",
            headers={"X-Session-ID": session_id}
        )

    except Exception as e:
        logging.error(f"API Error: {str(e)}")
        return jsonify({
            "error": "Our career assistant is temporarily unavailable",
            "resolution": "Please try again in a few minutes"
        }), 500

@app.route('/api/upload-resume', methods=['POST'])
def upload_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    try:
        file_stream = BytesIO(file.read())
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(file_stream)
        elif file.filename.lower().endswith(('.doc', '.docx')):
            text = extract_text_from_docx(file_stream)
        else:
            return jsonify({"error": "Unsupported file type"}), 400
        
        return jsonify({"text": text[:10000]})  
        
    except Exception as e:
        logging.error(f"Resume processing error: {str(e)}")
        return jsonify({"error": "Failed to process resume"}), 500
    
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('web', path)
@app.route('/api/events', methods=['GET'])
def get_events():
    try:
        with open('data/events.json', 'r') as f:
            events = json.load(f)
        return jsonify(events)
    except Exception as e:
        logging.error(f"Error loading events: {str(e)}")
        return jsonify({"error": "Failed to load events"}), 500

@app.route('/api/mentorship-programs', methods=['GET'])
def get_mentorship_programs():
    try:
        with open('data/mentorship_programs.json', 'r') as f:
            programs = json.load(f)
        return jsonify(programs)
    except Exception as e:
        logging.error(f"Error loading mentorship programs: {str(e)}")
        return jsonify({"error": "Failed to load programs"}), 500
    
@app.route('/api/retrieve', methods=['POST'])
def retrieve_documents():
    try:
        query = request.json.get('query')
        if not query:
            return jsonify({"error": "No query provided"}), 400
        
        
        query_embedding = embedding_model.encode([query])
        
        
        similarities = cosine_similarity(query_embedding, knowledge_embeddings)[0]
        
        
        top_indices = np.argsort(similarities)[-3:][::-1]
        results = [knowledge_base[i] for i in top_indices]
        
        return jsonify({"results": results})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
