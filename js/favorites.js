// ============ إدارة المفضلة (localStorage) ============

const FAVORITES_KEY = 'favoriteMovies';

// جلب مصفوفة المفضلة من التخزين المحلي
function getFavorites() {
    try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (err) {
        console.error('خطأ في قراءة المفضلة:', err.message);
        return [];
    }
}

// حفظ مصفوفة المفضلة في التخزين المحلي
function saveFavorites(favorites) {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (err) {
        console.error('خطأ في حفظ المفضلة:', err.message);
    }
}

// التحقق هل الفيلم موجود في المفضلة
function isFavorite(movieId) {
    return getFavorites().includes(String(movieId));
}

// إضافة أو إزالة فيلم من المفضلة
function toggleFavorite(movieId) {
    movieId = String(movieId);
    let favorites = getFavorites();

    if (favorites.includes(movieId)) {
        favorites = favorites.filter(id => id !== movieId);
    } else {
        favorites.push(movieId);
    }

    saveFavorites(favorites);
    return favorites.includes(movieId); // ترجع الحالة الجديدة (true = تمت الإضافة)
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

// مزامنة كل الأيقونات الظاهرة حاليًا مع بيانات المفضلة المخزنة
function syncFavoriteIcons() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        updateHeartIcon(card, isFavorite(card.id));
    });
}

// الاستماع لضغطات أزرار القلب عبر الـ event delegation على section
window.addEventListener('DOMContentLoaded', () => {
    const movieSection = document.querySelector('section');
    if (!movieSection) return;

    movieSection.addEventListener('click', (e) => {
        const heartButton = e.target.closest('button');
        if (!heartButton) return;

        // نتأكد أن الزر هو زر القلب فعلاً (فيه أيقونة heart)
        if (!heartButton.querySelector('.fa-heart')) return;

        const card = heartButton.closest('.card');
        if (!card || !card.id) return;

        e.preventDefault(); // لمنع أي سلوك غير مرغوب لو الزر داخل رابط
        const nowFavorite = toggleFavorite(card.id);
        updateHeartIcon(card, nowFavorite);
    });
});
// ============ عرض المفضلة ============

async function fetchAndRenderFavorites() {
    const favoriteIds = getFavorites(); // مصفوفة IDs كـ strings من localStorage

    const movieSection = document.querySelector('section');
    const CardTemplate = document.querySelector('template');

    if (!movieSection || !CardTemplate) {
        console.error('لم يتم العثور على section أو template في الصفحة');
        return;
    }

    // لو مفيش أي فيلم بالمفضلة
    if (!favoriteIds || favoriteIds.length === 0) {
        movieSection.innerHTML = '<p class="text-yellow-500 p-4 fixed text-center self-center place-self-center">لا توجد أفلام في المفضلة حالياً.</p>';
        document.querySelector('#panigation').classList.add('hidden');
        document.querySelector('#panigation').classList.remove('flex');
        document.querySelector('#searchBack').classList.remove('hidden');
        document.querySelector('#searchBack').classList.add('flex')
        return;
    }

    // إخفاء التنقل (Next/Previous) زي ما بتعمل في البحث
    document.querySelector('#panigation').classList.add('hidden');
    document.querySelector('#panigation').classList.remove('flex');

    try {
        // تحويل الـ IDs لأرقام لأن عمود id غالباً integer في قاعدة البيانات
        const idsAsNumbers = favoriteIds.map(id => Number(id));

        const { data: movies, error } = await _supabase
            .from('movies_info')
            .select('*')
            .in('id', idsAsNumbers)

        if (error) throw error;

        if (movies && movies.length > 0) {
            movieSection.innerHTML = '';
            movies.forEach(movie => {
                const movieCard = CardTemplate.content.cloneNode(true);
                movieCard.querySelector('.card').id = movie.id;
                movieCard.querySelector('#title').innerText = movie.title;
                movieCard.querySelector('a').href = movie.url;
                movieCard.querySelector('.card').style.backgroundImage = `url('https://image.tmdb.org/t/p/w342${movie.poster}')`;
                movieSection.append(movieCard);
            });
            document.querySelector('#searchBack').classList.remove('hidden');
            document.querySelector('#searchBack').classList.add('flex');
            syncFavoriteIcons(); // عشان تظهر كل القلوب "ممتلئة" لأنها كلها مفضلة
        } else {
            movieSection.innerHTML = '<p class="text-yellow-500 p-4 fixed text-center self-center place-self-center">لا توجد أفلام متطابقة في قاعدة البيانات.</p>';
        }

    } catch (err) {
        console.error('فشل جلب المفضلة:', err.message);
        movieSection.innerHTML = `<p class="text-red-500 p-4 fixed text-center self-center place-self-center">خطأ في الاتصال: ${err.message}</p>`;
    }
}