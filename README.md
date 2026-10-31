# @lp-labs/react-tree-select

Hierarchical leaf selection with search, checked and indeterminate branches. React 18+ peer only; ESM, CommonJS and TypeScript included.

## Installation

```sh
npm install @lp-labs/react-tree-select
```

## Quick Start

```jsx
import { TreeSelect } from '@lp-labs/react-tree-select';
const nodes = [
  {
    id: 'documents',
    label: 'Documents',
    children: [
      { id: 'notes', label: 'Notes' },
      { id: 'reports', label: 'Reports' },
    ],
  },
];
export default function Example() {
  return (
    <TreeSelect
      nodes={nodes}
      defaultExpandedIds={['documents']}
      onChange={(ids) => console.log(ids)}
    />
  );
}
```

## API

Nodes have unique string/number id,label,optional disabled and children. Props: nodes, value/defaultValue (selected leaf IDs), onChange, defaultExpandedIds, label='Select items', disabled, className. Selecting a branch toggles its enabled descendant leaves; disabled branches disable descendants. Partially selected branches show mixed native checkboxes and aria-checked. Search retains matching ancestor paths and forces them open. Arrow/Home/End navigation uses a tree active descendant; Space toggles. Clear removes all selection. getTreeState(nodes,selectedIds) exports checked/indeterminate state and selectable leaf IDs.

## Benefits

| Area                     | Details                                                      |
| ------------------------ | ------------------------------------------------------------ |
| Tree-aware state         | Derive checked and indeterminate state from selected leaves. |
| Search paths             | Show matching entries and their ancestors.                   |
| Predictable resource use | Cap nodes, depth, and query length.                          |

## Customization

| Area      | Details                                                     |
| --------- | ----------------------------------------------------------- |
| Data      | Set node hierarchy, disabled state, and expansion defaults. |
| Selection | Control selected leaf IDs and receive changes.              |
| Search    | Configure label, query, and clear behavior.                 |

## Security And Limits

At most10,000 nodes, depth32, search256 characters. Duplicate/cyclic IDs throw. Tree data and selections remain in memory; this component is not virtualized. Values represent leaves, not branch IDs. Preserve immutable arrays. Parent selection is not server authorization; validate permissions independently. Rendered labels are text. Expansion is locally managed; no async loader, drag/drop, persistence or automatic network lookup is included. Test the final tree with your target screen reader.

## Support

[Donate via PayPal](https://www.paypal.me/LibinPrasanth). Author: [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/).

## License

MIT License. See the packaged [LICENSE](LICENSE) file.
