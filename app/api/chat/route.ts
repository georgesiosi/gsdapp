import { NextResponse } from 'next/server';
import OpenAI from 'openai';

type MessageRole = 'system' | 'user' | 'assistant';

// Create OpenAI client with user's API key
function createOpenAIClient(apiKey: string | null) {
  if (!apiKey) {
    console.error('[API-CHAT] Missing OpenAI API key');
    throw new ChatError('OpenAI API key is required', 400);
  }
  
  // Validate API key format
  if (!apiKey.startsWith('sk-')) {
    console.error('[API-CHAT] Invalid OpenAI API key format');
    throw new ChatError('Invalid OpenAI API key format. API keys should start with "sk-"', 400);
  }
  
  console.log('[API-CHAT] Creating OpenAI client with valid API key, length:', apiKey.length);
  return new OpenAI({ apiKey });
}

interface ChatMessage {
  id?: string;
  content: string;
  role: MessageRole;
}

interface Task {
  id: string;
  text: string;
  status: 'active' | 'completed';
  quadrant?: string;
  taskType?: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  userContext?: string;
  tasks?: Task[];
}

class ChatError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly shouldLog: boolean = true
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

function validateMessage(message: ChatMessage): asserts message is ChatMessage {
  if (!message.content || typeof message.content !== 'string') {
    throw new ChatError('Message content must be a non-empty string', 400);
  }
  if (!message.role || !['system', 'user', 'assistant'].includes(message.role)) {
    throw new ChatError(`Invalid message role: ${message.role}`, 400);
  }
}



import { LicenseService } from '@/services/license/licenseService';
import { PolarLicenseProvider } from '@/services/license/polarProvider';

// Initialize LicenseService with PolarProvider if not already initialized
function initializeLicenseService() {
  try {
    return LicenseService.getInstance();
  } catch {
    // Service not initialized, initialize it with PolarProvider
    const polarProvider = new PolarLicenseProvider(process.env.POLAR_API_KEY || 'default-key');
    return LicenseService.initialize(polarProvider);
  }
}

export async function POST(request: Request) {
  try {
    // Initialize services and get headers
    const [licenseService, headers] = [
      initializeLicenseService(),
      request.headers
    ];
    
    // Check license
    const licenseKey = headers.get('x-license-key');
    const licenseValidation = await licenseService.validateLicense(licenseKey);
    
    if (!licenseValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid or missing license key',
          type: licenseValidation.type
        },
        { status: 403 }
      );
    }

    // Get user's OpenAI API key from request header (sent by frontend)
    let openAIKey = headers.get('x-openai-key');
    
    console.log('[API-CHAT] Checking API key sources:', {
      fromHeader: !!openAIKey,
      headerLength: openAIKey?.length,
      fromEnv: !!(process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPEN_API_KEY)
    });
    
    // If not in header, try environment variables
    if (!openAIKey) {
      openAIKey = process.env.OPENAI_API_KEY || null;
      
      if (openAIKey) {
        console.log('[API-CHAT] Using API key from environment');
      } else {
        console.log('[API-CHAT] No API key found in environment variables');
      }
    }
    
    if (!openAIKey) {
      console.error('[API-CHAT] No OpenAI API key available from any source');
      return NextResponse.json(
        { error: 'OpenAI API key is required. Please add your API key in Settings.' },
        { status: 400 }
      );
    }
    
    // Validate API key format
    if (!openAIKey.startsWith('sk-')) {
      console.error('[API-CHAT] Invalid API key format');
      return NextResponse.json(
        { error: 'Invalid OpenAI API key format. API keys should start with "sk-"' },
        { status: 400 }
      );
    }

    // Initialize OpenAI client with user's key
    const openai = createOpenAIClient(openAIKey);

    // Extract and validate the request data
    const { messages, userContext, tasks }: ChatRequest = await request.json();

    if (!messages?.length) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Log request details for debugging
    console.log('[API] Processing chat request:', {
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content.substring(0, 50),
      hasContext: !!userContext,
      taskCount: tasks?.length
    });

    // Determine if we should include completed tasks
    const includeCompleted = userContext?.toLowerCase().includes('show completed') || 
                           userContext?.toLowerCase().includes('show all') ||
                           userContext?.toLowerCase().includes('include completed') ||
                           userContext?.toLowerCase().includes('archived');

    // Filter tasks based on status
    const filteredTasks = tasks?.filter(task => 
      includeCompleted ? true : task.status === 'active'
    ) || [];

    // Format filtered tasks
    const formattedTasks = filteredTasks.map(task => 
      `TASK_${task.id}|${task.text}|${task.status}|${task.quadrant || 'unassigned'}|${task.taskType || 'unspecified'}`
    ).join('\n') || 'NO_TASKS';

    // Create our enforced system message
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are a helpful assistant, with access to a task database query engine. You give helpful advice on how to be more productive or focused, but ONLY reference tasks from this list (if asked about tasks specifically):

=== TASK DATABASE ===
${formattedTasks}

RESPONSE RULES:
1. ALWAYS use TASK_[id] format to reference tasks
2. NEVER make up task IDs or numbers
3. NO general advice or abstractions
4. Keep responses under 50 words
5. Include task details (quadrant/type)
6. By default, ONLY suggest active tasks
7. ONLY mention completed tasks if explicitly requested

RESPONSE FORMAT:
TASK_[id] ([quadrant]/[type]) needs [specific action] because [1-line reason]. 

Next: TASK_[other-id].

EXAMPLES:
❌ "Focus on planning tasks"
❌ "Consider documentation work"
✅ "TASK_abc (q1/dev) needs code review because API endpoints are ready for testing. Next: TASK_def."

FAILURE MODES TO AVOID:
- Giving abstract advice
- Making up task IDs
- Suggesting tasks without IDs
- Responses without specific actions
- Suggesting completed tasks unless requested

${userContext ? `CONTEXT: ${userContext}\n` : ''}${includeCompleted ? 'NOTE: Including completed/archived tasks as requested.\n' : 'NOTE: Only showing active tasks. Add "show completed" to context to see all tasks.\n'}REMEMBER: ALWAYS use TASK_[id] format when referencing tasks.`
    };

    // Start with our system message
    const contextEnhancedMessages: ChatMessage[] = [systemMessage];



    // Add user messages to the conversation
    const validatedMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map((message: ChatMessage) => {
        try {
          validateMessage(message);
          return {
            content: message.content,
            role: message.role as 'user' | 'assistant'
          };
        } catch (error) {
          if (error instanceof ChatError) {
            throw error;
          }
          throw new ChatError(
            `Invalid message format: ${error instanceof Error ? error.message : String(error)}`,
            400
          );
        }
      });

    // Add validated messages after our system message
    contextEnhancedMessages.push(...validatedMessages);

    try {
      console.log('[API] Creating chat completion with context:', {
        messageCount: contextEnhancedMessages.length,
        roles: contextEnhancedMessages.map(m => m.role)
      });

      // Create chat completion with streaming
      const stream = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: contextEnhancedMessages.map(m => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content
        })),
        stream: true,
        temperature: 0.1,  // Very low temperature for almost deterministic responses
        max_tokens: 250,   // Shorter responses
        presence_penalty: 0.0,
        frequency_penalty: 0.0
      });

      console.log('[API] Starting stream processing');
      
      // Create a ReadableStream from the OpenAI stream
      const encoder = new TextEncoder();
      const streamedResponse = new ReadableStream({
        async start(controller) {
          try {
            let chunkCount = 0;
            for await (const part of stream) {
              console.log('[API] Raw chunk:', part);
              
              // Handle the chunk
              if (part.choices?.[0]?.delta?.content) {
                const text = part.choices[0].delta.content;
                chunkCount++;
                
                // Format as SSE data
                const data = JSON.stringify({ choices: [{ delta: { content: text } }] });
                const sseMessage = `data: ${data}\n\n`;
                controller.enqueue(encoder.encode(sseMessage));
                
                if (chunkCount === 1 || chunkCount % 10 === 0) {
                  console.log(`[API] Processed chunk ${chunkCount}:`, text.substring(0, 50));
                }
              }
            }
            
            console.log(`[API] Stream complete. Total chunks: ${chunkCount}`);
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('[API] Error in stream processing:', error);
            throw error;
          }
        }
      });

      // Return the stream with proper headers
      return new NextResponse(streamedResponse, {
        headers: new Headers({
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }),
      });
    } catch (streamError) {
      console.error('[ERROR] Streaming error:', streamError);
      throw new ChatError(
        'Failed to stream response. Please try again.',
        500
      );
    }
  } catch (error) {
    console.error('[ERROR] Chat API error:', error);
    
    // Handle specific error types
    if (error instanceof ChatError) {
      if (error.shouldLog) {
        console.error(`[ChatError] ${error.message}`);
      }
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    if (error instanceof Error) {
      // Handle OpenAI specific errors
      if (error.message.toLowerCase().includes('api key')) {
        return NextResponse.json(
          { error: 'API configuration error. Please check your environment variables.' },
          { status: 500 }
        );
      }

      if (error.message.toLowerCase().includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }

      if (error.message.toLowerCase().includes('invalid_request_error')) {
        return NextResponse.json(
          { error: 'Invalid request to AI service. Please try again.' },
          { status: 400 }
        );
      }
    }
    
    // Generic error response
    console.error('[UnhandledError]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
