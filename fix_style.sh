#!/bin/bash
cd ~/문서/freecomfortlab-pages || exit

# CSS 파일 수정 (버튼 + 배경 포함)
STYLE_FILE="style.css"
if [ ! -f "$STYLE_FILE" ]; then
  STYLE_FILE=$(find . -name "*.css" | head -n 1)
fi

cat << EOC > $STYLE_FILE
body {
  background-color: #0e0f14;
  color: #f0f0f0;
  font-family: 'Pretendard', sans-serif;
}

button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  white-space: nowrap;
  border-radius: 8px;
  background-color: #1f1f25;
  color: #f0f0f0;
  border: none;
  transition: 0.2s ease;
}

button:hover {
  background-color: #2c2e38;
  transform: scale(1.03);
}

a:hover, .hoverable:hover {
  color: #80d0ff;
}
EOC

# git 반영
git add $STYLE_FILE
git commit -m "fix: 배경색/버튼 스타일 오류 수정"
git push origin main
