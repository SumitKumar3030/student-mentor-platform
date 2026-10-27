import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function callGroq(prompt: string): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-120b', // Groq's current recommended model
      temperature: 0.5,
      max_tokens: 1000,
    })
    return completion.choices[0]?.message?.content || 'No response generated.'
  } catch (error) {
    console.error('Groq API Error:', error)
    return 'AI is currently taking a quick break. Please try again.'
  }
}

// ============================================
// 1. SESSION SUMMARY (After session ends)
// ============================================
export async function generateSessionSummary(
  chatMessages: { name: string; content: string }[],
  finalCode: string,
  language: string
): Promise<string> {
  const chatContext = chatMessages.map((m) => `${m.name}: ${m.content}`).join('\n')

  const prompt = `
    You are an expert programming mentor. Below is the transcript and final code from a 1-on-1 coding mentorship session.
    Please write a highly professional, concise summary of the session (max 3 sentences).
    Then, provide 2 "Action Items" for the student based on what they seemed to struggle with.
    
    Language used: ${language}
    
    Chat Transcript:
    ${chatContext || 'No chat messages were sent.'}
    
    Final Code Snapshot:
    \`\`\`${language}
    ${finalCode}
    \`\`\`
    
    Format the output exactly like this:
    **Summary:** [Your summary here]
    
    **Action Items:**
    - [Action item 1]
    - [Action item 2]
  `
  return await callGroq(prompt)
}

// ============================================
// 2. EXPLAIN CODE (Copilot Button)
// ============================================
export async function explainCode(code: string, language: string): Promise<string> {
  const prompt = `
    You are an expert programming mentor. 
    Explain the following ${language} code briefly. Use 3-4 bullet points. 
    Highlight any potential bugs or improvements.
    
    Code:
    \`\`\`${language}
    ${code}
    \`\`\`
  `
  return await callGroq(prompt)
}

// ============================================
// 3. CHAT WITH AI (@AI in chat)
// ============================================
export async function chatWithAI(
  userMessage: string, 
  currentCode: string, 
  language: string
): Promise<string> {
  const prompt = `
    You are a helpful AI teaching assistant in a live coding session.
    The student is asking you a question. Answer directly, helpfully, and concisely.
    If relevant, refer to the current code context provided below.
    
    Current Code Context:
    \`\`\`${language}
    ${currentCode}
    \`\`\`
    
    Student's Question: ${userMessage}
  `
  return await callGroq(prompt)
}