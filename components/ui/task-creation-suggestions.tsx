import { Check } from 'lucide-react';

interface TaskCreationSuggestionsProps {
  taskText: string;
}

export function TaskCreationSuggestions({ taskText }: TaskCreationSuggestionsProps) {
  // Common action verbs in task management
  const actionVerbs = [
    'buy', 'make', 'create', 'call', 'write', 'read', 'send', 'meet', 'talk', 'prepare',
    'organize', 'schedule', 'review', 'analyze', 'plan', 'design', 'build', 'develop',
    'research', 'contact', 'update', 'finalize', 'complete', 'submit', 'present', 'draft', 
    'edit', 'check', 'follow', 'arrange', 'book', 'reserve', 'pay', 'order', 'print', 'fix'
  ];
  
  // Match both common action verbs and verbs with standard endings (ing, ed, s)
  const firstWord = taskText.trim().split(/\s+/)[0].toLowerCase();
  const startsWithVerb = /^[A-Za-z]+(ing|ed|s)\b/.test(taskText) || actionVerbs.includes(firstWord);
  const isSpecific = taskText.split(' ').length >= 5;
  // Words that indicate a clear outcome or completion
  const outcomeIndicators = [
    'complete', 'finish', 'achieve', 'produce', 'create', 'deliver', 'buy', 'make', 
    'obtain', 'acquire', 'reach', 'generate', 'establish', 'implement', 'build',
    'prepare', 'get', 'set up', 'organize', 'submit', 'finalize', 'publish'
  ];
  
  // Check for either regex pattern OR if any outcome indicator word is in the text
  const hasOutcome = outcomeIndicators.some(indicator => taskText.toLowerCase().includes(indicator));

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <Check className={`h-4 w-4 ${startsWithVerb ? 'text-green-500' : 'text-gray-300'}`} />
        <span>Start with an action verb</span>
      </div>
      <div className="flex items-center gap-2">
        <Check className={`h-4 w-4 ${isSpecific ? 'text-green-500' : 'text-gray-300'}`} />
        <span>Be specific and measurable</span>
      </div>
      <div className="flex items-center gap-2">
        <Check className={`h-4 w-4 ${hasOutcome ? 'text-green-500' : 'text-gray-300'}`} />
        <span>Include a clear outcome</span>
      </div>
    </div>
  );
}
