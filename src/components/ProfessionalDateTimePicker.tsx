import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock } from "lucide-react";
import { format, addDays, isSameDay, isToday, isTomorrow } from "date-fns";
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
  // Generate next 7 days
  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), i);
      dates.push({
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
      });
    }
    return dates;
  };

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    // Morning slots (8 AM - 12 PM)
    const morningSlots = [];
    for (let hour = 8; hour < 12; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        const displayTime = format(
          new Date(`2000-01-01T${timeString}`),
          "h:mm a",
        );

        // Skip past times for today
        const isDisabled =
          selectedDate &&
          isToday(selectedDate) &&
          (hour < currentHour ||
            (hour === currentHour && minutes <= currentMinutes));

        if (!isDisabled) {
          morningSlots.push({
            value: displayTime,
            label: displayTime,
            period: "morning",
          });
        }
      }
    }

    // Afternoon slots (12 PM - 5 PM)
    const afternoonSlots = [];
    for (let hour = 12; hour < 17; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        const displayTime = format(
          new Date(`2000-01-01T${timeString}`),
          "h:mm a",
        );

        const isDisabled =
          selectedDate &&
          isToday(selectedDate) &&
          (hour < currentHour ||
            (hour === currentHour && minutes <= currentMinutes));

        if (!isDisabled) {
          afternoonSlots.push({
            value: displayTime,
            label: displayTime,
            period: "afternoon",
          });
        }
      }
    }

    // Evening slots (5 PM - 9 PM)
    const eveningSlots = [];
    for (let hour = 17; hour < 21; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        const displayTime = format(
          new Date(`2000-01-01T${timeString}`),
          "h:mm a",
        );

        const isDisabled =
          selectedDate &&
          isToday(selectedDate) &&
          (hour < currentHour ||
            (hour === currentHour && minutes <= currentMinutes));

        if (!isDisabled) {
          eveningSlots.push({
            value: displayTime,
            label: displayTime,
            period: "evening",
          });
        }
      }
    }

    return {
      morning: morningSlots,
      afternoon: afternoonSlots,
      evening: eveningSlots,
    };
  };

  const dates = generateDates();
  const timeSlots = generateTimeSlots();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Date Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Select Date
        </Label>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((dateItem) => (
            <Button
              key={dateItem.date.toISOString()}
              variant={
                selectedDate && isSameDay(selectedDate, dateItem.date)
                  ? "default"
                  : "outline"
              }
              onClick={() => onDateChange(dateItem.date)}
              className={cn(
                "flex-shrink-0 h-auto flex flex-col items-center p-3 min-w-[70px] hover:scale-105 transition-transform",
                selectedDate && isSameDay(selectedDate, dateItem.date)
                  ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
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

      {/* Time Selection */}
      {selectedDate && (
        <div className="space-y-4">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Select Time
          </Label>

          {/* Morning Slots */}
          {timeSlots.morning.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Morning</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {timeSlots.morning.map((slot) => (
                  <Button
                    key={slot.value}
                    variant={
                      selectedTime === slot.value ? "default" : "outline"
                    }
                    onClick={() => onTimeChange(slot.value)}
                    className={cn(
                      "h-10 text-sm hover:scale-105 transition-transform",
                      selectedTime === slot.value
                        ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                        : "hover:border-green-300 hover:bg-green-50",
                    )}
                  >
                    {slot.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Afternoon Slots */}
          {timeSlots.afternoon.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Afternoon</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {timeSlots.afternoon.map((slot) => (
                  <Button
                    key={slot.value}
                    variant={
                      selectedTime === slot.value ? "default" : "outline"
                    }
                    onClick={() => onTimeChange(slot.value)}
                    className={cn(
                      "h-10 text-sm hover:scale-105 transition-transform",
                      selectedTime === slot.value
                        ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                        : "hover:border-green-300 hover:bg-green-50",
                    )}
                  >
                    {slot.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Evening Slots */}
          {timeSlots.evening.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Evening</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {timeSlots.evening.map((slot) => (
                  <Button
                    key={slot.value}
                    variant={
                      selectedTime === slot.value ? "default" : "outline"
                    }
                    onClick={() => onTimeChange(slot.value)}
                    className={cn(
                      "h-10 text-sm hover:scale-105 transition-transform",
                      selectedTime === slot.value
                        ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                        : "hover:border-green-300 hover:bg-green-50",
                    )}
                  >
                    {slot.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfessionalDateTimePicker;
