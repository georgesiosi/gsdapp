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

// Create OpenAI client with user's API key
function createOpenAIClient(apiKey: string | null) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }
  return new OpenAI({ apiKey });
}

export async function POST(request: Request) {
  try {
    // Get user's OpenAI API key from headers
    const openAIKey = request.headers.get('x-openai-key') || process.env.OPENAI_API_KEY;
    if (!openAIKey) {
      console.error("[API] OpenAI API key not provided");
      return NextResponse.json(
        { error: 'OpenAI API key is required. Please add your API key in Settings.' },
        { status: 400 }
      );
    }
    
    // Initialize OpenAI client
    const openai = createOpenAIClient(openAIKey);
    
    const { task, justification, goal, priority, currentQuadrant, personalContext } = await request.json();

    if (!task) {
      return NextResponse.json({ error: 'Task text is required' }, { status: 400 });
    }

    // Check for idea indicators in the task text
    const isExplicitIdea = task.toLowerCase().trim().startsWith('idea:');
    const hasIdeaMarkers = task.toLowerCase().includes('maybe') || 
                          task.toLowerCase().includes('consider') || 
                          task.toLowerCase().includes('what if') || 
                          task.toLowerCase().includes('brainstorm');
    const taskText = isExplicitIdea ? task.slice(5).trim() : task;

    // If it's marked as an idea or has idea-like markers, analyze for priority connection
    if (isExplicitIdea || hasIdeaMarkers) {
      // Create a focused prompt for idea analysis
      const ideaPrompt = `
Analyze this potential idea and determine:
1. If it's truly an idea vs an actionable task
2. If it's connected to the user's stated priority

INPUT: "${taskText}"
PRIORITY: "${priority || 'Not specified'}"

Return a JSON object:
{
  "isIdea": boolean,
  "connectedToPriority": boolean,
  "reasoning": string,
  "suggestedConversion": string // If it should be a task, suggest how to convert it
}
`;

      try {
        const ideaCompletion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          temperature: 0.2,
          messages: [
            { role: "system", content: ideaPrompt },
            { role: "user", content: `Analyze this input and determine if it's an idea and its priority connection.` }
          ],
        });

        try {
          const ideaResponse = JSON.parse(
            ideaCompletion.choices[0]?.message?.content?.match(/\{[\s\S]*\}/)?.[0] || 
            '{"isIdea":true,"connectedToPriority":false,"reasoning":"Failed to parse response"}'
          );

          // If it's not actually an idea, proceed with task analysis
          if (!ideaResponse.isIdea && !isExplicitIdea) {
            // Fall through to task analysis
            console.log("[API] Input initially flagged as idea but determined to be a task");
          } else {
            return NextResponse.json({
              isIdea: true,
              taskType: 'idea',
              connectedToPriority: Boolean(ideaResponse.connectedToPriority),
              reasoning: ideaResponse.reasoning || 'Analysis completed',
              suggestedConversion: ideaResponse.suggestedConversion
            });
          }
        } catch (parseError) {
          console.error("[API] Failed to parse idea analysis response:", parseError);
          if (isExplicitIdea) {
            return NextResponse.json({
              isIdea: true,
              taskType: 'idea',
              connectedToPriority: false,
              reasoning: 'Failed to analyze idea, treating as unconnected idea'
            });
          }
          // Fall through to task analysis if not explicitly marked as idea
          console.log("[API] Falling back to task analysis due to parsing error");
        }
      } catch (openaiError) {
        console.error("[API] OpenAI API error during idea analysis:", openaiError);
        if (isExplicitIdea) {
          return NextResponse.json({
            isIdea: true,
            taskType: 'idea',
            connectedToPriority: false,
            reasoning: 'Unable to analyze due to service error, treating as unconnected idea'
          });
        }
        // Fall through to task analysis if not explicitly marked as idea
        console.log("[API] Falling back to task analysis due to API error");
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
    try {
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
          taskType: jsonResponse.taskType || 'personal', // Default to personal for tasks like "go to gym"
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
          taskType: 'personal',
          reasoning: 'Could not analyze task. Using default values.',
          alignmentScore: 5,
          urgencyScore: 5,
          importanceScore: 5
        });
      }
    } catch (openaiError) {
      console.error("[API] Error in OpenAI API call:", openaiError);
      return NextResponse.json({
        isIdea: false,
        suggestedQuadrant: currentQuadrant || 'q4',
        taskType: 'personal',
        reasoning: 'Error occurred during analysis. Using default values.',
        alignmentScore: 5,
        urgencyScore: 5,
        importanceScore: 5
      });
    }
  } catch (error) {
    console.error("[API] Unexpected error in analyze-reflection route:", error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
