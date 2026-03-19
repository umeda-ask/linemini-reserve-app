import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Store,
  ListOrdered,
  Users,
  Clock,
  CalendarCheck,
  ImageIcon,
  Save,
  X,
  Upload,
} from "lucide-react";
import type { Shop } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CourseManagement } from "@/components/admin/course-management";
import { StaffManagement } from "@/components/admin/staff-management";
import { SlotManagement } from "@/components/admin/slot-management";
import { ReservationList } from "@/components/admin/reservation-list";

type ShopAdminTab = "images" | "courses" | "staff" | "slots" | "reservations";

function ImageUploadSlot({
  label,
  value,
  onChange,
  uploadTestId,
  removeTestId,
  previewTestId,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  uploadTestId: string;
  removeTestId: string;
  previewTestId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange(data.url);
    } catch {
      onChange("");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          data-testid={uploadTestId}
        >
          <Upload className="w-4 h-4 mr-1" />
          {uploading ? "アップロード中..." : "画像を選択"}
        </Button>
        {value && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onChange("")}
            data-testid={removeTestId}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {value && (
        <img
          src={value}
          alt={label}
          className="w-40 h-28 object-cover rounded-md border mt-2"
          data-testid={previewTestId}
        />
      )}
    </div>
  );
}

function ImageManagement({ shop }: { shop: Shop }) {
  const { toast } = useToast();
  const [reservationImageUrl, setReservationImageUrl] = useState(shop.reservationImageUrl || "");
  const [gallery1, setGallery1] = useState(shop.galleryImageUrls?.[0] || "");
  const [gallery2, setGallery2] = useState(shop.galleryImageUrls?.[1] || "");
  const [gallery3, setGallery3] = useState(shop.galleryImageUrls?.[2] || "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const galleryImageUrls = [gallery1, gallery2, gallery3].filter(Boolean);
      await apiRequest("PUT", `/api/shops/${shop.id}`, {
        reservationImageUrl: reservationImageUrl || null,
        galleryImageUrls: galleryImageUrls.length > 0 ? galleryImageUrls : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shops", shop.id.toString()] });
      toast({ title: "画像設定を保存しました" });
    },
    onError: () => {
      toast({ title: "保存に失敗しました", variant: "destructive" });
    },
  });

  return (
    <div data-testid="admin-image-management">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">画像管理</h2>
        <p className="text-sm text-muted-foreground">予約ページと店舗詳細ページの画像を設定</p>
      </div>

      <Card className="overflow-visible p-5 space-y-6">
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-primary" />
            予約ページ画像（1枚）
          </h3>
          <ImageUploadSlot
            label="予約ページ画像"
            value={reservationImageUrl}
            onChange={setReservationImageUrl}
            uploadTestId="upload-reservation-image"
            removeTestId="remove-reservation-image"
            previewTestId="img-reservation-preview"
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-primary" />
            店舗詳細画像（3枚・スライド表示）
          </h3>
          <div className="space-y-3">
            {[
              { label: "画像1", value: gallery1, setter: setGallery1, num: "1" },
              { label: "画像2", value: gallery2, setter: setGallery2, num: "2" },
              { label: "画像3", value: gallery3, setter: setGallery3, num: "3" },
            ].map((item) => (
              <ImageUploadSlot
                key={item.num}
                label={item.label}
                value={item.value}
                onChange={item.setter}
                uploadTestId={`upload-gallery-${item.num}`}
                removeTestId={`remove-gallery-${item.num}`}
              />
            ))}
          </div>
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          data-testid="button-save-images"
        >
          <Save className="w-4 h-4 mr-1" />
          {saveMutation.isPending ? "保存中..." : "画像設定を保存"}
        </Button>
      </Card>
    </div>
  );
}

export default function ShopAdminPage() {
  const params = useParams<{ id: string }>();
  const shopId = parseInt(params.id || "0");
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<ShopAdminTab>("images");

  const { data: shop, isLoading } = useQuery<Shop>({
    queryKey: ["/api/shops", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/shops/${params.id}`);
      if (!res.ok) throw new Error("Shop not found");
      return res.json();
    },
  });

  const tabs: { id: ShopAdminTab; label: string; icon: typeof Store }[] = [
    { id: "images", label: "画像管理", icon: ImageIcon },
    { id: "courses", label: "コース管理", icon: ListOrdered },
    { id: "staff", label: "スタッフ管理", icon: Users },
    { id: "slots", label: "予約枠管理", icon: Clock },
    { id: "reservations", label: "予約一覧", icon: CalendarCheck },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center gap-2 px-4 md:px-8 h-14">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-5 w-40" />
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center overflow-visible">
          <h2 className="font-bold text-lg mb-2">店舗が見つかりませんでした</h2>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            管理画面に戻る
          </Button>
        </Card>
      </div>
    );
  }

  if (!shop.reservationUrl) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center overflow-visible">
          <h2 className="font-bold text-lg mb-2">予約機能が無効です</h2>
          <p className="text-sm text-muted-foreground mb-4">
            この店舗の予約機能は有効になっていません。管理画面から予約機能を有効にしてください。
          </p>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            管理画面に戻る
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-2 px-4 md:px-8 h-14">
          <Link href="/admin" data-testid="button-shop-admin-back">
            <Button size="icon" variant="ghost">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm" data-testid="text-shop-admin-title">店舗管理</span>
          </div>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <img
              src={shop.imageUrl}
              alt={shop.name}
              className="w-10 h-10 rounded-md object-cover"
            />
            <div>
              <h1 className="text-xl font-bold" data-testid="text-shop-admin-name">{shop.name}</h1>
              <p className="text-sm text-muted-foreground">
                コース・スタッフ・予約の管理
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-6 overflow-x-auto border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`tab-shop-admin-${tab.id}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "images" && <ImageManagement shop={shop} />}
        {activeTab === "courses" && <CourseManagement shopId={shopId} />}
        {activeTab === "staff" && <StaffManagement shopId={shopId} />}
        {activeTab === "slots" && <SlotManagement shopId={shopId} />}
        {activeTab === "reservations" && <ReservationList shopId={shopId} />}
      </div>
    </div>
  );
}
