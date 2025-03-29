from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__, static_url_path='')
app.secret_key = 'your-secret-key-here'  # Required for session management
CORS(app)

# Path to our data file
DATA_FILE = 'data/data.json'
PROGRESS_FILE = 'data/progress.json'

def read_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {'books': []}

def write_data(data):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def read_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {}

def write_progress(data):
    os.makedirs(os.path.dirname(PROGRESS_FILE), exist_ok=True)
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def get_user_id():
    if 'user_id' not in session:
        session['user_id'] = str(datetime.now().timestamp())
    return session['user_id']

def is_ui_request():
    return 'XMLHttpRequest' in request.headers.get('X-Requested-With', '')

def update_progress(method):
    if is_ui_request():
        user_id = get_user_id()
        progress = read_progress()

        if user_id not in progress:
            progress[user_id] = {
                'mode': 'beginner',
                'completed_methods': [],
                'current_level': 0
            }

        if method not in progress[user_id]['completed_methods']:
            progress[user_id]['completed_methods'].append(method)
            write_progress(progress)

        return progress[user_id]
    return None

# Static file routes
@app.route('/')
def root():
    return send_from_directory('.', 'index.html')

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('js', path)

@app.route('/styles/<path:path>')
def send_css(path):
    return send_from_directory('styles', path)

@app.route('/data/<path:path>')
def send_data(path):
    return send_from_directory('data', path)

# Game management routes
@app.route('/api/mode', methods=['POST'])
def set_mode():
    data = request.get_json()
    mode = data.get('mode', 'beginner')
    user_id = get_user_id()

    progress = read_progress()
    if user_id not in progress:
        progress[user_id] = {
            'mode': mode,
            'completed_methods': [],
            'current_level': 0
        }
    else:
        progress[user_id]['mode'] = mode

    write_progress(progress)
    return jsonify(progress[user_id])

@app.route('/api/progress')
def get_progress():
    user_id = get_user_id()
    progress = read_progress()
    return jsonify(progress.get(user_id, {
        'mode': 'beginner',
        'completed_methods': [],
        'current_level': 0
    }))

# API Routes
@app.route('/api/books', methods=['GET'])
def get_books():
    data = read_data()
    progress = update_progress('GET')
    response = jsonify(data['books'])

    if progress:
        response.headers['X-Progress'] = json.dumps(progress)

    return response

@app.route('/api/books/<int:book_id>', methods=['GET'])
def get_book(book_id):
    data = read_data()
    book = next((b for b in data['books'] if b['id'] == book_id), None)
    progress = update_progress('GET')

    if book:
        response = jsonify(book)
        if progress:
            response.headers['X-Progress'] = json.dumps(progress)
        return response
    return jsonify({'error': 'Book not found'}), 404

@app.route('/api/books', methods=['POST'])
def create_book():
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 400

    data = read_data()
    new_book = request.get_json()

    if not all(k in new_book for k in ('title', 'author', 'year')):
        return jsonify({'error': 'Missing required fields'}), 400

    new_id = max([b['id'] for b in data['books']], default=0) + 1
    new_book['id'] = new_id
    new_book['available'] = True

    data['books'].append(new_book)
    write_data(data)

    progress = update_progress('POST')
    response = jsonify(new_book)

    if progress:
        response.headers['X-Progress'] = json.dumps(progress)

    return response, 201

@app.route('/api/books/<int:book_id>', methods=['PUT'])
def update_book(book_id):
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 400

    update_data = request.get_json()

    if 'title' not in update_data:
        return jsonify({
            'error': 'Title is required for PUT operations'
        }), 400

    data = read_data()
    book_index = next((i for i, b in enumerate(data['books']) if b['id'] == book_id), None)

    if book_index is None:
        return jsonify({'error': 'Book not found'}), 404

    old_book = data['books'][book_index]
    data['books'][book_index] = {
        'id': old_book['id'],
        'title': update_data['title'],
        'author': update_data.get('author', ''),
        'year': update_data.get('year', None),
        'available': old_book['available']
    }

    write_data(data)

    progress = update_progress('PUT')
    response = jsonify(data['books'][book_index])

    if progress:
        response.headers['X-Progress'] = json.dumps(progress)

    return response

@app.route('/api/books/<int:book_id>', methods=['PATCH'])
def patch_book(book_id):
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 400

    update_data = request.get_json()

    if not any(k in update_data for k in ('title', 'author', 'year')):
        return jsonify({
            'error': 'At least one field (title, author, or year) is required for PATCH operations'
        }), 400

    data = read_data()
    book_index = next((i for i, b in enumerate(data['books']) if b['id'] == book_id), None)

    if book_index is None:
        return jsonify({'error': 'Book not found'}), 404

    old_book = data['books'][book_index]
    for field in ('title', 'author', 'year'):
        if field in update_data:
            old_book[field] = update_data[field]

    write_data(data)

    progress = update_progress('PATCH')
    response = jsonify(data['books'][book_index])

    if progress:
        response.headers['X-Progress'] = json.dumps(progress)

    return response

@app.route('/api/books/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    data = read_data()
    book_index = next((i for i, b in enumerate(data['books']) if b['id'] == book_id), None)

    if book_index is None:
        return jsonify({'error': 'Book not found'}), 404

    data['books'].pop(book_index)
    write_data(data)

    progress = update_progress('DELETE')
    response = jsonify({})

    if progress:
        response.headers['X-Progress'] = json.dumps(progress)

    return response, 204

if __name__ == '__main__':
    # Ensure the data directories exist
    os.makedirs('data', exist_ok=True)

    # Create initial data files if they don't exist
    if not os.path.exists(DATA_FILE):
        write_data({'books': []})
    if not os.path.exists(PROGRESS_FILE):
        write_progress({})

    app.run(port=3000, debug=True)