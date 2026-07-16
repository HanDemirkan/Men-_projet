export interface MockNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: "1",
    title: "Hoş geldiniz",
    description: "Panel arayüzünüz kullanıma hazır.",
    time: "2 dk önce",
    read: false,
  },
  {
    id: "2",
    title: "Bakım bildirimi",
    description: "Bu sürümde henüz canlı veri bulunmuyor.",
    time: "1 sa önce",
    read: false,
  },
  {
    id: "3",
    title: "Sürüm notu",
    description: "Sprint 1: ürün arayüzü temeli yayınlandı.",
    time: "Dün",
    read: true,
  },
];
