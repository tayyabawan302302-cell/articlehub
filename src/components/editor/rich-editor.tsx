"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

export function RichEditor({
  content,
  onChange,
}: {
  content: JSONContent | null;
  onChange: (json: JSONContent, html: string) => void;
}) {
  const editor = useEditor({
    // Prevents Tiptap's SSR/hydration warning in Next.js.
    immediatelyRender: false,

    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],

    content: content ?? "",

    editorProps: {
      attributes: {
        class: "prose max-w-none min-h-[400px] focus:outline-none",
      },
    },

    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-line rounded-lg">
      <Toolbar editor={editor} />

      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: any }) {
  const items = [
    {
      label: "H2",
      action: () =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "H3",
      action: () =>
        editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: "B",
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "I",
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Quote",
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "List",
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Code",
      action: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      label: "Link",
      action: () => {
        const url = window.prompt("URL");

        if (url) {
          editor.chain().focus().setLink({ href: url }).run();
        }
      },
    },
    {
      label: "Image",
      action: () => {
        const url = window.prompt(
          "Image URL (upload via Media Library first)"
        );

        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      },
    },
  ];

  return (
    <div className="flex flex-wrap gap-1 border-b border-line p-2">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.action}
          className="text-xs px-2.5 py-1.5 rounded hover:bg-black/5 font-medium"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}