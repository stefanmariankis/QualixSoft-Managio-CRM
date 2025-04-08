import React, { useState } from 'react';
import EmojiPickerReact, { EmojiStyle, Theme } from 'emoji-picker-react';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

export default function EmojiPicker({ onEmojiSelect, className = '' }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className={`text-gray-500 ${className}`} 
          title="Adaugă emoji"
        >
          <Smile className="h-4 w-4 mr-1" />
          <span>Emoji</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <EmojiPickerReact
          onEmojiClick={(emojiData) => {
            onEmojiSelect(emojiData.emoji);
            setOpen(false);
          }}
          emojiStyle={EmojiStyle.NATIVE}
          theme={Theme.AUTO}
          lazyLoadEmojis={true}
          width={300}
          height={350}
          searchPlaceHolder="Caută emoji..."
        />
      </PopoverContent>
    </Popover>
  );
}