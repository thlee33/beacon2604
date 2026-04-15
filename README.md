# 봉수(烽燧) 디지털 트윈 📡🔥

대동여지도의 봉수 정보를 기반으로 현재 지도와 매칭 가능한 남한 지역의 봉수대를 위치화하고, 
**제2로 네트워크에 해당하는 부산 응봉으로부터 경봉수인 한양 목멱산 봉수대**를 3D 지형 위에 표시하고, 옛날 봉수군들처럼 봉수대 간의 **가시권(Line of Sight, LoS)**을 직접 시뮬레이션 및 검증해 볼 수 있는 3D 웹 디지털 트윈 프로젝트입니다.

---

## 🚀 프로젝트 개요
과거 국경의 위급한 소식을 중앙으로 전달하던 대표적 통신 수단인 '봉수'가 실제로 산맥의 방해 없이 눈으로 관측 가능했는지 체험할 수 있습니다. 
사용자가 좌측 UI에서 특정 봉수대(예: 계명산)를 선택하면, 카메라가 해당 지역의 산꼭대기로 날아가 **직전 봉수대**(예: 황령산) 방향을 바라봅니다. 이때 직전 봉수대에서 피어오르는 **가상의 불꽃 파티클 이펙트**를 확인하며 두 거점 간 지형적 가림막이 없었음을 직관적으로 확인할 수 있습니다.

## 🛠 기술 스택
- **Language**: HTML5, CSS3, Vanilla JavaScript
- **3D WebGIS Engine**: [CesiumJS](https://cesium.com/platform/cesiumjs/) (v1.116)
  - Cesium World Terrain (3D 지형)
  - Bing Maps Imagery (위성 영상 기본 베이스)
- **Visual Effects**: HTML5 2D Canvas를 활용한 경량화 불꽃 파티클 시스템

## 📂 폴더 구조

```text
beacon2604/
├── docs/                   # 프로젝트 관련 문서 자료실 (기술 블로그, PRD 등)
└── web/
    ├── data/
    │   └── beacon.geojson  # 대동여지도 기반 제2로 봉수대 수급 좌표계 (공간 데이터)
    ├── img/
    │   └── fire.svg        # 초기 점화 기본 위치를 잡아주는 베이스 아이콘
    ├── index.html          # 메인 프레임 (사이드바 메뉴 및 Cesium, Canvas 겹침 구조)
    ├── style.css           # 글래스모피즘 CSS 스타일시트 
    └── main.js             # 데이터 비동기 파싱, 카메라 연동, 파티클 루프 로직 통합
```

## 출처
대동여지도 지명DB : https://www.hisgeo.info/wiki/%EC%A1%B0%EC%84%A0_%EB%8C%80%EB%8F%99%EC%97%AC%EC%A7%80%EB%8F%84_DB 

## 관련 사이트 
기술 블로그 : https://unique-payment-110.notion.site/2026-04-18-34080db13da58073bc3ff88b96ada8b0  
Github : https://github.com/thlee33/beacon2604   
위키백과 - 제2로 직봉 : https://ko.wikipedia.org/wiki/%EC%A0%9C2%EB%A1%9C_%EC%A7%81%EB%B4%89  
나무위키 - 봉화 : https://namu.wiki/w/%EB%B4%89%ED%99%94#rfn-7  
위키백과 - 조선의 봉수 : https://ko.wikipedia.org/wiki/%EC%A1%B0%EC%84%A0%EC%9D%98_%EB%B4%89%EC%88%98  
우리역사넷 - https://contents.history.go.kr/mobile/eh/view.do?levelId=eh_r0184_0010&  
