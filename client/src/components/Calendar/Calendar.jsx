/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from 'semantic-ui-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import { push } from '../../lib/redux-router';
import Paths from '../../constants/Paths';
import selectors from '../../selectors';
import entryActions from '../../entry-actions';
import TimelineSidebar from './TimelineSidebar';

import styles from './Calendar.module.scss';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar = React.memo(() => {
  const [t] = useTranslation();
  const dispatch = useDispatch();
  const { projectId } = useSelector(selectors.selectPath);
  const cards = useSelector(selectors.selectCardsWithDueDateForCurrentProject) || [];
  const unscheduledCards = useSelector(selectors.selectCardsWithoutDueDateForCurrentProject) || [];

  // Current week start (Sunday)
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const start = new Date(today.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  });

  // Navigate to previous week
  const handlePrevWeek = useCallback(() => {
    setWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  }, []);

  // Navigate to next week
  const handleNextWeek = useCallback(() => {
    setWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  }, []);

  // Navigate to current week
  const handleToday = useCallback(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const start = new Date(today.setDate(diff));
    start.setHours(0, 0, 0, 0);
    setWeekStart(start);
  }, []);

  // Generate days of the week
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  }, [weekStart]);

  // Group cards by day
  const cardsByDay = useMemo(() => {
    const grouped = {};
    weekDays.forEach((day) => {
      const dayKey = day.toDateString();
      grouped[dayKey] = [];
    });

    cards.forEach((card) => {
      const cardDate = new Date(card.dueDate);
      const dayKey = cardDate.toDateString();
      if (grouped[dayKey]) {
        grouped[dayKey].push(card);
      }
    });

    return grouped;
  }, [cards, weekDays]);

  // Check if a day is today
  const isToday = useCallback((date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  // Format month/year for header
  const headerTitle = useMemo(() => {
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    const options = { month: 'long', year: 'numeric' };

    if (firstDay.getMonth() === lastDay.getMonth()) {
      return firstDay.toLocaleDateString(undefined, options);
    }

    const firstMonth = firstDay.toLocaleDateString(undefined, { month: 'short' });
    const lastMonth = lastDay.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    return `${firstMonth} - ${lastMonth}`;
  }, [weekDays]);

  const getCardIdFromDraggableId = useCallback((draggableId) => {
    const match = draggableId.match(/^(?:calendar|agenda|unscheduled)-(.+)$/);
    return match ? match[1] : draggableId;
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    (result) => {
      const { destination, draggableId } = result;
      const cardId = getCardIdFromDraggableId(draggableId);
      console.log('Drag ended:', result);

      // Dropped outside a valid droppable
      if (!destination) {
        console.log('Dropped outside');
        return;
      }

      // Handle drop to unscheduled section - remove due date
      if (destination.droppableId === 'unscheduled-tasks') {
        console.log('Dropping to unscheduled:', cardId);
        dispatch(entryActions.updateCard(cardId, { dueDate: null }));
        return;
      }

      // Parse the droppable ID to get day and hour
      // Format: "cell-{dayIndex}-{hour}"
      const match = destination.droppableId.match(/^cell-(\d+)-(\d+)$/);
      if (!match) {
        console.log('Invalid droppable match:', destination.droppableId);
        return;
      }

      const dayIndex = parseInt(match[1], 10);
      const hour = parseInt(match[2], 10);

      // Calculate the new due date
      const targetDay = weekDays[dayIndex];
      const newDueDate = new Date(targetDay);
      newDueDate.setHours(hour, 0, 0, 0);

      console.log('Updating card due date:', draggableId, newDueDate);

      // Update the card's due date
      dispatch(entryActions.updateCard(cardId, { dueDate: newDueDate.toISOString() }));
    },
    [dispatch, getCardIdFromDraggableId, weekDays],
  );

  // Handle card click to open modal
  // Handle card click to open modal
  const handleCardClick = useCallback(
    (cardId) => (e) => {
      console.log('Card clicked:', cardId);
      e.preventDefault();
      e.stopPropagation();
      if (!projectId) {
        return;
      }

      dispatch(
        push(
          Paths.PROJECT_CALENDAR_CARD.replace(':projectId', projectId).replace(
            ':cardId',
            cardId,
          ),
        ),
      );
    },
    [dispatch, projectId],
  );

  // Debug log
  const pathsMatch = useSelector(selectors.selectPathsMatch);
  const path = useSelector(selectors.selectPath);
  console.log('Router debug:', JSON.stringify({ pathsMatch, path }, null, 2));
  console.log('Calendar render. Cards:', cards.length, 'Unscheduled:', unscheduledCards.length);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={styles.wrapper}>
        <div className={styles.main}>
          {/* Header with navigation */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <h1 className={styles.title}>{headerTitle}</h1>
            </div>
            <div className={styles.headerRight}>
              <Button.Group size="small">
                <Button icon onClick={handlePrevWeek} className={styles.navButton}>
                  <Icon name="chevron left" />
                </Button>
                <Button onClick={handleToday} className={styles.todayButton}>
                  {t('common.today', { defaultValue: 'Today' })}
                </Button>
                <Button icon onClick={handleNextWeek} className={styles.navButton}>
                  <Icon name="chevron right" />
                </Button>
              </Button.Group>
            </div>
          </div>

          {/* Week grid */}
          <div className={styles.weekContainer}>
            {/* Day headers */}
            <div className={styles.dayHeaders}>
              <div className={styles.timeColumn} />
              {weekDays.map((day, index) => (
                <div
                  key={day.toISOString()}
                  className={`${styles.dayHeader} ${isToday(day) ? styles.todayHeader : ''}`}
                >
                  <span className={styles.dayName}>{DAYS_OF_WEEK[index]}</span>
                  <span className={`${styles.dayNumber} ${isToday(day) ? styles.todayNumber : ''}`}>
                    {day.getDate()}
                  </span>
                </div>
              ))}
            </div>

            {/* Scrollable grid area */}
            <div className={styles.gridScroll}>
              <div className={styles.grid}>
                {/* Time column */}
                <div className={styles.timeColumn}>
                  {HOURS.map((hour) => (
                    <div key={hour} className={styles.timeSlot}>
                      <span className={styles.timeLabel}>
                        {hour.toString().padStart(2, '0')}:00
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map((day, dayIndex) => {
                  const dayKey = day.toDateString();
                  const dayCards = cardsByDay[dayKey] || [];

                  return (
                    <div
                      key={day.toISOString()}
                      className={`${styles.dayColumn} ${isToday(day) ? styles.todayColumn : ''}`}
                    >
                      {HOURS.map((hour) => {
                        const droppableId = `cell-${dayIndex}-${hour}`;
                        const cellCards = dayCards.filter((card) => {
                          const cardHour = new Date(card.dueDate).getHours();
                          return cardHour === hour;
                        });

                        return (
                          <Droppable key={droppableId} droppableId={droppableId} type="CARD">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`${styles.hourCell} ${snapshot.isDraggingOver ? styles.hourCellDragOver : ''}`}
                              >
                                {cellCards.map((card, index) => (
                                  <Draggable
                                    key={card.id}
                                    draggableId={`calendar-${card.id}`}
                                    index={index}
                                  >
                                    {(dragProvided, dragSnapshot) => (
                                      <div
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        className={`${styles.calendarEvent} ${dragSnapshot.isDragging ? styles.eventDragging : ''}`}
                                      >
                                        <div
                                          {...dragProvided.dragHandleProps}
                                          className={styles.dragHandle}
                                        >
                                          <Icon name="bars" size="small" />
                                        </div>
                                        <div
                                          className={styles.eventContent}
                                          onClick={handleCardClick(card.id)}
                                        >
                                          <span className={styles.eventName}>{card.name}</span>
                                          <span className={styles.eventTime}>
                                            {new Date(card.dueDate).toLocaleTimeString([], {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline sidebar */}
        <TimelineSidebar cards={cards} unscheduledCards={unscheduledCards} />
      </div>
    </DragDropContext>
  );
});

export default Calendar;
