document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const getEl = (id) => document.getElementById(id);
    const addRowBtn = getEl('add-row'),
        addColBtn = getEl('add-col'),
        getCodeBtn = getEl('get-code'),
        saveLayoutBtn = getEl('save-layout-btn'),
        loadLayoutBtn = getEl('load-layout-btn'),
        resetGridBtn = getEl('reset-grid'),
        mergeBtn = getEl('merge-btn'),
        splitBtn = getEl('split-btn'),
        undoBtn = getEl('undo-btn'),
        redoBtn = getEl('redo-btn'),
        gridPreview = getEl('grid-preview'),
        codeOutputSection = getEl('code-output-section'),
        htmlCode = getEl('html-code'),
        cssCode = getEl('css-code'),
        rowInputsContainer = getEl('row-inputs'),
        colInputsContainer = getEl('col-inputs');
    const advancedControls = document.querySelector('.advanced-controls'),
        responsiveControls = document.querySelector('.responsive-controls'),
        themeToggle = getEl('theme-toggle'),
        templateSelect = getEl('template-select'),
        propertiesPanel = getEl('properties-panel'),
        itemNameInput = getEl('item-name-input');
    let rowSizes = ['1fr'];
    let colSizes = ['1fr'];
    let gridItems = [];
    let selectedItemIds = new Set();
    let nextItemId = 0;
    let history = [];
    let redoStack = [];
    let isDragging = false;
    let dragStartId = null;
    let nextGroupId = 1;
    // --- State ---

    // --- Selection & Dragging State ---
    let selectionStarted = false;
    let mouseDownPos = { x: 0, y: 0 };
    let selectionBeforeDrag = new Set();

    // --- Resizing State ---
    let isResizing = false;
    let resizeInfo = {
        type: null, // 'row' or 'col'
        index: -1,
        initialPos: 0,
        initialSizes: [],
    };

    // --- Templates ---
    const templates = {
        'holy-grail': {
            rowSizes: ['auto', '1fr', 'auto'],
            colSizes: ['150px', '1fr', '150px'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 3, name: 'header' },
                { row: 2, col: 1, rowSpan: 1, colSpan: 1, name: 'nav' },
                { row: 2, col: 2, rowSpan: 1, colSpan: 1, name: 'main-content' },
                { row: 2, col: 3, rowSpan: 1, colSpan: 1, name: 'ads' },
                { row: 3, col: 1, rowSpan: 1, colSpan: 3, name: 'footer' },
            ],
        },
        'sidebar-left': {
            rowSizes: ['auto', '1fr'],
            colSizes: ['200px', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 2, name: 'header' },
                { row: 2, col: 1, rowSpan: 1, colSpan: 1, name: 'sidebar' },
                { row: 2, col: 2, rowSpan: 1, colSpan: 1, name: 'main-content' },
            ],
        },
        'simple-gallery': {
            rowSizes: ['1fr', '1fr', '1fr'],
            colSizes: ['1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 1, name: 'img-1' },
                { row: 1, col: 2, rowSpan: 1, colSpan: 1, name: 'img-2' },
                { row: 1, col: 3, rowSpan: 1, colSpan: 1, name: 'img-3' },
                { row: 2, col: 1, rowSpan: 1, colSpan: 1, name: 'img-4' },
                { row: 2, col: 2, rowSpan: 1, colSpan: 1, name: 'img-5' },
                { row: 2, col: 3, rowSpan: 1, colSpan: 1, name: 'img-6' },
                { row: 3, col: 1, rowSpan: 1, colSpan: 1, name: 'img-7' },
                { row: 3, col: 2, rowSpan: 1, colSpan: 1, name: 'img-8' },
                { row: 3, col: 3, rowSpan: 1, colSpan: 1, name: 'img-9' },
            ],
        },
        'featured-gallery': {
            rowSizes: ['2fr', '1fr'],
            colSizes: ['1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 3, name: 'featured-image' },
                { row: 2, col: 1, rowSpan: 1, colSpan: 1, name: 'thumb-1' },
                { row: 2, col: 2, rowSpan: 1, colSpan: 1, name: 'thumb-2' },
                { row: 2, col: 3, rowSpan: 1, colSpan: 1, name: 'thumb-3' },
            ],
        },
        'dashboard': {
            rowSizes: ['auto', '1fr', '1fr'],
            colSizes: ['250px', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 3, name: 'top-bar' },
                { row: 2, col: 1, rowSpan: 2, colSpan: 1, name: 'sidebar' },
                { row: 2, col: 2, rowSpan: 1, colSpan: 2, name: 'main-chart' },
                { row: 3, col: 2, rowSpan: 1, colSpan: 1, name: 'stat-1' },
                { row: 3, col: 3, rowSpan: 1, colSpan: 1, name: 'stat-2' },
            ],
        },
        'product-listing': {
            rowSizes: ['1fr', '1fr'],
            colSizes: ['1fr', '1fr', '1fr', '1fr'],
            items: Array.from({ length: 8 }, (_, i) => ({
                row: Math.floor(i / 4) + 1,
                col: (i % 4) + 1,
                rowSpan: 1,
                colSpan: 1,
                name: `product-${i + 1}`,
            })),
        },
        'blog-post': {
            rowSizes: ['auto', '1fr', 'auto'],
            colSizes: ['3fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 2, name: 'header' },
                { row: 2, col: 1, rowSpan: 1, colSpan: 1, name: 'post-content' },
                { row: 2, col: 2, rowSpan: 1, colSpan: 1, name: 'related-links' },
                { row: 3, col: 1, rowSpan: 1, colSpan: 2, name: 'footer' },
            ],
        },
        'landing-hero': {
            rowSizes: ['50vh', 'auto'],
            colSizes: ['1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 3, name: 'hero-section' },
                { row: 2, col: 1, rowSpan: 1, colSpan: 1, name: 'feature-1' },
                { row: 2, col: 2, rowSpan: 1, colSpan: 1, name: 'feature-2' },
                { row: 2, col: 3, rowSpan: 1, colSpan: 1, name: 'feature-3' },
            ],
        },
        'split-screen': {
            rowSizes: ['100vh'],
            colSizes: ['1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 1, name: 'left-panel' },
                { row: 1, col: 2, rowSpan: 1, colSpan: 1, name: 'right-panel' },
            ],
        },
        'header-content-footer': {
            rowSizes: ['auto', '1fr', 'auto'],
            colSizes: ['1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 1, name: 'header' },
                { row: 2, col: 1, rowSpan: 1, colSpan: 1, name: 'main-content' },
                { row: 3, col: 1, rowSpan: 1, colSpan: 1, name: 'footer' },
            ],
        },
        'asymmetric-1': {
            rowSizes: ['100px', '200px', '150px'],
            colSizes: ['1fr', '2fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 2, name: 'box-a' },
                { row: 1, col: 3, rowSpan: 2, colSpan: 1, name: 'box-b' },
                { row: 2, col: 1, rowSpan: 2, colSpan: 1, name: 'box-c' },
                { row: 2, col: 2, rowSpan: 2, colSpan: 1, name: 'box-d' },
                { row: 3, col: 3, rowSpan: 1, colSpan: 1, name: 'box-e' },
            ],
        },
        'featured-card-grid': {
            rowSizes: ['1fr', '1fr'],
            colSizes: ['1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 2, colSpan: 2, name: 'featured-card' },
                { row: 1, col: 3, rowSpan: 1, colSpan: 1, name: 'small-card-1' },
                { row: 2, col: 3, rowSpan: 1, colSpan: 1, name: 'small-card-2' },
            ],
        },
        'dual-sidebar': {
            rowSizes: ['auto', '1fr', 'auto'],
            colSizes: ['200px', '1fr', '200px'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 3, name: 'header' },
                { row: 2, col: 1, rowSpan: 1, colSpan: 1, name: 'left-sidebar' },
                { row: 2, col: 2, rowSpan: 1, colSpan: 1, name: 'main' },
                { row: 2, col: 3, rowSpan: 1, colSpan: 1, name: 'right-sidebar' },
                { row: 3, col: 1, rowSpan: 1, colSpan: 3, name: 'footer' },
            ],
        },
        'video-playlist': {
            rowSizes: ['auto', '1fr'],
            colSizes: ['3fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 1, name: 'video-player' },
                { row: 1, col: 2, rowSpan: 2, colSpan: 1, name: 'playlist' },
                { row: 2, col: 1, rowSpan: 1, colSpan: 1, name: 'video-title' },
            ],
        },
        'pricing-table': {
            rowSizes: ['1fr'],
            colSizes: ['1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 1, name: 'plan-basic' },
                { row: 1, col: 2, rowSpan: 1, colSpan: 1, name: 'plan-pro' },
                { row: 1, col: 3, rowSpan: 1, colSpan: 1, name: 'plan-enterprise' },
            ],
        },
        'testimonials': {
            rowSizes: ['1fr', '1fr'],
            colSizes: ['1fr', '1fr'],
            items: Array.from({ length: 4 }, (_, i) => ({ row: Math.floor(i / 2) + 1, col: (i % 2) + 1, rowSpan: 1, colSpan: 1, name: `testimonial-${i + 1}` })),
        },
        'team-page': {
            rowSizes: ['auto', 'auto'],
            colSizes: ['1fr', '1fr', '1fr', '1fr'],
            items: Array.from({ length: 8 }, (_, i) => ({ row: Math.floor(i / 4) + 1, col: (i % 4) + 1, rowSpan: 1, colSpan: 1, name: `member-${i + 1}` })),
        },
        'contact-page': {
            rowSizes: ['1fr'],
            colSizes: ['1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 1, name: 'map' },
                { row: 1, col: 2, rowSpan: 1, colSpan: 1, name: 'contact-form' },
            ],
        },
        'magazine-1': {
            rowSizes: ['2fr', '1fr', '1fr'],
            colSizes: ['1fr', '1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 2, colSpan: 2, name: 'main-story' },
                { row: 1, col: 3, rowSpan: 1, colSpan: 2, name: 'top-ad' },
                { row: 2, col: 3, rowSpan: 1, colSpan: 1, name: 'sub-story-1' },
                { row: 2, col: 4, rowSpan: 2, colSpan: 1, name: 'sidebar' },
                { row: 3, col: 1, rowSpan: 1, colSpan: 3, name: 'bottom-story' },
            ],
        },
        'image-montage': {
            rowSizes: ['1fr', '1fr', '1fr'],
            colSizes: ['1fr', '1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 2, colSpan: 1, name: 'tall-img' },
                { row: 1, col: 2, rowSpan: 1, colSpan: 2, name: 'wide-img' },
                { row: 1, col: 4, rowSpan: 1, colSpan: 1, name: 'small-img-1' },
                { row: 2, col: 2, rowSpan: 2, colSpan: 1, name: 'portrait-img' },
                { row: 2, col: 3, rowSpan: 1, colSpan: 2, name: 'landscape-img' },
                { row: 3, col: 1, rowSpan: 1, colSpan: 1, name: 'small-img-2' },
                { row: 3, col: 3, rowSpan: 1, colSpan: 1, name: 'small-img-3' },
                { row: 3, col: 4, rowSpan: 1, colSpan: 1, name: 'small-img-4' },
            ],
        },
        'docs-layout': {
            rowSizes: ['auto', '1fr'],
            colSizes: ['250px', '1fr', '250px'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 3, name: 'header' },
                { row: 2, col: 1, rowSpan: 1, colSpan: 1, name: 'nav-sidebar' },
                { row: 2, col: 2, rowSpan: 1, colSpan: 1, name: 'main-doc' },
                { row: 2, col: 3, rowSpan: 1, colSpan: 1, name: 'toc-sidebar' },
            ],
        },
        'repeating-modules': {
            rowSizes: ['1fr', '1fr'],
            colSizes: ['1fr', '1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 2, colSpan: 1, name: 'module-1-main' },
                { row: 1, col: 2, rowSpan: 1, colSpan: 1, name: 'module-1-sub-1' },
                { row: 2, col: 2, rowSpan: 1, colSpan: 1, name: 'module-1-sub-2' },
                { row: 1, col: 3, rowSpan: 2, colSpan: 1, name: 'module-2-main' },
                { row: 1, col: 4, rowSpan: 1, colSpan: 1, name: 'module-2-sub-1' },
                { row: 2, col: 4, rowSpan: 1, colSpan: 1, name: 'module-2-sub-2' },
            ],
        },
        'ram-layout': {
            rowSizes: ['1fr', '1fr', '1fr', '1fr'],
            colSizes: ['1fr', '1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 2, colSpan: 2, name: 'area-a' },
                { row: 1, col: 3, rowSpan: 2, colSpan: 2, name: 'area-b' },
                { row: 3, col: 1, rowSpan: 2, colSpan: 2, name: 'area-c' },
                { row: 3, col: 3, rowSpan: 2, colSpan: 2, name: 'area-d' },
            ],
        },
        'overlapping-cards': {
            rowSizes: ['1fr', '1fr', '1fr', '1fr', '1fr'],
            colSizes: ['1fr', '1fr', '1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 3, colSpan: 3, name: 'card-back' },
                { row: 2, col: 2, rowSpan: 3, colSpan: 3, name: 'card-middle' },
                { row: 3, col: 3, rowSpan: 3, colSpan: 3, name: 'card-front' },
            ],
        },
        'masonry-approx': {
            rowSizes: ['repeat(6, 50px)'],
            colSizes: ['1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 2, name: 'item-1' },
                { row: 1, col: 2, rowSpan: 3, name: 'item-2' },
                { row: 1, col: 3, rowSpan: 2, name: 'item-3' },
                { row: 3, col: 1, rowSpan: 3, name: 'item-4' },
                { row: 4, col: 2, rowSpan: 2, name: 'item-5' },
                { row: 3, col: 3, rowSpan: 3, name: 'item-6' },
            ],
        },
        'full-width-centered': {
            rowSizes: ['auto', '1fr', 'auto'],
            colSizes: ['1fr', 'minmax(auto, 900px)', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 3, name: 'header' },
                { row: 2, col: 2, rowSpan: 1, colSpan: 1, name: 'main-content' },
                { row: 3, col: 1, rowSpan: 1, colSpan: 3, name: 'footer' },
            ],
        },
        'profile-page': {
            rowSizes: ['200px', 'auto', '1fr'],
            colSizes: ['1fr', '2fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 2, name: 'banner' },
                { row: 1, col: 1, rowSpan: 2, colSpan: 1, name: 'avatar' },
                { row: 2, col: 2, rowSpan: 1, colSpan: 1, name: 'user-info' },
                { row: 3, col: 1, rowSpan: 1, colSpan: 2, name: 'content-feed' },
            ],
        },
        'ecommerce-product': {
            rowSizes: ['3fr', '1fr'],
            colSizes: ['1fr', '2fr'],
            items: [
                { row: 1, col: 1, rowSpan: 2, colSpan: 1, name: 'thumbnails' },
                { row: 1, col: 2, rowSpan: 1, colSpan: 1, name: 'main-image' },
                { row: 2, col: 2, rowSpan: 1, colSpan: 1, name: 'product-details' },
            ],
        },
        'checkerboard-features': {
            rowSizes: ['1fr', '1fr', '1fr'],
            colSizes: ['1fr', '1fr'],
            items: [
                { row: 1, col: 1, name: 'text-1' }, { row: 1, col: 2, name: 'image-1' },
                { row: 2, col: 1, name: 'image-2' }, { row: 2, col: 2, name: 'text-2' },
                { row: 3, col: 1, name: 'text-3' }, { row: 3, col: 2, name: 'image-3' },
            ],
        },
        'multi-col-footer': {
            rowSizes: ['auto', 'auto'],
            colSizes: ['1fr', '1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, name: 'links-1' }, { row: 1, col: 2, name: 'links-2' },
                { row: 1, col: 3, name: 'links-3' }, { row: 1, col: 4, name: 'newsletter' },
                { row: 2, col: 1, rowSpan: 1, colSpan: 4, name: 'copyright' },
            ],
        },
        'hero-side-image': {
            rowSizes: ['auto', '1fr'],
            colSizes: ['1fr', '1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 4, name: 'header' },
                { row: 2, col: 1, rowSpan: 1, colSpan: 2, name: 'hero-text' },
                { row: 2, col: 3, rowSpan: 1, colSpan: 2, name: 'hero-image' },
            ],
        },
        'timeline': {
            rowSizes: ['1fr', '1fr', '1fr', '1fr'],
            colSizes: ['1fr', 'auto', '1fr'],
            items: [
                { row: 1, col: 1, name: 'event-left-1' }, { row: 1, col: 2, name: 'timeline-dot-1' },
                { row: 2, col: 3, name: 'event-right-1' }, { row: 2, col: 2, name: 'timeline-dot-2' },
                { row: 3, col: 1, name: 'event-left-2' }, { row: 3, col: 2, name: 'timeline-dot-3' },
                { row: 4, col: 3, name: 'event-right-2' }, { row: 4, col: 2, name: 'timeline-dot-4' },
            ],
        },
        'kanban-board': {
            rowSizes: ['auto', '1fr'],
            colSizes: ['1fr', '1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, name: 'col-header-1' }, { row: 2, col: 1, name: 'col-content-1' },
                { row: 1, col: 2, name: 'col-header-2' }, { row: 2, col: 2, name: 'col-content-2' },
                { row: 1, col: 3, name: 'col-header-3' }, { row: 2, col: 3, name: 'col-content-3' },
                { row: 1, col: 4, name: 'col-header-4' }, { row: 2, col: 4, name: 'col-content-4' },
            ],
        },
        'calendar-view': {
            rowSizes: ['auto', '1fr', '1fr', '1fr', '1fr', '1fr'],
            colSizes: ['1fr', '1fr', '1fr', '1fr', '1fr', '1fr', '1fr'],
            items: Array.from({ length: 42 }, (_, i) => ({
                row: Math.floor(i / 7) + 1,
                col: (i % 7) + 1,
                name: i < 7 ? `day-${i + 1}` : `date-${i - 6}`,
            })),
        },
        'newspaper-layout': {
            rowSizes: ['auto', '1fr', '1fr', '1fr'],
            colSizes: ['1fr', '1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 4, name: 'title' },
                { row: 2, col: 1, rowSpan: 2, colSpan: 1, name: 'col-1' },
                { row: 2, col: 2, rowSpan: 2, colSpan: 1, name: 'col-2' },
                { row: 2, col: 3, rowSpan: 1, colSpan: 2, name: 'main-article' },
                { row: 3, col: 3, rowSpan: 1, colSpan: 1, name: 'sub-article-1' },
                { row: 3, col: 4, rowSpan: 1, colSpan: 1, name: 'sub-article-2' },
                { row: 4, col: 1, rowSpan: 1, colSpan: 4, name: 'footer-ad' },
            ],
        },
        'alternating-sides': {
            rowSizes: ['1fr', '1fr', '1fr'],
            colSizes: ['1fr', '1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 2, name: 'content-1' },
                { row: 1, col: 3, rowSpan: 1, colSpan: 2, name: 'image-1' },
                { row: 2, col: 1, rowSpan: 1, colSpan: 2, name: 'image-2' },
                { row: 2, col: 3, rowSpan: 1, colSpan: 2, name: 'content-2' },
                { row: 3, col: 1, rowSpan: 1, colSpan: 2, name: 'content-3' },
                { row: 3, col: 3, rowSpan: 1, colSpan: 2, name: 'image-3' },
            ],
        },
        'stats-dashboard-2': {
            rowSizes: ['1fr', '1fr'],
            colSizes: ['1fr', '1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, name: 'stat-1' }, { row: 1, col: 2, name: 'stat-2' },
                { row: 1, col: 3, name: 'stat-3' }, { row: 1, col: 4, name: 'stat-4' },
                { row: 2, col: 1, rowSpan: 1, colSpan: 2, name: 'chart-1' },
                { row: 2, col: 3, rowSpan: 1, colSpan: 2, name: 'chart-2' },
            ],
        },
        'portfolio-asymmetric': {
            rowSizes: ['1fr', '1fr', '1fr'],
            colSizes: ['1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 2, colSpan: 1, name: 'item-1' },
                { row: 1, col: 2, rowSpan: 1, colSpan: 2, name: 'item-2' },
                { row: 2, col: 2, rowSpan: 2, colSpan: 1, name: 'item-3' },
                { row: 2, col: 3, rowSpan: 1, colSpan: 1, name: 'item-4' },
                { row: 3, col: 1, rowSpan: 1, colSpan: 1, name: 'item-5' },
                { row: 3, col: 3, rowSpan: 1, colSpan: 1, name: 'item-6' },
            ],
        },
        'wide-header-3-col': {
            rowSizes: ['auto', '1fr'],
            colSizes: ['1fr', '1fr', '1fr'],
            items: [
                { row: 1, col: 1, rowSpan: 1, colSpan: 3, name: 'wide-header' },
                { row: 2, col: 1, name: 'column-1' },
                { row: 2, col: 2, name: 'column-2' },
                { row: 2, col: 3, name: 'column-3' },
            ],
        },
        'image-and-text-block': {
            rowSizes: ['1fr'],
            colSizes: ['1fr', '1fr'],
            items: [
                { row: 1, col: 1, name: 'image' },
                { row: 1, col: 2, name: 'text-content' },
            ],
        },
        'triple-panel-vertical': {
            rowSizes: ['1fr', '1fr', '1fr'],
            colSizes: ['1fr'],
            items: [
                { row: 1, col: 1, name: 'panel-1' },
                { row: 2, col: 1, name: 'panel-2' },
                { row: 3, col: 1, name: 'panel-3' },
            ],
        },
        'quadrant-layout': {
            rowSizes: ['1fr', '1fr'],
            colSizes: ['1fr', '1fr'],
            items: [
                { row: 1, col: 1, name: 'top-left' },
                { row: 1, col: 2, name: 'top-right' },
                { row: 2, col: 1, name: 'bottom-left' },
                { row: 2, col: 2, name: 'bottom-right' },
            ],
        },
    };

    // --- Functions ---

    /**
     * Renders the input controls for rows or columns.
     * @param {'row' | 'col'} type - The type of track to render controls for.
     */
    const renderTrackControls = (type) => {
        const container = type === 'row' ? rowInputsContainer : colInputsContainer;
        const sizes = type === 'row' ? rowSizes : colSizes;
        container.innerHTML = ''; // Clear existing controls

        sizes.forEach((size, index) => {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'track-input-group';

            const input = document.createElement('input');
            input.type = 'text';
            input.value = size;
            input.dataset.index = index;
            input.dataset.type = type;
            input.className = 'track-input';

            const removeBtn = document.createElement('button');
            removeBtn.textContent = '✕';
            removeBtn.className = 'remove-track-btn';
            removeBtn.dataset.index = index;
            removeBtn.dataset.type = type;

            inputGroup.appendChild(input);
            inputGroup.appendChild(removeBtn);
            container.appendChild(inputGroup);
        });
    };

    /**
     * Populates the gridItems array based on current rows and columns.
     * All items are initially 1x1.
     */
    const initializeGridItems = () => {
        gridItems = [];
        nextItemId = 0;
        for (let r = 1; r <= rowSizes.length; r++) {
            for (let c = 1; c <= colSizes.length; c++) {
                gridItems.push({
                    id: nextItemId++,
                    row: r,
                    col: c,
                    rowSpan: 1,
                    colSpan: 1,
                    groupId: null,
                    name: null,
                });
            }
        }
    };

    /**
     * Renders the visual grid based on the gridItems state array.
     */
    const renderGrid = () => {
        gridPreview.innerHTML = '';
        gridPreview.style.gridTemplateRows = rowSizes.join(' ');
        gridPreview.style.gridTemplateColumns = colSizes.join(' ');
        gridPreview.style.gap = `1px`; // Creates thin grid lines from the wrapper's background

        gridItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'grid-item-preview';
            itemEl.textContent = item.name || item.id;
            itemEl.dataset.id = item.id;

            // Apply grid-row and grid-column styles
            itemEl.style.gridRow = `${item.row} / span ${item.rowSpan}`;
            itemEl.style.gridColumn = `${item.col} / span ${item.colSpan}`;

            if (selectedItemIds.has(item.id)) {
                itemEl.classList.add('selected');
            }

            if (item.groupId) {
                itemEl.classList.add('grouped');
            }

            gridPreview.appendChild(itemEl);
        });

        updateActionButtons();
        renderResizers(); // Render resizer handles after items
    };

    /**
     * Renders the resizer handles between rows and columns.
     */
    const renderResizers = () => {
        // Get computed positions to place resizers accurately
        const computedStyle = getComputedStyle(gridPreview);
        const colTemplates = computedStyle.gridTemplateColumns.split(' ');
        const rowTemplates = computedStyle.gridTemplateRows.split(' ');

        let accumulatedWidth = 0;
        for (let i = 0; i < colSizes.length - 1; i++) {
            accumulatedWidth += parseFloat(colTemplates[i]) + 1;
            const resizer = document.createElement('div');
            resizer.className = 'resizer resizer-col';
            resizer.dataset.type = 'col';
            resizer.dataset.index = i;
            resizer.style.left = `${accumulatedWidth}px`;
            resizer.style.top = '0';
            gridPreview.appendChild(resizer);
        }

        let accumulatedHeight = 0;
        for (let i = 0; i < rowSizes.length - 1; i++) {
            accumulatedHeight += parseFloat(rowTemplates[i]) + 1;
            const resizer = document.createElement('div');
            resizer.className = 'resizer resizer-row';
            resizer.dataset.type = 'row';
            resizer.dataset.index = i;
            resizer.style.top = `${accumulatedHeight}px`;
            resizer.style.left = '0';
            gridPreview.appendChild(resizer);
        }

        // Attach listeners to the new resizers
        document.querySelectorAll('.resizer').forEach(resizer => {
            resizer.addEventListener('mousedown', handleResizeMouseDown);
        });
    };

    /**
     * Generates the HTML and CSS code for the current grid configuration.
     */
    const generateCode = () => {
        // Generate HTML
        let htmlString = '<div class="grid-container">\n';
        gridItems.forEach(item => {
            const customClass = item.name ? ` ${item.name}` : '';
            htmlString += `  <div class="grid-item item-${item.id}${customClass}">${item.name || `Item ${item.id}`}</div>\n`;
        });
        htmlString += '</div>';

        // Generate CSS
        let cssString = `
.grid-container {
  display: grid;
  grid-template-columns: ${colSizes.join(' ')};
  grid-template-rows: ${rowSizes.join(' ')};
  /* gap is intentionally omitted for per-item control via padding */
}`;

        // Sort items to generate CSS in a clean order
        const sortedItems = [...gridItems].sort((a, b) => a.id - b.id);

        sortedItems.forEach(item => {
            const customClass = item.name ? `.${item.name}` : `.item-${item.id}`;
            const groupComment = item.groupId ? `/* Part of Group ${item.groupId} */\n` : '';

            // Generate explicit placement rule using grid-area
            const rowStart = item.row;
            const colStart = item.col;
            const rowEnd = item.row + item.rowSpan;
            const colEnd = item.col + item.colSpan;

            // We only need to specify the area for items that aren't in the default flow (1x1)
            // But for clarity and robustness, we'll specify it for all.
            cssString += `\n\n${groupComment}${customClass} {
  grid-area: ${rowStart} / ${colStart} / ${rowEnd} / ${colEnd};
}`;
        });

        cssString += `\n\n.grid-item {
  /* Add your item styles here */
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 20px; /* Default padding */
  text-align: center;
}`;

        // Display code and reveal the section
        htmlCode.textContent = htmlString;
        cssCode.textContent = cssString.trim();
        codeOutputSection.classList.remove('hidden');
    };

    /**
     * Copies text from a specified code block to the clipboard.
     * @param {MouseEvent} e - The click event object.
     */
    const copyCode = async (e) => {
        if (!e.target.classList.contains('copy-btn')) return;

        const targetId = e.target.dataset.target;
        const codeElement = document.getElementById(targetId);
        const textToCopy = codeElement.textContent;

        try {
            await navigator.clipboard.writeText(textToCopy);
            e.target.textContent = 'Copied!';
            setTimeout(() => {
                e.target.textContent = 'Copy';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            e.target.textContent = 'Error';
        }
    };

    const updateActionButtons = () => {
        const selected = gridItems.filter(item => selectedItemIds.has(item.id));
        const canMerge = selected.length > 1 && selected.every(item => item.rowSpan === 1 && item.colSpan === 1);
        const isSingleMergedItem = selected.length === 1 && (selected[0].rowSpan > 1 || selected[0].colSpan > 1);
        const isGroupSelected = selected.length > 0 && selected.every(item => item.groupId && item.groupId === selected[0].groupId);
        const canSplit = isSingleMergedItem || isGroupSelected;

        mergeBtn.disabled = !canMerge;
        splitBtn.disabled = !canSplit;
    };

    const mergeSelectedItems = () => {
        let selected1x1Items = gridItems.filter(item => selectedItemIds.has(item.id));
        if (selected1x1Items.length < 2) return;

        // Sort to ensure the tiling algorithm starts from the top-left-most cell.
        selected1x1Items.sort((a, b) => {
            if (a.row !== b.row) {
                return a.row - b.row;
            }
            return a.col - b.col;
        });

        saveState();

        const newItems = [];
        const currentGroupId = nextGroupId++;

        // Tiling algorithm: break non-rectangular shape into the fewest possible rectangles
        while (selected1x1Items.length > 0) {
            const startItem = selected1x1Items[0];
            let width = 1;
            while (selected1x1Items.some(item => item.row === startItem.row && item.col === startItem.col + width)) {
                width++;
            }

            let height = 1;
            let canExpandDown = true;
            while (canExpandDown) {
                for (let i = 0; i < width; i++) {
                    if (!selected1x1Items.some(item => item.row === startItem.row + height && item.col === startItem.col + i)) {
                        canExpandDown = false;
                        break;
                    }
                }
                if (canExpandDown) height++;
            }

            newItems.push({
                id: nextItemId++,
                row: startItem.row,
                col: startItem.col,
                rowSpan: height,
                colSpan: width,
                groupId: newItems.length > 0 || selected1x1Items.length > (width * height) ? currentGroupId : null, // Assign groupId only if it's a multi-part shape
                name: null,
            });

            // Remove the cells that are now part of the new rectangle
            const cellsInRect = new Set();
            for (let r = 0; r < height; r++) {
                for (let c = 0; c < width; c++) {
                    cellsInRect.add(`${startItem.row + r}-${startItem.col + c}`);
                }
            }
            selected1x1Items = selected1x1Items.filter(item => !cellsInRect.has(`${item.row}-${item.col}`));
        }

        // If the result is a single rectangle, it doesn't need a group ID.
        if (newItems.length === 1) {
            newItems[0].groupId = null;
        }

        gridItems = gridItems.filter(item => !selectedItemIds.has(item.id)); // Remove old 1x1s
        gridItems.push(...newItems); // Add new merged items

        selectedItemIds.clear();
        renderGrid();
    };

    const splitSelectedItem = () => {
        const itemsToSplit = gridItems.filter(item => selectedItemIds.has(item.id));
        if (itemsToSplit.length === 0) return;

        saveState();
        gridItems = gridItems.filter(item => !selectedItemIds.has(item.id));

        // Add back the individual 1x1 items
        itemsToSplit.forEach(itemToSplit => {
            for (let r = 0; r < itemToSplit.rowSpan; r++) {
                for (let c = 0; c < itemToSplit.colSpan; c++) {
                    gridItems.push({
                        id: nextItemId++,
                        row: itemToSplit.row + r,
                        col: itemToSplit.col + c,
                        rowSpan: 1,
                        colSpan: 1,
                        groupId: null,
                        name: null,
                    });
                }
            }
        });

        selectedItemIds.clear();
        renderGrid();
    };

    // --- History (Undo/Redo) Functions ---
    const saveState = () => {
        redoStack = []; // Clear redo stack on new action
        history.push(JSON.stringify({ rowSizes, colSizes, gridItems }));
        updateHistoryButtons();
    };

    const loadState = (stateString) => {
        const state = JSON.parse(stateString);
        rowSizes = state.rowSizes;
        colSizes = state.colSizes;
        gridItems = state.gridItems.map(item => ({ ...item, groupId: item.groupId === undefined ? null : item.groupId, name: item.name || null }));
        nextItemId = Math.max(...gridItems.map(i => i.id)) + 1;
        renderAll(false); // Don't save state again
    };

    const undo = () => {
        if (history.length <= 1) return; // Can't undo the initial state
        redoStack.push(history.pop());
        loadState(history[history.length - 1]);
        updateHistoryButtons();
    };

    const redo = () => {
        if (redoStack.length === 0) return;
        const stateToRestore = redoStack.pop();
        history.push(stateToRestore);
        loadState(stateToRestore);
        updateHistoryButtons();
    };

    const updateHistoryButtons = () => {
        undoBtn.disabled = history.length <= 1;
        redoBtn.disabled = redoStack.length === 0;
    };

    const updatePropertiesPanel = () => {
        const selected = gridItems.filter(item => selectedItemIds.has(item.id));
        // Show panel only for a single, non-grouped item selection for simplicity
        if (selected.length === 1) {
            propertiesPanel.classList.remove('hidden');
            itemNameInput.value = selected[0].name || '';
        } else {
            propertiesPanel.classList.add('hidden');
        }
    };
    // --- Drag to Select Functions ---
    const getCellIdFromEvent = (e) => {
        const cell = e.target.closest('.grid-item-preview');
        return cell ? parseInt(cell.dataset.id, 10) : null;
    };

    const handleMouseDown = (e) => {
        // Prevent selection if resizing or not a left click
        if (e.button !== 0 || isResizing) return;

        isDragging = true;
        selectionStarted = false; // This flag will be set on first mousemove
        mouseDownPos = { x: e.clientX, y: e.clientY };
        dragStartId = getCellIdFromEvent(e);

        // Preserve selection if Ctrl is held for drag-add functionality
        if (e.ctrlKey || e.metaKey) {
            selectionBeforeDrag = new Set(selectedItemIds);
        } else {
            selectionBeforeDrag.clear();
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        // Check if the mouse has moved enough to be considered a drag
        if (!selectionStarted) {
            const dx = Math.abs(e.clientX - mouseDownPos.x);
            const dy = Math.abs(e.clientY - mouseDownPos.y);
            if (dx > 5 || dy > 5) { // Drag threshold
                selectionStarted = true;
            } else {
                return; // Don't do anything until drag threshold is met
            }
        }

        const dragEndId = getCellIdFromEvent(e);
        if (dragEndId === null || dragStartId === null) return;

        const startItem = gridItems.find(i => i.id === dragStartId);
        const endItem = gridItems.find(i => i.id === dragEndId);
        if (!startItem || !endItem) return;

        const minRow = Math.min(startItem.row, endItem.row, startItem.row + startItem.rowSpan - 1, endItem.row + endItem.rowSpan - 1);
        const maxRow = Math.max(startItem.row, endItem.row, startItem.row + startItem.rowSpan - 1, endItem.row + endItem.rowSpan - 1);
        const minCol = Math.min(startItem.col, endItem.col, startItem.col + startItem.colSpan - 1, endItem.col + endItem.colSpan - 1);
        const maxCol = Math.max(startItem.col, endItem.col, startItem.col + startItem.colSpan - 1, endItem.col + endItem.colSpan - 1);

        const newSelection = new Set();
        gridItems.forEach(item => {
            // Only select 1x1 items during drag
            if (item.rowSpan === 1 && item.colSpan === 1 && item.row >= minRow && item.row <= maxRow && item.col >= minCol && item.col <= maxCol) {
                newSelection.add(item.id);
            }
        });

        // Combine with pre-drag selection if Ctrl is held, otherwise replace.
        if (e.ctrlKey || e.metaKey) {
            selectedItemIds = new Set([...selectionBeforeDrag, ...newSelection]);
        } else {
            selectedItemIds = newSelection;
        }
        renderGrid(); // Re-render to show the drag selection
    };

    const handleMouseUp = (event) => { // Pass the event object
        if (!isDragging) return;

        // This was a click, not a drag
        if (!selectionStarted && dragStartId !== null) {
            const clickedId = dragStartId;
            const clickedItem = gridItems.find(i => i.id === clickedId);
            if (!clickedItem) { return; } // Safety check
            const isCtrl = event.ctrlKey || event.metaKey;

            if (clickedItem.groupId) {
                const groupItems = gridItems.filter(i => i.groupId === clickedItem.groupId);
                const isGroupSelected = groupItems.every(i => selectedItemIds.has(i.id));
                if (!isCtrl) selectedItemIds.clear();
                groupItems.forEach(i => isGroupSelected ? selectedItemIds.delete(i.id) : selectedItemIds.add(i.id));
            } else {
                if (!isCtrl) {
                    const wasSelected = selectedItemIds.has(clickedId) && selectedItemIds.size === 1;
                    selectedItemIds.clear();
                    if (!wasSelected) selectedItemIds.add(clickedId);
                } else {
                    if (selectedItemIds.has(clickedId)) {
                        selectedItemIds.delete(clickedId);
                    } else {
                        selectedItemIds.add(clickedId);
                    }
                }
            }
            renderGrid();
        }

        isDragging = false;
        selectionStarted = false;
        dragStartId = null;
        updateActionButtons();
        updatePropertiesPanel();
    };

    // --- Template Loading ---
    const loadTemplate = (templateName) => {
        const template = templates[templateName];
        if (!template) return;

        if (!confirm('Loading a template will replace your current layout. Are you sure?')) {
            return;
        }

        rowSizes = template.rowSizes;
        colSizes = template.colSizes;

        let idCounter = 0;
        gridItems = template.items.map(item => ({
            ...item,
            id: idCounter++,
            groupId: null,
            name: item.name || null
        }));
        nextItemId = idCounter;

        // Reset history and render the new layout
        history = [];
        redoStack = [];
        renderAll();
    };

    // --- Layout Persistence ---
    const saveLayout = () => {
        const layoutState = {
            rowSizes,
            colSizes,
            gridItems
        };
        localStorage.setItem('gridGeneratorLayout', JSON.stringify(layoutState));
        loadLayoutBtn.disabled = false; // Enable load button after first save
        saveLayoutBtn.textContent = 'Saved!';
        setTimeout(() => {
            saveLayoutBtn.textContent = 'Save Layout';
        }, 2000);
    };

    const loadLayout = () => {
        const savedLayout = localStorage.getItem('gridGeneratorLayout');
        if (savedLayout) {
            // Use the robust loadState function which handles all properties
            loadState(savedLayout);
            // The loaded layout becomes the new base state in history
            history = [savedLayout];
            redoStack = [];
            updateHistoryButtons();
        } else {
            alert('No saved layout found!');
        }
    };

    // --- Resizing Functions ---
    const handleResizeMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();

        isResizing = true;
        const { type, index } = e.target.dataset;
        const resizerIndex = parseInt(index, 10);

        document.body.classList.add(type === 'col' ? 'resizing' : 'resizing-row');

        const computedStyle = getComputedStyle(gridPreview);
        if (type === 'col') {
            const colWidths = computedStyle.gridTemplateColumns.split(' ').map(parseFloat);
            resizeInfo = {
                type: 'col',
                index: resizerIndex,
                initialPos: e.clientX,
                initialSizes: [colWidths[resizerIndex], colWidths[resizerIndex + 1]],
            };
        } else {
            const rowHeights = computedStyle.gridTemplateRows.split(' ').map(parseFloat);
            resizeInfo = {
                type: 'row',
                index: resizerIndex,
                initialPos: e.clientY,
                initialSizes: [rowHeights[resizerIndex], rowHeights[resizerIndex + 1]],
            };
        }

        document.addEventListener('mousemove', handleResizeMouseMove);
        document.addEventListener('mouseup', handleResizeMouseUp);
    };

    const handleResizeMouseMove = (e) => {
        if (!isResizing) return;

        const { type, index, initialPos, initialSizes } = resizeInfo;
        const delta = type === 'col' ? e.clientX - initialPos : e.clientY - initialPos;

        const newSize1 = Math.max(20, initialSizes[0] + delta); // Minimum size 20px
        const newSize2 = Math.max(20, initialSizes[1] - delta);

        if (type === 'col') {
            const newColSizes = [...colSizes];
            newColSizes[index] = `${newSize1}px`;
            newColSizes[index + 1] = `${newSize2}px`;
            gridPreview.style.gridTemplateColumns = newColSizes.join(' ');
        } else {
            const newRowSizes = [...rowSizes];
            newRowSizes[index] = `${newSize1}px`;
            newRowSizes[index + 1] = `${newSize2}px`;
            gridPreview.style.gridTemplateRows = newRowSizes.join(' ');
        }
    };

    const handleResizeMouseUp = () => {
        if (!isResizing) return;
        isResizing = false;
        document.body.classList.remove('resizing', 'resizing-row');
        document.removeEventListener('mousemove', handleResizeMouseMove);
        document.removeEventListener('mouseup', handleResizeMouseUp);

        // Finalize the state change
        const computedStyle = getComputedStyle(gridPreview);
        if (resizeInfo.type === 'col') {
            colSizes = computedStyle.gridTemplateColumns.split(' ');
        } else {
            rowSizes = computedStyle.gridTemplateRows.split(' ');
        }

        saveState();
        renderTrackControls(resizeInfo.type);
    };

    // --- Event Listeners ---

    addRowBtn.addEventListener('click', () => {
        rowSizes.push('1fr'); // Add a new row with a default value
        initializeGridItems();
        renderAll();
    });

    addColBtn.addEventListener('click', () => {
        colSizes.push('1fr'); // Add a new column with a default value
        initializeGridItems();
        renderAll();
    });

    // Use event delegation for dynamically created inputs and buttons
    advancedControls.addEventListener('input', (e) => {
        if (e.target.classList.contains('track-input')) {
            const { type, index } = e.target.dataset;
            const value = e.target.value.trim();
            const targetArray = type === 'row' ? rowSizes : colSizes;
            targetArray[index] = value || '1fr';
            renderGrid(); // Live preview on input
        }
    });

    // Save state for track inputs only when the user is done editing
    advancedControls.addEventListener('change', (e) => {
        if (e.target.classList.contains('track-input')) {
            saveState();
        }
    });
    
    advancedControls.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-track-btn')) {
            const { type, index } = e.target.dataset;
            const targetArray = type === 'row' ? rowSizes : colSizes;
            // Prevent removing the last track
            if (targetArray.length > 1) {
                targetArray.splice(parseInt(index, 10), 1);
                initializeGridItems();
                renderAll();
            }
        }
    });

    templateSelect.addEventListener('change', () => {
        const templateName = templateSelect.value;
        if (templateName) {
            loadTemplate(templateName);
            templateSelect.value = ''; // Reset dropdown after selection
        }
    });

    itemNameInput.addEventListener('input', () => {
        const selected = gridItems.find(item => selectedItemIds.has(item.id));
        if (selected) {
            // Sanitize the name to be a valid CSS class name
            const sanitizedName = itemNameInput.value.trim().replace(/[^a-zA-Z0-9-_]/g, '-');
            selected.name = sanitizedName;
            // Update the preview text as well
            const itemEl = gridPreview.querySelector(`[data-id='${selected.id}']`);
            if (itemEl) {
                itemEl.textContent = selected.name || selected.id;
            }
        }
    });

    itemNameInput.addEventListener('change', () => {
        saveState();
    });

    getCodeBtn.addEventListener('click', generateCode);

    resetGridBtn.addEventListener('click', () => {
        rowSizes = ['1fr'];
        colSizes = ['1fr'];
        history = []; // Clear history
        selectedItemIds.clear();
        initializeGridItems();
        renderAll();
        codeOutputSection.classList.add('hidden');
    });

    saveLayoutBtn.addEventListener('click', saveLayout);
    loadLayoutBtn.addEventListener('click', loadLayout);
    codeOutputSection.addEventListener('click', copyCode);
    mergeBtn.addEventListener('click', mergeSelectedItems);
    splitBtn.addEventListener('click', splitSelectedItem);
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);

    // --- Responsive Preview Logic ---
    responsiveControls.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            // Remove active class from all buttons
            responsiveControls.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            e.target.classList.add('active');

            const newWidth = e.target.dataset.width;
            getEl('grid-preview-wrapper').style.width = newWidth;
        }
    });

    // Re-render resizers after transition
    getEl('grid-preview-wrapper').addEventListener('transitionend', () => {
        renderResizers();
    });

    // --- Theme Switcher Logic ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            themeToggle.checked = false;
        }
    };

    themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // Drag-to-select listeners
    gridPreview.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    /** Combines all render functions for a full update */
    const renderAll = (shouldSaveState = true) => {
        if (shouldSaveState) saveState();
        renderTrackControls('row');
        renderTrackControls('col');
        renderGrid();
        selectedItemIds.clear();
        updateActionButtons();
        updateHistoryButtons();
        updatePropertiesPanel();
    };

    // --- Initial Render ---
    // Load saved theme on startup
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

    // Check if a saved layout exists to enable/disable the load button
    const savedLayoutJSON = localStorage.getItem('gridGeneratorLayout');
    if (!savedLayoutJSON) {
        loadLayoutBtn.disabled = true;
    }

    initializeGridItems();
    renderAll();
});