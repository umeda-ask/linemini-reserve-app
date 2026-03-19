import { useState } from "react";
import { Calendar, Clock, CreditCard, Mail, Phone, User, UserCircle } from "lucide-react";
import { formatPrice, formatDuration, type Course, type Staff } from "@/lib/booking-api";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaymentConfirmProps {
  course: Course;
  staff: Staff | null;
  date: string;
  time: string;
  onConfirm: (info: { customerName: string; customerEmail: string; customerPhone: string }) => void;
  onBack: () => void;
}

export function PaymentConfirm({
  course,
  staff,
  date,
  time,
  onConfirm,
  onBack,
}: PaymentConfirmProps) {
  const parsedDate = parseISO(date);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!customerName.trim()) e.name = "お名前を入力してください";
    if (!customerEmail.trim()) {
      e.email = "メールアドレスを入力してください";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      e.email = "正しいメールアドレスを入力してください";
    }
    if (!customerPhone.trim()) {
      e.phone = "電話番号を入力してください";
    } else if (!/^[\d\-+()]{10,15}$/.test(customerPhone.replace(/\s/g, ""))) {
      e.phone = "正しい電話番号を入力してください";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onConfirm({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
    });
  };

  return (
    <div className="flex flex-col" data-testid="booking-payment-confirm">
      <div className="bg-muted px-4 py-2.5">
        <h2 className="text-sm font-bold text-foreground">予約内容の確認</h2>
      </div>

      <div className="flex flex-col gap-0 divide-y divide-border bg-card">
        <div className="flex items-start gap-3 px-4 py-3">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">日時</div>
            <div className="text-sm font-bold text-foreground" data-testid="text-confirm-datetime">
              {format(parsedDate, "yyyy年M月d日(E)", { locale: ja })} {time}
            </div>
          </div>
        </div>
        {staff && (
          <div className="flex items-start gap-3 px-4 py-3">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">担当スタッフ</div>
              <div className="text-sm font-bold text-foreground" data-testid="text-confirm-staff">
                {staff.name}
              </div>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3 px-4 py-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">コース</div>
            <div className="text-sm font-bold text-foreground" data-testid="text-confirm-course">{course.name}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {formatDuration(course.duration)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border bg-card px-4 py-4">
        <span className="text-sm font-bold text-foreground">お支払い金額</span>
        <span className="text-xl font-bold text-primary" data-testid="text-confirm-price">{formatPrice(course.price)}</span>
      </div>

      <div className="flex flex-col gap-2 bg-card px-4 py-3">
        <div className="rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
          {course.prepaymentOnly
            ? "事前決済が必要です"
            : "お支払いは当日店舗にてお願いいたします"}
        </div>
      </div>

      <div className="bg-muted px-4 py-2.5 mt-1">
        <h2 className="text-sm font-bold text-foreground">お客様情報</h2>
      </div>

      <div className="flex flex-col gap-4 bg-card px-4 py-4">
        <div className="space-y-1.5">
          <Label htmlFor="customerName" className="flex items-center gap-1.5 text-xs font-medium">
            <UserCircle className="h-3.5 w-3.5" />
            お名前 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="山田 太郎"
            data-testid="input-customer-name"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="customerEmail" className="flex items-center gap-1.5 text-xs font-medium">
            <Mail className="h-3.5 w-3.5" />
            メールアドレス <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customerEmail"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="example@email.com"
            data-testid="input-customer-email"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="customerPhone" className="flex items-center gap-1.5 text-xs font-medium">
            <Phone className="h-3.5 w-3.5" />
            電話番号 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customerPhone"
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="090-1234-5678"
            data-testid="input-customer-phone"
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border bg-card px-4 py-4">
        <Button
          onClick={handleSubmit}
          className="w-full bg-primary py-6 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          data-testid="button-confirm-reservation"
        >
          予約を確定する
        </Button>
        <Button variant="outline" onClick={onBack} className="w-full py-5 text-sm" data-testid="button-confirm-back">
          戻る
        </Button>
      </div>
    </div>
  );
}
