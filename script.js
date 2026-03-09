// AudioNEWS - App Logic
// =====================

// Configuration
const CONFIG = {
    API_KEY: 'demo', // Replace with your NewsAPI key
    NEWS_API_URL: 'https://newsapi.org/v2',
    REFRESH_INTERVAL: 900000, // 15 minutes
    STORIES_PER_PAGE: 10,
};

// Categories
const CATEGORIES = [
    { id: 'world', name: 'World News', emoji: '🌍', description: 'Global headlines and international events' },
    { id: 'politics', name: 'Politics', emoji: '🏛️', description: 'Elections, policy, and government' },
    { id: 'business', name: 'Business & Finance', emoji: '💼', description: 'Markets, economy, and corporate news' },
    { id: 'tech', name: 'Tech & AI', emoji: '🤖', description: 'Startups, breakthroughs, and the future of work' },
    { id: 'entertainment', name: 'Entertainment', emoji: '🎬', description: 'Movies, music, and celebrity news' },
    { id: 'sports', name: 'Sports', emoji: '⚽', description: 'Games, athletes, and competitions' },
    { id: 'science', name: 'Science', emoji: '🔬', description: 'Research, discoveries, and innovation' },
    { id: 'health', name: 'Health', emoji: '⚕️', description: 'Medicine, wellness, and healthcare' },
    { id: 'climate', name: 'Climate & Environment', emoji: '🌱', description: 'Environmental news and sustainability' },
    { id: 'conflict', name: 'Conflict & Crisis', emoji: '⚠️', description: 'Breaking conflicts and emergencies' },
];

// Sources
const SOURCES = [
    { id: 'bbc-news', name: 'BBC' },
    { id: 'cnn', name: 'CNN' },
    { id: 'reuters', name: 'Reuters' },
    { id: 'al-jazeera-english', name: 'Al Jazeera' },
    { id: 'fox-news', name: 'Fox News' },
    { id: 'associated-press', name: 'AP News' },
    { id: 'the-guardian-uk', name: 'The Guardian' },
];

// Voice options
const VOICES = {
    nova: 'nova',
    onyx: 'onyx',
    echo: 'echo',
    shimmer: 'shimmer'
};

// App State
let appState = {
    selectedCategories: [],
    savedStories: [],
    stories: [],
    currentStoryIndex: 0,
    isPlaying: false,
    playbackRate: 1,
    currentVoice: 'nova',
    loopEnabled: false,
    speedMode: false,
    currentPage: 'player',
    listenerStreak: 0,
    enableBreakingNews: true,
    enabledSources: SOURCES.map(s => s.id),
    searchQuery: '',
    browseDisplayedCount: 0,
};

// Initialize app
function initApp() {
    loadState();
    
    if (!appState.selectedCategories || appState.selectedCategories.length === 0) {
        showOnboarding();
    } else {
        showApp();
        loadStories();
        initEventListeners();
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('audioNewsState', JSON.stringify({
        selectedCategories: appState.selectedCategories,
        savedStories: appState.savedStories,
        listenerStreak: appState.listenerStreak,
        currentVoice: appState.currentVoice,
        playbackRate: appState.playbackRate,
        enableBreakingNews: appState.enableBreakingNews,
        enabledSources: appState.enabledSources,
    }));
}

// Load state from localStorage
function loadState() {
    const saved = localStorage.getItem('audioNewsState');
    if (saved) {
        const loaded = JSON.parse(saved);
        appState.selectedCategories = loaded.selectedCategories || [];
        appState.savedStories = loaded.savedStories || [];
        appState.listenerStreak = loaded.listenerStreak || 0;
        appState.currentVoice = loaded.currentVoice || 'nova';
        appState.playbackRate = loaded.playbackRate || 1;
        appState.enableBreakingNews = loaded.enableBreakingNews !== false;
        appState.enabledSources = loaded.enabledSources || SOURCES.map(s => s.id);
    }
}

// Show onboarding
function showOnboarding() {
    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('onboardingScreen').style.display = 'flex';
    renderCategorySelection();
}

// Render category selection
function renderCategorySelection() {
    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = '';
    
    CATEGORIES.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'category-card';
        if (appState.selectedCategories.includes(cat.id)) {
            card.classList.add('selected');
        }
        
        card.innerHTML = `
            <div class="category-emoji">${cat.emoji}</div>
            <div class="category-name">${cat.name}</div>
            <div class="category-description">${cat.description}</div>
        `;
        
        card.onclick = () => toggleCategory(cat.id, card);
        grid.appendChild(card);
    });
}

// Toggle category selection
function toggleCategory(categoryId, cardElement) {
    if (appState.selectedCategories.includes(categoryId)) {
        appState.selectedCategories = appState.selectedCategories.filter(c => c !== categoryId);
        cardElement.classList.remove('selected');
    } else {
        appState.selectedCategories.push(categoryId);
        cardElement.classList.add('selected');
    }
    
    // Update button state
    const btn = document.getElementById('buildBroadcastBtn');
    btn.disabled = appState.selectedCategories.length === 0;
}

// Complete onboarding
function completedOnboarding() {
    saveState();
    showApp();
    loadStories();
    initEventListeners();
}

// Start app
function startApp() {
    document.getElementById('splashScreen').style.display = 'none';
    showOnboarding();
}

// Show app
function showApp() {
    document.getElementById('onboardingScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
    updateStreakBadge();
    renderSettingsPage();
}

// Switch page
function switchPage(pageName) {
    appState.currentPage = pageName;
    
    // Hide all pages
    document.getElementById('playerPage').style.display = 'none';
    document.getElementById('browsePage').style.display = 'none';
    document.getElementById('savedPage').style.display = 'none';
    document.getElementById('settingsPage').style.display = 'none';
    
    // Show selected page
    document.getElementById(pageName + 'Page').style.display = pageName === 'player' ? 'flex' : 'block';
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    
    // Load page-specific content
    if (pageName === 'browse') {
        renderBrowsePage();
    } else if (pageName === 'saved') {
        renderSavedPage();
    }
}

// Load stories from mock API
async function loadStories() {
    try {
        // Mock stories with real-like data
        const mockStories = generateMockStories();
        appState.stories = mockStories;
        renderCurrentStory();
        updateQueueDisplay();
        
        // Simulate API refresh every 15 minutes
        setTimeout(() => loadStories(), CONFIG.REFRESH_INTERVAL);
    } catch (error) {
        console.error('Error loading stories:', error);
    }
}

// Generate mock stories with realistic data
function generateMockStories() {
    const headlines = [
        { title: 'Global Markets Rally on Positive Economic Data', source: 'Reuters', category: 'business', time: '2h ago', summary: 'Stock markets worldwide surged today as economic indicators exceeded expectations. The rally was driven by strong employment figures and consumer confidence reports from major economies. Analysts predict sustained momentum if inflation continues to moderate.' },
        { title: 'AI Breakthroughs Transform Healthcare Industry', source: 'BBC', category: 'tech', time: '3h ago', summary: 'Recent artificial intelligence developments are revolutionizing medical diagnostics and treatment planning. Major hospitals report faster disease detection and improved patient outcomes. Researchers believe these advancements could save millions of lives annually across the globe.' },
        { title: 'Global Climate Summit Reaches Historic Agreement', source: 'Al Jazeera', category: 'climate', time: '4h ago', summary: 'Nations worldwide have committed to unprecedented emission reduction targets in a landmark climate accord. The agreement includes funding mechanisms for developing countries and strict accountability measures. Environmental groups call it the strongest climate action taken to date.' },
        { title: 'Tech Giant Announces Revolutionary New Product Line', source: 'CNN', category: 'tech', time: '1h ago', summary: 'A major technology company unveiled a breakthrough product that industry experts say could redefine the market. Early reviews praise its innovation and potential impact on consumer behavior. Pre-orders have already exceeded expectations by significant margins.' },
        { title: 'International Space Agency Discovers Potentially Habitable Exoplanet', source: 'Reuters', category: 'science', time: '5h ago', summary: 'Astronomers have identified a newly discovered world that may contain conditions suitable for life. The planet orbits within the habitable zone of its star system at a distance similar to Earth. This discovery represents a significant milestone in the search for extraterrestrial life.' },
        { title: 'World Leaders Meet to Address Global Security Challenges', source: 'BBC', category: 'politics', time: '6h ago', summary: 'International diplomatic summit brings together heads of state to discuss pressing global issues. Key agenda items include regional conflicts, trade agreements, and cooperation frameworks. Officials express optimism about potential breakthrough agreements on multiple fronts.' },
        { title: 'Championship Team Secures Historic Victory', source: 'Fox News', category: 'sports', time: '30m ago', summary: 'In an thrilling match, the defending champions claimed another title with an extraordinary performance. The team demonstrated exceptional skill and determination throughout the competition. Fans celebrate what many consider one of the greatest achievements in sports history.' },
        { title: 'New Medical Treatment Shows Promise for Common Disease', source: 'Reuters', category: 'health', time: '7h ago', summary: 'Clinical trials reveal that a newly developed treatment significantly improves outcomes for millions of patients worldwide. The therapy works through an innovative mechanism that previous approaches had not explored. Regulatory approval is expected within the coming months.' },
        { title: 'Major Entertainment Studio Releases Blockbuster Film', source: 'CNN', category: 'entertainment', time: '8h ago', summary: 'A highly anticipated movie has shattered box office records in its opening weekend. Critics praise the innovative storytelling and cutting-edge visual effects. Industry analysts predict it will become one of the highest-grossing films of all time.' },
        { title: 'Economic Growth Exceeds Projections in Major Region', source: 'Al Jazeera', category: 'business', time: '9h ago', summary: 'Regional economic data shows expansion well beyond analyst forecasts this quarter. Manufacturing output, consumer spending, and investment all contributed to strong growth. Policymakers remain cautiously optimistic about sustained economic momentum.' },
    ];

    return headlines.map((h, idx) => ({
        id: idx,
        title: h.title,
        source: h.source,
        category: h.category,
        timestamp: h.time,
        summary: h.summary,
        isBreaking: idx === 0,
        url: '#'
    }));
}

// Render current story
function renderCurrentStory() {
    if (appState.stories.length === 0) return;
    
    const story = appState.stories[appState.currentStoryIndex];
    const category = CATEGORIES.find(c => c.id === story.category);
    
    document.getElementById('headline').textContent = story.title;
    document.getElementById('sourceName').textContent = story.source;
    document.getElementById('categoryBadge').textContent = (category?.emoji || '📰') + ' ' + (category?.name || 'News');
    document.getElementById('summaryText').innerHTML = story.summary.split('. ').map(s => 
        `<div class="summary-sentence">${s}.</div>`
    ).join('');
    document.getElementById('storyTime').textContent = story.timestamp;
    document.getElementById('storyIndex').textContent = appState.currentStoryIndex + 1;
    document.getElementById('storyTotal').textContent = appState.stories.length;
    
    // Generate audio for story
    generateAudioForStory(story);
}

// Generate audio for story using Web Speech API
function generateAudioForStory(story) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const text = `${story.title}. ${story.summary}`;
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map voice selection to system voices
    const voices = window.speechSynthesis.getVoices();
    const voiceMap = {
        nova: 1,
        onyx: 2,
        echo: 0,
        shimmer: 3
    };
    
    if (voices.length > 0) {
        const voiceIndex = Math.min(voiceMap[appState.currentVoice] || 0, voices.length - 1);
        utterance.voice = voices[voiceIndex];
    }
    
    utterance.rate = appState.playbackRate;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Update UI when speech ends
    utterance.onend = () => {
        if (appState.loopEnabled) {
            generateAudioForStory(story);
            window.speechSynthesis.speak(utterance);
        } else {
            setTimeout(() => nextStory(), 1500);
        }
    };
    
    // Store current utterance for control
    window.currentUtterance = utterance;
}

// Initialize event listeners
function initEventListeners() {
    // Ensure voices are loaded
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
    
    // Update progress bar
    setInterval(updateProgressBar, 100);
    
    // Update settings
    document.getElementById('defaultVoiceSelect').value = appState.currentVoice;
    document.getElementById('defaultSpeedSelect').value = appState.playbackRate;
    document.getElementById('breakingNewsToggle').classList.toggle('on', appState.enableBreakingNews);
    
    renderBrowseFilters();
    renderSourceSettings();
}

// Toggle play/pause
function togglePlayPause() {
    const btn = document.getElementById('playBtn');
    
    if (appState.isPlaying) {
        window.speechSynthesis.pause();
        appState.isPlaying = false;
        btn.textContent = '▶';
        btn.classList.remove('playing');
    } else {
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        } else if (window.currentUtterance) {
            window.speechSynthesis.speak(window.currentUtterance);
        } else {
            const story = appState.stories[appState.currentStoryIndex];
            generateAudioForStory(story);
            window.speechSynthesis.speak(window.currentUtterance);
        }
        appState.isPlaying = true;
        btn.textContent = '⏸';
        btn.classList.add('playing');
        updateStreakCounter();
    }
}

// Next story
function nextStory() {
    if (appState.currentStoryIndex < appState.stories.length - 1) {
        appState.currentStoryIndex++;
        renderCurrentStory();
        if (appState.isPlaying) {
            generateAudioForStory(appState.stories[appState.currentStoryIndex]);
            window.speechSynthesis.speak(window.currentUtterance);
        }
        updateQueueDisplay();
    }
}

// Previous story
function previousStory() {
    if (appState.currentStoryIndex > 0) {
        appState.currentStoryIndex--;
        renderCurrentStory();
        if (appState.isPlaying) {
            generateAudioForStory(appState.stories[appState.currentStoryIndex]);
            window.speechSynthesis.speak(window.currentUtterance);
        }
        updateQueueDisplay();
    }
}

// Replay 10 seconds
function replayStory() {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    const story = appState.stories[appState.currentStoryIndex];
    generateAudioForStory(story);
    if (appState.isPlaying) {
        window.speechSynthesis.speak(window.currentUtterance);
    }
}

// Skip 10 seconds
function skipStory() {
    nextStory();
}

// Change voice
function changeVoice() {
    const voice = document.getElementById('voiceSelect').value;
    appState.currentVoice = voice;
    saveState();
}

// Set playback speed
function setSpeed(speed) {
    appState.playbackRate = speed;
    
    // Update buttons
    document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Regenerate audio with new speed
    if (window.currentUtterance) {
        window.currentUtterance.rate = speed;
    }
    
    saveState();
}

// Toggle loop
function toggleLoop() {
    appState.loopEnabled = !appState.loopEnabled;
    document.getElementById('loopBtn').classList.toggle('active', appState.loopEnabled);
}

// Toggle speed mode
function toggleSpeedMode() {
    appState.speedMode = !appState.speedMode;
    document.getElementById('speedModeBtn').classList.toggle('active', appState.speedMode);
    
    if (appState.speedMode) {
        setSpeed(1.5);
    }
}

// Save current story
function saveCurrentStory() {
    const story = appState.stories[appState.currentStoryIndex];
    const isAlreadySaved = appState.savedStories.some(s => s.id === story.id);
    
    if (!isAlreadySaved) {
        appState.savedStories.push(story);
        saveState();
        document.getElementById('saveBtn').classList.add('active');
    } else {
        appState.savedStories = appState.savedStories.filter(s => s.id !== story.id);
        saveState();
        document.getElementById('saveBtn').classList.remove('active');
    }
}

// Render browse page
function renderBrowsePage() {
    appState.browseDisplayedCount = CONFIG.STORIES_PER_PAGE;
    renderStoryFeed();
}

// Render story feed
function renderStoryFeed() {
    const feed = document.getElementById('storyFeed');
    const filteredStories = getFilteredStories();
    
    const displayStories = filteredStories.slice(0, appState.browseDisplayedCount);
    
    feed.innerHTML = displayStories.map(story => {
        const category = CATEGORIES.find(c => c.id === story.category);
        const isSaved = appState.savedStories.some(s => s.id === story.id);
        
        return `
            <div class="story-card ${story.isBreaking ? 'breaking' : ''}">
                ${story.isBreaking ? '<div class="breaking-label">BREAKING</div>' : ''}
                <div class="story-header">
                    <div class="story-source">
                        <span>${story.source}</span>
                        <span class="story-time">${story.timestamp}</span>
                    </div>
                </div>
                <div class="story-headline">${story.title}</div>
                <div class="story-teaser">${story.summary.split('. ')[0]}.</div>
                <div class="story-footer">
                    <div class="story-meta-left">
                        <span class="category-badge">${category?.emoji} ${category?.name}</span>
                        <span class="listen-time">~${Math.ceil(story.summary.length / 130)}s read</span>
                        <div class="credibility-indicator">✓ Verified</div>
                    </div>
                    <div class="story-actions">
                        <button class="action-btn" onclick="playStoryFromBrowse(${story.id})">▶</button>
                        <button class="action-btn ${isSaved ? 'saved' : ''}" onclick="toggleSaveStory(${story.id})">💾</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Show load more button if needed
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (filteredStories.length > appState.browseDisplayedCount) {
        loadMoreBtn.style.display = 'block';
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

// Get filtered stories
function getFilteredStories() {
    return appState.stories.filter(story => {
        const matchesCategory = appState.selectedCategories.includes(story.category);
        const matchesSearch = story.title.toLowerCase().includes(appState.searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });
}

// Filter stories in browse
function filterStories() {
    appState.searchQuery = document.getElementById('searchInput').value;
    appState.browseDisplayedCount = CONFIG.STORIES_PER_PAGE;
    renderStoryFeed();
}

// Load more stories
function loadMoreStories() {
    appState.browseDisplayedCount += CONFIG.STORIES_PER_PAGE;
    renderStoryFeed();
}

// Play story from browse
function playStoryFromBrowse(storyId) {
    appState.currentStoryIndex = appState.stories.findIndex(s => s.id === storyId);
    renderCurrentStory();
    generateAudioForStory(appState.stories[appState.currentStoryIndex]);
    window.speechSynthesis.speak(window.currentUtterance);
    appState.isPlaying = true;
    document.getElementById('playBtn').textContent = '⏸';
    document.getElementById('playBtn').classList.add('playing');
    switchPage('player');
}

// Toggle save story
function toggleSaveStory(storyId) {
    const story = appState.stories.find(s => s.id === storyId);
    if (!story) return;
    
    const isAlreadySaved = appState.savedStories.some(s => s.id === storyId);
    
    if (!isAlreadySaved) {
        appState.savedStories.push(story);
    } else {
        appState.savedStories = appState.savedStories.filter(s => s.id !== storyId);
    }
    
    saveState();
    renderStoryFeed();
}

// Render saved page
function renderSavedPage() {
    const feed = document.getElementById('savedFeed');
    
    if (appState.savedStories.length === 0) {
        feed.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">
                    <p>Nothing saved yet.</p>
                    <p>Tap 💾 on any story to save it here.</p>
                </div>
            </div>
        `;
        document.getElementById('clearBtn').style.display = 'none';
    } else {
        feed.innerHTML = appState.savedStories.map(story => {
            const category = CATEGORIES.find(c => c.id === story.category);
            
            return `
                <div class="story-card">
                    <div class="story-header">
                        <div class="story-source">
                            <span>${story.source}</span>
                            <span class="story-time">${story.timestamp}</span>
                        </div>
                    </div>
                    <div class="story-headline">${story.title}</div>
                    <div class="story-teaser">${story.summary.split('. ')[0]}.</div>
                    <div class="story-footer">
                        <div class="story-meta-left">
                            <span class="category-badge">${category?.emoji} ${category?.name}</span>
                            <span class="listen-time">~${Math.ceil(story.summary.length / 130)}s read</span>
                            <div class="credibility-indicator">✓ Verified</div>
                        </div>
                        <div class="story-actions">
                            <button class="action-btn" onclick="playStoryFromBrowse(${story.id})">▶</button>
                            <button class="action-btn saved" onclick="toggleSaveStory(${story.id})">💾</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        document.getElementById('clearBtn').style.display = 'block';
    }
}

// Clear all saved
function clearAllSaved() {
    if (confirm('Are you sure? This cannot be undone.')) {
        appState.savedStories = [];
        saveState();
        renderSavedPage();
    }
}

// Render browse filters
function renderBrowseFilters() {
    const filter = document.getElementById('categoryFilter');
    filter.innerHTML = '<span class="filter-tag active" onclick="filterByCategory(null)">All</span>' +
        appState.selectedCategories.map(catId => {
            const cat = CATEGORIES.find(c => c.id === catId);
            return `<span class="filter-tag" onclick="filterByCategory('${catId}')">${cat?.emoji} ${cat?.name}</span>`;
        }).join('');
}

// Filter by category
function filterByCategory(catId) {
    // This is a simple implementation; you could expand it
    renderBrowseFilters();
}

// Render settings page
function renderSettingsPage() {
    // Render category toggles
    const categoryGrid = document.getElementById('settingsCategoryGrid');
    categoryGrid.innerHTML = '';
    
    CATEGORIES.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'category-card';
        if (appState.selectedCategories.includes(cat.id)) {
            card.classList.add('selected');
        }
        
        card.innerHTML = `
            <div class="category-emoji">${cat.emoji}</div>
            <div class="category-name">${cat.name}</div>
        `;
        
        card.onclick = () => toggleCategoryInSettings(cat.id, card);
        categoryGrid.appendChild(card);
    });
}

// Toggle category in settings
function toggleCategoryInSettings(catId, card) {
    if (appState.selectedCategories.includes(catId)) {
        if (appState.selectedCategories.length > 1) {
            appState.selectedCategories = appState.selectedCategories.filter(c => c !== catId);
            card.classList.remove('selected');
        }
    } else {
        appState.selectedCategories.push(catId);
        card.classList.add('selected');
    }
    saveState();
    loadStories();
}

// Render source settings
function renderSourceSettings() {
    const grid = document.getElementById('sourceGrid');
    grid.innerHTML = SOURCES.map(source => {
        const isEnabled = appState.enabledSources.includes(source.id);
        return `
            <label class="source-checkbox ${isEnabled ? 'checked' : ''}">
                <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleSource('${source.id}')">
                ${source.name}
            </label>
        `;
    }).join('');
}

// Toggle source
function toggleSource(sourceId) {
    if (appState.enabledSources.includes(sourceId)) {
        appState.enabledSources = appState.enabledSources.filter(s => s !== sourceId);
    } else {
        appState.enabledSources.push(sourceId);
    }
    saveState();
}

// Save default voice
function saveDefaultVoice() {
    appState.currentVoice = document.getElementById('defaultVoiceSelect').value;
    document.getElementById('voiceSelect').value = appState.currentVoice;
    saveState();
}

// Save default speed
function saveDefaultSpeed() {
    appState.playbackRate = parseFloat(document.getElementById('defaultSpeedSelect').value);
    saveState();
}

// Toggle breaking news
function toggleBreakingNews() {
    appState.enableBreakingNews = !appState.enableBreakingNews;
    document.getElementById('breakingNewsToggle').classList.toggle('on', appState.enableBreakingNews);
    saveState();
}

// Toggle dark mode
function toggleDarkMode() {
    // Dark mode is default; could expand this
}

// Update queue display
function updateQueueDisplay() {
    const queueScroll = document.getElementById('queueScroll');
    const upcomingStories = appState.stories.slice(appState.currentStoryIndex, appState.currentStoryIndex + 5);
    
    queueScroll.innerHTML = upcomingStories.map((story, idx) => `
        <div class="queue-item ${idx === 0 ? 'current' : ''}" onclick="jumpToStory(${appState.currentStoryIndex + idx})">
            <div class="queue-source">${story.source}</div>
            <div class="queue-headline">${story.title.substring(0, 40)}...</div>
            <div class="queue-duration">~${Math.ceil(story.summary.length / 130)}s</div>
        </div>
    `).join('');
}

// Jump to story in queue
function jumpToStory(index) {
    appState.currentStoryIndex = index;
    renderCurrentStory();
    if (appState.isPlaying) {
        generateAudioForStory(appState.stories[appState.currentStoryIndex]);
        window.speechSynthesis.speak(window.currentUtterance);
    }
    updateQueueDisplay();
}

// Update progress bar
function updateProgressBar() {
    if (window.speechSynthesis.speaking) {
        const progressFill = document.getElementById('progressFill');
        progressFill.style.width = '100%';
    } else {
        document.getElementById('progressFill').style.width = '0%';
    }
}

// Seek audio
function seekAudio(event) {
    // Simple implementation; Web Speech API doesn't support seeking
    event.stopPropagation();
}

// Update streak counter
function updateStreakCounter() {
    const lastListened = localStorage.getItem('lastListened');
    const today = new Date().toDateString();
    
    if (lastListened !== today) {
        const lastDate = lastListened ? new Date(lastListened) : new Date();
        const daysSinceLastListen = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastListen === 1) {
            appState.listenerStreak++;
        } else if (daysSinceLastListen > 1) {
            appState.listenerStreak = 1;
        }
        
        localStorage.setItem('lastListened', today);
        saveState();
        updateStreakBadge();
    }
}

// Update streak badge
function updateStreakBadge() {
    if (appState.listenerStreak > 0) {
        document.getElementById('streakBadge').style.display = 'flex';
        document.getElementById('streakCount').textContent = appState.listenerStreak;
    }
}

// Play breaking story
function playBreakingStory() {
    const breakingStory = appState.stories.find(s => s.isBreaking);
    if (breakingStory) {
        playStoryFromBrowse(breakingStory.id);
    }
}

// Close upgrade modal
function closeUpgradeModal() {
    document.getElementById('upgradeModal').style.display = 'none';
}

// Start trial
function startTrial() {
    alert('7-day free trial started! Enjoy unlimited access.');
    closeUpgradeModal();
}

// Initialize on page load
window.addEventListener('load', () => {
    initApp();
});

// Handle browser pausing
window.addEventListener('beforeunload', () => {
    saveState();
});