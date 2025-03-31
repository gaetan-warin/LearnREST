from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import os
from datetime import datetime

app = FastAPI(
    title="REST Quest API",
    description="A gamified API for learning REST concepts",
    version="1.0.0"
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": f"Internal Server Error: {exc}"},
    )

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/styles", StaticFiles(directory="styles"), name="styles")
app.mount("/data", StaticFiles(directory="data"), name="data")

# Path to our data files
DATA_FILE = 'data/data.json'
PROGRESS_FILE = 'data/progress.json'

# Pydantic models
class BookPut(BaseModel):
    """Model for PUT requests - only title required"""
    title: str
    author: Optional[str] = Field(default=None)
    year: Optional[int] = Field(default=None)


class CreateBook(BaseModel):
    title: str
    author: str
    year: int

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    year: Optional[int] = None

class GameMode(BaseModel):
    mode: str

class Progress(BaseModel):
    mode: str
    completed_methods: List[str]
    current_level: int

def read_data():
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r') as f:
                try:
                    return json.load(f)
                except json.JSONDecodeError as e:
                    print(f"Error decoding JSON in read_data: {e}")
                    return {'books': []}
        return {'books': []}
    except Exception as e:
        print(f"Error in read_data: {e}")
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

def get_user_id(request: Request) -> str:
    # Using client's IP as a simple user identifier
    return request.client.host

def is_ui_request(request: Request) -> bool:
    return 'XMLHttpRequest' in request.headers.get('X-Requested-With', '')

def update_progress(request: Request, method: str):
    if is_ui_request(request):
        user_id = get_user_id(request)
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
@app.get("/")
async def root():
    return FileResponse('index.html')

# Game management routes
@app.post("/api/mode")
async def set_mode(mode: GameMode, request: Request):
    """
    Set the game mode (beginner/advanced)
    """
    user_id = get_user_id(request)
    progress = read_progress()

    if user_id not in progress:
        progress[user_id] = {
            'mode': mode.mode,
            'completed_methods': [],
            'current_level': 0
        }
    else:
        progress[user_id]['mode'] = mode.mode

    write_progress(progress)
    return progress[user_id]

@app.get("/api/progress")
async def get_progress(request: Request):
    """
    Get the current game progress
    """
    user_id = get_user_id(request)
    progress = read_progress()
    return progress.get(user_id, {
        'mode': 'beginner',
        'completed_methods': [],
        'current_level': 0
    })

# Book API routes
@app.get("/api/books")
async def get_books(request: Request):
    """
    Get all books in the library
    """
    try:
        update_progress(request, 'GET')
        return JSONResponse(content=[{"id": 1, "title": "Test Book", "author": "Test Author", "year": 2024, "available": True}])
    except Exception as e:
        print(f"Error in get_books: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/books/{book_id}")
async def get_book(book_id: int, request: Request):
    """
    Get a specific book by ID
    """
    data = read_data()
    book = next((b for b in data['books'] if b['id'] == book_id), None)

    if book:
        update_progress(request, 'GET_ID')
        return book
    raise HTTPException(status_code=404, detail="Book not found")

@app.post("/api/books", status_code=201)
async def create_book(book: CreateBook, request: Request):
    """
    Create a new book
    """
    data = read_data()
    new_id = max([b['id'] for b in data['books']], default=0) + 1

    new_book = {
        'id': new_id,
        'title': book.title,
        'author': book.author,
        'year': book.year,
        'available': True
    }

    data['books'].append(new_book)
    write_data(data)

    update_progress(request, 'POST')
    return new_book

@app.put("/api/books/{book_id}")
async def update_book(book_id: int, book: BookPut, request: Request):
    """
    Replace a book completely
    """
    data = read_data()
    book_index = next((i for i, b in enumerate(data['books']) if b['id'] == book_id), None)

    if book_index is None:
        raise HTTPException(status_code=404, detail="Book not found")

    # Keep existing availability status
    available_status = data['books'][book_index]['available']

    updated_book = {
        'id': book_id,
        'title': book.title,
        'available': available_status,
    }
    if book.author is not None:
        updated_book['author'] = book.author
    if book.year is not None:
        updated_book['year'] = book.year

    data['books'][book_index] = updated_book
    write_data(data)
    update_progress(request, 'PUT')
    return updated_book

@app.patch("/api/books/{book_id}")
async def patch_book(book_id: int, book: BookUpdate, request: Request):
    """
    Update book fields partially
    """
    data = read_data()
    book_index = next((i for i, b in enumerate(data['books']) if b['id'] == book_id), None)

    if book_index is None:
        raise HTTPException(status_code=404, detail="Book not found")

    current_book = data['books'][book_index]

    if book.title is not None:
        current_book['title'] = book.title
    if book.author is not None:
        current_book['author'] = book.author
    if book.year is not None:
        current_book['year'] = book.year

    write_data(data)
    update_progress(request, 'PATCH')
    return current_book

@app.delete("/api/books/{book_id}", status_code=204)
async def delete_book(book_id: int, request: Request):
    """
    Remove a book
    """
    data = read_data()
    book_index = next((i for i, b in enumerate(data['books']) if b['id'] == book_id), None)

    if book_index is None:
        raise HTTPException(status_code=404, detail="Book not found")

    data['books'].pop(book_index)
    write_data(data)
    update_progress(request, 'DELETE')
    return Response(status_code=204)

if __name__ == "__main__":
    try:
        # Ensure the data directories exist
        os.makedirs('data', exist_ok=True)
        print("Data directory created/exists")

        # Create initial data file if it doesn't exist
        if not os.path.exists(DATA_FILE):
            write_data({'books': []})
            print("Initial data file created")
        if not os.path.exists(PROGRESS_FILE):
            write_progress({})
            print("Initial progress file created")

    import uvicorn
    print("API Documentation available at http://localhost:3001/docs")
    uvicorn.run(app, host="localhost", port=3001)
