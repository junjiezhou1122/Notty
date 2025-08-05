interface Note {
    id: string;
    title: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    document: Block[];
}

interface Block {
    id: string;
    type: string;
    content: string;
}

interface HeaderBlock extends Block {
    type: "header";
    level: 1 | 2 | 3 | 4 | 5 | 6;
}

interface ParagraphBlock extends Block {
    type: "paragraph";
}

interface ListBlock extends Block {
    type: "list";
    items: ListItemBlock[];
}

interface TodoBlock extends Block {
    type: "todo";
    checked: boolean;
}

interface ListItemBlock extends Block {
    type: "list-item";
}

export type { Note, Block, HeaderBlock, ParagraphBlock, ListBlock, TodoBlock, ListItemBlock };