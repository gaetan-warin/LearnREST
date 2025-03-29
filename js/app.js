import codeExamples from './examples.js';

const { ref, computed, onMounted, watch } = Vue;

const API_BASE_URL = 'http://localhost:3000/api';

// Create app using Vue.createApp
const app = Vue.createApp({
    setup() {
        // Game state
        const currentLevel = ref(0);
        const selectedMode = ref('');
        const activeTab = ref('python');
        const gameStarted = ref(false);
        const progress = ref({
            mode: 'beginner',
            completed_methods: [],
            current_level: 0
        });

        const books = ref([]);

        // Form state
        const getBookId = ref('');
        const newBook = ref({ title: '', author: '', year: '' });
        const updateBook = ref({ id: '', title: '', author: '', year: '' });
        const patchBook = ref({ id: '', title: '', author: '', year: '' });
        const deleteBookId = ref('');

        // API response state
        const apiResponse = ref(null);
        const methodResponse = ref(null);

        // Code examples state
        const examples = ref(codeExamples);

        // Computed properties
        const progressWidth = computed(() => {
            if (currentLevel.value === 7) return 100; // Documentation level
            const methodCount = progress.value.completed_methods.length;
            const totalMethods = 5; // GET, POST, PUT, PATCH, DELETE
            return (methodCount / totalMethods) * 100;
        });

        const canAdvance = computed(() => {
            if (!gameStarted.value) return false;
            if (currentLevel.value === 6 && progress.value.completed_methods.includes('DELETE')) {
                return true; // Allow advancing to documentation after DELETE
            }
            if (currentLevel.value === 7) return false; // No advancing from documentation
            const currentMethod = getCurrentMethodForLevel(currentLevel.value);
            return progress.value.completed_methods.includes(currentMethod);
        });

        const allMethodsCompleted = computed(() => {
            const requiredMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
            return requiredMethods.every(method =>
                progress.value.completed_methods.includes(method)
            );
        });

        // Helper Methods
        const getCurrentMethodForLevel = (level) => {
            const methods = ['', 'GET', 'GET_ID', 'POST', 'PUT', 'PATCH', 'DELETE'];
            return methods[level] || '';
        };

        // Mode selection
        const selectMode = async (mode) => {
            try {
                const response = await fetch(`${API_BASE_URL}/mode`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ mode })
                });

                if (response.ok) {
                    progress.value = await response.json();
                    selectedMode.value = mode;
                }
            } catch (error) {
                console.error('Failed to set mode:', error);
            }
        };

        // Navigation methods
        const startJourney = () => {
            if (!selectedMode.value) {
                showError('Please select a difficulty mode first');
                return;
            }
            gameStarted.value = true;
            currentLevel.value = 1;
            refreshBooksTable();
        };

        const previousLevel = () => {
            if (currentLevel.value > 1) {
                currentLevel.value--;
                resetResponses();
                refreshBooksTable();
            }
        };

        const nextLevel = () => {
            if (canAdvance.value && currentLevel.value < 7) {
                currentLevel.value++;
                resetResponses();
                if (currentLevel.value < 7) {
                    refreshBooksTable();
                }
            }
        };

        const resetResponses = () => {
            apiResponse.value = null;
            methodResponse.value = null;
        };

        // API Methods
        const handleGetAllBooks = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/books`, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                const data = await response.json();

                apiResponse.value = {
                    success: response.ok,
                    status: `${response.status} ${response.statusText}`,
                    data: JSON.stringify(data, null, 2)
                };

                if (response.ok) {
                    books.value = data;
                    if (selectedMode.value === 'beginner') {
                        progress.value.completed_methods = [...new Set([...progress.value.completed_methods, 'GET'])];
                        showSuccess('GET request successful! You can now proceed to the next level.');
                    }
                    await fetchProgress();
                }
            } catch (error) {
                showError('Failed to fetch books. Make sure the server is running.');
            }
        };

        const handleGetBook = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/books/${getBookId.value}`, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                const data = await response.json();

                apiResponse.value = {
                    success: response.ok,
                    status: `${response.status} ${response.statusText}`,
                    data: JSON.stringify(data, null, 2)
                };

                if (response.ok) {
                    books.value = data;
                    await fetchProgress();
                    if (selectedMode.value === 'beginner') {
                        progress.value.completed_methods = [...new Set([...progress.value.completed_methods, 'GET_ID'])];
                        showSuccess('GET ID request successful! You can now proceed to the next level.');
                    }
                }
            } catch (error) {
                showError('Failed to fetch books. Make sure the server is running.');
            }
        };

        const handleCreateBook = async () => {
            if (!newBook.value.title || !newBook.value.author || !newBook.value.year) {
                showError('Please fill in all fields');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/books`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({
                        title: newBook.value.title,
                        author: newBook.value.author,
                        year: parseInt(newBook.value.year)
                    })
                });

                const data = await response.json();

                methodResponse.value = {
                    success: response.ok,
                    status: `${response.status} ${response.statusText}`,
                    data: JSON.stringify(data, null, 2)
                };

                if (response.ok) {
                    refreshBooksTable();
                    newBook.value = { title: '', author: '', year: '' };
                    await fetchProgress();
                    progress.value.completed_methods = [...new Set([...progress.value.completed_methods, 'POST'])];
                    showSuccess('POST request successful! You can now proceed to the next level.');
                }
            } catch (error) {
                showError('Failed to create book. Make sure the server is running.');
            }
        };

        const handleUpdateBook = async () => {
            if (!updateBook.value.id || !updateBook.value.title) {
                showError('Please provide book ID and title (other fields are optional)');
                return;
            }

            try {
                const updateData = {
                    title: updateBook.value.title,
                    author: updateBook.value.author,
                    year: updateBook.value.year ? parseInt(updateBook.value.year) : null
                };

                const response = await fetch(`${API_BASE_URL}/books/${updateBook.value.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(updateData)
                });

                const data = await response.json();

                methodResponse.value = {
                    success: response.ok,
                    status: `${response.status} ${response.statusText}`,
                    data: JSON.stringify(data, null, 2)
                };

                if (response.ok) {
                    refreshBooksTable();
                    updateBook.value = { id: '', title: '', author: '', year: '' };
                    await fetchProgress();
                    progress.value.completed_methods = [...new Set([...progress.value.completed_methods, 'PUT'])];
                    showSuccess('PUT request successful! You can now proceed to the next level.');
                }
            } catch (error) {
                showError('Failed to update book. Make sure the server is running.');
            }
        };

        const handlePatchBook = async () => {
            if (!patchBook.value.id) {
                showError('Please provide a book ID');
                return;
            }

            const patchData = {};
            if (patchBook.value.title) patchData.title = patchBook.value.title;
            if (patchBook.value.author) patchData.author = patchBook.value.author;
            if (patchBook.value.year) patchData.year = parseInt(patchBook.value.year);

            if (Object.keys(patchData).length === 0) {
                showError('Please provide at least one field to update');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/books/${patchBook.value.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(patchData)
                });

                const data = await response.json();

                methodResponse.value = {
                    success: response.ok,
                    status: `${response.status} ${response.statusText}`,
                    data: JSON.stringify(data, null, 2)
                };

                if (response.ok) {
                    refreshBooksTable();
                    patchBook.value = { id: '', title: '', author: '', year: '' };
                    await fetchProgress();
                    progress.value.completed_methods = [...new Set([...progress.value.completed_methods, 'PATCH'])];
                    showSuccess('PATCH request successful! You can now proceed to the next level.');
                }
            } catch (error) {
                showError('Failed to patch book. Make sure the server is running.');
            }
        };

        const handleDeleteBook = async () => {
            if (!deleteBookId.value) {
                showError('Please enter a book ID');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/books/${deleteBookId.value}`, {
                    method: 'DELETE',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                methodResponse.value = {
                    success: response.ok,
                    status: `${response.status} ${response.statusText}`,
                    data: response.ok ? 'Book successfully deleted' : 'Failed to delete book'
                };

                if (response.ok) {
                    refreshBooksTable();
                    deleteBookId.value = '';
                    await fetchProgress();
                    progress.value.completed_methods = [...new Set([...progress.value.completed_methods, 'DELETE'])];
                    showSuccess('DELETE request successful! You can now proceed to the documentation.');
                }
            } catch (error) {
                showError('Failed to delete book. Make sure the server is running.');
            }
        };

        // Helper Methods
        const fetchProgress = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/progress`);
                if (response.ok) {
                    const data = await response.json();
                    progress.value = data;
                    if (data.mode) {
                        selectedMode.value = data.mode;
                    }
                }
            } catch (error) {
                console.error('Failed to fetch progress:', error);
            }
        };

        const refreshBooksTable = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/books`);
                const data = await response.json();
                if (response.ok) {
                    books.value = data;
                }
            } catch (error) {
                console.error('Failed to refresh books table:', error);
            }
        };

        const showError = (message) => {
            methodResponse.value = {
                success: false,
                status: '400 Bad Request',
                data: JSON.stringify({ error: message })
            };
        };

        const showSuccess = (message) => {
            methodResponse.value = {
                success: true,
                status: '200 OK',
                data: JSON.stringify({ message })
            };
        };

        // Initialize
        onMounted(async () => {
            await fetchProgress();
            refreshBooksTable();
        });

        return {
            // State
            currentLevel,
            selectedMode,
            activeTab,
            gameStarted,
            progress,
            books,
            apiResponse,
            methodResponse,
            getBookId,
            newBook,
            updateBook,
            patchBook,
            deleteBookId,
            examples,

            // Computed
            progressWidth,
            canAdvance,
            allMethodsCompleted,

            // Methods
            selectMode,
            startJourney,
            previousLevel,
            nextLevel,
            handleGetAllBooks,
            handleGetBook,
            handleCreateBook,
            handleUpdateBook,
            handlePatchBook,
            handleDeleteBook
        };
    }
});

app.mount('#app');