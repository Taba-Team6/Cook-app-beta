import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { ArrowLeft, Send, Mic, MicOff, AlertTriangle, CheckCircle2, ChefHat } from "lucide-react";
import { UserProfile } from "./ProfileSetup";
import { ScrollArea } from "./ui/scroll-area";

interface Recipe {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  cookingTime: string;
  image: string;
  description: string;
}

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  isAllergen?: boolean;
  allergenType?: string;
}

interface RecipeIngredientCheckProps {
  recipe: Recipe;
  userProfile: UserProfile | null;
  onConfirm: () => void;
  onBack: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CookingStep {
  stepNumber: number;
  instruction: string;
  tips?: string;
}

// 레시피별 조리 단계
const getCookingSteps = (recipeId: string): CookingStep[] => {
  const steps: { [key: string]: CookingStep[] } = {
    "1": [ // 김치볶음밥
      {
        stepNumber: 1,
        instruction: "먼저 프라이팬에 식용유 2스푼을 두르고 중불로 달궈주세요.",
        tips: "프라이팬이 충분히 달궈져야 김치가 눌어붙지 않습니다."
      },
      {
        stepNumber: 2,
        instruction: "돼지고기 100g을 넣고 겉면이 익을 때까지 볶아주세요.",
        tips: "고기가 70% 정도 익으면 다음 단계로 넘어가도 됩니다."
      },
      {
        stepNumber: 3,
        instruction: "김치 1/2포기를 적당한 크기로 썰어서 넣고 2-3분간 볶아주세요.",
        tips: "김치가 노릇노릇해질 때까지 볶으면 더 맛있습니다."
      },
      {
        stepNumber: 4,
        instruction: "밥 2공기를 넣고 주걱으로 으깨면서 잘 섞어주세요.",
        tips: "밥이 따뜻하면 더 잘 섞입니다. 전날 밥은 미리 데워주세요."
      },
      {
        stepNumber: 5,
        instruction: "참기름 1스푼을 두르고 30초간 더 볶아주세요.",
        tips: "참기름은 마지막에 넣어야 고소한 향이 살아납니다."
      },
      {
        stepNumber: 6,
        instruction: "완성! 그릇에 담고 김을 올려서 드시면 됩니다.",
        tips: "취향에 따라 계란 프라이나 치즈를 올려도 맛있습니다."
      }
    ],
    "2": [ // 스파게티 까르보나라
      {
        stepNumber: 1,
        instruction: "큰 냄비에 물을 끓이고 소금을 넣은 뒤 스파게티 면 200g을 넣어주세요.",
        tips: "면은 포장지에 적힌 시간보다 1분 적게 삶아주세요."
      },
      {
        stepNumber: 2,
        instruction: "볼에 달걀 2개, 파르메산 치즈 50g, 후추를 넣고 잘 섞어주세요.",
        tips: "이 소스가 까르보나라의 핵심입니다. 덩어리 없이 부드럽게 섞어주세요."
      },
      {
        stepNumber: 3,
        instruction: "프라이팬에 베이컨 100g과 다진 마늘 3쪽을 넣고 바삭하게 볶아주세요.",
        tips: "베이컨에서 나온 기름은 버리지 마세요. 소스에 사용됩니다."
      },
      {
        stepNumber: 4,
        instruction: "삶은 면을 건져서 프라이팬에 넣고 베이컨과 섞어주세요.",
        tips: "면수를 조금 남겨두면 소스가 더 부드러워집니다."
      },
      {
        stepNumber: 5,
        instruction: "불을 끄고 생크림 100ml를 넣어 섞은 뒤, 달걀 소스를 부어 빠르게 섞어주세요.",
        tips: "불을 끈 상태에서 섞어야 달걀이 익지 않고 부드러운 소스가 됩니다."
      },
      {
        stepNumber: 6,
        instruction: "완성! 접시에 담고 파르메산 치즈와 후추를 뿌려 드세요.",
        tips: "먹기 직전에 후추를 갈아서 뿌리면 더 맛있습니다."
      }
    ],
    "3": [ // 된장찌개
      {
        stepNumber: 1,
        instruction: "냄비에 물 3컵을 넣고 중불로 끓여주세요.",
        tips: "멸치 육수를 사용하면 더 깊은 맛이 납니다."
      },
      {
        stepNumber: 2,
        instruction: "감자 1개와 양파 1/2개를 한입 크기로 썰어서 넣어주세요.",
        tips: "감자가 익는데 시간이 걸리므로 먼저 넣어줍니다."
      },
      {
        stepNumber: 3,
        instruction: "물이 끓으면 된장 2스푼을 풀어주세요.",
        tips: "된장은 체에 거르면서 넣으면 덩어리가 생기지 않습니다."
      },
      {
        stepNumber: 4,
        instruction: "애호박 1/3개와 두부 1/2모를 넣고 5분간 끓여주세요.",
        tips: "두부는 부서지기 쉬우니 조심스럽게 넣어주세요."
      },
      {
        stepNumber: 5,
        instruction: "대파 1대와 청양고추 1개를 썰어서 넣고 2분간 더 끓여주세요.",
        tips: "대파와 고추는 마지막에 넣어야 향이 살아납니다."
      },
      {
        stepNumber: 6,
        instruction: "완성! 밥과 함께 드시면 됩니다.",
        tips: "취향에 따라 다진 마늘을 추가해도 좋습니다."
      }
    ],
    "4": [ // 오므라이스
      {
        stepNumber: 1,
        instruction: "양파 1/2개와 당근 1/4개를 잘게 다져주세요.",
        tips: "채소는 최대한 잘게 썰어야 밥과 잘 어울립니다."
      },
      {
        stepNumber: 2,
        instruction: "프라이팬에 버터를 녹이고 채소와 닭가슴살을 볶아주세요.",
        tips: "중불에서 채소가 투명해질 때까지 볶아주세요."
      },
      {
        stepNumber: 3,
        instruction: "밥과 케챱을 넣고 잘 섞어가며 볶아주세요.",
        tips: "케챱은 취향껏 조절하되, 색이 예쁘게 나도록 충분히 넣어주세요."
      },
      {
        stepNumber: 4,
        instruction: "볶은 밥을 타원형으로 그릇에 담아주세요.",
        tips: "랩을 이용하면 모양을 예쁘게 잡을 수 있습니다."
      },
      {
        stepNumber: 5,
        instruction: "달걀 2개를 풀어서 프라이팬에 얇게 부쳐주세요.",
        tips: "약불에서 천천히 익혀야 부드러운 오믈렛이 됩니다."
      },
      {
        stepNumber: 6,
        instruction: "오믈렛을 밥 위에 올리고 케챱으로 장식하면 완성!",
        tips: "가운데를 칼로 살짝 갈라주면 더 예쁩니다."
      }
    ],
    "5": [ // 비빔밥
      {
        stepNumber: 1,
        instruction: "시금치, 콩나물, 당근을 각각 데쳐주세요.",
        tips: "각 나물은 데친 후 찬물에 헹궈 물기를 꼭 짜주세요."
      },
      {
        stepNumber: 2,
        instruction: "데친 나물에 참기름, 다진 마늘, 소금으로 간을 해주세요.",
        tips: "나물마다 따로 무쳐야 각각의 맛이 살아납니다."
      },
      {
        stepNumber: 3,
        instruction: "쇠고기를 간장, 설탕, 참기름에 재워 볶아주세요.",
        tips: "고기는 센불에서 빠르게 볶아야 부드럽습니다."
      },
      {
        stepNumber: 4,
        instruction: "밥을 그릇에 담고 나물과 고기를 예쁘게 올려주세요.",
        tips: "색깔별로 배치하면 보기에도 좋습니다."
      },
      {
        stepNumber: 5,
        instruction: "가운데 계란 프라이를 올려주세요.",
        tips: "계란 노른자가 반숙이면 비빔밥과 더 잘 어울립니다."
      },
      {
        stepNumber: 6,
        instruction: "고추장을 올리고 잘 비벼서 드시면 완성!",
        tips: "참기름을 한 번 더 두르면 더욱 고소합니다."
      }
    ],
    "6": [ // 토마토 파스타
      {
        stepNumber: 1,
        instruction: "냄비에 물을 끓이고 파스타 면을 삶아주세요.",
        tips: "면은 포장지 시간보다 1분 적게 삶으세요."
      },
      {
        stepNumber: 2,
        instruction: "프라이팬에 올리브유를 두르고 다진 마늘을 볶아주세요.",
        tips: "마늘이 갈색으로 변하기 전에 다음 단계로 넘어가세요."
      },
      {
        stepNumber: 3,
        instruction: "토마토 소스를 넣고 중불에서 5분간 끓여주세요.",
        tips: "생토마토를 사용한다면 으깨면서 끓여주세요."
      },
      {
        stepNumber: 4,
        instruction: "삶은 면을 소스에 넣고 잘 버무려주세요.",
        tips: "면수를 조금 추가하면 소스가 면에 더 잘 스며듭니다."
      },
      {
        stepNumber: 5,
        instruction: "바질과 파르메산 치즈를 뿌려주세요.",
        tips: "신선한 바질을 사용하면 향이 훨씬 좋습니다."
      },
      {
        stepNumber: 6,
        instruction: "완성! 따뜻할 때 드시면 됩니다.",
        tips: "올리브오일을 한 번 더 뿌리면 더욱 풍미가 좋습니다."
      }
    ],
    "7": [ // 새우볶음밥
      {
        stepNumber: 1,
        instruction: "새우의 내장을 제거하고 깨끗이 씻어주세요.",
        tips: "새우 등쪽에 칼집을 내서 내장을 제거하세요."
      },
      {
        stepNumber: 2,
        instruction: "프라이팬에 기름을 두르고 새우를 볶아주세요.",
        tips: "새우가 붉은색으로 변하면 익은 것입니다."
      },
      {
        stepNumber: 3,
        instruction: "다진 양파와 당근을 넣고 함께 볶아주세요.",
        tips: "채소가 숨이 죽을 때까지 중불에서 볶아주세요."
      },
      {
        stepNumber: 4,
        instruction: "밥을 넣고 간장으로 간을 하면서 볶아주세요.",
        tips: "밥알이 흩어지도록 주걱으로 눌러가며 볶으세요."
      },
      {
        stepNumber: 5,
        instruction: "대파를 썰어 넣고 30초간 더 볶아주세요.",
        tips: "대파의 향이 살아나도록 마지막에 넣어주세요."
      },
      {
        stepNumber: 6,
        instruction: "완성! 참기름을 약간 뿌려 드세요.",
        tips: "후추를 살짝 뿌리면 더욱 맛있습니다."
      }
    ],
    "8": [ // 치킨 샐러드
      {
        stepNumber: 1,
        instruction: "닭가슴살을 끓는 물에 넣고 15분간 삶아주세요.",
        tips: "닭가슴살이 완전히 익었는지 확인하세요."
      },
      {
        stepNumber: 2,
        instruction: "삶은 닭가슴살을 식혀서 손으로 찢어주세요.",
        tips: "결대로 찢으면 식감이 더 좋습니다."
      },
      {
        stepNumber: 3,
        instruction: "양상추, 토마토, 오이 등 채소를 씻어서 먹기 좋게 썰어주세요.",
        tips: "채소는 찬물에 담가두면 더 아삭해집니다."
      },
      {
        stepNumber: 4,
        instruction: "볼에 채소와 닭가슴살을 담아주세요.",
        tips: "큰 볼에 담아야 나중에 버무리기 편합니다."
      },
      {
        stepNumber: 5,
        instruction: "올리브오일, 레몬즙, 소금, 후추로 드레싱을 만들어주세요.",
        tips: "드레싱은 먹기 직전에 넣어야 채소가 눅눅해지지 않습니다."
      },
      {
        stepNumber: 6,
        instruction: "드레싱을 뿌리고 잘 섞으면 완성!",
        tips: "아보카도나 견과류를 추가하면 더욱 영양가 있습니다."
      }
    ]
  };

  return steps[recipeId] || [
    { stepNumber: 1, instruction: "첫 번째 조리 단계를 진행해주세요.", tips: "천천히 따라해보세요." },
    { stepNumber: 2, instruction: "두 번째 조리 단계를 진행해주세요.", tips: "화력 조절에 주의하세요." },
    { stepNumber: 3, instruction: "완성! 맛있게 드세요.", tips: "취향껏 간을 조절하세요." }
  ];
};

// 레시피별 재료 정보
const getIngredientsForRecipe = (recipeId: string, allergies: string[]): Ingredient[] => {
  const baseIngredients: { [key: string]: Ingredient[] } = {
    "1": [ // 김치볶음밥
      { id: "1", name: "밥", amount: "2공기" },
      { id: "2", name: "김치", amount: "1/2포기" },
      { id: "3", name: "돼지고기", amount: "100g", isAllergen: allergies.includes("돼지고기"), allergenType: "돼지고기" },
      { id: "4", name: "식용유", amount: "2스푼" },
      { id: "5", name: "참기름", amount: "1스푼" },
      { id: "6", name: "김", amount: "1장" },
    ],
    "2": [ // 스파게티 까르보나라
      { id: "1", name: "스파게티 면", amount: "200g", isAllergen: allergies.includes("밀"), allergenType: "밀" },
      { id: "2", name: "베이컨", amount: "100g" },
      { id: "3", name: "달걀", amount: "2개", isAllergen: allergies.includes("달걀"), allergenType: "달걀" },
      { id: "4", name: "파르메산 치즈", amount: "50g", isAllergen: allergies.includes("유제품"), allergenType: "유제품" },
      { id: "5", name: "마늘", amount: "3쪽" },
      { id: "6", name: "생크림", amount: "100ml", isAllergen: allergies.includes("유제품"), allergenType: "유제품" },
      { id: "7", name: "후추", amount: "약간" },
    ],
    "3": [ // 된장찌개
      { id: "1", name: "된장", amount: "2스푼", isAllergen: allergies.includes("콩"), allergenType: "콩" },
      { id: "2", name: "두부", amount: "1/2모", isAllergen: allergies.includes("콩"), allergenType: "콩" },
      { id: "3", name: "감자", amount: "1개" },
      { id: "4", name: "양파", amount: "1/2개" },
      { id: "5", name: "애호박", amount: "1/3개" },
      { id: "6", name: "대파", amount: "1대" },
      { id: "7", name: "청양고추", amount: "1개" },
    ],
  };

  return baseIngredients[recipeId] || [
    { id: "1", name: "재료 1", amount: "적당량" },
    { id: "2", name: "재료 2", amount: "적당량" },
    { id: "3", name: "재료 3", amount: "적당량" },
  ];
};

export function RecipeIngredientCheck({ recipe, userProfile, onConfirm, onBack }: RecipeIngredientCheckProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allergies = userProfile?.allergies || [];
  const ingredients = getIngredientsForRecipe(recipe.id, allergies);
  const cookingSteps = getCookingSteps(recipe.id);
  const allergenIngredients = ingredients.filter(ing => ing.isAllergen);
  const hasAllergens = allergenIngredients.length > 0;

  useEffect(() => {
    // 초기 메시지 설정 - 레시피 설명과 시작 안내 (이전 대화는 불러오지 않음)
    const initialMessages: Message[] = [
      {
        id: "1",
        role: "assistant",
        content: `안녕하세요! ${recipe.name} 조리를 시작하겠습니다. 😊\n\n${recipe.description}`,
        timestamp: new Date()
      }
    ];

    if (hasAllergens) {
      initialMessages.push({
        id: "allergen",
        role: "assistant",
        content: `⚠️ 알러지 경고: 이 레시피에는 ${allergenIngredients.map(ing => ing.allergenType).join(', ')}이(가) 포함되어 있습니다. 알러지가 있으시다면 이 요리를 만들지 마세요.`,
        timestamp: new Date()
      });
    }

    initialMessages.push({
      id: "ingredients",
      role: "assistant",
      content: `필요한 재료:\n${ingredients.map(ing => `• ${ing.name}: ${ing.amount}`).join('\n')}\n\n조리 시간: ${recipe.cookingTime}\n난이도: ${recipe.difficulty}\n\n준비가 되셨다면 "시작" 또는 "다음"이라고 말씀해주세요!`,
      timestamp: new Date()
    });

    setMessages(initialMessages);
  }, [recipe.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role: "user" | "assistant", content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    addMessage("user", userMessage);
    setInputMessage("");

    // AI 응답 처리
    setTimeout(() => {
      handleAIResponse(userMessage);
    }, 500);
  };

  const handleAIResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();

    // 완료 상태에서의 응답
    if (isComplete) {
      if (lowerMessage.includes("완료") || lowerMessage.includes("끝")) {
        addMessage("assistant", "수고하셨습니다! 맛있게 드세요! 🎉");
      } else {
        addMessage("assistant", "요리가 완료되었습니다. '요리 완료' 버튼을 눌러주세요!");
      }
      return;
    }

    // 다음 단계로 이동
    if (lowerMessage.includes("다음") || lowerMessage.includes("넘어") || 
        lowerMessage.includes("완료") || lowerMessage.includes("됐") ||
        lowerMessage.includes("했어") || lowerMessage.includes("했습니다") ||
        lowerMessage.includes("끝") || lowerMessage.includes("준비") ||
        lowerMessage.includes("시작")) {
      
      if (currentStep === 0) {
        // 재료 확인 후 첫 단계 시작
        setCurrentStep(1);
        const step = cookingSteps[0];
        addMessage("assistant", `좋습니다! 그럼 요리를 시작하겠습니다.\n\n[1단계/${cookingSteps.length}단계]\n${step.instruction}\n\n💡 팁: ${step.tips}\n\n완료하시면 "다음"이라고 말씀해주세요.`);
      } else if (currentStep < cookingSteps.length) {
        setCurrentStep(prev => prev + 1);
        if (currentStep === cookingSteps.length - 1) {
          // 마지막 단계 완료
          setIsComplete(true);
          addMessage("assistant", `축하합니다! ${recipe.name}이(가) 완성되었습니다! 🎉\n\n맛있게 드시고, '요리 완료' 버튼을 눌러주세요.`);
        } else {
          const step = cookingSteps[currentStep];
          addMessage("assistant", `잘하셨습니다! 다음 단계로 넘어가겠습니다.\n\n[${currentStep + 1}단계/${cookingSteps.length}단계]\n${step.instruction}\n\n💡 팁: ${step.tips}\n\n완료하시면 "다음"이라고 말씀해주세요.`);
        }
      }
      return;
    }

    // 일반적인 질문에 대한 응답
    if (lowerMessage.includes("불") || lowerMessage.includes("화력")) {
      addMessage("assistant", "불 조절은 요리의 핵심입니다. 약불은 1-2단계, 중불은 3-4단계, 강불은 5-6단계를 말합니다. 대부분의 볶음 요리는 중불~중강불에서 진행하시면 됩니다.");
    } else if (lowerMessage.includes("시간") || lowerMessage.includes("얼마나")) {
      if (currentStep > 0 && currentStep <= cookingSteps.length) {
        addMessage("assistant", "현재 단계는 보통 2-3분 정도 소요됩니다. 재료의 상태를 보면서 진행해주세요. 색이 변하거나 향이 나기 시작하면 다음 단계로 넘어가셔도 됩니다.");
      } else {
        addMessage("assistant", `${recipe.name}의 전체 조리 시간은 약 ${recipe.cookingTime}입니다.`);
      }
    } else if (lowerMessage.includes("재료") || lowerMessage.includes("없") || lowerMessage.includes("대체")) {
      addMessage("assistant", "없는 재료가 있으신가요? 구체적으로 어떤 재료가 없으신지 말씀해주시면 대체 재료를 추천해드릴게요!");
    } else if (lowerMessage.includes("온도")) {
      addMessage("assistant", "오븐을 사용하는 요리가 아니라면 특별히 온도를 재실 필요는 없습니다. 프라이팬이나 냄비의 경우 중불로 시작해서 필요에 따라 조절하시면 됩니다.");
    } else if (lowerMessage.includes("처음") || lowerMessage.includes("다시")) {
      setCurrentStep(0);
      addMessage("assistant", "처음부터 다시 시작하겠습니다. 재료를 다시 한번 확인해주세요!");
    } else if (lowerMessage.includes("건강") || lowerMessage.includes("칼로리") || lowerMessage.includes("영양")) {
      addMessage("assistant", "건강하게 요리하시려면 기름의 양을 조금 줄이고, 채소를 더 추가하시는 것을 추천드립니다. 소금 대신 허브나 향신료로 간을 맞추면 더욱 건강한 요리가 됩니다.");
    } else if (lowerMessage.includes("맛") || lowerMessage.includes("간")) {
      addMessage("assistant", "간을 보실 때는 조금씩 맛을 보면서 조절하세요. 나중에 더 추가할 수는 있어도 짠 것을 되돌릴 수는 없으니 처음엔 적게 넣는 것이 좋습니다.");
    } else if (lowerMessage.includes("도구") || lowerMessage.includes("프라이팬") || lowerMessage.includes("냄비")) {
      addMessage("assistant", "이 요리에는 기본적인 조리 도구가 필요합니다. 프라이팬, 칼, 도마는 필수이고, 레시피에 따라 냄비나 볼 등이 추가로 필요할 수 있습니다.");
    } else if (lowerMessage.includes("안녕") || lowerMessage.includes("hi") || lowerMessage.includes("hello")) {
      addMessage("assistant", "안녕하세요! 요리를 진행하시려면 '다음' 또는 '시작'이라고 말씀해주세요. 궁금한 점이 있으시면 언제든 질문해주세요!");
    } else if (lowerMessage.includes("도움") || lowerMessage.includes("help") || lowerMessage.includes("모르겠")) {
      addMessage("assistant", "제가 도와드릴게요! 요리 중 다음과 같은 질문을 할 수 있습니다:\n• '다음' - 다음 단계로 이동\n• '불 조절은 어떻게?' - 화력 관련 도움\n• '시간이 얼마나?' - 소요 시간 안내\n• '재료가 없어' - 대체 재료 추천\n• '처음부터' - 처음부터 다시 시작");
    } else if (currentStep === 0) {
      addMessage("assistant", "재료 준비가 완료되셨다면 '다음' 또는 '시작'이라고 말씀해주세요. 궁금한 점이 있으시면 언제든 질문해주세요!");
    } else {
      addMessage("assistant", "현재 진행 중인 단계에 집중해주세요. 질문이 있으시면 구체적으로 말씀해주시고, 단계를 완료하셨다면 '다음'이라고 말씀해주세요.");
    }
  };

  const toggleVoiceRecognition = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // 음성 인식 시작 (실제 구현에서는 Web Speech API 사용)
      addMessage("assistant", "🎤 음성 인식이 시작되었습니다. 말씀해주세요!");
      // 임시: 3초 후 자동 종료
      setTimeout(() => {
        setIsListening(false);
        addMessage("assistant", "음성 인식이 종료되었습니다.");
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-160px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <ChefHat className="w-6 h-6 text-green-600" />
              <h1>{recipe.name} 조리 중</h1>
            </div>
            {currentStep > 0 && currentStep <= cookingSteps.length && (
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStep / cookingSteps.length) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {currentStep}/{cookingSteps.length} 단계
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area - 스크롤 형식으로 대화 내용 표시 */}
        <Card className="flex-1 flex flex-col mb-6 overflow-hidden">
          {/* Messages Area - 스크롤 가능 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-[#A5B68D] text-white"
                      : "bg-white border-2 border-gray-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - 고정 */}
          <CardContent className="border-t p-4 flex-shrink-0 bg-card">
            <div className="flex gap-2">
              <Button
                variant={isListening ? "default" : "outline"}
                size="icon"
                onClick={toggleVoiceRecognition}
                className="flex-shrink-0"
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="질문하거나 '다음'이라고 입력하세요..."
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-600 bg-white"
              />
              <Button onClick={handleSendMessage} className="flex-shrink-0">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={onBack}
            className="flex-1"
          >
            요리 중단
          </Button>
          <Button
            size="lg"
            onClick={onConfirm}
            disabled={!isComplete}
            className="flex-1 bg-[#A5B68D] hover:bg-[#8fa072]"
          >
            {isComplete ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                요리 완료
              </>
            ) : (
              "조리 진행 중..."
            )}
          </Button>
        </div>

        {hasAllergens && currentStep === 0 && (
          <Alert className="mt-4 border-2 border-red-500 bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800">
              이 레시피에는 {allergenIngredients.map(ing => ing.allergenType).join(', ')}이(가) 포함되어 있습니다.
              알러지가 있으시다면 요리를 중단해주세요.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}