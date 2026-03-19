import { useState, useEffect } from "react";
import { ChevronRight, User, Loader2 } from "lucide-react";
import { fetchStaff, type Staff, type Course } from "@/lib/booking-api";

interface StaffSelectProps {
  shopId: number;
  course: Course;
  onSelect: (staff: Staff | null) => void;
}

export function StaffSelect({ shopId, course, onSelect }: StaffSelectProps) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff(shopId).then((s) => {
      setStaffList(s);
      setLoading(false);
    });
  }, [shopId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const availableStaff = staffList.filter((s) => course.staffIds.includes(s.id));

  return (
    <div className="flex flex-col" data-testid="booking-staff-select">
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="text-xs text-muted-foreground">選択中のコース</div>
        <div className="mt-0.5 text-sm font-bold text-foreground">{course.name}</div>
      </div>

      <div className="bg-muted px-4 py-2.5">
        <h2 className="text-sm font-bold text-foreground">担当スタッフを選択</h2>
      </div>

      <button
        onClick={() => onSelect(null)}
        className="flex items-center gap-3 border-b border-border bg-card px-4 py-4 text-left transition-colors hover:bg-muted/50 active:bg-muted"
        data-testid="staff-no-preference"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">指名なし</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">空いているスタッフが担当します</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      <div className="flex flex-col divide-y divide-border">
        {availableStaff.map((staff) => (
          <button
            key={staff.id}
            onClick={() => onSelect(staff)}
            className="flex items-center gap-3 bg-card px-4 py-4 text-left transition-colors hover:bg-muted/50 active:bg-muted"
            data-testid={`staff-item-${staff.id}`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {staff.avatar}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-foreground">{staff.name}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{staff.role}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
