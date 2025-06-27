import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { Task } from '@/types/task';
import { ScorecardMetrics } from '@/types/scorecard';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { tasks, goal, priority } = await request.json();

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Tasks array is required' }, { status: 400 });
    }

    console.log("[API] Generating scorecard for", tasks.length, "tasks");
    console.log("[API] User goal:", goal);
    console.log("[API] User priority:", priority);

    // Calculate metrics
    const metrics = calculateMetrics(tasks, goal, priority);

    // Generate insights using OpenAI
    const insights = await generateInsights(metrics, tasks, goal, priority);

    return NextResponse.json({
      metrics,
      insights
    });
  } catch (error) {
    console.error("[API] Error in generate-scorecard route:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Calculate metrics from tasks
function calculateMetrics(tasks: Task[], goal: string, priority: string): ScorecardMetrics {
  // Get today's date range (start and end of day)
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  
  // Filter tasks for today
  const todaysTasks = tasks.filter(task => {
    const createdDate = task.createdAt ? new Date(task.createdAt) : null;
    const completedDate = task.completedAt ? new Date(task.completedAt) : null;
    
    // Include tasks that were:
    // 1. Created today, or
    // 2. Completed today
    return (
      (createdDate && createdDate >= startOfDay && createdDate < endOfDay) ||
      (completedDate && completedDate >= startOfDay && completedDate < endOfDay)
    );
  });
  
  console.log(`[DEBUG] Total tasks: ${tasks.length}, Today's tasks: ${todaysTasks.length}`);
  
  // Helper function to check if a task is completed today
  const isCompletedToday = (task: Task): boolean => {
    if (task.status !== 'completed' || !task.completedAt) return false;
    const completedDate = new Date(task.completedAt);
    return completedDate >= startOfDay && completedDate < endOfDay;
  };
  
  // Count tasks by quadrant (only today's tasks)
  const q1Tasks = todaysTasks.filter(task => task.quadrant === 'q1');
  const q2Tasks = todaysTasks.filter(task => task.quadrant === 'q2');
  const q3Tasks = todaysTasks.filter(task => task.quadrant === 'q3');
  const q4Tasks = todaysTasks.filter(task => task.quadrant === 'q4');
  
  // Count tasks completed today by quadrant
  const q1Completed = q1Tasks.filter(isCompletedToday);
  const q2Completed = q2Tasks.filter(isCompletedToday);
  const q3Completed = q3Tasks.filter(isCompletedToday);
  const q4Completed = q4Tasks.filter(isCompletedToday);
  
  // Calculate completion rates
  const q1CompletionRate = q1Tasks.length > 0 ? q1Completed.length / q1Tasks.length : 0;
  const q2CompletionRate = q2Tasks.length > 0 ? q2Completed.length / q2Tasks.length : 0;
  const q3CompletionRate = q3Tasks.length > 0 ? q3Completed.length / q3Tasks.length : 0;
  const q4CompletionRate = q4Tasks.length > 0 ? q4Completed.length / q4Tasks.length : 0;
  
  // Calculate high-value completion rate (Q1 + Q2)
  const highValueTasks = [...q1Tasks, ...q2Tasks];
  const highValueCompleted = [...q1Completed, ...q2Completed];
  const highValueCompletionRate = highValueTasks.length > 0 
    ? highValueCompleted.length / highValueTasks.length 
    : 0;
  
  // Calculate overall completion rate for today's tasks
  const totalTasks = todaysTasks.length;
  const completedTasks = todaysTasks.filter(isCompletedToday).length;
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
  
  console.log(`[DEBUG] Today's completion metrics:`, {
    total: totalTasks,
    completed: completedTasks,
    rate: completionRate,
    q1: { total: q1Tasks.length, completed: q1Completed.length },
    q2: { total: q2Tasks.length, completed: q2Completed.length },
    q3: { total: q3Tasks.length, completed: q3Completed.length },
    q4: { total: q4Tasks.length, completed: q4Completed.length },
  });
  
  // Calculate priority alignment score (0-10)
  // This is a simplified calculation - in a real implementation, you might
  // want to use NLP to determine how well completed tasks align with the priority
  const priorityAlignmentScore = calculatePriorityAlignment(tasks, priority);
  
  return {
    date: now.toISOString().split('T')[0],
    totalTasks,
    completedTasks,
    completionRate,
    quadrantMetrics: {
      q1: {
        total: q1Tasks.length,
        completed: q1Completed.length,
        completionRate: q1CompletionRate
      },
      q2: {
        total: q2Tasks.length,
        completed: q2Completed.length,
        completionRate: q2CompletionRate
      },
      q3: {
        total: q3Tasks.length,
        completed: q3Completed.length,
        completionRate: q3CompletionRate
      },
      q4: {
        total: q4Tasks.length,
        completed: q4Completed.length,
        completionRate: q4CompletionRate
      }
    },
    highValueCompletionRate,
    priorityAlignmentScore
  };
}

// Calculate priority alignment score (0-10)
function calculatePriorityAlignment(tasks: Task[], priority: string): number {
  if (!priority || priority.trim() === '') {
    return 5; // Default middle score if no priority is set
  }
  
  // Get today's date range
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  
  // Helper function to check if a task is completed today
  const isCompletedToday = (task: Task): boolean => {
    if (task.status !== 'completed' || !task.completedAt) return false;
    const completedDate = new Date(task.completedAt);
    return completedDate >= startOfDay && completedDate < endOfDay;
  };
  
  // Get high-value tasks completed today
  const completedHighValueTasks = tasks.filter(
    task => isCompletedToday(task) && (task.quadrant === 'q1' || task.quadrant === 'q2')
  );
  
  if (completedHighValueTasks.length === 0) {
    return 3; // Lower score if no high-value tasks were completed today
  }
  
  // Calculate ratio of completed high-value tasks to total completed tasks (today only)
  const completedTasks = tasks.filter(isCompletedToday);
  const highValueRatio = completedHighValueTasks.length / completedTasks.length;
  
  // Scale to 0-10 range, with a minimum of 2 and maximum of 10
  return Math.min(10, Math.max(2, Math.round(highValueRatio * 10)));
}

// Generate insights using OpenAI
async function generateInsights(
  metrics: ScorecardMetrics,
  tasks: Task[],
  goal: string,
  priority: string
) {
  try {
    // Create a prompt for OpenAI
    const prompt = `
You are an expert productivity coach analyzing a user's daily task performance.

USER'S GOAL: "${goal || 'Not specified'}"
USER'S PRIORITY FOR TODAY: "${priority || 'Not specified'}"

TASK PERFORMANCE METRICS:
- Total tasks: ${metrics.totalTasks}
- Completed tasks: ${metrics.completedTasks}
- Overall completion rate: ${(metrics.completionRate * 100).toFixed(1)}%
- High-value task completion rate (Q1+Q2): ${(metrics.highValueCompletionRate * 100).toFixed(1)}%
- Priority alignment score (0-10): ${metrics.priorityAlignmentScore}

QUADRANT BREAKDOWN:
- Q1 (Urgent & Important): ${metrics.quadrantMetrics.q1.completed}/${metrics.quadrantMetrics.q1.total} completed (${(metrics.quadrantMetrics.q1.completionRate * 100).toFixed(1)}%)
- Q2 (Not Urgent but Important): ${metrics.quadrantMetrics.q2.completed}/${metrics.quadrantMetrics.q2.total} completed (${(metrics.quadrantMetrics.q2.completionRate * 100).toFixed(1)}%)
- Q3 (Urgent but Not Important): ${metrics.quadrantMetrics.q3.completed}/${metrics.quadrantMetrics.q3.total} completed (${(metrics.quadrantMetrics.q3.completionRate * 100).toFixed(1)}%)
- Q4 (Not Urgent & Not Important): ${metrics.quadrantMetrics.q4.completed}/${metrics.quadrantMetrics.q4.total} completed (${(metrics.quadrantMetrics.q4.completionRate * 100).toFixed(1)}%)

TASK DETAILS:
${tasks.map(task => `- ${task.completed ? '✓' : '○'} [${task.quadrant.toUpperCase()}] ${task.text}`).join('\n')}

Based on this information, please provide:
1. A brief analysis of the user's productivity today (2-3 sentences)
2. Three specific, actionable suggestions for improvement tomorrow that are directly tied to their goal and priority

Your response should be concise, constructive, and focused on helping the user improve their productivity and goal alignment.

RESPONSE FORMAT:
Return a JSON object with the following structure:
{
  "analysis": "Your analysis here...",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}
`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: "Analyze my productivity today and provide suggestions." }
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
        return { 
          analysis: "Unable to analyze your productivity today. Please try again later.",
          suggestions: [
            "Focus on high-priority tasks tomorrow",
            "Try to complete more Q1 and Q2 tasks",
            "Review your goals and priorities to ensure alignment"
          ]
        };
      }
      
      const jsonResponse = JSON.parse(jsonMatch[0]);
      console.log("[API] Parsed response:", jsonResponse);
      
      return {
        analysis: jsonResponse.analysis || "Analysis not available",
        suggestions: jsonResponse.suggestions || []
      };
    } catch (parseError) {
      console.error("[API] Error parsing AI response:", parseError);
      
      // Return a fallback response
      return {
        analysis: "Unable to analyze your productivity today. Please try again later.",
        suggestions: [
          "Focus on high-priority tasks tomorrow",
          "Try to complete more Q1 and Q2 tasks",
          "Review your goals and priorities to ensure alignment"
        ]
      };
    }
  } catch (error) {
    console.error("[API] Error generating insights:", error);
    
    // Return a fallback response
    return {
      analysis: "Unable to analyze your productivity today. Please try again later.",
      suggestions: [
        "Focus on high-priority tasks tomorrow",
        "Try to complete more Q1 and Q2 tasks",
        "Review your goals and priorities to ensure alignment"
      ]
    };
  }
}
