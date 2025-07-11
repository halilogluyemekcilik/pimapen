document.addEventListener('DOMContentLoaded', () => {
    const projectsContainer = document.getElementById('projects-container');
    const loadingMessage = document.getElementById('loading-message');
    const projectModal = document.getElementById('projectModal');
    const closeModalButton = document.querySelector('.close-button');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalMediaGallery = document.querySelector('.modal-media-gallery');

    // Function to fetch and process project data
    const fetchProjects = async () => {
        try {
            // Simulate fetching project IDs from the server by listing files
            // In a real scenario, you might have an API endpoint returning project metadata.
            // For this setup, we'll assume project IDs are integers starting from 1.
            // We'll try to find project data up to a reasonable number, e.g., 50 projects.
            const maxProjectCount = 50;
            const projectIDs = [];
            for (let i = 1; i <= maxProjectCount; i++) {
                // Check if the main text file for the project exists
                const txtResponse = await fetch(`img/${i}.txt`, { method: 'HEAD' });
                if (txtResponse.ok) {
                    projectIDs.push(i);
                }
            }

            loadingMessage.style.display = 'none'; // Hide loading message

            if (projectIDs.length === 0) {
                projectsContainer.innerHTML = '<p class="no-projects">Henüz yüklü proje bulunmamaktadır.</p>';
                return;
            }

            for (const id of projectIDs) {
                const projectTitle = `Proje ${id}`; // Default title, can be enhanced
                let description = 'Açıklama bulunamadı.';
                const images = [];
                let video = null;

                // Fetch description
                try {
                    const descResponse = await fetch(`img/${id}.txt`);
                    if (descResponse.ok) {
                        description = await descResponse.text();
                    }
                } catch (error) {
                    console.warn(`Proje ${id} için metin dosyası bulunamadı: ${error}`);
                }

                // Fetch images
                for (let i = 1; i <= 10; i++) { // Max 10 images per project
                    const imgPath = `img/${id}-${i}.jpg`;
                    try {
                        const imgResponse = await fetch(imgPath, { method: 'HEAD' });
                        if (imgResponse.ok) {
                            images.push(imgPath);
                        } else {
                            // If X-1.jpg doesn't exist, assume no more images for project X
                            break;
                        }
                    } catch (error) {
                        break; // Stop if there's an error (e.g., file not found)
                    }
                }

                // Check for video
                const videoPath = `img/${id}.mp4`;
                try {
                    const videoResponse = await fetch(videoPath, { method: 'HEAD' });
                    if (videoResponse.ok) {
                        video = videoPath;
                    }
                } catch (error) {
                    // No video, just ignore
                }

                // Create project card
                const projectCard = document.createElement('div');
                projectCard.classList.add('project-card');
                projectCard.setAttribute('data-project-id', id);

                // Use the first image as thumbnail or a placeholder
                const thumbnailSrc = images.length > 0 ? images[0] : 'img/placeholder.jpg'; // You might need a generic placeholder
                
                projectCard.innerHTML = `
                    <img src="${thumbnailSrc}" alt="${projectTitle}">
                    <h3>${projectTitle}</h3>
                    <p>${description.substring(0, 100)}...</p> `;
                
                projectsContainer.appendChild(projectCard);

                // Add click event listener to open modal
                projectCard.addEventListener('click', () => {
                    openProjectModal({
                        id: id,
                        title: projectTitle,
                        description: description,
                        images: images,
                        video: video
                    });
                });
            }

        } catch (error) {
            console.error('Projeler yüklenirken hata oluştu:', error);
            loadingMessage.textContent = 'Projeler yüklenirken bir hata oluştu.';
        }
    };

    // Function to open the project modal
    const openProjectModal = (project) => {
        modalTitle.textContent = project.title;
        modalDescription.textContent = project.description;
        modalMediaGallery.innerHTML = ''; // Clear previous media

        // Add main media (first image or video)
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
                mainMediaElement.loop = true; // Optional: loop video
                mainMediaElement.muted = true; // Optional: mute video on autoplay
            }
            modalMediaGallery.appendChild(mainMediaElement);
        }

        // Add other images/videos as thumbnails
        project.images.forEach((imgSrc, index) => {
            if (index === 0 && mainMediaType === 'image') return; // Skip if already main
            const imgElement = document.createElement('img');
            imgElement.src = imgSrc;
            imgElement.alt = `Proje ${project.id} Resim ${index + 1}`;
            imgElement.addEventListener('click', () => {
                // Change main media to clicked image
                const currentMain = modalMediaGallery.querySelector('.main-media');
                if (currentMain) {
                    currentMain.classList.remove('active');
                    currentMain.remove();
                }
                const newMain = document.createElement('img');
                newMain.classList.add('main-media', 'active');
                newMain.src = imgSrc;
                modalMediaGallery.prepend(newMain); // Add to the beginning
            });
            modalMediaGallery.appendChild(imgElement);
        });

        if (project.video && !(mainMediaType === 'video' && mainMediaSrc === project.video)) {
            const videoElement = document.createElement('video');
            videoElement.src = project.video;
            videoElement.controls = false; // Thumbnails don't need controls
            videoElement.addEventListener('click', () => {
                // Change main media to clicked video
                const currentMain = modalMediaGallery.querySelector('.main-media');
                if (currentMain) {
                    currentMain.classList.remove('active');
                    currentMain.remove();
                }
                const newMain = document.createElement('video');
                newMain.classList.add('main-media', 'active');
                newMain.src = project.video;
                newMain.controls = true;
                newMain.autoplay = true;
                newMain.loop = true;
                newMain.muted = false; // Unmute when it's the main video
                modalMediaGallery.prepend(newMain); // Add to the beginning
            });
            modalMediaGallery.appendChild(videoElement);
        }


        projectModal.style.display = 'flex'; // Display the modal
        document.body.style.overflow = 'hidden'; // Prevent scrolling on body
    };

    // Close modal when close button is clicked
    closeModalButton.addEventListener('click', () => {
        projectModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Re-enable scrolling
        const mainVideo = modalMediaGallery.querySelector('video.main-media');
        if (mainVideo) {
            mainVideo.pause(); // Pause video when closing modal
        }
    });

    // Close modal when clicking outside the modal content
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

    // Initial load of projects
    fetchProjects();
});