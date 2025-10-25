// [분리] index.html에서 분리된 JavaScript
// (type="module"로 로드됩니다)

// --- 전역 상태 변수 ---
let allPosts = [];
let allGalleries = [];
let selectedGallery = null;
let searchTerm = "";
let selectedPost = null;
let currentUser = null; // { logged_in, user_id, username, ... } 저장
let likedPostIds = new Set(); // [추가] 사용자가 좋아요 누른 post ID 목록

// --- DOM 요소 ---
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const $logo = $("#logo");
const $searchInput = $("#search-input");
const $openNewPostModalBtn = $("#open-new-post-modal-btn");

const $galleryNav = $("#gallery-nav");
const $mainContentTitle = $("#main-content-title");
const $postListContainer = $("#post-list-container");
const $loadingPlaceholder = $("#loading-placeholder");

// [추가] 인증 버튼 컨테이너
const $authButtonsContainer = $("#auth-buttons-container");

// 상세 모달
const $postDetailModal = $("#post-detail-modal");
const $closeDetailModalBtn = $("#close-detail-modal-btn");
const $postDetailHeader = $("#post-detail-header");
const $postDetailContent = $("#post-detail-content");
const $postDetailMeta = $("#post-detail-meta");
const $postDetailActions = $("#post-detail-actions");

// 새 글 모달
const $newPostModal = $("#new-post-modal");
const $newPostForm = $("#new-post-form");
const $closeNewPostModalBtn = $("#close-new-post-modal-btn");
const $newPostGallerySelect = $("#new-post-gallery");

// [추가] 로그인 모달
const $loginModal = $("#login-modal");
const $loginForm = $("#login-form");
const $closeLoginModalBtn = $("#close-login-modal-btn");
const $toggleToRegister = $("#toggle-to-register");

// [추가] 회원가입 모달
const $registerModal = $("#register-modal");
const $registerForm = $("#register-form");
const $closeRegisterModalBtn = $("#close-register-modal-btn");
const $toggleToLogin = $("#toggle-to-login");

// 커스텀 알림
const $customAlertModal = $("#custom-alert-modal");
const $customAlertMessage = $("#custom-alert-message");
const $customAlertCloseBtn = $("#custom-alert-close-btn");

// --- 유틸리티 함수 ---

/**
 * Lucide 아이콘을 안전하게 렌더링 (오류 방지)
 */
function createIconsSafe() {
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        try {
            lucide.createIcons();
        } catch (error) {
            console.error('Error creating lucide icons:', error);
        }
    } else {
        console.error('Lucide icons library (lucide.createIcons) is not loaded or ready.');
    }
}

/**
 * 커스텀 알림 표시 (alert() 대용)
 * @param {string} message - 표시할 메시지
 */
function customAlert(message) {
    $customAlertMessage.textContent = message;
    $customAlertModal.classList.remove("hidden");
}

/**
 * [추가] 커스텀 확인 (confirm() 대용)
 * @param {string} message - 확인할 메시지
 * @returns {Promise<boolean>} - 사용자가 '확인'을 누르면 true
 */
function customConfirm(message) {
    // (간단한 구현) 실제 confirm()을 사용. 
    // 만약 alert 모달을 재사용하려면 콜백이나 Promise 기반으로 리팩토링 필요
    return confirm(message);
}

/**
 * 타임스탬프를 "방금 전", "N분 전" 등으로 변환
 * @param {number} timestamp - 밀리초 단위 타임스탬프
 */
function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return '방금 전';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
    return `${Math.floor(seconds / 86400)}일 전`;
}

/**
 * ID로 갤러리 정보 찾기
 * @param {string} galleryId - 갤러리 ID
 */
function getGalleryById(galleryId) {
    return allGalleries.find(g => g.id === galleryId) || { name: '알 수 없음', icon: 'HelpCircle' };
}

// --- 렌더링 함수 ---

/**
 * [추가] 헤더의 인증 버튼 렌더링
 */
function renderAuthButtons() {
    let html = '';
    if (currentUser) {
        html = `
            <span class="text-sm text-gray-400 hidden md:block"><strong>${currentUser.username}</strong>님</span>
            <button id="logout-btn" class="text-gray-400 hover:text-pink-400 font-bold px-3 py-2 rounded-lg hover:bg-gray-800 transition">로그아웃</button>
        `;
    } else {
        html = `
            <button id="open-login-modal-btn" class="text-white hover:text-pink-400 font-bold px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                로그인 / 회원가입
            </button>
        `;
    }
    $authButtonsContainer.innerHTML = html;
    
    // 새로 생성된 버튼에 이벤트 리스너 추가
    if (currentUser) {
        $('#logout-btn').addEventListener('click', handleLogout);
    } else {
        $('#open-login-modal-btn').addEventListener('click', openLoginModal);
    }
}

/**
 * 갤러리 사이드바 렌더링
 */
function renderSidebar() {
    let html = `
        <button
            data-gallery-id="null"
            class="w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 font-bold ${
                selectedGallery === null 
                    ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-600/30' 
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-pink-400'
            }"
        >
            <i data-lucide="layout-grid" class="w-5 h-5"></i>
            전체 보기
        </button>
    `;

    allGalleries.forEach(gallery => {
        html += `
            <button
                data-gallery-id="${gallery.id}"
                class="w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 font-bold ${
                    selectedGallery === gallery.id 
                        ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-600/30' 
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-pink-400'
                }"
            >
                <i data-lucide="${gallery.icon || 'HelpCircle'}" class="w-5 h-5"></i>
                ${gallery.name}
            </button>
        `;
    });

    $galleryNav.innerHTML = html;
    createIconsSafe(); // 아이콘 렌더링
}

/**
 * '새 글 작성' 모달의 갤러리 드롭다운 채우기
 */
function populateNewPostGalleryOptions() {
     let optionsHtml = '<option value="">갤러리를 선택하세요</option>';
     allGalleries.forEach(gallery => {
        optionsHtml += `<option value="${gallery.id}">${gallery.name}</option>`;
     });
     $newPostGallerySelect.innerHTML = optionsHtml;
}

/**
 * 게시글 목록 렌더링
 */
function renderPostList() {
    // 1. 필터링
    const filteredPosts = allPosts.filter(post => {
        const matchesGallery = !selectedGallery || post.gallery === selectedGallery;
        const matchesSearch = !searchTerm || 
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesGallery && matchesSearch;
    });

    // 2. 제목 업데이트
    $mainContentTitle.textContent = selectedGallery 
        ? getGalleryById(selectedGallery).name 
        : '전체 팟 모집';

    // 3. 목록 생성
    $postListContainer.innerHTML = ''; // 기존 목록 초기화
    if (filteredPosts.length === 0) {
        $postListContainer.innerHTML = `
            <div class="p-12 text-center text-gray-500">
                게시글이 없습니다.
            </div>
        `;
        return;
    }

    filteredPosts.forEach(post => {
        const gallery = getGalleryById(post.gallery);
        
        // [수정] 현재 사용자가 좋아요 눌렀는지 확인
        const isLiked = likedPostIds.has(post.id);
        
        const postElement = document.createElement('div');
        postElement.className = "p-5 hover:bg-gray-800/50 transition cursor-pointer";
        postElement.dataset.postId = post.id; // 클릭 이벤트를 위해 ID 저장
        
        // [수정] post.author -> post.author_username
        // [수정] '좋아요' 아이콘/텍스트 스타일 변경
        postElement.innerHTML = `
            <div class="flex items-start gap-4">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2 flex-wrap">
                        <span class="text-xs px-3 py-1 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-full font-bold shadow-md">
                            ${gallery.name}
                        </span>
                        ${post.isCompleted ? `
                            <span class="text-xs px-3 py-1 bg-gray-700 text-gray-300 rounded-full font-bold flex items-center gap-1">
                                <i data-lucide="check-circle" class="w-3 h-3"></i>
                                모집완료
                            </span>
                        ` : `
                            <span class="text-xs px-3 py-1 bg-pink-900/50 text-pink-400 rounded-full font-bold border border-pink-600/30">
                                모집중 (${post.currentMembers}/${post.totalMembers})
                            </span>
                        `}
                        <span class="text-xs text-gray-500">${post.author_username}</span>
                    </div>
                    <h3 class="font-bold text-lg mb-2 text-white hover:text-pink-400 transition">${post.title}</h3>
                    <p class="text-sm text-gray-400 mb-3 line-clamp-2">${post.content}</p>
                    <div class="flex items-center gap-5 text-xs text-gray-500">
                        <span class="flex items-center gap-1">
                            <i data-lucide="clock" class="w-4 h-4"></i>
                            ${formatTimeAgo(post.timestamp)}
                        </span>
                        <span class="flex items-center gap-1">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                            ${post.views}
                        </span>
                        <span class="flex items-center gap-1 ${isLiked ? 'text-pink-500 font-bold' : 'text-pink-400'}">
                            <i data-lucide="thumbs-up" class="w-4 h-4 ${isLiked ? 'fill-current' : ''}"></i>
                            ${post.likes}
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        // 클릭 시 상세 모달 열기 이벤트 추가
        postElement.addEventListener('click', () => handleOpenPost(post.id));
        
        $postListContainer.appendChild(postElement);
    });

    createIconsSafe(); // 아이콘 렌더링
}

/**
 * 게시글 상세 모달 채우기
 */
function renderPostDetailModal() {
    if (!selectedPost) return;

    const post = selectedPost;
    const gallery = getGalleryById(post.gallery);
    
    // [수정] selectedPost에는 'liked_by_user' (true/false)가 포함되어 있음
    const isLiked = selectedPost.liked_by_user;

    // 1. 헤더
    // [수정] post.author -> post.author_username
    $postDetailHeader.innerHTML = `
        <div class="flex items-center gap-3 mb-3 flex-wrap">
            <span class="text-sm px-4 py-1.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-full font-bold shadow-lg">
                ${gallery.name}
            </span>
            ${post.isCompleted ? `
                <span class="text-sm px-4 py-1.5 bg-gray-700 text-gray-300 rounded-full font-bold flex items-center gap-2">
                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                    모집완료
                </span>
            ` : `
                <span class="text-sm px-4 py-1.5 bg-pink-900/50 text-pink-400 rounded-full font-bold border-2 border-pink-600/50">
                    모집중 (${post.currentMembers}/${post.totalMembers})
                </span>
            `}
        </div>
        <h2 class="text-3xl font-black mb-3 text-white">${post.title}</h2>
        <div class="flex items-center gap-4 text-sm text-gray-400">
            <span>${post.author_username}</span>
            <span>•</span>
            <span>${formatTimeAgo(post.timestamp)}</span>
        </div>
    `;

    // 2. 본문
    $postDetailContent.textContent = post.content;

    // 3. 메타 (조회수, 좋아요) - [수정] '좋아요' 버튼 스타일
    $postDetailMeta.innerHTML = `
        <span class="flex items-center gap-2">
            <i data-lucide="eye" class="w-5 h-5"></i>
            조회 ${post.views}
        </span>
        <button id="detail-like-btn" data-post-id="${post.id}" 
            class="flex items-center gap-2 ${isLiked ? 'text-pink-500 font-bold' : 'text-gray-400 hover:text-pink-400'} transition">
            <i data-lucide="thumbs-up" class="w-5 h-5 ${isLiked ? 'fill-current' : ''}"></i>
            좋아요 ${post.likes}
        </button>
    `;
    
    // 4. 액션 버튼 (참가, 문의) - [수정]
    $postDetailActions.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <button
                id="detail-join-btn"
                data-post-id="${post.id}"
                ${post.isCompleted ? 'disabled' : ''}
                class="py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition shadow-lg ${
                    post.isCompleted
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-600 to-pink-500 text-white hover:from-pink-500 hover:to-pink-600 shadow-pink-600/30'
                }"
            >
                <i data-lucide="user-plus" class="w-6 h-6"></i>
                ${post.isCompleted ? '모집 완료됨' : '참가하기'}
            </button>
            <button
                id="detail-inquiry-btn"
                class="bg-gray-800 text-white py-4 rounded-xl hover:bg-gray-700 transition font-black text-lg flex items-center justify-center gap-3 border-2 border-gray-700"
            >
                <i data-lucide="message-circle" class="w-6 h-6"></i>
                문의하기
            </button>
        </div>
    `;
    
    // [추가] 5. 작성자 전용 버튼 (삭제)
    if (currentUser && currentUser.user_id === post.user_id) {
        $postDetailActions.innerHTML += `
            <button
                id="detail-delete-btn"
                data-post-id="${post.id}"
                class="mt-4 bg-red-800 text-white py-4 rounded-xl hover:bg-red-700 transition font-black text-lg flex items-center justify-center gap-3 border-2 border-red-700"
            >
                <i data-lucide="trash-2" class="w-6 h-6"></i>
                이 팟 삭제하기
            </button>
        `;
    }


    // [수정] 6. 아이콘 렌더링
    createIconsSafe();
    
    // [수정] 7. 새로 생성된 버튼에 이벤트 리스너 추가
    $("#detail-like-btn").addEventListener('click', (e) => handleLike(e.currentTarget.dataset.postId));
    $("#detail-join-btn").addEventListener('click', (e) => handleJoin(e.currentTarget.dataset.postId));
    $("#detail-inquiry-btn").addEventListener('click', handleInquiry);
    
    // [추가] 삭제 버튼 리스너
    const deleteBtn = $("#detail-delete-btn");
    if (deleteBtn) {
         deleteBtn.addEventListener('click', (e) => handleDeletePost(e.currentTarget.dataset.postId));
    }
}

// --- API 호출 함수 ---

/**
 * [수정] (GET) 로그인 상태 확인 (user_id 포함)
 */
async function fetchStatus() {
    try {
        const response = await fetch('/api/status'); //
        if (!response.ok) throw new Error('Status check failed');
        const data = await response.json();
        currentUser = data.logged_in ? data : null;
    } catch (error) {
        console.error(error);
        currentUser = null;
    }
    renderAuthButtons(); // 상태 확인 후 헤더 버튼 렌더링
}

/**
 * (GET) 갤러리 목록 불러오기
 */
async function fetchGalleries() {
    try {
        const response = await fetch('/api/galleries'); //
        if (!response.ok) throw new Error('갤러리 로딩 실패');
        allGalleries = await response.json();
        renderSidebar();
        populateNewPostGalleryOptions();
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

/**
 * [수정] (GET) 게시글 목록 불러오기
 */
async function fetchPosts() {
    try {
        const response = await fetch('/api/posts'); //
        if (!response.ok) throw new Error('게시글 로딩 실패');
        
        // [수정] API 응답 구조 변경
        const data = await response.json();
        allPosts = data.posts;
        likedPostIds = new Set(data.liked_by_user); // 좋아요 목록 Set 업데이트
        
        renderPostList();
    } catch (error) { 
        console.error(error);
        $postListContainer.innerHTML = `<div class="p-12 text-center text-red-500">게시글을 불러오는 데 실패했습니다.</div>`;
    } 
}

/**
 * (POST) 게시글 열기 (조회수 증가)
 * @param {number} postId - 게시글 ID
 */
async function handleOpenPost(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/view`, { method: 'POST' }); //
        if (!response.ok) throw new Error('게시글을 불러올 수 없습니다.');
        
        // [수정] selectedPost는 이제 'liked_by_user' (true/false)를 포함
        selectedPost = await response.json();
        
        // 로컬 allPosts 목록은 'views'만 업데이트 (like는 handleLike에서)
        const index = allPosts.findIndex(p => p.id === selectedPost.id);
        if (index !== -1) {
            allPosts[index].views = selectedPost.views;
        }
        
        renderPostDetailModal();
        renderPostList(); // 목록의 조회수도 업데이트
        $postDetailModal.classList.remove('hidden');
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

/**
 * [수정] (POST) 좋아요 (토글)
 * @param {number} postId - 게시글 ID
 */
async function handleLike(postId) {
    // [추가] 로그인 확인
    if (!currentUser) {
        customAlert("로그인이 필요한 기능입니다.");
        openLoginModal();
        return;
    }

    try {
        const response = await fetch(`/api/posts/${postId}/like`, { method: 'POST' }); //
        
        if (response.status === 401) { // 401: Unauthorized (app.py의 @login_required)
            customAlert("로그인이 필요합니다.");
            openLoginModal();
            return;
        }
        if (!response.ok) throw new Error('좋아요 처리에 실패했습니다.');
        
        // [수정] 백엔드가 'liked_by_user'가 포함된 최신 post 정보를 반환
        const updatedPost = await response.json();

        // 1. 상세 모달이 열려있으면 업데이트
        if (selectedPost && selectedPost.id == postId) {
            selectedPost = updatedPost;
            renderPostDetailModal();
        }
        
        // 2. 로컬 allPosts 목록의 'likes' 카운트 업데이트
        const index = allPosts.findIndex(p => p.id == postId);
        if (index !== -1) {
            allPosts[index].likes = updatedPost.likes;
        }
        
        // 3. 전역 'likedPostIds' Set 업데이트
        if (updatedPost.liked_by_user) {
            likedPostIds.add(updatedPost.id); // (타입 일관성을 위해 updatedPost.id 사용)
        } else {
            likedPostIds.delete(updatedPost.id);
        }
        
        // 4. 목록 렌더링 (아이콘 스타일 업데이트)
        renderPostList(); 
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

/**
 * (POST) 팟 참가
 * @param {number} postId - 게시글 ID
 */
async function handleJoin(postId) {
    // [추가] 로그인 확인
    if (!currentUser) {
        customAlert("로그인이 필요한 기능입니다.");
        openLoginModal();
        return;
    }

    try {
        const response = await fetch(`/api/posts/${postId}/join`, { method: 'POST' }); //
        const data = await response.json();

        if (response.status === 401) { // 401: Unauthorized
            customAlert("로그인이 필요합니다.");
            openLoginModal();
            return;
        }
        if (!response.ok) {
            throw new Error(data.error || '참가 처리에 실패했습니다.');
        }

        const updatedPost = data;
        
        // 상세 모달이 열려있으면 업데이트
        if (selectedPost && selectedPost.id == postId) {
            selectedPost = updatedPost;
            renderPostDetailModal();
        }

        // 로컬 allPosts 목록도 업데이트
        const index = allPosts.findIndex(p => p.id == postId);
        if (index !== -1) {
            allPosts[index] = updatedPost;
        }
        
        renderPostList(); // 목록의 인원/상태 업데이트
        customAlert('참가 신청이 완료되었습니다!');

    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

/**
 * 문의하기 (알림)
 */
function handleInquiry() {
    customAlert('문의하기 기능은 준비 중입니다. 작성자에게 연락해주세요!');
}

/**
 * (POST) 새 글 작성
 * @param {Event} event - 폼 제출 이벤트
 */
async function handleCreatePost(event) {
    event.preventDefault();

    // [추가] 로그인 확인
    if (!currentUser) {
        customAlert("로그인이 필요한 기능입니다.");
        openLoginModal();
        return;
    }
    
    const formData = new FormData($newPostForm);
    const data = Object.fromEntries(formData.entries());
    
    // [수정] 인원수 유효성 검사
    const current = parseInt(data.currentMembers);
    const total = parseInt(data.totalMembers);

    if (isNaN(current) || isNaN(total)) {
        customAlert("인원수는 숫자만 입력해주세요.");
        return;
    }
    if (current < 1) { // (HTML min="1"로 방어되지만 이중 체크)
        customAlert("현재 인원은 1명(본인) 이상이어야 합니다.");
        return;
    }
    if (total <= current) { // [수정] (현원 < 목표)
        customAlert("목표 인원은 현재 인원보다 많아야 합니다.");
        return;
    }

    try {
        const response = await fetch('/api/posts', { //
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.status === 401) { // 401: Unauthorized
            customAlert("로그인이 필요합니다.");
            openLoginModal();
            return;
        }
         if (response.status === 403) { // 403: Forbidden (이메일 미인증)
            const errorData = await response.json();
            customAlert(errorData.error || '이메일 인증이 필요합니다.');
            return;
        }
        if (!response.ok) {
            const errorData = await response.json();
            // [수정] 백엔드에서 오는 오류 메시지 사용
            throw new Error(errorData.description || errorData.error || '게시글 등록에 실패했습니다.');
        }

        closeNewPostModal();
        customAlert('게시글이 등록되었습니다!');
        fetchPosts(); // 새 목록 불러오기

    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

/**
 * [추가] (POST) 로그인
 */
async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData($loginForm);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch('/login', { //
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || '로그인 실패');
        }

        // 로그인 성공
        // [수정] fetchStatus()를 다시 호출하여 user_id까지 확실하게 받아옴
        await fetchStatus(); 
        
        closeLoginModal();
        $loginForm.reset();
        customAlert(`환영합니다, ${currentUser.username}님!`);
        
        // [수정] 로그인 시 '좋아요' 목록을 다시 불러와야 함
        await fetchPosts();

    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

/**
 * [추가] (POST) 회원가입
 */
async function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData($registerForm);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch('/register', { //
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || '회원가입 실패');
        }

        // 회원가입 성공
        customAlert(result.message); // "회원가입 성공! 이메일을..."
        closeRegisterModal();
        openLoginModal(); // 로그인 창으로 전환
        $registerForm.reset();

    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

/**
 * [추가] (POST) 로그아웃
 */
async function handleLogout() {
    try {
        const response = await fetch('/logout', { method: 'POST' }); //
        if (!response.ok) throw new Error('로그아웃 실패');
        
        currentUser = null;
        likedPostIds.clear(); // [추가] 로그아웃 시 좋아요 목록 초기화
        renderAuthButtons();
        customAlert("로그아웃 되었습니다.");
        
        // [추가] 로그아웃 시 목록을 새로고침 (좋아요 스타일 제거)
        renderPostList(); 
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

/**
 * [추가] (DELETE) 게시글 삭제
 * @param {number} postId - 게시글 ID
 */
async function handleDeletePost(postId) {
    if (!currentUser) {
        customAlert("로그인이 필요합니다.");
        return;
    }
    
    if (!customConfirm("정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
        return;
    }

    try {
        const response = await fetch(`/api/posts/${postId}`, { 
            method: 'DELETE' 
        });

        const data = await response.json();

        if (!response.ok) {
             // 401(미로그인), 403(권한없음), 404(못찾음) 등
            throw new Error(data.description || data.error || "삭제에 실패했습니다.");
        }
        
        customAlert(data.message); // "게시글이 삭제되었습니다."
        
        closeDetailModal(); // 모달 닫기
        
        // 로컬 allPosts 목록에서 제거
        allPosts = allPosts.filter(p => p.id != postId);
        renderPostList(); // 목록 새로고침

    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}


// --- 모달 제어 ---
function closeDetailModal() {
    $postDetailModal.classList.add('hidden');
    selectedPost = null;
}

function openNewPostModal() {
    // [수정] 팟 모집하기 버튼 클릭 시 로그인 확인
    if (!currentUser) {
        customAlert("로그인이 필요한 기능입니다.");
        openLoginModal();
        return;
    }
    
    // [수정] 폼 인원수 초기화 (1 / 2)
    $newPostForm.reset(); // 폼 전체 초기화
    $("#new-post-current").value = 1;
    $("#new-post-total").value = 2;
    
    $newPostModal.classList.remove('hidden');
}

function closeNewPostModal() {
    $newPostModal.classList.add('hidden');
    $newPostForm.reset(); // 폼 초기화
}

// [추가] 로그인/회원가입 모달 제어
function openLoginModal() {
    $loginModal.classList.remove('hidden');
}
function closeLoginModal() {
    $loginModal.classList.add('hidden');
    $loginForm.reset();
}
function openRegisterModal() {
    $registerModal.classList.remove('hidden');
}
function closeRegisterModal() {
    $registerModal.classList.add('hidden');
    $registerForm.reset();
}


// --- 이벤트 리스너 ---
document.addEventListener('DOMContentLoaded', () => {
    // [수정] 초기 데이터 로드 시 로그인 상태 먼저 확인
    fetchStatus().then(() => {
        // 상태 확인 후 갤러리와 포스트 로드
        fetchGalleries();
        fetchPosts(); // fetchPosts는 이제 '좋아요' 목록도 가져옴
    });

    // 로고 클릭 (홈)
    $logo.addEventListener('click', () => {
        selectedGallery = null;
        renderSidebar();
        renderPostList();
    });

    // 검색창
    $searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        renderPostList();
    });

    // 사이드바 갤러리 클릭
    $galleryNav.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button) {
            const galleryId = button.dataset.galleryId;
            selectedGallery = galleryId === 'null' ? null : galleryId;
            renderSidebar();
            renderPostList();
        }
    });

    // '팟 모집하기' 버튼
    $openNewPostModalBtn.addEventListener('click', openNewPostModal);

    // '새 글' 모달 닫기
    $closeNewPostModalBtn.addEventListener('click', closeNewPostModal);

    // '새 글' 폼 제출
    $newPostForm.addEventListener('submit', handleCreatePost);

    // '상세' 모달 닫기
    $closeDetailModalBtn.addEventListener('click', closeDetailModal);

    // [추가] 로그인/회원가입 모달 이벤트
    $closeLoginModalBtn.addEventListener('click', closeLoginModal);
    $closeRegisterModalBtn.addEventListener('click', closeRegisterModal);

    $loginForm.addEventListener('submit', handleLogin);
    $registerForm.addEventListener('submit', handleRegister);

    // 모달 전환 버튼
    $toggleToRegister.addEventListener('click', () => {
        closeLoginModal();
        openRegisterModal();
    });
    $toggleToLogin.addEventListener('click', () => {
        closeRegisterModal();
        openLoginModal();
    });

    // 모달 바깥 영역 클릭 시 닫기
    $postDetailModal.addEventListener('click', (e) => {
        if (e.target === $postDetailModal) closeDetailModal();
    });
    $newPostModal.addEventListener('click', (e) => {
        if (e.target === $newPostModal) closeNewPostModal();
    });
    // [추가]
    $loginModal.addEventListener('click', (e) => {
        if (e.target === $loginModal) closeLoginModal();
    });
    $registerModal.addEventListener('click', (e) => {
        if (e.target === $registerModal) closeRegisterModal();
    });
    
    // 커스텀 알림 닫기
    $customAlertCloseBtn.addEventListener('click', () => {
        $customAlertModal.classList.add('hidden');
    });

    // Lucide 아이콘 첫 렌더링
    createIconsSafe();
});
