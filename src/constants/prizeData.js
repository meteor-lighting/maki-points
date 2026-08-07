/**
 * MAKI 會議積分兌換獎項目錄 (Prize Catalog)
 */
export const PRIZE_CATALOG = [
  {
    id: 'p1',
    name: '星巴克VIP候機室',
    enName: 'Starbucks VIP Lounge',
    desc: '飲料券 $170 (Beverage Voucher $170)',
    points: 120,
    icon: '☕'
  },
  {
    id: 'p2',
    name: '任意門轉機時光',
    enName: 'Express Transit Time',
    desc: '提早下班一小時公假 (Leave 1-Hour Early)',
    points: 300,
    icon: '🏃'
  },
  {
    id: 'p3',
    name: '威秀機上娛樂系統',
    enName: 'Vieshow In-Flight Ent.',
    desc: '電影票+餐飲兌換券 (Movie + F&B Voucher)',
    points: 370,
    icon: '🎬'
  },
  {
    id: 'p4',
    name: '陶板屋米其林機上餐',
    enName: 'Tokiya Premium Meal',
    desc: '套餐券 (Set Meal Voucher)',
    points: 650,
    icon: '🍱'
  },
  {
    id: 'p5',
    name: '澤也東方頭等艙尊榮SPA',
    enName: 'Zeyan First-Class SPA',
    desc: '50分鐘精油舒壓 SPA (50min SPA)',
    points: 750,
    icon: '💆'
  }
];

export const POINT_VALUES = {
  ASK_FIRST: 30, // 搶答/率先發問
  ASK: 10,       // 一般發問/補充
  REPLY: 3       // 回答
};
