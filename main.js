// main.js

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzYTM3ODhlNC1jOWUxLTRhOTYtYTgwZC1iMDA3OGJiMTQwZDciLCJpZCI6MTI5NDU5LCJpYXQiOjE2ODIwNTc4NjN9.GC-W9QfAFa9rXMh2Ow2rSC5UvLcwtS_qjWJ1v454z1A';

const FIRE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <path d="M12 2C12 2 8 6 8 10C8 12.21 9.79 14 12 14C14.21 14 16 12.21 16 10C16 6 12 2 12 2ZM12 22C8.69 22 6 19.31 6 16C6 14.39 6.64 12.92 7.68 11.83C7.29 12.63 7.07 13.52 7.15 14.43C7.4 17.5 9.87 19.98 12.93 20.21C16.29 20.46 19 17.8 19 14.48C19 12.27 17.91 10.3 16.14 9.1C17.3 10.36 18 12.09 18 14C18 17.31 15.31 20 12 22Z" fill="#ff4d4d" filter="url(#glow)"/>
  <path d="M12 14C10.9 14 10 13.1 10 12C10 10.9 12 8 12 8C12 8 14 10.9 14 12C14 13.1 13.1 14 12 14Z" fill="#ffdd55"/>
</svg>`;

const fireIconUrl = 'data:image/svg+xml;base64,' + btoa(FIRE_SVG);

// Initialize Cesium Viewer
const viewer = new Cesium.Viewer('cesiumContainer', {
  terrain: Cesium.Terrain.fromWorldTerrain(),
  animation: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  geocoder: false,
  homeButton: false,
  infoBox: false,
  sceneModePicker: false,
  selectionIndicator: false,
  timeline: false,
  navigationHelpButton: false,
  navigationInstructionsInitiallyVisible: false
});

// Remove default logo if possible (for prototype)
viewer.cesiumWidget.creditContainer.style.display = "none";

// Set to night time
viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date('2023-01-01T15:00:00Z'));
viewer.scene.globe.enableLighting = true;
viewer.scene.skyAtmosphere.show = true;

// ── 파티클 설정 ────────────────────────────────────────────────────────
const FC = document.getElementById('fire-canvas');
const CTX = FC.getContext('2d', { alpha: true });
let particles = [];
let burningBeacon = null; // 현재 불타는 봉수 객체

function resizeFC(){
  FC.width = window.innerWidth;
  FC.height = window.innerHeight;
}
window.addEventListener('resize', resizeFC);
resizeFC();

// 파티클 생성 함수
function mkParticle(cartesian, baseScale) {
  // 제2로 봉수(baseScale가 큼)일 때 스케일 증폭
  const scale = baseScale * (Math.random() * 0.6 + 0.8) * 1.5;
  particles.push({
    cartesian: cartesian,
    dx: (Math.random() - 0.5) * 6 * scale,
    dy: Math.random() * -2 * scale,
    vx: (Math.random() - 0.5) * 1.5 * scale,
    vy: -(Math.random() * 2.5 + 1.5) * scale,
    life: 1, 
    decay: 0.02 + Math.random() * 0.02,
    size: (Math.random() * 5 + 3.0) * scale,
    hue: Math.random() * 22
  });
}

// 렌더링 이벤트 루프 
viewer.scene.postRender.addEventListener(function() {
  CTX.clearRect(0, 0, FC.width, FC.height);
  
  // 파티클 스폰 로직 (타겟 봉수가 켜져있고 최신 LOD 고도에 맞게 보정)
  if (burningBeacon) {
    const carto = Cesium.Cartographic.fromDegrees(burningBeacon.lon, burningBeacon.lat);
    const lodH = viewer.scene.globe.getHeight(carto);
    // 지형의 LOD 변동을 극복하기 위해 매 프레임 정확한 상대고도(기본 15m 또는 커스텀 지정값) 산출
    const offset = burningBeacon.relativeOffset !== undefined ? burningBeacon.relativeOffset : 15;
    const h = (lodH !== undefined ? lodH : burningBeacon.height) + offset; 
    const currentBurningCartesian = Cesium.Cartesian3.fromDegrees(burningBeacon.lon, burningBeacon.lat, h);

    const winPos = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, currentBurningCartesian);
    if (winPos) {
      // 불꽃 생성 
      for(let i=0; i<3; i++) {
        if (Math.random() < 0.85) {
           mkParticle(currentBurningCartesian, 1.8);
        }
      }
    }
  }

  // 상한 캡
  if (particles.length > 5000) particles.splice(0, particles.length - 5000);

  // 불꽃 렌더링
  CTX.globalCompositeOperation = 'lighter';
  const alive = [];
  for(const p of particles) {
     p.dx += p.vx; p.dy += p.vy;
     p.vx *= 0.96; p.vy *= 0.98;
     p.life -= p.decay;
     if (p.life <= 0) continue;
     
     const winPos = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, p.cartesian);
     // 카메라 밖으로 가려진 경우 파티클 보존하되 안 그림
     if (!winPos) {
         alive.push(p);
         continue; 
     }
     alive.push(p);

     const x = winPos.x + p.dx;
     const y = winPos.y + p.dy;
     const sz = Math.max(0.1, p.size * (0.3 + p.life * 0.7));
     const prog = 1 - p.life;
     const hue = 55 - prog * 55 + p.hue;
     const lgt = prog < 0.3 ? 88 : 65 - prog * 42;
     const alpha = p.life * 0.9;
     
     if (alpha < 0.01) continue;

     const g = CTX.createRadialGradient(x, y, 0, x, y, sz);
     g.addColorStop(0,   `hsla(${hue+15},100%,${Math.min(lgt+28,95)}%,${alpha})`);
     g.addColorStop(0.35,`hsla(${hue},100%,${lgt}%,${alpha*0.75})`);
     g.addColorStop(1,   `hsla(${Math.max(hue-22,0)},80%,${Math.max(lgt-22,12)}%,0)`);
     
     CTX.fillStyle = g;
     CTX.beginPath(); CTX.arc(x,y,sz,0,Math.PI*2); CTX.fill();
  }
  CTX.globalCompositeOperation = 'source-over';
  particles = alive;
});
// ───────────────────────────────────────────────────────────────────────

// Groups arrays
let group1 = []; // Busan to Yeongcheon
let group2 = []; // Chungju to Seoul

// Entities map for interactions
const beaconEntities = new Map();

async function init() {
  try {
    const dataSource = await Cesium.GeoJsonDataSource.load('./data/beacon.geojson');
    viewer.dataSources.add(dataSource);
    const entities = dataSource.entities.values;

    // 모든 지점의 고도 추출을 위한 Cartographic 배열 생성
    const cartos = entities.map(e => Cesium.Cartographic.fromCartesian(e.position.getValue(viewer.clock.currentTime)));
    
    // 지형 고도 동기 연산! (붕 뜨는 현상 완전 해결)
    if (viewer.terrainProvider && viewer.terrainProvider.availability) {
      await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, cartos);
    }

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const props = entity.properties;
      
      const isRoute2 = props.lane && props.lane.getValue() == 2;
      const beaconCheck = props.beacon_check ? props.beacon_check.getValue() : null;
      const nmKor = props.nm_kor ? props.nm_kor.getValue() : "봉수";
      
      // 높이가 정교하게 맞춰진 좌표
      const lon = Cesium.Math.toDegrees(cartos[i].longitude);
      const lat = Cesium.Math.toDegrees(cartos[i].latitude);
      const h = cartos[i].height || 0;
      
      let customOffset = 15;
      if (props.height) customOffset = parseFloat(props.height.getValue());
      else if (props.altitude) customOffset = parseFloat(props.altitude.getValue());

      // RELATIVE_TO_GROUND를 통해 LOD 변화에도 지형 표면으로부터 정확히 오프셋 위로 완벽히 고정
      const preciseCartesian = Cesium.Cartesian3.fromDegrees(lon, lat, customOffset);

      // Entity의 실질적 위치 데이터를 반영
      entity.position = preciseCartesian;

      entity.point = undefined;
      entity.billboard = new Cesium.BillboardGraphics({
        image: fireIconUrl,
        scale: isRoute2 ? 0.7 : 0.4,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
      });

      // Label 추가 (제2로 여부에 관계없이 200,000 축척에서부터 모두 보이도록 일괄 적용)
      entity.label = new Cesium.LabelGraphics({
        text: nmKor,
        font: '14px Pretendard, sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: new Cesium.Color(0, 0, 0, 0.8),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -35), // 불꽃 마커 위로 띄움
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 200000)
      });

      const beaconData = {
        id: entity.id,
        name: nmKor,
        lon: lon,
        lat: lat,
        height: h,
        relativeOffset: customOffset, // 오프셋 값 저장
        cartesian: preciseCartesian,
        entity: entity
      };

      beaconEntities.set(entity.id, beaconData);

      if (isRoute2) {
        if (beaconCheck === '1') {
          group1.push(beaconData);
        } else if (beaconCheck === '2') {
          group2.push(beaconData);
        }
      }
    }

    // Add Gyeongbokgung Geunjeongjeon manually
    const gyeongBokLon = 126.977000;
    const gyeongBokLat = 37.578428;
    const gbCarto = Cesium.Cartographic.fromDegrees(gyeongBokLon, gyeongBokLat);
    if (viewer.terrainProvider && viewer.terrainProvider.availability) {
      await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, [gbCarto]);
    }
    const gbHeight = gbCarto.height || 0;
    const gbCartesian = Cesium.Cartesian3.fromDegrees(gyeongBokLon, gyeongBokLat, 15);
    
    const gyeongBokEntity = viewer.entities.add({
      id: 'gyeongbokgung',
      position: gbCartesian,
      billboard: {
        image: fireIconUrl,
        scale: 0.8,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
      },
      label: {
        text: '경복궁 근정전',
        font: 'bold 16px Pretendard, sans-serif',
        fillColor: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 4,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -35),
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
      }
    });

    const gyeongBokData = {
      id: 'gyeongbokgung',
      name: '경복궁 근정전',
      lon: gyeongBokLon,
      lat: gyeongBokLat,
      height: gbHeight,
      cartesian: gbCartesian,
      entity: gyeongBokEntity
    };
    beaconEntities.set('gyeongbokgung', gyeongBokData);
    group2.push(gyeongBokData);

    // Sort groups by latitude ascending
    group1.sort((a, b) => a.lat - b.lat);
    group2.sort((a, b) => a.lat - b.lat);

    renderLists();

    // Hide loader
    document.getElementById('loadingOverlay').classList.add('hidden');

    bindUIEvents();

    // Fly to South Korea initially
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(128.0, 36.5, 800000),
      duration: 2.0
    });

  } catch (error) {
    console.error('Error loading geojson: ', error);
    document.getElementById('loadingOverlay').innerHTML = '<p>데이터 로딩 중 오류가 발생했습니다.</p>';
  }
}

function renderLists() {
  const ul1 = document.getElementById('list-group-1');
  const ul2 = document.getElementById('list-group-2');

  ul1.innerHTML = '';
  ul2.innerHTML = '';

  let seq = 1;
  group1.forEach((b, index) => {
    const prev = index > 0 ? group1[index - 1] : null;
    ul1.appendChild(createListItem(b, seq++, prev));
  });

  group2.forEach((b, index) => {
    const prev = index > 0 ? group2[index - 1] : null;
    ul2.appendChild(createListItem(b, seq++, prev));
  });
}

function createListItem(beaconInfo, seqNum, prevBeaconInfo) {
  const li = document.createElement('li');
  li.className = 'beacon-item';
  li.innerHTML = `
    <div class="seq-num">${seqNum}</div>
    <div class="beacon-name">${beaconInfo.name}</div>
  `;

  li.addEventListener('click', () => {
    document.querySelectorAll('.beacon-item').forEach(el => el.classList.remove('active'));
    li.classList.add('active');
    moveToBeacon(beaconInfo, prevBeaconInfo);
  });

  return li;
}

async function moveToBeacon(targetInfo, prevInfo) {
  // 카메라 타겟 고도 (사전 계산된 고도가 0일 수 있으므로 동적으로 최신 지형 고도 재조회)
  let targetHeight = targetInfo.height || 0;
  
  const carto = Cesium.Cartographic.fromDegrees(targetInfo.lon, targetInfo.lat);
  
  // 1차: 시각적 타일 고도(가장 높을 확률이 큼) 체크
  const visualHeight = viewer.scene.globe.getHeight(carto);
  if (visualHeight !== undefined) {
      targetHeight = Math.max(targetHeight, visualHeight);
  }
  
  // 2차: API를 통한 정밀 고도 재조회
  if (viewer.terrainProvider) {
      try {
          const updated = await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, [carto]);
          if (updated[0].height) {
              targetHeight = Math.max(targetHeight, updated[0].height);
              targetInfo.height = targetHeight; // 캐시 업데이트
          }
      } catch (e) {
          console.warn('고도 조회 실패, 기존 고도 사용', e);
      }
  }
  
  // 기본 카메라 관찰자 고도는 지표면 대비 30m 높이, 계명산과 내포점은 예외적으로 100m로 대폭 상향
  let cameraOffset = 30;
  if (targetInfo.name === '계명산' || targetInfo.name === '내포점') {
    cameraOffset = 100;
  }
  
  const observerHeight = Math.max(targetHeight + cameraOffset, cameraOffset);
  const cameraPos = Cesium.Cartesian3.fromDegrees(targetInfo.lon, targetInfo.lat, observerHeight);

  // 불꽃 초기화
  burningBeacon = null;

  try {
    if (!prevInfo) {
      const heading = Cesium.Math.toRadians(0);
      const pitch = Cesium.Math.toRadians(-15);
      
      viewer.camera.flyTo({
        destination: cameraPos,
        orientation: {
          heading: heading,
          pitch: pitch,
          roll: 0.0
        },
        duration: 2.0
      });

    } else {
      const prevCartesian = prevInfo.cartesian;

      const direction = Cesium.Cartesian3.subtract(prevCartesian, cameraPos, new Cesium.Cartesian3());
      Cesium.Cartesian3.normalize(direction, direction);

      const up = viewer.scene.globe.ellipsoid.geodeticSurfaceNormal(cameraPos, new Cesium.Cartesian3());

      // 직전 봉수에 불꽃 점화 객체 지정! (LOD 동적 추적 캔버스용)
      burningBeacon = prevInfo;

      // 직전 봉수 엔티티 강조
      if (prevInfo.entity && prevInfo.entity.billboard) {
         prevInfo.entity.billboard.scale = 2.0;
         setTimeout(() => { 
             if (prevInfo.entity && prevInfo.entity.billboard) prevInfo.entity.billboard.scale = 0.8; 
         }, 3000);
      }

      viewer.camera.flyTo({
        destination: cameraPos,
        orientation: {
          direction: direction,
          up: up
        },
        duration: 2.5
      });
    }
  } catch(e) {
    console.error(e);
  }
}

// 참조 패널 토글 바인딩 함수
function bindUIEvents() {
  const btnRef = document.getElementById('btn-references');
  const refContent = document.getElementById('ref-content');
  if (btnRef && refContent) {
    btnRef.addEventListener('click', () => {
      btnRef.classList.toggle('open');
      refContent.classList.toggle('open');
    });
  }
}

// Start
init();
