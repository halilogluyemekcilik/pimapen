document.addEventListener('DOMContentLoaded', () => {
    const projectsContainer = document.getElementById('projects-container');
    const loadingMessage = document.getElementById('loading-message');
    // Eğer HTML'inizde henüz bir modal yoksa, bu kısımlar hata verecektir.
    // Lütfen modal ile ilgili HTML yapınızı da eklediğinizden emin olun.
    const projectModal = document.getElementById('projectModal');
    const closeModalButton = document.querySelector('.close-button');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalMediaGallery = document.querySelector('.modal-media-gallery');

    // Function to fetch and process project data
    const fetchProjects = async () => {
        try {
            const maxProjectCount = 50;
            const projectChecks = []; // Tüm proje kontrolü promise'larını tutacak dizi

            for (let i = 1; i <= maxProjectCount; i++) {
                // Her bir HEAD isteğini başlat ve promise'ı diziye ekle
                projectChecks.push(
                    fetch(`img/${i}.txt`, { method: 'HEAD' })
                        .then(response => response.ok ? i : null) // Başarılıysa ID'yi, değilse null dön
                        .catch(() => null) // Hata durumunda da null dön
                );
            }

            // Tüm HEAD isteklerinin tamamlanmasını bekle
            const results = await Promise.all(projectChecks);
            const projectIDs = results.filter(id => id !== null); // Başarılı olan ID'leri filtrele

            loadingMessage.style.display = 'none'; // Yükleme mesajını gizle

            if (projectIDs.length === 0) {
                projectsContainer.innerHTML = '<p class="no-projects">Henüz yüklü proje bulunmamaktadır.</p>';
                return;
            }

            // Her bir proje ID'si için detaylı veriyi paralel olarak çek
            const projectDataPromises = projectIDs.map(async (id) => {
                const projectTitle = `Proje ${id}`;
                let description = 'Açıklama bulunamadı.';
                const images = [];
                let video = null;

                // Açıklama, resimler ve video için paralel istekleri başlat
                // Not: Resimler için HEAD isteği kullanırken, video için de HEAD kullanmalıyız.
                // Video yanıtı imageResponses dizisinin sonunda yer alacaktır.
                const [descResponse, ...mediaResponses] = await Promise.all([
                    fetch(`img/${id}.txt`).catch(() => null), // Açıklama dosyası
                    ...Array.from({ length: 10 }, (_, i) => fetch(`img/${id}-${i + 1}.jpg`, { method: 'HEAD' }).catch(() => null)), // 10 adede kadar resim
                    fetch(`img/${id}.mp4`, { method: 'HEAD' }).catch(() => null) // Video dosyası (son eleman)
                ]);

                // Açıklamayı işle
                if (descResponse && descResponse.ok) {
                    description = await descResponse.text();
                }

                // Resimleri işle
                for (let i = 0; i < 10; i++) {
                    if (mediaResponses[i] && mediaResponses[i].ok) {
                        images.push(`img/${id}-${i + 1}.jpg`);
                    }
                }

                // Videoyu işle (mediaResponses dizisinin son elemanı)
                // mediaResponses.length - 1 son elemanı verir, bu da videonun HEAD isteğidir.
                const videoResponse = mediaResponses[mediaResponses.length - 1];
                if (videoResponse && videoResponse.ok) {
                    video = `img/${id}.mp4`;
                }

                return { id, title: projectTitle, description, images, video };
            });

            // Tüm proje verilerinin çekilmesini bekle
            const allProjectData = await Promise.all(projectDataPromises);

            // Şimdi elimizde tüm projelerin verileri var, bunları HTML'e ekleyebiliriz
            allProjectData.forEach(project => {
                const projectCard = document.createElement('div');
                projectCard.classList.add('project-card');
                projectCard.setAttribute('data-project-id', project.id);

                // İlk resmi veya placeholder'ı thumbnail olarak kullan
                const thumbnailSrc = project.images.length > 0 ? project.images[0] : 'img/placeholder.jpg';

                projectCard.innerHTML = `
                    <img src="${thumbnailSrc}" alt="${project.title}">
                    <h3>${project.title}</h3>
                    <p>${project.description.substring(0, 100)}...</p>
                `;

                projectsContainer.appendChild(projectCard);

                // Modal açma olay dinleyicisini ekle
                projectCard.addEventListener('click', () => {
                    openProjectModal(project);
                });
            });

        } catch (error) {
            console.error('Projeler yüklenirken hata oluştu:', error);
            loadingMessage.textContent = 'Projeler yüklenirken bir hata oluştu.';
        }
    };

    // Function to open the project modal
    const openProjectModal = (project) => {
        if (!projectModal) { // projectModal elementi bulunamazsa hata vermemesi için kontrol
            console.error("Proje modal elementi bulunamadı. Lütfen HTML'inizi kontrol edin.");
            return;
        }

        modalTitle.textContent = project.title;
        modalDescription.textContent = project.description;
        modalMediaGallery.innerHTML = ''; // Önceki medyayı temizle

        // Ana medyayı (ilk resim veya video) ekle
        let mainMediaSrc = null;
        let mainMediaType = null;

        if (project.video) {
            mainMediaSrc = project.video;
            mainMediaType = 'video';
        } else if (project.images.length > 0) {
            mainMediaSrc = project.images[0];
            mainMediaType = 'image';
        }

        if (mainMediaSrc) {
            const mainMediaElement = document.createElement(mainMediaType === 'video' ? 'video' : 'img');
            mainMediaElement.classList.add('main-media', 'active');
            mainMediaElement.src = mainMediaSrc;
            if (mainMediaType === 'video') {
                mainMediaElement.controls = true;
                mainMediaElement.autoplay = true;
                mainMediaElement.loop = true; // İsteğe bağlı: videoyu döngüye al
                mainMediaElement.muted = false; // İsteğe bağlı: autoplay'de sesi kapatma
            }
            modalMediaGallery.appendChild(mainMediaElement);
        }

        // Diğer resimleri/videoyu thumbnail olarak ekle
        project.images.forEach((imgSrc, index) => {
            if (index === 0 && mainMediaType === 'image' && mainMediaSrc === imgSrc) return; // Zaten ana medya ise atla
            const imgElement = document.createElement('img');
            imgElement.src = imgSrc;
            imgElement.alt = `Proje ${project.id} Resim ${index + 1}`;
            imgElement.addEventListener('click', () => {
                // Tıklanan resmi ana medya yap
                const currentMain = modalMediaGallery.querySelector('.main-media');
                if (currentMain) {
                    currentMain.classList.remove('active');
                    currentMain.remove();
                }
                const newMain = document.createElement('img');
                newMain.classList.add('main-media', 'active');
                newMain.src = imgSrc;
                modalMediaGallery.prepend(newMain); // Başa ekle
            });
            modalMediaGallery.appendChild(imgElement);
        });

        // Eğer video varsa ve ana medya olarak eklenmediyse thumbnail olarak ekle
        if (project.video && !(mainMediaType === 'video' && mainMediaSrc === project.video)) {
            const videoElement = document.createElement('video');
            videoElement.src = project.video;
            videoElement.controls = false; // Thumbnail'larda kontrolleri gösterme
            videoElement.addEventListener('click', () => {
                // Tıklanan videoyu ana medya yap
                const currentMain = modalMediaGallery.querySelector('.main-media');
                if (currentMain) {
                    currentMain.classList.remove('active');
                    currentMain.pause(); // Eski videoyu durdur
                    currentMain.remove();
                }
                const newMain = document.createElement('video');
                newMain.classList.add('main-media', 'active');
                newMain.src = project.video;
                newMain.controls = true;
                newMain.autoplay = true;
                newMain.loop = true;
                newMain.muted = false; // Ana video olduğunda sesi aç
                modalMediaGallery.prepend(newMain); // Başa ekle
            });
            modalMediaGallery.appendChild(videoElement);
        }

        projectModal.style.display = 'flex'; // Modalı göster
        document.body.style.overflow = 'hidden'; // Body kaydırmasını engelle
    };

    // Modalı kapatma butonuna tıklama olayını dinle
    if (closeModalButton) { // close button elementi bulunamazsa hata vermemesi için kontrol
        closeModalButton.addEventListener('click', () => {
            projectModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Kaydırmayı tekrar etkinleştir
            const mainVideo = modalMediaGallery.querySelector('video.main-media');
            if (mainVideo) {
                mainVideo.pause(); // Modalı kapatırken videoyu duraklat
            }
        });
    }


    // Modal içeriğinin dışına tıklama olayını dinle (modalı kapatmak için)
    window.addEventListener('click', (event) => {
        if (event.target === projectModal) {
            projectModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            const mainVideo = modalMediaGallery.querySelector('video.main-media');
            if (mainVideo) {
                mainVideo.pause();
            }
        }
    });

    // Sayfa yüklendiğinde projeleri getir
    fetchProjects();
});