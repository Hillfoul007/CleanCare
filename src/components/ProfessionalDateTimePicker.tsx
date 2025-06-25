import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  addDays,
  isSameDay,
  isToday,
  isTomorrow,
  startOfWeek,
  addWeeks,
  subWeeks,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import { cn } from "@/lib/utils";

interface ProfessionalDateTimePickerProps {
  selectedDate?: Date;
  selectedTime?: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  className?: string;
}

const ProfessionalDateTimePicker: React.FC<ProfessionalDateTimePickerProps> = ({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  className,
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  ); // Start from Monday
  const [showDropdown, setShowDropdown] = useState(false);

  // Generate dates for current week
  const generateWeekDates = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const dates = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return dates.map((date) => ({
      date,
      label: isToday(date)
        ? "Today"
        : isTomorrow(date)
          ? "Tomorrow"
          : format(date, "EEE"),
      shortDate: format(date, "dd MMM"),
      fullDate: format(date, "dd"),
      month: format(date, "MMM"),
      day: format(date, "EEE"),
      isPast: date < new Date() && !isToday(date),
    }));
  };

  // Generate extended date options for dropdown (next 30 days)
  const generateExtendedDates = () => {
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const date = addDays(new Date(), i);
      dates.push({
        date,
        label: isToday(date)
          ? "Today"
          : isTomorrow(date)
            ? "Tomorrow"
            : format(date, "EEE, MMM dd"),
        value: date.toISOString(),
        isPast: false,
      });
    }
    return dates;
  };

  const goToPreviousWeek = () => {
    const newWeekStart = subWeeks(currentWeekStart, 1);
    // Don't go to past weeks
    if (newWeekStart >= startOfWeek(new Date(), { weekStartsOn: 1 })) {
      setCurrentWeekStart(newWeekStart);
    }
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Generate time slots with 1-hour intervals
  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const currentHour = now.getHours();

    // Generate slots from 8 AM to 9 PM (1-hour intervals)
    for (let hour = 8; hour <= 21; hour++) {
      const timeString = `${hour.toString().padStart(2, "0")}:00`;
      const displayTime = format(
        new Date(`2000-01-01T${timeString}`),
        "h:mm a",
      );

      // Skip past times for today
      const isDisabled =
        selectedDate && isToday(selectedDate) && hour <= currentHour;

      if (!isDisabled) {
        let period = "Morning";
        if (hour >= 12 && hour < 17) period = "Afternoon";
        if (hour >= 17) period = "Evening";

        slots.push({
          value: displayTime,
          label: displayTime,
          period,
          groupLabel: `${displayTime} (${period})`,
        });
      }
    }

    return slots;
  };

  const weekDates = generateWeekDates(currentWeekStart);
  const extendedDates = generateExtendedDates();
  const timeSlots = generateTimeSlots();
  const canGoPrevious =
    currentWeekStart > startOfWeek(new Date(), { weekStartsOn: 1 });

  return (
    <div className={cn("space-y-6", className)}>
      {/* Date Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Select Date
          </Label>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToCurrentWeek}
              className="text-xs px-2 py-1 h-auto"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-xs px-2 py-1 h-auto"
            >
              All Dates
            </Button>
          </div>
        </div>

        {/* Dropdown for extended date selection */}
        {showDropdown && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Choose from next 30 days:
            </Label>
            <Select
              value={selectedDate?.toISOString() || ""}
              onValueChange={(value) => {
                if (value) {
                  onDateChange(new Date(value));
                  setShowDropdown(false);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose any date" />
              </SelectTrigger>
              <SelectContent>
                {extendedDates.map((dateItem) => (
                  <SelectItem key={dateItem.value} value={dateItem.value}>
                    {dateItem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Week navigation */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousWeek}
            disabled={!canGoPrevious}
            className="p-2 h-auto"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium">
            {format(currentWeekStart, "MMM dd")} -{" "}
            {format(
              endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
              "MMM dd, yyyy",
            )}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextWeek}
            className="p-2 h-auto"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Week dates */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weekDates.map((dateItem) => (
            <Button
              key={dateItem.date.toISOString()}
              variant={
                selectedDate && isSameDay(selectedDate, dateItem.date)
                  ? "default"
                  : "outline"
              }
              onClick={() => onDateChange(dateItem.date)}
              disabled={dateItem.isPast}
              className={cn(
                "flex-shrink-0 h-auto flex flex-col items-center p-3 min-w-[70px] hover:scale-105 transition-transform",
                selectedDate && isSameDay(selectedDate, dateItem.date)
                  ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                  : dateItem.isPast
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-green-300 hover:bg-green-50",
              )}
            >
              <span className="text-xs font-medium">{dateItem.day}</span>
              <span className="text-lg font-bold">{dateItem.fullDate}</span>
              <span className="text-xs">{dateItem.month}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Time Selection Dropdown */}
      {selectedDate && (
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Select Time
          </Label>
          <Select value={selectedTime} onValueChange={onTimeChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose pickup time" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.groupLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default ProfessionalDateTimePicker;
