// 마을 내용 전부가 이 파일에 있어요. 그림·문구·위치를 바꿀 때는 여기만 고치면 됩니다.
window.VILLAGE = {
  season: 2026,
  previewUnlock: true,          // 시제품용: 12월 1일 전에도 1일 칸이 열리고, 설정에 "하루 넘기기"가 보임. 실제 배포 때 false

  // 장면 = 옆으로 긴 거리 그림 한 장(가로 2350 × 세로 224). 아래 x·y는 모두 이 그림 안의 위치(왼쪽 위가 0,0).
  // 작업표시줄 위에 화면 왼쪽 끝부터 오른쪽 끝까지 띠처럼 놓임.
  scene: { w: 2350, h: 224 },
  strip: true, fitH: .22,                                              // fitH: 띠 높이가 화면 높이의 이 비율을 넘지 않게
  snowImg: 'village_snow.png', snowDayImg: 'village_snow_day.png', snowGrid: [228, 28],
  cutImg: 'village_cut.webp', cutSnowImg: 'village_snow_cut.png', dayImg: 'village_day.jpg', dayCutImg: 'village_day_cut.webp',   // 낮 그림은 밤 그림 위에 겹쳐서 시간에 따라 나타남
  // 하늘을 뺀 그림(집과 눈밭만). 설정의 "하늘"이 '빼기'일 때 씀

  // 그림 위에 따로 올린 것들. base는 바닥에서 띄운 높이(224 - y), z는 앞뒤 순서.
  sprites: [
    { id: 'island', img: 'village.jpg', x: 1175, base: 0, h: 224, z: 1,
      smokes: [{ x: 0.365, y: .1 }, { x: 0.456, y: .12 }, { x: 0.529, y: .14 }, { x: 0.772, y: .12 }, { x: 0.881, y: .16 }] },
    // 광장 양옆의 나무들: 집이 끊긴 자리를 가려 줌
    { id: 'table', img: 'table.png', x: 1556, base: 32, h: 50, z: 424 },                 // 트리 옆 피크닉 탁자. 코코아·촛불·쿠키가 여기 놓임
    { id: 'tree', img: 'tree_cut.png', x: 1426, base: 38, h: 236, z: 425 },
    { id: 'mailbox', img: 'mailbox.png', x: 1336, base: 30, h: 50, z: 426 },          // 빨간 우체통(탁자와 오른쪽 나무 사이)
  ],
  mailbox: { x: 1336, y: 194, w: 30, h: 50 },                            // 우체통 누르는 자리(위 그림과 같은 곳)
  // 트리를 크게 보는 화면: 따로 그린 큰 트리 그림. tx·ty·tw·th = 그 안에서 트리가 차지하는 자리(비율)
  treeView: { img: 'treeview.jpg', imgDay: 'treeview_day.jpg', ratio: 2, tx: 0.3451, ty: 0.0835, tw: 0.331, th: 0.8548 },

  // 달력 칸 24개: 숫자가 붙는 창문의 위치(x, y)와 그 창문 불빛 그림(win_01~24.png)이 놓일 자리(lx, ly, lw, lh). 순서대로 1일 … 24일.
  cells: [
    { x: 1908.3, y: 85.3, lx: 1899.3, ly: 72.7, lw: 18.0, lh: 25.3 }, { x: 2092.3, y: 78.0, lx: 2083.3, ly: 68.0, lw: 18.0, lh: 20.0 }, { x: 1906.3, y: 117.7, lx: 1896.7, ly: 106.7, lw: 19.3, lh: 22.0 },
    { x: 1794.3, y: 72.7, lx: 1784.7, ly: 60.0, lw: 19.3, lh: 25.3 }, { x: 1065.3, y: 115.3, lx: 1056.7, ly: 102.0, lw: 17.3, lh: 26.7 }, { x: 1867, y: 85.3, lx: 1856.7, ly: 72.7, lw: 20.7, lh: 25.3 },
    { x: 1178.7, y: 106.3, lx: 1170, ly: 92.0, lw: 17.3, lh: 28.7 }, { x: 2113.3, y: 113.3, lx: 2104.7, ly: 98.7, lw: 17.3, lh: 29.3 }, { x: 1986.3, y: 126.7, lx: 1977.3, ly: 114.7, lw: 18.0, lh: 24.0 },
    { x: 911, y: 115.3, lx: 902, ly: 98.7, lw: 18.0, lh: 33.3 }, { x: 1047, y: 75.0, lx: 1039.3, ly: 65.3, lw: 15.3, lh: 19.3 }, { x: 1762, y: 117.3, lx: 1753.3, ly: 104.0, lw: 17.3, lh: 26.7 },
    { x: 1117.3, y: 103.3, lx: 1108, ly: 89.3, lw: 18.7, lh: 28.0 }, { x: 854.7, y: 114.0, lx: 846.7, ly: 97.3, lw: 16.0, lh: 33.3 }, { x: 2166, y: 113.3, lx: 2156.7, ly: 98.7, lw: 18.7, lh: 29.3 },
    { x: 1945, y: 85.3, lx: 1935.3, ly: 72.7, lw: 19.3, lh: 25.3 }, { x: 1867, y: 116.7, lx: 1856.7, ly: 103.3, lw: 20.7, lh: 26.7 }, { x: 2016.3, y: 127.0, lx: 2007.3, ly: 115.3, lw: 18.0, lh: 23.3 },
    { x: 997, y: 117.3, lx: 988.7, ly: 104.7, lw: 16.7, lh: 25.3 }, { x: 2136.3, y: 109.3, lx: 2126.7, ly: 96.0, lw: 19.3, lh: 26.7 }, { x: 1945, y: 121.3, lx: 1936, ly: 108.7, lw: 18.0, lh: 25.3 },
    { x: 972.7, y: 81.7, lx: 962, ly: 70.7, lw: 21.3, lh: 22.0 }, { x: 838.3, y: 67.7, lx: 830.7, ly: 56.0, lw: 15.3, lh: 23.3 }, { x: 1823.7, y: 117.7, lx: 1814.7, ly: 102.7, lw: 18.0, lh: 30.0 },
  ],
  star: { x: 1476, y: -64 },     // 25일 칸: 트리 꼭대기

  // 트리에 장식이 달리는 기본 자리 24곳(트리 그림 안에서의 비율). 나중에 끌어서 옮길 수 있음.
  slots: [
    { x: .50, y: .37 }, { x: .36, y: .61 }, { x: .41, y: .27 }, { x: .57, y: .72 }, { x: .58, y: .50 }, { x: .50, y: .80 },
    { x: .67, y: .41 }, { x: .22, y: .64 }, { x: .50, y: .17 }, { x: .71, y: .74 }, { x: .74, y: .53 }, { x: .63, y: .82 },
    { x: .60, y: .29 }, { x: .80, y: .65 }, { x: .43, y: .48 }, { x: .16, y: .76 }, { x: .50, y: .59 }, { x: .34, y: .39 },
    { x: .38, y: .81 }, { x: .28, y: .51 }, { x: .30, y: .73 }, { x: .65, y: .62 }, { x: .86, y: .77 }, { x: .44, y: .70 },
  ],

  // 트리에 달기 어색한 선물(촛불·목도리·썰매 등, 아래 items에서 on: 'ground')이 놓이는 트리 둘레 자리.
  // x는 트리 그림 폭 기준(0 = 트리 왼쪽 끝, 1 = 오른쪽 끝, 그 밖은 트리 옆), y는 트리 높이 기준(1 = 밑동).
  groundSlots: [
    { x: 1.053, y: 0.842 }, { x: 1.172, y: 0.841 }, { x: 1.292, y: 0.838 }, { x: 1.406, y: 0.835 }, { x: 1.192, y: 0.929 }, { x: 1.39, y: 0.917 },      // 탁자 위 네 자리, 긴 의자 두 자리
    { x: -0.68, y: 1.0 }, { x: 1.72, y: 1.0 }, { x: -0.42, y: 1.02 }, { x: 1.98, y: 1.02 }, { x: -0.18, y: 1.01 }, { x: 2.25, y: 1.01 }, { x: 0.04, y: 1.03 }, { x: 0.96, y: 1.03 }, { x: -0.58, y: 1.03 }, { x: 2.12, y: 1.03 }, { x: 1.6, y: 1.03 }, { x: -0.3, y: 1.0 }, { x: 2.38, y: 1.0 }, { x: 0.5, y: 1.03 },      // 눈밭: 트리 양옆으로 넓게
  ],


  // 태엽 기차가 다니는 길(거리 앞쪽을 왼쪽 끝 ↔ 오른쪽 끝으로 오감). place: 'pond'인 날의 선물이 여기를 달림
  track: { x1: 1276, x2: 1676, y: 212 },
  roll: { x1: 110, x2: 2240 },   // 눈덩이 굴리기·눈사람 옮기기: 광장 밖 눈 덮인 길까지

  // 고양이가 앉는 자리. 날마다 다음 자리로 옮겨 앉음. f: 0 앉기 / 3 웅크려 자기, k: 크기(멀수록 작게)
  cat: { sheet: 'cat', lines: ['야옹.', '골골골…', '(눈을 가늘게 떠요)', '(꼬리를 한 번 흔들어요)'] },
  catSpots: [
    { x: 846, y: 214, f: 0, k: 1.4 }, { x: 2086, y: 214, f: 3, k: 1.4 }, { x: 1006, y: 214, f: 0, k: 1.4 }, { x: 1966, y: 214, f: 3, k: 1.4 }, { x: 926, y: 214, f: 0, k: 1.4 }, { x: 2146, y: 214, f: 0, k: 1.4 }, { x: 1186, y: 214, f: 3, k: 1.4 }, { x: 1766, y: 214, f: 0, k: 1.4 }, { x: 1086, y: 214, f: 0, k: 1.4 },
  ],



  // 선물 그림들 (assets 폴더의 파일). on: 'ground'는 트리 곁 바닥에 놓이는 것, 없으면 트리에 달리는 것
  items: {
    wreath: { img: 'it_wreath.png', name: '리스' },             candle: { img: 'it_candle.png', name: '촛불', on: 'table' },
    scarf: { img: 'it_scarf.png', name: '목도리', on: 'ground' },             cocoa: { img: 'co_cup.png', name: '코코아', on: 'table' },
    postcard: { img: 'it_postcard.png', name: '마을 엽서', on: 'table' },
    marshmallow: { img: 'mm_gold.png', name: '구운 마시멜로', on: 'table' },
    frost: { img: 'postcard.jpg', name: '성에 그림', on: 'table' },  snowglobe: { img: 'it_snowglobe.png', name: '스노우볼', on: 'table' },
    icecarve: { img: 'ice_1.png', name: '얼음 조각', on: 'ground', s: 1.6 },
    gingerbread: { img: 'gb_base1.png', name: '진저브레드 집', on: 'ground' },  present: { img: 'box_base1.png', name: '포장한 선물', on: 'ground' },
    card: { img: 'card_base1.png', name: '크리스마스 카드', on: 'table' },
    seal: { img: 'stamp_2.png', name: '실링 왁스 봉인', on: 'table' },      wish: { img: 'tag_1.png', name: '소원 쪽지' },
    snowflake: { img: 'it_snowflake.png', name: '종이 눈꽃' },  cookie: { img: 'it_cookie.png', name: '별 쿠키', on: 'table' },
    boots: { img: 'it_boots.png', name: '겨울 장화', on: 'ground' },          bell: { img: 'it_bell.png', name: '종' },
    train: { img: 'it_train.png', name: '장난감 기차', on: 'ground' },        birds: { img: 'it_birds.png', name: '겨울 새' },
    stocking: { img: 'it_stocking.png', name: '양말' },         firewood: { img: 'it_firewood.png', name: '장작', on: 'ground' },
    lights: { img: 'it_lights.png', name: '꼬마전구' }, bow: { img: 'rb_box.png', name: '리본 묶은 선물', on: 'ground' }, bungeo: { img: 'bp_bag.png', name: '붕어빵 봉투', on: 'table' },         musicbox: { img: 'mbox_1.png', name: '오르골', on: 'ground' },
    ball: { img: 'it_ball_red.png', name: '유리 구슬' },        sled: { img: 'sled_1.png', name: '썰매', on: 'ground' },
    holly: { img: 'it_holly.png', name: '호랑가시' },           paperstars: { img: 'it_paperstars.png', name: '종이 별', sMade: 3.2 },
    gift: { img: 'it_gift.png', name: '선물 상자', on: 'ground' },            catnap: { img: 'catc_1.png', name: '낮잠 자는 고양이', on: 'ground' },
    snowman: { img: 'snowman.png', name: '눈사람', on: 'ground' },            garland: { img: 'it_garland.png', name: '가랜드', s: 3.4 },
    birdhouse: { img: 'it_woodbird.png', name: '새집', on: 'ground' },        bow: { img: 'bow.png', name: '빨간 리본' },
    star: { img: 'star_top1.png', name: '별' },
    cake: { img: 'dc_cake.png', name: '크리스마스 케이크', on: 'table' },  mandarin: { img: 'dc_basket.png', name: '귤 바구니', on: 'table' },
    carol: { img: 'dc_choir.png', name: '캐럴 악보', on: 'ground' },  fight: { img: 'dc_fort.png', name: '눈 요새', on: 'ground' },
    shoot: { img: 'dc_shoot.png', name: '별똥별' },
  },

  // 창문을 열면 마을에 늘어나는 장식. 열쇠 = 그날 놀이 이름. x: 가로 자리, y: 바닥(아랫변) 높이, h: 높이 (장면 기준 픽셀)
  decos: {
    fight:    { img: 'dc_fort.png',     x: 522,   y: 207, h: 31 },
    sled:     { img: 'dc_sled.png',     x: 578,  y: 208, h: 42, rot: -8 },
    snowman:  { img: 'dc_snowman.png',  x: 628,  y: 207, h: 36 },
    carol:    { img: 'dc_choir.png',    x: 686,  y: 207, h: 35 },
    wax:      { img: 'dc_letter.png',   x: 742,  y: 207, h: 27 },
    wreath:   { img: 'dc_wreath.png',   x: 830,  y: 186, h: 17 },
    cookie:   { img: 'dc_cookies.png',  x: 868,  y: 207, h: 21 },
    bungeo:   { img: 'dc_cart.png',     x: 920,  y: 207, h: 35 },
    cake:     { img: 'dc_cake.png',     x: 1038,  y: 206, h: 21 },
    snowflake:{ img: 'dc_flakes.png',   x: 1110,  y: 150, h: 14 },
    puzzle:   { img: 'dc_rack.png',     x: 1150,  y: 207, h: 24 },
    mandarin: { img: 'dc_basket.png',   x: 1202,  y: 207, h: 17 },
    bells:    { img: 'dc_bell.png',     x: 1396,  y: 112, h: 17 },
    shoot:    { img: 'dc_shoot.png',    x: 1700, y: 66,  h: 28, sky: true },
    wrap:     { img: 'dc_gifts.png',    x: 1718, y: 207, h: 22 },
    candle:   { img: 'dc_candle.png',   x: 1768, y: 132, h: 23 },
    musicbox: { img: 'dc_musicbox.png', x: 1822, y: 207, h: 21 },
    frost:    { img: 'dc_frost.png',    x: 1880, y: 137, h: 20 },
    globe:    { img: 'dc_globe.png',    x: 1918, y: 207, h: 22 },
    ginger:   { img: 'dc_ginger.png',   x: 1980, y: 207, h: 27 },
    cocoa:    { img: 'dc_cocoa.png',    x: 2034, y: 207, h: 14 },
    bauble:   { img: 'dc_baubles.png',  x: 2090, y: 150, h: 22 },
    ice:      { img: 'dc_swan.png',     x: 2132, y: 207, h: 27 },
    pstars:   { img: 'dc_pstar.png',    x: 2180, y: 207, h: 39 },
  },

  // 이야기 편지를 보내는 마을 사람들
  people: {
    mail:  { name: '우체부 아저씨', img: 'pp_mail.png' },   baker: { name: '빵집 할머니', img: 'pp_baker.png' },
    nuni:  { name: '꼬마 눈이', img: 'pp_nuni.png' },       cat:   { name: '고양이 귤', img: 'pp_cat.png' },
    bell:  { name: '성당 종지기', img: 'pp_bell.png' },     ice:   { name: '얼음 조각가', img: 'pp_ice.png' },
    bird:  { name: '겨울 새', img: 'pp_bird.png' },          all:   { name: '마을 모두', img: 'pp_mail.png' },
  },
  // 이야기 편지: 창문을 연 날짜 순서대로 모두에게 똑같이 와요 (트리 꼭대기 별이 사라진 이야기)
  letters: {
    1:  { by: 'mail',  text: ['어서 와요, 새 이웃! 이 마을 편지는 다 내가 날라요.', '그런데 큰일이 났어요. 어젯밤 광장 트리 꼭대기의 별이 감쪽같이 사라졌대요. 크리스마스 전까지 찾을 수 있을까요?'] },
    2:  { by: 'baker', text: ['축제 준비로 빵집이 정신이 없네요.', '별 걱정은 잠깐 내려놓고, 따뜻한 거 한 잔 하고 가요. 찾는 일도 배가 든든해야 하는 법이에요.'] },
    3:  { by: 'nuni',  text: ['있잖아요, 나 어젯밤에 봤어요!', '반짝이는 게 트리 위에서 하늘로 휙 날아갔어요. 꿈 아니에요. 진짜예요!'] },
    4:  { by: 'cat',   text: ['(편지지에 발자국이 찍혀 있어요)', '야옹. 범인은 내가 아니다옹. 나는 밤새 난로 옆에서 잤다옹.'] },
    5:  { by: 'mail',  text: ['오늘 아침 우체통을 열었더니 안쪽에 반짝이 가루가 묻어 있었어요.', '별에서 떨어진 걸까요? 누가 우체통 위에 앉았다 간 것 같아요.'] },
    6:  { by: 'baker', text: ['별 모양 쿠키를 구웠더니 눈이가 별 생각이 난다며 훌쩍였어요.', '그래서 제일 큰 걸로 하나 쥐여 줬지요. 금방 웃더라고요.'] },
    7:  { by: 'nuni',  text: ['나 오늘부터 별 찾기 일기를 쓸 거예요.', '첫 줄: 반짝이 가루 발견. 범인은 날 수 있다. 고양이 귤은 아님(본인 주장).'] },
    8:  { by: 'bell',  text: ['종탑 꼭대기에 올라가면 마을이 한눈에 보여요.', '오늘도 구석구석 살펴봤는데 별은 안 보였어요. 대신 지붕마다 새들이 유난히 많더군요.'] },
    9:  { by: 'mail',  text: ['이상한 소포가 하나 왔어요. 받는 사람도, 보낸 사람도 안 적혀 있어요.', '열어 볼까 말까 고민 중이에요. 내일 눈이랑 같이 열어 보기로 했어요.'] },
    10: { by: 'nuni',  text: ['소포 안에 뭐가 있었는지 알아요?', '작은 깃털 한 조각이요! 끝이 반짝반짝해요. 새 깃털 같아요. 일기에 붙여 뒀어요.'] },
    11: { by: 'baker', text: ['요즘 새들이 빵 부스러기를 안 먹어요. 뿌려 둬도 그대로예요.', '어디서 배불리 먹고 오는 걸까요? 아니면 바빠서 그럴까요.'] },
    12: { by: 'cat',   text: ['(발자국 편지)', '새들 수상하다옹. 밤마다 능수버들 쪽으로 날아간다옹. 쫓아가려다 추워서 그만뒀다옹.'] },
    13: { by: 'ice',   text: ['별이 없어서 트리가 쓸쓸해 보이길래요.', '광장에 얼음으로 별을 하나 깎아 볼까 해요. 햇빛을 받으면 꽤 반짝일 거예요.'] },
    14: { by: 'nuni',  text: ['얼음 별은 예쁜데요, 낮이 되니까 뚝뚝 녹았어요.', '역시 진짜 별이 있어야 해요. 포기 안 할 거예요.'] },
    15: { by: 'bell',  text: ['새벽에 종을 치러 올라갔다가 봤어요.', '마을 끝 능수버들 쪽에서 무언가 반짝, 반짝 빛나더군요. 별빛이랑 똑같은 색이었어요.'] },
    16: { by: 'mail',  text: ['썰매를 타고 능수버들까지 가 봤어요.', '그런데 눈이 너무 깊어서 중간에 돌아왔어요. 날씨가 좀 풀리면 다시 가 볼게요.'] },
    17: { by: 'baker', text: ['어제는 다 같이 난로 옆에 모여 고구마를 구워 먹으며 회의를 했어요.', '결론은요, 새들한테 직접 물어보자는 거예요. 새랑 말이 통할지는 모르겠지만요.'] },
    18: { by: 'nuni',  text: ['좋은 생각이 났어요!', '새 모이를 두면 새들이 고마워서 길을 알려 줄지도 몰라요. 내 간식 해바라기씨를 다 가져다 놨어요.'] },
    19: { by: 'bird',  text: ['(깃털로 쓴 삐뚤빼뚤한 글씨예요)', '짹짹. 미안해요. 둥지의 아기 새들이 너무 추워서… 반짝이고 따뜻한 걸 잠깐 빌렸어요.'] },
    20: { by: 'cat',   text: ['(발자국 편지)', '거봐라, 내 말이 맞지옹. 이제 나한테 생선 한 마리씩 줘야 한다옹.'] },
    21: { by: 'baker', text: ['그랬구나, 아기 새들이 추웠구나.', '그럼 우리가 따뜻한 둥지를 만들어 주면 어떨까요? 그러면 별을 돌려줄 수 있을 거예요.'] },
    22: { by: 'nuni',  text: ['오늘 마을 사람들이 다 같이 뜨개질을 했어요!', '빵집 할머니가 제일 빨랐고요, 우체부 아저씨는 세 번이나 실을 엉켰어요. 둥지 덮개가 완성됐어요.'] },
    23: { by: 'bird',  text: ['(깃털 글씨)', '고마워요, 고마워요. 아기 새들이 이제 하나도 안 추워요. 내일 아침에 별을 돌려드릴게요.'] },
    24: { by: 'mail',  text: ['소식이에요! 아침에 새들이 다 같이 별을 물고 날아왔어요.', '반짝반짝 그대로예요. 내일, 크리스마스에 다 같이 트리에 달아요. 꼭 와요!'] },
    25: { by: 'all',   text: ['별을 달았어요. 메리 크리스마스!', '한 달 동안 같이 찾아 줘서 고마워요. 오늘 광장에서 파티를 해요. 당신 자리도 마련해 뒀어요.'] },
  },

  // 날마다 열리는 칸의 내용. gift: 위 items의 이름, text: 짧은 편지(문단마다 한 줄), from: 보낸 곳
  // play: 그날 해 보는 놀잇감(play.js의 이름). steam: 만들고 나면 김이 남. place: 'pond'면 트리 대신 연못 둘레에 놓임
  intro: '어서 와요. 오늘부터 스물네 개의 창문이 하루에 하나씩 열려요. 무엇이 나올지는 열어 봐야 알아요.',
  days: {
    1:  { gift: 'snowflake',  title: '종이 눈꽃',          from: '장난감 가게에서', play: 'snowflake',
          text: ['종이와 가위를 넣어 뒀어요.', '접힌 종이를 오려서 눈꽃을 만들어 보세요. 똑같은 모양은 하나도 없대요.'] },
    2:  { gift: 'cocoa',      title: '코코아 한 잔',       from: '빵집에서', play: 'cocoa', steam: true,
          text: ['우유를 데워 뒀어요. 가루를 넣고 잘 저어서 마시멜로를 띄워 보세요.', '식기 전에 두 손으로 컵을 쥐어 보세요. 그것도 쉬는 일이에요.'] },
    3:  { gift: 'snowman',    title: '눈사람 재료',        from: '빵집에서', play: 'snowman', place: 'street',
          text: ['밤새 눈이 넉넉히 쌓였어요. 당근이랑 숯, 모자를 챙겨 뒀어요.', '거리에서 눈덩이를 굴려 눈사람을 세워 보세요. 삐뚤어도 괜찮아요.'] },
    4:  { gift: 'wreath',     title: '문에 거는 리스',     from: '꽃집에서', play: 'wreath',
          text: ['전나무 가지를 둥글게 엮었어요.', '초록이 하나 걸리면 겨울도 조금 따뜻해 보이거든요.'] },
    5:  { gift: 'candle',     title: '작은 불빛',          from: '서점에서', play: 'candle',
          text: ['해가 일찍 지는 계절이에요. 그래서 작은 불빛이 더 반가워요.', '성냥을 그어 촛불을 켜고, 오늘 저녁엔 잠깐 쉬어 가요.'] },
    6:  { gift: 'cookie',     title: '쿠키 반죽',          from: '빵집에서', play: 'cookie',
          text: ['반죽을 밀어 뒀어요. 틀로 찍고, 굽고, 아이싱으로 그림을 그려 보세요.', '모양이 조금씩 달라도 맛은 같아요. 하나는 내일의 나에게 남겨 두세요.'] },
    7:  { gift: 'gingerbread', title: '과자로 지은 집',     from: '빵집에서', play: 'ginger',
          text: ['생강 과자로 작은 집을 구웠어요. 아직 아무 장식이 없어요.', '사탕을 붙여서 세상에 하나뿐인 집으로 만들어 주세요. 몇 개쯤은 먹어도 몰라요.'] },
    8:  { gift: 'bell',       title: '정각의 종',          from: '시계방에서', play: 'bells',
          text: ['정각마다 한 번씩 울리는 종이에요.', '소리가 들리면 하던 일을 잠깐 멈추고 창밖을 봐 주세요.'] },
    9:  { gift: 'present',    title: '포장을 기다리는 선물', from: '옷가게에서', play: 'wrap',
          text: ['밤새 뜬 목도리를 상자에 담았어요. 포장만 남았어요.', '포장지를 고르고 리본을 묶어 주세요. 누구에게 줄지는 천천히 정해도 돼요.'] },
    10: { gift: 'postcard',   title: '조각난 엽서',        from: '서점에서', play: 'puzzle',
          text: ['마을을 그린 엽서가 그만 조각조각 흩어졌어요.', '천천히 하나씩 맞춰 보세요. 다 맞추면 엽서는 당신 거예요.'] },
    11: { gift: 'seal',       title: '실링 왁스',          from: '문구점에서', play: 'wax',
          text: ['봉투를 봉할 때 쓰는 왁스 알갱이와 놋쇠 도장을 넣어 뒀어요.', '촛불에 녹여서 한 가지 색으로, 여러 색을 섞어서, 도장 홈에 색을 칠해서도 찍을 수 있어요. 내 문양으로 도장을 만들 수도 있고요.'] },
    12: { gift: 'frost',      title: '창문의 성에',        from: '산장에서', play: 'frost',
          text: ['밤새 추워서 창문에 하얗게 성에가 꼈어요.', '손가락으로 쓱쓱 그림을 그려 보세요. 입김을 후~ 불면 다시 뿌예져요.'] },
    13: { gift: 'bungeo',     title: '붕어빵',             from: '시계방에서', play: 'bungeo',
          text: ['골목 어귀에 붕어빵 틀이 놓여 있어요.', '반죽을 붓고 팥을 넣어 노릇노릇 구워 봐요.'] },
    14: { gift: 'musicbox',   title: '오르골',             from: '장난감 가게에서', play: 'musicbox',
          text: ['뚜껑을 열면 짧은 노래가 한 번 흘러요.', '끝까지 듣는 데 일 분이면 돼요. 오늘의 일 분을 드려요.'] },
    15: { gift: 'ball',       title: '유리 구슬',          from: '장난감 가게에서', play: 'bauble',
          text: ['막 색을 칠해서 아직 반짝거려요.', '트리에서 제일 마음에 드는 자리에 달아 주세요.'] },
    16: { gift: 'sled',       title: '빨간 썰매',          from: '언덕 위 작은 집에서', play: 'sled',
          text: ['언덕 위에서 타면 금방 내려와요.', '올라가는 길이 길어도 괜찮아요. 내려오는 재미가 있으니까요.'] },
    17: { gift: 'cake',      title: '크리스마스 케이크',   from: '빵집에서', play: 'cake',
          text: ['동그란 빵을 구워 돌림판 위에 올려 뒀어요.', '돌림판을 돌리며 생크림을 바르고, 마음에 드는 장식을 올려 보세요.'] },
    18: { gift: 'paperstars', title: '색종이',             from: '서점에서', play: 'pstars',
          text: ['알록달록 색종이를 한 묶음 넣어 뒀어요.', '하트, 강아지, 고양이, 여우를 접어서 실에 꿰면 트리 장식 줄이 돼요.'] },
    19: { gift: 'snowglobe',  title: '흔들리는 선물 상자',  from: '장난감 가게에서', play: 'globe',
          text: ['상자를 흔들면 안에서 사락사락 소리가 나요.', '풀어 보니 스노우볼이에요. 흔들어 보세요. 눈이 다 가라앉을 때까지 가만히 보고 있어도 좋아요.'] },
    20: { gift: 'mandarin',  title: '귤 한 바구니',        from: '과일 가게에서', play: 'mandarin',
          text: ['겨울엔 역시 귤이죠. 한 바구니 담아 왔어요.', '껍질을 천천히 까 보세요. 잘 까면 껍질이 재미있는 모양이 된대요.'] },
    21: { gift: 'icecarve',   title: '광장의 얼음 덩어리',  from: '대장간에서', play: 'ice',
          text: ['광장에 커다란 얼음 덩어리를 가져다 놨어요.', '끌로 톡톡 쳐서 조각을 만들어 보세요. 살살 치면 조금씩, 세게 치면 크게 떨어져요.'] },
    22: { gift: 'carol',     title: '캐럴 악보',           from: '성당에서', play: 'carol',
          text: ['저녁마다 아이들이 골목을 돌며 캐럴을 불러요.', '오늘은 함께 박자를 맞춰 볼래요? 종소리에 맞춰 누르면 노래가 이어져요.'] },
    23: { gift: 'fight',     title: '눈싸움 하는 날',      from: '꼬마 눈이가', play: 'fight',
          text: ['밤새 눈이 폭신하게 쌓였어요. 눈 요새도 지어 놨어요!', '눈덩이를 뭉쳐서 과녁 눈사람 모자를 맞혀 봐요.'] },
    24: { gift: 'shoot',     title: '별똥별이 떨어지는 밤', from: '성당 종지기가', play: 'shoot',
          text: ['오늘 밤엔 별똥별이 많이 떨어진대요.', '별똥별이 지나갈 때 눌러서 소원을 빌어 보세요. 꼭 하나는 이뤄질 거예요.'] },
    25: { gift: 'star',       title: '메리 크리스마스',    from: '마을 모두가', play: 'star',
          text: ['하루에 하나씩 달아 온 장식 위에 오늘 별이 올라가요.', '올겨울, 당신의 마을이 완성됐어요.'] },
  },
};
