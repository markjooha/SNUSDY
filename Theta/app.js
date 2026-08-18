const intro = document.querySelector('#intro');
const introWorld = document.querySelector('#introWorld');
const introScreens = [...document.querySelectorAll('[data-intro-screen]')];
const introLandingStart = document.querySelector('#introLandingStart');
const introStart = document.querySelector('#introStart');
const introPhotoFrame = document.querySelector('#introPhotoFrame');
const introPhotoStage = document.querySelector('.intro-photo-stage');
const introSkipButtons = [...document.querySelectorAll('[data-intro-skip]')];
const aboutChoice = document.querySelector('#aboutChoice');
const mapChoice = document.querySelector('#mapChoice');
const aboutBack = document.querySelector('#aboutBack');
const landing = document.querySelector('#landing');
const mapPage = document.querySelector('#mapPage');
const enterMap = document.querySelector('#enterMap');
const landingMap = document.querySelector('.landing-map');
const viewport = document.querySelector('#mapViewport');
const canvas = document.querySelector('#mapCanvas');
const uiLayer = document.querySelector('#uiLayer');
const coordinates = document.querySelector('#coordinates');
const indexTrigger = document.querySelector('#indexTrigger');
const mapBack = document.querySelector('#mapBack');
const zoomReset = document.querySelector('#zoomReset');
const zoomIn = document.querySelector('#zoomIn');
const zoomOut = document.querySelector('#zoomOut');
const mapScaleIndicator = document.querySelector('#mapScaleIndicator');
const mapScaleValue = document.querySelector('#mapScaleValue');
const indexOverlay = document.querySelector('#indexOverlay');
const closeIndex = document.querySelector('#closeIndex');
const indexRows = [...document.querySelectorAll('[data-index-building]')];
let mapArt = canvas.querySelector('.map-art');
let buildingOverlays = [];
let activeBuildingId = null;
let indexHoveredBuildingId = null;
let scenarioOneOverlay = null;
let scenarioOneIsOpen = false;
let scenarioOneIsClosing = false;
let scenarioOneCountFrame = 0;
let scenarioOneTimers = [];
let scenarioOneScrollDrag = null;
let scenarioTwoOverlay = null;
let scenarioTwoIsOpen = false;
let scenarioTwoIsClosing = false;
let scenarioTwoCountFrame = 0;
let scenarioTwoTimers = [];
let scenarioTwoScrollDrag = null;
let scenarioTwoMainRequested = false;
let activeEmbeddedScenarioId = null;
let embeddedScenarioClosing = false;
let embeddedScenarioCloseTimer = 0;
const embeddedScenarioOverlays = new Map();

const FIGMA = { width: 1920, height: 1080, mapWidth: 8054, mapHeight: 7449 };
// Each v2 layer has its map origin marked at the same red center point. The marker is
// excluded from the rendered map layers; this is the common reference point used here.
const MAP_ORIGIN = { x: 4018.39162, y: 4197.871091 };
const MAP_V2 = {
  viewBox: 8577.66,
  origin: { x: 4288.83, y: 4288.83 },
  mainBorder: { x: 4284.62, y: 4286.66, radius: 978.35 },
};
// Match the new MainBorder to the former main-area diameter while preserving circles.
const MAP_V2_SCALE = (2427.280517578125 / 2) / MAP_V2.mainBorder.radius;
const MAP_V2_OFFSET = {
  x: MAP_ORIGIN.x - MAP_V2.origin.x * MAP_V2_SCALE,
  y: MAP_ORIGIN.y - MAP_V2.origin.y * MAP_V2_SCALE,
};
const MAP_BORDER = {
  x: MAP_V2_OFFSET.x + (MAP_V2.mainBorder.x - MAP_V2.mainBorder.radius) * MAP_V2_SCALE,
  y: MAP_V2_OFFSET.y + (MAP_V2.mainBorder.y - MAP_V2.mainBorder.radius) * MAP_V2_SCALE,
  width: MAP_V2.mainBorder.radius * 2 * MAP_V2_SCALE,
  height: MAP_V2.mainBorder.radius * 2 * MAP_V2_SCALE,
};
const CAMERA_BOUNDARY = {
  x: MAP_BORDER.x + MAP_BORDER.width / 2,
  y: MAP_BORDER.y + MAP_BORDER.height / 2,
  radius: Math.min(MAP_BORDER.width, MAP_BORDER.height) * .5 * .8,
};
// Positions are solved from the matching paths in 3-Components.svg. Most of the
// exported Build files use a .806x local coordinate scale; Build-11 is 1:1.
const BUILDINGS = [
  { id: 1, name: '대원 빌라', base: [55, 65], map: [.80606153, .80608662, 4416.846683, 5020.008347], hover: [80, 90, 12.4927, 12.232091] },
  { id: 2, name: '우성현대아파트', base: [194, 307], map: [.80603608, .80604222, 4386.592536, 4396.614535], hover: [219, 332, 12.5266, 12.507] },
  { id: 3, name: '우성구청', base: [177, 201], map: [.80607508, .80602342, 4073.62167, 4484.164528], hover: [203, 228, 13.0859, 13.105] },
  { id: 4, name: '신금역 3번출구 포장마차', base: [224, 223], map: [.80599094, .80601241, 3573.51341, 4151.350915], hover: [250, 250, 13.22, 13.1597] },
  { id: 5, name: '힐스테이트 방안 센트럴', base: [401, 281], map: [.80606261, .8060285, 4618.405275, 3963.507195], hover: [427, 307, 13.069, 13.0712] },
  { id: 6, name: '방안근린공원', base: [370, 304], map: [.80600155, .80600216, 3814.964696, 4305.554823], hover: [398, 329, 14.504, 12.912] },
  { id: 7, name: '비에이원시스템', base: [233, 208], map: [.80603199, .80601827, 3651.363458, 4513.046951], hover: [260, 233, 13.194, 12.2549] },
  { id: 8, name: '우리24 방안점', base: [65, 75], map: [.80604852, .80608561, 4787.909478, 4768.174284], hover: [90, 99, 12.4599, 12.5218] },
  { id: 9, name: 'F2F 디자인 스튜디오', base: [131, 140], map: [.80594769, .80601823, 4203.258419, 4088.393546], hover: [158, 166, 13.0757, 13.1374] },
  { id: 10, name: '한국이슬람교 제안성원', base: [100, 108], map: [.80606219, .8060623, 3498.435519, 4582.942237], hover: [126, 134, 12.9526, 12.8736] },
  { id: 11, name: '방안 제4재정비촉진구역', base: [355, 413], map: [.99999953, .99999992, 4905.051133, 4365.017026], hover: [381, 440, 12.869652, 13.267] },
  { id: 12, name: '방안동 문화거리', base: [98, 92], map: [.80606244, .8060217, 3836.042932, 3590.45266], hover: [125, 118, 13.0947, 13.024101] },
];

// Each entry follows the corresponding 420 × 1080 Figma Build Overlay frame.
// The photo is the supplied, per-building PNG; all surrounding UI stays editable HTML/CSS.
const BUILDING_OVERLAY_CONTENT = [
  { id: 1, category: '빌라', address: '서울 우성구 방안로36번길 21', meta: [43, 81, 90], image: [45, 182, 330, 248], summary: [45, 456, '서울특별시 우성구 방안동에 위치한 빌라.'], facts: [['준공', '1986.07'], ['종류', '다세대'], ['면적', '70.7㎡ ~ 83.13㎡'], ['규모', '44세대 / 총 11개동 / 총 3층'], ['시세', '매매가 62,308 ~ 65,353만원'], ['매물', '매매0 전세0 월세0']], detail: [45, 508, 333] },
  { id: 2, category: '아파트', address: '서울 우성구 우성방안로271', meta: [48, 96, 105], image: [45, 182, 330, 261], summary: [45, 469, '서울특별시 우성구 방안동에 위치한 아파트.'], facts: [['준공', '1993.11'], ['종류', '아파트'], ['면적', '84.47㎡ ~ 197.21㎡'], ['규모', '1628세대 / 총 14개동 / 총 19층'], ['시세', '매매가 140,000 ~ 215,000만원'], ['전세가', '57,000 ~ 112,000만원'], ['매물', '매매24 전세0 월세1']], detail: [49, 528, 333] },
  { id: 3, category: '구청', address: '서울 우성구 대우로 179 우성구청', meta: [45, 81, 90], image: [49, 182, 329, 247], summary: [49, 455, '서울특별시 방안동에 위치한 공공기관.'], description: ['지역 주민을 대상으로 민원·복지·도시계획·건축·교통·환경 등 생활과 밀접한 다양한 행정 서비스를 제공하며, 지역의 주요 공공업무를 담당하고 있다.', '특히 지역 내 개발 및 정비사업의 인허가와 관리, 주민 민원 조정 등의 역할을 수행하며, 지역 주민과 행정을 연결하고 지역의 주요 현안을 조정하는 행정 중심 공간으로 기능한다.'], detail: [53, 514, 333] },
  { id: 4, category: '포장마차', address: '서울 우성구 제안로2길(신금역 3번출구 앞)', meta: [45, 107, 118], image: [47, 182, 330, 374], summary: [47, 582, '서울특별시 방안동 신금역 3번 출구 인근에 위치했던 소규모 포장마차.'], description: '오랜 기간 지역 주민과 상인들이 찾던 장소로, 신금역 주변의 일상적인 거리 풍경을 형성해 왔다. 구청의 철거 조치에 따라 2025년 2월 강제 철거되었으며, 현재는 운영되지 않는다.', detail: [48, 660, 333] },
  { id: 5, category: '아파트', address: '서울 우성구 방안길 15', meta: [45, 95, 104], image: [53, 182, 330, 248], summary: [49, 456, '서울특별시 우성구 방안동에 위치한 아파트.'], facts: [['준공', '2023.05'], ['종류', '아파트'], ['면적', '126.3㎡ ~ 225.15㎡'], ['규모', '1078세대 / 총 13개동 / 총 15층'], ['시세', '매매가 165,000 ~ 190,000만원'], ['전세가', '80,000 ~ 100,000만원'], ['매물', '매매21 전세4 월세1']], detail: [53, 508, 333] },
  { id: 6, category: '공원', address: '서울 우성구 방안로271 방안공원관리실', meta: [45, 82, 91], image: [45, 182, 330, 220], summary: [48, 428, '서울특별시 우성구 방안동에 위치한 근린공원.'], description: '총면적은 약 24,800㎡이며, 산책로와 잔디광장, 어린이놀이터, 쉼터 등이 조성되어 있다. 방안동 일대 주거지역의 녹지 공간 확보를 위해 조성되었으며, 인근의 아파트 단지와 초등학교 주민들의 산책과 여가 공간으로 이용되고 있다. 공원은 사방이 왕복 2~4차선 도로로 둘러싸여 있어 보행자 출입구가 여러 곳에 설치되어 있으며, 주변에는 횡단보도와 보행신호등이 마련되어 있다.', detail: [52, 480, 325] },
  { id: 7, category: '기업, 빌딩', address: '서울 우성구 방안로65길', meta: [45, 117, 126], image: [45, 182, 329, 247], summary: [48, 455, '서울특별시 우성구 방안동에 위치한 IT 기업.'], description: '2009년 설립되었으며, 기업용 소프트웨어 개발과 시스템 통합(SI), 정보보안 솔루션 구축 및 IT 유지보수 서비스를 주력 사업으로 하고 있다. 본사는 방안동에 위치하고 있으며, 임직원 약 320명이 근무하는 중형 규모의 기업이다. 공공기관과 지방자치단체, 민간기업을 대상으로 정보시스템 구축 및 운영 사업을 수행하고 있으며, 자체 개발한 보안 및 네트워크 관리 솔루션을 공급하고 있다.', detail: [49, 507, 321] },
  { id: 8, category: '편의점', address: '서울 우성구 방안로141', meta: [45, 95, 104], image: [45, 182, 330, 281], summary: [49, 489, '서울특별시 우성구 장안동에 위치한 24시간 편의점.'], description: '장안동 골목길 인근에 위치해 있으며, 식료품과 생활용품, 즉석조리식품, 택배 접수, ATM, 공과금 수납 등 다양한 편의 서비스를 제공한다. 인근의 주거단지와 공원, 버스정류장과 가까워 유동인구가 많은 점포로, 출퇴근 시간과 심야 시간대 이용객이 많은 것이 특징이다.', detail: [53, 541, 321] },
  { id: 9, category: '디자인 스튜디오', address: '서울 우성구 제안길10-1 1층', meta: [43, 150, 159], image: [45, 182, 330, 247], summary: [43, 455, '서울특별시 우성구 방안동에 위치한 디자인 전문 스튜디오.'], description: '브랜딩과 그래픽 디자인을 중심으로 편집, 공간, 비주얼 아이덴티티 등 다양한 디자인 작업을 진행한다. 기존 건물의 1층을 리모델링한 공간으로, 넓은 통창과 개방적인 작업 공간이 특징이다. 내부에는 공동 작업 테이블과 미팅 공간, 디자인 자료를 열람할 수 있는 아카이브 공간이 마련되어 있다. 조용한 골목과 상업시설이 인접해 있어 소규모 전시와 프로젝트 미팅 등 다양한 용도로 활용되고 있다.', detail: [47, 533, 333] },
  { id: 10, category: '이슬람 문화센터', address: '서울 우성구 방안로2-1, 1층', meta: [47, 155, 164], image: [45, 182, 330, 250], summary: [47, 458, '서울특별시 우성구 제안동에 위치한 이슬람 문화센터.'], description: '이슬람문화센터 건립이 추진되었던 공간으로, 지역 무슬림 주민과 외국인 유학생을 위한 기도실과 교육·상담·커뮤니티 시설 등이 계획되었다. 그러나 주거지역 내 교통 혼잡과 주차, 소음, 안전 등에 대한 주민 우려가 제기되며 갈등이 발생하였다. 이후 건립을 둘러싼 논쟁이 종교·문화적 갈등으로까지 확대되면서 공사가 사실상 중단되었으며, 현재는 주민 생활권과 종교·문화적 다양성이 충돌한 지역사회의 갈등을 보여주는 공간으로 볼 수 있다.', detail: [53, 510, 321] },
  { id: 11, category: '제안뉴레지던스(예정)', address: '서울 우성구 방안동', meta: [44, 190, 199], image: [45, 182, 330, 245], summary: [50, 453, '서울특별시 방안동에 위치한 노후 주거지를 중심으로 지정된 도시정비구역.'], description: '저층 주택과 오래된 상가가 밀집했던 지역으로, 주거환경 개선과 기반시설 확충을 목적으로 단계적인 재개발이 진행되고 있다. 기존의 좁은 골목과 불규칙한 필지를 정비하고 공동주택과 생활 편의시설, 보행 공간 등을 조성할 예정이다. 사업이 완료되면 인근 주거지역 및 상권과 연계된 새로운 생활권이 형성될 것으로 예상되며, 현재는 일부 건축물 철거와 부지 정비가 진행되고 있다.', detail: [54, 531, 321] },
  { id: 12, category: '문화거리', address: '서울 우성구 방안길19-5', meta: [46, 108, 117], image: [46, 182, 330, 219], summary: [45, 427, '서울특별시 우성구 제안동에 위치한 문화거리. 제안동 북부에 위치한 주택가 골목.'], description: '오래된 골목과 저층 건물을 중심으로 카페, 음식점, 소규모 상점 등이 자리하고 있다. 기존 주거지역의 분위기를 유지하면서 다양한 상업·문화 공간이 형성되어 있는 것이 특징이다. 골목을 따라 개성 있는 점포와 휴식 공간을 둘러볼 수 있으며, 인근 공원과 주거지역이 가까워 지역 주민과 방문객이 함께 이용하는 생활형 문화거리로 자리 잡고 있다.', detail: [49, 505, 321] },
];
const INITIAL_ZOOM = .92;
// The landing composition previously used a 2339px-wide map export. Keep that
// exact visual scale, but apply it as a transform to the fixed world-size map.
// This prevents Safari from re-laying out the full SVG tree while transitioning.
const LANDING_CONTENT_ZOOM = (2339 * 1.05) / FIGMA.mapWidth;
const SYMBOLS_ZOOM_THRESHOLD = 1.30;
const ZOOM = { min: .72, max: 1.8, step: .12 };
const MAP_CONTROLS = { zoomStep: .2 };
// MainBorder has a 2427.2805 map-unit diameter after the v2 transform. The supplied
// map calibration maps this distance to 500m in the real world.
const MAP_SCALE = {
  referenceWorldLength: MAP_BORDER.width,
  referenceMeters: 500,
  levels: [
    { until: .80, meters: 50 },
    { until: .90, meters: 25 },
    { until: 1.30, meters: 20 },
    { until: Infinity, meters: 10 },
  ],
};
// All passive camera motion is owned by one requestAnimationFrame loop.
const MOTION = {
  landing: { duration: 1600, easing: 'cubic-bezier(.22,.72,.18,1)' },
  overlay: { duration: 640, easing: 'cubic-bezier(.22,.72,.18,1)', coordinateDelay: 110 },
  drag: { sampleWeight: .28, maxVelocity: .9, damping: .0072, stopVelocity: .012 },
  // Direct wheel response is stronger; accumulated momentum is deliberately restrained.
  zoom: { wheelImpulse: .000006, immediateFactor: .0002, maxQueuedDelta: .08, maxVelocity: .0014, damping: .014, stopVelocity: .000015, controlDuration: 300 },
  camera: { duration: 560 },
};
const SCENARIO_ONE = {
  width: 1500,
  height: 1080,
  contentHeight: 3624,
  introMove: 1200,
  introPause: 500,
  countDuration: 3000,
  beforeMainPause: 1500,
  mainMove: 1600,
  revealDuration: 300,
  revealStagger: 50,
};
// Resolve against the document URL so the scenario art also loads correctly
// when this site is opened directly from Finder with a file:// URL.
const SCENARIO_ONE_ART_URL = new URL('./scenario/scenario-1/S1_Main-Full.svg', window.location.href).href;
// These are the actual Figma vector/text layers that are revealed while scrolling.
// A black *glyph/path* clone hides the exported SVG's already-visible source layer;
// the matching white clone then dissolves in. There are intentionally no rectangle
// masks in this effect.
const SCENARIO_ONE_REVEALS = [
  { id: 'vector-47', type: 'vector', src: './scenario/scenario-1/reveal-assets/vector-47.svg', left: 834.3945, top: 1210.5508, width: 102.0911, height: 120.0357 },
  { id: 'vector-46', type: 'vector', src: './scenario/scenario-1/reveal-assets/vector-46.svg', left: 831.2051, top: 1225.3052, width: 95.7108, height: 104.8825 },
  { id: 'diary-copy', type: 'diary', left: 117, top: 1230, width: 1268, height: 1699 },
  { id: 'vector-45', type: 'vector', src: './scenario/scenario-1/reveal-assets/vector-45.svg', left: 964.1719, top: 1216.2769, width: 141.0325, height: 169.0955 },
  { id: 'vector-64', type: 'vector', src: './scenario/scenario-1/reveal-assets/vector-64.svg', left: 96.4102, top: 2974.6172, width: 274.6893, height: 13.4944 },
  { id: 'vector-63', type: 'vector', src: './scenario/scenario-1/reveal-assets/vector-63.svg', left: 99.3164, top: 2975.8008, width: 246.0295, height: 15.1156 },
  { id: 'vector-66', type: 'vector', src: './scenario/scenario-1/reveal-assets/vector-66.svg', left: 778.6055, top: 2982.4258, width: 192.5195, height: 6.0164 },
  { id: 'vector-65', type: 'vector', src: './scenario/scenario-1/reveal-assets/vector-65.svg', left: 781.8262, top: 2972.9355, width: 191.0331, height: 11.2951 },
  { id: 'reflection-copy', type: 'text', text: '나쁜아이가하는 생각을 해버렸다', left: 136, top: 3221, width: 561, height: 120 },
  { id: 'vector-69', type: 'vector', src: './scenario/scenario-1/reveal-assets/vector-69.svg', left: 790.5313, top: 3213.8662, width: 49.3991, height: 33.9799 },
  { id: 'vector-70', type: 'vector', src: './scenario/scenario-1/reveal-assets/vector-70.svg', left: 826.9746, top: 3237.4756, width: 13.3358, height: 21.3847 },
  { id: 'tomorrow-copy', type: 'text', text: '내일태권도가기', left: 839, top: 3187, width: 262, height: 120 },
];
const SCENARIO_ONE_ROW_TOLERANCE = 64;
const SCENARIO_TWO = {
  width: 1227,
  height: 1080,
  contentHeight: 12393,
  introMove: 1200,
  introPause: 500,
  countDuration: 3000,
  beforeMainPause: 1000,
  mainDissolve: 500,
  revealDuration: 500,
  revealViewportMiddle: 540,
};
const SCENARIO_TWO_ART_URL = new URL('./scenario/scenario-2/S2_Main-Full.svg', window.location.href).href;
// These pages were authored as self-contained 1920 × 1080 scenario pages.
// They are embedded in the shared scenario shell so the live map and the 420px
// Build Overlay remain visible on the right, just as in Scenario 1 and 2.
const EMBEDDED_SCENARIOS = {
  5: { id: 5, page: 'scenario-5.html', width: 1500, label: '힐스테이트 방안 센트럴 시나리오' },
  6: { id: 6, page: 'scenario-6.html', width: 1500, label: '방안근린공원 시나리오' },
  11: { id: 11, page: 'scenario-11.html', width: 1230, label: '방안 제4재정비촉진구역 시나리오' },
};
// Values below come from the Figma prototype reactions (not visual estimates).
const INTRO = {
  prelude: {
    hold: 4500,
    photoInterval: 300,
    photoLastHold: 1000,
    // Page-5의 마지막 사진은 1초간 유지한 뒤 즉시 검은 화면으로 전환한다.
    photoDissolve: 0,
    dissolve: { type: 'DISSOLVE', duration: 500, easing: 'var(--figma-ease-out)' },
    landingDissolve: { type: 'DISSOLVE', duration: 2500, easing: 'var(--figma-ease-out)' },
    blackHold: 2000,
    page6Dissolve: { type: 'DISSOLVE', duration: 1500, easing: 'var(--figma-ease-out)' },
  },
  page6ToT1: { type: 'DISSOLVE', duration: 550, easing: 'var(--figma-ease-in)' },
  t1: { delay: 500, type: 'SMART_ANIMATE', duration: 900, easing: 'var(--figma-ease-out)' },
  t2: { delay: 600, type: 'SMART_ANIMATE', duration: 1500, easing: 'var(--figma-ease-out)' },
  t3: { delay: 800, type: 'SMART_ANIMATE', duration: 1200, easing: 'var(--figma-ease-out)' },
  page7: {
    enter: { duration: 600, easing: 'var(--figma-ease-out)' },
    leave: { duration: 550, easing: 'var(--figma-ease-in)' },
    choice: { duration: 511.046886, easing: 'GENTLE' },
    about: { type: 'DISSOLVE', duration: 600, easing: 'var(--figma-ease-out)' },
    map: { type: 'DISSOLVE', duration: 1000, easing: 'var(--figma-ease-out)' },
  },
  aboutTransition: { delay: 200, type: 'SMART_ANIMATE', duration: 1000, easing: 'var(--figma-ease-out)' },
  aboutBack: { type: 'DISSOLVE', duration: 1000, easing: 'var(--figma-ease-out)' },
  mapBack: { type: 'DISSOLVE', duration: 1200, easing: 'var(--figma-ease-out)' },
  indexTrace: { delay: 1, duration: 400, easing: 'var(--figma-ease-out)' },
};
let displayScale = getScale();
let zoom = INITIAL_ZOOM;
let mapPosition = positionForWorldCenter(MAP_ORIGIN, INITIAL_ZOOM);
let selectedName = '-';
let drag = null;
let landingTransitioning = false;
let returnRequestedDuringTransition = false;
let mapBackTransitioning = false;
let motionFrame = 0;
let motionLastTime = 0;
let dragVelocity = { x: 0, y: 0 };
let zoomVelocity = 0;
let pendingZoomDelta = 0;
let zoomFocus = null;
let cameraTween = null;
let zoomTween = null;
let introTimers = [];
let introTransitioning = false;
let indexTraceTimer = 0;
let introPhotoTimer = 0;
const INTRO_PHOTOS = Array.from({ length: 15 }, (_, index) => `./assets/photo/photo-${index + 1}.png`);

function getBuildingAssetRect(build) {
  const [baseWidth, baseHeight] = build.base;
  const [scaleX, scaleY, x, y] = build.map;
  return {
    left: x,
    top: y,
    width: baseWidth * scaleX,
    height: baseHeight * scaleY,
  };
}

function getBuildingWorldCenter(build) {
  const rect = getBuildingAssetRect(build);
  return {
    x: MAP_V2_OFFSET.x + (rect.left + rect.width / 2) * MAP_V2_SCALE,
    y: MAP_V2_OFFSET.y + (rect.top + rect.height / 2) * MAP_V2_SCALE,
  };
}

function createBuildingButton(build) {
  const [baseWidth, baseHeight] = build.base;
  const [hoverWidth, hoverHeight, hoverOffsetX, hoverOffsetY] = build.hover;
  const rect = getBuildingAssetRect(build);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'building-hotspot';
  button.dataset.buildingId = String(build.id);
  button.setAttribute('aria-label', `${build.name} 정보 보기`);
  button.style.left = `${(rect.left / MAP_V2.viewBox) * 100}%`;
  button.style.top = `${(rect.top / MAP_V2.viewBox) * 100}%`;
  button.style.width = `${(rect.width / MAP_V2.viewBox) * 100}%`;
  button.style.height = `${(rect.height / MAP_V2.viewBox) * 100}%`;

  const base = document.createElement('img');
  base.className = 'building-default';
  base.src = `./components/Build-${build.id}_01.svg`;
  base.alt = '';
  base.draggable = false;

  const hover = document.createElement('img');
  hover.className = 'building-hover';
  hover.src = `./components/Build-${build.id}_02.svg`;
  hover.alt = '';
  hover.draggable = false;
  hover.style.left = `${(-hoverOffsetX / baseWidth) * 100}%`;
  hover.style.top = `${(-hoverOffsetY / baseHeight) * 100}%`;
  hover.style.width = `${(hoverWidth / baseWidth) * 100}%`;
  hover.style.height = `${(hoverHeight / baseHeight) * 100}%`;

  button.append(base, hover);
  button.addEventListener('click', () => openBuilding(build.id));
  return button;
}

function setupBuildingLayers() {
  document.querySelectorAll('.building-layer').forEach((layer) => {
    const fragment = document.createDocumentFragment();
    BUILDINGS.forEach((build) => fragment.append(createBuildingButton(build)));
    layer.replaceChildren(fragment);
  });
}

function createScenarioButton() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'scenario-action';
  button.setAttribute('aria-label', '시나리오 보기');
  // Rebuilt from the Figma component's vectors so the white/black symbols can
  // crossfade independently without rendering the supplied component SVG as an image.
  button.innerHTML = `
    <span class="scenario-label">SCENARIO</span>
    <span class="scenario-box-blur" aria-hidden="true"></span>
    <span class="scenario-box" aria-hidden="true"></span>
    <svg class="scenario-symbol scenario-symbol-white" viewBox="0 0 260 124" aria-hidden="true">
      <path d="M106.158 72.5H83.8418L95 52.043L106.158 72.5Z" fill="currentColor" stroke="currentColor"/>
      <rect x="115.25" y="51.25" width="0.5" height="21.5" fill="currentColor" stroke="currentColor" stroke-width="0.5"/>
      <path d="M148.158 72.5H125.842L137 52.043L148.158 72.5Z" fill="currentColor" stroke="currentColor"/>
      <path d="M177.158 72.5H154.842L166 52.043L177.158 72.5Z" fill="currentColor" stroke="currentColor"/>
    </svg>
    <svg class="scenario-symbol scenario-symbol-black" viewBox="0 0 260 124" aria-hidden="true">
      <path d="M106.158 72.5H83.8418L95 52.043L106.158 72.5Z" fill="none" stroke="currentColor"/>
      <rect x="115.25" y="51.25" width="0.5" height="21.5" fill="#fff" stroke="currentColor" stroke-width="0.5"/>
      <path d="M148.158 72.5H125.842L137 52.043L148.158 72.5Z" fill="none" stroke="currentColor"/>
      <path d="M177.158 72.5H154.842L166 52.043L177.158 72.5Z" fill="none" stroke="currentColor"/>
    </svg>`;
  return button;
}

function createBuildingOverlay(build, content) {
  const overlay = document.createElement('aside');
  overlay.className = 'building-overlay';
  overlay.dataset.buildingOverlay = String(build.id);
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('aria-label', `${build.name} 정보`);

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'building-close';
  close.setAttribute('aria-label', '건물 정보 닫기');
  close.textContent = '×';

  const title = document.createElement('h1');
  title.className = 'building-title';
  title.textContent = build.name;

  const meta = document.createElement('p');
  meta.className = 'building-meta';
  const [categoryLeft, dotLeft, addressLeft] = content.meta;
  meta.style.setProperty('--building-category-left', `${categoryLeft}px`);
  meta.style.setProperty('--building-dot-left', `${dotLeft}px`);
  meta.style.setProperty('--building-address-left', `${addressLeft}px`);
  const type = document.createElement('strong');
  type.textContent = content.category;
  const separator = document.createElement('i');
  separator.setAttribute('aria-hidden', 'true');
  const address = document.createElement('span');
  address.textContent = content.address;
  meta.append(type, separator, address);

  const [imageLeft, imageTop, imageWidth, imageHeight] = content.image;
  const image = document.createElement('img');
  image.className = 'building-image';
  image.src = `./assets/map/Build-Overlay/image/Build_image-${build.id}.png`;
  image.alt = `${build.name} 사진`;
  image.draggable = false;
  image.style.setProperty('--building-image-left', `${imageLeft}px`);
  image.style.setProperty('--building-image-top', `${imageTop}px`);
  image.style.setProperty('--building-image-width', `${imageWidth}px`);
  image.style.setProperty('--building-image-height', `${imageHeight}px`);

  const [summaryLeft, summaryTop, summaryText] = content.summary;
  const summary = document.createElement('p');
  summary.className = 'building-summary';
  summary.textContent = summaryText;
  summary.style.setProperty('--building-summary-left', `${summaryLeft}px`);
  summary.style.setProperty('--building-summary-top', `${summaryTop}px`);

  const [detailLeft, detailTop, detailWidth] = content.detail;
  let detail;
  if (content.facts) {
    detail = document.createElement('dl');
    detail.className = 'building-facts';
    content.facts.forEach(([term, value]) => {
      const row = document.createElement('div');
      const isSubfact = term.length > 2;
      if (isSubfact) row.classList.add('is-subfact');
      const label = document.createElement('dt');
      const description = document.createElement('dd');
      // The Figma table indents the "전세가" row to the value column instead
      // of placing a long label in the narrow, ruled label column.
      label.textContent = isSubfact ? '' : term;
      label.setAttribute('aria-hidden', String(isSubfact));
      description.textContent = isSubfact ? `${term} ${value}` : value;
      row.append(label, description);
      detail.append(row);
    });
  } else {
    detail = document.createElement('div');
    detail.className = 'building-description';
    const paragraphs = Array.isArray(content.description) ? content.description : [content.description];
    paragraphs.forEach((paragraph) => {
      const copy = document.createElement('p');
      copy.textContent = paragraph;
      detail.append(copy);
    });
  }
  detail.style.setProperty('--building-detail-left', `${detailLeft}px`);
  detail.style.setProperty('--building-detail-top', `${detailTop}px`);
  detail.style.setProperty('--building-detail-width', `${detailWidth}px`);

  overlay.append(close, title, meta, image, summary, detail, createScenarioButton());
  return overlay;
}

function setupBuildingOverlays() {
  uiLayer.querySelectorAll('[data-building-overlay]').forEach((overlay) => overlay.remove());
  const contentById = new Map(BUILDING_OVERLAY_CONTENT.map((content) => [content.id, content]));
  BUILDINGS.forEach((build) => {
    const content = contentById.get(build.id);
    if (content) uiLayer.append(createBuildingOverlay(build, content));
  });
  buildingOverlays = [...uiLayer.querySelectorAll('[data-building-overlay]')];
  buildingOverlays.forEach((overlay) => {
    overlay.querySelector('.building-close').addEventListener('click', closeBuildingOverlays);
    overlay.addEventListener('pointerdown', (event) => event.stopPropagation());
    const scenarioButton = overlay.querySelector('.scenario-action');
    if (Number(overlay.dataset.buildingOverlay) === 1) scenarioButton.addEventListener('click', openScenarioOne);
    if (Number(overlay.dataset.buildingOverlay) === 2) scenarioButton.addEventListener('click', openScenarioTwo);
    if (EMBEDDED_SCENARIOS[Number(overlay.dataset.buildingOverlay)]) {
      scenarioButton.addEventListener('click', () => openEmbeddedScenario(Number(overlay.dataset.buildingOverlay)));
    }
  });
}

function scenarioDuration(duration) {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration;
}

function clearScenarioOneTimers() {
  scenarioOneTimers.forEach((timer) => window.clearTimeout(timer));
  scenarioOneTimers = [];
  if (scenarioOneCountFrame) window.cancelAnimationFrame(scenarioOneCountFrame);
  scenarioOneCountFrame = 0;
}

function queueScenarioOne(callback, delay) {
  const timer = window.setTimeout(() => {
    scenarioOneTimers = scenarioOneTimers.filter((candidate) => candidate !== timer);
    callback();
  }, delay);
  scenarioOneTimers.push(timer);
  return timer;
}

function setScenarioInteractionLock(locked) {
  uiLayer.classList.toggle('is-scenario-open', locked);
  [indexTrigger, indexOverlay, ...buildingOverlays].forEach((element) => {
    element.inert = locked;
  });
  if (mapArt) setBuildingLayerAccessibility(mapArt, !locked);
}

function createScenarioOneDiaryCopy(className) {
  const copy = document.createElement('div');
  copy.className = `scenario1-diary-copy ${className}`;
  const paragraph = (text, className = '') => {
    const element = document.createElement('p');
    element.className = className;
    element.textContent = text;
    copy.append(element);
    return element;
  };
  const date = paragraph('', 'scenario1-diary-date');
  [['2013   ', 'is-large'], [' ', ''], ['1 0    ', 'is-large'], ['31    ', ''], ['목', 'is-large'], [' ', '']]
    .forEach(([text, className]) => {
      const span = document.createElement('span');
      span.className = className;
      span.textContent = text;
      date.append(span);
    });
  paragraph('        엄청 갑자기 겨울이 찾아와서 엄청 춥고무서웠던 날씨');
  const firstEntry = paragraph('', 'scenario1-diary-first-entry');
  firstEntry.append(' ');
  const lead = document.createElement('span');
  lead.className = 'is-tall';
  lead.textContent = '오늘은 학교 ';
  firstEntry.append(lead, '끝나고 집에 바로 안오고싶었다, 집문을 열면 엄마랑 아빠가 또 싸우고있을것 같아서 무서웠기때문이다. 그런데 처음에는 괜찮았다. 그래서 다행이라고 생각을 했다.');
  paragraph('근데 저녁을먹다가 갑자기 엄마가 울었고, 아빠는 아주 큰 소리로 화를 ㄴㅐㅆ다. 내가 엄마 다리를 붙자고 싸우지마라고 계속 말했지만 엄마랑아빠는 아무도 내 목소리를 듣지 못하는 것 같았다. 나는 무서워서 식탁밑으로 들어가 귀를막고 눈을 꼮 감았다. 그떄는 우리집에 없어졌으면 좋겠다고 생각했다. 그러면 아무도 싸우지 않을것 같기 때문이다. 그런데 그런생각을 한 내가 나쁜 아이인 것 같아서 더 슬퍼졌다.');
  paragraph('내일도 싸우면 어떡하지? 우리엄마랑아빠가 다시 같이 웃으면서 밥을 먹는 날이 꼭 왔으면 좋겠다. 그게 내 소원이다.');
  return copy;
}

function splitScenarioOneCopyIntoRevealParts(copy) {
  const textNodes = [];
  const walker = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    // Korean has no reliable word boundaries for all of this diary copy. Keep
    // spaces intact and use the specified 50ms word-level fallback instead.
    node.textContent.split(/(\s+)/).forEach((piece) => {
      if (!piece) return;
      if (/^\s+$/.test(piece)) {
        fragment.append(piece);
        return;
      }
      const part = document.createElement('span');
      part.className = 'scenario1-reveal-ink-part';
      part.textContent = piece;
      fragment.append(part);
    });
    node.replaceWith(fragment);
  });
}

function buildScenarioOneRevealLayers(content) {
  const revealLayer = document.createElement('div');
  revealLayer.className = 'scenario1-reveal-layer';

  SCENARIO_ONE_REVEALS.forEach((entry) => {
    const item = document.createElement('div');
    item.className = `scenario1-reveal-item scenario1-reveal-${entry.type}`;
    item.dataset.revealId = entry.id;
    item.style.left = `${entry.left}px`;
    item.style.top = `${entry.top}px`;
    item.style.width = `${entry.width}px`;
    item.style.height = `${entry.height}px`;

    if (entry.type === 'vector') {
      const eraser = document.createElement('img');
      eraser.className = 'scenario1-vector-eraser';
      eraser.src = entry.src;
      eraser.alt = '';
      const ink = document.createElement('img');
      ink.className = 'scenario1-vector-ink';
      ink.src = entry.src;
      ink.alt = '';
      item.append(eraser, ink);
    } else if (entry.type === 'diary') {
      const ink = createScenarioOneDiaryCopy('scenario1-diary-ink');
      splitScenarioOneCopyIntoRevealParts(ink);
      item.append(
        createScenarioOneDiaryCopy('scenario1-text-eraser'),
        ink,
      );
    } else {
      const eraser = document.createElement('p');
      eraser.className = 'scenario1-copy scenario1-text-eraser';
      eraser.textContent = entry.text;
      const ink = document.createElement('p');
      ink.className = 'scenario1-copy scenario1-text-ink';
      [...entry.text].forEach((character) => {
        const part = document.createElement('span');
        part.className = 'scenario1-reveal-ink-part';
        part.textContent = character;
        ink.append(part);
      });
      item.append(eraser, ink);
    }
    revealLayer.append(item);
  });
  content.append(revealLayer);
}

function buildScenarioOneMainHeader(content) {
  const header = document.createElement('div');
  header.className = 'scenario1-main-header';
  header.setAttribute('aria-hidden', 'true');
  header.innerHTML = `
    <p class="scenario1-main-title">주영이 일기장</p>
    <p class="scenario1-main-author">1학년 3반 김주영</p>
    <p class="scenario1-main-hint">- 아래로 스크롤하여 진행 -</p>`;
  content.append(header);
}

function createScenarioOneOverlay() {
  const overlay = document.createElement('section');
  overlay.className = 'scenario-overlay scenario-one';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('aria-label', '대원 빌라 시나리오: 주영이 일기장');
  overlay.innerHTML = `
    <div class="scenario1-intro" aria-hidden="true">
      <span class="scenario1-angle-value">0</span><span class="scenario1-degree">°</span>
    </div>
    <div class="scenario1-handoff" aria-hidden="true">
      <p class="scenario1-handoff-title">주영이 일기장</p>
      <p class="scenario1-handoff-author">1학년 3반 김주영</p>
      <p class="scenario1-handoff-hint">- 아래로 스크롤하여 진행 -</p>
    </div>
    <div class="scenario1-scroll" tabindex="0" aria-label="주영이 일기장 내용">
      <div class="scenario1-scroll-content">
        <img class="scenario1-main-art" src="${SCENARIO_ONE_ART_URL}" alt="주영이 일기장" draggable="false" />
      </div>
    </div>`;

  const content = overlay.querySelector('.scenario1-scroll-content');
  buildScenarioOneRevealLayers(content);
  // The exported full-page SVG contains the same title and author as outlines.
  // Keep a DOM copy above it so the hand-off can never disappear while Safari is
  // decoding the large SVG on its first use.
  buildScenarioOneMainHeader(content);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'scenario1-back';
  back.setAttribute('aria-label', '시나리오에서 돌아가기');
  back.innerHTML = '<span class="scenario1-back-label">돌아가기</span><i class="scenario1-back-line" aria-hidden="true"></i>';
  content.append(back);

  overlay.addEventListener('pointerdown', (event) => event.stopPropagation());
  overlay.addEventListener('wheel', (event) => event.stopPropagation(), { passive: true });
  const scroll = overlay.querySelector('.scenario1-scroll');
  scroll.addEventListener('scroll', updateScenarioOneReveals, { passive: true });
  scroll.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('.scenario1-back')) return;
    event.preventDefault();
    scenarioOneScrollDrag = { pointerId: event.pointerId, startY: event.clientY, startScrollTop: scroll.scrollTop };
    scroll.setPointerCapture(event.pointerId);
    scroll.classList.add('is-dragging');
  });
  scroll.addEventListener('pointermove', (event) => {
    if (!scenarioOneScrollDrag || event.pointerId !== scenarioOneScrollDrag.pointerId) return;
    scroll.scrollTop = scenarioOneScrollDrag.startScrollTop + scenarioOneScrollDrag.startY - event.clientY;
  });
  const stopScrollDrag = (event) => {
    if (!scenarioOneScrollDrag || (event?.pointerId != null && event.pointerId !== scenarioOneScrollDrag.pointerId)) return;
    if (scroll.hasPointerCapture(scenarioOneScrollDrag.pointerId)) scroll.releasePointerCapture(scenarioOneScrollDrag.pointerId);
    scenarioOneScrollDrag = null;
    scroll.classList.remove('is-dragging');
  };
  scroll.addEventListener('pointerup', stopScrollDrag);
  scroll.addEventListener('pointercancel', stopScrollDrag);
  scroll.addEventListener('lostpointercapture', stopScrollDrag);
  back.addEventListener('click', closeScenarioOne);
  return overlay;
}

function resetScenarioOne() {
  clearScenarioOneTimers();
  const scroll = scenarioOneOverlay.querySelector('.scenario1-scroll');
  scenarioOneScrollDrag = null;
  scroll.classList.remove('is-dragging');
  scroll.scrollTop = 0;
  scenarioOneOverlay.querySelector('.scenario1-angle-value').textContent = '0';
  scenarioOneOverlay.querySelectorAll('.scenario1-reveal-item, .scenario1-reveal-ink-part').forEach((item) => {
    item.classList.remove('is-revealed', 'is-scheduled');
  });
  scenarioOneOverlay.classList.remove('is-main-arriving', 'is-main-ready', 'is-closing');
  scenarioOneOverlay.querySelector('.scenario1-intro').classList.remove('is-leaving');
}

function animateScenarioOneAngle() {
  const value = scenarioOneOverlay?.querySelector('.scenario1-angle-value');
  if (!value) return;
  const duration = scenarioDuration(SCENARIO_ONE.countDuration);
  if (!duration) {
    value.textContent = '31';
    return;
  }
  const startedAt = performance.now();
  const tick = (now) => {
    if (!scenarioOneIsOpen || scenarioOneIsClosing) return;
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    value.textContent = String(Math.min(31, Math.floor(31 * eased)));
    if (progress < 1) scenarioOneCountFrame = window.requestAnimationFrame(tick);
    else {
      value.textContent = '31';
      scenarioOneCountFrame = 0;
    }
  };
  scenarioOneCountFrame = window.requestAnimationFrame(tick);
}

function revealScenarioOneMain() {
  if (!scenarioOneIsOpen || scenarioOneIsClosing) return;
  scenarioOneOverlay.classList.add('is-main-arriving');
  scenarioOneOverlay.querySelector('.scenario1-intro').classList.add('is-leaving');
  queueScenarioOne(() => {
    if (!scenarioOneIsOpen || scenarioOneIsClosing) return;
    const art = scenarioOneOverlay.querySelector('.scenario1-main-art');
    const showMain = () => {
      if (!scenarioOneIsOpen || scenarioOneIsClosing) return;
      scenarioOneOverlay.classList.add('is-main-ready');
    };
    // Do not fade the handoff copy before the underlying full SVG is decoded.
    // This prevents a blank title/author state on a cold first load in Safari.
    if (art.complete && art.naturalWidth > 0) showMain();
    else {
      art.addEventListener('load', showMain, { once: true });
      art.addEventListener('error', () => {
        console.error('Scenario 1 artwork could not be loaded:', art.currentSrc || art.src);
        // The DOM title/author remain available even if the artwork fails, so do
        // not keep the user trapped on the transition screen.
        showMain();
      }, { once: true });
    }
  }, scenarioDuration(SCENARIO_ONE.mainMove));
}

function updateScenarioOneReveals() {
  if (!scenarioOneOverlay?.classList.contains('is-main-ready')) return;
  const scroll = scenarioOneOverlay.querySelector('.scenario1-scroll');
  const threshold = scroll.scrollTop + 900;
  const rows = [];
  [...SCENARIO_ONE_REVEALS]
    .sort((a, b) => a.top - b.top)
    .forEach((entry) => {
      const currentRow = rows.at(-1);
      if (!currentRow || entry.top - currentRow.top > SCENARIO_ONE_ROW_TOLERANCE) {
        rows.push({ top: entry.top, entries: [entry] });
      } else {
        currentRow.entries.push(entry);
      }
    });

  rows
    .filter((row) => row.top <= threshold)
    .forEach((row) => {
      let delay = 0;
      row.entries
        .sort((a, b) => a.left - b.left)
        .forEach((entry) => {
          const item = scenarioOneOverlay.querySelector(`[data-reveal-id="${entry.id}"]`);
          if (!item || item.classList.contains('is-scheduled')) return;
          item.classList.add('is-scheduled');
          queueScenarioOne(() => item.classList.add('is-revealed'), scenarioDuration(delay));
          const parts = entry.type === 'text' || entry.type === 'diary'
            ? [...item.querySelectorAll('.scenario1-reveal-ink-part')]
            : [];
          const partDelay = entry.type === 'diary' ? 50 : 30;
          parts.forEach((part, index) => {
            queueScenarioOne(() => part.classList.add('is-revealed'), scenarioDuration(delay + index * partDelay));
          });
          // A full diary paragraph can still reveal word-by-word while nearby
          // vectors in the same visual row begin on the specified 50ms stagger.
          delay += entry.type === 'diary'
            ? SCENARIO_ONE.revealStagger
            : Math.max(0, parts.length - 1) * partDelay + SCENARIO_ONE.revealStagger;
        });
    });
}

function openScenarioOne() {
  if (scenarioOneIsOpen || scenarioOneIsClosing || isAnyScenarioOpen()) return;
  if (!scenarioOneOverlay) {
    scenarioOneOverlay = createScenarioOneOverlay();
    uiLayer.append(scenarioOneOverlay);
  }
  scenarioOneIsOpen = true;
  stopPassiveMotion();
  setScenarioInteractionLock(true);
  resetScenarioOne();
  scenarioOneOverlay.setAttribute('aria-hidden', 'false');
  // Force the off-screen initial transform to be committed before Move In begins.
  void scenarioOneOverlay.offsetWidth;
  scenarioOneOverlay.classList.add('is-open');

  const introMove = scenarioDuration(SCENARIO_ONE.introMove);
  const countStart = introMove + scenarioDuration(SCENARIO_ONE.introPause);
  const mainStart = countStart + scenarioDuration(SCENARIO_ONE.countDuration) + scenarioDuration(SCENARIO_ONE.beforeMainPause);
  queueScenarioOne(animateScenarioOneAngle, countStart);
  queueScenarioOne(revealScenarioOneMain, mainStart);
}

function closeScenarioOne() {
  if (!scenarioOneIsOpen || scenarioOneIsClosing) return;
  scenarioOneIsClosing = true;
  clearScenarioOneTimers();
  scenarioOneOverlay.classList.remove('is-open');
  scenarioOneOverlay.classList.add('is-closing');
  queueScenarioOne(() => {
    scenarioOneOverlay.classList.remove('is-closing', 'is-main-arriving', 'is-main-ready');
    scenarioOneOverlay.setAttribute('aria-hidden', 'true');
    scenarioOneIsOpen = false;
    scenarioOneIsClosing = false;
    setScenarioInteractionLock(false);
  }, scenarioDuration(SCENARIO_ONE.introMove));
}

function isAnyScenarioOpen() {
  return scenarioOneIsOpen || scenarioTwoIsOpen || activeEmbeddedScenarioId !== null;
}

function clearScenarioTwoTimers() {
  scenarioTwoTimers.forEach((timer) => window.clearTimeout(timer));
  scenarioTwoTimers = [];
  if (scenarioTwoCountFrame) window.cancelAnimationFrame(scenarioTwoCountFrame);
  scenarioTwoCountFrame = 0;
}

function queueScenarioTwo(callback, delay) {
  const timer = window.setTimeout(() => {
    scenarioTwoTimers = scenarioTwoTimers.filter((candidate) => candidate !== timer);
    callback();
  }, delay);
  scenarioTwoTimers.push(timer);
  return timer;
}

function postScenarioTwoArt(action, scrollTop = 0) {
  const art = scenarioTwoOverlay?.querySelector('.scenario2-main-art');
  art?.contentWindow?.postMessage({ channel: 'theta-scenario-2', action, scrollTop }, '*');
}

function resetScenarioTwoArt() {
  postScenarioTwoArt('reset');
}

function showScenarioTwoMain() {
  if (!scenarioTwoIsOpen || scenarioTwoIsClosing) return;
  scenarioTwoOverlay.classList.add('is-main-ready');
  updateScenarioTwoReveals();
}

function createScenarioTwoOverlay() {
  const overlay = document.createElement('section');
  overlay.className = 'scenario-overlay scenario-two';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('aria-label', '우성현대아파트 시나리오: 현대아파트의 엘리베이터는 왜 움직이지 않는가');
  overlay.innerHTML = `
    <div class="scenario2-intro" aria-hidden="true">
      <i class="scenario2-intro-shell"></i>
      <span class="scenario2-count"><span class="scenario2-count-value">0</span><span class="scenario2-count-unit">°</span></span>
    </div>
    <div class="scenario2-scroll" tabindex="0" aria-label="현대아파트의 엘리베이터는 왜 움직이지 않는가 내용">
      <div class="scenario2-scroll-content">
        <object class="scenario2-main-art" data="${SCENARIO_TWO_ART_URL}" type="image/svg+xml" aria-label="현대아파트의 엘리베이터는 왜 움직이지 않는가"></object>
      </div>
    </div>`;

  const content = overlay.querySelector('.scenario2-scroll-content');
  const art = content.querySelector('.scenario2-main-art');
  const syncScenarioTwoArt = () => {
    resetScenarioTwoArt();
    if (scenarioTwoMainRequested) showScenarioTwoMain();
  };
  art.addEventListener('load', syncScenarioTwoArt);
  window.addEventListener('message', (event) => {
    if (event.data?.type !== 'theta-scenario-2-ready' || event.source !== art.contentWindow) return;
    syncScenarioTwoArt();
  });

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'scenario2-back';
  back.setAttribute('aria-label', '시나리오에서 돌아가기');
  back.innerHTML = '<span class="scenario2-back-label">돌아가기</span><i class="scenario2-back-line" aria-hidden="true"></i>';
  content.append(back);

  overlay.addEventListener('pointerdown', (event) => event.stopPropagation());
  overlay.addEventListener('wheel', (event) => event.stopPropagation(), { passive: true });
  const scroll = overlay.querySelector('.scenario2-scroll');
  scroll.addEventListener('scroll', updateScenarioTwoReveals, { passive: true });
  scroll.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('.scenario2-back')) return;
    event.preventDefault();
    scenarioTwoScrollDrag = { pointerId: event.pointerId, startY: event.clientY, startScrollTop: scroll.scrollTop };
    scroll.setPointerCapture(event.pointerId);
    scroll.classList.add('is-dragging');
  });
  scroll.addEventListener('pointermove', (event) => {
    if (!scenarioTwoScrollDrag || event.pointerId !== scenarioTwoScrollDrag.pointerId) return;
    scroll.scrollTop = scenarioTwoScrollDrag.startScrollTop + scenarioTwoScrollDrag.startY - event.clientY;
  });
  const stopScrollDrag = (event) => {
    if (!scenarioTwoScrollDrag || (event?.pointerId != null && event.pointerId !== scenarioTwoScrollDrag.pointerId)) return;
    if (scroll.hasPointerCapture(scenarioTwoScrollDrag.pointerId)) scroll.releasePointerCapture(scenarioTwoScrollDrag.pointerId);
    scenarioTwoScrollDrag = null;
    scroll.classList.remove('is-dragging');
  };
  scroll.addEventListener('pointerup', stopScrollDrag);
  scroll.addEventListener('pointercancel', stopScrollDrag);
  scroll.addEventListener('lostpointercapture', stopScrollDrag);
  back.addEventListener('click', closeScenarioTwo);
  return overlay;
}

function resetScenarioTwo() {
  clearScenarioTwoTimers();
  scenarioTwoMainRequested = false;
  const scroll = scenarioTwoOverlay.querySelector('.scenario2-scroll');
  scenarioTwoScrollDrag = null;
  scroll.classList.remove('is-dragging');
  scroll.scrollTop = 0;
  scenarioTwoOverlay.querySelector('.scenario2-count-value').textContent = '0';
  resetScenarioTwoArt();
  scenarioTwoOverlay.classList.remove('is-counting', 'is-main-ready', 'is-closing');
}

function animateScenarioTwoAngle() {
  const count = scenarioTwoOverlay?.querySelector('.scenario2-count');
  if (!count) return;
  const duration = scenarioDuration(SCENARIO_TWO.countDuration);
  scenarioTwoOverlay.classList.add('is-counting');
  if (!duration) {
    count.querySelector('.scenario2-count-value').textContent = '75';
    return;
  }
  const startedAt = performance.now();
  const tick = (now) => {
    if (!scenarioTwoIsOpen || scenarioTwoIsClosing) return;
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    count.querySelector('.scenario2-count-value').textContent = String(Math.min(75, Math.floor(75 * eased)));
    if (progress < 1) scenarioTwoCountFrame = window.requestAnimationFrame(tick);
    else {
      count.querySelector('.scenario2-count-value').textContent = '75';
      scenarioTwoCountFrame = 0;
    }
  };
  scenarioTwoCountFrame = window.requestAnimationFrame(tick);
}

function revealScenarioTwoMain() {
  if (!scenarioTwoIsOpen || scenarioTwoIsClosing) return;
  scenarioTwoMainRequested = true;
  resetScenarioTwoArt();
  showScenarioTwoMain();
}

function updateScenarioTwoReveals() {
  if (!scenarioTwoOverlay?.classList.contains('is-main-ready')) return;
  const scroll = scenarioTwoOverlay.querySelector('.scenario2-scroll');
  postScenarioTwoArt('reveal', scroll.scrollTop);
}

function openScenarioTwo() {
  if (scenarioTwoIsOpen || scenarioTwoIsClosing || isAnyScenarioOpen()) return;
  if (!scenarioTwoOverlay) {
    scenarioTwoOverlay = createScenarioTwoOverlay();
    uiLayer.append(scenarioTwoOverlay);
  }
  scenarioTwoIsOpen = true;
  stopPassiveMotion();
  setScenarioInteractionLock(true);
  resetScenarioTwo();
  scenarioTwoOverlay.setAttribute('aria-hidden', 'false');
  void scenarioTwoOverlay.offsetWidth;
  scenarioTwoOverlay.classList.add('is-open');

  const introMove = scenarioDuration(SCENARIO_TWO.introMove);
  const countStart = introMove + scenarioDuration(SCENARIO_TWO.introPause);
  const mainStart = countStart + scenarioDuration(SCENARIO_TWO.countDuration) + scenarioDuration(SCENARIO_TWO.beforeMainPause);
  queueScenarioTwo(animateScenarioTwoAngle, countStart);
  queueScenarioTwo(revealScenarioTwoMain, mainStart);
}

function closeScenarioTwo() {
  if (!scenarioTwoIsOpen || scenarioTwoIsClosing) return;
  scenarioTwoIsClosing = true;
  clearScenarioTwoTimers();
  scenarioTwoOverlay.classList.remove('is-open');
  scenarioTwoOverlay.classList.add('is-closing');
  queueScenarioTwo(() => {
    scenarioTwoOverlay.classList.remove('is-closing', 'is-counting', 'is-main-ready');
    scenarioTwoOverlay.setAttribute('aria-hidden', 'true');
    scenarioTwoIsOpen = false;
    scenarioTwoIsClosing = false;
    setScenarioInteractionLock(false);
  }, scenarioDuration(SCENARIO_TWO.introMove));
}

function createEmbeddedScenarioOverlay(config) {
  const overlay = document.createElement('section');
  overlay.className = `scenario-overlay scenario-embedded scenario-embedded-${config.id}`;
  overlay.dataset.embeddedScenario = String(config.id);
  overlay.style.width = `${config.width}px`;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('aria-label', config.label);

  const frame = document.createElement('iframe');
  frame.className = 'scenario-embedded-frame';
  frame.title = config.label;
  frame.setAttribute('scrolling', 'no');
  frame.setAttribute('tabindex', '0');
  overlay.append(frame);
  overlay.addEventListener('pointerdown', (event) => event.stopPropagation());
  overlay.addEventListener('wheel', (event) => event.stopPropagation(), { passive: true });
  return overlay;
}

function resetEmbeddedScenarioFrame(overlay, config) {
  const frame = overlay.querySelector('.scenario-embedded-frame');
  // A new query value produces a fresh document so the standalone scenario's
  // own intro/count sequence runs from its first frame on every opening.
  frame.src = `./${config.page}?embed=1&run=${Date.now()}`;
}

function openEmbeddedScenario(id) {
  const config = EMBEDDED_SCENARIOS[id];
  if (!config || embeddedScenarioClosing || isAnyScenarioOpen()) return;
  let overlay = embeddedScenarioOverlays.get(id);
  if (!overlay) {
    overlay = createEmbeddedScenarioOverlay(config);
    embeddedScenarioOverlays.set(id, overlay);
    uiLayer.append(overlay);
  }

  activeEmbeddedScenarioId = id;
  stopPassiveMotion();
  setScenarioInteractionLock(true);
  resetEmbeddedScenarioFrame(overlay, config);
  overlay.setAttribute('aria-hidden', 'false');
  // Commit the common off-screen state before the 1200ms Move In transition.
  void overlay.offsetWidth;
  overlay.classList.add('is-open');
}

function closeEmbeddedScenario(id = activeEmbeddedScenarioId, { immediate = false } = {}) {
  if (id == null || id !== activeEmbeddedScenarioId || embeddedScenarioClosing) return;
  const overlay = embeddedScenarioOverlays.get(id);
  if (!overlay) return;
  window.clearTimeout(embeddedScenarioCloseTimer);
  embeddedScenarioClosing = true;
  overlay.classList.remove('is-open');

  const finish = () => {
    overlay.classList.remove('is-closing');
    overlay.setAttribute('aria-hidden', 'true');
    activeEmbeddedScenarioId = null;
    embeddedScenarioClosing = false;
    setScenarioInteractionLock(false);
  };

  if (immediate) {
    finish();
    return;
  }

  overlay.classList.add('is-closing');
  embeddedScenarioCloseTimer = window.setTimeout(finish, scenarioDuration(SCENARIO_ONE.introMove));
}

window.addEventListener('message', (event) => {
  const { data } = event;
  if (data?.channel !== 'theta-scenario-embedded' || data.action !== 'close') return;
  const id = Number(data.id);
  const overlay = embeddedScenarioOverlays.get(id);
  if (!overlay || overlay.querySelector('.scenario-embedded-frame')?.contentWindow !== event.source) return;
  closeEmbeddedScenario(id);
});

function setBuildingLayerAccessibility(root, interactive) {
  const layer = root.querySelector('.building-layer');
  if (!layer) return;
  layer.setAttribute('aria-hidden', interactive ? 'false' : 'true');
  layer.querySelectorAll('.building-hotspot').forEach((button) => {
    button.tabIndex = interactive ? 0 : -1;
  });
}

function applyMotionTokens() {
  const root = document.documentElement.style;
  root.setProperty('--landing-zoom-duration', `${MOTION.landing.duration}ms`);
  root.setProperty('--landing-zoom-easing', MOTION.landing.easing);
  root.setProperty('--map-ui-enter-duration', `${MOTION.overlay.duration}ms`);
  root.setProperty('--map-ui-enter-easing', MOTION.overlay.easing);
  root.setProperty('--coordinates-enter-delay', `${MOTION.overlay.coordinateDelay}ms`);
}

function applyIntroScale() {
  introWorld.style.setProperty('--intro-scale', Math.min(window.innerWidth / FIGMA.width, window.innerHeight / FIGMA.height));
}

function clearIntroTimers() {
  introTimers.forEach((timer) => window.clearTimeout(timer));
  introTimers = [];
}

function queueIntro(next, delay) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  introTimers.push(window.setTimeout(next, reducedMotion ? 1 : delay));
}

function stopIntroPhotos() {
  if (introPhotoTimer) window.clearInterval(introPhotoTimer);
  introPhotoTimer = 0;
}

function shuffledIntroPhotos() {
  const photos = [...INTRO_PHOTOS];
  for (let index = photos.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1));
    [photos[index], photos[nextIndex]] = [photos[nextIndex], photos[index]];
  }
  return photos;
}

function startIntroPhotos() {
  if (!introPhotoFrame) return;
  stopIntroPhotos();
  introPhotoStage?.classList.remove('is-dissolving');
  const photos = shuffledIntroPhotos();
  let photoIndex = 0;
  introPhotoFrame.src = photos[photoIndex];
  introPhotoTimer = window.setInterval(() => {
    photoIndex = (photoIndex + 1) % photos.length;
    introPhotoFrame.src = photos[photoIndex];
  }, INTRO.prelude.photoInterval);
}

function getIntroScreen(name) {
  return introScreens.find((screen) => screen.dataset.introScreen === name);
}

function resetIntroScreen(screen) {
  if (screen.dataset.introScreen === 'page5') {
    stopIntroPhotos();
    introPhotoStage?.classList.remove('is-dissolving');
  }
  screen.classList.remove('is-active', 'is-entering', 'is-dissolve-target', 'is-smart-enter', 'is-from-axes', 'is-from-about-transition', 'is-about-hovered', 'is-map-hovered');
  screen.style.removeProperty('--intro-motion-duration');
  screen.style.removeProperty('--intro-motion-easing');
  screen.setAttribute('aria-hidden', 'true');
}

function setIntroMotion(screen, motion) {
  screen.style.setProperty('--intro-motion-duration', `${motion.duration}ms`);
  screen.style.setProperty('--intro-motion-easing', motion.easing);
}

function showIntroScreen(name, { entryClass = '', motion = null, clearTimers = true } = {}) {
  if (clearTimers) clearIntroTimers();
  const nextScreen = introScreens.find((screen) => screen.dataset.introScreen === name);
  if (!nextScreen) return;
  introScreens.forEach((screen) => {
    const active = screen === nextScreen;
    if (!active) {
      resetIntroScreen(screen);
      return;
    }
    screen.classList.add('is-active');
    screen.classList.remove('is-entering', 'is-dissolve-target', 'is-smart-enter', 'is-from-axes', 'is-from-about-transition', 'is-about-hovered', 'is-map-hovered');
    if (entryClass) screen.classList.add(entryClass);
    if (motion) setIntroMotion(screen, motion);
    else {
      screen.style.removeProperty('--intro-motion-duration');
      screen.style.removeProperty('--intro-motion-easing');
    }
    screen.setAttribute('aria-hidden', 'false');
  });
  window.requestAnimationFrame(() => nextScreen.classList.add('is-entering'));
  return nextScreen;
}

function dissolveIntroTo(name, motion, onComplete) {
  clearIntroTimers();
  const source = introScreens.find((screen) => screen.classList.contains('is-active'));
  const target = getIntroScreen(name);
  if (!target || source === target) {
    showIntroScreen(name, { clearTimers: false });
    onComplete?.();
    return;
  }

  introTransitioning = true;
  introScreens.forEach((screen) => {
    if (screen !== source && screen !== target) resetIntroScreen(screen);
  });
  target.classList.remove('is-entering', 'is-smart-enter', 'is-from-axes', 'is-from-about-transition', 'is-about-hovered', 'is-map-hovered');
  target.classList.add('is-active', 'is-dissolve-target');
  target.setAttribute('aria-hidden', 'false');
  setIntroMotion(target, motion);
  if (source) source.setAttribute('aria-hidden', 'true');

  window.requestAnimationFrame(() => target.classList.add('is-entering'));
  queueIntro(() => {
    if (source) resetIntroScreen(source);
    target.classList.remove('is-dissolve-target', 'is-entering');
    target.style.removeProperty('--intro-motion-duration');
    target.style.removeProperty('--intro-motion-easing');
    introTransitioning = false;
    onComplete?.();
  }, motion.duration);
}

function smartAnimateIntroTo(name, motion, entryClass, onComplete) {
  introTransitioning = true;
  const target = showIntroScreen(name, { entryClass, motion });
  if (!target) {
    introTransitioning = false;
    return;
  }
  queueIntro(() => {
    target.classList.remove('is-entering', entryClass);
    target.style.removeProperty('--intro-motion-duration');
    target.style.removeProperty('--intro-motion-easing');
    introTransitioning = false;
    onComplete?.();
  }, motion.duration);
}

function beginIntroSequence() {
  if (introTransitioning) return;
  dissolveIntroTo('page6t1', INTRO.page6ToT1, () => {
    queueIntro(() => {
      smartAnimateIntroTo('page6t2', INTRO.t1, 'is-smart-enter', () => {
        queueIntro(() => {
          smartAnimateIntroTo('page6t3', INTRO.t2, 'is-smart-enter', () => {
            queueIntro(() => smartAnimateIntroTo('page7', INTRO.t3, 'is-from-axes'), INTRO.t3.delay);
          });
        }, INTRO.t2.delay);
      });
    }, INTRO.t1.delay);
  });
}

function beginPreludeSequence() {
  if (introTransitioning) return;
  dissolveIntroTo('page1', INTRO.prelude.landingDissolve, () => {
    queueIntro(() => {
      dissolveIntroTo('page2', INTRO.prelude.dissolve, () => {
        queueIntro(() => {
          dissolveIntroTo('page3', INTRO.prelude.dissolve, () => {
            queueIntro(() => {
              dissolveIntroTo('page4', INTRO.prelude.dissolve, () => {
                queueIntro(() => {
                  dissolveIntroTo('page5', INTRO.prelude.dissolve, () => {
                    startIntroPhotos();
                    queueIntro(() => {
                      introPhotoStage?.classList.add('is-dissolving');
                      queueIntro(() => {
                        stopIntroPhotos();
                        showIntroScreen('preludeBlack');
                        queueIntro(() => dissolveIntroTo('page6', INTRO.prelude.page6Dissolve), INTRO.prelude.blackHold);
                      }, INTRO.prelude.photoDissolve);
                    }, (INTRO_PHOTOS.length - 1) * INTRO.prelude.photoInterval + INTRO.prelude.photoLastHold);
                  });
                }, INTRO.prelude.hold);
              });
            }, INTRO.prelude.hold);
          });
        }, INTRO.prelude.hold);
      });
    }, INTRO.prelude.hold);
  });
}

function skipPreludeToPage6() {
  clearIntroTimers();
  stopIntroPhotos();
  introTransitioning = false;
  showIntroScreen('page6', { clearTimers: false });
}

function setPage7Hover(kind) {
  const page7 = getIntroScreen('page7');
  if (!page7 || !page7.classList.contains('is-active') || introTransitioning) return;
  page7.classList.toggle('is-about-hovered', kind === 'about');
  page7.classList.toggle('is-map-hovered', kind === 'map');
}

function enterAbout() {
  if (introTransitioning) return;
  dissolveIntroTo('aboutTransition', INTRO.page7.about, () => {
    queueIntro(() => smartAnimateIntroTo('about', INTRO.aboutTransition, 'is-from-about-transition'), INTRO.aboutTransition.delay);
  });
}

function enterExistingLanding() {
  if (introTransitioning) return;
  clearIntroTimers();
  introTransitioning = true;
  landing.classList.remove('is-hidden');
  applyLandingScale();
  landing.classList.add('is-intro-handoff');
  landing.style.setProperty('--intro-motion-duration', `${INTRO.page7.map.duration}ms`);
  landing.style.setProperty('--intro-motion-easing', INTRO.page7.map.easing);
  intro.classList.add('is-handing-off');
  window.requestAnimationFrame(() => landing.classList.add('is-intro-handoff-visible'));
  queueIntro(() => {
    intro.classList.add('is-hidden');
    intro.classList.remove('is-handing-off');
    landing.classList.remove('is-intro-handoff', 'is-intro-handoff-visible');
    landing.style.removeProperty('--intro-motion-duration');
    landing.style.removeProperty('--intro-motion-easing');
    introTransitioning = false;
  }, INTRO.page7.map.duration);
}

function getScale() {
  return Math.min(window.innerWidth / FIGMA.width, window.innerHeight / FIGMA.height);
}

function getViewportCenter(scale = displayScale) {
  return { x: window.innerWidth / (2 * scale), y: window.innerHeight / (2 * scale) };
}

function positionForWorldCenter(worldPoint, atZoom, scale = displayScale) {
  const viewCenter = getViewportCenter(scale);
  return {
    x: viewCenter.x - worldPoint.x * atZoom,
    y: viewCenter.y - worldPoint.y * atZoom,
  };
}

function applyLandingScale() {
  const scale = getScale();
  const borderCenter = {
    x: MAP_BORDER.x + MAP_BORDER.width / 2,
    y: MAP_BORDER.y + MAP_BORDER.height / 2,
  };
  // Center the landing composition on the white Border of the main map area.
  // The map element itself is always the same world-sized rectangle; only its
  // composited transform changes between landing and exploration.
  landingMap.style.transform = `translate3d(${window.innerWidth / 2 - borderCenter.x * scale * LANDING_CONTENT_ZOOM}px, ${window.innerHeight / 2 - borderCenter.y * scale * LANDING_CONTENT_ZOOM}px, 0) scale(${scale * LANDING_CONTENT_ZOOM})`;
}

function applyLandingDestinationGeometry(scale = getScale()) {
  const mapHome = positionForWorldCenter(MAP_ORIGIN, INITIAL_ZOOM, scale);
  landingMap.style.transform = `translate3d(${mapHome.x * scale}px, ${mapHome.y * scale}px, 0) scale(${scale * INITIAL_ZOOM})`;
}

function applyCanvasSize() {
  const worldCenter = worldCenterForPosition(mapPosition);
  displayScale = getScale();
  uiLayer.style.transform = `scale(${displayScale})`;
  // Keep Figma-unit positioning for the left UI while extending the same UI layer
  // to the actual viewport. This lets the right overlay remain flush on wide screens.
  uiLayer.style.width = `${window.innerWidth / displayScale}px`;
  uiLayer.style.height = `${window.innerHeight / displayScale}px`;
  mapPosition = constrainPosition(positionForWorldCenter(worldCenter, zoom), zoom);
  applyMapPosition();
}

function applyMapPosition() {
  // Keep the SVG layout at its native world dimensions. Resizing this 8k map on
  // every wheel event forces Safari to re-rasterize every layer, which is notably
  // expensive on the 5K iMac. Position and zoom now share one composited transform.
  canvas.style.transform = `translate3d(${mapPosition.x * displayScale}px, ${mapPosition.y * displayScale}px, 0) scale(${displayScale * zoom})`;
  updateCoordinates();
  updateMapDetailLayers();
  updateMapScaleIndicator();
}

function worldCenterForPosition(position, atZoom = zoom) {
  const viewCenter = getViewportCenter();
  return {
    x: (viewCenter.x - position.x) / atZoom,
    y: (viewCenter.y - position.y) / atZoom,
  };
}

function constrainPosition(next, atZoom = zoom) {
  const worldCenter = worldCenterForPosition(next, atZoom);
  const dx = worldCenter.x - CAMERA_BOUNDARY.x;
  const dy = worldCenter.y - CAMERA_BOUNDARY.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= CAMERA_BOUNDARY.radius) return next;
  return positionForWorldCenter({
    x: CAMERA_BOUNDARY.x + (dx / distance) * CAMERA_BOUNDARY.radius,
    y: CAMERA_BOUNDARY.y + (dy / distance) * CAMERA_BOUNDARY.radius,
  }, atZoom);
}

function updateCoordinates() {
  const worldCenter = worldCenterForPosition(mapPosition);
  const dx = worldCenter.x - MAP_ORIGIN.x;
  const dy = MAP_ORIGIN.y - worldCenter.y;
  const distance = Math.hypot(dx, dy);
  const angle = distance === 0 ? 0 : Math.atan2(dy, dx) * (180 / Math.PI);
  const detailed = selectedName !== '-';
  const formattedAngle = detailed ? angle.toFixed(3) : Math.round(angle);
  coordinates.textContent = `${distance.toFixed(3)} / ${formattedAngle}° / ${selectedName}`;
}

function updateMapDetailLayers() {
  mapArt?.classList.toggle('is-symbols-visible', zoom >= SYMBOLS_ZOOM_THRESHOLD);
}

function updateMapScaleIndicator() {
  if (!mapScaleIndicator || !mapScaleValue) return;
  const level = MAP_SCALE.levels.find(({ until }) => zoom < until)
    || MAP_SCALE.levels[MAP_SCALE.levels.length - 1];
  const meters = level.meters;
  const worldUnitsPerMeter = MAP_SCALE.referenceWorldLength / MAP_SCALE.referenceMeters;
  const rulerWidth = Math.max(1, meters * worldUnitsPerMeter * zoom);
  mapScaleIndicator.style.setProperty('--map-scale-ruler-width', `${rulerWidth}px`);
  mapScaleValue.textContent = `${meters}m`;
  mapScaleIndicator.setAttribute('aria-label', `지도 축척: ${meters}미터`);
}

function requestMotionFrame() {
  if (!motionFrame) motionFrame = window.requestAnimationFrame(runMotionFrame);
}

function stopPassiveMotion() {
  dragVelocity = { x: 0, y: 0 };
  zoomVelocity = 0;
  pendingZoomDelta = 0;
  zoomFocus = null;
  cameraTween = null;
  zoomTween = null;
}

function animateMapTo(position) {
  stopPassiveMotion();
  cameraTween = {
    startedAt: performance.now(),
    from: { ...mapPosition },
    to: constrainPosition(position, zoom),
  };
  requestMotionFrame();
}

function openIndex() {
  indexOverlay.classList.add('is-open');
  indexOverlay.setAttribute('aria-hidden', 'false');
  indexTrigger.setAttribute('aria-expanded', 'true');
}

function closeIndexOverlay() {
  clearIndexBuildingHover();
  indexOverlay.classList.remove('is-open');
  indexOverlay.setAttribute('aria-hidden', 'true');
  indexTrigger.setAttribute('aria-expanded', 'false');
}

function clearIndexBuildingHover() {
  mapArt?.querySelectorAll('.building-hotspot.is-index-hovered').forEach((hotspot) => hotspot.classList.remove('is-index-hovered'));
  indexHoveredBuildingId = null;
}

function setIndexBuildingHover(id) {
  if (indexHoveredBuildingId === id) return;
  clearIndexBuildingHover();
  const hotspot = mapArt?.querySelector(`.building-hotspot[data-building-id="${id}"]`);
  if (!hotspot) return;
  hotspot.classList.add('is-index-hovered');
  indexHoveredBuildingId = id;
}

function setActiveBuilding(id) {
  mapArt?.querySelectorAll('.building-hotspot.is-selected').forEach((hotspot) => hotspot.classList.remove('is-selected'));
  const hotspot = id == null ? null : mapArt?.querySelector(`.building-hotspot[data-building-id="${id}"]`);
  hotspot?.classList.add('is-selected');
  activeBuildingId = id;
}

function openBuilding(id) {
  const build = BUILDINGS.find((candidate) => candidate.id === id);
  const overlay = buildingOverlays.find((candidate) => Number(candidate.dataset.buildingOverlay) === id);
  if (!build || !overlay) return;
  // Changing directly to another building should retain the selected variant
  // throughout the handoff, then activate only the newly selected building.
  closeBuildingOverlays({ clearSelection: false });
  setActiveBuilding(id);
  selectedName = build.name;
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  animateMapTo(positionForWorldCenter(getBuildingWorldCenter(build), zoom));
}

function closeBuildingOverlays({ clearSelection = true } = {}) {
  buildingOverlays.forEach((overlay) => {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
  });
  if (clearSelection) setActiveBuilding(null);
}

function zoomAt(point, zoomDelta, shouldRender = true) {
  const boundedZoom = Math.min(ZOOM.max, Math.max(ZOOM.min, zoom + zoomDelta));
  if (boundedZoom === zoom) return false;
  const zoomRatio = boundedZoom / zoom;
  mapPosition = constrainPosition({
    x: point.x - (point.x - mapPosition.x) * zoomRatio,
    y: point.y - (point.y - mapPosition.y) * zoomRatio,
  }, boundedZoom);
  zoom = boundedZoom;
  if (shouldRender) applyMapPosition();
  return true;
}

function animateZoomTo(targetZoom, focus = getViewportCenter()) {
  const boundedZoom = Math.min(ZOOM.max, Math.max(ZOOM.min, targetZoom));
  if (Math.abs(boundedZoom - zoom) < .0001) return;
  stopPassiveMotion();
  zoomTween = {
    startedAt: performance.now(),
    fromZoom: zoom,
    toZoom: boundedZoom,
    fromPosition: { ...mapPosition },
    focus: { ...focus },
  };
  requestMotionFrame();
}

function enterMapUi() {
  uiLayer.classList.remove('is-entered');
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (!mapPage.classList.contains('is-hidden')) uiLayer.classList.add('is-entered');
    });
  });
}

function normalizeWheelDelta(event) {
  const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
    : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? window.innerHeight : 1;
  const delta = event.deltaY * unit;
  return Math.sign(delta) * Math.min(Math.abs(delta), 120);
}

function runMotionFrame(timestamp) {
  motionFrame = 0;
  const deltaTime = Math.min(Math.max(timestamp - (motionLastTime || timestamp), 0), 40);
  motionLastTime = timestamp;

  if (cameraTween) {
    const progress = Math.min((timestamp - cameraTween.startedAt) / MOTION.camera.duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    mapPosition = {
      x: cameraTween.from.x + (cameraTween.to.x - cameraTween.from.x) * eased,
      y: cameraTween.from.y + (cameraTween.to.y - cameraTween.from.y) * eased,
    };
    applyMapPosition();
    if (progress === 1) cameraTween = null;
  } else if (zoomTween) {
    const progress = Math.min((timestamp - zoomTween.startedAt) / MOTION.zoom.controlDuration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const nextZoom = zoomTween.fromZoom + (zoomTween.toZoom - zoomTween.fromZoom) * eased;
    const zoomRatio = nextZoom / zoomTween.fromZoom;
    zoom = nextZoom;
    mapPosition = constrainPosition({
      x: zoomTween.focus.x - (zoomTween.focus.x - zoomTween.fromPosition.x) * zoomRatio,
      y: zoomTween.focus.y - (zoomTween.focus.y - zoomTween.fromPosition.y) * zoomRatio,
    }, zoom);
    applyMapPosition();
    if (progress === 1) zoomTween = null;
  } else {
    let needsRender = false;
    if (Math.hypot(dragVelocity.x, dragVelocity.y) >= MOTION.drag.stopVelocity) {
      const nextPosition = constrainPosition({
        x: mapPosition.x + dragVelocity.x * deltaTime,
        y: mapPosition.y + dragVelocity.y * deltaTime,
      });
      const hitBoundary = nextPosition.x !== mapPosition.x + dragVelocity.x * deltaTime
        || nextPosition.y !== mapPosition.y + dragVelocity.y * deltaTime;
      mapPosition = nextPosition;
      const damping = Math.exp(-MOTION.drag.damping * deltaTime);
      dragVelocity.x *= damping;
      dragVelocity.y *= damping;
      if (hitBoundary) dragVelocity = { x: 0, y: 0 };
      needsRender = true;
    } else {
      dragVelocity = { x: 0, y: 0 };
    }

    // Wheel events only enqueue a zoom delta. Applying it here guarantees one
    // map transform write per display frame even for high-frequency trackpads.
    if (pendingZoomDelta && zoomFocus) {
      const queuedDelta = pendingZoomDelta;
      pendingZoomDelta = 0;
      needsRender = zoomAt(zoomFocus, queuedDelta, false) || needsRender;
    }

    if (Math.abs(zoomVelocity) >= MOTION.zoom.stopVelocity && zoomFocus) {
      const zoomed = zoomAt(zoomFocus, zoomVelocity * deltaTime, false);
      const atLimit = (zoom === ZOOM.min && zoomVelocity < 0) || (zoom === ZOOM.max && zoomVelocity > 0);
      zoomVelocity *= Math.exp(-MOTION.zoom.damping * deltaTime);
      if (!zoomed || atLimit) zoomVelocity = 0;
      needsRender = zoomed || needsRender;
    } else {
      zoomVelocity = 0;
      zoomFocus = null;
    }

    if (needsRender) applyMapPosition();
  }

  if (cameraTween || zoomTween || Math.hypot(dragVelocity.x, dragVelocity.y) >= MOTION.drag.stopVelocity || Math.abs(zoomVelocity) >= MOTION.zoom.stopVelocity || pendingZoomDelta) {
    requestMotionFrame();
  } else {
    motionLastTime = 0;
  }
}

function completeLandingTransition() {
  if (!landingTransitioning) return;
  landingTransitioning = false;
  zoom = INITIAL_ZOOM;
  mapPosition = positionForWorldCenter(MAP_ORIGIN, zoom);
  selectedName = '-';
  applyCanvasSize();
  mapPage.classList.remove('is-hidden');

  // The already-rendered landing image becomes the interactive map image.
  // A matching destination geometry is visible before the DOM handoff, so no frame flashes.
  const sharedMap = landingMap.querySelector(':scope > .map-art');
  sharedMap.className = 'map-art';
  sharedMap.removeAttribute('aria-hidden');
  sharedMap.setAttribute('aria-label', '서울 지도');
  if (mapArt) mapArt.replaceWith(sharedMap);
  else canvas.prepend(sharedMap);
  mapArt = sharedMap;
  setBuildingLayerAccessibility(mapArt, true);
  updateMapDetailLayers();

  landing.classList.remove('is-transitioning');
  landing.classList.add('is-hidden');
  enterMapUi();
}

function beginLandingTransition() {
  if (landingTransitioning) return false;
  landingTransitioning = true;
  const scale = getScale();
  landing.classList.add('is-transitioning');

  // Landing and map-page use the same image and interpolate to the exact map-page rectangle.
  // This is deliberately independent of the click point, preventing click-position-dependent jumps.
  window.requestAnimationFrame(() => {
    applyLandingDestinationGeometry(scale);
  });
  return true;
}

function returnToLanding() {
  if (landingTransitioning) {
    returnRequestedDuringTransition = true;
    return;
  }
  if (mapPage.classList.contains('is-hidden')) return;
  if (scenarioOneIsOpen) closeScenarioOne();
  if (scenarioTwoIsOpen) closeScenarioTwo();
  if (activeEmbeddedScenarioId !== null) closeEmbeddedScenario(activeEmbeddedScenarioId, { immediate: true });
  closeIndexOverlay();
  closeBuildingOverlays();
  stopPassiveMotion();
  uiLayer.classList.remove('is-entered');
  mapPosition = positionForWorldCenter(MAP_ORIGIN, INITIAL_ZOOM);
  zoom = INITIAL_ZOOM;
  selectedName = '-';

  if (mapArt) {
    setBuildingLayerAccessibility(mapArt, false);
    mapArt.setAttribute('aria-hidden', 'true');
    mapArt.removeAttribute('aria-label');
    landingMap.replaceChildren(mapArt);
    mapArt = null;
  }
  mapPage.classList.add('is-hidden');
  landing.classList.remove('is-hidden', 'is-transitioning');
  applyLandingScale();
}

function returnToIntroSelection() {
  if (landingTransitioning || mapBackTransitioning || mapPage.classList.contains('is-hidden')) return;
  mapBackTransitioning = true;
  stopPassiveMotion();
  clearIntroTimers();

  // Keep the live map mounted for the complete dissolve. The selection screen is
  // prepared underneath it, preventing a map-to-landing flash during the handoff.
  showIntroScreen('page7', { clearTimers: false });
  intro.classList.remove('is-hidden', 'is-handing-off');
  intro.style.setProperty('--map-return-duration', `${INTRO.mapBack.duration}ms`);
  intro.style.setProperty('--map-return-easing', INTRO.mapBack.easing);
  mapPage.style.setProperty('--map-return-duration', `${INTRO.mapBack.duration}ms`);
  mapPage.style.setProperty('--map-return-easing', INTRO.mapBack.easing);
  intro.classList.add('is-map-return-target');

  window.requestAnimationFrame(() => {
    intro.classList.add('is-map-return-entering');
    mapPage.classList.add('is-returning-to-selection');
  });

  queueIntro(() => {
    // Reuse the existing cleanup so the same map node is ready when Map is picked again.
    returnToLanding();
    landing.classList.add('is-hidden');
    mapPage.classList.remove('is-returning-to-selection');
    mapPage.style.removeProperty('--map-return-duration');
    mapPage.style.removeProperty('--map-return-easing');
    intro.classList.remove('is-map-return-target', 'is-map-return-entering');
    intro.style.removeProperty('--map-return-duration');
    intro.style.removeProperty('--map-return-easing');
    mapBackTransitioning = false;
  }, INTRO.mapBack.duration);
}

enterMap.addEventListener('click', () => {
  if (beginLandingTransition()) window.history.pushState({ thetaScreen: 'map' }, '', window.location.href);
});
landingMap.addEventListener('transitionend', (event) => {
  if (event.target !== landingMap || event.propertyName !== 'transform') return;
  completeLandingTransition();
  if (returnRequestedDuringTransition) {
    returnRequestedDuringTransition = false;
    returnToLanding();
  }
});
window.addEventListener('popstate', returnToLanding);
introLandingStart.addEventListener('click', beginPreludeSequence);
introStart.addEventListener('click', beginIntroSequence);
introSkipButtons.forEach((button) => button.addEventListener('click', skipPreludeToPage6));
aboutChoice.addEventListener('pointerenter', () => setPage7Hover('about'));
aboutChoice.addEventListener('pointerleave', () => setPage7Hover(null));
aboutChoice.addEventListener('focus', () => setPage7Hover('about'));
aboutChoice.addEventListener('blur', () => setPage7Hover(null));
aboutChoice.addEventListener('click', enterAbout);
mapChoice.addEventListener('pointerenter', () => setPage7Hover('map'));
mapChoice.addEventListener('pointerleave', () => setPage7Hover(null));
mapChoice.addEventListener('focus', () => setPage7Hover('map'));
mapChoice.addEventListener('blur', () => setPage7Hover(null));
mapChoice.addEventListener('click', enterExistingLanding);
aboutBack.addEventListener('click', () => {
  if (introTransitioning) return;
  dissolveIntroTo('page7', INTRO.aboutBack);
});
mapBack.addEventListener('click', returnToIntroSelection);
zoomReset.addEventListener('click', () => {
  if (!isAnyScenarioOpen()) animateZoomTo(INITIAL_ZOOM);
});
zoomIn.addEventListener('click', () => {
  if (!isAnyScenarioOpen()) animateZoomTo(zoom + MAP_CONTROLS.zoomStep);
});
zoomOut.addEventListener('click', () => {
  if (!isAnyScenarioOpen()) animateZoomTo(zoom - MAP_CONTROLS.zoomStep);
});
indexTrigger.addEventListener('click', () => indexOverlay.classList.contains('is-open') ? closeIndexOverlay() : openIndex());
indexTrigger.addEventListener('pointerenter', () => {
  window.clearTimeout(indexTraceTimer);
  indexTrigger.classList.remove('is-tracing');
  window.requestAnimationFrame(() => {
    indexTrigger.classList.add('is-tracing');
    indexTraceTimer = window.setTimeout(() => indexTrigger.classList.remove('is-tracing'), INTRO.indexTrace.duration);
  });
});
closeIndex.addEventListener('click', closeIndexOverlay);
indexRows.forEach((row) => {
  const id = Number(row.dataset.indexBuilding);
  row.addEventListener('pointerenter', () => setIndexBuildingHover(id));
  row.addEventListener('pointerleave', clearIndexBuildingHover);
  row.addEventListener('focus', () => setIndexBuildingHover(id));
  row.addEventListener('blur', clearIndexBuildingHover);
  row.addEventListener('click', () => openBuilding(id));
});
indexOverlay.addEventListener('pointerdown', (event) => event.stopPropagation());

viewport.addEventListener('pointerdown', (event) => {
  if (isAnyScenarioOpen()) return;
  if (event.target.closest('button')) return;
  stopPassiveMotion();
  if (activeBuildingId != null) closeBuildingOverlays();
  if (indexOverlay.classList.contains('is-open')) closeIndexOverlay();
  drag = {
    lastX: event.clientX,
    lastY: event.clientY,
    lastTime: performance.now(),
    velocity: { x: 0, y: 0 },
  };
  viewport.setPointerCapture(event.pointerId);
  viewport.classList.add('is-dragging');
});
viewport.addEventListener('pointermove', (event) => {
  if (isAnyScenarioOpen()) return;
  if (!drag) return;
  const now = performance.now();
  const elapsed = Math.max(now - drag.lastTime, 1);
  const requestedDelta = {
    x: (event.clientX - drag.lastX) / displayScale,
    y: (event.clientY - drag.lastY) / displayScale,
  };
  const nextPosition = constrainPosition({
    x: mapPosition.x + requestedDelta.x,
    y: mapPosition.y + requestedDelta.y,
  });
  const appliedDelta = { x: nextPosition.x - mapPosition.x, y: nextPosition.y - mapPosition.y };
  const sample = { x: appliedDelta.x / elapsed, y: appliedDelta.y / elapsed };
  drag.velocity.x += (sample.x - drag.velocity.x) * MOTION.drag.sampleWeight;
  drag.velocity.y += (sample.y - drag.velocity.y) * MOTION.drag.sampleWeight;
  drag.velocity.x = Math.max(-MOTION.drag.maxVelocity, Math.min(MOTION.drag.maxVelocity, drag.velocity.x));
  drag.velocity.y = Math.max(-MOTION.drag.maxVelocity, Math.min(MOTION.drag.maxVelocity, drag.velocity.y));
  drag.lastX = event.clientX;
  drag.lastY = event.clientY;
  drag.lastTime = now;
  mapPosition = nextPosition;
  selectedName = '-';
  applyMapPosition();
});
function stopDrag(event) {
  if (!drag) return;
  dragVelocity = { ...drag.velocity };
  drag = null;
  viewport.classList.remove('is-dragging');
  if (event?.pointerId != null && viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
  if (Math.hypot(dragVelocity.x, dragVelocity.y) >= MOTION.drag.stopVelocity) requestMotionFrame();
  else dragVelocity = { x: 0, y: 0 };
}
viewport.addEventListener('pointerup', stopDrag);
viewport.addEventListener('pointercancel', stopDrag);
viewport.addEventListener('lostpointercapture', stopDrag);
viewport.addEventListener('wheel', (event) => {
  if (isAnyScenarioOpen()) {
    event.preventDefault();
    return;
  }
  event.preventDefault();
  cameraTween = null;
  zoomTween = null;
  dragVelocity = { x: 0, y: 0 };
  const delta = normalizeWheelDelta(event);
  if (!delta) return;
  const impulse = -delta * MOTION.zoom.wheelImpulse;
  if (zoomVelocity && Math.sign(zoomVelocity) !== Math.sign(impulse)) {
    zoomVelocity = 0;
    pendingZoomDelta = 0;
  }
  zoomVelocity = Math.max(-MOTION.zoom.maxVelocity, Math.min(MOTION.zoom.maxVelocity, zoomVelocity + impulse));
  zoomFocus = { x: event.clientX / displayScale, y: event.clientY / displayScale };
  const directDelta = -delta * MOTION.zoom.immediateFactor;
  pendingZoomDelta = Math.max(-MOTION.zoom.maxQueuedDelta, Math.min(MOTION.zoom.maxQueuedDelta, pendingZoomDelta + directDelta));
  requestMotionFrame();
}, { passive: false });

window.addEventListener('resize', () => {
  applyIntroScale();
  if (landingTransitioning) applyLandingDestinationGeometry();
  else applyLandingScale();
  if (!mapPage.classList.contains('is-hidden')) applyCanvasSize();
});
setupBuildingLayers();
setupBuildingOverlays();
setBuildingLayerAccessibility(landingMap, false);
setBuildingLayerAccessibility(mapArt, true);
applyMotionTokens();
applyIntroScale();
applyLandingScale();
