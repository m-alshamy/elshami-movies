//<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const supabaseUrl = 'https://bxfoypjnjjhaypqyizrz.supabase.co';

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Zm95cGpuampoYXlwcXlpenJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDg0NTAsImV4cCI6MjA5MjI4NDQ1MH0.4xGxtDta8MV9hsFTCB-ZhCLN_LidAhLlZGPoKKa70HM';

const _supabase = supabase.createClient(supabaseUrl, supabaseKey);
const itemsPerPage = 12;

async function fetchAndRenderMovies() {

        // إظهار التنقل وإخفاء زر الرجوع عند التحميل العادي
    document.querySelector('#panigation').classList.remove('hidden');
    document.querySelector('#searchBack').classList.add('hidden');
    document.querySelector('#panigation').classList.add('flex');
    document.querySelector('#searchBack').classList.remove('flex');
    
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page')) || 1;

    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const movieSection = document.querySelector('section');
    const CardTemplate = document.querySelector('template');

    try {
        const MoviesSec = document.querySelector('section');
        const childrenCount = MoviesSec.children.length;
        const { data: movies, error } = await _supabase
            .from('movies_info')
            .select('*', { count: 'exact' })
            .order('id', { ascending: false })
            .range(from, to);


        if (error) throw error;
        
        if (movies && movies.length > 0) {
            movieSection.innerHTML = '';
            movies.forEach(movie => {
                const movieCard = CardTemplate.content.cloneNode(true);
                movieCard.querySelector('a').querySelector('div').querySelector('h4').innerText = movie.title;
                movieCard.querySelector('a').href = movie.url;
                movieCard.querySelector('a').querySelector('div').style.backgroundImage = `url('https://image.tmdb.org/t/p/w342${movie.poster}')`;
                movieSection.append(movieCard);
            });
        } else {
            movieSection.innerHTML = '<p class="text-yellow-500 p-4 fixed text-center self-center place-self-center">لا توجد أفلام متوفرة حالياً في قاعدة البيانات.</p>';
        }

    } catch (err) {
        console.error('فشل جلب البيانات:', err.message);
        movieSection.innerHTML = `<p class="text-red-500 p-4 fixed text-center self-center place-self-center">خطأ في الاتصال: ${err.message}</p>`;
    }
};
window.addEventListener('load', fetchAndRenderMovies);
