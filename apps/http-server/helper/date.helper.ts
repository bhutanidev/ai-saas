export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export interface DateContext {
  hasDateReference: boolean;
  ranges: DateRange[];
  searchTerms: string[];
}

/**
 * Get the start of week (Monday) for a given date
 */
function getStartOfWeek(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get the end of week (Sunday) for a given date
 */
function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Get the start of month for a given date
 */
function getStartOfMonth(date: Date): Date {
  const start = new Date(date);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get the end of month for a given date
 */
function getEndOfMonth(date: Date): Date {
  const end = new Date(date);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0); // Last day of previous month
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Format date for search (multiple formats for better matching)
 */
function formatDateForSearch(date: Date): string[] {
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' }).toLowerCase();
  const shortMonth = date.toLocaleString('default', { month: 'short' }).toLowerCase();
  const year = date.getFullYear();
  
  return [
    `${day} ${month} ${year}`,     // "27 august 2025"
    `${month} ${day} ${year}`,     // "august 27 2025"  
    `${day} ${shortMonth} ${year}`, // "27 aug 2025"
    `${shortMonth} ${day} ${year}`, // "aug 27 2025"
    `${day}/${date.getMonth() + 1}/${year}`, // "27/8/2025"
    `${date.getMonth() + 1}/${day}/${year}`  // "8/27/2025"
  ];
}

/**
 * Generate all dates in a range and their search terms
 */
function generateDateRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  
  while (current <= end) {
    const searchTerms = formatDateForSearch(current);
    dates.push(...searchTerms);
    current.setDate(current.getDate() + 1);
  }
  
  return [...new Set(dates)]; // Remove duplicates
}

/**
 * Parse date expressions from user query
 */
export function parseDateExpressions(query: string): DateContext {
  const lowerQuery = query.toLowerCase();
  const today = new Date();
  const ranges: DateRange[] = [];
  
  // Single day ranges
  if (lowerQuery.includes('today')) {
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    ranges.push({
      start: todayStart,
      end: todayEnd,
      label: 'today'
    });
  }
  
  if (lowerQuery.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);
    
    ranges.push({
      start: tomorrow,
      end: tomorrowEnd,
      label: 'tomorrow'
    });
  }
  
  if (lowerQuery.includes('yesterday')) {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);
    
    ranges.push({
      start: yesterday,
      end: yesterdayEnd,
      label: 'yesterday'
    });
  }
  
  // Week ranges
  if (lowerQuery.includes('this week')) {
    ranges.push({
      start: getStartOfWeek(today),
      end: getEndOfWeek(today),
      label: 'this week'
    });
  }
  
  if (lowerQuery.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    ranges.push({
      start: getStartOfWeek(nextWeek),
      end: getEndOfWeek(nextWeek),
      label: 'next week'
    });
  }
  
  if (lowerQuery.includes('last week')) {
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    ranges.push({
      start: getStartOfWeek(lastWeek),
      end: getEndOfWeek(lastWeek),
      label: 'last week'
    });
  }
  
  // Month ranges
  if (lowerQuery.includes('this month')) {
    ranges.push({
      start: getStartOfMonth(today),
      end: getEndOfMonth(today),
      label: 'this month'
    });
  }
  
  if (lowerQuery.includes('next month')) {
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    ranges.push({
      start: getStartOfMonth(nextMonth),
      end: getEndOfMonth(nextMonth),
      label: 'next month'
    });
  }
  
  // Generate search terms for all ranges
  const allSearchTerms: string[] = [];
  ranges.forEach(range => {
    const rangeTerms = generateDateRange(range.start, range.end);
    allSearchTerms.push(...rangeTerms);
  });
  
  return {
    hasDateReference: ranges.length > 0,
    ranges,
    searchTerms: [...new Set(allSearchTerms)] // Remove duplicates
  };
}

/**
 * Add date context to search query
 */
export function addDateContextToQuery(originalQuery: string): string {
  const dateContext = parseDateExpressions(originalQuery);
  
  if (!dateContext.hasDateReference) {
    return originalQuery;
  }
  
  // Add the top 10 most relevant date search terms to avoid overwhelming the query
  const limitedSearchTerms = dateContext.searchTerms.slice(0, 10);
  const enhancedQuery = `${originalQuery} ${limitedSearchTerms.join(' ')}`;
  
  console.log(`📅 Date ranges found:`, dateContext.ranges.map(r => r.label));
  console.log(`🔍 Added ${limitedSearchTerms.length} date search terms`);
  
  return enhancedQuery;
}