import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { personalContext } = await req.json();

    if (!personalContext) {
      return NextResponse.json(
        { error: 'Personal context is required' },
        { status: 400 }
      );
    }

    const prompt = `Analyze the following personal context and provide specific guidance for each quadrant of the Eisenhower Matrix. The response should help the user prioritize tasks based on their personal context:

Personal Context:
${personalContext}

For each quadrant, provide:
1. A concise summary (1-2 sentences)
2. 2-4 bullet points with specific criteria or examples based on the user's context

Format the response as a JSON object with q1, q2, q3, and q4 properties, each containing 'summary' and 'bulletPoints' arrays.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant helping analyze personal context for task prioritization using the Eisenhower Matrix."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(response);

    // Ensure proper structure
    const formattedAnalysis = {
      q1: {
        summary: analysis.q1.summary || '',
        bulletPoints: analysis.q1.bulletPoints || []
      },
      q2: {
        summary: analysis.q2.summary || '',
        bulletPoints: analysis.q2.bulletPoints || []
      },
      q3: {
        summary: analysis.q3.summary || '',
        bulletPoints: analysis.q3.bulletPoints || []
      },
      q4: {
        summary: analysis.q4.summary || '',
        bulletPoints: analysis.q4.bulletPoints || []
      }
    };

    return NextResponse.json(formattedAnalysis);
  } catch (error) {
    console.error('Error analyzing personal context:', error);
    return NextResponse.json(
      { error: 'Failed to analyze personal context' },
      { status: 500 }
    );
  }
}
