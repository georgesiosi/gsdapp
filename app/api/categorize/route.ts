import { Configuration, OpenAIApi } from "openai-edge"
import { NextResponse } from "next/server"

// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(config)

export async function POST(req: Request) {
  try {
    const { task, goal, priority } = await req.json()

    if (!task) {
      return NextResponse.json({ error: "Task is required" }, { status: 400 })
    }

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI task categorizer for an Eisenhower Matrix.
          ${goal ? `The user's main goal is: "${goal}"` : ""}
          ${priority ? `Their #1 priority for today is: "${priority}"` : ""}
          
          Analyze the task and categorize it into one of four quadrants:
          q1: Urgent & Important (directly relates to goal/priority and time-sensitive)
          q2: Important, Not Urgent (relates to goal but not time-sensitive)
          q3: Urgent, Not Important (time-sensitive but doesn't relate to goal)
          q4: Not Urgent & Not Important (neither time-sensitive nor related to goal)
          
          Consider how well the task aligns with the user's goal and priority when determining importance.
          Respond only with the quadrant identifier (q1, q2, q3, or q4).`,
        },
        {
          role: "user",
          content: task,
        },
      ],
      temperature: 0.3,
      max_tokens: 10,
    })

    const data = await response.json()
    const category = data.choices[0]?.message?.content?.trim().toLowerCase()

    if (!category || !["q1", "q2", "q3", "q4"].includes(category)) {
      return NextResponse.json({ category: "q4" })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Error in categorize route:", error)
    return NextResponse.json({ error: "Failed to categorize task", category: "q4" }, { status: 500 })
  }
}

