document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       HERO BACKGROUND CAROUSEL
       ========================================================================== */
    const slides = document.querySelectorAll('#hero-bg-carousel .carousel-slide');
    const prevBtn = document.getElementById('prev-slide-btn');
    const nextBtn = document.getElementById('next-slide-btn');
    const indicators = document.querySelectorAll('#carousel-indicators-container .indicator');
    
    let currentSlide = 0;
    let slideInterval;
    
    const showSlide = (index) => {
        if (slides.length === 0) return;
        
        // Remove active class from all slides and indicators
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(ind => ind.classList.remove('active'));
        
        // Handle boundary loop
        currentSlide = (index + slides.length) % slides.length;
        
        // Set active slide and indicator
        slides[currentSlide].classList.add('active');
        if (indicators[currentSlide]) {
            indicators[currentSlide].classList.add('active');
        }
    };
    
    const nextSlide = () => {
        showSlide(currentSlide + 1);
    };
    
    const prevSlide = () => {
        showSlide(currentSlide - 1);
    };
    
    const startSlideShow = () => {
        stopSlideShow();
        slideInterval = setInterval(nextSlide, 5000); // Change image every 5 seconds
    };
    
    const stopSlideShow = () => {
        if (slideInterval) clearInterval(slideInterval);
    };
    
    // Add Click Listeners to controls
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            startSlideShow(); // reset timer on manual click
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            startSlideShow(); // reset timer on manual click
        });
    }
    
    // Add Click Listeners to indicators
    indicators.forEach(indicator => {
        indicator.addEventListener('click', (e) => {
            const slideIndex = parseInt(e.target.getAttribute('data-slide'));
            showSlide(slideIndex);
            startSlideShow(); // reset timer on manual click
        });
    });
    
    // Initialize automatic slides
    if (slides.length > 0) {
        startSlideShow();
    }

    /* ==========================================================================
       MOBILE NAVIGATION MENU TOGGLE
       ========================================================================== */
    const navToggleBtn = document.getElementById('nav-toggle-btn');
    const navMenuList = document.getElementById('nav-menu-list');

    if (navToggleBtn && navMenuList) {
        navToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenuList.classList.toggle('active');
            
            // Toggle icon between hamburger menu and close
            const icon = navToggleBtn.querySelector('.material-symbols-outlined');
            if (icon) {
                if (navMenuList.classList.contains('active')) {
                    icon.textContent = 'close';
                } else {
                    icon.textContent = 'menu';
                }
            }
        });

        // Close menu when clicking a link
        const navLinks = navMenuList.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenuList.classList.remove('active');
                const icon = navToggleBtn.querySelector('.material-symbols-outlined');
                if (icon) icon.textContent = 'menu';
            });
        });

        // Close menu when clicking anywhere outside
        document.addEventListener('click', (e) => {
            if (!navMenuList.contains(e.target) && !navToggleBtn.contains(e.target)) {
                navMenuList.classList.remove('active');
                const icon = navToggleBtn.querySelector('.material-symbols-outlined');
                if (icon) icon.textContent = 'menu';
            }
        });
    }

    /* ==========================================================================
       SCROLL STYLING FOR NAVBAR
       ========================================================================== */
    const navbarWrapper = document.querySelector('.navbar-wrapper');
    
    const handleScroll = () => {
        if (window.scrollY > 40) {
            navbarWrapper.classList.add('scrolled');
        } else {
            navbarWrapper.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Run once in case page loads scrolled

    /* ==========================================================================
       ACTIVE LINK HIGHLIGHT ON SCROLL
       ========================================================================== */
    const sections = document.querySelectorAll('section, header, footer');
    const navItems = document.querySelectorAll('.nav-link:not(.btn-primary):not(.btn-secondary)');

    const highlightActiveLink = () => {
        let currentSectionId = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            const href = item.getAttribute('href');
            if (href === '#' && (currentSectionId === 'inicio' || !currentSectionId)) {
                item.classList.add('active');
            } else if (href === `#${currentSectionId}`) {
                item.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', highlightActiveLink);
    highlightActiveLink();

    /* ==========================================================================
       DYNAMIC PORTAL FORMS VALIDATION & SUBMIT
       ========================================================================== */

    // Helper to validate Chile telephone numbers (+56 9 ...)
    const isValidChilePhone = (phone) => {
        // Clean characters
        const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
        // Chile numbers usually have 9 digits (or 11 if starting with 56)
        return cleaned.length >= 8 && cleaned.length <= 12;
    };

    // 1. Producer Form (Outsourcing)
    const producerForm = document.getElementById('producer-form');
    const producerStatus = document.getElementById('producer-form-status');
    const btnUnlockProducer = document.getElementById('btn-unlock-producer');
    const producerPortalBox = document.getElementById('producer-portal-box');

    // Unblur and unlock the card on click
    if (btnUnlockProducer && producerPortalBox) {
        btnUnlockProducer.addEventListener('click', () => {
            producerPortalBox.classList.remove('blurred-state');
            const overlay = document.getElementById('producer-card-overlay');
            if (overlay) {
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 500);
            }
        });
    }

    if (producerForm && producerStatus) {
        producerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const prodName = document.getElementById('prod-name').value.trim();
            const prodContact = document.getElementById('prod-contact').value.trim();
            const prodFruit = document.getElementById('prod-fruit').value.trim();
            const prodMessage = document.getElementById('prod-message').value.trim() || 'sin mensaje adicional';

            if (!prodName || !prodContact || !prodFruit) {
                showStatus(producerStatus, 'Por favor, complete todos los campos obligatorios.', 'error');
                return;
            }

            if (!isValidChilePhone(prodContact)) {
                showStatus(producerStatus, 'Por favor, ingrese un teléfono válido de contacto.', 'error');
                return;
            }

            // Simulate API Request Success
            showStatus(producerStatus, '¡Solicitud enviada con éxito! Don Jorge o nuestro equipo de JPD lo contactará en breve.', 'success');
            producerForm.reset();
        });
    }

    // 2. Worker Form (Job Application)
    const workerForm = document.getElementById('worker-form');
    const workerStatus = document.getElementById('worker-form-status');
    const fileInput = document.getElementById('work-cv');
    const uploadText = document.querySelector('.file-upload-design .upload-text');
    const uploadSubtext = document.querySelector('.file-upload-design .upload-subtext');
    const uploadIcon = document.querySelector('.file-upload-design .upload-icon');

    // Custom Interactive File Upload representation
    if (fileInput && uploadText) {
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                const fileName = fileInput.files[0].name;
                uploadText.textContent = `Archivo seleccionado: ${fileName}`;
                uploadSubtext.textContent = 'Currículum cargado correctamente (Simulación)';
                uploadIcon.textContent = 'task_alt';
                uploadIcon.style.color = '#70a038'; // Success green
            } else {
                uploadText.textContent = 'Seleccionar o arrastrar archivo CV';
                uploadSubtext.textContent = 'Formatos permitidos: PDF, Word (Max: 5MB)';
                uploadIcon.textContent = 'cloud_upload';
                uploadIcon.style.color = ''; // Reset
            }
        });
    }

    if (workerForm && workerStatus) {
        workerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const workName = document.getElementById('work-name').value.trim();
            const workPhone = document.getElementById('work-phone').value.trim();
            const workCommune = document.getElementById('work-commune').value.trim();
            const workArea = document.getElementById('work-area').value;
            const workMessage = document.getElementById('work-message').value.trim() || 'sin experiencia especificada';

            if (!workName || !workPhone || !workCommune) {
                showStatus(workerStatus, 'Por favor, complete todos los campos requeridos.', 'error');
                return;
            }

            if (!isValidChilePhone(workPhone)) {
                showStatus(workerStatus, 'Por favor, ingrese un teléfono de contacto válido.', 'error');
                return;
            }

            // Simulate API Request Success
            showStatus(workerStatus, '¡Postulación registrada! Su inscripción en la familia JPD está completa. Lo llamaremos pronto para los traslados.', 'success');
            workerForm.reset();
            
            // Reset upload mockup
            if (uploadText) {
                uploadText.textContent = 'Seleccionar o arrastrar archivo CV';
                uploadSubtext.textContent = 'Formatos permitidos: PDF, Word (Max: 5MB)';
                uploadIcon.textContent = 'cloud_upload';
                uploadIcon.style.color = '';
            }
        });
    }

    // Helper to display status notifications inside portal forms
    function showStatus(element, message, type) {
        element.textContent = message;
        element.className = 'form-status'; // Reset classes
        
        if (type === 'success') {
            element.classList.add('success');
            element.style.display = 'block';
        } else {
            element.classList.add('error');
            element.style.display = 'block';
            element.style.backgroundColor = 'rgba(235, 87, 87, 0.08)';
            element.style.color = '#eb5757';
            element.style.border = '1px solid rgba(235, 87, 87, 0.2)';
        }

        // Auto hide success after 7 seconds
        if (type === 'success') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 7000);
        }
    }

    /* ==========================================================================
       INTERACTIVE SERVICES ACCORDION & SHOWCASE
       ========================================================================== */
    const serviceCards = document.querySelectorAll('.servicio-interactive-card');
    const showcaseImages = document.querySelectorAll('.showcase-image');
    const servicesContainer = document.getElementById('services-interactive-container');

    const activateService = (index) => {
        if (serviceCards.length === 0 || showcaseImages.length === 0) return;

        // Remove active class from all cards and images
        serviceCards.forEach(card => card.classList.remove('active'));
        showcaseImages.forEach(img => img.classList.remove('active'));

        // Find and activate target card
        const targetCard = document.querySelector(`.servicio-interactive-card[data-service="${index}"]`);
        if (targetCard) {
            targetCard.classList.add('active');
        }

        // Find and activate target showcase image
        const targetImage = document.querySelector(`.showcase-image[data-img="${index}"]`);
        if (targetImage) {
            targetImage.classList.add('active');
        }
    };

    // Attach listeners to cards
    serviceCards.forEach(card => {
        const index = card.getAttribute('data-service');
        if (index === null) return;

        // Desktop mouse hover trigger
        card.addEventListener('mouseenter', () => {
            activateService(index);
        });

        // Mobile / tablet tap or click trigger
        card.addEventListener('click', () => {
            activateService(index);
        });
    });

    // Reset back to Card 3 (Las Ventajas de JPD - index 2) on mouseleave of the container
    if (servicesContainer) {
        servicesContainer.addEventListener('mouseleave', () => {
            activateService('2'); // Default to index 2 (Advantages Card)
        });
    }

    /* ==========================================================================
       FACEBOOK TESTIMONIALS CAROUSEL
       ========================================================================== */
    const fbTrack = document.getElementById('fb-carousel-track');
    const fbPrevBtn = document.getElementById('fb-prev-btn');
    const fbNextBtn = document.getElementById('fb-next-btn');
    const fbIndicators = document.querySelectorAll('#fb-indicators-container .fb-indicator');
    
    const originalSlides = Array.from(document.querySelectorAll('.fb-comment-slide'));
    
    let fbCurrentIndex = 0; // Represents the active original slide index (0 to 5)
    let fbAutoSlideInterval;
    let isTransitioning = false;
    const clonesCount = 2;

    if (fbTrack && originalSlides.length > 0) {
        // Clone the last two slides and prepend them
        const cloneLast1 = originalSlides[originalSlides.length - 1].cloneNode(true);
        const cloneLast2 = originalSlides[originalSlides.length - 2].cloneNode(true);
        cloneLast1.classList.add('fb-slide-clone');
        cloneLast2.classList.add('fb-slide-clone');
        
        // Clone the first two slides and append them
        const cloneFirst1 = originalSlides[0].cloneNode(true);
        const cloneFirst2 = originalSlides[1].cloneNode(true);
        cloneFirst1.classList.add('fb-slide-clone');
        cloneFirst2.classList.add('fb-slide-clone');
        
        // Prepend: Slide 5, then Slide 6
        fbTrack.insertBefore(cloneLast1, fbTrack.firstChild);
        fbTrack.insertBefore(cloneLast2, fbTrack.firstChild);
        
        // Append: Slide 1, then Slide 2
        fbTrack.appendChild(cloneFirst1);
        fbTrack.appendChild(cloneFirst2);
    }

    const updateCarouselPosition = (useTransition = true) => {
        if (!fbTrack || originalSlides.length === 0) return;
        
        const isDesktop = window.innerWidth >= 1024;
        const slideWidth = isDesktop ? 33.33333 : 100;
        const K = fbCurrentIndex + clonesCount;
        
        let translation;
        if (isDesktop) {
            translation = -(K - 1) * slideWidth; // Center the slide on desktop by shifting the viewport by 1 slot
        } else {
            translation = -K * slideWidth; // Standalone mobile slide (100% width takes full screen)
        }
        
        if (useTransition) {
            isTransitioning = true;
            fbTrack.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            isTransitioning = false;
            fbTrack.style.transition = 'none';
        }
        
        fbTrack.style.transform = `translateX(${translation}%)`;
        
        // Update active-center class on the slide elements in the DOM
        const allSlidesInDom = fbTrack.querySelectorAll('.fb-comment-slide');
        allSlidesInDom.forEach(slide => {
            slide.classList.remove('active-center');
        });
        
        if (allSlidesInDom[K]) {
            allSlidesInDom[K].classList.add('active-center');
        }
        
        // Update active state of indicator dots
        fbIndicators.forEach(ind => ind.classList.remove('active'));
        
        // Map the indicator index correctly at boundaries
        let indicatorIndex = fbCurrentIndex;
        if (fbCurrentIndex === originalSlides.length) {
            indicatorIndex = 0;
        } else if (fbCurrentIndex === -1) {
            indicatorIndex = originalSlides.length - 1;
        }
        
        if (fbIndicators[indicatorIndex]) {
            fbIndicators[indicatorIndex].classList.add('active');
        }
    };

    const nextFbSlide = () => {
        if (isTransitioning) return;
        fbCurrentIndex++;
        updateCarouselPosition(true);
    };

    const prevFbSlide = () => {
        if (isTransitioning) return;
        fbCurrentIndex--;
        updateCarouselPosition(true);
    };

    // Transition end handler to loop instantly at boundaries
    if (fbTrack) {
        fbTrack.addEventListener('transitionend', (e) => {
            // ONLY trigger for the track element's transform property to prevent bubbles from slide cards
            if (e.target !== fbTrack || e.propertyName !== 'transform') return;
            
            isTransitioning = false;
            
            if (fbCurrentIndex === originalSlides.length) {
                fbCurrentIndex = 0;
                updateCarouselPosition(false);
            } else if (fbCurrentIndex === -1) {
                fbCurrentIndex = originalSlides.length - 1;
                updateCarouselPosition(false);
            }
        });
    }

    const startFbAutoSlide = () => {
        stopFbAutoSlide();
        fbAutoSlideInterval = setInterval(nextFbSlide, 6000); // Shift slide every 6 seconds
    };

    const stopFbAutoSlide = () => {
        if (fbAutoSlideInterval) clearInterval(fbAutoSlideInterval);
    };

    // Control buttons listeners
    if (fbNextBtn) {
        fbNextBtn.addEventListener('click', () => {
            nextFbSlide();
            startFbAutoSlide();
        });
    }

    if (fbPrevBtn) {
        fbPrevBtn.addEventListener('click', () => {
            prevFbSlide();
            startFbAutoSlide();
        });
    }

    // Indicator dots listeners
    fbIndicators.forEach(indicator => {
        indicator.addEventListener('click', (e) => {
            if (isTransitioning) return;
            const slideIndex = parseInt(e.target.getAttribute('data-slide'));
            fbCurrentIndex = slideIndex;
            updateCarouselPosition(true);
            startFbAutoSlide();
        });
    });

    // Touch Swipe gestures for mobile devices
    let startSwipeX = 0;
    let endSwipeX = 0;

    if (fbTrack) {
        fbTrack.addEventListener('touchstart', (e) => {
            startSwipeX = e.touches[0].clientX;
            stopFbAutoSlide();
        }, { passive: true });

        fbTrack.addEventListener('touchend', (e) => {
            endSwipeX = e.changedTouches[0].clientX;
            const diffX = startSwipeX - endSwipeX;
            if (Math.abs(diffX) > 50) { // minimum swipe boundary
                if (diffX > 0) {
                    nextFbSlide();
                } else {
                    prevFbSlide();
                }
            }
            startFbAutoSlide();
        }, { passive: true });

        // Pause automatic carousel shift on mouse hover (desktop reader-friendly)
        const fbContainer = document.getElementById('fb-testimonials-carousel');
        if (fbContainer) {
            fbContainer.addEventListener('mouseenter', stopFbAutoSlide);
            fbContainer.addEventListener('mouseleave', startFbAutoSlide);
        }
    }

    // Handle screen resize to reset track translations cleanly without sliding animations
    window.addEventListener('resize', () => {
        updateCarouselPosition(false);
    });

    // Initialize carousel state
    if (originalSlides.length > 0) {
        updateCarouselPosition(false);
        startFbAutoSlide();
    }

    /* ==========================================================================
       INTERACTIVE GALLERY & PREMIUM LIGHTBOX (SEAMLESS INFINITE LOOP)
       ========================================================================== */
    const track = document.getElementById('gallery-mosaic-grid');
    const galleryWrapper = document.querySelector('.gallery-horizontal-wrapper');

    if (track) {
        // Triple the grid elements to establish a seamless infinite loop track
        const originalHTML = track.innerHTML;
        track.innerHTML = originalHTML + originalHTML + originalHTML;
    }

    const filterButtons = document.querySelectorAll('.gallery-filters .filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-horizontal-track .gallery-item');
    const lightboxModal = document.getElementById('gallery-lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-active-img');
    const lightboxTag = document.getElementById('lightbox-active-tag');
    const lightboxTitle = document.getElementById('lightbox-active-title');
    const lightboxDesc = document.getElementById('lightbox-active-desc');
    const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
    const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
    const lightboxNextBtn = document.getElementById('lightbox-next-btn');

    let currentLightboxItems = [];
    let currentLightboxIndex = 0;

    // Set up infinite scroll jumping
    if (galleryWrapper && track) {
        let groupWidth = track.scrollWidth / 3;

        // Position initial scroll in the middle (Group B)
        setTimeout(() => {
            groupWidth = track.scrollWidth / 3;
            galleryWrapper.scrollLeft = groupWidth;
        }, 80);

        galleryWrapper.addEventListener('scroll', () => {
            if (groupWidth === 0) {
                groupWidth = track.scrollWidth / 3;
            }
            const currentScroll = galleryWrapper.scrollLeft;
            // Seamless wrap-around boundaries
            if (currentScroll >= groupWidth * 2) {
                galleryWrapper.scrollLeft = currentScroll - groupWidth;
            } else if (currentScroll <= 0) {
                galleryWrapper.scrollLeft = currentScroll + groupWidth;
            }
        });

        window.addEventListener('resize', () => {
            groupWidth = track.scrollWidth / 3;
            galleryWrapper.scrollLeft = groupWidth;
        });
    }

    // 1. Category Filtering Logic
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Toggle active filter button
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            galleryItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filterValue === 'all' || category === filterValue) {
                    item.classList.remove('filtered-out');
                    // Reset inline styles if any
                    item.style.display = '';
                } else {
                    item.classList.add('filtered-out');
                    // Wait for transition to complete before setting display none to avoid jumps
                    setTimeout(() => {
                        if (item.classList.contains('filtered-out')) {
                            item.style.display = 'none';
                        }
                    }, 400);
                }
            });
        });
    });

    // Helper to load image in Lightbox Modal
    const loadLightboxImage = (index) => {
        if (index < 0 || index >= currentLightboxItems.length) return;
        
        currentLightboxIndex = index;
        const targetItem = currentLightboxItems[currentLightboxIndex];
        
        const img = targetItem.querySelector('.gallery-img');
        const tag = targetItem.querySelector('.gallery-item-tag');
        const title = targetItem.querySelector('.gallery-item-title');
        const desc = targetItem.querySelector('.gallery-item-desc');

        if (lightboxImg && img) {
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
        }
        if (lightboxTag && tag) lightboxTag.textContent = tag.textContent;
        if (lightboxTitle && title) lightboxTitle.textContent = title.textContent;
        if (lightboxDesc && desc) lightboxDesc.textContent = desc.textContent;
    };

    // 2. Open Lightbox on item click
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            // Cancel click if dragging occurred
            const galleryWrapper = document.querySelector('.gallery-horizontal-wrapper');
            if (galleryWrapper && galleryWrapper.classList.contains('dragged')) {
                return;
            }
            
            // Get all items that are currently visible (not filtered out)
            currentLightboxItems = Array.from(document.querySelectorAll('.gallery-item:not(.filtered-out)'));
            
            // Find index of clicked item in the visible items array
            const itemIndex = currentLightboxItems.indexOf(item);
            
            if (itemIndex !== -1 && lightboxModal) {
                loadLightboxImage(itemIndex);
                lightboxModal.classList.add('active');
                document.body.style.overflow = 'hidden'; // Lock scrolling
            }
        });
    });

    // 3. Close Lightbox Modal
    const closeLightbox = () => {
        if (lightboxModal) {
            lightboxModal.classList.remove('active');
            document.body.style.overflow = ''; // Unlock scrolling
            if (lightboxImg) lightboxImg.src = ''; // Clear image to free up RAM
        }
    };

    if (lightboxCloseBtn) {
        lightboxCloseBtn.addEventListener('click', closeLightbox);
    }

    // Close when clicking outside of the content block
    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) {
                closeLightbox();
            }
        });
    }

    // 4. Navigation arrows in Lightbox Modal
    const prevLightboxImage = () => {
        if (currentLightboxItems.length === 0) return;
        let prevIndex = currentLightboxIndex - 1;
        if (prevIndex < 0) prevIndex = currentLightboxItems.length - 1; // loop backwards
        loadLightboxImage(prevIndex);
    };

    const nextLightboxImage = () => {
        if (currentLightboxItems.length === 0) return;
        let nextIndex = currentLightboxIndex + 1;
        if (nextIndex >= currentLightboxItems.length) nextIndex = 0; // loop forward
        loadLightboxImage(nextIndex);
    };

    if (lightboxPrevBtn) {
        lightboxPrevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            prevLightboxImage();
        });
    }

    if (lightboxNextBtn) {
        lightboxNextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            nextLightboxImage();
        });
    }

    // Keyboard Navigation support
    document.addEventListener('keydown', (e) => {
        if (!lightboxModal || !lightboxModal.classList.contains('active')) return;
        
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            prevLightboxImage();
        } else if (e.key === 'ArrowRight') {
            nextLightboxImage();
        }
    });

    /* ==========================================================================
       DRAG TO SCROLL FOR HORIZONTAL MOSAIC GALLERY
       ========================================================================== */
    if (galleryWrapper) {
        let isDown = false;
        let startX;
        let scrollLeft;
        let moved = false;

        galleryWrapper.addEventListener('mousedown', (e) => {
            isDown = true;
            galleryWrapper.classList.add('dragging');
            startX = e.pageX - galleryWrapper.offsetLeft;
            scrollLeft = galleryWrapper.scrollLeft;
            moved = false;
        });

        galleryWrapper.addEventListener('mouseleave', () => {
            isDown = false;
            galleryWrapper.classList.remove('dragging');
        });

        galleryWrapper.addEventListener('mouseup', (e) => {
            isDown = false;
            galleryWrapper.classList.remove('dragging');
            
            if (moved) {
                galleryWrapper.classList.add('dragged');
                setTimeout(() => {
                    galleryWrapper.classList.remove('dragged');
                }, 50);
            }
        });

        galleryWrapper.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - galleryWrapper.offsetLeft;
            const walk = (x - startX) * 1.5; // Scroll speed multiplier
            if (Math.abs(walk) > 5) {
                moved = true;
            }
            galleryWrapper.scrollLeft = scrollLeft - walk;
        });
    }

    /* ==========================================================================
       SCROLL REVEAL PRESENTATION EFFECTS (INTERSECTION OBSERVER)
       ========================================================================== */
    const revealElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right');
    
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target); // Trigger only once
                }
            });
        }, {
            threshold: 0.1, // Trigger when at least 10% is in viewport
            rootMargin: '0px 0px -40px 0px' // Offset triggers slightly
        });
        
        revealElements.forEach(el => {
            revealObserver.observe(el);
        });
    }

    /* ==========================================================================
       LOGIN MODAL WINDOW EVENT HANDLERS (MOCKUP ACCESSIBILITY)
       ========================================================================== */
    const loginBtn = document.getElementById('link-login-cta');
    const loginModal = document.getElementById('login-modal');
    const loginCloseBtn = document.getElementById('login-close-btn');
    const loginForm = document.getElementById('login-form');
    const loginStatus = document.getElementById('login-form-status');

    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Block background scroll
        });
    }

    const closeLoginModal = () => {
        if (loginModal) {
            loginModal.classList.remove('active');
            document.body.style.overflow = ''; // Restore background scroll
            if (loginForm) loginForm.reset();
            if (loginStatus) loginStatus.style.display = 'none';
        }
    };

    if (loginCloseBtn) {
        loginCloseBtn.addEventListener('click', closeLoginModal);
    }

    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                closeLoginModal();
            }
        });
    }

    // Handle Mockup Login Form Submission
    if (loginForm && loginStatus) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;

            if (!username || !password) {
                showStatus(loginStatus, 'Por favor, ingrese todas sus credenciales.', 'error');
                return;
            }

            // Mockup: Accept any credentials with high-end success feedback and dynamic transition
            showStatus(loginStatus, '¡Sesión iniciada con éxito! Redirigiendo al panel administrativo de JPD...', 'success');
            
            setTimeout(() => {
                closeLoginModal();
            }, 2500);
        });
    }
});
