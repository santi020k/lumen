export interface WorkspaceRecord {
  id: string
  name: string
  note: string
}

export const workspaceRecords: WorkspaceRecord[] = Array.from({ length: 200 }, (_, index) => ({
  id: String(index + 1),
  name: `Lumen ${String(index + 1).padStart(3, '0')}`,
  note: ''
}))

export const filterWorkspaceRecords = (records: readonly WorkspaceRecord[], query: string): WorkspaceRecord[] => {
  const normalized = query.trim().toLocaleLowerCase()

  return records.filter(record => record.name.toLocaleLowerCase().includes(normalized))
}

export const updateWorkspaceRecord = (
  records: readonly WorkspaceRecord[],
  updated: WorkspaceRecord
): WorkspaceRecord[] => (
  records.map(record => record.id === updated.id ? updated : record)
)
