'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { subDays } from 'date-fns';

import { ActivityTimeframe } from '@/types/timeframes';

interface FiltersContextType {
  appId: string | undefined;
  setAppId: (appId: string | undefined) => void;
  startDate: Date;
  endDate: Date;
  setDateRange: (startDate: Date, endDate: Date) => void;
  timeframe: ActivityTimeframe;
  setTimeframe: (timeframe: ActivityTimeframe) => void;
}

const FiltersContext = createContext<FiltersContextType>({
  appId: undefined,
  setAppId: () => {},
  startDate: new Date(),
  endDate: new Date(),
  setDateRange: () => {},
  timeframe: ActivityTimeframe.SevenDays,
  setTimeframe: () => {},
});

export const FiltersContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [appId, setAppId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [timeframe, setTimeframe] = useState<ActivityTimeframe>(
    ActivityTimeframe.SevenDays
  );

  useEffect(() => {
    if (timeframe === ActivityTimeframe.Custom) {
      return;
    }
    if (timeframe === ActivityTimeframe.AllTime) {
      setStartDate(new Date(0));
      setEndDate(new Date());
      return;
    }
    setStartDate(subDays(new Date(), timeframe));
    setEndDate(new Date());
  }, [timeframe]);

  const setDateRange = (startDate: Date, endDate: Date) => {
    setStartDate(startDate);
    setEndDate(endDate);
  };

  return (
    <FiltersContext.Provider
      value={{
        appId,
        setAppId,
        startDate,
        endDate,
        setDateRange,
        timeframe,
        setTimeframe,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
};

export const useFiltersContext = () => {
  if (!FiltersContext) {
    throw new Error(
      'useFiltersContext must be used within a FiltersContextProvider'
    );
  }
  return useContext(FiltersContext);
};
