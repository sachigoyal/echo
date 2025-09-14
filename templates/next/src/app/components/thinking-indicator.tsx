export default function ThinkingIndicator() {
  return (
    <div className="rounded-lg border p-3 bg-gray-50 border-gray-200 animate-in fade-in duration-300">
      <div className="mb-1 text-xs font-medium text-gray-500">Assistant</div>
      <div className="flex items-center gap-2 text-gray-600">
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
        </div>
        <span className="text-sm">Thinking...</span>
      </div>
    </div>
  );
}
