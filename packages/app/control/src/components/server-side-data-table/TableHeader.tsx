"use client"

import * as React from "react"
import { Table as TanStackTable } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SortAsc, Filter, MoreHorizontal, Settings } from "lucide-react"
import { ActionControls, ActionConfig, ActionGroup } from "./ActionControls"

interface TableHeaderProps<TData> {
  title: string
  table: TanStackTable<TData>
  onSortClick: () => void
  onFilterClick: () => void
  actions?: ActionConfig[]
  actionGroups?: ActionGroup[]
}

export function TableHeader<TData>({
  title,
  table,
  onSortClick,
  onFilterClick,
  actions = [],
  actionGroups = [],
}: TableHeaderProps<TData>) {
  const sorting = table.getState().sorting
  const columnFilters = table.getState().columnFilters
  const [actionsOpen, setActionsOpen] = React.useState(false)
  
  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length
  const hasActions = actions.length > 0 || actionGroups.length > 0

  return (
    <>
    <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        
        {/* Active filters and sorts indicators */}
        <div className="flex items-center gap-2">
          {sorting.length > 0 && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
              {sorting.length} sort{sorting.length > 1 ? 's' : ''}
            </Badge>
          )}
          {columnFilters.length > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
              {columnFilters.length} filter{columnFilters.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Sort Control Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSortClick}
          className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600 transition-colors"
        >
          <SortAsc className="h-4 w-4" />
        </Button>

        {/* Filter Control Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onFilterClick}
          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
        >
          <Filter className="h-4 w-4" />
        </Button>

        {/* Actions Button */}
        {hasActions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActionsOpen(true)}
            className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 transition-colors"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
    
    {/* Action Controls Modal */}
    {hasActions && (
      <ActionControls
        table={table}
        actions={actions}
        actionGroups={actionGroups}
        isOpen={actionsOpen}
        onOpenChange={setActionsOpen}
        selectedRowCount={selectedRowCount}
      />
    )}
  </>
  )
}
