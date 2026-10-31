'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
export interface TreeOption {
  id: string | number;
  label: string;
  disabled?: boolean;
  children?: readonly TreeOption[];
}
export function getTreeState(
  nodes: readonly TreeOption[],
  selectedIds: readonly (string | number)[] = [],
) {
  if (nodes.length > 10000) throw new RangeError('Tree node limit exceeded.');
  const all: {
    node: TreeOption;
    depth: number;
    parent: number;
    disabled: boolean;
    leaves: (string | number)[];
  }[] = [];
  const seen = new Set<string | number>();
  const stack = nodes.map((node) => ({ node, depth: 0, parent: -1, disabled: false })).reverse();
  while (stack.length) {
    const record = stack.pop()!;
    if (
      seen.has(record.node.id) ||
      record.depth > 32 ||
      all.length >= 10000 ||
      !['string', 'number'].includes(typeof record.node.id)
    )
      throw new TypeError('Tree ids must be unique; limits:10000 nodes and32 levels.');
    seen.add(record.node.id);
    const index = all.length;
    const disabled = record.disabled || Boolean(record.node.disabled);
    all.push({ ...record, disabled, leaves: [] });
    const children = record.node.children ?? [];
    if (children.length + all.length + stack.length > 10000)
      throw new RangeError('Tree node limit exceeded.');
    for (let position = children.length - 1; position >= 0; position -= 1)
      stack.push({ node: children[position]!, depth: record.depth + 1, parent: index, disabled });
  }
  for (let index = all.length - 1; index >= 0; index -= 1) {
    const record = all[index]!;
    if (!record.node.children?.length && !record.disabled) record.leaves.push(record.node.id);
    if (record.parent >= 0) all[record.parent]!.leaves.push(...record.leaves);
  }
  const selected = new Set(selectedIds);
  return all.map((record) => ({
    ...record,
    checked: record.leaves.length > 0 && record.leaves.every((id) => selected.has(id)),
    indeterminate:
      record.leaves.some((id) => selected.has(id)) &&
      !record.leaves.every((id) => selected.has(id)),
  }));
}
function MixedCheckbox({
  checked,
  mixed,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  mixed: boolean;
  disabled: boolean;
  label: string;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);
  return (
    <input
      ref={ref}
      type="checkbox"
      tabIndex={-1}
      checked={checked}
      disabled={disabled}
      aria-label={label}
      onChange={onChange}
    />
  );
}
export function TreeSelect({
  nodes = [],
  value: controlled,
  defaultValue = [],
  onChange,
  defaultExpandedIds = [],
  label = 'Select items',
  disabled = false,
  className,
}: {
  nodes?: readonly TreeOption[];
  value?: readonly (string | number)[];
  defaultValue?: readonly (string | number)[];
  onChange?: (ids: (string | number)[]) => void;
  defaultExpandedIds?: readonly (string | number)[];
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [internal, setValue] = useState<readonly (string | number)[]>(defaultValue);
  const value = controlled ?? internal;
  const records = useMemo(() => getTreeState(nodes, value), [nodes, value]);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(new Set(defaultExpandedIds));
  const [active, setActive] = useState<string | number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const included = new Set<number>();
  if (query.trim())
    for (let index = records.length - 1; index >= 0; index -= 1)
      if (
        records[index]!.node.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()) ||
        included.has(index)
      ) {
        included.add(index);
        if (records[index]!.parent >= 0) included.add(records[index]!.parent);
      }
  const visible = new Set<number>();
  const rows = records.filter((record, index) => {
    if (query && !included.has(index)) return false;
    if (
      record.parent >= 0 &&
      (!visible.has(record.parent) || (!query && !expanded.has(records[record.parent]!.node.id)))
    )
      return false;
    visible.add(index);
    return true;
  });
  const selected = new Set(value);
  const current =
    rows.find((record) => record.node.id === active && !record.disabled) ??
    rows.find((record) => !record.disabled);
  const domId = (record: (typeof records)[number]) => `${id}-node-${records.indexOf(record)}`;
  const commit = (next: Set<string | number>) => {
    const ids = records
      .filter(
        (record) => !record.node.children?.length && !record.disabled && next.has(record.node.id),
      )
      .map((record) => record.node.id);
    if (controlled === undefined) setValue(ids);
    onChange?.(ids);
  };
  const toggle = (record: (typeof records)[number]) => {
    if (disabled || record.disabled) return;
    const next = new Set(selected);
    for (const leaf of record.leaves) {
      if (record.checked) next.delete(leaf);
      else next.add(leaf);
    }
    commit(next);
  };
  const expand = (record: (typeof records)[number]) => {
    const next = new Set(expanded);
    if (next.has(record.node.id)) next.delete(record.node.id);
    else next.add(record.node.id);
    setExpanded(next);
  };
  return (
    <div className={className}>
      <label>
        {label}
        <input
          type="search"
          aria-label={`Search ${label}`}
          maxLength={256}
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
      </label>
      <div
        ref={root}
        role="tree"
        aria-label={label}
        aria-multiselectable="true"
        aria-activedescendant={current ? domId(current) : undefined}
        tabIndex={disabled ? -1 : 0}
        style={{ maxHeight: 360, overflow: 'auto' }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || !current || disabled) return;
          const index = rows.indexOf(current);
          if (event.key === ' ') {
            event.preventDefault();
            toggle(current);
            return;
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            if (current.node.children?.length && !expanded.has(current.node.id)) expand(current);
            else if (rows[index + 1]?.parent === records.indexOf(current))
              setActive(rows[index + 1]!.node.id);
            return;
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            if (expanded.has(current.node.id)) expand(current);
            else if (current.parent >= 0) setActive(records[current.parent]!.node.id);
            return;
          }
          if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          let next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? rows.length - 1
                : index + (event.key === 'ArrowDown' ? 1 : -1);
          const step = event.key === 'End' || event.key === 'ArrowUp' ? -1 : 1;
          while (rows[next]?.disabled) next += step;
          if (rows[next]) setActive(rows[next]!.node.id);
        }}
      >
        {rows.map((record) => (
          <div
            key={`${typeof record.node.id}:${record.node.id}`}
            id={domId(record)}
            role="treeitem"
            aria-level={record.depth + 1}
            aria-checked={record.indeterminate ? 'mixed' : record.checked}
            aria-expanded={
              record.node.children?.length
                ? query
                  ? true
                  : expanded.has(record.node.id)
                : undefined
            }
            aria-disabled={disabled || record.disabled || undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              paddingLeft: record.depth * 20,
              minHeight: 32,
              outline: record === current ? '1px solid currentColor' : undefined,
              outlineOffset: -1,
            }}
          >
            {record.node.children?.length ? (
              <button
                type="button"
                tabIndex={-1}
                disabled={disabled || record.disabled}
                aria-label={`Toggle ${record.node.label}`}
                onClick={() => expand(record)}
              >
                {query || expanded.has(record.node.id) ? '-' : '+'}
              </button>
            ) : (
              <span style={{ width: 20 }} />
            )}
            <MixedCheckbox
              checked={record.checked}
              mixed={record.indeterminate}
              disabled={disabled || record.disabled || !record.leaves.length}
              label={`Select ${record.node.label}`}
              onChange={() => toggle(record)}
            />
            <span
              onClick={() => {
                setActive(record.node.id);
                toggle(record);
                root.current?.focus();
              }}
            >
              {record.node.label}
            </span>
          </div>
        ))}
      </div>
      {!rows.length && <p role="status">No items</p>}
      <button type="button" disabled={disabled || !value.length} onClick={() => commit(new Set())}>
        Clear selection
      </button>
    </div>
  );
}
export default TreeSelect;
