const { createApp, ref, computed, onMounted } = Vue;

const API_BASE_URL = 'http://localhost:3000/api';

const app = createApp({
    setup() {
        // Game state
        const currentLevel = ref(0);
        const levelsCompleted = ref([false, false, false]);
        const showBooksTable = ref(false);
        const books = ref([]);

        // Form state
        const getBookId = ref('');
        const newBook = ref({ title: '', author: '', year: '' });
        const updateBook = ref({ id: '', title: '' });
        const deleteBookId = ref('');

        // API response state
        const apiResponse = ref(null);
        const methodResponse = ref(null);

        // Computed properties
        const progressWidth = computed(() => {
            return (currentLevel.value / (levelsCompleted.value.length - 1)) * 100;
        });

        const canAdvance = computed(() => {
            return levelsCompleted.value[currentLevel.value] &&
                currentLevel.value < levelsCompleted.value.length - 1;
        });

        // Methods
        const startJourney = () => {
            levelsCompleted.value[0] = true;
            currentLevel.value = 1;
        };

        const previousLevel = () => {
            if (currentLevel.value > 0) {
                currentLevel.value--;
                resetResponses();
            }
        };

        const nextLevel = () => {
            if (canAdvance.value) {
                currentLevel.value++;
                resetResponses();
            }
        };

        const resetResponses = () => {
            apiResponse.value = null;
            methodResponse.value = null;
        };

        // API Methods
        const handleGetAllBooks = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/books`);
                const data = await response.json();

                apiResponse.value = {
                    success: response.ok,
                    status: `${response.status} ${response.statusText}`,
                    data: JSON.stringify(data, null, 2)
                };

                if (response.ok) {
                    books.value = data;
                    showBooksTable.value = true;
                    levelsCompleted.value[1] = true;
                }
            } catch (error) {
                apiResponse.value = {
                    success: false,
                    status: '400 Bad Request',
                    data: JSON.stringify({ error: 'Failed to fetch books. Make sure the server is running.' })
                };
            }
        };

        const handleGetBook = async () => {
            if (!getBookId.value) {
                showError('Please enter a book ID');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/books/${getBookId.value}`);
                const data = await response.json();

                methodResponse.value = {
                    success: response.ok,
                    status: `${response.status} ${response.statusText}`,
                    data: JSON.stringify(data, null, 2)
                };

                if (response.ok) {
                    refreshBooksTable();
                }
            } catch (error) {
                showError('Failed to fetch book. Make sure the server is running.');
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
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newBook.value)
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
                }
            } catch (error) {
                showError('Failed to create book. Make sure the server is running.');
            }
        };

        const handleUpdateBook = async () => {
            if (!updateBook.value.id || !updateBook.value.title) {
                showError('Please fill in all fields');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/books/${updateBook.value.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title: updateBook.value.title })
                });

                const data = await response.json();

                methodResponse.value = {
                    success: response.ok,
                    status: `${response.status} ${response.statusText}`,
                    data: JSON.stringify(data, null, 2)
                };

                if (response.ok) {
                    refreshBooksTable();
                    updateBook.value = { id: '', title: '' };
                }
            } catch (error) {
                showError('Failed to update book. Make sure the server is running.');
            }
        };

        const handleDeleteBook = async () => {
            if (!deleteBookId.value) {
                showError('Please enter a book ID');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/books/${deleteBookId.value}`, {
                    method: 'DELETE'
                });

                methodResponse.value = {
                    success: response.ok,
                    status: `${response.status} ${response.statusText}`,
                    data: response.ok ? 'Book successfully deleted' : 'Failed to delete book'
                };

                if (response.ok) {
                    refreshBooksTable();
                    deleteBookId.value = '';
                }
            } catch (error) {
                showError('Failed to delete book. Make sure the server is running.');
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

        // Initialize
        onMounted(() => {
            refreshBooksTable();
        });

        return {
            // State
            currentLevel,
            books,
            showBooksTable,
            apiResponse,
            methodResponse,
            getBookId,
            newBook,
            updateBook,
            deleteBookId,

            // Computed
            progressWidth,
            canAdvance,

            // Methods
            startJourney,
            previousLevel,
            nextLevel,
            handleGetAllBooks,
            handleGetBook,
            handleCreateBook,
            handleUpdateBook,
            handleDeleteBook
        };
    }
});

app.mount('#app');