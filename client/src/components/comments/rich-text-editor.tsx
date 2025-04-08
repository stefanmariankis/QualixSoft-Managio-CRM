import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Code from '@tiptap/extension-code';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Highlight from '@tiptap/extension-highlight';
import Heading from '@tiptap/extension-heading';
import CharacterCount from '@tiptap/extension-character-count';
import TextStyle from '@tiptap/extension-text-style';
import { 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  Underline as UnderlineIcon, 
  Link as LinkIcon, 
  Code as CodeIcon, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Highlighter
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Scrie un comentariu...',
  minHeight = '120px',
  maxHeight = '300px',
  className = '',
}: RichTextEditorProps) {
  // Inițializează editorul
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        heading: false,
      }),
      Bold,
      Italic,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Code,
      BulletList,
      OrderedList,
      ListItem,
      TextStyle,
      Highlight,
      Heading.configure({
        levels: [1, 2],
      }),
      CharacterCount.configure({
        limit: 2000,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `focus:outline-none prose prose-sm max-w-none ${minHeight ? `min-h-[${minHeight}]` : ''} overflow-y-auto bg-white p-3 rounded-md`,
        placeholder: placeholder,
      },
    },
  });

  // Actualizează conținutul editorului când se schimbă props content
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previousUrl);

    // Anulează dacă dialogul este anulat
    if (url === null) {
      return;
    }

    // Elimină link-ul dacă URL este gol
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // Adaugă protocol dacă nu există
    const fullUrl = url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`;

    // Actualizează link-ul
    editor.chain().focus().extendMarkRange('link').setLink({ href: fullUrl }).run();
  }, [editor]);

  // Funcție de redare a butoanelor de formatare
  const renderFormatButtons = () => {
    if (!editor) return null;

    return (
      <div className="flex items-center border-b border-gray-200 p-1 space-x-0.5 flex-wrap">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          aria-label="Bold"
        >
          <BoldIcon className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          aria-label="Italic"
        >
          <ItalicIcon className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('underline')}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          title="Subliniat (Ctrl+U)"
          aria-label="Subliniat"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('highlight')}
          onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
          title="Evidențiere"
          aria-label="Evidențiere"
        >
          <Highlighter className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('code')}
          onPressedChange={() => editor.chain().focus().toggleCode().run()}
          title="Cod"
          aria-label="Cod"
        >
          <CodeIcon className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Titlu 1"
          aria-label="Titlu 1"
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Titlu 2"
          aria-label="Titlu 2"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          title="Listă neordonată"
          aria-label="Listă neordonată"
        >
          <List className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          title="Listă ordonată"
          aria-label="Listă ordonată"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <Popover>
          <PopoverTrigger asChild>
            <Toggle
              size="sm"
              pressed={editor.isActive('link')}
              title="Link"
              aria-label="Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3">
            <div className="flex flex-col space-y-2">
              <label htmlFor="link-url" className="text-sm">URL:</label>
              <div className="flex gap-2">
                <Input 
                  id="link-url" 
                  placeholder="https://example.com" 
                  defaultValue={editor.getAttributes('link').href || ''} 
                />
                <Button 
                  size="sm"
                  onClick={() => {
                    const url = (document.getElementById('link-url') as HTMLInputElement).value;
                    if (!url) {
                      editor.chain().focus().extendMarkRange('link').unsetLink().run();
                    } else {
                      const fullUrl = url.startsWith('http://') || url.startsWith('https://') 
                        ? url 
                        : `https://${url}`;
                      editor.chain().focus().extendMarkRange('link').setLink({ href: fullUrl }).run();
                    }
                  }}
                >
                  Aplică
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const renderCharacterCount = () => {
    if (!editor) return null;

    const limit = editor.storage.characterCount.limit;
    const characters = editor.storage.characterCount.characters();
    
    return (
      <div className="text-xs text-gray-500 text-right mt-1">
        {characters}/{limit} caractere
      </div>
    );
  };

  return (
    <div className={`border rounded-md overflow-hidden ${className}`}>
      {renderFormatButtons()}
      <div 
        className="p-3" 
        style={{ 
          minHeight, 
          maxHeight,
          overflowY: 'auto'
        }}
      >
        <EditorContent editor={editor} />
      </div>
      {renderCharacterCount()}
    </div>
  );
}