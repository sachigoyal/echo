"use client"

import { OverviewPanel, MetricConfig } from "@/components/overview-panel/OverviewPanel"
import { api } from "@/trpc/client"
import { UserSummaryData } from "@/services/admin/v2/user/user-summary"

interface UserAppsOverviewProps {
  userId: string
}

export function UserAppsOverview({ userId }: UserAppsOverviewProps) {
  // Define metrics configuration for the overview panel
  const metrics: MetricConfig[] = [
    // Earnings metrics
    {
      id: "totalRevenue",
      title: "Total Revenue",
      description: "Total revenue generated across all apps",
      displayType: "currency",
      valueKey: "totalRevenue",
      size: "md"
    },
    {
      id: "totalAppProfit",
      title: "App Profit",
      description: "Profit from app usage",
      displayType: "currency", 
      valueKey: "totalAppProfit",
      size: "md"
    },
    {
      id: "totalMarkupProfit",
      title: "Markup Profit",
      description: "Profit from markup fees",
      displayType: "currency",
      valueKey: "totalMarkupProfit", 
      size: "md"
    },
    // Spending metrics
    {
      id: "balance",
      title: "Account Balance",
      description: "Current account balance",
      displayType: "currency",
      valueKey: "balance",
      size: "md",
      className: "border-blue-200"
    },
    {
      id: "totalSpent",
      title: "Total Spent",
      description: "Total amount spent",
      displayType: "currency",
      valueKey: "totalSpent",
      size: "md"
    },
    {
      id: "freeTierUsage",
      title: "Free Tier Usage",
      description: "Amount used from free tier",
      displayType: "currency",
      valueKey: "freeTierUsage",
      size: "md"
    },
    {
      id: "totalCompletedPayouts",
      title: "Completed Payouts",
      description: "Total payouts received",
      displayType: "currency",
      valueKey: "totalCompletedPayouts",
      size: "md",
      className: "border-green-200"
    },
    
    // App statistics
    {
      id: "totalApps",
      title: "Total Apps",
      description: "Number of apps owned",
      displayType: "number",
      valueKey: "totalApps",
      size: "sm"
    },
    {
      id: "totalUsers",
      title: "Total Users",
      description: "Users across all apps",
      displayType: "number",
      valueKey: "totalUsers",
      size: "sm"
    },
    {
      id: "totalTransactions",
      title: "Total Transactions",
      description: "Transactions across all apps",
      displayType: "number",
      valueKey: "totalTransactions",
      size: "sm"
    },
    {
      id: "totalTokens",
      title: "Total Tokens",
      description: "Tokens processed across all apps",
      displayType: "number",
      valueKey: "totalTokens",
      size: "sm",
      format: {
        suffix: " tokens"
      }
    },
    {
      id: "referredUsersCount",
      title: "Referred Users",
      description: "Users referred by this user",
      displayType: "number",
      valueKey: "referredUsersCount",
      size: "sm"
    }
  ]

  // Create TRPC query function that matches the expected signature
  const trpcQuery = () => {
    return api.admin.earnings.getUserSummary.useQuery({ userId })
  }

  return (
    <OverviewPanel<UserSummaryData>
      title="User Overview"
      description="Summary statistics for this user's activity and performance"
      metrics={metrics}
      trpcQuery={trpcQuery}
      grid={{
        columns: 6,
        gap: "md",
        responsive: true
      }}
      className="mb-8"
    />
  )
}
