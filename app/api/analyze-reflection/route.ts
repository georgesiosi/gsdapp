import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { QuadrantType, TaskType } from '@/types/task';

interface AIResponse {
  isIdea: boolean;
  suggestedQuadrant?: QuadrantType;
  taskType?: TaskType | 'idea';
  connectedToPriority?: boolean;
  reasoning?: string;
  alignmentScore?: number;
  urgencyScore?: number;
  importanceScore?: number;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { task, justification, goal, priority, currentQuadrant, personalContext } = await request.json();

    if (!task) {
      return NextResponse.json({ error: 'Task text is required' }, { status: 400 });
    }



    // Create a more detailed prompt for the AI
    const prompt = `
You are an expert task management assistant. Analyze this task or idea based on the following context:

CONTEXT:
- Goal: "${goal || 'Not specified'}"
- Priority: "${priority || 'Not specified'}"
- Current quadrant: ${currentQuadrant || 'Not specified'}
- Personal context: "${personalContext || 'Not specified'}"

TASK: "${task}"
${justification ? `JUSTIFICATION: "${justification}"` : ''}

Determine if this is an IDEA (abstract, exploratory, needs development) or a TASK (actionable, concrete, clear completion criteria).

For TASKS:
1. Assign to a quadrant:
   - Q1 (Urgent & Important): Immediate attention, imminent deadlines
   - Q2 (Important, Not Urgent): Long-term value, no immediate deadline
   - Q3 (Urgent, Not Important): Deadline but limited value
   - Q4 (Neither): Low value, could be eliminated

2. Classify as 'personal' or 'work'

3. Rate (1-10):
   - Alignment with goals
   - Urgency
   - Importance

For IDEAS:
- Determine if connected to stated priority

Return a JSON object:
{
  "isIdea": boolean,
  "suggestedQuadrant": "q1" | "q2" | "q3" | "q4",
  "taskType": "personal" | "work" | "idea",
  "connectedToPriority": boolean,
  "reasoning": string,
  "alignmentScore": number,
  "urgencyScore": number,
  "importanceScore": number
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


    try {
      const cleanedContent = responseContent.trim();
      let jsonResponse;

      try {
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON object found in response');
        }

        const normalizedJson = jsonMatch[0]
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
          .replace(/:\s*'([^']*)'\s*([,}])/g, ':"$1"$2')
          .replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([,}])/g, ':"$1"$2');

        jsonResponse = JSON.parse(normalizedJson);

        if (!jsonResponse || typeof jsonResponse !== 'object') {
          throw new Error('Invalid JSON structure');
        }
      } catch (error) {
        const jsonError = error as Error;
        throw new Error(`Failed to parse AI response: ${jsonError.message}`);
      }

      // Validate and normalize the response
      const normalizedResponse: AIResponse = {
        isIdea: Boolean(jsonResponse.isIdea),
        suggestedQuadrant: (!jsonResponse.isIdea && jsonResponse.suggestedQuadrant) 
          ? jsonResponse.suggestedQuadrant 
          : (currentQuadrant || 'q4'),
        taskType: jsonResponse.taskType || (jsonResponse.isIdea ? 'idea' : 'work'),
        connectedToPriority: jsonResponse.isIdea 
          ? Boolean(jsonResponse.connectedToPriority) 
          : undefined,
        reasoning: jsonResponse.reasoning || 'No reasoning provided',
        alignmentScore: !jsonResponse.isIdea 
          ? (Number(jsonResponse.alignmentScore) || 5) 
          : undefined,
        urgencyScore: !jsonResponse.isIdea 
          ? (Number(jsonResponse.urgencyScore) || 5) 
          : undefined,
        importanceScore: !jsonResponse.isIdea 
          ? (Number(jsonResponse.importanceScore) || 5) 
          : undefined
      };

      // Validate the quadrant value
      const validQuadrants = ['q1', 'q2', 'q3', 'q4'] as const;
      if (!normalizedResponse.suggestedQuadrant || !validQuadrants.includes(normalizedResponse.suggestedQuadrant as any)) {
        normalizedResponse.suggestedQuadrant = currentQuadrant || 'q4';
      }

      // Validate the task type
      const validTaskTypes = ['personal', 'work', 'idea'] as const;
      if (!normalizedResponse.taskType || !validTaskTypes.includes(normalizedResponse.taskType as any)) {
        normalizedResponse.taskType = jsonResponse.isIdea ? 'idea' : 'work';
      }

      // Validate scores are within range
      (['alignmentScore', 'urgencyScore', 'importanceScore'] as const).forEach(score => {
        if (normalizedResponse[score] !== undefined) {
          normalizedResponse[score] = Math.max(1, Math.min(10, normalizedResponse[score] || 5));
        }
      });

      return NextResponse.json(normalizedResponse);
    } catch (parseError) {
      console.error("[API] Error parsing AI response:", parseError);
      console.error("[API] Response content:", responseContent);
      
      // Return a fallback response with the current quadrant
      return NextResponse.json({
        isIdea: false,
        suggestedQuadrant: currentQuadrant || 'q4',
        taskType: 'work',
        reasoning: 'Could not analyze task. Using default values.',
        alignmentScore: 5,
        urgencyScore: 5,
        importanceScore: 5
      });
    }
  } catch (error) {
    console.error("[API] Error in analyze-reflection route:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
