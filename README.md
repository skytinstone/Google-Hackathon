# Google-Hackathon

# LeviosAI 🪄
> Google DeepMind Gemini 3 Seoul Hackathon Project

![LeviosAI Logo](https://via.placeholder.com/150?text=Palantir+Style+Logo)
LeviosAI는 강력한 언어 모델의 접근성을 높이기 위해 기획된 프로젝트입니다. Exaone 4.0 1.2B 모델을 기반으로 모델 압축 및 경량화(Quantization, Pruning) 기법을 적용하여 최적화된 성능을 구현했으며, 구글의 최신 `google-genai` 패키지를 활용한 Gemini API를 백엔드에 통합하여 혁신적인 AI 경험을 제공합니다.

## 🌐 라이브 서비스 안내
현재 배포되어 라우팅된 공식 웹사이트 주소는 아래와 같습니다.
👉 **((https://leviosai.cloud/))**

## 🛠️ 로컬 실행 방법 (Local Development)

프로젝트를 로컬 환경에서 실행하려면 아래의 명령어들을 터미널에 입력해 주세요.

### 1. Backend (백엔드)
Python 환경에서 최신 Gemini API와 모델 경량화 파이프라인을 실행합니다.

```bash
# 백엔드 디렉토리로 이동
cd leviosai-backend

# 필요한 패키지 설치 (google-genai 등)
pip install -r requirements.txt

# 프론트엔드 디렉토리로 이동
cd leviosai-frontend  # (실제 폴더명으로 변경해 주세요)

# 패키지 설치
npm install  # 또는 yarn install

# 로컬 개발 서버 실행
npm run dev  # 또는 yarn dev

# 🇬🇧 README.md (English Version)

```markdown
# LeviosAI 🪄
> A Project for the Google DeepMind Gemini 3 Seoul Hackathon

![LeviosAI Logo](https://via.placeholder.com/150?text=Palantir+Style+Logo)
LeviosAI is designed to enhance the accessibility and efficiency of Large Language Models. Built upon the Exaone 4.0 1.2B model, this project implements advanced model compression techniques (Quantization and Pruning) for optimized performance. Furthermore, it seamlessly integrates the latest Gemini API via the `google-genai` SDK into the backend to deliver a powerful generative AI experience.

## 🌐 Live Service
The application is currently deployed and available at:
👉 **[https://www.leviosai.cloud](https://www.leviosai.cloud)**

## 🛠️ Local Setup & Run Instructions

Follow these steps to run the application in your local development environment.

### 1. Backend
Runs the Python server handling the model compression pipeline and the latest Gemini API integrations.

```bash
# Navigate to the backend directory
cd leviosai-backend

# Install the required dependencies (including google-genai)
pip install -r requirements.txt

# Start the backend server
python test.py  # or your main execution command (e.g., uvicorn main:app --reload)

# Navigate to the frontend directory
cd leviosai-frontend  # (Please update to your actual directory name)

# Install packages
npm install  # or yarn install

# Start the local development server
npm run dev  # or yarn dev
