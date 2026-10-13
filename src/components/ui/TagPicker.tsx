import { Link } from "react-router-dom";
import type { Tag } from "../../types/domain";

interface TagPickerProps {
  selectedIds: string[];
  tags: Tag[];
  onChange: (selectedIds: string[]) => void;
}

export function TagPicker({ selectedIds, tags, onChange }: TagPickerProps) {
  if (tags.length === 0) {
    return (
      <div className="tag-picker-empty">
        <p>Aún no hay etiquetas.</p>
        <Link to="/library">Crear etiquetas en la biblioteca</Link>
      </div>
    );
  }

  return (
    <fieldset className="tag-picker">
      <legend>Etiquetas</legend>
      <div className="tag-picker-options">
        {tags.map((tag) => {
          const checked = selectedIds.includes(tag.id);
          return (
            <label className={`tag-picker-option${checked ? " is-selected" : ""}`} key={tag.id}>
              <input
                checked={checked}
                onChange={() => onChange(checked
                  ? selectedIds.filter((id) => id !== tag.id)
                  : [...selectedIds, tag.id])}
                type="checkbox"
              />
              <span>{tag.name}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
