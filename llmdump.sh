#!/bin/bash

# Output file
out="llm/project.txt"

# Clear output file
> "$out"

# Tree structure
echo "=== STRUCTURE ===" >> "$out"
tree -I 'node_modules|.git|dist|build' >> "$out"
echo >> "$out"

# Process files
for ext in html css js; do
  while IFS= read -r -d '' file; do
    echo "=== $file ===" >> "$out"
    cat "$file" >> "$out"
    echo >> "$out"
  done < <(find . -type f -name "*.$ext" ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" -print0)
done

echo "Output written to $out"

