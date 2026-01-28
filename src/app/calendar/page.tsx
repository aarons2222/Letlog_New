"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ChevronLeft, ChevronRight, Home, Calendar as CalendarIcon,
  AlertTriangle, Key, Wrench, FileText, ArrowLeft, GripVertical
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { toast } from "sonner";

// Types for calendar events
type EventType = "tenancy_start" | "tenancy_end" | "compliance" | "rent_due" | "maintenance";

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  type: EventType;
  property?: string;
  urgent?: boolean;
}

// Mock events - will be replaced with real Supabase data
const initialEvents: CalendarEvent[] = [
  { id: "1", date: new Date(2026, 0, 15), title: "Gas Safety Certificate expires", type: "compliance", property: "15 High St", urgent: true },
  { id: "2", date: new Date(2026, 0, 28), title: "Rent due", type: "rent_due", property: "42 Oak Lane" },
  { id: "3", date: new Date(2026, 1, 1), title: "Tenancy starts", type: "tenancy_start", property: "8 Mill Road" },
  { id: "4", date: new Date(2026, 1, 14), title: "EICR due", type: "compliance", property: "42 Oak Lane" },
  { id: "5", date: new Date(2026, 1, 28), title: "Rent due", type: "rent_due", property: "42 Oak Lane" },
  { id: "6", date: new Date(2026, 2, 15), title: "Boiler service scheduled", type: "maintenance", property: "15 High St" },
  { id: "7", date: new Date(2026, 4, 31), title: "Tenancy ends", type: "tenancy_end", property: "42 Oak Lane" },
  { id: "8", date: new Date(2026, 5, 1), title: "Tenancy renewal", type: "tenancy_start", property: "42 Oak Lane" },
];

const eventConfig: Record<EventType, { color: string; bgColor: string; icon: React.ElementType; dotColor: string }> = {
  tenancy_start: { color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", icon: Key, dotColor: "bg-green-500" },
  tenancy_end: { color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30", icon: Key, dotColor: "bg-orange-500" },
  compliance: { color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", icon: AlertTriangle, dotColor: "bg-red-500" },
  rent_due: { color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", icon: FileText, dotColor: "bg-blue-500" },
  maintenance: { color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30", icon: Wrench, dotColor: "bg-purple-500" },
};

// Draggable Event Component
function DraggableEvent({ event, isOverlay = false }: { event: CalendarEvent; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: event,
  });

  const config = eventConfig[event.type];
  const Icon = config.icon;

  if (isOverlay) {
    return (
      <motion.div
        className={`p-3 rounded-lg ${config.bgColor} shadow-2xl border-2 border-white/50 cursor-grabbing`}
        initial={{ scale: 1.05, rotate: 2 }}
        animate={{ scale: 1.05, rotate: 2 }}
      >
        <div className="flex items-start gap-2">
          <Icon className={`w-4 h-4 ${config.color} mt-0.5`} />
          <div>
            <p className={`font-medium text-sm ${config.color}`}>{event.title}</p>
            {event.property && (
              <p className="text-xs text-slate-500">{event.property}</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`p-3 rounded-lg ${config.bgColor} cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "opacity-50 scale-95" : "hover:shadow-md"
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <Icon className={`w-4 h-4 ${config.color} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm ${config.color}`}>{event.title}</p>
          {event.property && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Home className="w-3 h-3" />
              {event.property}
            </p>
          )}
          {event.urgent && (
            <Badge variant="destructive" className="mt-1 text-xs">
              Urgent
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Droppable Day Cell Component
function DroppableDay({ 
  day, 
  month, 
  year, 
  events, 
  isToday, 
  isSelected, 
  onSelect 
}: { 
  day: number; 
  month: number; 
  year: number;
  events: CalendarEvent[];
  isToday: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const dateId = `${year}-${month}-${day}`;
  const { isOver, setNodeRef } = useDroppable({
    id: dateId,
    data: { day, month, year },
  });

  const hasUrgent = events.some(e => e.urgent);

  return (
    <motion.div
      ref={setNodeRef}
      onClick={onSelect}
      className={`
        aspect-square p-1 rounded-lg transition-all relative cursor-pointer min-h-[80px]
        ${isToday ? "ring-2 ring-blue-500" : ""}
        ${isSelected ? "bg-blue-500" : isOver ? "bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-400 ring-dashed" : "hover:bg-slate-100 dark:hover:bg-slate-800"}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex flex-col h-full">
        <span className={`text-sm font-medium ${isSelected ? "text-white" : ""}`}>
          {day}
        </span>
        {events.length > 0 && (
          <div className="flex gap-0.5 mt-1 flex-wrap">
            {events.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={`w-1.5 h-1.5 rounded-full ${eventConfig[event.type].dotColor}`}
              />
            ))}
            {events.length > 3 && (
              <span className="text-[10px] text-slate-400">+{events.length - 3}</span>
            )}
          </div>
        )}
      </div>
      {hasUrgent && !isSelected && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
      {isOver && (
        <motion.div 
          className="absolute inset-0 bg-blue-500/10 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
    </motion.div>
  );
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Configure drag sensor with activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Get events for a specific day
  const getEventsForDay = useCallback((day: number, m: number = month, y: number = year): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === m && 
             eventDate.getFullYear() === y;
    });
  }, [events, month, year]);

  // Get events for selected date
  const selectedDateEvents = selectedDate 
    ? events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === selectedDate.toDateString();
      })
    : [];

  // Get upcoming events (next 30 days)
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingEvents = events
    .filter(event => event.date >= today && event.date <= thirtyDaysFromNow)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Check if a day is today
  const isToday = (day: number): boolean => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  // Check if a day is selected
  const isSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && 
           month === selectedDate.getMonth() && 
           year === selectedDate.getFullYear();
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const draggedEvent = events.find(e => e.id === event.active.id);
    if (draggedEvent) {
      setActiveEvent(draggedEvent);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEvent(null);

    if (!over) return;

    const eventId = active.id as string;
    const dropData = over.data.current as { day: number; month: number; year: number } | undefined;
    
    if (!dropData) return;

    const { day, month: dropMonth, year: dropYear } = dropData;
    
    // Update the event's date
    setEvents(prevEvents => 
      prevEvents.map(e => {
        if (e.id === eventId) {
          const newDate = new Date(dropYear, dropMonth, day);
          toast.success(`Rescheduled "${e.title}" to ${newDate.toLocaleDateString("en-GB", { 
            weekday: "short", 
            day: "numeric", 
            month: "short" 
          })}`);
          return { ...e, date: newDate };
        }
        return e;
      })
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50"
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">Calendar</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <GripVertical className="w-3 h-3 mr-1" />
              Drag to reschedule
            </Badge>
            <Button onClick={goToToday} variant="outline" size="sm">
              Today
            </Button>
          </div>
        </div>
      </motion.header>

      <DndContext 
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <CardTitle className="text-xl min-w-[200px] text-center">
                        {monthNames[month]} {year}
                      </CardTitle>
                      <Button variant="ghost" size="icon" onClick={nextMonth}>
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map(day => (
                      <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for days before month starts */}
                    {Array.from({ length: adjustedFirstDay }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square p-1 min-h-[80px]" />
                    ))}

                    {/* Actual days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dayEvents = getEventsForDay(day);

                      return (
                        <DroppableDay
                          key={day}
                          day={day}
                          month={month}
                          year={year}
                          events={dayEvents}
                          isToday={isToday(day)}
                          isSelected={isSelected(day)}
                          onSelect={() => setSelectedDate(new Date(year, month, day))}
                        />
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-slate-600 dark:text-slate-400">Tenancy Start</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-slate-600 dark:text-slate-400">Tenancy End</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-slate-600 dark:text-slate-400">Compliance</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-slate-600 dark:text-slate-400">Rent Due</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span className="text-slate-600 dark:text-slate-400">Maintenance</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Selected Date Events */}
              <AnimatePresence mode="wait">
                {selectedDate && (
                  <motion.div
                    key={selectedDate.toISOString()}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                          {selectedDate.toLocaleDateString("en-GB", { 
                            weekday: "long",
                            day: "numeric", 
                            month: "long" 
                          })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedDateEvents.length === 0 ? (
                          <p className="text-slate-500 text-sm">No events on this day</p>
                        ) : (
                          <div className="space-y-3">
                            {selectedDateEvents.map(event => (
                              <DraggableEvent key={event.id} event={event} />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upcoming Events */}
              <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Upcoming (30 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingEvents.length === 0 ? (
                    <p className="text-slate-500 text-sm">No upcoming events</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingEvents.map(event => {
                        const config = eventConfig[event.type];
                        const Icon = config.icon;
                        const daysUntil = Math.ceil((event.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <motion.div
                            key={event.id}
                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                            whileHover={{ x: 4 }}
                            onClick={() => {
                              setCurrentDate(new Date(event.date));
                              setSelectedDate(new Date(event.date));
                            }}
                          >
                            <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                              <Icon className={`w-4 h-4 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                {event.title}
                              </p>
                              <p className="text-xs text-slate-500">
                                {daysUntil === 0 ? "Today" : 
                                 daysUntil === 1 ? "Tomorrow" : 
                                 `In ${daysUntil} days`}
                                {event.property && ` • ${event.property}`}
                              </p>
                            </div>
                            {event.urgent && (
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeEvent && <DraggableEvent event={activeEvent} isOverlay />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
