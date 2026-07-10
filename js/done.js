// fav add

const DONES_KEY = 'doneMovies';

function getdones() {
    try {
        const stored = localStorage.getItem(DONES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (err) {
        console.error('خطأ في قراءة المفضلة:', err.message);
        return [];
    }
}

function savedones(dones) {
    try {
        localStorage.setItem(DONES_KEY, JSON.stringify(dones));
    } catch (err) {
        console.error('خطأ في حفظ المفضلة:', err.message);
    }
}

function isdone(movieId) {
    return getdones().includes(String(movieId));
}

function toggledone(movieId) {
    movieId = String(movieId);
    let dones = getdones();

    if (dones.includes(movieId)) {
        dones = dones.filter(id => id !== movieId);
    } else {
        dones.push(movieId);
    }

    savedones(dones);
    return dones.includes(movieId);
}

function updatedoneIcon(cardElement, isDone) {
    const outlineSpan = cardElement.querySelector('.done-outline');
    const solidSpan = cardElement.querySelector('.done-solid');

    if (!outlineSpan || !solidSpan) return;

    if (isDone) {
        solidSpan.classList.remove('hidden');
        outlineSpan.classList.add('hidden');
    } else {
        solidSpan.classList.add('hidden');
        outlineSpan.classList.remove('hidden');
    }
}

function syncdoneIcons() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        updatedoneIcon(card, isdone(card.id));
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const movieSection = document.querySelector('section');
    if (!movieSection) return;

    movieSection.addEventListener('click', (e) => {
        const doneButton = e.target.closest('button');
        if (!doneButton) return;

        if (!doneButton.querySelector('.fa-done')) return;

        const card = doneButton.closest('.card');
        if (!card || !card.id) return;

        e.preventDefault();
        const nowdone = toggledone(card.id);
        updatedoneIcon(card, nowdone);
    });
});

// fav fetch

async function fetchAndRenderdones() {
    setSectionParam('watched');
    const doneIds = getdones();

    const movieSection = document.querySelector('section');
    const CardTemplate = document.querySelector('template');

    if (!movieSection || !CardTemplate) {
        console.error('لم يتم العثور على section أو template في الصفحة');
        return;
    }

    if (!doneIds || doneIds.length === 0) {
        movieSection.innerHTML = '<p class="text-yellow-500 p-4 fixed text-center self-center place-self-center">لا توجد افلام تمت مشاهدتها.</p>';
        document.querySelector('#pagination').classList.add('hidden');
        document.querySelector('#pagination').classList.remove('flex');
        document.querySelector('#searchBack').classList.remove('hidden');
        document.querySelector('#searchBack').classList.add('flex')
        return;
    }
    document.querySelector('#pagination').classList.add('hidden');
    document.querySelector('#pagination').classList.remove('flex');

    try {
        const idsAsNumbers = doneIds.map(id => Number(id));

        const { data: movies, error } = await _supabase
            .from('movies_info')
            .select('*')
            .in('id', idsAsNumbers);

        if (error) throw error;

        if (movies && movies.length > 0) {
            const moviesMap = new Map(movies.map(m => [String(m.id), m]));

            const orderedMovies = doneIds
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
            syncdoneIcons();
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