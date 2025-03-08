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

    // Check if this is explicitly marked as an idea
    const isExplicitIdea = task.toLowerCase().trim().startsWith('idea:');
    const taskText = isExplicitIdea ? task.slice(5).trim() : task;

    // If it's explicitly marked as an idea, analyze only for priority connection
    if (isExplicitIdea) {
      // Create a focused prompt for priority analysis
      const priorityPrompt = `
Analyze if this idea is connected to the user's stated priority:

IDEA: "${taskText}"
PRIORITY: "${priority || 'Not specified'}"

Return a JSON object:
{
  "connectedToPriority": boolean,
  "reasoning": string
}
`;

      const priorityCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0.2,
        messages: [
          { role: "system", content: priorityPrompt },
          { role: "user", content: `Is this idea connected to the priority?` }
        ],
      });

      try {
        const priorityResponse = JSON.parse(
          priorityCompletion.choices[0]?.message?.content?.match(/\{[\s\S]*\}/)?.[0] || '{"connectedToPriority":false}'
        );

        return NextResponse.json({
          isIdea: true,
          taskType: 'idea',
          connectedToPriority: Boolean(priorityResponse.connectedToPriority),
          reasoning: priorityResponse.reasoning || 'User explicitly marked this as an idea'
        });
      } catch {
        return NextResponse.json({
          isIdea: true,
          taskType: 'idea',
          connectedToPriority: false,
          reasoning: 'User explicitly marked this as an idea'
        });
      }
    }



    // Create a more detailed prompt for the AI
    const prompt = `
You are an expert task management assistant. Analyze this task based on the following context:

CONTEXT:
- Goal: "${goal || 'Not specified'}"
- Priority: "${priority || 'Not specified'}"
- Current quadrant: ${currentQuadrant || 'Not specified'}
- Personal context: "${personalContext || 'Not specified'}"

TASK: "${task}"
${justification ? `JUSTIFICATION: "${justification}"` : ''}

Analyze the task and:

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

Return a JSON object:
{
  "suggestedQuadrant": "q1" | "q2" | "q3" | "q4",
  "taskType": "personal" | "work",
  "reasoning": string,
  "alignmentScore": number (1-10),
  "urgencyScore": number (1-10),
  "importanceScore": number (1-10)
}
`;

    // Call OpenAI API with a lower temperature for more consistent results
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.2, // Lower temperature for more consistent results
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `Analyze this task: "${taskText}"` }
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
        // Only allow ideas if explicitly marked with prefix
        isIdea: false,
        suggestedQuadrant: jsonResponse.suggestedQuadrant || currentQuadrant || 'q4',
        taskType: 'personal', // Default to personal for tasks like "go to gym"
        reasoning: jsonResponse.reasoning || 'No reasoning provided',
        alignmentScore: Number(jsonResponse.alignmentScore) || 5,
        urgencyScore: Number(jsonResponse.urgencyScore) || 5,
        importanceScore: Number(jsonResponse.importanceScore) || 5
      };

      // Validate the quadrant value
      const validQuadrants = ['q1', 'q2', 'q3', 'q4'] as const;
      if (!normalizedResponse.suggestedQuadrant || !validQuadrants.includes(normalizedResponse.suggestedQuadrant as any)) {
        normalizedResponse.suggestedQuadrant = currentQuadrant || 'q4';
      }

      // Validate the task type
      const validTaskTypes = ['personal', 'work'] as const;
      if (!normalizedResponse.taskType || !validTaskTypes.includes(normalizedResponse.taskType as any)) {
        normalizedResponse.taskType = 'personal';
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
