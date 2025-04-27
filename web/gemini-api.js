// Rate limiting store
const rateLimitStore = new Map();

export async function* streamGemini({
    model = 'gemini-2.0-flash',
    contents = [],
    sessionId = generateSessionId()
} = {}) {
    // Rate limiting check (5 requests per minute per session)
    const now = Date.now();
    const window = 60 * 1000; // 1 minute
    const maxRequests = 10;
    
    const sessionRequests = rateLimitStore.get(sessionId) || [];
    const recentRequests = sessionRequests.filter(timestamp => now - timestamp < window);
    
    if (recentRequests.length >= maxRequests) {
        throw new Error('Rate limit exceeded. Please wait a minute before sending more requests.');
    }
    
    // Update rate limit store
    rateLimitStore.set(sessionId, [...recentRequests, now]);
    
    const response = await fetch("/api/generate", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "X-Session-ID": sessionId 
        },
        body: JSON.stringify({ model, contents })
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }
    yield* streamResponseChunks(response);
}

function generateSessionId() {
    return 'session_' + Math.random().toString(36).substring(2, 9);
}

async function* streamResponseChunks(response) {
    const decoder = new TextDecoder();
    let buffer = '';
    
    const reader = response.body.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const chunks = buffer.split('\n\n');
            buffer = chunks.pop() || '';
            
            for (const chunk of chunks) {
                const cleanChunk = chunk.replace(/^data:\s*/, '').trim();
                if (!cleanChunk) continue;
                
                try {
                    const { error, text } = JSON.parse(cleanChunk);
                    if (error) throw new Error(error);
                    yield text;
                } catch (e) {
                    console.error('Chunk parsing error:', e);
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
}
export async function* streamGeminiWithRAG({
    model = 'gemini-2.0-flash',
    contents = [],
    sessionId = generateSessionId()
} = {}) {
    try {
        // First retrieve relevant documents
        const retrievalResponse = await fetch("/api/retrieve", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-Session-ID": sessionId 
            },
            body: JSON.stringify({ query: contents[0]?.parts[0]?.text || "" })
        });
        
        const retrievedDocs = await retrievalResponse.json();
        
        // Augment the prompt with retrieved documents
        const augmentedPrompt = {
            ...contents[0],
            parts: [
                ...contents[0].parts,
                { text: "\n\nRelevant information:\n" + retrievedDocs.results.map(d => d.text).join("\n") }
            ]
        };
        
        // Then proceed with normal generation
        const response = await fetch("/api/generate", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-Session-ID": sessionId 
            },
            body: JSON.stringify({ model, contents: [augmentedPrompt] })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        yield* streamResponseChunks(response);
    } catch (error) {
        console.error("RAG error:", error);
        // Fall back to regular generation if RAG fails
        yield* streamGemini({ model, contents, sessionId });
    }
}