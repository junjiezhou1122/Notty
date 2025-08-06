import { useState, useEffect } from "react";

interface HeaderBlockProps {
  content: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  onContentChange: (newContent: string) => void;
}

function HeaderBlock({ content, level, onContentChange }: HeaderBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);

  // Auto-start editing for empty blocks and sync editValue
  useEffect(() => {
    setEditValue(content);
    if (content === "") {
      setIsEditing(true);
    }
  }, [content]);

  if (isEditing) {
    return (
      <textarea
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => {
          onContentChange(editValue);
          setIsEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            onContentChange(editValue);
            setIsEditing(false);
          }
        }}
        className="w-full p-2 border-none resize-none bg-transparent text-gray-800 focus:outline-none font-bold text-2xl"
        autoFocus
        rows={1}
      />
    );
  }

  // Create a dynamic tag name
  const HeaderTag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  return (
    <HeaderTag
      className="font-bold text-gray-800 cursor-text hover:bg-gray-50 p-2 rounded min-h-[2rem] text-2xl mb-4"
      onClick={() => setIsEditing(true)}
    >
      {content || (
        <span className="text-gray-400 italic font-normal">
          Click to add heading...
        </span>
      )}
    </HeaderTag>
  );
}

export default HeaderBlock;
