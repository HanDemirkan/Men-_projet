export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "QR Platform tam olarak ne yapar?",
    answer:
      "Dijital menü, sipariş, kasa, garson ve mutfak ekranlarını tek bir yönetim panelinden yönetmenizi sağlayan bir işletme operasyon platformudur.",
  },
  {
    question: "Birden fazla şubem varsa kullanabilir miyim?",
    answer:
      "Evet. Süper admin panelinden tüm işletmelerinizi, işletme panelinden ise tek bir işletmenin tüm şubelerini yönetebilirsiniz.",
  },
  {
    question: "Kurulum ne kadar sürer?",
    answer:
      "Menünüzü yükleyip QR kodlarınızı oluşturduktan sonra dakikalar içinde kullanmaya başlayabilirsiniz.",
  },
  {
    question: "Garson ve mutfak ekranları ayrı mı çalışır?",
    answer:
      "Evet, her rol kendi ihtiyacına göre tasarlanmış ayrı bir panel görür; garson masaları yönetir, mutfak yalnızca sipariş kuyruğunu görür.",
  },
  {
    question: "Verilerim güvende mi?",
    answer:
      "Her işletmenin verisi birbirinden tamamen izole edilir; yetkilendirme ve erişim kontrolü yalnızca sunucu tarafında uygulanır.",
  },
];
