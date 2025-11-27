import { useState, useRef } from "react";
import { Camera, Upload, Sparkles, Loader2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { aiRegisterIngredient, addIngredient } from "../utils/api";
import { toast } from "sonner@2.0.3";

interface AIIngredientRegisterProps {
  onSuccess?: () => void;
}

export function AIIngredientRegister({ onSuccess }: AIIngredientRegisterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detectedData, setDetectedData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    storage: "fridge",
    quantity: "",
    unit: "",
    expiry_date: "",
    notes: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 미리보기
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // AI 분석
    await processImage(file);
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    
    try {
      // 이미지를 base64로 변환
      const base64 = await fileToBase64(file);
      const base64Data = base64.split(',')[1]; // "data:image/jpeg;base64," 부분 제거

      toast.info("AI가 식재료를 분석 중입니다...");

      // Vision API 호출
      const response = await aiRegisterIngredient(base64Data);

      if (response.success && response.detected) {
        setDetectedData(response.detected);
        
        // 폼 자동 채우기
        setFormData(prev => ({
          ...prev,
          name: response.detected.name || "",
          category: response.detected.category || "기타"
        }));

        toast.success("식재료를 인식했습니다!");
      } else {
        toast.error("식재료를 인식하지 못했습니다. 수동으로 입력해주세요.");
      }
    } catch (error: any) {
      console.error("AI 분석 실패:", error);
      toast.error(error.message || "AI 분석에 실패했습니다");
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category) {
      toast.error("식재료 이름과 카테고리는 필수입니다");
      return;
    }

    try {
      await addIngredient(formData);
      toast.success("식재료가 등록되었습니다");
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error("식재료 등록 실패:", error);
      toast.error(error.message || "식재료 등록에 실패했습니다");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setImagePreview(null);
    setDetectedData(null);
    setFormData({
      name: "",
      category: "",
      storage: "fridge",
      quantity: "",
      unit: "",
      expiry_date: "",
      notes: ""
    });
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        AI 식재료 등록
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI 식재료 등록
            </DialogTitle>
            <DialogDescription>
              식재료 사진을 찍거나 업로드하면 AI가 자동으로 인식합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 이미지 업로드 영역 */}
            <div className="space-y-3">
              <Label>식재료 사진</Label>
              
              {!imagePreview ? (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    카메라로 촬영
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    사진 업로드
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImagePreview(null);
                      setDetectedData(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />

              {isProcessing && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  <span className="text-sm text-muted-foreground">AI 분석 중...</span>
                </div>
              )}
            </div>

            {/* AI 인식 결과 */}
            {detectedData && (
              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                <p className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  AI 인식 결과
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">인식된 식재료:</span>{" "}
                    <span className="font-medium">{detectedData.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">카테고리:</span>{" "}
                    <Badge variant="outline">{detectedData.category}</Badge>
                  </div>
                  {detectedData.labels && detectedData.labels.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">감지된 태그:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {detectedData.labels.map((label: any, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {label.name} ({Math.round(label.confidence * 100)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 식재료 정보 입력 폼 */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">식재료 이름 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="예: 양파"
                  />
                </div>

                <div>
                  <Label htmlFor="category">카테고리 *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="채소">채소</SelectItem>
                      <SelectItem value="과일">과일</SelectItem>
                      <SelectItem value="육류">육류</SelectItem>
                      <SelectItem value="수산물">수산물</SelectItem>
                      <SelectItem value="유제품">유제품</SelectItem>
                      <SelectItem value="곡물">곡물</SelectItem>
                      <SelectItem value="양념">양념</SelectItem>
                      <SelectItem value="기타">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="storage">보관 위치</Label>
                  <Select
                    value={formData.storage}
                    onValueChange={(value) => setFormData({ ...formData, storage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fridge">냉장</SelectItem>
                      <SelectItem value="freezer">냉동</SelectItem>
                      <SelectItem value="room">실온</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">수량</Label>
                  <Input
                    id="quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="예: 2"
                  />
                </div>

                <div>
                  <Label htmlFor="unit">단위</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="예: 개"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="expiry_date">유통기한</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="notes">메모 (선택)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="추가 정보를 입력하세요"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.category}>
              등록하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
