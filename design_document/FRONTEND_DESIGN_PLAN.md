# Notty Frontend Design Plan 📝

_Building a Note-Taking App with Data-Driven Design_

## 🎯 Core Philosophy: Start with Data, Build UI Around It

Following "How to Design Programs" principles, we'll design our frontend by first defining our data structures, then building components that are pure functions of that data.

---

## 📊 Phase 0: Data Architecture Foundation

### Step 1: Define Core Data Types

_Before writing any UI, we must understand what data we're working with_

```typescript
// src/types/Note.ts
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

interface Note {
  id: string;
  title: string;
  document: Block[]; // The actual content
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isPublic: boolean;
}

interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata?: BlockMetadata;
  children?: Block[]; // For nested structures
}

type BlockType =
  | "paragraph"
  | "heading"
  | "todo"
  | "bullet-list"
  | "numbered-list";

interface BlockMetadata {
  // For headings
  level?: 1 | 2 | 3 | 4 | 5 | 6;

  // For todos
  checked?: boolean;

  // For lists
  indent?: number;

  // For styling
  bold?: boolean;
  italic?: boolean;

  // Future: links, mentions, etc.
  [key: string]: any;
}

// Application State
interface AppState {
  currentUser: User | null;
  notes: Note[];
  currentNoteId: string | null;
  isLoading: boolean;
  error: string | null;
}
```

**Learning Objective**: Understand how TypeScript types become the foundation of everything we build.

---

## 🏗️ Phase 1: Basic Note Viewing (Read-Only)

_Start simple: Display existing notes without editing capabilities_

### Step 2: Create the Component Architecture

```
App
├── Sidebar
│   ├── UserProfile
│   ├── NoteList
│   │   └── NoteListItem (for each note)
│   └── CreateNoteButton
└── MainContent
    ├── NoteHeader
    │   ├── NoteTitle
    │   └── NoteMetadata
    └── NoteViewer
        └── BlockRenderer (recursive component)
            ├── ParagraphBlock
            ├── HeadingBlock
            ├── TodoBlock
            └── ListBlock
```

**Key Insight**: Each data type gets its own component. `Block` → `BlockRenderer`, `Note` → `NoteViewer`, etc.

### Step 3: Implementation Order

1. **Start with the Leaf Components** (bottom-up approach)

   ```typescript
   // src/components/blocks/ParagraphBlock.tsx
   interface ParagraphBlockProps {
     block: Block & { type: "paragraph" };
   }

   const ParagraphBlock = ({ block }: ParagraphBlockProps) => {
     return <p className="mb-4">{block.content}</p>;
   };
   ```

2. **Build the Recursive Renderer**

   ```typescript
   // src/components/blocks/BlockRenderer.tsx
   const BlockRenderer = ({ block }: { block: Block }) => {
     switch (block.type) {
       case "paragraph":
         return <ParagraphBlock block={block} />;
       case "heading":
         return <HeadingBlock block={block} />;
       case "todo":
         return <TodoBlock block={block} />;
       default:
         return null;
     }
   };
   ```

3. **Compose into Higher-Level Components**
   ```typescript
   // src/components/NoteViewer.tsx
   const NoteViewer = ({ note }: { note: Note }) => {
     return (
       <div className="note-viewer">
         {note.document.map((block) => (
           <BlockRenderer key={block.id} block={block} />
         ))}
       </div>
     );
   };
   ```

**Learning Objective**: See how data structure directly maps to component structure.

---

## ✏️ Phase 2: Basic Note Editing

_Add the ability to edit existing content_

### Step 4: Add Editing State and Handlers

```typescript
// Custom hook for note editing
const useNoteEditor = (initialNote: Note) => {
  const [note, setNote] = useState<Note>(initialNote);
  const [isEditing, setIsEditing] = useState(false);

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    setNote((currentNote) => ({
      ...currentNote,
      document: updateBlockInDocument(currentNote.document, blockId, updates),
    }));
  };

  const addBlock = (afterBlockId: string, newBlock: Block) => {
    // Implementation for adding blocks
  };

  const deleteBlock = (blockId: string) => {
    // Implementation for deleting blocks
  };

  return {
    note,
    isEditing,
    setIsEditing,
    updateBlock,
    addBlock,
    deleteBlock,
  };
};
```

### Step 5: Convert Viewers to Editors

Transform read-only components into editable ones:

```typescript
// src/components/blocks/EditableParagraphBlock.tsx
const EditableParagraphBlock = ({
  block,
  onUpdate,
  onAddBlock,
  onDeleteBlock,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(block.content);

  if (isEditing) {
    return (
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={() => {
          onUpdate(block.id, { content });
          setIsEditing(false);
        }}
        onKeyDown={handleKeyDown} // Enter to save, Escape to cancel
      />
    );
  }

  return (
    <p
      onClick={() => setIsEditing(true)}
      className="cursor-text hover:bg-gray-50 p-2 rounded"
    >
      {block.content || "Click to edit..."}
    </p>
  );
};
```

**Learning Objective**: Understand how the same data can be rendered differently based on application state (editing vs viewing).

---

## 📝 Phase 3: Note Creation and Management

_Add the ability to create new notes_

### Step 6: Note CRUD Operations

```typescript
// src/hooks/useNotes.ts
const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNote = async (title: string): Promise<Note> => {
    const newNote: Note = {
      id: generateId(),
      title,
      document: [
        {
          id: generateId(),
          type: "paragraph",
          content: "",
          metadata: {},
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: currentUser.id,
      isPublic: false,
    };

    // API call to save note
    const savedNote = await api.createNote(newNote);
    setNotes((current) => [...current, savedNote]);
    return savedNote;
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    // Implementation
  };

  const deleteNote = async (noteId: string) => {
    // Implementation
  };

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
  };
};
```

**Learning Objective**: See how business logic is encapsulated in custom hooks, keeping components simple.

---

## 🎨 Phase 4: Advanced Block Types

_Add support for todos, headings, and lists_

### Step 7: Implement Rich Block Types

```typescript
// src/components/blocks/TodoBlock.tsx
const TodoBlock = ({ block, onUpdate }) => {
  const { checked } = block.metadata || {};

  return (
    <div className="flex items-start gap-3 mb-2">
      <input
        type="checkbox"
        checked={checked || false}
        onChange={(e) =>
          onUpdate(block.id, {
            metadata: { ...block.metadata, checked: e.target.checked },
          })
        }
        className="mt-1"
      />
      <EditableText
        content={block.content}
        onUpdate={(content) => onUpdate(block.id, { content })}
        className={checked ? "line-through text-gray-500" : ""}
      />
    </div>
  );
};

// src/components/blocks/HeadingBlock.tsx
const HeadingBlock = ({ block, onUpdate }) => {
  const { level = 1 } = block.metadata || {};
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <HeadingTag className={`font-bold mb-4 ${getHeadingStyles(level)}`}>
      <EditableText
        content={block.content}
        onUpdate={(content) => onUpdate(block.id, { content })}
        placeholder={`Heading ${level}`}
      />
    </HeadingTag>
  );
};
```

### Step 8: Block Type Switching

```typescript
// Add block type conversion
const useBlockTypeConverter = () => {
  const convertBlockType = (block: Block, newType: BlockType): Block => {
    const baseBlock = {
      ...block,
      type: newType,
      metadata: getDefaultMetadataForType(newType),
    };

    // Type-specific conversions
    switch (newType) {
      case "todo":
        return { ...baseBlock, metadata: { checked: false } };
      case "heading":
        return { ...baseBlock, metadata: { level: 1 } };
      default:
        return baseBlock;
    }
  };

  return { convertBlockType };
};
```

**Learning Objective**: Learn how to extend your data model and see how UI automatically adapts.

---

## 🔗 Phase 5: Advanced Interactions

_Keyboard shortcuts, drag & drop, block nesting_

### Step 9: Keyboard-Driven Editing

```typescript
// src/hooks/useKeyboardShortcuts.ts
const useKeyboardShortcuts = (noteEditor) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter: Create new block
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        noteEditor.addBlockAfterCurrent();
      }

      // Tab: Indent block (for lists)
      if (e.key === "Tab") {
        e.preventDefault();
        noteEditor.indentCurrentBlock();
      }

      // Backspace on empty block: Delete block
      if (e.key === "Backspace" && isCurrentBlockEmpty()) {
        e.preventDefault();
        noteEditor.deleteCurrentBlock();
      }

      // Slash commands: /todo, /heading, etc.
      if (e.key === "/" && isAtBlockStart()) {
        showCommandPalette();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [noteEditor]);
};
```

### Step 10: Nested Block Support

```typescript
// Handle nested structures (like nested lists)
const updateBlockInDocument = (
  document: Block[],
  targetId: string,
  updates: Partial<Block>
): Block[] => {
  return document.map((block) => {
    if (block.id === targetId) {
      return { ...block, ...updates };
    }

    if (block.children) {
      return {
        ...block,
        children: updateBlockInDocument(block.children, targetId, updates),
      };
    }

    return block;
  });
};
```

**Learning Objective**: See how complex interactions are built on top of simple data transformations.

---

## 🎨 Phase 6: Polish and User Experience

### Step 11: Loading States and Error Handling

```typescript
// src/components/ui/LoadingStates.tsx
const NoteListSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

const ErrorBoundary = ({ children, fallback }) => {
  // Error boundary implementation
};
```

### Step 12: Responsive Design and Mobile Support

```typescript
// src/hooks/useResponsive.ts
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return { isMobile };
};

// Responsive layout
const AppLayout = () => {
  const { isMobile } = useResponsive();

  return (
    <div className={`flex ${isMobile ? "flex-col" : "flex-row"}`}>
      <Sidebar className={isMobile ? "order-2" : "order-1"} />
      <MainContent className={isMobile ? "order-1" : "order-2"} />
    </div>
  );
};
```

---

## 🧪 Phase 7: Testing Strategy

### Step 13: Component Testing

```typescript
// src/components/__tests__/BlockRenderer.test.tsx
describe("BlockRenderer", () => {
  it("renders paragraph blocks correctly", () => {
    const block: Block = {
      id: "1",
      type: "paragraph",
      content: "Hello world",
      metadata: {},
    };

    render(<BlockRenderer block={block} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("handles todo block interactions", async () => {
    const mockUpdate = jest.fn();
    const todoBlock: Block = {
      id: "1",
      type: "todo",
      content: "Buy groceries",
      metadata: { checked: false },
    };

    render(<BlockRenderer block={todoBlock} onUpdate={mockUpdate} />);

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(mockUpdate).toHaveBeenCalledWith("1", {
      metadata: { checked: true },
    });
  });
});
```

### Step 14: Integration Testing

```typescript
// src/__tests__/NoteEditor.integration.test.tsx
describe("Note Editor Integration", () => {
  it("allows creating and editing a complete note", async () => {
    render(<NoteEditor />);

    // Create a new note
    await user.click(screen.getByText("New Note"));

    // Edit title
    const titleInput = screen.getByPlaceholderText("Note title...");
    await user.type(titleInput, "My Shopping List");

    // Add content blocks
    const contentArea = screen.getByText("Click to start writing...");
    await user.click(contentArea);
    await user.type(contentArea, "Buy groceries");
    await user.keyboard("{Enter}");
    await user.type(screen.getByPlaceholderText("Write something..."), "/todo");

    // Verify the note structure
    expect(screen.getByDisplayValue("My Shopping List")).toBeInTheDocument();
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });
});
```

---

## 🔄 Development Workflow

### Daily Development Process

1. **Morning**: Define the data structure you'll work with today
2. **Implementation**: Build components that render that data
3. **Testing**: Write tests for the new functionality
4. **Refinement**: Refactor and improve based on usage
5. **Evening**: Review what you learned about the data model

### Code Review Checklist

- [ ] Is the data structure clearly defined with TypeScript?
- [ ] Are components pure functions of their props?
- [ ] Is state updated immutably?
- [ ] Are there tests for the new functionality?
- [ ] Is the code readable and well-named?
- [ ] Does the UI handle loading and error states?

---

## 🎯 Learning Outcomes

By the end of this plan, you will understand:

1. **Data-Driven Design**: How starting with data structures leads to better architecture
2. **React Patterns**: Custom hooks, component composition, state management
3. **TypeScript Benefits**: How types prevent bugs and improve developer experience
4. **Testing Strategy**: Unit testing, integration testing, and test-driven development
5. **Iterative Development**: Building complex features incrementally
6. **Code Organization**: Clean architecture and separation of concerns

---

## 🚀 Getting Started

**Right now, let's begin with Phase 0, Step 1**:

1. Create the `src/types/` directory
2. Define our core data types in `Note.ts`
3. Set up the basic folder structure

Would you like to start implementing this plan? We can take it step by step, and I'll explain the reasoning behind each decision as we go!

---

## 📚 Resources for Continued Learning

- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [How to Design Programs (Original Book)](https://htdp.org/)

_Remember: The goal is not just to build a working app, but to understand the principles that make software maintainable and extensible._
