from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/convert', methods=['POST'])
def convert_file():
    """
    파일 업로드 엔드포인트
    - 파일 받기
    - 아직 변환 로직 없음
    - 상태만 반환
    """
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "파일이 없습니다"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"status": "error", "message": "파일명이 없습니다"}), 400

    # 파일 받기 성공
    # 추후 변환 로직 추가 예정
    return jsonify({"status": "received", "filename": file.filename}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
