/**
 * MAKI 會議積分兌換獎項目錄 (Prize Catalog with Full EN/ZH Localization)
 */
export const PRIZE_CATALOG = [
  {
    id: 'p1',
    name: '星巴克VIP候機室',
    nameEn: 'Starbucks VIP Lounge Access',
    desc: '飲料券 $170',
    descEn: '$170 Starbucks Beverage Voucher',
    points: 120,
    icon: '☕'
  },
  {
    id: 'p2',
    name: '任意門轉機時光',
    nameEn: 'Anywhere Door 1-Hour Early Leave',
    desc: '提早下班一小時公假',
    descEn: 'Leave work 1 hour early with paid leave',
    points: 300,
    icon: '🏃'
  },
  {
    id: 'p3',
    name: '威秀機上娛樂系統',
    nameEn: 'Vieshow Cinema Ticket & Snacks',
    desc: '電影票 + 餐飲兌換券',
    descEn: '1 Movie Ticket + Food & Beverage Voucher',
    points: 370,
    icon: '🎬'
  },
  {
    id: 'p4',
    name: '陶板屋米其林機上餐',
    nameEn: 'Tokiya Michelin Gourmet Dining',
    desc: '陶板屋和風創作料理套餐券',
    descEn: 'Full Japanese Fusion Set Meal Voucher',
    points: 650,
    icon: '🍱'
  },
  {
    id: 'p5',
    name: '澤也東方頭等艙尊榮SPA',
    nameEn: 'Zeye First-Class Essential Oil SPA',
    desc: '50分鐘精油舒壓 SPA 療程',
    descEn: '50-Minute Deluxe Essential Oil Relaxation SPA',
    points: 750,
    icon: '💆'
  }
];

export const POINT_VALUES = {
  ASK_FIRST: 30, // 搶答/率先發問
  ASK: 10,       // 一般發問/補充
  REPLY: 3       // 回答
};
