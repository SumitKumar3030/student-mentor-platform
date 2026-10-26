import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

// A helper to delay execution
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function generateSessionSummary(
  chatMessages: { name: string; content: string }[],
  finalCode: string,
  language: string
): Promise<string> {
  if (!genAI) {
    console.error('❌ GEMINI_API_KEY is missing.')
    return 'AI Summary unavailable (missing API key).'
  }

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

  // We will try the fastest model, then fallback to the older stable one
  const modelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash']
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`🧠 Attempting AI generation with ${modelName}...`)
      const model = genAI.getGenerativeModel({ model: modelName })
      
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      
      if (text) {
        console.log(`✅ AI Summary generated successfully with ${modelName}`)
        return text
      }
    } catch (error: any) {
      console.warn(`⚠️ ${modelName} failed:`, error.message)
      
      // If it's a 503 (busy) or 429 (rate limit), wait 2 seconds before trying the next model
      if (error?.status === 503 || error?.status === 429) {
        console.log('Waiting 2 seconds before retrying...')
        await sleep(2000)
      }
    }
  }

  // If both models fail
  console.error('❌ All AI models failed to generate a response.')
  return 'AI Summary temporarily unavailable due to high demand. Please try again later.'
}

// ============================================
// 1. EXPLAIN CODE (Copilot Style)
// ============================================
export async function explainCode(code: string, language: string): Promise<string> {
  if (!genAI) return 'AI unavailable (missing key).'

  const prompt = `
    You are an expert programming mentor. 
    Explain the following ${language} code to a student.
    Keep it concise, use bullet points, and highlight any potential bugs or improvements.
    
    Code:
    \`\`\`${language}
    ${code}
    \`\`\`
  `

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' })
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    console.error('Explain Code Error:', error)
    return 'Failed to explain code. AI is currently busy.'
  }
}

// ============================================
// 2. CHAT WITH AI (Contextual)
// ============================================
export async function chatWithAI(
  userMessage: string, 
  currentCode: string, 
  language: string
): Promise<string> {
  if (!genAI) return 'AI unavailable (missing key).'

  const prompt = `
    You are an AI teaching assistant in a live coding session.
    The student is asking you a question. Answer directly, helpfully, and concisely.
    If relevant, refer to the current code context provided below.
    
    Current Code Context:
    \`\`\`${language}
    ${currentCode}
    \`\`\`
    
    Student's Question: ${userMessage}
  `

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' })
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    console.error('Chat AI Error:', error)
    return 'Sorry, my AI brain is taking a quick break. Please try again.'
  }
}