//<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const supabaseUrl2 = 'https://bxfoypjnjjhaypqyizrz.supabase.co';

const supabaseKey2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Zm95cGpuampoYXlwcXlpenJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDg0NTAsImV4cCI6MjA5MjI4NDQ1MH0.4xGxtDta8MV9hsFTCB-ZhCLN_LidAhLlZGPoKKa70HM';

const _supabase2 = supabase.createClient(supabaseUrl2, supabaseKey2);

const itemsPerPage2 = 12

function updateActiveNavButton(section) {
    const favBtn = document.querySelector('#favouriteBtn');
    const laterBtn = document.querySelector('#laterBtn');
    const doneBtn = document.querySelector('#doneBtn');

    [favBtn, laterBtn, doneBtn].forEach(btn => btn && btn.classList.remove('bg-gray-200/20'));

    if (section === 'favourite' && favBtn) favBtn.classList.add('bg-gray-200/20');
    else if (section === 'later' && laterBtn) laterBtn.classList.add('bg-gray-200/20');
    else if (section === 'watched' && doneBtn) doneBtn.classList.add('bg-gray-200/20');
}

function setSectionParam(sectionValue) {
    const url = new URL(window.location.href);
    url.searchParams.set('s', sectionValue);
    window.history.pushState({}, '', url);
    updateActiveNavButton(sectionValue);
}

function removeLastUrlParam() {
    const url = new URL(window.location.href);
    const keys = Array.from(url.searchParams.keys());
    if (keys.length > 0) {
        url.searchParams.delete(keys[keys.length - 1]);
        window.history.pushState({}, '', url);
    }
    updateActiveNavButton(null); // يشيل التلوين لما نرجع للوضع الافتراضي
}

function Next() {
    const MoviesSec = document.querySelector('section');
    const childrenCount = MoviesSec.children.length;

    // الحصول على الرابط الحالي والمعلمات
    const currentUrl = new URL(window.location.href);
    const searchParams = new URLSearchParams(currentUrl.search);

    // استخراج رقم الصفحة الحالي أو تعيين 1 كقيمة افتراضية
    let currentPage = parseInt(searchParams.get('page')) || 1;

    if (childrenCount == itemsPerPage2) {
        searchParams.set('page', currentPage + 1);
        window.location.href = `${currentUrl.pathname}?${searchParams.toString()}`;
    }
}
function Previous() {
    // الحصول على الرابط الحالي والمعلمات
    const currentUrl = new URL(window.location.href);
    const searchParams = new URLSearchParams(currentUrl.search);

    // استخراج رقم الصفحة الحالي أو تعيين 1 كقيمة افتراضية
    let currentPage = parseInt(searchParams.get('page')) || 1;

    // التأكد من أن رقم الصفحة أكبر من 1 قبل عملية النقصان
    if (currentPage > 1) {
        searchParams.set('page', currentPage - 1);
        window.location.href = `${currentUrl.pathname}?${searchParams.toString()}`;
    }
}
function SearchBack() {
    removeLastUrlParam();
    window.location.reload();
}


async function searchAndRenderMovies() {
    // ناخد قيمة البحث من الـ input بدل ما تكون ثابتة
    const searchInput = document.querySelector('#searchBar');
    const searchQuery = searchInput ? searchInput.value.trim() : '';

    const movieSection2 = document.querySelector('section');
    const CardTemplate2 = document.querySelector('template');

    if (!movieSection2 || !CardTemplate2) {
        console.error('لم يتم العثور على section أو template في الصفحة');
        return;
    }

    // لو المستخدم مكتبش حاجة، او احرف اقل من 3
    if (!searchQuery || searchQuery.length < 3) {
        return;
    }

    document.querySelector('#pagination').classList.add('hidden');
    document.querySelector('#pagination').classList.remove('flex');
    // console.log('pagination btns hidden');

    try {
        const { data: movies, error } = await _supabase2
            .from('movies_info')
            .select('*', { count: 'exact' })
            .ilike('title', `%${searchQuery}%`)
            .order('id', { ascending: false });

        if (error) throw error;

        if (movies && movies.length > 0) {
            movieSection2.innerHTML = '';
            movies.forEach(movie => {
                const movieCard = CardTemplate2.content.cloneNode(true);
                movieCard.querySelector('.card').id = movie.id;
                movieCard.querySelector('#title').innerText = movie.title;
                movieCard.querySelector('a').href = movie.url;
                const posterWidth = window.innerWidth < 640 ? 'w185' : 'w342';
                const MovieImg = movieCard.querySelector('.card').querySelector('img')
                MovieImg.src = `https://image.tmdb.org/t/p/${posterWidth}${movie.poster}`;
                MovieImg.alt = movie.title;
                movieSection2.append(movieCard);
            });
            setSectionParam('search')
            syncFavoriteIcons();
            syncLaterIcons();
            // console.log('movie loaded')
        } else {
            movieSection2.innerHTML = '<p class="text-yellow-500 p-4 fixed text-center self-center place-self-center">لا توجد أفلام متوفرة حالياً بهذا الاسم.</p>';
        }
        // إخفاء التنقل وإظهار زر الرجوع عند نتائج البحث
        document.querySelector('#searchBack').classList.remove('hidden');
        document.querySelector('#searchBack').classList.add('flex');
        // console.log('search back btn hide');

    } catch (err) {
        console.error('فشل جلب البيانات:', err.message);
        movieSection2.innerHTML = `<p class="text-red-500 p-4 fixed text-center self-center place-self-center">خطأ في الاتصال: ${err.message}</p>`;
    }
}
window.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('#searchBar');
    if (searchInput) {
        searchInput.value = '';

        // تشغيل البحث عند الضغط على Enter
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchAndRenderMovies();
            }
        });
    }
});