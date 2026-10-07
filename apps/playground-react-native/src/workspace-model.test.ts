import { describe, expect, test } from 'vitest'

import { filterWorkspaceRecords, updateWorkspaceRecord, workspaceRecords } from './workspace-model'

describe('workspace workflow', () => {
  test('searches the complete collection and preserves source order', () => {
    expect(filterWorkspaceRecords(workspaceRecords, ' lumen 200 ')).toEqual([workspaceRecords[199]])
    expect(filterWorkspaceRecords(workspaceRecords, 'missing')).toEqual([])
    expect(filterWorkspaceRecords(workspaceRecords, '')).toHaveLength(200)
  })

  test('saves only the selected record without modifying the original collection', () => {
    const updated = { id: '1', name: 'Updated', note: 'Saved note' }
    const result = updateWorkspaceRecord(workspaceRecords, updated)

    expect(result[0]).toEqual(updated)
    expect(result[1]).toBe(workspaceRecords[1])
    expect(workspaceRecords[0]?.name).toBe('Lumen 001')
    expect(updateWorkspaceRecord(workspaceRecords, { ...updated, id: 'missing' })).toEqual(workspaceRecords)
  })
})
