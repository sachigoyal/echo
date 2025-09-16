"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { PaginationParams } from "@/services/lib/pagination"
import { MultiSortParams } from "@/services/lib/sorting"
import { FilterParams } from "@/services/lib/filtering"

// TRPC useQuery hook type - similar to StatefulDataTable
export type TRPCUseQuery<TData> = (params: PaginationParams & MultiSortParams & FilterParams) => {
  data?: TData
  isLoading: boolean
  error?: any
}

// Metric display types
export type MetricDisplayType = 
  | "number" 
  | "currency" 
  | "percentage" 
  | "badge" 
  | "progress" 
  | "trend"

// Individual metric configuration
export interface MetricConfig {
  id: string
  title: string
  description?: string
  displayType: MetricDisplayType
  valueKey: string // Key to extract value from data
  // Optional formatting
  format?: {
    prefix?: string
    suffix?: string
    decimals?: number
    showTrend?: boolean
    trendKey?: string // Key for trend data (e.g., percentage change)
    trendDirection?: "up" | "down" | "neutral"
  }
  // Card styling
  className?: string
  size?: "sm" | "md" | "lg"
}

// Grid layout configuration
export interface GridConfig {
  columns?: 1 | 2 | 3 | 4 | 6
  gap?: "sm" | "md" | "lg"
  responsive?: boolean
}

// Width constraint options
export type WidthConstraint = "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "none" | "content"

interface OverviewPanelProps<TData> {
  metrics: MetricConfig[]
  // TRPC integration - if provided, will manage data fetching automatically
  trpcQuery?: TRPCUseQuery<TData>
  // Static data - if provided, will use this instead of trpcQuery
  data?: TData
  // Loading state for static data
  isLoading?: boolean
  // Error state
  error?: any
  // Layout configuration
  grid?: GridConfig
  // Panel title
  title?: string
  description?: string
  // Width and spacing configuration
  maxWidth?: WidthConstraint
  margin?: boolean
  // Additional styling
  className?: string
}

export function OverviewPanel<TData extends Record<string, any>>({
  metrics,
  trpcQuery,
  data,
  isLoading = false,
  error,
  grid = { columns: 3, gap: "sm", responsive: true },
  title,
  description,
  maxWidth = "content",
  margin = true,
  className,
}: OverviewPanelProps<TData>) {
  // TRPC query parameters (minimal for overview data)
  const queryParams = React.useMemo(() => ({
    page: 0,
    page_size: 1, // Overview typically doesn't need pagination
  }), [])

  // Use TRPC query if provided
  const trpcQueryResult = trpcQuery?.(queryParams)

  // Determine which data to use
  const panelData = trpcQuery ? trpcQueryResult?.data : data
  const panelIsLoading = trpcQuery ? (trpcQueryResult?.isLoading ?? false) : isLoading
  const panelError = trpcQuery ? trpcQueryResult?.error : error

  // Grid class mapping
  const gridClasses = {
    columns: {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
    },
    gap: {
      sm: "gap-3",
      md: "gap-4",
      lg: "gap-6",
    }
  }

  // Width constraint classes
  const widthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
    none: "",
    content: "w-[80%]" // 88% width for content layout
  }

  // Container classes for width and margin
  const containerClassName = cn(
    "w-full",
    maxWidth === "content" ? "w-[90%] mx-auto" : widthClasses[maxWidth],
    margin && maxWidth !== "content" && "mx-auto",
    maxWidth !== "full" && maxWidth !== "none" && maxWidth !== "content" && margin && "px-4"
  )

  const gridClassName = cn(
    "grid",
    grid.responsive ? gridClasses.columns[grid.columns || 3] : `grid-cols-${grid.columns || 3}`,
    gridClasses.gap[grid.gap || "md"]
  )

  if (panelError) {
    return (
      <div className={containerClassName}>
        <Card className={cn("p-6 border-destructive", className)}>
          {(title || description) && (
            <CardHeader className="px-0 pt-0 pb-4">
              {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
          )}
          <CardContent className="px-0 pb-0">
            <div className="text-destructive">
              Error loading metrics: {panelError.message || "Unknown error"}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={containerClassName}>
      <Card className={cn("p-6", className)}>
        {(title || description) && (
          <CardHeader className="px-0 pt-0 pb-4">
            {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        
        <CardContent className="px-0 pb-0">
          <div className={gridClassName}>
            {metrics.map((metric) => (
              <MetricCard
                key={metric.id}
                metric={metric}
                data={panelData}
                isLoading={panelIsLoading}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface MetricCardProps<TData> {
  metric: MetricConfig
  data?: TData
  isLoading: boolean
}

function MetricCard<TData extends Record<string, any>>({
  metric,
  data,
  isLoading,
}: MetricCardProps<TData>) {
  const value = data?.[metric.valueKey]
  const trendValue = metric.format?.trendKey ? data?.[metric.format.trendKey] : undefined

  // Size classes - made more compact
  const sizeClasses = {
    sm: "p-2",
    md: "p-3", 
    lg: "p-4"
  }

  if (isLoading) {
    return (
      <Card className={cn(metric.className)}>
        <CardContent className={cn(sizeClasses[metric.size || "sm"])}>
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-12" />
            {metric.description && <Skeleton className="h-2.5 w-20" />}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(metric.className)}>
      <CardContent className={cn(sizeClasses[metric.size || "sm"])}>
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {metric.title}
            </p>
            {metric.format?.showTrend && trendValue !== undefined && (
              <TrendIndicator
                value={trendValue}
                direction={metric.format.trendDirection}
              />
            )}
          </div>
          
          <div className="flex items-baseline">
            <FormattedValue
              value={value}
              displayType={metric.displayType}
              format={metric.format}
            />
          </div>
          
          {metric.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {metric.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface FormattedValueProps {
  value: any
  displayType: MetricDisplayType
  format?: MetricConfig["format"]
}

function FormattedValue({ value, displayType, format }: FormattedValueProps) {
  const formatNumber = (num: number) => {
    const decimals = format?.decimals ?? (displayType === "currency" ? 2 : 0)
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  const renderValue = () => {
    if (value == null) return "—"

    switch (displayType) {
      case "currency":
        return `$${formatNumber(Number(value))}`
      
      case "percentage":
        return `${formatNumber(Number(value))}%`
      
      case "number":
        return formatNumber(Number(value))
      
      case "badge":
        return (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            {String(value)}
          </span>
        )
      
      case "progress":
        const percentage = Math.min(Math.max(Number(value), 0), 100)
        return (
          <div className="w-full">
            <div className="flex items-center justify-between text-xs">
              <span>{percentage}%</span>
            </div>
            <div className="mt-0.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      
      case "trend":
        return (
          <div className="flex items-center space-x-1">
            <span>{formatNumber(Number(value))}</span>
            {/* Trend visualization could be added here */}
          </div>
        )
      
      default:
        return String(value)
    }
  }

  return (
    <div className="text-xl font-bold">
      {format?.prefix}
      {renderValue()}
      {format?.suffix}
    </div>
  )
}

interface TrendIndicatorProps {
  value: number
  direction?: "up" | "down" | "neutral"
}

function TrendIndicator({ value, direction }: TrendIndicatorProps) {
  const isPositive = value > 0
  const isNegative = value < 0
  const actualDirection = direction || (isPositive ? "up" : isNegative ? "down" : "neutral")

  const colorClasses = {
    up: isPositive ? "text-green-600" : "text-red-600",
    down: isNegative ? "text-green-600" : "text-red-600", 
    neutral: "text-muted-foreground"
  }

  const arrows = {
    up: "↗",
    down: "↘", 
    neutral: "→"
  }

  if (value === 0) return null

  return (
    <div className={cn("flex items-center text-xs font-medium", colorClasses[actualDirection])}>
      <span className="mr-1">{arrows[actualDirection]}</span>
      <span>{Math.abs(value).toFixed(1)}%</span>
    </div>
  )
}
