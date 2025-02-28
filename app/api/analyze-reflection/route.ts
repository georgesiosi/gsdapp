import OpenAI from 'openai'
import { NextResponse } from "next/server"
import { QuadrantType } from "@/types/task"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 });
    }
    
    const { task, justification, goal, priority, currentQuadrant } = await req.json()

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI task analyzer helping users categorize tasks using the Eisenhower Matrix (Urgent vs Important).

DEFINITIONS:
- Urgent & Important (Q1): Tasks that require immediate attention and are crucial to the user's goals
- Important, Not Urgent (Q2): Tasks that are aligned with goals but can be scheduled for later
- Urgent, Not Important (Q3): Tasks with deadlines but less aligned with goals
- Not Urgent & Not Important (Q4): Tasks with minimal impact on goals and no time pressure

USER CONTEXT:
- User's main goal: "${goal || 'Not set'}"
- User's #1 priority for today: "${priority || 'Not set'}"

INSTRUCTIONS:
1. Analyze the task in relation to the user's goal and daily priority
2. Tasks directly related to the daily priority should be considered Important
3. Tasks that block progress on the daily priority should be considered Urgent
4. Development and coding tasks related to the user's priority should be at least Q2 (Important)
5. Provide clear reasoning for your categorization decision

EXAMPLES:
- "Fix critical bug in production" → Q1 (Urgent & Important) - Directly impacts product quality
- "Plan next sprint" → Q2 (Important, Not Urgent) - Important for progress but can be scheduled
- "Respond to non-critical email" → Q3 (Urgent, Not Important) - Has time pressure but low impact
- "Browse social media" → Q4 (Not Urgent & Not Important) - Not aligned with goals

Respond in JSON format:
{
  "suggestedQuadrant": "q1|q2|q3|q4",
  "reasoning": "Detailed explanation of why this task belongs in the suggested quadrant",
  "alignmentScore": 1-10,
  "urgencyScore": 1-10,
  "importanceScore": 1-10
}`
        },
        {
          role: "user",
          content: `Task: "${task}"
Current quadrant: ${currentQuadrant}
${justification ? `User justification: "${justification}"` : ''}`
        }
      ],
      temperature: 0.4,
    })

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in response');
    }
    
    // Parse the AI response
    const result = JSON.parse(content);
    
    // Log the AI reasoning to console (in production this could go to a file or database)
    console.log(`[AI Reasoning] Task: "${task}" → ${result.suggestedQuadrant}`);
    console.log(`[AI Reasoning] Reasoning: ${result.reasoning}`);
    console.log(`[AI Reasoning] Scores: Alignment=${result.alignmentScore}, Urgency=${result.urgencyScore}, Importance=${result.importanceScore}`);
    
    // Store the reasoning in localStorage via client-side code
    // We'll return this data to be stored by the client

    return NextResponse.json({
      suggestedQuadrant: result.suggestedQuadrant as QuadrantType,
      reasoning: result.reasoning,
      alignmentScore: result.alignmentScore,
      urgencyScore: result.urgencyScore,
      importanceScore: result.importanceScore
    })
  } catch (error) {
    console.error('Error in analyze-reflection route:', error);
    console.error("Error analyzing reflection:", error)
    return NextResponse.json(
      { error: "Failed to analyze reflection" },
      { status: 500 }
    )
  }
}
