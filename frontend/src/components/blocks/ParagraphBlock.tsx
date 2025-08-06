import { useState, useEffect } from "react";

interface ParagraphBlockProps {
  content: string;
  onContentChange: (newContent: string) => void;
  onConvertToHeader?: (level: 1 | 2 | 3 | 4 | 5 | 6, content: string) => void;
}

function ParagraphBlock({
  content,
  onContentChange,
  onConvertToHeader,
}: ParagraphBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);

  // Auto-start editing for empty blocks and sync editValue
  useEffect(() => {
    setEditValue(content);
    if (content === "") {
      setIsEditing(true);
    }
  }, [content]);

  // Function to detect markdown headers
  const detectHeaderMarkdown = (
    text: string
  ): { isHeader: boolean; level?: 1 | 2 | 3 | 4 | 5 | 6; content?: string } => {
    const trimmed = text.trim();
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);

    if (headerMatch) {
      const level = headerMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const content = headerMatch[2];
      return { isHeader: true, level, content };
    }

    return { isHeader: false };
  };

  if (isEditing) {
    return (
      <textarea
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => {
          const headerDetection = detectHeaderMarkdown(editValue);
          if (headerDetection.isHeader && onConvertToHeader) {
            onConvertToHeader(headerDetection.level!, headerDetection.content!);
          } else {
            onContentChange(editValue);
          }
          setIsEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            const headerDetection = detectHeaderMarkdown(editValue);
            if (headerDetection.isHeader && onConvertToHeader) {
              onConvertToHeader(
                headerDetection.level!,
                headerDetection.content!
              );
            } else {
              onContentChange(editValue);
            }
            setIsEditing(false);
          }
        }}
        className="w-full p-2 border-none resize-none bg-transparent text-gray-800 focus:outline-none"
        autoFocus
      />
    );
  }

  return (
    <p
      className="mb-4 text-gray-800 cursor-text hover:bg-gray-50 p-2 rounded min-h-[1.5rem]"
      onClick={() => setIsEditing(true)}
    >
      {content || (
        <span className="text-gray-400 italic">Click to add text...</span>
      )}
    </p>
  );
}

export default ParagraphBlock;
