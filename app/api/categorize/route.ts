import OpenAI from 'openai'
import { NextResponse } from "next/server"

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
    
    const { task, goal, priority } = await req.json()

    if (!task) {
      return NextResponse.json({ error: "Task is required" }, { status: 400 })
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for an Eisenhower Matrix productivity app.\n\n${goal ? `The user's main goal is: "${goal}"` : ""}\n${priority ? `Their #1 priority for today is: "${priority}"` : ""}\n\nAnalyze the following task and respond in strict JSON format as follows:\n{\n  \"category\": \"qX\",\n  \"reasoning\": \"your concise explanation of why you chose this quadrant\"\n}\n\nQuadrant options:\nq1: Urgent & Important (directly relates to goal/priority and time-sensitive)\nq2: Important, Not Urgent (relates to goal but not time-sensitive)\nq3: Urgent, Not Important (time-sensitive but doesn't relate to goal)\nq4: Not Urgent & Not Important (neither time-sensitive nor related to goal)\n\nBe brief and clear in your reasoning. Respond with only valid JSON, no extra text.`,
        },
        {
          role: "user",
          content: task,
        },
      ],
      temperature: 0.3,
      max_tokens: 120, // allow enough for reasoning

    })

    const aiRaw = response.choices[0]?.message?.content?.trim();
    let category = "q4";
    let reasoning = "No reasoning provided.";
    if (aiRaw) {
      try {
        const parsed = JSON.parse(aiRaw);
        if (["q1", "q2", "q3", "q4"].includes(parsed.category)) {
          category = parsed.category;
        }
        if (parsed.reasoning && typeof parsed.reasoning === "string") {
          reasoning = parsed.reasoning;
        }
      } catch (e) {
        // fallback: try to extract category if possible
        const match = aiRaw.match(/q[1-4]/);
        if (match) category = match[0];
        reasoning = "AI did not return valid JSON. Raw: " + aiRaw;
      }
    }
    return NextResponse.json({ category, reasoning });
  } catch (error) {
    console.error("Error in categorize route:", error)
    return NextResponse.json({ error: "Failed to categorize task", category: "q4" }, { status: 500 })
  }
}
