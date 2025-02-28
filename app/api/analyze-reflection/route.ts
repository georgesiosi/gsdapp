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
- Ideas: Creative thoughts, concepts, or potential projects that are not yet actionable tasks

USER CONTEXT:
- User's main goal: "${goal || 'Not set'}"
- User's #1 priority for today: "${priority || 'Not set'}"

INSTRUCTIONS:
1. First, determine if the input is an idea rather than an actionable task
   - Ideas often start with phrases like "idea:", "concept:", "maybe", or describe potential future projects
   - Ideas are typically more abstract and less immediately actionable than tasks
2. If it's an idea, determine if it's connected to the user's priority or goals
3. If it's a task, analyze it in relation to the user's goal and daily priority
4. Tasks directly related to the daily priority should be considered Important
5. Tasks that block progress on the daily priority should be considered Urgent
6. Development and coding tasks related to the user's priority should be at least Q2 (Important)
7. Provide clear reasoning for your categorization decision
8. Determine if the task/idea is personal, work-related, or business-related based on its content and context

EXAMPLES:
- "Fix critical bug in production" → Task - Q1 (Urgent & Important) - Directly impacts product quality - Work-related
- "Plan next sprint" → Task - Q2 (Important, Not Urgent) - Important for progress but can be scheduled - Work-related
- "Idea: Create a dashboard for monitoring system performance" → Idea - Connected to work goals - Work-related
- "Idea: Start a side business selling handmade crafts" → Idea - Not connected to primary work goals - Personal
- "Doctor appointment" → Task - Q1 (Urgent & Important) - Health is crucial - Personal
- "Idea: Redesign the company website to improve user experience" → Idea - Connected to business goals - Business-related

Respond in JSON format:
{
  "isIdea": true|false,
  "connectedToPriority": true|false,
  "suggestedQuadrant": "q1|q2|q3|q4",
  "taskType": "personal|work|business|idea",
  "reasoning": "Detailed explanation of your analysis",
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
    console.log(`[AI Reasoning] Task/Idea: "${task}"`);
    console.log(`[AI Reasoning] Is Idea: ${result.isIdea}`);
    if (result.isIdea) {
      console.log(`[AI Reasoning] Connected to Priority: ${result.connectedToPriority}`);
    } else {
      console.log(`[AI Reasoning] Suggested Quadrant: ${result.suggestedQuadrant}`);
    }
    console.log(`[AI Reasoning] Task Type: ${result.taskType}`);
    console.log(`[AI Reasoning] Reasoning: ${result.reasoning}`);
    console.log(`[AI Reasoning] Scores: Alignment=${result.alignmentScore}, Urgency=${result.urgencyScore}, Importance=${result.importanceScore}`);
    
    // Store the reasoning in localStorage via client-side code
    // We'll return this data to be stored by the client

    return NextResponse.json({
      isIdea: result.isIdea,
      connectedToPriority: result.connectedToPriority,
      suggestedQuadrant: result.suggestedQuadrant as QuadrantType,
      taskType: result.taskType,
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
