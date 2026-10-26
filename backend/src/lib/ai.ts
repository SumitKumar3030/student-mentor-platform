import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function generateSessionSummary(
  chatMessages: { name: string; content: string }[],
  finalCode: string,
  language: string
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return 'AI Summary unavailable (missing API key).'
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const chatContext = chatMessages
      .map((m) => `${m.name}: ${m.content}`)
      .join('\n')

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

    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    console.error('AI Generation Error:', error)
    return 'Failed to generate AI summary.'
  }
}