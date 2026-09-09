const BASE_URL = location.hostname === 'localhost' ? 'http://localhost:8787' : 'https://smhs-union-official-api.sa-df9.workers.dev';

// Types
interface Post {
  id: string;
  content: string;
  
  createdAt: string;
  likeCount: number;
  commentCount: number;
  liked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
}

// State
let currentPage = 1;
let currentCategory = '';
let isLoading = false;
let hasMore = true;
let posts: Post[] = [];
let reportTarget: { type: 'post' | 'comment'; postId: string; commentId?: string } | null = null;

// DOM Elements
const postForm = document.getElementById('post-form') as HTMLFormElement;
const postContent = document.getElementById('post-content') as HTMLInputElement;
const charCounter = document.getElementById('char-counter') as HTMLSpanElement;
const submitPostBtn = document.getElementById('submit-post-btn') as HTMLButtonElement;

const postsContainer = document.getElementById('posts-container') as HTMLDivElement;
const loadingSpinner = document.getElementById('loading-spinner') as HTMLDivElement;
const toastContainer = document.getElementById('toast-container') as HTMLDivElement;

const reportModal = document.getElementById('report-modal') as HTMLDivElement;
const reportReason = document.getElementById('report-reason') as HTMLTextAreaElement;
const cancelReportBtn = document.getElementById('cancel-report-btn') as HTMLButtonElement;
const submitReportBtn = document.getElementById('submit-report-btn') as HTMLButtonElement;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadPosts();
});

// Event Listeners
function setupEventListeners() {
  // Post form
  postContent.addEventListener('input', () => {
    const length = postContent.value.length;
    charCounter.textContent = `${length} / 500`;
    if (length >= 480) {
      charCounter.style.color = '#ef4444';
    } else {
      charCounter.style.color = '#6b7280';
    }
  });

  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (postContent.value.trim().length === 0) return;
    
    submitPostBtn.disabled = true;
    submitPostBtn.textContent = '發布中...';
    
    try {
      await createPost(postContent.value.trim());
      postContent.value = '';
      postContent.dispatchEvent(new Event('input'));
      showToast('發布成功！', 'success');
      
      // Reload posts
      currentPage = 1;
      hasMore = true;
      posts = [];
      postsContainer.innerHTML = '';
      await loadPosts();
    } catch (err) {
      showToast('發布失敗，請稍後再試', 'error');
    } finally {
      submitPostBtn.disabled = false;
      submitPostBtn.textContent = '發布';
    }
  });

  // Category filters
  
  // Infinite scroll
  window.addEventListener('scroll', () => {
    if (isLoading || !hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      currentPage++;
      loadPosts();
    }
  });

  // Report Modal
  cancelReportBtn.addEventListener('click', closeReportModal);
  
  submitReportBtn.addEventListener('click', async () => {
    if (!reportTarget || reportReason.value.trim() === '') {
      showToast('請輸入檢舉原因', 'error');
      return;
    }
    
    submitReportBtn.disabled = true;
    submitReportBtn.textContent = '提交中...';
    
    try {
      await reportPost(reportTarget.postId, reportReason.value.trim(), reportTarget.commentId);
      showToast('檢舉已提交，感謝您的回報', 'success');
      closeReportModal();
    } catch (err) {
      showToast('提交失敗，請稍後再試', 'error');
    } finally {
      submitReportBtn.disabled = false;
      submitReportBtn.textContent = '提交檢舉';
    }
  });

  // Close modal when clicking outside
  reportModal.addEventListener('click', (e) => {
    if (e.target === reportModal) closeReportModal();
  });
}

// API Functions
async function fetchPosts(page: number): Promise<{ data: Post[], hasMore: boolean }> {
  const url = new URL(`${BASE_URL}/api/posts`);
  url.searchParams.append('page', page.toString());
  
  
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

async function createPost(content: string): Promise<Post> {
  const res = await fetch(`${BASE_URL}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  if (!res.ok) throw new Error('Failed to create post');
  return res.json();
}

async function fetchPostDetail(id: string): Promise<{ post: Post, comments: Comment[] }> {
  const res = await fetch(`${BASE_URL}/api/posts/${id}`);
  if (!res.ok) throw new Error('Failed to fetch post detail');
  return res.json();
}

async function likePostApi(id: string): Promise<{ likeCount: number }> {
  const res = await fetch(`${BASE_URL}/api/posts/${id}/like`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to like post');
  return res.json();
}

async function addComment(postId: string, content: string): Promise<Comment> {
  const res = await fetch(`${BASE_URL}/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  if (!res.ok) throw new Error('Failed to add comment');
  return res.json();
}

async function reportPost(postId: string, reason: string, commentId?: string): Promise<void> {
  const body: any = { reason };
  if (commentId) body.commentId = commentId;
  
  const res = await fetch(`${BASE_URL}/api/posts/${postId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Failed to report');
}

// UI Functions
async function loadPosts() {
  if (isLoading || !hasMore) return;
  
  isLoading = true;
  loadingSpinner.classList.remove('hidden');
  
  try {
    const result = await fetchPosts(currentPage, currentCategory);
    
    // Process local likes
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
    
    const newPosts = result.data.map(post => ({
      ...post,
      liked: likedPosts.includes(post.id)
    }));
    
    posts = [...posts, ...newPosts];
    hasMore = result.hasMore;
    
    renderNewPosts(newPosts);
  } catch (err) {
    showToast('無法載入貼文', 'error');
  } finally {
    isLoading = false;
    loadingSpinner.classList.add('hidden');
  }
}

function renderNewPosts(newPosts: Post[]) {
  newPosts.forEach(post => {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.dataset.id = post.id;
    
    card.innerHTML = `
      <div class="post-header">
        
        <span class="post-time">${formatRelativeTime(post.createdAt)}</span>
        <button class="icon-btn report-btn" title="檢舉此貼文" aria-label="檢舉此貼文">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
        </button>
      </div>
      <div class="post-content">${escapeHtml(post.content).replace(/\n/g, '<br>')}</div>
      <div class="post-footer">
        <button class="action-btn like-btn ${post.liked ? 'liked' : ''}">
          <svg class="heart-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${post.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          <span class="like-count">${post.likeCount}</span>
        </button>
        <button class="action-btn comment-toggle-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          <span class="comment-count">${post.commentCount}</span>
        </button>
      </div>
      <div class="comments-section hidden">
        <div class="comments-list"></div>
        <div class="comment-input-area">
          <input type="text" class="comment-input" placeholder="留個言吧..." maxlength="200">
          <button class="send-comment-btn btn-primary btn-small">發送</button>
        </div>
      </div>
    `;
    
    // Attach event listeners for this card
    const likeBtn = card.querySelector('.like-btn') as HTMLButtonElement;
    likeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleLike(post.id, likeBtn);
    });
    
    const reportBtn = card.querySelector('.report-btn') as HTMLButtonElement;
    reportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openReportModal('post', post.id);
    });
    
    const commentToggleBtn = card.querySelector('.comment-toggle-btn') as HTMLButtonElement;
    const commentsSection = card.querySelector('.comments-section') as HTMLDivElement;
    
    // Expanding post for comments
    const toggleComments = async () => {
      const isHidden = commentsSection.classList.contains('hidden');
      if (isHidden) {
        commentsSection.classList.remove('hidden');
        if (commentsSection.dataset.loaded !== 'true') {
          await loadComments(post.id, card);
        }
      } else {
        commentsSection.classList.add('hidden');
      }
    };
    
    commentToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleComments();
    });
    
    card.addEventListener('click', (e) => {
      // Don't toggle if clicking on interactive elements inside the card
      const target = e.target as HTMLElement;
      if (target.closest('.post-header') || target.closest('.post-footer') || target.closest('.comments-section')) {
        return;
      }
      toggleComments();
    });
    
    const sendCommentBtn = card.querySelector('.send-comment-btn') as HTMLButtonElement;
    const commentInput = card.querySelector('.comment-input') as HTMLInputElement;
    
    sendCommentBtn.addEventListener('click', () => handleAddComment(post.id, card));
    commentInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleAddComment(post.id, card);
    });
    
    postsContainer.appendChild(card);
  });
}

async function handleLike(postId: string, btnElement: HTMLButtonElement) {
  const isLiked = btnElement.classList.contains('liked');
  if (isLiked) return; // Prevent unliking for simplicity, or handle toggle if API supports it
  
  const icon = btnElement.querySelector('.heart-icon') as SVGElement;
  const countSpan = btnElement.querySelector('.like-count') as HTMLSpanElement;
  
  // Optimistic UI update
  btnElement.classList.add('liked');
  icon.setAttribute('fill', 'currentColor');
  let currentCount = parseInt(countSpan.textContent || '0');
  countSpan.textContent = (currentCount + 1).toString();
  
  // Save to local storage
  const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
  if (!likedPosts.includes(postId)) {
    likedPosts.push(postId);
    localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
  }
  
  try {
    const res = await likePostApi(postId);
    countSpan.textContent = res.likeCount.toString();
  } catch (err) {
    // Revert optimistic update
    btnElement.classList.remove('liked');
    icon.setAttribute('fill', 'none');
    countSpan.textContent = currentCount.toString();
    showToast('按讚失敗', 'error');
    
    const updatedLikedPosts = likedPosts.filter((id: string) => id !== postId);
    localStorage.setItem('likedPosts', JSON.stringify(updatedLikedPosts));
  }
}

async function loadComments(postId: string, cardElement: HTMLElement) {
  const commentsList = cardElement.querySelector('.comments-list') as HTMLDivElement;
  const commentsSection = cardElement.querySelector('.comments-section') as HTMLDivElement;
  
  commentsList.innerHTML = '<div class="loading-text">載入留言中...</div>';
  
  try {
    const data = await fetchPostDetail(postId);
    renderComments(data.comments, commentsList, postId);
    commentsSection.dataset.loaded = 'true';
    
    // Update comment count
    const countSpan = cardElement.querySelector('.comment-count') as HTMLSpanElement;
    countSpan.textContent = data.comments.length.toString();
  } catch (err) {
    commentsList.innerHTML = '<div class="error-text">無法載入留言</div>';
  }
}

function renderComments(comments: Comment[], container: HTMLDivElement, postId: string) {
  if (comments.length === 0) {
    container.innerHTML = '<div class="empty-text">還沒有人留言，來當第一個吧！</div>';
    return;
  }
  
  container.innerHTML = '';
  comments.forEach(comment => {
    const commentEl = document.createElement('div');
    commentEl.className = 'comment-item';
    commentEl.innerHTML = `
      <div class="comment-content">${escapeHtml(comment.content)}</div>
      <div class="comment-meta">
        <span class="comment-time">${formatRelativeTime(comment.createdAt)}</span>
        <button class="comment-report-btn" title="檢舉留言">檢舉</button>
      </div>
    `;
    
    const reportBtn = commentEl.querySelector('.comment-report-btn') as HTMLButtonElement;
    reportBtn.addEventListener('click', () => {
      openReportModal('comment', postId, comment.id);
    });
    
    container.appendChild(commentEl);
  });
}

async function handleAddComment(postId: string, cardElement: HTMLElement) {
  const input = cardElement.querySelector('.comment-input') as HTMLInputElement;
  const content = input.value.trim();
  const sendBtn = cardElement.querySelector('.send-comment-btn') as HTMLButtonElement;
  
  if (!content) return;
  
  sendBtn.disabled = true;
  input.disabled = true;
  
  try {
    await addComment(postId, content);
    input.value = '';
    showToast('留言成功！', 'success');
    
    // Reload comments
    await loadComments(postId, cardElement);
  } catch (err) {
    showToast('留言失敗，請稍後再試', 'error');
  } finally {
    sendBtn.disabled = false;
    input.disabled = false;
    input.focus();
  }
}

// Modal handling
function openReportModal(type: 'post' | 'comment', postId: string, commentId?: string) {
  reportTarget = { type, postId, commentId };
  reportReason.value = '';
  reportModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeReportModal() {
  reportModal.classList.add('hidden');
  reportTarget = null;
  reportReason.value = '';
  document.body.style.overflow = '';
}

// Utilities
function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}


function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return '剛剛';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}分鐘前`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}小時前`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}天前`;
  
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function updateGreeting() {
  const greetingEl = document.getElementById("dynamic-greeting");
  if (!greetingEl) return;
  const hour = new Date().getHours();
  if (hour < 12) greetingEl.textContent = "早安，今天過得好嗎？";
  else if (hour < 18) greetingEl.textContent = "午安，吃飽了嗎？";
  else greetingEl.textContent = "晚安，今天辛苦了！";
}
updateGreeting();
