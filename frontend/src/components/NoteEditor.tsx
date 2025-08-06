import { useState } from "react";
import type {
  Note,
  Block,
  HeaderBlock as HeaderBlockType,
} from "../types/Note";
import ParagraphBlock from "./blocks/ParagraphBlock";
import HeaderBlock from "./blocks/HeaderBlock";

interface NoteEditorProps {
  initialNote?: Note;
}

function NoteEditor({ initialNote }: NoteEditorProps) {
  // Sample note data using your types!
  const [note, setNote] = useState<Note>({
    id: "1",
    title: "My First Real Note",
    userId: "user1",
    createdAt: new Date(),
    updatedAt: new Date(),
    document: [
      {
        id: "block1",
        type: "paragraph",
        content: "Try typing '# My Header' and press Enter!",
      } as Block,
      {
        id: "block2",
        type: "paragraph",
        content: "Or try '## Smaller Header' for H2",
      } as Block,
      {
        id: "block3",
        type: "paragraph",
        content: "Regular paragraph text stays as paragraph",
      } as Block,
    ] as Block[],
  });

  // Function to update a specific block
  const updateBlock = (blockId: string, newContent: string) => {
    setNote((currentNote) => ({
      ...currentNote,
      document: currentNote.document.map((block) =>
        block.id === blockId ? { ...block, content: newContent } : block
      ),
      updatedAt: new Date(),
    }));
  };

  // Function to convert a paragraph block to header block
  const convertToHeader = (
    blockId: string,
    level: 1 | 2 | 3 | 4 | 5 | 6,
    content: string
  ) => {
    setNote((currentNote) => ({
      ...currentNote,
      document: currentNote.document.map((block) =>
        block.id === blockId
          ? ({ ...block, type: "header", content, level } as HeaderBlockType)
          : block
      ),
      updatedAt: new Date(),
    }));
  };

  // Function to add a new block after a specific block
  const addBlockAfter = (afterBlockId: string) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`, // Simple ID generation
      type: "paragraph",
      content: "",
    };

    setNote((currentNote) => {
      const blockIndex = currentNote.document.findIndex(
        (block) => block.id === afterBlockId
      );
      const newDocument = [...currentNote.document];
      newDocument.splice(blockIndex + 1, 0, newBlock); // Insert after current block

      return {
        ...currentNote,
        document: newDocument,
        updatedAt: new Date(),
      };
    });
  };

  // Function to delete a block
  const deleteBlock = (blockId: string) => {
    setNote((currentNote) => ({
      ...currentNote,
      document: currentNote.document.filter((block) => block.id !== blockId),
      updatedAt: new Date(),
    }));
  };

  // Function to add a block at the end
  const addBlockAtEnd = () => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type: "paragraph",
      content: "",
    };

    setNote((currentNote) => ({
      ...currentNote,
      document: [...currentNote.document, newBlock],
      updatedAt: new Date(),
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
      {/* Note Title */}
      <h1 className="text-3xl font-bold mb-8 text-gray-900">{note.title}</h1>

      {/* Render Each Block */}
      {note.document.map((block) => {
        if (block.type === "header") {
          const headerBlock = block as HeaderBlockType;
          return (
            <HeaderBlock
              key={block.id}
              content={block.content}
              level={headerBlock.level}
              onContentChange={(newContent) =>
                updateBlock(block.id, newContent)
              }
            />
          );
        }

        return (
          <ParagraphBlock
            key={block.id}
            content={block.content}
            onContentChange={(newContent) => updateBlock(block.id, newContent)}
            onConvertToHeader={(level, content) =>
              convertToHeader(block.id, level, content)
            }
          />
        );
      })}

      {/* Add Block Button */}
      <button
        onClick={addBlockAtEnd}
        className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150 mb-4"
      >
        <span className="text-lg">+</span>
        <span>Add block</span>
      </button>

      {/* Debug Info */}
      <div className="mt-8 p-4 bg-gray-100 rounded text-xs">
        <strong>Debug - Note Data:</strong>
        <pre>{JSON.stringify(note, null, 2)}</pre>
      </div>
    </div>
  );
}

export default NoteEditor;
