export interface Note {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  document: Block[];
}

export interface Block {
  id: string;
  type: string;
  content: string;
}

export interface HeaderBlock extends Block {
  type: "header";
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ParagraphBlock extends Block {
  type: "paragraph";
}

export interface ListBlock extends Block {
  type: "list";
  items: ListItemBlock[];
}

export interface TodoBlock extends Block {
  type: "todo";
  checked: boolean;
}

export interface ListItemBlock extends Block {
  type: "list-item";
}
