'use client'

import { BookStatus, STATUS_COLORS, STATUS_LABELS } from '@/types'

interface Props {
  status: BookStatus
  isLibrary?: boolean
}

export default function StatusBadge({ status, isLibrary }: Props) {
  return (
    <div className="flex flex-wrap gap-1">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]}`}>
        {STATUS_LABELS[status]}
      </span>
      {isLibrary && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
          図書館
        </span>
      )}
    </div>
  )
}
