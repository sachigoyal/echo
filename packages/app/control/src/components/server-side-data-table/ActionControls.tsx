'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import type { Table as TanStackTable } from '@tanstack/react-table';
import {
  Settings,
  X,
  Play,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { FilterParams } from '@/services/db/_lib/filtering';
import { toFilterParams } from '@/services/db/_lib/filtering';
import type { MultiSortParams } from '@/services/db/_lib/sorting';
import { toMultiSortParams } from '@/services/db/_lib/sorting';
import type { PaginationParams } from '@/services/db/_lib/pagination';

// Table state interface for passing to actions
export interface TableState {
  sorting: MultiSortParams;
  columnFilters: FilterParams;
  pagination: PaginationParams;
  selectedRowIds: string[];
}

// Action configuration interface
export interface ActionConfig {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
  disabled?: boolean;
  disabledReason?: string;
  action: (tableState: TableState) => Promise<void> | void;
}

// Action group for organizing actions
export interface ActionGroup {
  id: string;
  label: string;
  actions: ActionConfig[];
}

interface ActionControlsProps<TData> {
  table: TanStackTable<TData>;
  actions?: ActionConfig[];
  actionGroups?: ActionGroup[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRowCount?: number;
}

// Action Controls Component
export function ActionControls<TData>({
  table,
  actions = [],
  actionGroups = [],
  isOpen,
  onOpenChange,
  selectedRowCount = 0,
}: ActionControlsProps<TData>) {
  const [isConfirmationOpen, setIsConfirmationOpen] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<ActionConfig | null>(
    null
  );
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [executionResult, setExecutionResult] = React.useState<{
    success: boolean;
    message?: string;
  } | null>(null);

  // Extract current table state
  const getTableState = React.useCallback((): TableState => {
    const state = table.getState();
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedRowIds = selectedRows.map(row => row.id);

    return {
      sorting: toMultiSortParams(state.sorting),
      columnFilters: toFilterParams(state.columnFilters),
      pagination: {
        page: state.pagination.pageIndex,
        page_size: state.pagination.pageSize,
      },
      selectedRowIds,
    };
  }, [table]);

  // Combine individual actions and grouped actions
  const allActions = React.useMemo(() => {
    const individualActions = actions.map(action => ({
      ...action,
      group: null,
    }));
    const groupedActions = actionGroups.flatMap(group =>
      group.actions.map(action => ({ ...action, group: group.label }))
    );
    return [...individualActions, ...groupedActions];
  }, [actions, actionGroups]);

  const handleActionClick = (action: ActionConfig) => {
    if (action.requiresConfirmation) {
      setPendingAction(action);
      setIsConfirmationOpen(true);
    } else {
      void executeAction(action);
    }
  };

  const executeAction = async (action: ActionConfig) => {
    setIsExecuting(true);
    setExecutionResult(null);

    const tableState = getTableState();
    const result = action.action(tableState);
    if (result instanceof Promise) {
      result
        .then(() => {
          setExecutionResult({
            success: true,
            message: `${action.label} completed successfully`,
          });
        })
        .catch(error => {
          setExecutionResult({
            success: false,
            message: `${action.label} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        })
        .finally(() => {
          setIsExecuting(false);
          setTimeout(() => setExecutionResult(null), 3000); // Clear result after 3 seconds
        });
    } else {
      setExecutionResult({
        success: true,
        message: `${action.label} completed`,
      });
      setIsExecuting(false);
      setTimeout(() => setExecutionResult(null), 3000);
    }
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      void executeAction(pendingAction);
      setPendingAction(null);
      setIsConfirmationOpen(false);
    }
  };

  const handleCancelConfirmation = () => {
    setPendingAction(null);
    setIsConfirmationOpen(false);
  };

  // Group actions by their group property
  const groupedActionsList = React.useMemo(() => {
    const groups: Record<string, ActionConfig[]> = {};

    allActions.forEach(action => {
      const groupKey = action.group ?? 'General';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(action);
    });

    return Object.entries(groups);
  }, [allActions]);

  return (
    <>
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
            onClick={() => onOpenChange(false)}
          >
            <div
              className="w-[500px] bg-white rounded-lg shadow-lg border border-slate-200 p-0"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-50 text-green-600">
                      <Settings className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-semibold text-slate-700">
                      Actions
                    </span>
                    {selectedRowCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 border-blue-200"
                      >
                        {selectedRowCount} selected
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {/* Execution Result Alert */}
                {executionResult && (
                  <Alert
                    className={
                      executionResult.success
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }
                  >
                    {executionResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription
                      className={
                        executionResult.success
                          ? 'text-green-700'
                          : 'text-red-700'
                      }
                    >
                      {executionResult.message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Groups */}
                {groupedActionsList.length > 0 ? (
                  <div className="space-y-4">
                    {groupedActionsList.map(([groupName, groupActions]) => (
                      <div key={groupName} className="space-y-2">
                        {groupedActionsList.length > 1 && (
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-slate-600">
                              {groupName}
                            </h4>
                            <div className="flex-1 h-px bg-slate-200" />
                          </div>
                        )}
                        <div className="grid grid-cols-1 gap-2">
                          {groupActions.map(action => {
                            const IconComponent = action.icon ?? Play;
                            const isDisabled = action.disabled ?? isExecuting;

                            return (
                              <div key={action.id} className="relative">
                                <Button
                                  variant={action.variant ?? 'outline'}
                                  size="sm"
                                  onClick={() => handleActionClick(action)}
                                  disabled={isDisabled}
                                  className={`w-full justify-start h-auto p-3 text-left ${
                                    isDisabled
                                      ? 'opacity-50 cursor-not-allowed'
                                      : ''
                                  } ${
                                    action.variant === 'destructive'
                                      ? 'border-red-200 text-red-700 hover:bg-red-50'
                                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-start gap-3 w-full">
                                    <div
                                      className={`p-1 rounded ${
                                        action.variant === 'destructive'
                                          ? 'bg-red-100 text-red-600'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      <IconComponent className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm">
                                        {action.label}
                                      </div>
                                      {action.description && (
                                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                          {action.description}
                                        </div>
                                      )}
                                      {action.disabled &&
                                        action.disabledReason && (
                                          <div className="text-xs text-slate-400 mt-0.5 italic">
                                            {action.disabledReason}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </Button>
                                {isExecuting && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded">
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Info className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">
                      No actions available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Confirmation Modal */}
      <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <DialogContent className="sm:max-w-lg border-slate-200 shadow-xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${
                  pendingAction?.variant === 'destructive'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                <AlertCircle className="h-4 w-4" />
              </div>
              {pendingAction?.confirmationTitle ?? 'Confirm Action'}
            </DialogTitle>
            {(pendingAction?.confirmationMessage ??
              pendingAction?.description) && (
              <DialogDescription className="text-slate-600">
                {pendingAction?.confirmationMessage ??
                  pendingAction?.description}
              </DialogDescription>
            )}
          </DialogHeader>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={handleCancelConfirmation}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-700 transition-colors font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              variant={
                pendingAction?.variant === 'destructive'
                  ? 'destructive'
                  : 'default'
              }
              className={`shadow-sm transition-colors font-medium ${
                pendingAction?.variant === 'destructive'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {pendingAction?.label ?? 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
