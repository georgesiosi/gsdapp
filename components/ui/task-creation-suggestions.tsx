import { Check } from 'lucide-react';

interface TaskCreationSuggestionsProps {
  taskText: string;
}

export function TaskCreationSuggestions({ taskText }: TaskCreationSuggestionsProps) {
  const startsWithVerb = /^[A-Za-z]+(ing|ed|s)\b/.test(taskText);
  const isSpecific = taskText.split(' ').length >= 5;
  const hasOutcome = /(complete|finish|achieve|produce|create|deliver)/i.test(taskText);

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
