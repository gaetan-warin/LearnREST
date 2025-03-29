from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os

app = Flask(__name__, static_url_path='')
CORS(app)  # Enable CORS for all routes

# Path to our data file
DATA_FILE = 'data/data.json'

def read_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {'books': []}

def write_data(data):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

# Serve static files
@app.route('/')
def root():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

# API Routes
@app.route('/api/books', methods=['GET'])
def get_books():
    data = read_data()
    return jsonify(data['books'])

@app.route('/api/books/<int:book_id>', methods=['GET'])
def get_book(book_id):
    data = read_data()
    book = next((b for b in data['books'] if b['id'] == book_id), None)
    if book:
        return jsonify(book)
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

    return jsonify(new_book), 201

@app.route('/api/books/<int:book_id>', methods=['PUT'])
def update_book(book_id):
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 400

    data = read_data()
    book_index = next((i for i, b in enumerate(data['books']) if b['id'] == book_id), None)

    if book_index is None:
        return jsonify({'error': 'Book not found'}), 404

    update_data = request.get_json()
    data['books'][book_index].update(update_data)
    write_data(data)

    return jsonify(data['books'][book_index])

@app.route('/api/books/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    data = read_data()
    book_index = next((i for i, b in enumerate(data['books']) if b['id'] == book_id), None)

    if book_index is None:
        return jsonify({'error': 'Book not found'}), 404

    data['books'].pop(book_index)
    write_data(data)

    return '', 204

if __name__ == '__main__':
    app.run(port=3000, debug=True)