"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RoleGuard } from "@/components/RoleGuard";
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Calendar as CalendarIcon,
  AlertTriangle,
  Key,
  Wrench,
  FileText,
  ArrowLeft,
  GripVertical,
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
  // Source info for DB persistence
  sourceTable?: string;
  sourceId?: string;
  sourceField?: string;
}

// Events will be fetched from Supabase (tenancies, compliance_records, issues)

const eventConfig: Record<
  EventType,
  { color: string; bgColor: string; icon: React.ElementType; dotColor: string }
> = {
  tenancy_start: {
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    icon: Key,
    dotColor: "bg-green-500",
  },
  tenancy_end: {
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    icon: Key,
    dotColor: "bg-orange-500",
  },
  compliance: {
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    icon: AlertTriangle,
    dotColor: "bg-red-500",
  },
  rent_due: {
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    icon: FileText,
    dotColor: "bg-blue-500",
  },
  maintenance: {
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    icon: Wrench,
    dotColor: "bg-purple-500",
  },
};

// Draggable Event Component
function DraggableEvent({
  event,
  isOverlay = false,
}: {
  event: CalendarEvent;
  isOverlay?: boolean;
}) {
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
            {event.property && <p className="text-xs text-slate-500">{event.property}</p>}
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
  onSelect,
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

  const hasUrgent = events.some((e) => e.urgent);

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
        <span className={`text-sm font-medium ${isSelected ? "text-white" : ""}`}>{day}</span>
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
  const { userId } = useRole();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCalendarEvents() {
      const supabase = createClient();
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const calendarEvents: CalendarEvent[] = [];

        // Fetch tenancies for start/end dates
        const { data: tenancies } = await supabase
          .from("tenancies")
          .select(
            `
            id, start_date, end_date, status,
            properties!inner(address_line_1, city, landlord_id)
          `,
          )
          .eq("properties.landlord_id", user.id);

        if (tenancies) {
          tenancies.forEach((t: any) => {
            const address = [t.properties?.address_line_1, t.properties?.city]
              .filter(Boolean)
              .join(", ");
            if (t.start_date) {
              calendarEvents.push({
                id: `tenancy-start-${t.id}`,
                date: new Date(t.start_date),
                title: "Tenancy starts",
                type: "tenancy_start",
                property: address,
              });
            }
            if (t.end_date) {
              calendarEvents.push({
                id: `tenancy-end-${t.id}`,
                date: new Date(t.end_date),
                title: "Tenancy ends",
                type: "tenancy_end",
                property: address,
              });
            }
          });
        }

        // Fetch compliance records for expiry dates
        const { data: compliance } = await supabase
          .from("compliance_records")
          .select(
            `
            id, expiry_date, compliance_type, type,
            properties!inner(address_line_1, city, landlord_id)
          `,
          )
          .eq("properties.landlord_id", user.id);

        if (compliance) {
          const now = new Date();
          const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          compliance.forEach((c: any) => {
            if (c.expiry_date) {
              const expiryDate = new Date(c.expiry_date);
              const address = [c.properties?.address_line_1, c.properties?.city]
                .filter(Boolean)
                .join(", ");
              const typeName = c.compliance_type || c.type || "Certificate";
              calendarEvents.push({
                id: `compliance-${c.id}`,
                date: expiryDate,
                title: `${typeName} expires`,
                type: "compliance",
                property: address,
                urgent: expiryDate <= thirtyDaysFromNow,
              });
            }
          });
        }

        // Fetch open issues as maintenance events
        const { data: issues } = await supabase
          .from("issues")
          .select(
            `
            id, title, created_at,
            properties!inner(address_line_1, city, landlord_id)
          `,
          )
          .eq("properties.landlord_id", user.id)
          .in("status", ["open", "in_progress", "reported", "acknowledged"]);

        if (issues) {
          issues.forEach((issue: any) => {
            const address = [issue.properties?.address_line_1, issue.properties?.city]
              .filter(Boolean)
              .join(", ");
            calendarEvents.push({
              id: `issue-${issue.id}`,
              date: new Date(issue.created_at),
              title: issue.title || "Maintenance issue",
              type: "maintenance",
              property: address,
            });
          });
        }

        setEvents(calendarEvents);
      } catch (err) {
        console.error("Error fetching calendar events:", err);
        toast.error("Failed to load calendar events");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCalendarEvents();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch events from real data
  useEffect(() => {
    if (!userId) return;

    async function fetchCalendarEvents() {
      const supabase = createClient();
      const calEvents: CalendarEvent[] = [];

      try {
        // 1. Tenancy start/end dates
        const { data: tenancies } = await supabase
          .from("tenancies")
          .select(
            `
            id, start_date, end_date, status, rent_amount,
            properties (
              id, address_line_1, city, landlord_id
            )
          `,
          )
          .order("start_date", { ascending: true });

        if (tenancies) {
          tenancies
            .filter((t: any) => t.properties?.landlord_id === userId)
            .forEach((t: any) => {
              const prop = t.properties;
              const propName = prop
                ? [prop.address_line_1, prop.city].filter(Boolean).join(", ")
                : "Unknown";

              if (t.start_date) {
                calEvents.push({
                  id: `tenancy-start-${t.id}`,
                  date: new Date(t.start_date),
                  title: "Tenancy starts",
                  type: "tenancy_start",
                  property: propName,
                  sourceTable: "tenancies",
                  sourceId: t.id,
                  sourceField: "start_date",
                });
              }

              if (t.end_date) {
                const endDate = new Date(t.end_date);
                const now = new Date();
                const daysUntil = Math.ceil(
                  (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                );

                calEvents.push({
                  id: `tenancy-end-${t.id}`,
                  date: endDate,
                  title: "Tenancy ends",
                  type: "tenancy_end",
                  property: propName,
                  urgent: daysUntil <= 30 && daysUntil > 0,
                  sourceTable: "tenancies",
                  sourceId: t.id,
                  sourceField: "end_date",
                });
              }

              // Generate monthly rent due events for active tenancies
              if (t.status === "active" && t.start_date) {
                const start = new Date(t.start_date);
                const end = t.end_date
                  ? new Date(t.end_date)
                  : new Date(new Date().getFullYear(), 11, 31);
                const rentDay = start.getDate();

                // Generate for a window: 3 months back to 6 months forward
                const windowStart = new Date();
                windowStart.setMonth(windowStart.getMonth() - 3);
                const windowEnd = new Date();
                windowEnd.setMonth(windowEnd.getMonth() + 6);

                const current = new Date(Math.max(start.getTime(), windowStart.getTime()));
                current.setDate(rentDay);
                if (current < windowStart) current.setMonth(current.getMonth() + 1);

                while (current <= end && current <= windowEnd) {
                  calEvents.push({
                    id: `rent-${t.id}-${current.getFullYear()}-${current.getMonth()}`,
                    date: new Date(current),
                    title: `Rent due (£${t.rent_amount || 0})`,
                    type: "rent_due",
                    property: propName,
                  });
                  current.setMonth(current.getMonth() + 1);
                }
              }
            });
        }

        // 2. Compliance record expiry dates
        const { data: compliance } = await supabase
          .from("compliance_records")
          .select(
            `
            id, compliance_type, type, expiry_date, status,
            properties (
              id, address_line_1, city, landlord_id
            )
          `,
          )
          .order("expiry_date", { ascending: true });

        if (compliance) {
          const complianceLabels: Record<string, string> = {
            gas_safety: "Gas Safety Certificate expires",
            eicr: "EICR due",
            epc: "EPC Certificate expires",
            legionella: "Legionella assessment due",
            smoke_co: "Smoke & CO alarm check due",
          };

          compliance
            .filter((c: any) => c.properties?.landlord_id === userId)
            .forEach((c: any) => {
              if (!c.expiry_date) return;
              const prop = c.properties;
              const propName = prop
                ? [prop.address_line_1, prop.city].filter(Boolean).join(", ")
                : "Unknown";
              const compType = c.compliance_type || c.type || "gas_safety";
              const expiry = new Date(c.expiry_date);
              const now = new Date();
              const daysUntil = Math.ceil(
                (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              );

              calEvents.push({
                id: `compliance-${c.id}`,
                date: expiry,
                title: complianceLabels[compType] || `${compType} expires`,
                type: "compliance",
                property: propName,
                urgent: daysUntil <= 30,
                sourceTable: "compliance_records",
                sourceId: c.id,
                sourceField: "expiry_date",
              });
            });
        }

        // 3. Open/in-progress issues as maintenance events
        const { data: issues } = await supabase
          .from("issues")
          .select(
            `
            id, title, status, priority, created_at, scheduled_date, due_date,
            properties (
              id, address_line_1, city, landlord_id
            )
          `,
          )
          .in("status", ["open", "in_progress"])
          .order("created_at", { ascending: false });

        if (issues) {
          issues
            .filter((i: any) => i.properties?.landlord_id === userId)
            .forEach((i: any) => {
              const prop = i.properties;
              const propName = prop
                ? [prop.address_line_1, prop.city].filter(Boolean).join(", ")
                : "Unknown";
              // Use scheduled_date or due_date if available, otherwise created_at
              const eventDate = i.scheduled_date || i.due_date || i.created_at;
              if (!eventDate) return;

              calEvents.push({
                id: `issue-${i.id}`,
                date: new Date(eventDate),
                title: i.title || "Maintenance issue",
                type: "maintenance",
                property: propName,
                urgent: i.priority === "urgent" || i.priority === "high",
                sourceTable: "issues",
                sourceId: i.id,
                sourceField: i.scheduled_date
                  ? "scheduled_date"
                  : i.due_date
                    ? "due_date"
                    : "created_at",
              });
            });
        }

        setEvents(calEvents);
      } catch (err) {
        console.error("Error fetching calendar events:", err);
        toast.error("Failed to load calendar events");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCalendarEvents();
  }, [userId]);

  // Configure drag sensor with activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
  );

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
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
  const getEventsForDay = useCallback(
    (day: number, m: number = month, y: number = year): CalendarEvent[] => {
      return events.filter((event) => {
        const eventDate = new Date(event.date);
        return (
          eventDate.getDate() === day && eventDate.getMonth() === m && eventDate.getFullYear() === y
        );
      });
    },
    [events, month, year],
  );

  // Get events for selected date
  const selectedDateEvents = selectedDate
    ? events.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === selectedDate.toDateString();
      })
    : [];

  // Get upcoming events (next 30 days)
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingEvents = events
    .filter((event) => event.date >= today && event.date <= thirtyDaysFromNow)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Check if a day is today
  const isToday = (day: number): boolean => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  // Check if a day is selected
  const isSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const draggedEvent = events.find((e) => e.id === event.active.id);
    if (draggedEvent) {
      setActiveEvent(draggedEvent);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEvent(null);

    if (!over) return;

    const eventId = active.id as string;
    const dropData = over.data.current as { day: number; month: number; year: number } | undefined;

    if (!dropData) return;

    const { day, month: dropMonth, year: dropYear } = dropData;
    const newDate = new Date(dropYear, dropMonth, day);

    // Find the event
    const draggedEvent = events.find((e) => e.id === eventId);
    if (!draggedEvent) return;

    // Don't allow rescheduling rent_due events (they're auto-derived)
    if (draggedEvent.type === "rent_due") {
      toast.error("Rent due dates are automatically generated from tenancy start dates");
      return;
    }

    // Update local state immediately
    setEvents((prevEvents) =>
      prevEvents.map((e) => {
        if (e.id === eventId) {
          return { ...e, date: newDate };
        }
        return e;
      }),
    );

    toast.success(
      `Rescheduled "${draggedEvent.title}" to ${newDate.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })}`,
    );

    // Persist to database if source info is available
    if (draggedEvent.sourceTable && draggedEvent.sourceId && draggedEvent.sourceField) {
      const supabase = createClient();
      try {
        const { error } = await supabase
          .from(draggedEvent.sourceTable)
          .update({ [draggedEvent.sourceField]: newDate.toISOString().split("T")[0] })
          .eq("id", draggedEvent.sourceId);

        if (error) {
          console.error("Error persisting date change:", error);
          toast.error("Failed to save date change to database");
          // Revert on failure
          setEvents((prevEvents) =>
            prevEvents.map((e) => {
              if (e.id === eventId) {
                return { ...e, date: draggedEvent.date };
              }
              return e;
            }),
          );
        }
      } catch (err) {
        console.error("Error persisting date change:", err);
        toast.error("Failed to save date change to database");
        // Revert on failure
        setEvents((prevEvents) =>
          prevEvents.map((e) => {
            if (e.id === eventId) {
              return { ...e, date: draggedEvent.date };
            }
            return e;
          }),
        );
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4 py-8 space-y-4">
          <div className="h-12 w-48 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-96 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

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

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                    {dayNames.map((day) => (
                      <div
                        key={day}
                        className="text-center text-sm font-medium text-slate-500 py-2"
                      >
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
                            month: "long",
                          })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedDateEvents.length === 0 ? (
                          <p className="text-slate-500 text-sm">No events on this day</p>
                        ) : (
                          <div className="space-y-3">
                            {selectedDateEvents.map((event) => (
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
                      {upcomingEvents.map((event) => {
                        const config = eventConfig[event.type];
                        const Icon = config.icon;
                        const daysUntil = Math.ceil(
                          (event.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
                        );

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
                            <div
                              className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}
                            >
                              <Icon className={`w-4 h-4 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                {event.title}
                              </p>
                              <p className="text-xs text-slate-500">
                                {daysUntil === 0
                                  ? "Today"
                                  : daysUntil === 1
                                    ? "Tomorrow"
                                    : `In ${daysUntil} days`}
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
        <DragOverlay>{activeEvent && <DraggableEvent event={activeEvent} isOverlay />}</DragOverlay>
      </DndContext>
    </div>
  );
}
