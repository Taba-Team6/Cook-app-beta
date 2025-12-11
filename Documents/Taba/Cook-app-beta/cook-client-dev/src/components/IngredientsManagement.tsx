import { useState, useEffect, useRef  } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {Card,CardContent,CardDescription,CardHeader,CardTitle,} from "./ui/card";
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle,} from "./ui/dialog";
import {Select,SelectContent, SelectItem, SelectTrigger,SelectValue,} from "./ui/select";
import { Badge } from "./ui/badge";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {Plus,Trash2,Edit,Calendar as CalendarIcon,AlertCircle,ArrowLeft,ChefHat,Snowflake,Apple,} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import {getIngredients,addIngredient,updateIngredient,deleteIngredient,parseReceiptImage,} from "../utils/api";
import { toast } from "sonner";
import { X } from "lucide-react";


export interface Ingredient {
  id: string;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  expiryDate?: string;
  location: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

const LOCATIONS = [
  {
    name: "냉장실",
    icon: ChefHat,
    color: "bg-white",
    hoverColor: "hover:bg-gray-50",
  },
  {
    name: "냉동실",
    icon: Snowflake,
    color: "bg-white",
    hoverColor: "hover:bg-gray-50",
  },
  {
    name: "실온",
    icon: Apple,
    color: "bg-white",
    hoverColor: "hover:bg-gray-50",
  },
];

const UNITS = ["개", "g", "ml"];

// 식재료 자동 분류 함수
const categorizeIngredient = (name: string): string => {
  const lowerName = name.toLowerCase().trim();

  // 채소류
  const vegetables = [
    "양파","당근","감자","고구마","배추","무","오이","호박","가지","브로콜리","양배추","시금치","상추","깻잎","부추",
    "파",
    "대파",
    "쪽파",
    "마늘",
    "생강",
    "고추",
    "피망",
    "파프리카",
    "토마토",
    "버섯",
    "느타리버섯",
    "표고버섯",
    "양송이버섯",
    "팽이버섯",
  ];

  // 과일류
  const fruits = [
    "사과",
    "배",
    "바나나",
    "포도",
    "딸기",
    "수박",
    "참외",
    "멜론",
    "복숭아",
    "자두",
    "오렌지",
    "귤",
    "레몬",
    "키위",
    "망고",
    "파인애플",
    "체리",
    "블루베리",
    "아보카도",
  ];

  // 육류
  const meats = [
    "소고기",
    "돼지고기",
    "닭고기",
    "오리고기",
    "양고기",
    "삼겹살",
    "목살",
    "안심",
    "등심",
    "갈비",
    "닭가슴살",
    "닭다리",
    "베이컨",
    "소시지",
    "햄",
    "스팸",
  ];

  // 해산물
  const seafood = [
    "고등어",
    "삼치",
    "갈치",
    "광어",
    "연어",
    "참치",
    "명태",
    "조기",
    "새우",
    "오징어",
    "문어",
    "낙지",
    "조개",
    "홍합",
    "굴",
    "바지락",
    "전복",
    "게",
    "꽃게",
  ];

  // 유제품/계란
  const dairy = [
    "우유",
    "치즈",
    "요거트",
    "요구르트",
    "버터",
    "생크림",
    "크림",
    "계란",
    "달걀",
  ];

  // 곡물/면류
  const grains = [
    "쌀",
    "현미",
    "찹쌀",
    "밀가루",
    "면",
    "국수",
    "라면",
    "스파게티",
    "파스타",
    "쌀국수",
    "당면",
    "빵",
    "식빵",
    "떡",
    "시리얼",
  ];

  // 조미료/양념
  const seasonings = [
    "소금",
    "설탕",
    "간장",
    "된장",
    "고추장",
    "고춧가루",
    "후추",
    "식초",
    "참기름",
    "들기름",
    "올리브유",
    "식용유",
    "카레",
    "케첩",
    "마요네즈",
    "머스타드",
    "굴소스",
    "맛술",
    "미림",
  ];

  // 가공식품
  const processed = [
    "두부",
    "유부",
    "어묵",
    "김",
    "김치",
    "콩나물",
    "숙주",
    "묵",
    "만두",
  ];

  for (const veg of vegetables)
    if (lowerName.includes(veg)) return "채소";
  for (const fruit of fruits)
    if (lowerName.includes(fruit)) return "과일";
  for (const meat of meats)
    if (lowerName.includes(meat)) return "육류";
  for (const fish of seafood)
    if (lowerName.includes(fish)) return "해산물";
  for (const d of dairy)
    if (lowerName.includes(d)) return "유제품";
  for (const grain of grains)
    if (lowerName.includes(grain)) return "곡물";
  for (const seasoning of seasonings)
    if (lowerName.includes(seasoning)) return "양념";
  for (const proc of processed)
    if (lowerName.includes(proc)) return "가공식품";

  return "기타";
};

interface IngredientsManagementProps {
  onBack?: () => void;
}

export function IngredientsManagement({ onBack }: IngredientsManagementProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] =
    useState<Ingredient | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // ✅ 영수증 업로드 관련 상태
const [isReceiptUploading, setIsReceiptUploading] = useState(false);
const [receiptIngredients, setReceiptIngredients] = useState<
  { name: string; quantity: string; unit: string; location: string }[]
>([]);
const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
const fileInputRef = useRef<HTMLInputElement | null>(null);
const [isReceiptReady, setIsReceiptReady] = useState(false);


  // Form state
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unit: "",
    location: "",
    expiryDate: undefined as Date | undefined,
    notes: "",
  });

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    setLoading(true);
    try {
      const response = await getIngredients();
      // 백엔드에서 storage로 받아온 데이터를 location으로 변환
      const ingredientsWithLocation = (response.ingredients || []).map(
        (ing: any) => ({
          ...ing,
          location: ing.storage || ing.location || "실온", // storage → location 변환
        }),
      );

      // Sort by expiry date (closest first)
      const sorted = ingredientsWithLocation.sort((a: any, b: any) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return (
          new Date(a.expiryDate).getTime() -
          new Date(b.expiryDate).getTime()
        );
      });
      setIngredients(sorted);
    } catch (error: any) {
      console.error("Failed to load ingredients:", error);
      toast.error("식재료 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      quantity: "",
      unit: "",
      location: selectedLocation || "",
      expiryDate: undefined,
      notes: "",
    });
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.unit || !formData.quantity) {
      toast.error("필수 항목을 모두 입력해주세요");
      return;
    }

    if (!formData.location) {
      toast.error("보관 위치를 선택해주세요");
      return;
    }

    setLoading(true);
    try {
      const ingredientData = {
        name: formData.name,
        category: categorizeIngredient(formData.name),
        quantity: formData.quantity,
        unit: formData.unit,
        storage: formData.location, // location을 storage로 매핑
        expiryDate: formData.expiryDate
          ? formData.expiryDate.toISOString()
          : undefined,
        notes: formData.notes,
      };

      const response = await addIngredient(ingredientData);
      // 백엔드에서 storage로 반환되므로 location으로 변환
      const newIngredient = {
        ...response.ingredient,
        location: response.ingredient.storage,
      };
      setIngredients([...ingredients, newIngredient]);
      toast.success("식재료가 추가되었습니다");
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Failed to add ingredient:", error);
      toast.error("식재료 추가에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (
      !editingIngredient ||
      !formData.name ||
      !formData.unit ||
      !formData.quantity
    ) {
      toast.error("필수 항목을 모두 입력해주세요");
      return;
    }

    if (!formData.location) {
      toast.error("보관 위치를 선택해주세요");
      return;
    }

    setLoading(true);
    try {
      const ingredientData = {
        name: formData.name,
        category: editingIngredient.category || "기타",
        quantity: formData.quantity,
        unit: formData.unit,
        storage: formData.location, // location을 storage로 매핑
        expiryDate: formData.expiryDate
          ? formData.expiryDate.toISOString()
          : undefined,
        notes: formData.notes,
      };

      const response = await updateIngredient(
        editingIngredient.id,
        ingredientData,
      );
      // 백엔드에서 storage로 반환되므로 location으로 변환
      const updatedIngredient = {
        ...response.ingredient,
        location: response.ingredient.storage,
      };
      setIngredients(
        ingredients.map((ing) =>
          ing.id === editingIngredient.id ? updatedIngredient : ing,
        ),
      );
      toast.success("식재료가 수정되었습니다");
      setIsEditDialogOpen(false);
      setEditingIngredient(null);
      resetForm();
    } catch (error: any) {
      console.error("Failed to update ingredient:", error);
      toast.error("식재료 수정에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    setLoading(true);
    try {
      await deleteIngredient(id);
      setIngredients(ingredients.filter((ing) => ing.id !== id));
      toast.success("식재료가 삭제되었습니다");
    } catch (error: any) {
      console.error("Failed to delete ingredient:", error);
      toast.error("식재료 삭제에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 영수증 업로드 → OCR → GPT 파싱
  const handleReceiptUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsReceiptUploading(true);
    setIsReceiptReady(false); // ✅ 새로 분석 시작하니까 초기화

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await parseReceiptImage(formData);
      const parsed = (response.ingredients || []).map((ing: any) => ({
        ...ing,
        location: "냉장실",   // ✅ 기본 보관 위치 자동 지정
      }));

      if (!parsed.length) {
        toast.error("영수증에서 식재료를 찾지 못했어요");
        return;
      }

      setReceiptIngredients(parsed);
      // 🔵 자동으로 화면/다이얼로그 안 열고, 버튼만 "확인하기"로 바뀜
      setIsReceiptReady(true);

      toast.success("영수증 분석 완료! 확인하기를 눌러 주세요");
    } catch (error: any) {
      console.error("Receipt upload failed:", error);
      toast.error(error.message || "영수증 분석 실패");
    } finally {
      setIsReceiptUploading(false);
      event.target.value = "";
    }
  };


  // ✅ 영수증 인식 결과 → 한 번에 저장
  const handleSaveReceiptIngredients = async () => {
    if (!receiptIngredients.length) return;

    setLoading(true);
    try {
      for (const ing of receiptIngredients) {
        const ingredientData = {
          name: ing.name,
          category: categorizeIngredient(ing.name),
          quantity: ing.quantity,
          unit: ing.unit,
          storage: ing.location,   // ✅ 항목마다 선택한 위치로 저장됨
          expiryDate: undefined,
          notes: "영수증 자동 등록",
        };

        const res = await addIngredient(ingredientData);

        const newIngredient = {
          ...res.ingredient,
          location: res.ingredient.storage,
        };

        setIngredients((prev) => [...prev, newIngredient]);
      }

      toast.success("영수증 식재료 저장 완료");
      setIsReceiptDialogOpen(false);
      setReceiptIngredients([]);
      setIsReceiptReady(false); // ✅ 저장 후엔 다시 처음 상태로
    } catch (error) {
      toast.error("식재료 저장 실패");
    } finally {
      setLoading(false);
    }
  };


  const openEditDialog = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      location: ingredient.location,
      expiryDate: ingredient.expiryDate
        ? parseISO(ingredient.expiryDate)
        : undefined,
      notes: ingredient.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;

    const days = differenceInDays(parseISO(expiryDate), new Date());

    if (days < 0) {
      return { label: "유통기한 지남", color: "bg-red-500" };
    } else if (days === 0) {
      return { label: "오늘 만료", color: "bg-red-500" };
    } else if (days <= 3) {
      return { label: `${days}일 남음`, color: "bg-orange-500" };
    } else if (days <= 7) {
      return { label: `${days}일 남음`, color: "bg-yellow-500" };
    }
    return { label: `${days}일 남음`, color: "bg-green-500" };
  };

  const getLocationIngredients = (location: string) => {
    return ingredients.filter((ing) => ing.location === location);
  };

  const getExpiringCountForLocation = (location: string) => {
    return getLocationIngredients(location).filter((ing) => {
      if (!ing.expiryDate) return false;
      const days = differenceInDays(parseISO(ing.expiryDate), new Date());
      return days >= 0 && days <= 3;
    }).length;
  };

  // =========================
  // 첫 화면: 보관 위치 선택
  // =========================
  if (!selectedLocation && !isReceiptDialogOpen) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-24">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="mb-2">식재료 관리</h1>
            <p className="text-muted-foreground">
              보관 위치를 선택하여 식재료를 관리하세요
            </p>
          </div>

          {/* Add Ingredient Button */}
          <div className="flex justify-end gap-2 mb-4">
            <Button
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              식재료 추가
            </Button>

            {/* ✅ 영수증 업로드 버튼 */}
            <Button
              variant="outline"
              disabled={isReceiptUploading}
              onClick={() => {
                if (isReceiptReady) {
                  // ✅ 분석이 끝난 상태 → "확인하기" 눌렀을 때 다이얼로그 열기
                  setIsReceiptDialogOpen(true);
                } else {
                  // ✅ 아직 분석 전 → 파일 선택창 열기
                  fileInputRef.current?.click();
                }
              }}
            >
              {isReceiptUploading
                ? "분석 중..."
                : isReceiptReady
                ? "확인하기"
                : "영수증으로 자동 추가"}
            </Button>


            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleReceiptUpload}
            />

          </div>


          {/* Location Buttons */}
          <div className="flex flex-col gap-4 mb-6">
            {LOCATIONS.map((location) => {
              const Icon = location.icon;
              const count = getLocationIngredients(location.name).length;
              const expiringCount =
                getExpiringCountForLocation(location.name);

              return (
                <button
                  key={location.name}
                  className={`${location.color} rounded-xl shadow-md hover:shadow-lg transition-all py-6 px-6 flex items-center gap-4 border-2 border-gray-200 ${location.hoverColor}`}
                  onClick={() => setSelectedLocation(location.name)}
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-lg font-medium text-foreground">
                      {location.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full font-medium">
                        {count}개
                      </div>
                      {expiringCount > 0 && (
                        <div className="bg-red-500 text-white px-4 py-1.5 rounded-full font-medium">
                          임박 {expiringCount}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add Dialog - 메인 화면용 (추가만) */}
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open: boolean) => {
              if (!open) {
                setIsAddDialogOpen(false);
                setEditingIngredient(null);
                resetForm();
              }
            }}
          >
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>식재료 추가</DialogTitle>
                <DialogDescription>
                  추가하고 싶은 식재료 정보를 입력해주세요
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">식재료명 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    placeholder="예: 양파, 당근, 우유"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="location">보관 위치 *</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value: string) =>
                      setFormData({
                        ...formData,
                        location: value,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="냉장실, 냉동실, 실온 중 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((location) => (
                        <SelectItem
                          key={location.name}
                          value={location.name}
                        >
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="quantity">수량 *</Label>
                    <Input
                      id="quantity"
                      type="text"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity: e.target.value,
                        })
                      }
                      placeholder="예: 2"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit">단위 *</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value: string) =>
                        setFormData({
                          ...formData,
                          unit: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="개/g/ml" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>유통기한 (택)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1.5"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.expiryDate ? (
                          format(formData.expiryDate, "yyyy년 MM월 dd일", {
                            locale: ko,
                          })
                        ) : (
                          <span className="text-muted-foreground">
                            날짜를 선택하세요
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={formData.expiryDate}
                        onSelect={(date: Date | undefined) =>
                          setFormData({
                            ...formData,
                            expiryDate: date,
                          })
                        }
                        initialFocus
                        locale={ko}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="notes">메모 (선택)</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notes: e.target.value,
                      })
                    }
                    placeholder="예: 마트에서 구매, 반만 사용"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
                >
                  취소
                </Button>
                <Button onClick={handleAdd} disabled={loading}>
                  {loading ? "처리 중..." : "추가"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // =========================
  // 상세 화면: 선택된 보관 위치
  // =========================

  const locationIngredients = getLocationIngredients(selectedLocation!);
  const expiringCount = getExpiringCountForLocation(selectedLocation!);
  const locationInfo = LOCATIONS.find(
    (loc) => loc.name === selectedLocation,
  );
  const LocationIcon = locationInfo?.icon || Apple;

  // 검색 필터 적용
  const filteredIngredients = locationIngredients.filter((ing) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ing.name.toLowerCase().includes(q) ||
      ing.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header with Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedLocation(null)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            보관 위치 선택으로 돌아가기
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <LocationIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="mb-0">{selectedLocation}</h1>
              <p className="text-sm text-muted-foreground">
                총 {locationIngredients.length}개 식재료
              </p>
            </div>
          </div>
          <p className="text-muted-foreground">
            {selectedLocation}에 보관된 식재료를 관리하세요
          </p>
        </div>

        {/* 검색 바 */}
        <div className="mb-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="식재료 이름, 카테고리로 검색..."
          />
        </div>

        {/* Alert for expiring items */}
        {expiringCount > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <p className="text-orange-900">
                  <span className="font-semibold">{expiringCount}개</span>의
                  식재료가 곧 유통기한이 만료됩니다
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="mb-6">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">임박 식재료</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {expiringCount}개
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ingredients Grid */}
        {loading && filteredIngredients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : filteredIngredients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <LocationIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {selectedLocation}에 등록된 식재료가 없습니다
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIngredients.map((ingredient) => {
              const expiryStatus = getExpiryStatus(ingredient.expiryDate);
              return (
                <Card
                  key={ingredient.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {ingredient.name}
                        </CardTitle>
                        <CardDescription>{ingredient.category}</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(ingredient)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(ingredient.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">수량:</span>
                        <span className="font-medium">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                      </div>
                      {ingredient.expiryDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            유통기한:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {format(
                                parseISO(ingredient.expiryDate),
                                "yyyy.MM.dd",
                                { locale: ko },
                              )}
                            </span>
                            {expiryStatus && (
                              <Badge
                                className={`${expiryStatus.color} text-white text-xs`}
                              >
                                {expiryStatus.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {ingredient.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            {ingredient.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add/Edit Dialog (상세 화면용) */}
        <Dialog
          open={isAddDialogOpen || isEditDialogOpen}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
              setEditingIngredient(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditDialogOpen ? "식재료 수정" : "식재료 추가"}
              </DialogTitle>
              <DialogDescription>
                추가하고 싶은 식재료 정보를 입력해주세요
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">식재료명 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  placeholder="예: 양파, 당근, 우유"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="location">보관 위치 *</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value: string) =>
                    setFormData({
                      ...formData,
                      location: value,
                    })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="냉장실, 냉동실, 실온 중 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((location) => (
                      <SelectItem
                        key={location.name}
                        value={location.name}
                      >
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="quantity">수량 *</Label>
                  <Input
                    id="quantity"
                    type="text"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: e.target.value,
                      })
                    }
                    placeholder="예: 2"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="unit">단위 *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value: string) =>
                      setFormData({
                        ...formData,
                        unit: value,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="개/g/ml" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>유통기한 (선택)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-1.5"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expiryDate ? (
                        format(
                          formData.expiryDate,
                          "yyyy년 MM월 dd일",
                          { locale: ko },
                        )
                      ) : (
                        <span className="text-muted-foreground">
                          날짜를 선택하세요
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={formData.expiryDate}
                      onSelect={(date: Date | undefined) =>
                        setFormData({
                          ...formData,
                          expiryDate: date,
                        })
                      }
                      initialFocus
                      locale={ko}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="notes">메모 (선택)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notes: e.target.value,
                    })
                  }
                  placeholder="예: 마트에서 구매, 반만 사용"
                  className="mt-1.5"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setEditingIngredient(null);
                  resetForm();
                }}
              >
                취소
              </Button>
              <Button
                onClick={isEditDialogOpen ? handleEdit : handleAdd}
                disabled={loading}
              >
                {loading ? "처리 중..." : isEditDialogOpen ? "수정" : "추가"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ✅ 영수증 인식 결과 Dialog */}
        <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>영수증 인식 결과</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              {receiptIngredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 border-b py-3 px-2 relative"
                >
                  {/* ✅ X 삭제 버튼 (겹침 방지 위치 고정) */}
                  <button
                    className="absolute top-2 right-2 z-10 text-gray-400 hover:text-red-500"
                    onClick={() => {
                      setReceiptIngredients(prev =>
                        prev.filter((_, i) => i !== idx)
                      );
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* ✅ 내용 영역 (X랑 안 겹치게 padding-right 확보) */}
                  <div className="flex justify-between items-center pr-8">
                    <span className="font-medium">{ing.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {ing.quantity} {ing.unit}
                    </span>
                  </div>

                  <Select
                    value={ing.location}
                    onValueChange={(value: string) => {
                      setReceiptIngredients(prev =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, location: value } : item
                        )
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="보관 위치 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map(loc => (
                        <SelectItem key={loc.name} value={loc.name}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}



            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsReceiptDialogOpen(false)}
              >
                취소
              </Button>
              <Button onClick={handleSaveReceiptIngredients}>
                모두 저장
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}