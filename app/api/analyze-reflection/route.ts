import OpenAI from 'openai'
import { NextResponse } from "next/server"
import { QuadrantType } from "@/types/task"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { task, justification, goal, priority, currentQuadrant } = await req.json()

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI task analyzer helping users align their tasks with their goals.
          The user's main goal is: "${goal || 'Not set'}"
          Their #1 priority for today is: "${priority || 'Not set'}"
          
          A task was categorized as ${currentQuadrant} (not directly aligned with their goal).
          The user has provided a justification for why they still want to do this task.
          
          Analyze their justification and:
          1. Determine if the justification shows good alignment with their goal/priority
          2. If yes, suggest moving to a more important quadrant (q1 or q2)
          3. If no, provide a constructive suggestion for better goal alignment
          
          Respond in JSON format:
          {
            "analysis": "brief analysis of the justification",
            "suggestedQuadrant": "q1|q2|q3|q4",
            "suggestion": "constructive suggestion if needed"
          }`
        },
        {
          role: "user",
          content: `Task: "${task}"\nJustification: "${justification}"`
        }
      ],
      temperature: 0.3,
    })

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in response');
    }
    const result = JSON.parse(content);

    return NextResponse.json({
      analysis: result.analysis,
      suggestedQuadrant: result.suggestedQuadrant as QuadrantType,
      suggestion: result.suggestion
    })
  } catch (error) {
    console.error("Error analyzing reflection:", error)
    return NextResponse.json(
      { error: "Failed to analyze reflection" },
      { status: 500 }
    )
  }
}
