// Blog View Counter System
class BlogViewCounter {
    constructor() {
        this.viewsFile = 'views.json';
        this.views = {};
        this.initialized = false;
    }

    async init() {
        try {
            // Load existing views
            const response = await fetch(this.viewsFile + '?' + Date.now());
            this.views = await response.json();
            this.initialized = true;
            
            // Initialize view counters on page
            this.updateViewCounters();
            
            // Track current page view
            this.trackCurrentPage();
            
        } catch (error) {
            console.error('Error loading view counts:', error);
        }
    }

    async incrementView(postId) {
        if (!postId) return;
        
        try {
            // Increment locally first
            this.views[postId] = (this.views[postId] || 0) + 1;
            
            // Update display immediately
            this.updateViewCounter(postId);
            
            // Send to GitHub API (simulated - for demo)
            this.saveToStorage(postId);
            
        } catch (error) {
            console.error('Error incrementing view:', error);
        }
    }

    updateViewCounters() {
        // Update all view counters on page
        Object.keys(this.views).forEach(postId => {
            this.updateViewCounter(postId);
        });
    }

    updateViewCounter(postId) {
        const viewElement = document.getElementById(`view-count-${postId}`);
        if (viewElement) {
            const count = this.views[postId] || 0;
            viewElement.textContent = `${count.toLocaleString()} views`;
            viewElement.title = `${count.toLocaleString()} total views`;
        }
    }

    trackCurrentPage() {
        // Get current post ID from URL
        const hash = window.location.hash;
        if (hash && hash.startsWith('#post-')) {
            const postId = hash.replace('#post-', '');
            
            // Check if we've already tracked this view in this session
            const viewedKey = `viewed-${postId}`;
            if (!sessionStorage.getItem(viewedKey)) {
                this.incrementView(postId);
                sessionStorage.setItem(viewedKey, 'true');
            }
        }
    }

    // Save to localStorage as fallback
    saveToStorage(postId) {
        try {
            // Save to localStorage
            localStorage.setItem('blog-views', JSON.stringify(this.views));
            
            // Try to sync with GitHub (in real app, you'd use GitHub API)
            this.syncWithGitHub();
            
        } catch (error) {
            console.error('Error saving view count:', error);
        }
    }

    syncWithGitHub() {
        // This would require GitHub API token
        // For now, we'll just use localStorage
        console.log('View counts updated locally. In production, sync with GitHub API.');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.blogViewCounter = new BlogViewCounter();
    window.blogViewCounter.init();
});
