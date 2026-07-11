// fav add

const LATER_KEY = 'laterMovies';

function getLaters() {
    try {
        const stored = localStorage.getItem(LATER_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (err) {
        console.error('خطأ في قراءة المفضلة:', err.message);
        return [];
    }
}

function saveLaters(laters) {
    try {
        localStorage.setItem(LATER_KEY, JSON.stringify(laters));
    } catch (err) {
        console.error('خطأ في حفظ المفضلة:', err.message);
    }
}

function isLater(movieId) {
    return getLaters().includes(String(movieId));
}

function toggleLater(movieId) {
    movieId = String(movieId);
    let laters = getLaters();

    if (laters.includes(movieId)) {
        laters = laters.filter(id => id !== movieId);
    } else {
        laters.push(movieId);
    }

    saveLaters(laters);
    return laters.includes(movieId);
}

function updateLaterIcon(cardElement, isLaterFlag) {
    const outlineSpan = cardElement.querySelector('.later-outline');
    const solidSpan = cardElement.querySelector('.later-solid');

    if (!outlineSpan || !solidSpan) return;

    if (isLaterFlag) {
        solidSpan.classList.remove('hidden');
        outlineSpan.classList.add('hidden');
    } else {
        solidSpan.classList.add('hidden');
        outlineSpan.classList.remove('hidden');
    }
}

function syncLaterIcons() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        updateLaterIcon(card, isLater(card.id));
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const movieSection = document.querySelector('section');
    if (!movieSection) return;

    movieSection.addEventListener('click', (e) => {
        const laterButton = e.target.closest('button');
        if (!laterButton) return;

        if (!laterButton.querySelector('.fa-later')) return;

        const card = laterButton.closest('.card');
        if (!card || !card.id) return;

        e.preventDefault();
        const nowLater = toggleLater(card.id);
        updateLaterIcon(card, nowLater);
    });
});

// fav fetch

async function fetchAndRenderlaters() {
    setSectionParam('later');
    const laterIds = getLaters();

    const movieSection = document.querySelector('section');
    const CardTemplate = document.querySelector('template');

    if (!movieSection || !CardTemplate) {
        console.error('لم يتم العثور على section أو template في الصفحة');
        return;
    }

    if (!laterIds || laterIds.length === 0) {
        movieSection.innerHTML = '<p class="text-yellow-500 p-4 fixed text-center self-center place-self-center">لا توجد أفلام للمشاهدة لاحقا.</p>';
        document.querySelector('#pagination').classList.add('hidden');
        document.querySelector('#pagination').classList.remove('flex');
        document.querySelector('#searchBack').classList.remove('hidden');
        document.querySelector('#searchBack').classList.add('flex')
        return;
    }
    document.querySelector('#pagination').classList.add('hidden');
    document.querySelector('#pagination').classList.remove('flex');

    try {
        const idsAsNumbers = laterIds.map(id => Number(id));

        const { data: movies, error } = await _supabase
            .from('movies_info')
            .select('*')
            .in('id', idsAsNumbers);

        if (error) throw error;

        if (movies && movies.length > 0) {
            const moviesMap = new Map(movies.map(m => [String(m.id), m]));

            const orderedMovies = laterIds
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
            syncLaterIcons();
            syncFavoriteIcons();
        } else {
            movieSection.innerHTML = '<p class="text-yellow-500 p-4 fixed text-center self-center place-self-center">لا توجد أفلام متطابقة في قاعدة البيانات.</p>';
        }

    } catch (err) {
        console.error('فشل جلب المفضلة:', err.message);
        movieSection.innerHTML = `<p class="text-red-500 p-4 fixed text-center self-center place-self-center">خطأ في الاتصال: ${err.message}</p>`;
    }
}