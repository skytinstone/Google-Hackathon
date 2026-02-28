import google.generativeai as genai

# 발급받으신 API 키를 입력해 주세요
genai.configure(api_key="AIzaSyDXiO0EwskE8Tl6Dd25gFpocbxA-_C58NU")

# 현재 사용 가능한(generateContent 지원) 모델 이름 전체 출력하기
print("사용 가능한 모델 목록:")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
