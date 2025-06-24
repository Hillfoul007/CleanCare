import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  selectedDate?: Date;
  selectedTime?: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Generate time slots from 8 AM to 8 PM (1 hour intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      // Add :00 slot only (1 hour intervals)
      const time24 = `${hour.toString().padStart(2, "0")}:00`;
      const time12 = format(new Date(`2000-01-01T${time24}`), "h:mm a");
      slots.push({ value: time12, label: time12 });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Filter out past time slots if today is selected
  const getAvailableTimeSlots = () => {
    if (!selectedDate) return timeSlots;

    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();

    if (!isToday) return timeSlots;

    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();

    return timeSlots.filter((slot) => {
      const [time, period] = slot.value.split(" ");
      const [hours, minutes] = time.split(":").map(Number);
      let hour24 = hours;

      if (period === "PM" && hours !== 12) {
        hour24 += 12;
      } else if (period === "AM" && hours === 12) {
        hour24 = 0;
      }

      // Calculate minimum bookable time: current time + 1 hour, rounded up to next hour
      let minBookableHour = currentHour + 1;
      if (currentMinute > 5) {
        // If it's past 5 minutes of the hour, need to book at least 2 hours ahead
        minBookableHour = currentHour + 2;
      }

      // Only allow slots that are at least the minimum bookable hour
      return hour24 >= minBookableHour;
    });
  };

  const availableTimeSlots = getAvailableTimeSlots();

  return (
    <div className="space-y-4">
      {/* Date Selection */}
      <div className="space-y-2">
        <Label htmlFor="date">Select Date</Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                onDateChange(date);
                setIsCalendarOpen(false);
              }}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Selection */}
      <div className="space-y-2">
        <Label htmlFor="time">Select Time</Label>
        <Select value={selectedTime} onValueChange={onTimeChange}>
          <SelectTrigger className="w-full">
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Choose a time slot" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {availableTimeSlots.length > 0 ? (
              availableTimeSlots.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.label}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-slots" disabled>
                No available slots for this date
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        {selectedDate && availableTimeSlots.length === 0 && (
          <p className="text-sm text-amber-600">
            No time slots available for today. Please select a future date.
          </p>
        )}

        {!selectedDate && (
          <p className="text-sm text-gray-500">
            Please select a date first to see available time slots.
          </p>
        )}
      </div>

      {/* Selected Summary */}
      {selectedDate && selectedTime && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-1">Selected Schedule</h4>
          <p className="text-sm text-blue-700">
            {format(selectedDate, "EEEE, MMMM do, yyyy")} at {selectedTime}
          </p>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
