const { createApp, ref, computed, onMounted } = Vue;

const API_BASE_URL = 'http://localhost:3000/api';

const app = createApp({
    setup() {
        // Game state
        const currentLevel = ref(0);
        const levelsCompleted = ref([false, false, false, false, false, false]);
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
            refreshBooksTable();
        };

        const previousLevel = () => {
            if (currentLevel.value > 0) {
                currentLevel.value--;
                resetResponses();
                refreshBooksTable();
            }
        };

        const nextLevel = () => {
            if (canAdvance.value) {
                currentLevel.value++;
                resetResponses();
                refreshBooksTable();
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
                    levelsCompleted.value[2] = true;
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
                const updateData = { title: updateBook.value.title };
                if (updateBook.value.author !== '') {
                    updateData.author = updateBook.value.author;
                }
                if (updateBook.value.year !== '') {
                    updateData.year = parseInt(updateBook.value.year) || null;
                }

                const response = await fetch(`${API_BASE_URL}/books/${updateBook.value.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
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
                    levelsCompleted.value[3] = true;
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

            // Build patch data only from filled fields
            const patchData = {};
            if (patchBook.value.title !== '') patchData.title = patchBook.value.title;
            if (patchBook.value.author !== '') patchData.author = patchBook.value.author;
            if (patchBook.value.year !== '') patchData.year = parseInt(patchBook.value.year);

            if (Object.keys(patchData).length === 0) {
                showError('Please provide at least one field to update');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/books/${patchBook.value.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
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
                    levelsCompleted.value[4] = true;
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
                    levelsCompleted.value[5] = true;
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
            apiResponse,
            methodResponse,
            getBookId,
            newBook,
            updateBook,
            patchBook,
            deleteBookId,

            // Computed
            progressWidth,
            canAdvance,

            // Methods
            startJourney,
            previousLevel,
            nextLevel,
            handleGetAllBooks,
            handleCreateBook,
            handleUpdateBook,
            handlePatchBook,
            handleDeleteBook
        };
    }
});

app.mount('#app');