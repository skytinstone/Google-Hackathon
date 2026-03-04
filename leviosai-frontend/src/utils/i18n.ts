// ── Lightweight i18n singleton ───────────────────────────────
// Mirrors syslog.ts pub/sub pattern. Call t() from anywhere.

import { useState, useEffect } from 'react'

export type Locale = 'en' | 'ko'

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Nav
    'nav.dashboard': 'Dashboard',
    'nav.project': 'Project',
    'nav.contact': 'Contact',
    'nav.settings': 'Settings',

    // Dashboard
    'dashboard.title': 'Operations Center',
    'dashboard.subtitle': 'LeviosAI · Operations Center',
    'dashboard.newPipeline': 'New Pipeline',
    'dashboard.totalPipelines': 'Total Pipelines',
    'dashboard.activeDomains': 'Active Domains',
    'dashboard.hwConfigs': 'Hardware Configs',
    'dashboard.modelsDeployed': 'Models Deployed',
    'dashboard.allPipelines': 'All Pipelines',
    'dashboard.noPipelines': 'No pipelines initialized',
    'dashboard.initPipeline': 'Initialize Pipeline',
    'dashboard.search': 'Search pipelines...',
    'dashboard.allDomains': 'All Domains',
    'dashboard.allHardware': 'All Hardware',
    'dashboard.domainDist': 'Domain Distribution',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.hwUtilization': 'Hardware Utilization',
    'dashboard.langDist': 'Language Distribution',
    'dashboard.sensorCoverage': 'Sensor Coverage',
    'dashboard.live': 'LIVE',

    // Steps
    'step1.title': 'Select AI Domain',
    'step1.subtitle': 'Choose the application domain for your Edge AI deployment',
    'step2.title': 'Select Hardware',
    'step2.subtitle': 'Choose your edge computing platform and optional sensors',
    'step3.title': 'Hardware Configuration',
    'step3.subtitle': 'Configure sensor pipeline and data flow topology',
    'step4.title': 'Select AI Model',
    'step4.subtitle': 'Choose a pre-trained model optimized for your domain and hardware',
    'step5.title': 'Optimization Techniques',
    'step5.subtitle': 'Select optimization methods for edge deployment',
    'step6.title': 'Code Generation',
    'step6.subtitle': 'Generate deployment code for your configured pipeline',
    'step7.title': 'Configuration Complete',
    'step7.subtitle': 'Review your Edge AI pipeline and save it to your Dashboard',

    // Common
    'common.back': '← Back',
    'common.next': 'Next',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.delete': 'Delete',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.copy': 'Copy',
    'common.copied': 'Copied!',
    'common.download': 'Download',
    'common.search': 'Search',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Configure system preferences and manage data',
    'settings.apiKey': 'API Key Management',
    'settings.accent': 'Accent Color',
    'settings.language': 'Language',
    'settings.data': 'Project Data Management',
    'settings.exportProjects': 'Export Projects',
    'settings.importProjects': 'Import Projects',
    'settings.about': 'About LeviosAI',

    // Admin
    'admin.title': 'Admin Console',
    'admin.subtitle': 'System administration and monitoring dashboard',
    'admin.users': 'Users',
    'admin.access': 'Access Logs',
    'admin.traffic': 'Traffic',
    'admin.api': 'API Usage',
    'admin.system': 'System',

    // Login
    'login.systemOnline': 'System Online',
    'login.authenticate': 'AUTHENTICATE',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.submit': 'Enter System',

    // Project
    'project.create': 'Create Project',
    'project.name': 'Project Name',
    'project.author': 'Author',
    'project.description': 'Description',
    'project.templates': 'Quick Start Templates',
    'project.addProject': 'Add Project',
    'project.saved': 'Project Saved!',
    'project.startNew': 'Start New Pipeline',

    // Deployment
    'deploy.title': 'Quick Start Guide',
    'deploy.expand': 'Expand',
    'deploy.collapse': 'Collapse',

    // Toast
    'toast.projectSaved': 'Project saved to dashboard',
    'toast.exported': 'Projects exported successfully',
    'toast.imported': 'project(s) imported',
    'toast.deleted': 'Project deleted',
    'toast.duplicated': 'Project duplicated',
    'toast.apiKeyRemoved': 'API Key removed',
    'toast.accentUpdated': 'Accent color updated',

    // Shop
    'nav.shop': 'Procurement',
    'shop.title': 'Component Procurement',
    'shop.subtitle': 'Purchase hardware components for your Edge AI projects',
    'shop.bom': 'Bill of Materials',
    'shop.bomDesc': 'Auto-generated from your current project configuration',
    'shop.cart': 'Cart',
    'shop.addToCart': 'Add to Cart',
    'shop.addRequired': 'Add Required',
    'shop.addAll': 'Add All',
    'shop.exportBom': 'Export BOM',
    'shop.exportCart': 'Export Cart',
    'shop.clearCart': 'Clear Cart',
    'shop.emptyCart': 'Your cart is empty',
    'shop.estimatedTotal': 'Estimated Total',
    'shop.openInStore': 'Open in Store',
    'shop.allCategories': 'All',
    'shop.searchProducts': 'Search products...',
    'shop.recommended': 'Recommended',
    'shop.required': 'Required',
    'shop.optional': 'Optional',
    'shop.noProject': 'Create a project first to get personalized BOM recommendations',
    'shop.shopComponents': 'Shop Components',
    'shop.qty': 'Qty',
    'shop.compareStores': 'Compare Stores',
  },

  ko: {
    // Nav
    'nav.dashboard': '대시보드',
    'nav.project': '프로젝트',
    'nav.contact': '연락처',
    'nav.settings': '설정',

    // Dashboard
    'dashboard.title': '운영 센터',
    'dashboard.subtitle': 'LeviosAI · 운영 센터',
    'dashboard.newPipeline': '새 파이프라인',
    'dashboard.totalPipelines': '총 파이프라인',
    'dashboard.activeDomains': '활성 도메인',
    'dashboard.hwConfigs': '하드웨어 구성',
    'dashboard.modelsDeployed': '배포 모델',
    'dashboard.allPipelines': '전체 파이프라인',
    'dashboard.noPipelines': '초기화된 파이프라인 없음',
    'dashboard.initPipeline': '파이프라인 초기화',
    'dashboard.search': '파이프라인 검색...',
    'dashboard.allDomains': '전체 도메인',
    'dashboard.allHardware': '전체 하드웨어',
    'dashboard.domainDist': '도메인 분포',
    'dashboard.recentActivity': '최근 활동',
    'dashboard.hwUtilization': '하드웨어 사용률',
    'dashboard.langDist': '언어 분포',
    'dashboard.sensorCoverage': '센서 커버리지',
    'dashboard.live': '실시간',

    // Steps
    'step1.title': 'AI 도메인 선택',
    'step1.subtitle': 'Edge AI 배포를 위한 도메인을 선택하세요',
    'step2.title': '하드웨어 선택',
    'step2.subtitle': '엣지 컴퓨팅 플랫폼과 센서를 선택하세요',
    'step3.title': '하드웨어 구성',
    'step3.subtitle': '센서 파이프라인과 데이터 흐름을 구성하세요',
    'step4.title': 'AI 모델 선택',
    'step4.subtitle': '도메인과 하드웨어에 최적화된 사전 학습 모델을 선택하세요',
    'step5.title': '최적화 기법',
    'step5.subtitle': '엣지 배포를 위한 최적화 방법을 선택하세요',
    'step6.title': '코드 생성',
    'step6.subtitle': '구성된 파이프라인의 배포 코드를 생성하세요',
    'step7.title': '구성 완료',
    'step7.subtitle': 'Edge AI 파이프라인을 검토하고 대시보드에 저장하세요',

    // Common
    'common.back': '← 이전',
    'common.next': '다음',
    'common.save': '저장',
    'common.cancel': '취소',
    'common.close': '닫기',
    'common.delete': '삭제',
    'common.export': '내보내기',
    'common.import': '가져오기',
    'common.copy': '복사',
    'common.copied': '복사됨!',
    'common.download': '다운로드',
    'common.search': '검색',

    // Settings
    'settings.title': '설정',
    'settings.subtitle': '시스템 환경설정 및 데이터 관리',
    'settings.apiKey': 'API 키 관리',
    'settings.accent': '강조 색상',
    'settings.language': '언어',
    'settings.data': '프로젝트 데이터 관리',
    'settings.exportProjects': '프로젝트 내보내기',
    'settings.importProjects': '프로젝트 가져오기',
    'settings.about': 'LeviosAI 정보',

    // Admin
    'admin.title': '관리자 콘솔',
    'admin.subtitle': '시스템 관리 및 모니터링 대시보드',
    'admin.users': '사용자',
    'admin.access': '접속 로그',
    'admin.traffic': '트래픽',
    'admin.api': 'API 사용량',
    'admin.system': '시스템',

    // Login
    'login.systemOnline': '시스템 온라인',
    'login.authenticate': '인증',
    'login.username': '사용자 이름',
    'login.password': '비밀번호',
    'login.submit': '시스템 접속',

    // Project
    'project.create': '프로젝트 생성',
    'project.name': '프로젝트 이름',
    'project.author': '작성자',
    'project.description': '설명',
    'project.templates': '빠른 시작 템플릿',
    'project.addProject': '프로젝트 추가',
    'project.saved': '프로젝트 저장 완료!',
    'project.startNew': '새 파이프라인 시작',

    // Deployment
    'deploy.title': '빠른 시작 가이드',
    'deploy.expand': '펼치기',
    'deploy.collapse': '접기',

    // Toast
    'toast.projectSaved': '프로젝트가 대시보드에 저장되었습니다',
    'toast.exported': '프로젝트를 성공적으로 내보냈습니다',
    'toast.imported': '개의 프로젝트를 가져왔습니다',
    'toast.deleted': '프로젝트가 삭제되었습니다',
    'toast.duplicated': '프로젝트가 복제되었습니다',
    'toast.apiKeyRemoved': 'API 키가 제거되었습니다',
    'toast.accentUpdated': '강조 색상이 변경되었습니다',

    // Shop
    'nav.shop': '부품 구매',
    'shop.title': '부품 조달',
    'shop.subtitle': 'Edge AI 프로젝트에 필요한 하드웨어 부품을 구매하세요',
    'shop.bom': '자재 명세서 (BOM)',
    'shop.bomDesc': '현재 프로젝트 설정에서 자동 생성됨',
    'shop.cart': '장바구니',
    'shop.addToCart': '장바구니에 추가',
    'shop.addRequired': '필수 항목 추가',
    'shop.addAll': '전체 추가',
    'shop.exportBom': 'BOM 내보내기',
    'shop.exportCart': '장바구니 내보내기',
    'shop.clearCart': '장바구니 비우기',
    'shop.emptyCart': '장바구니가 비어있습니다',
    'shop.estimatedTotal': '예상 합계',
    'shop.openInStore': '스토어에서 보기',
    'shop.allCategories': '전체',
    'shop.searchProducts': '부품 검색...',
    'shop.recommended': '추천',
    'shop.required': '필수',
    'shop.optional': '선택',
    'shop.noProject': '프로젝트를 먼저 생성하면 맞춤 BOM 추천을 받을 수 있습니다',
    'shop.shopComponents': '부품 구매',
    'shop.qty': '수량',
    'shop.compareStores': '스토어 비교',
  },
}

// ── Singleton state ──────────────────────────────────────────

type Listener = (locale: Locale) => void

let currentLocale: Locale = (localStorage.getItem('leviosai_lang') as Locale) || 'en'
const listeners = new Set<Listener>()

export function t(key: string): string {
  return translations[currentLocale][key] ?? translations['en'][key] ?? key
}

export function setLocale(locale: Locale): void {
  currentLocale = locale
  localStorage.setItem('leviosai_lang', locale)
  listeners.forEach(l => l(locale))
}

export function getLocale(): Locale {
  return currentLocale
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// ── React hook ───────────────────────────────────────────────

export function useI18n() {
  const [locale, setLocaleState] = useState(currentLocale)

  useEffect(() => {
    const unsub = subscribe(setLocaleState)
    return unsub
  }, [])

  return { t, locale, setLocale }
}
