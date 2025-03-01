import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { task, justification, goal, priority, currentQuadrant } = await request.json();

    if (!task) {
      return NextResponse.json({ error: 'Task text is required' }, { status: 400 });
    }

    console.log("[API] Analyzing task:", task.substring(0, 30));
    console.log("[API] User goal:", goal);
    console.log("[API] User priority:", priority);
    console.log("[API] Current quadrant:", currentQuadrant);

    // Create a more detailed prompt for the AI
    const prompt = `
You are an expert task management assistant that helps users analyze and categorize their tasks or ideas.

CONTEXT:
- User's current goal: "${goal || 'Not specified'}"
- User's current priority: "${priority || 'Not specified'}"
- Current quadrant assignment: ${currentQuadrant || 'Not specified'}

TASK TO ANALYZE: "${task}"
${justification ? `User's justification: "${justification}"` : ''}

STEP 1: DETERMINE IF THIS IS AN IDEA OR A TASK
First, determine if this is an idea (something to consider or explore later) or a task.

Characteristics of IDEAS:
- Might start with phrases like "Idea:", "Maybe I should", "I wonder if", "It would be interesting to", "What if", "Consider"
- Describes a concept, possibility, or future consideration rather than an immediate action
- Lacks specific actionable steps or clear completion criteria
- Often more abstract or exploratory in nature
- Usually requires further development before it can be acted upon

Characteristics of TASKS:
- Starts with action verbs like "Call", "Write", "Schedule", "Buy", "Finish", "Complete" (but not limited to)
- Has clear completion criteria - you know when it's done
- Describes a specific action that can be taken immediately
- Is concrete rather than abstract
- Has an implied or explicit deadline

STEP 2: IF THIS IS A TASK, DETERMINE THE APPROPRIATE QUADRANT
For tasks, analyze and categorize into one of four quadrants based on urgency and importance:

Quadrant 1 (q1) - Urgent & Important:
- Tasks that need immediate attention
- Tasks with imminent deadlines (today/tomorrow)
- Tasks with significant consequences if not completed soon
- Tasks directly related to the user's stated priorities or goals
- Examples: "Submit report due tomorrow", "Prepare for tomorrow's presentation"

Quadrant 2 (q2) - Important but Not Urgent:
- Tasks aligned with long-term goals and priorities
- Tasks that are important for personal/professional growth
- Tasks that prevent future urgent matters
- Tasks without immediate deadlines but high value
- Examples: "Plan next quarter's strategy", "Learn new programming language"

Quadrant 3 (q3) - Urgent but Not Important:
- Tasks with deadlines but limited long-term value
- Tasks that are urgent for others but not aligned with user's priorities
- Interruptions and some meetings
- Examples: "Respond to non-critical email", "Attend optional meeting"

Quadrant 4 (q4) - Neither Urgent nor Important:
- Tasks with little value or urgency
- Distractions and time-wasters
- Tasks that could be eliminated
- Examples: "Browse social media", "Organize old files"

STEP 3: DETERMINE THE TASK TYPE
Determine if this is a 'personal' or 'work' task based on context.

STEP 4: FOR IDEAS ONLY - DETERMINE IF CONNECTED TO PRIORITY
If this is an idea, determine if it's connected to the user's stated priority. An idea is connected to a priority if:
- It directly relates to achieving the stated priority
- It could significantly impact the priority if implemented
- It addresses a challenge or opportunity related to the priority

STEP 5: PROVIDE REASONING SCORES (1-10)
For tasks only, rate the following on a scale of 1-10:
- Alignment Score: How well does this align with the user's goals/priorities?
- Urgency Score: How time-sensitive is this task?
- Importance Score: How significant is this task for long-term success?

RESPONSE FORMAT:
Return a JSON object with the following structure:
{
  "isIdea": boolean, // true if this is an idea, false if it's an actionable task
  "suggestedQuadrant": "q1" | "q2" | "q3" | "q4", // only for tasks, not for ideas
  "taskType": "personal" | "work" | "idea", // "idea" if isIdea is true
  "connectedToPriority": boolean, // only for ideas, indicates if the idea is connected to the user's priority
  "reasoning": string, // detailed explanation for your categorization
  "alignmentScore": number, // 1-10, only for tasks
  "urgencyScore": number, // 1-10, only for tasks
  "importanceScore": number // 1-10, only for tasks
}
`;

    // Call OpenAI API with a lower temperature for more consistent results
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.2, // Lower temperature for more consistent results
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `Analyze this task: "${task}"` }
      ],
    });

    // Extract the response
    const responseContent = completion.choices[0]?.message?.content || '';
    console.log("[API] Raw AI response:", responseContent);

    try {
      // Find the JSON object in the response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error("[API] Failed to extract JSON from response");
        return NextResponse.json({ 
          error: 'Failed to parse AI response',
          suggestedQuadrant: currentQuadrant,
          taskType: 'work',
          isIdea: false
        });
      }
      
      const jsonResponse = JSON.parse(jsonMatch[0]);
      console.log("[API] Parsed response:", jsonResponse);
      
      // Validate the response format
      if (jsonResponse.isIdea === undefined) {
        console.error("[API] Missing isIdea field in response");
        jsonResponse.isIdea = false;
      }
      
      // For tasks, ensure we have a quadrant
      if (!jsonResponse.isIdea && !jsonResponse.suggestedQuadrant) {
        console.warn("[API] Missing suggestedQuadrant for task, using current quadrant");
        jsonResponse.suggestedQuadrant = currentQuadrant || 'q4';
      }
      
      // Ensure we have a task type
      if (!jsonResponse.taskType) {
        console.warn("[API] Missing taskType, defaulting based on isIdea");
        jsonResponse.taskType = jsonResponse.isIdea ? 'idea' : 'work-business';
      }
      
      // For ideas, ensure we have connectedToPriority
      if (jsonResponse.isIdea && jsonResponse.connectedToPriority === undefined) {
        console.warn("[API] Missing connectedToPriority for idea, defaulting to false");
        jsonResponse.connectedToPriority = false;
      }
      
      // For tasks, ensure we have scores
      if (!jsonResponse.isIdea) {
        if (!jsonResponse.alignmentScore) jsonResponse.alignmentScore = 5;
        if (!jsonResponse.urgencyScore) jsonResponse.urgencyScore = 5;
        if (!jsonResponse.importanceScore) jsonResponse.importanceScore = 5;
      }
      
      return NextResponse.json(jsonResponse);
    } catch (parseError) {
      console.error("[API] Error parsing AI response:", parseError);
      console.error("[API] Response content:", responseContent);
      
      // Return a fallback response
      return NextResponse.json({
        error: 'Failed to parse AI response',
        suggestedQuadrant: currentQuadrant || 'q4',
        taskType: 'work',
        isIdea: false,
        reasoning: 'Error parsing AI response. Using default values.'
      });
    }
  } catch (error) {
    console.error("[API] Error in analyze-reflection route:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
