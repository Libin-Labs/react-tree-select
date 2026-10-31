import { beforeEach, afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { setup, click } from './helpers.mjs';
import { TreeSelect, getTreeState } from '../dist/index.js';
let ui;
beforeEach(async () => (ui = await setup()));
afterEach(async () => ui.cleanup());
const nodes = [
  {
    id: 'root',
    label: 'Root',
    children: [
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Blocked', disabled: true },
      { id: 'c', label: 'Charlie' },
    ],
  },
];
test('branch state is indeterminate and toggles only enabled leaves', async () => {
  assert.equal(getTreeState(nodes, ['a'])[0].indeterminate, true);
  const values = [];
  await ui.render(createElement(TreeSelect, { nodes, onChange: (ids) => values.push(ids) }));
  await click(ui.container.querySelector('[aria-label="Select Root"]'));
  assert.deepEqual(values[0], ['a', 'c']);
  const checkbox = ui.container.querySelector('[aria-label="Select Root"]');
  assert.equal(checkbox.checked, true);
  assert.equal(checkbox.indeterminate, false);
});
