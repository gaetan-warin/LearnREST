// Code examples for different tools/languages
const codeExamples = {
  python: {
    get: `import requests

# Get all books
response = requests.get('http://localhost:3001/api/books')
books = response.json()
print(books)

# Get single book
book_id = 1
response = requests.get(f'http://localhost:3001/api/books/{book_id}')
book = response.json()
print(book)`,

    post: `import requests

new_book = {
    "title": "Learning REST APIs",
    "author": "John Developer",
    "year": 2024
}

response = requests.post(
    'http://localhost:3001/api/books',
    json=new_book
)
created_book = response.json()
print(created_book)`,

    put: `import requests

book_id = 1
updated_book = {
    "title": "Updated Book Title",
    "author": "Jane Developer",
    "year": 2025
}

response = requests.put(
    f'http://localhost:3001/api/books/{book_id}',
    json=updated_book
)
result = response.json()
print(result)`,

    patch: `import requests

book_id = 1
patch_data = {
    "title": "New Title"
}

response = requests.patch(
    f'http://localhost:3001/api/books/{book_id}',
    json=patch_data
)
result = response.json()
print(result)`,

    delete: `import requests

book_id = 1
response = requests.delete(f'http://localhost:3001/api/books/{book_id}')
print(f"Status code: {response.status_code}")`,
  },

  javascript: {
    get: `// Get all books
fetch('http://localhost:3001/api/books')
  .then(response => response.json())
  .then(books => console.log(books));

// Get single book
const bookId = 1;
fetch(\`http://localhost:3001/api/books/\${bookId}\`)
  .then(response => response.json())
  .then(book => console.log(book));`,

    post: `const newBook = {
  title: "Learning REST APIs",
  author: "John Developer",
  year: 2024
};

fetch('http://localhost:3001/api/books', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newBook)
})
  .then(response => response.json())
  .then(createdBook => console.log(createdBook));`,

    put: `const bookId = 1;
const updatedBook = {
  title: "Updated Book Title",
  author: "Jane Developer",
  year: 2025
};

fetch(\`http://localhost:3001/api/books/\${bookId}\`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updatedBook)
})
  .then(response => response.json())
  .then(result => console.log(result));`,

    patch: `const bookId = 1;
const patchData = {
  title: "New Title"
};

fetch(\`http://localhost:3001/api/books/\${bookId}\`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(patchData)
})
  .then(response => response.json())
  .then(result => console.log(result));`,

    delete: `const bookId = 1;
fetch(\`http://localhost:3001/api/books/\${bookId}\`, {
  method: 'DELETE'
})
  .then(response => console.log(\`Status code: \${response.status}\`));`,
  },

  postman: {
    get: `GET http://localhost:3001/api/books

# Get single book
GET http://localhost:3001/api/books/1`,

    post: `POST http://localhost:3001/api/books
Content-Type: application/json

{
    "title": "Learning REST APIs",
    "author": "John Developer",
    "year": 2024
}`,

    put: `PUT http://localhost:3001/api/books/1
Content-Type: application/json

{
    "title": "Updated Book Title",
    "author": "Jane Developer",
    "year": 2025
}`,

    patch: `PATCH http://localhost:3001/api/books/1
Content-Type: application/json

{
    "title": "New Title"
}`,

    delete: `DELETE http://localhost:3001/api/books/1`,
  }
};

export default codeExamples;