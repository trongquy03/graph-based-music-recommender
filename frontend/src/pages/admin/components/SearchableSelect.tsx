import { useState } from "react";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

// Hàm xóa dấu tiếng Việt
function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const SearchableSelectDialog = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const [query, setQuery] = useState("");

  const filteredOptions = options.filter((opt) =>
    removeDiacritics(opt.label).includes(removeDiacritics(query))
  );

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between bg-zinc-800 border-zinc-700"
        onClick={() => setOpen(true)}
      >
        {selected ? selected.label : placeholder}
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {filteredOptions.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              filteredOptions.map((opt) => (
                <CommandItem
                  key={opt.value}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                  {opt.value === value && (
                    <Check className="ml-auto h-4 w-4 text-emerald-500" />
                  )}
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};

export default SearchableSelectDialog;
