// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Game state
const gameState = {
    currentLevel: 0,
    levels: [
        {
            id: 'welcome',
            title: 'Welcome',
            completed: false
        },
        {
            id: 'rest-basics',
            title: 'REST Fundamentals',
            completed: false,
            content: `
                <h2>Understanding REST</h2>
                <p>REST (Representational State Transfer) is an architectural style for designing networked applications. Think of it as a set of rules for how computers should talk to each other over the internet.</p>
                <div class="character-dialog">
                    <div class="character">
                        <div class="character-avatar">🧙‍♂️</div>
                    </div>
                    <div class="dialog-box">
                        <p>Let's start with a simple analogy: Imagine a library. In REST:</p>
                        <ul>
                            <li>Books are like <strong>resources</strong></li>
                            <li>The library catalog is like an <strong>API</strong></li>
                            <li>Library cards are like <strong>authentication</strong></li>
                        </ul>
                    </div>
                </div>
                <div class="interactive-demo">
                    <h3>Try It Out!</h3>
                    <p>Let's make our first GET request to see all books:</p>
                    <button class="action-button" onclick="handleGetAllBooks()">GET /api/books</button>
                    <div class="response-box" id="get-all-response"></div>
                </div>
                <div id="books-table-container" style="display: none;">
                    <h3>Current Library State</h3>
                    <div class="books-table"></div>
                </div>
            `
        },
        {
            id: 'http-methods',
            title: 'HTTP Methods',
            completed: false,
            content: `
                <h2>HTTP Methods - The CRUD Operations</h2>
                <p>REST APIs use HTTP methods to perform different actions on resources. Let's try them all!</p>
                <div class="method-cards">
                    <div class="method-card get">
                        <h3>GET</h3>
                        <p>Retrieves information</p>
                        <input type="number" id="get-book-id" placeholder="Enter book ID">
                        <button onclick="handleGetBook()">GET /api/books/{id}</button>
                    </div>
                    <div class="method-card post">
                        <h3>POST</h3>
                        <p>Creates new resources</p>
                        <input type="text" id="new-book-title" placeholder="Book title">
                        <input type="text" id="new-book-author" placeholder="Author">
                        <input type="number" id="new-book-year" placeholder="Year">
                        <button onclick="handleCreateBook()">POST /api/books</button>
                    </div>
                    <div class="method-card put">
                        <h3>PUT</h3>
                        <p>Updates resources</p>
                        <input type="number" id="update-book-id" placeholder="Book ID">
                        <input type="text" id="update-book-title" placeholder="New title">
                        <button onclick="handleUpdateBook()">PUT /api/books/{id}</button>
                    </div>
                    <div class="method-card delete">
                        <h3>DELETE</h3>
                        <p>Removes resources</p>
                        <input type="number" id="delete-book-id" placeholder="Book ID">
                        <button onclick="handleDeleteBook()">DELETE /api/books/{id}</button>
                    </div>
                </div>
                <div class="response-box" id="method-response"></div>
            `
        }
    ]
};

// API Interaction Functions
async function handleGetAllBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/books`);
        const books = await response.json();

        const responseBox = document.getElementById('get-all-response');
        if (!responseBox) {
            console.error('Response box element not found');
            return;
        }

        responseBox.innerHTML = `
            <div class="api-response success">
                <p class="status">Status: ${response.status} ${response.statusText}</p>
                <pre>${JSON.stringify(books, null, 2)}</pre>
            </div>
        `;

        updateBooksTable(books);
        const tableContainer = document.getElementById('books-table-container');
        if (tableContainer) {
            tableContainer.style.display = 'block';
        }
        gameState.levels[1].completed = true;
        updateNavButtons();
    } catch (error) {
        showError('Failed to fetch books. Make sure the server is running.');
    }
}

async function handleGetBook() {
    const bookId = document.getElementById('get-book-id')?.value;
    if (!bookId) {
        showError('Please enter a book ID');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`);
        const data = await response.json();

        const responseBox = document.getElementById('method-response');
        if (!responseBox) return;

        if (response.ok) {
            responseBox.innerHTML = `
                <div class="api-response success">
                    <p class="status">Status: ${response.status} ${response.statusText}</p>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
            `;
        } else {
            showError(data.error || 'Failed to fetch book');
        }
    } catch (error) {
        showError('Failed to fetch book. Make sure the server is running.');
    }
}

async function handleCreateBook() {
    const title = document.getElementById('new-book-title')?.value;
    const author = document.getElementById('new-book-author')?.value;
    const year = document.getElementById('new-book-year')?.value;

    if (!title || !author || !year) {
        showError('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, author, year: parseInt(year) })
        });

        const data = await response.json();
        const responseBox = document.getElementById('method-response');
        if (!responseBox) return;

        if (response.ok) {
            responseBox.innerHTML = `
                <div class="api-response success">
                    <p class="status">Status: ${response.status} ${response.statusText}</p>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
            `;
            refreshBooksTable();
            clearInputs();
        } else {
            showError(data.error || 'Failed to create book');
        }
    } catch (error) {
        showError('Failed to create book. Make sure the server is running.');
    }
}

async function handleUpdateBook() {
    const bookId = document.getElementById('update-book-id')?.value;
    const newTitle = document.getElementById('update-book-title')?.value;

    if (!bookId || !newTitle) {
        showError('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: newTitle })
        });

        const data = await response.json();
        const responseBox = document.getElementById('method-response');
        if (!responseBox) return;

        if (response.ok) {
            responseBox.innerHTML = `
                <div class="api-response success">
                    <p class="status">Status: ${response.status} ${response.statusText}</p>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
            `;
            refreshBooksTable();
            clearInputs();
        } else {
            showError(data.error || 'Failed to update book');
        }
    } catch (error) {
        showError('Failed to update book. Make sure the server is running.');
    }
}

async function handleDeleteBook() {
    const bookId = document.getElementById('delete-book-id')?.value;

    if (!bookId) {
        showError('Please enter a book ID');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'DELETE'
        });

        const responseBox = document.getElementById('method-response');
        if (!responseBox) return;

        if (response.ok) {
            responseBox.innerHTML = `
                <div class="api-response success">
                    <p class="status">Status: ${response.status} ${response.statusText}</p>
                    <pre>Book successfully deleted</pre>
                </div>
            `;
            refreshBooksTable();
            clearInputs();
        } else {
            const data = await response.json();
            showError(data.error || 'Failed to delete book');
        }
    } catch (error) {
        showError('Failed to delete book. Make sure the server is running.');
    }
}

async function refreshBooksTable() {
    try {
        const response = await fetch(`${API_BASE_URL}/books`);
        const books = await response.json();
        updateBooksTable(books);
    } catch (error) {
        console.error('Failed to refresh books table:', error);
    }
}

// UI Helpers
function updateBooksTable(books) {
    const container = document.querySelector('.books-table');
    if (!container) return;

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Year</th>
                    <th>Available</th>
                </tr>
            </thead>
            <tbody>
                ${books.map(book => `
                    <tr>
                        <td>${book.id}</td>
                        <td>${book.title}</td>
                        <td>${book.author}</td>
                        <td>${book.year}</td>
                        <td>${book.available ? '✅' : '❌'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showError(message) {
    const responseBox = document.getElementById('method-response');
    if (!responseBox) {
        console.error('Response box element not found');
        return;
    }

    responseBox.innerHTML = `
        <div class="api-response error">
            <p class="status">Status: 400 Bad Request</p>
            <pre>{"error": "${message}"}</pre>
        </div>
    `;
}

function clearInputs() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => input.value = '');
}

// Navigation functions
function updateNavButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (!prevBtn || !nextBtn) return;

    prevBtn.disabled = gameState.currentLevel === 0;
    nextBtn.disabled = gameState.currentLevel === gameState.levels.length - 1 ||
        !gameState.levels[gameState.currentLevel].completed;
}

function updateProgressBar() {
    const progress = document.querySelector('.progress');
    if (!progress) return;

    const progressValue = (gameState.currentLevel / (gameState.levels.length - 1)) * 100;
    progress.style.width = `${progressValue}%`;
}

function showCurrentLevel() {
    const levels = document.querySelectorAll('.level');
    levels.forEach(level => level.classList.remove('active'));

    const currentLevel = gameState.levels[gameState.currentLevel];
    let levelElement = document.getElementById(`${currentLevel.id}-level`);

    if (!levelElement && currentLevel.content) {
        levelElement = createLevelElement(currentLevel);
    }

    if (levelElement) {
        levelElement.classList.add('active');
    }
}

function createLevelElement(level) {
    const container = document.querySelector('.game-content');
    if (!container) return null;

    const div = document.createElement('div');
    div.id = `${level.id}-level`;
    div.className = 'level';
    div.innerHTML = level.content;
    container.appendChild(div);
    return div;
}

// Game progression
function startJourney() {
    gameState.levels[0].completed = true;
    gameState.currentLevel = 1;
    updateNavButtons();
    updateProgressBar();
    showCurrentLevel();
}

// Navigation event listeners
document.addEventListener('DOMContentLoaded', () => {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (gameState.currentLevel > 0) {
                gameState.currentLevel--;
                updateNavButtons();
                updateProgressBar();
                showCurrentLevel();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (gameState.currentLevel < gameState.levels.length - 1 &&
                gameState.levels[gameState.currentLevel].completed) {
                gameState.currentLevel++;
                updateNavButtons();
                updateProgressBar();
                showCurrentLevel();
            }
        });
    }
});

// Initialize the game when the page loads
window.addEventListener('load', initGame);

function initGame() {
    updateNavButtons();
    updateProgressBar();
    showCurrentLevel();
}