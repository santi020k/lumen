import {
  Command,
  DataTable,
  Pagination,
  Tree,
  TreeGrid,
  VirtualList
} from '@santi020k/lumen-react'

import type { CSSProperties } from 'react'

const virtualListStyle = { '--ui-list-height': '12rem' } as CSSProperties

export const DataCollectionsRecipe = () => (
  <section className="lumen-recipe lumen-recipe--data-collections">
    <Command>
      <input type="search" placeholder="Filter records" />
      <button data-ui-command-item type="button">Open docs</button>
    </Command>
    <DataTable>
      <table>
        <thead><tr><th>Name</th><th>Status</th></tr></thead>
        <tbody><tr><td>Docs</td><td>Ready</td></tr></tbody>
      </table>
    </DataTable>
    <Tree aria-label="Files">
      <div role="treeitem" aria-expanded="true">src</div>
      <div role="treeitem">index.ts</div>
    </Tree>
    <TreeGrid aria-label="Project status">
      <div role="row"><span role="gridcell">Docs</span><span role="gridcell">Ready</span></div>
    </TreeGrid>
    <VirtualList data-ui-item-size="44" style={virtualListStyle}>
      <div>Row 1</div>
      <div>Row 2</div>
      <div>Row 3</div>
    </VirtualList>
    <Pagination><a href="?page=1">Previous</a><a href="?page=2">Next</a></Pagination>
  </section>
)
