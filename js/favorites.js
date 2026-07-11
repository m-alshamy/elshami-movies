// fav add

const FAVORITES_KEY = 'favoriteMovies';

function getFavorites() {
    try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (err) {
        console.error('خطأ في قراءة المفضلة:', err.message);
        return [];
    }
}

function saveFavorites(favorites) {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (err) {
        console.error('خطأ في حفظ المفضلة:', err.message);
    }
}

function isFavorite(movieId) {
    return getFavorites().includes(String(movieId));
}

function toggleFavorite(movieId) {
    movieId = String(movieId);
    let favorites = getFavorites();

    if (favorites.includes(movieId)) {
        favorites = favorites.filter(id => id !== movieId);
    } else {
        favorites.push(movieId);
    }

    saveFavorites(favorites);
    return favorites.includes(movieId);
}

function updateHeartIcon(cardElement, isFav) {
    const outlineSpan = cardElement.querySelector('.heart-outline');
    const solidSpan = cardElement.querySelector('.heart-solid');

    if (!outlineSpan || !solidSpan) return;

    if (isFav) {
        solidSpan.classList.remove('hidden');
        outlineSpan.classList.add('hidden');
    } else {
        solidSpan.classList.add('hidden');
        outlineSpan.classList.remove('hidden');
    }
}

function syncFavoriteIcons() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        updateHeartIcon(card, isFavorite(card.id));
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const movieSection = document.querySelector('section');
    if (!movieSection) return;

    movieSection.addEventListener('click', (e) => {
        const heartButton = e.target.closest('button');
        if (!heartButton) return;

        if (!heartButton.querySelector('.fa-heart')) return;

        const card = heartButton.closest('.card');
        if (!card || !card.id) return;

        e.preventDefault();
        const nowFavorite = toggleFavorite(card.id);
        updateHeartIcon(card, nowFavorite);
    });
});

// fav fetch

async function fetchAndRenderFavorites() {
    setSectionParam('favourite');
    const favoriteIds = getFavorites();
    const movieSection = document.querySelector('section');
    const CardTemplate = document.querySelector('template');
    if (!movieSection || !CardTemplate) {
        console.error('لم يتم العثور على section أو template في الصفحة');
        return;
    }

    if (!favoriteIds || favoriteIds.length === 0) {
        movieSection.innerHTML = '<p class="text-yellow-500 p-4 fixed text-center self-center place-self-center">لا توجد أفلام في المفضلة حالياً.</p>';
        document.querySelector('#pagination').classList.add('hidden');
        document.querySelector('#pagination').classList.remove('flex');
        document.querySelector('#searchBack').classList.remove('hidden');
        document.querySelector('#searchBack').classList.add('flex')
        return;
    }
    document.querySelector('#pagination').classList.add('hidden');
    document.querySelector('#pagination').classList.remove('flex');

    try {
        const idsAsNumbers = favoriteIds.map(id => Number(id));

        const { data: movies, error } = await _supabase
            .from('movies_info')
            .select('*')
            .in('id', idsAsNumbers);

        if (error) throw error;

        if (movies && movies.length > 0) {
            const moviesMap = new Map(movies.map(m => [String(m.id), m]));

            const orderedMovies = favoriteIds
                .map(id => moviesMap.get(String(id)))
                .filter(Boolean);

            movieSection.innerHTML = '';
            orderedMovies.forEach(movie => {
                const movieCard = CardTemplate.content.cloneNode(true);
                movieCard.querySelector('.card').id = movie.id;
                movieCard.querySelector('#title').innerText = movie.title;
                movieCard.querySelector('a').href = movie.url;
                const posterWidth = window.innerWidth < 640 ? 'w185' : 'w342';
                const MovieImg = movieCard.querySelector('.card').querySelector('img');
                MovieImg.src = `https://image.tmdb.org/t/p/${posterWidth}${movie.poster}`;
                MovieImg.alt = movie.title;
                movieSection.prepend(movieCard);
            });
            document.querySelector('#searchBack').classList.remove('hidden');
            document.querySelector('#searchBack').classList.add('flex');
            syncFavoriteIcons();
            syncLaterIcons();
        } else {
            movieSection.innerHTML = '<p class="text-yellow-500 p-4 fixed text-center self-center place-self-center">لا توجد أفلام متطابقة في قاعدة البيانات.</p>';
        }

    } catch (err) {
        console.error('فشل جلب المفضلة:', err.message);
        movieSection.innerHTML = `<p class="text-red-500 p-4 fixed text-center self-center place-self-center">خطأ في الاتصال: ${err.message}</p>`;
    }
}