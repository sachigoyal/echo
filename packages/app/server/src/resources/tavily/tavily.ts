import { Decimal } from "@prisma/client/runtime/library";
import { CREDIT_PRICE, TAVILY_SEARCH_PRICING } from "./prices";
import { TavilySearchInput, TavilySearchOutput, TavilySearchOutputSchema } from "./types";

export const calculateTavilySearchCost = (input: TavilySearchInput): Decimal => {
  const price = TAVILY_SEARCH_PRICING[input.search_depth ?? "basic"];
  return new Decimal(price).mul(CREDIT_PRICE);
}
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
export async function tavilySearch(
  input: TavilySearchInput,
): Promise<TavilySearchOutput> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TAVILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Tavily API request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  return TavilySearchOutputSchema.parse(data);
}

