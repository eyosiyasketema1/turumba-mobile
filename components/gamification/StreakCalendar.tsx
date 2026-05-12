import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tierColor } from '@/services/gamification';

interface StreakCalendarProps {
  /** Array of ISO date strings representing active days */
  activeDays: string[];
  /** Number of weeks to display (default: 12) */
  weeks?: number;
  /** Tier for color theming */
  tier?: string;
}

const DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];
const CELL_SIZE = 14;
const CELL_GAP = 3;

export default function StreakCalendar({
  activeDays,
  weeks = 12,
  tier = 'bronze',
}: StreakCalendarProps) {
  const color = tierColor(tier);

  // Build grid data: last N weeks ending today
  const gridData = useMemo(() => {
    const activeSet = new Set(
      activeDays.map((d) => new Date(d).toISOString().slice(0, 10))
    );

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Find the start: go back (weeks * 7) days, then align to Monday
    const start = new Date(today);
    start.setDate(start.getDate() - weeks * 7);
    // Align to Monday (getDay: 0=Sun, 1=Mon, ...)
    const dayOfWeek = start.getDay();
    const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + offset);

    const columns: { date: string; active: boolean; isToday: boolean; isFuture: boolean }[][] = [];
    const cursor = new Date(start);

    while (cursor <= today || columns.length < weeks) {
      const col: typeof columns[0] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = cursor.toISOString().slice(0, 10);
        col.push({
          date: dateStr,
          active: activeSet.has(dateStr),
          isToday: dateStr === todayStr,
          isFuture: cursor > today,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      columns.push(col);
      if (columns.length >= weeks) break;
    }

    return columns;
  }, [activeDays, weeks]);

  // Month labels along the top
  const monthLabels = useMemo(() => {
    const labels: { text: string; colIndex: number }[] = [];
    let lastMonth = -1;
    gridData.forEach((col, i) => {
      const month = new Date(col[0].date).getMonth();
      if (month !== lastMonth) {
        labels.push({
          text: new Date(col[0].date).toLocaleString('default', { month: 'short' }),
          colIndex: i,
        });
        lastMonth = month;
      }
    });
    return labels;
  }, [gridData]);

  // Stats
  const totalActive = activeDays.length;
  const thisWeekActive = gridData.length > 0
    ? gridData[gridData.length - 1].filter((c) => c.active).length
    : 0;

  return (
    <View style={styles.container}>
      {/* Month labels */}
      <View style={[styles.monthRow, { marginLeft: 20 }]}>
        {monthLabels.map((ml, i) => (
          <Text
            key={i}
            style={[
              styles.monthLabel,
              { left: ml.colIndex * (CELL_SIZE + CELL_GAP) },
            ]}
          >
            {ml.text}
          </Text>
        ))}
      </View>

      <View style={styles.gridContainer}>
        {/* Day labels */}
        <View style={styles.dayLabels}>
          {DAY_LABELS.map((label, i) => (
            <Text key={i} style={[styles.dayLabel, { height: CELL_SIZE, lineHeight: CELL_SIZE }]}>
              {label}
            </Text>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {gridData.map((col, ci) => (
            <View key={ci} style={styles.column}>
              {col.map((cell, ri) => (
                <View
                  key={ri}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: cell.isFuture
                        ? 'transparent'
                        : cell.active
                        ? color
                        : '#F1F5F9',
                      opacity: cell.isFuture ? 0 : cell.active ? 1 : 0.6,
                      borderWidth: cell.isToday ? 1.5 : 0,
                      borderColor: cell.isToday ? color : 'transparent',
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalActive}</Text>
          <Text style={styles.summaryLabel}>active days</Text>
        </View>
        <View style={styles.summaryDot} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{thisWeekActive}</Text>
          <Text style={styles.summaryLabel}>this week</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={styles.legendRow}>
          <Text style={styles.legendLabel}>Less</Text>
          <View style={[styles.legendCell, { backgroundColor: '#F1F5F9' }]} />
          <View style={[styles.legendCell, { backgroundColor: color, opacity: 0.4 }]} />
          <View style={[styles.legendCell, { backgroundColor: color, opacity: 0.7 }]} />
          <View style={[styles.legendCell, { backgroundColor: color }]} />
          <Text style={styles.legendLabel}>More</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  monthRow: {
    flexDirection: 'row',
    position: 'relative',
    height: 16,
    marginBottom: 4,
  },
  monthLabel: {
    position: 'absolute',
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    color: '#94A3B8',
  },
  gridContainer: {
    flexDirection: 'row',
  },
  dayLabels: {
    marginRight: 4,
    gap: CELL_GAP,
  },
  dayLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 9,
    color: '#94A3B8',
    width: 14,
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  column: {
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  summaryValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: '#1E293B',
  },
  summaryLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: '#94A3B8',
  },
  summaryDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 9,
    color: '#94A3B8',
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
