# REST Quest

A gamified API for learning REST concepts.

## Setup

### Prerequisites

- Python 3.7+
- pip

### Installation

1. Clone the repository:

   ```bash
   git clone <repository_url>
   cd LearnREST
   ```

2. Create a virtual environment (recommended):

   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   source venv/bin/activate   # On macOS and Linux
   ```

3. Install the dependencies:

   ```bash
   pip install -r requirements.txt
   ```

### Running the Server

1. Navigate to the project directory:

   ```bash
   cd LearnREST
   ```

2. Run the server:

   ```bash
   python server.py
   ```

   or

   ```bash
   uvicorn server:app --reload --host 0.0.0.0 --port 3001
   ```

3. Access the API documentation at `http://localhost:3001/docs`.

## Project Structure

- `index.html`: Main HTML file for the frontend.
- `requirements.txt`: List of Python dependencies.
- `server.py`: FastAPI server implementation.
- `data/`: Directory containing data files.
  - `data.json`: Data for the API (e.g., books).
  - `progress.json`: User progress data.
- `js/`: Directory containing JavaScript files.
  - `app.js`: Main application logic.
  - `examples.js`: Example code.
  - `game.js`: Game logic.
- `styles/`: Directory containing CSS files.
  - `main.css`: Main stylesheet.

## API Endpoints

- `GET /api/books`: Get all books.
- `GET /api/books/{book_id}`: Get a specific book by ID.
- `POST /api/books`: Create a new book.
- `PUT /api/books/{book_id}`: Update a book completely.
- `PATCH /api/books/{book_id}`: Update book fields partially.
- `DELETE /api/books/{book_id}`: Delete a book.

## Contributing

Feel free to contribute to the project by submitting pull requests.
