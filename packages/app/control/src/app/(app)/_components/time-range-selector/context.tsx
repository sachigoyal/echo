'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { subDays } from 'date-fns';

import { ActivityTimeframe } from '@/types/timeframes';

interface ActivityContextType {
  startDate: Date;
  endDate: Date | undefined;
  timeframe: ActivityTimeframe;
  setTimeframe: (timeframe: ActivityTimeframe) => void;
  setDateRange: (startDate: Date, endDate: Date) => void;
  isCumulative: boolean;
  setIsCumulative: (isCumulative: boolean) => void;
}

const ActivityContext = createContext<ActivityContextType>({
  startDate: new Date(),
  endDate: new Date(),
  timeframe: ActivityTimeframe.SevenDays,
  setTimeframe: () => {
    void 0;
  },
  setDateRange: () => {
    void 0;
  },
  isCumulative: false,
  setIsCumulative: () => {
    void 0;
  },
});

interface Props {
  children: React.ReactNode;
  initialEndDate?: Date;
  creationDate: Date;
}

export const ActivityContextProvider = ({
  children,
  initialEndDate,
  creationDate,
}: Props) => {
  const [timeframe, setTimeframe] = useState<ActivityTimeframe>(
    ActivityTimeframe.AllTime
  );
  const [endDate, setEndDate] = useState<Date | undefined>(initialEndDate);
  const [startDate, setStartDate] = useState<Date>(creationDate);
  const [isCumulative, setIsCumulative] = useState<boolean>(false);

  useEffect(() => {
    if (timeframe === ActivityTimeframe.Custom) {
      return;
    }
    if (timeframe === ActivityTimeframe.AllTime) {
      setStartDate(creationDate);
      return;
    }
    setStartDate(subDays(new Date(), timeframe));
    setEndDate(new Date());
  }, [timeframe, creationDate]);

  const setDateRange = (startDate: Date, endDate: Date) => {
    setStartDate(startDate);
    setEndDate(endDate);
  };

  return (
    <ActivityContext.Provider
      value={{
        startDate,
        endDate,
        timeframe,
        setTimeframe,
        setDateRange,
        isCumulative,
        setIsCumulative,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivityContext = () => {
  return useContext(ActivityContext);
};
