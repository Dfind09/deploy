// --- 전역 상태 변수 ---
let allPosts = []; // '팟' 목록
let allCommunityPosts = []; // [✨ 추가] '커뮤니티' 목록
let allGalleries = [];
let selectedGallery = null; // 'all' (null), 'sports', 'game', 'community' 등
let searchTerm = "";
let selectedPost = null; // 현재 선택된 '팟'
let selectedCommunityPostId = null; // [✨ 추가] 현재 선택된 '커뮤니티' 게시글 ID
let currentUser = null;
let likedPostIds = new Set();

// 채팅 관련 상태
let allChatrooms = [];
let selectedChatroom = null;
let socket = null;
let isFirstPostLoad = true;


// --- DOM 요소 ---
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const $logo = $("#logo");
const $searchInput = $("#search-input");
const $openNewContentModalBtn = $("#open-new-content-modal-btn"); // [✨ 수정] ID 변경
const $newContentBtnText = $("#new-content-btn-text"); // [✨ 추가] 새 글쓰기 버튼 텍스트

const $galleryNav = $("#gallery-nav");
const $mainContentTitle = $("#main-content-title");
const $postListContainer = $("#post-list-container");
const $loadingPlaceholder = $("#loading-placeholder");

const $authButtonsContainer = $("#auth-buttons-container");

// '팟' 상세 모달
const $postDetailModal = $("#post-detail-modal");
const $closeDetailModalBtn = $("#close-detail-modal-btn");
const $postDetailHeader = $("#post-detail-header");
const $postDetailContent = $("#post-detail-content");
const $postDetailMeta = $("#post-detail-meta");
const $postDetailActions = $("#post-detail-actions");

// '새 팟 모집' 모달
const $newPostModal = $("#new-post-modal");
const $newPostForm = $("#new-post-form");
const $closeNewPostModalBtn = $("#close-new-post-modal-btn");
const $newPostGallerySelect = $("#new-post-gallery");

// [✨ 추가] '커뮤니티 새 글' 모달
const $newCommunityModal = $("#new-community-modal");
const $communityForm = $("#community-form");
const $closeNewCommunityModalBtn = $("#close-new-community-modal");

// [✨ 추가] '커뮤니티 상세' 모달
const $communityDetailModal = $("#community-detail-modal");
const $closeCommunityDetailModalBtn = $("#close-community-detail-modal");
const $communityDetailTitle = $("#community-detail-title");
const $communityDetailAuthor = $("#community-detail-author");
const $communityDetailTimestamp = $("#community-detail-timestamp");
const $communityDetailViews = $("#community-detail-views");
const $communityDetailImage = $("#community-detail-image");
const $communityDetailContent = $("#community-detail-content");
const $communityDetailCommentList = $("#community-detail-comment-list");
const $commentForm = $("#comment-form");
const $commentContent = $("#comment-content");
const $communityDetailDeleteBtn = $("#community-detail-delete-btn"); // [✨✨✨ 추가] 커뮤니티 삭제 버튼

// 채팅 관련 DOM
const $openChatListBtn = $("#open-chat-list-btn");
const $chatBadge = $("#chat-badge");
const $chatListModal = $("#chat-list-modal");
const $closeChatListModalBtn = $("#close-chat-list-modal-btn");
const $chatListContainer = $("#chat-list-container");
const $chatDetailModal = $("#chat-detail-modal");
const $closeChatDetailModalBtn = $("#close-chat-detail-modal-btn");
const $chatOtherUserName = $("#chat-other-user-name");
const $chatPostTitle = $("#chat-post-title");
const $chatMessagesContainer = $("#chat-messages-container");
const $chatMessageForm = $("#chat-message-form");
const $chatMessageInput = $("#chat-message-input");

// 공용 모달 (로그인, 회원가입, 알림)
const $customAlertModal = $("#custom-alert-modal");
const $customAlertMessage = $("#custom-alert-message");
const $customAlertCloseBtn = $("#custom-alert-close-btn");
const $loginModal = $("#login-modal");
const $loginForm = $("#login-form");
const $closeLoginModalBtn = $("#close-login-modal-btn");
const $toggleToRegister = $("#toggle-to-register");
const $registerModal = $("#register-modal");
const $registerForm = $("#register-form");
const $closeRegisterModalBtn = $("#close-register-modal-btn");
const $toggleToLogin = $("#toggle-to-login");

// --- 유틸리티 함수 ---
function createIconsSafe() {
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        try {
            // console.log("Creating icons..."); // 디버깅용 로그
            lucide.createIcons();
        } catch (error) {
            console.error('Error creating lucide icons:', error);
        }
    } else {
        // console.warn("Lucide library not ready for createIconsSafe"); // 디버깅용 로그
    }
}


function customAlert(message) {
    $customAlertMessage.textContent = message;
    $customAlertModal.classList.remove("hidden");
}

function closeCustomAlert() {
    $customAlertModal.classList.add("hidden");
}

function customConfirm(message) {
    // app.py에 custom confirm 로직이 없으므로, 기본 confirm 사용
    return confirm(message);
}

function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return '방금 전';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
    return `${Math.floor(seconds / 86400)}일 전`;
}

function formatChatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffTime = today.getTime() - msgDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
    } else if (diffDays === 1) {
        return '어제';
    } else if (diffDays < 7) {
        return `${diffDays}일 전`;
    } else {
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
}

function getGalleryById(galleryId) {
    return allGalleries.find(g => g.id === galleryId) || { name: '알 수 없음', icon: 'HelpCircle' };
}


// --- 모달 제어 함수 ---
function openLoginModal() {
    closeRegisterModal();
    $loginModal.classList.remove('hidden');
}
function closeLoginModal() {
    $loginModal.classList.add('hidden');
    $loginForm.reset();
}

function openRegisterModal() {
    closeLoginModal();
    $registerModal.classList.remove('hidden');
}
function closeRegisterModal() {
    $registerModal.classList.add('hidden');
    $registerForm.reset();
}

// [✨ 수정] '새 팟 모집' 모달
function openNewPostModal() {
    if (!currentUser) {
        customAlert("로그인이 필요한 기능입니다.");
        openLoginModal();
        return;
    }
    // '커뮤니티'를 제외한 팟 카테고리만 채우기
    populateNewPostGalleryOptions(false);
    $newPostModal.classList.remove('hidden');
}
function closeNewPostModal() {
    $newPostModal.classList.add('hidden');
    $newPostForm.reset();
}

// [✨ 추가] '새 커뮤니티 글' 모달
function openNewCommunityModal() {
    if (!currentUser) {
        customAlert("로그인이 필요한 기능입니다.");
        openLoginModal();
        return;
    }
    $newCommunityModal.classList.remove('hidden');
}
function closeNewCommunityModal() {
    $newCommunityModal.classList.add('hidden');
    $communityForm.reset();
}

// [✨ 수정] '팟' 상세 모달 닫기
function closeDetailModal() {
    $postDetailModal.classList.add('hidden');
    selectedPost = null;
}

// [✨ 추가] '커뮤니티' 상세 모달 닫기
function closeCommunityDetailModal() {
    $communityDetailModal.classList.add('hidden');
    selectedCommunityPostId = null;
}

function openChatListModal() {
    renderChatList();
    $chatListModal.classList.remove('hidden');
}
function closeChatListModal() {
    $chatListModal.classList.add('hidden');
}

function openChatDetailModal() {
    $chatDetailModal.classList.remove('hidden');
}
function closeChatDetailModal() {
    if (socket && selectedChatroom) {
        socket.emit('leave_chat', { chatroom_id: selectedChatroom.id });
    }
    $chatDetailModal.classList.add('hidden');
    selectedChatroom = null;
    $chatMessagesContainer.innerHTML = '';
    $chatMessageForm.reset();
    $chatMessageInput.disabled = false;
    $chatMessageInput.placeholder = "메시지를 입력하세요...";
    $chatMessageForm.querySelector('button[type="submit"]').disabled = false;
}

// --- 렌더링 함수 ---
function renderAuthButtons() {
    let html = '';
    if (currentUser) {
        html = `
            <span class="text-sm text-gray-400 hidden md:block"><strong>${currentUser.username}</strong>님</span>
            <button id="logout-btn" class="text-gray-400 hover:text-pink-400 font-bold px-3 py-2 rounded-lg hover:bg-gray-800 transition">로그아웃</button>
        `;
        $openChatListBtn.classList.remove('hidden');
        $commentForm.classList.remove('hidden'); // [✨ 추가] 로그인 시 댓글 폼 표시
    } else {
        html = `
            <button id="open-login-modal-btn" class="text-white hover:text-pink-400 font-bold px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                로그인 / 회원가입
            </button>
        `;
        $openChatListBtn.classList.add('hidden');
        $commentForm.classList.add('hidden'); // [✨ 추가] 비로그인 시 댓글 폼 숨김
    }
    $authButtonsContainer.innerHTML = html;

    if (currentUser) {
        $('#logout-btn').addEventListener('click', handleLogout);
    } else {
        $('#open-login-modal-btn').addEventListener('click', openLoginModal);
    }
    // Auth 버튼 렌더링 후에는 아이콘 생성이 필요 없을 수 있으나, 만약을 위해 호출
    setTimeout(createIconsSafe, 0);
}

// [✨ 수정] 사이드바 렌더링 ('커뮤니티' 분리 및 아이콘)
function renderSidebar() {
    let html = `
        <button
            data-gallery-id="null"
            class="w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 font-bold ${
                selectedGallery === null
                    ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-600/30' // 선택 시 배경 및 텍스트
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-pink-400' // 기본 텍스트 및 호버
            }"
        >
            <i data-lucide="layout-grid" class="w-5 h-5"></i>
            전체 보기
        </button>
    `;

    allGalleries.forEach(gallery => {
        const isCommunity = gallery.id === 'community';
        const extraClasses = isCommunity ? 'mt-4 pt-4 border-t border-gray-700' : '';
        const isSelected = selectedGallery === gallery.id;

        html += `
            <button
                data-gallery-id="${gallery.id}"
                class="w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 font-bold ${extraClasses} ${
                    isSelected
                        ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-600/30' // 선택 시 배경 및 텍스트
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-pink-400' // 기본 텍스트 및 호버
                }"
            >
                <i data-lucide="${gallery.icon}" class="w-5 h-5"></i>
                ${gallery.name}
            </button>
        `;
    });

    $galleryNav.innerHTML = html;
    updateNewContentButtonText();

    // ✨ 중요: innerHTML 변경 후 DOM 업데이트가 완료된 다음에 아이콘 생성
    setTimeout(createIconsSafe, 0);
}


// [✨ 추가] 새 글쓰기 버튼 텍스트 업데이트 함수
function updateNewContentButtonText() {
    if (selectedGallery === null) {
        $newContentBtnText.textContent = "새 글쓰기";
    } else if (selectedGallery === 'community') {
        $newContentBtnText.textContent = "글작성";
    } else {
        $newContentBtnText.textContent = "팟 모집"; // '팟' 카테고리 선택 시
    }
}


// [✨ 수정] 새 팟 모집 모달의 카테고리 선택 옵션 채우기
function populateNewPostGalleryOptions(includeCommunity = false) {
     let optionsHtml = '<option value="">카테고리를 선택하세요</option>';
     allGalleries.forEach(gallery => {
        if (!includeCommunity && gallery.id === 'community') {
            return; // 커뮤니티 제외
        }
        optionsHtml += `<option value="${gallery.id}">${gallery.name}</option>`;
     });
     $newPostGallerySelect.innerHTML = optionsHtml;
}

// [✨ 수정] '팟' 목록 렌더링
function renderPostList() {
    const filteredPosts = allPosts.filter(post => {
        // '커뮤니티'는 이 함수에서 렌더링하지 않음
        if (post.gallery === 'community') return false;

        const matchesGallery = !selectedGallery || post.gallery === selectedGallery;
        const matchesSearch = !searchTerm ||
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.author_username.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesGallery && matchesSearch;
    });

    // 타이틀 설정
    $mainContentTitle.textContent = selectedGallery
        ? getGalleryById(selectedGallery).name
        : '전체 팟 모집';

    updateNewContentButtonText(); // [✨ 추가] 버튼 텍스트 업데이트

    $postListContainer.innerHTML = '';
    $loadingPlaceholder.classList.add('hidden');

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
        const isLiked = likedPostIds.has(post.id);

        const postElement = document.createElement('div');
        postElement.className = "p-5 hover:bg-gray-800/50 transition cursor-pointer";
        postElement.dataset.postId = post.id;

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

        postElement.addEventListener('click', () => handleOpenPost(post.id));
        $postListContainer.appendChild(postElement);
    });

    setTimeout(createIconsSafe, 0); // 목록 렌더링 후 아이콘 생성
}

// [✨ 추가] '커뮤니티' 목록 렌더링
function renderCommunityPostList() {
    const filteredPosts = allCommunityPosts.filter(post => {
        const matchesSearch = !searchTerm ||
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.author_username.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // 타이틀 설정
    $mainContentTitle.textContent = "커뮤니티";
    updateNewContentButtonText(); // [✨ 추가] 버튼 텍스트 업데이트

    $postListContainer.innerHTML = '';
    $loadingPlaceholder.classList.add('hidden');

    if (filteredPosts.length === 0) {
        $postListContainer.innerHTML = `
            <div class="p-12 text-center text-gray-500">
                게시글이 없습니다.
            </div>
        `;
        return;
    }

    filteredPosts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = "p-5 hover:bg-gray-800/50 transition cursor-pointer";
        postElement.dataset.communityPostId = post.id; // [✨ 수정]

        postElement.innerHTML = `
            <div class="flex items-start gap-4">
                ${post.image_url ? `
                    <img src="${post.image_url}" alt="썸네일" class="w-24 h-24 object-cover rounded-lg border border-gray-700">
                ` : `
                    <div class="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                        <i data-lucide="message-circle-more" class="w-10 h-10 text-gray-600"></i>
                    </div>
                `}
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2 flex-wrap">
                        <span class="text-xs text-gray-500">${post.author_username}</span>
                    </div>
                    <h3 class="font-bold text-lg mb-2 text-white hover:text-pink-400 transition truncate">${post.title}</h3>
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
                        <span class="flex items-center gap-1 text-pink-400">
                            <i data-lucide="message-square" class="w-4 h-4"></i>
                            ${post.comment_count}
                        </span>
                    </div>
                </div>
            </div>
        `;

        postElement.addEventListener('click', () => handleOpenCommunityPost(post.id));
        $postListContainer.appendChild(postElement);
    });

    setTimeout(createIconsSafe, 0); // 목록 렌더링 후 아이콘 생성
}


// [✨ 수정] '팟' 상세 모달 렌더링
function renderPostDetailModal() {
    if (!selectedPost) return;

    const post = selectedPost;
    const gallery = getGalleryById(post.gallery);
    const isLiked = selectedPost.liked_by_user;
    const hasJoined = selectedPost.has_joined;

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

    $postDetailContent.textContent = post.content;

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

    let actionButtonsHTML = '';

    if (currentUser && currentUser.user_id !== post.user_id) {
        actionButtonsHTML = `
            <div class="grid grid-cols-2 gap-4">
                <button
                    id="detail-join-btn"
                    data-post-id="${post.id}"
                    ${post.isCompleted && !hasJoined ? 'disabled' : ''}
                    class="py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition shadow-lg ${
                        hasJoined
                            ? 'bg-red-800 text-white hover:bg-red-700 border-2 border-red-700'
                            : (post.isCompleted
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-pink-600 to-pink-500 text-white hover:from-pink-500 hover:to-pink-600 shadow-pink-600/30')
                    }"
                >
                    ${hasJoined
                        ? '<i data-lucide="user-minus" class="w-6 h-6"></i> 참가 취소하기'
                        : (post.isCompleted
                            ? '<i data-lucide="check-circle" class="w-6 h-6"></i> 모집 완료됨'
                            : '<i data-lucide="user-plus" class="w-6 h-6"></i> 참가하기')
                    }
                </button>
                <button
                    id="detail-inquiry-btn"
                    data-post-id="${post.id}"
                    class="bg-gray-800 text-white py-4 rounded-xl hover:bg-gray-700 transition font-black text-lg flex items-center justify-center gap-3 border-2 border-gray-700"
                >
                    <i data-lucide="message-circle" class="w-6 h-6"></i>
                    문의하기
                </button>
            </div>
        `;
    }

    if (currentUser && currentUser.user_id === post.user_id) {

        if (post.participants && post.participants.length > 0) {
            actionButtonsHTML += `<div class="mt-0">
                <h4 class="font-bold text-lg text-white mb-3">참가자 목록 (${post.participants.length}명)</h4>
                <ul class="space-y-2 max-h-40 overflow-y-auto bg-gray-800/50 p-3 rounded-lg border border-gray-700">`;

            post.participants.forEach(p => {
                actionButtonsHTML += `
                    <li class="flex items-center justify-between p-2 rounded bg-gray-800">
                        <span class="text-white font-medium">${p.username}</span>
                        <div class="flex gap-2">
                            <button class="author-msg-btn text-pink-400 hover:text-pink-300 p-1" data-user-id="${p.user_id}" data-post-id="${post.id}" title="메시지 보내기">
                                <i data-lucide="message-circle" class="w-4 h-4"></i>
                            </button>
                            <button class="author-reject-btn text-red-500 hover:text-red-400 p-1" data-user-id="${p.user_id}" data-post-id="${post.id}" title="참가 거부">
                                <i data-lucide="x-circle" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </li>
                `;
            });

            actionButtonsHTML += `</ul></div>`;
        } else {
             actionButtonsHTML += `<p class="text-sm text-gray-500 text-center mt-0 mb-4">아직 참가자가 없습니다.</p>`;
        }

        actionButtonsHTML += `
            <button
                id="detail-delete-btn"
                data-post-id="${post.id}"
                class="mt-4 bg-red-800 text-white py-4 rounded-xl hover:bg-red-700 transition font-black text-lg flex items-center justify-center gap-3 border-2 border-red-700 w-full"
            >
                <i data-lucide="trash-2" class="w-6 h-6"></i>
                이 팟 삭제하기
            </button>
        `;
    }

    $postDetailActions.innerHTML = actionButtonsHTML;
    setTimeout(createIconsSafe, 0); // 모달 내용 렌더링 후 아이콘 생성

    // 이벤트 리스너 바인딩 (팟)
    const likeBtn = $("#detail-like-btn");
    if (likeBtn) likeBtn.addEventListener('click', (e) => handleLike(e.currentTarget.dataset.postId));

    const joinBtn = $("#detail-join-btn");
    if (joinBtn) joinBtn.addEventListener('click', (e) => {
        const postId = e.currentTarget.dataset.postId;
        if (selectedPost.has_joined) {
            handleCancelJoin(postId);
        } else {
            handleJoin(postId);
        }
    });

    const inquiryBtn = $("#detail-inquiry-btn");
    if (inquiryBtn) inquiryBtn.addEventListener('click', (e) => handleInquiry(e.currentTarget.dataset.postId));

    const deleteBtn = $("#detail-delete-btn");
    if (deleteBtn) deleteBtn.addEventListener('click', (e) => handleDeletePost(e.currentTarget.dataset.postId));

    $$('.author-msg-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const userId = e.currentTarget.closest('button').dataset.userId;
        const postId = e.currentTarget.closest('button').dataset.postId;
        handleInquiryByAuthor(postId, userId);
    }));

    $$('.author-reject-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const userId = e.currentTarget.closest('button').dataset.userId;
        const postId = e.currentTarget.closest('button').dataset.postId;
        handleRejectParticipant(postId, userId);
    }));
}

// [✨ 수정] '커뮤니티' 상세 모달 렌더링 (삭제 버튼 로직 추가)
function renderCommunityDetailModal(post) {
    $communityDetailTitle.textContent = post.title;
    $communityDetailAuthor.textContent = post.author_username;
    $communityDetailTimestamp.textContent = formatTimeAgo(post.timestamp);
    $communityDetailViews.innerHTML = `<i data-lucide="eye" class="w-4 h-4"></i> ${post.views}`; // 아이콘 추가

    if (post.image_url) {
        $communityDetailImage.src = post.image_url;
        $communityDetailImage.classList.remove('hidden');
    } else {
        $communityDetailImage.classList.add('hidden');
    }

    $communityDetailContent.textContent = post.content;

    renderCommunityComments(post.comments); // 댓글 렌더링 함수 호출
    
    // [✨✨✨ 추가] 삭제 버튼 표시 로직
    if (currentUser && currentUser.user_id === post.user_id) {
        $communityDetailDeleteBtn.classList.remove('hidden');
        $communityDetailDeleteBtn.onclick = () => handleDeleteCommunityPost(post.id); // 이벤트 리스너 연결
    } else {
        $communityDetailDeleteBtn.classList.add('hidden');
        $communityDetailDeleteBtn.onclick = null; // 이벤트 리스너 제거
    }
    // [✨✨✨ 추가] 댓글 폼 표시 로직 (로그인 버그 수정)
    if (currentUser) {
        $commentForm.classList.remove('hidden');
    } else {
        $commentForm.classList.add('hidden');
    }


    setTimeout(createIconsSafe, 0); // 모달 내용 렌더링 후 아이콘 생성
}


// [✨ 추가] '커뮤니티' 댓글 목록 렌더링
function renderCommunityComments(comments) {
    if (!comments || comments.length === 0) {
        $communityDetailCommentList.innerHTML = '<p class="text-gray-500 text-sm">아직 댓글이 없습니다.</p>';
        return;
    }

    $communityDetailCommentList.innerHTML = comments.map(comment => `
        <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700 comment-item">
            <div class="flex items-center justify-between mb-2">
                <span class="font-bold text-white">${comment.author_username}</span>
                <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500">${formatTimeAgo(comment.timestamp)}</span>
                    ${currentUser && currentUser.user_id === comment.user_id ? `
                        <button class="delete-comment-btn text-gray-500 hover:text-red-500" data-comment-id="${comment.id}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
            <p class="text-gray-300 whitespace-pre-wrap">${comment.content}</p>
        </div>
    `).join('');

    // 댓글 삭제 버튼 이벤트 리스너
    $$('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const commentId = e.currentTarget.dataset.commentId;
            handleDeleteComment(commentId);
        });
    });

    setTimeout(createIconsSafe, 0); // 댓글 렌더링 후 아이콘 생성
}


// (채팅 관련 렌더링 함수: updateChatBadge, renderChatList, renderChatMessages, renderSingleMessage, updateChatInputState - 기존과 동일)
function updateChatBadge(unreadCount) {
    if (unreadCount > 0) {
        $chatBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        $chatBadge.classList.remove('hidden');
    } else {
        $chatBadge.classList.add('hidden');
    }
}
function renderChatList() {
    if (allChatrooms.length === 0) {
        $chatListContainer.innerHTML = `<div class="p-12 text-center text-gray-500">채팅방이 없습니다.</div>`;
        return;
    }
    $chatListContainer.innerHTML = '';
    allChatrooms.forEach(chatroom => {
        const chatroomElement = document.createElement('div');
        chatroomElement.className = "p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition cursor-pointer border border-gray-700";
        chatroomElement.dataset.chatroomId = chatroom.id;
        chatroomElement.innerHTML = `
            <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="font-bold text-white truncate">${chatroom.other_user_name}</h3>
                        ${chatroom.unread_count > 0 ? `<span class="bg-pink-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">${chatroom.unread_count}</span>` : ''}
                    </div>
                    <p class="text-xs text-gray-400 mb-2 truncate">${chatroom.post_title}</p>
                    <p class="text-sm text-gray-300 truncate">${chatroom.last_message}</p>
                </div>
                <div class="flex flex-col items-end gap-2">
                    <span class="text-xs text-gray-500">${formatChatTime(chatroom.last_message_at)}</span>
                    <button class="delete-chat-btn text-gray-500 hover:text-red-500 transition p-1" data-chatroom-id="${chatroom.id}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
        chatroomElement.addEventListener('click', (e) => {
            if (e.target.closest('.delete-chat-btn')) {
                e.stopPropagation();
                handleDeleteChatroom(chatroom.id);
                return;
            }
            handleOpenChatDetail(chatroom.id);
        });
        $chatListContainer.appendChild(chatroomElement);
    });
    setTimeout(createIconsSafe, 0); // 채팅 목록 렌더링 후 아이콘 생성
}
function renderChatMessages(messages) {
    if (!selectedChatroom) return;
    if (messages.length === 0) {
        $chatMessagesContainer.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i data-lucide="message-circle" class="w-12 h-12 mx-auto mb-3 text-gray-600"></i>
                <p>메시지를 시작해보세요!</p>
            </div>
        `;
        setTimeout(createIconsSafe, 0); // 메시지 없을 때도 아이콘 생성 (만약을 위해)
        return;
    }
    $chatMessagesContainer.innerHTML = '';
    messages.forEach(message => {
        renderSingleMessage(message);
    });
    $chatMessagesContainer.scrollTop = $chatMessagesContainer.scrollHeight;
    // renderSingleMessage 내부에서 스크롤 처리하므로 여기선 아이콘 생성 불필요
}
function renderSingleMessage(message) {
     const messageElement = document.createElement('div');
    if (message.is_system_message) {
        messageElement.className = 'flex justify-center';
        messageElement.innerHTML = `<div class="text-center text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full my-2">${message.content}</div>`;
    }
    else {
        const isMine = message.sender_id === currentUser.user_id;
        messageElement.className = `flex ${isMine ? 'justify-end' : 'justify-start'}`;
        messageElement.innerHTML = `
            <div class="max-w-[70%]">
                ${!isMine ? `<p class="text-xs text-gray-400 mb-1">${message.sender_name}</p>` : ''}
                <div class="rounded-lg p-3 ${isMine ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white' : 'bg-gray-800 text-gray-300'}">
                    <p class="text-base whitespace-pre-wrap break-words">${message.content}</p>
                </div>
                <p class="text-xs text-gray-500 mt-1 ${isMine ? 'text-right' : 'text-left'}">${formatChatTime(message.timestamp)}</p>
            </div>
        `;
    }
    $chatMessagesContainer.appendChild(messageElement);
    $chatMessagesContainer.scrollTop = $chatMessagesContainer.scrollHeight;
    // 개별 메시지 추가 후 아이콘 생성 불필요 (메시지 내용에는 아이콘 없음)
}
function updateChatInputState() {
    if (!selectedChatroom || !currentUser) return;
    const amIUser1 = currentUser.user_id === selectedChatroom.user1_id;
    const otherUserHasLeft = amIUser1 ? selectedChatroom.user2_left : selectedChatroom.user1_left;
    if (otherUserHasLeft) {
        $chatMessageInput.disabled = true;
        $chatMessageInput.placeholder = "상대방이 채팅방을 나갔습니다.";
        $chatMessageForm.querySelector('button[type="submit"]').disabled = true;
    } else {
        $chatMessageInput.disabled = false;
        $chatMessageInput.placeholder = "메시지를 입력하세요...";
        $chatMessageForm.querySelector('button[type="submit"]').disabled = false;
    }
}


// --- API 호출 함수 ---

async function fetchStatus() {
    try {
        const response = await fetch('/api/status');
        if (!response.ok) throw new Error('Status check failed');
        const data = await response.json();
        currentUser = data.logged_in ? data : null;
    } catch (error) {
        console.error(error);
        currentUser = null;
    }
    renderAuthButtons();
}

async function fetchGalleries() {
    try {
        const response = await fetch('/api/galleries');
        if (!response.ok) throw new Error('카테고리 로딩 실패');
        allGalleries = await response.json();
        renderSidebar();
        // [✨ 수정] '팟' 모달의 카테고리만 먼저 채움
        populateNewPostGalleryOptions(false);
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

// [✨ 수정] '팟' 목록 불러오기
async function fetchPosts() {
    try {
        if (isFirstPostLoad) {
            $loadingPlaceholder.classList.remove('hidden');
            $postListContainer.innerHTML = '';
        }

        const response = await fetch('/api/posts');
        if (!response.ok) throw new Error('게시글 로딩 실패');

        const data = await response.json();

        allPosts = data.posts;
        likedPostIds = new Set(data.liked_by_user);
        renderPostList();

        if (isFirstPostLoad) {
            $loadingPlaceholder.classList.add('hidden');
            isFirstPostLoad = false;
        }

    } catch (error) {
        console.error(error);
        if (isFirstPostLoad) {
            $loadingPlaceholder.classList.add('hidden');
            $postListContainer.innerHTML = `<div class="p-12 text-center text-red-500">게시글을 불러오는 데 실패했습니다.</div>`;
            isFirstPostLoad = false;
        }
    }
}

// [✨ 추가] '커뮤니티' 목록 불러오기
async function fetchCommunityPosts() {
    try {
        if (isFirstPostLoad) {
            $loadingPlaceholder.classList.remove('hidden');
            $postListContainer.innerHTML = '';
        }

        const response = await fetch('/api/community/posts');
        if (!response.ok) throw new Error('커뮤니티 게시글 로딩 실패');

        allCommunityPosts = await response.json();
        renderCommunityPostList();

        if (isFirstPostLoad) {
            $loadingPlaceholder.classList.add('hidden');
            isFirstPostLoad = false;
        }
    } catch (error) {
        console.error(error);
        if (isFirstPostLoad) {
            $loadingPlaceholder.classList.add('hidden');
            $postListContainer.innerHTML = `<div class="p-12 text-center text-red-500">게시글을 불러오는 데 실패했습니다.</div>`;
            isFirstPostLoad = false;
        }
    }
}


async function fetchChatrooms() {
    if (!currentUser) return;
    try {
        const response = await fetch('/api/chatrooms');
        if (!response.ok) throw new Error('채팅방 로딩 실패');
        const data = await response.json();
        allChatrooms = data.chatrooms;
        updateChatBadge(data.total_unread);
        if (!$chatListModal.classList.contains('hidden')) {
            renderChatList();
        }
    } catch (error) {
        console.error(error);
    }
}

// --- 데이터 로드 ---
async function fetchAllData() {
    await fetchStatus();
    await fetchGalleries();

    // [✨ 수정] 초기 로드는 '팟' 목록 (전체 보기)
    await fetchPosts();

    if (currentUser) {
        await fetchChatrooms();
        initializeSocket();
    }
}

// --- WebSocket 핸들러 ---
function initializeSocket() {
    if (socket) return;
    socket = io();
    console.log("Socket.IO connecting...");
    socket.on('connect', () => console.log('Socket.IO connected:', socket.id));
    socket.on('disconnect', () => console.log('Socket.IO disconnected'));
    socket.on('error', (error) => console.error('Socket.IO error:', error));
    setupSocketListeners();
}

function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('Socket.IO disconnected manually');
    }
}

function setupSocketListeners() {
    if (!socket) return;

    // 1. '팟' 목록/상세 갱신
    socket.on('posts_updated', (data) => {
        const { reason, post_data, post_id } = data;
        console.log('Socket event: posts_updated', data);

        if (reason === 'delete_post') {
            allPosts = allPosts.filter(p => p.id !== post_id);
            if (selectedPost && selectedPost.id === post_id) {
                customAlert('현재 보던 게시글이 삭제되었습니다.');
                closeDetailModal();
            }
        } else {
            const index = allPosts.findIndex(p => p.id === post_data.id);
            if (index !== -1) {
                allPosts[index] = post_data;
            } else if (reason === 'new_post') {
                allPosts.unshift(post_data);
            }
            if (currentUser) {
                if (post_data.liked_by_user) likedPostIds.add(post_data.id);
                else likedPostIds.delete(post_data.id);
            }
            if (selectedPost && selectedPost.id === post_data.id) {
                selectedPost = post_data;
                renderPostDetailModal();
            }
        }

        // [✨ 수정] 현재 '팟' 모드일 때만 렌더링
        if (selectedGallery !== 'community') {
            renderPostList();
        }
    });

    // 2. 새 채팅 메시지 수신
    socket.on('new_message', (message) => {
        console.log('Socket event: new_message', message);
        if (selectedChatroom && selectedChatroom.id === message.chatroom_id) {
            renderSingleMessage(message);
            if (message.sender_id !== currentUser.user_id) {
                refreshChatMessages();
            }
        }
    });

    // 3. 채팅 목록 갱신
    socket.on('chatlist_updated', () => {
        console.log('Socket event: chatlist_updated');
        fetchChatrooms();
    });

    // 4. 채팅방 상태 변경
    socket.on('chat_status_changed', (data) => {
        console.log('Socket event: chat_status_changed', data);
        if (selectedChatroom && selectedChatroom.id === data.chatroom_id) {
            refreshChatMessages();
        }
    });
}


// --- 이벤트 핸들러 ---

// [✨ 수정] '팟' 상세 열기
async function handleOpenPost(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/view`, { method: 'POST' });
        if (!response.ok) throw new Error('게시글을 불러올 수 없습니다.');
        selectedPost = await response.json();
        renderPostDetailModal();
        $postDetailModal.classList.remove('hidden');
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

// [✨ 수정] '커뮤니티' 상세 열기 (백엔드 GET이 조회수를 올림)
async function handleOpenCommunityPost(postId) {
    try {
        selectedCommunityPostId = postId;
        
        // [✨ 수정] 백엔드의 GET API가 조회수를 올리므로,
        // 로그인/로그아웃 시 모달 새로고침 시에도 조회수가 오르는 것을
        // 막으려면 app.py 수정이 필요합니다.
        // 여기서는 일단 app.py 수정 없이 진행하므로, 조회수가 오르는 것을 감수합니다.
        
        const response = await fetch(`/api/community/posts/${postId}`); 
        if (!response.ok) throw new Error('게시글을 불러올 수 없습니다.');

        const post = await response.json();
        renderCommunityDetailModal(post);
        $communityDetailModal.classList.remove('hidden');

        // 목록 뷰 갱신 (조회수)
        const index = allCommunityPosts.findIndex(p => p.id == postId);
        if (index !== -1) {
             allCommunityPosts[index].views = post.views;
             allCommunityPosts[index].comment_count = post.comments.length;
             renderCommunityPostList();
        }

    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

// (handleLike, handleJoin, handleCancelJoin, handleRejectParticipant - '팟' 관련 핸들러, 기존과 동일)
async function handleLike(postId) {
    if (!currentUser) { customAlert("로그인이 필요한 기능입니다."); openLoginModal(); return; }
    try {
        const response = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
        if (response.status === 401) { customAlert("로그인이 필요합니다."); openLoginModal(); return; }
        if (!response.ok) throw new Error('좋아요 처리에 실패했습니다.');
    } catch (error) { console.error(error); customAlert(error.message); }
}
async function handleJoin(postId) {
    if (!currentUser) { customAlert("로그인이 필요한 기능입니다."); openLoginModal(); return; }
    try {
        const response = await fetch(`/api/posts/${postId}/join`, { method: 'POST' });
        const data = await response.json();
        if (response.status === 401) { customAlert("로그인이 필요합니다."); openLoginModal(); return; }
        if (!response.ok) throw new Error(data.error || '참가 처리에 실패했습니다.');
        customAlert('참가 신청이 완료되었습니다!');
    } catch (error) { console.error(error); customAlert(error.message); }
}
async function handleCancelJoin(postId) {
    if (!currentUser) { customAlert("로그인이 필요한 기능입니다."); openLoginModal(); return; }
    try {
        const response = await fetch(`/api/posts/${postId}/cancel_join`, { method: 'POST' });
        const data = await response.json();
        if (response.status === 401) { customAlert("로그인이 필요합니다."); openLoginModal(); return; }
        if (!response.ok) throw new Error(data.error || '참가 취소에 실패했습니다.');
        customAlert('참가를 취소했습니다.');
    } catch (error) { console.error(error); customAlert(error.message); }
}
async function handleRejectParticipant(postId, userId) {
    if (!currentUser || currentUser.user_id !== selectedPost.user_id) { customAlert("권한이 없습니다."); return; }
    if (!customConfirm("정말로 이 참가자를 거부(강퇴)하시겠습니까?")) return;
    try {
        const response = await fetch(`/api/posts/${postId}/reject/${userId}`, { method: 'POST' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '참가자 거부에 실패했습니다.');
        customAlert(data.message);
    } catch (error) { console.error(error); customAlert(error.message); }
}

// (handleInquiry, handleInquiryByAuthor - '팟' 채팅 관련 핸들러, 기존과 동일)
async function handleInquiry(postId) {
    if (!currentUser) { customAlert("로그인이 필요한 기능입니다."); openLoginModal(); return; }
    if (selectedPost && selectedPost.user_id === currentUser.user_id) { customAlert("자신의 게시글에는 문의할 수 없습니다."); return; }
    try {
        const response = await fetch(`/api/chatrooms/${postId}/create`, { method: 'POST' });
        const data = await response.json();
        if (response.status === 401) { customAlert("로그인이 필요합니다."); openLoginModal(); return; }
        if (!response.ok) throw new Error(data.error || '채팅방 생성에 실패했습니다.');
        closeDetailModal();
        handleOpenChatDetail(data.id);
    } catch (error) { console.error(error); customAlert(error.message); }
}
async function handleInquiryByAuthor(postId, userId) {
    if (!currentUser) { customAlert("로그인이 필요한 기능입니다."); openLoginModal(); return; }
    try {
        const response = await fetch(`/api/chatrooms/create_direct`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post_id: postId, recipient_id: userId })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '채팅방 생성에 실패했습니다.');
        closeDetailModal();
        handleOpenChatDetail(data.id);
    } catch (error) { console.error(error); customAlert(error.message); }
}

// [✨ 수정] '팟' 삭제 핸들러
async function handleDeletePost(postId) {
    if (!currentUser || currentUser.user_id !== selectedPost.user_id) { customAlert("삭제할 권한이 없습니다."); return; }
    if (!customConfirm("정말로 이 게시글을 삭제하시겠습니까?")) return;
    try {
        const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '삭제에 실패했습니다.');
        customAlert('게시글이 삭제되었습니다.');
        closeDetailModal();
        // 'posts_updated' (delete) 이벤트가 발생하므로 수동 fetch 필요 없음
    } catch (error) { console.error(error); customAlert(error.message); }
}

// [✨✨✨ 추가] '커뮤니티' 게시글 삭제 핸들러
async function handleDeleteCommunityPost(postId) {
    if (!currentUser) { customAlert("로그인이 필요한 기능입니다."); return; }
    if (!customConfirm("정말로 이 게시글을 삭제하시겠습니까?\n삭제된 글과 이미지는 복구할 수 없습니다.")) return;

    try {
        const response = await fetch(`/api/community/posts/${postId}`, {
            method: 'DELETE',
        });

        if (response.status === 401) { customAlert("로그인이 필요합니다."); openLoginModal(); return; }
        if (response.status === 403) { customAlert("삭제할 권한이 없습니다."); return; }
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '삭제 실패');

        customAlert('게시글이 삭제되었습니다.');
        closeCommunityDetailModal();
        
        // 목록 새로고침
        await fetchCommunityPosts();

    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}


// [✨ 수정] '새 팟 모집' 핸들러
async function handleCreatePost(event) {
    event.preventDefault();
    if (!currentUser) { customAlert("로그인이 필요한 기능입니다."); openLoginModal(); return; }

    const formData = new FormData($newPostForm);
    const data = Object.fromEntries(formData.entries());

    const current = parseInt(data.currentMembers);
    const total = parseInt(data.totalMembers);

    if (isNaN(current) || isNaN(total)) { customAlert("인원수는 숫자만 입력해주세요."); return; }
    if (current < 1) { customAlert("현재 인원은 1명(본인) 이상이어야 합니다."); return; }
    if (total <= current) { customAlert("목표 인원은 현재 인원보다 많아야 합니다."); return; }
    if (!data.gallery || data.gallery === 'community') { customAlert("팟 카테고리를 선택해주세요."); return; } // [✨ 수정] 커뮤니티 선택 방지

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (response.status === 401) { customAlert("로그인이 필요합니다."); openLoginModal(); return; }
        if (response.status === 403) { const errorData = await response.json(); customAlert(errorData.error || '이메일 인증이 필요합니다.'); return; }
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.description || errorData.error || '게시글 등록에 실패했습니다.'); }

        closeNewPostModal();
        customAlert('게시글이 등록되었습니다!');
        // 'posts_updated' (new_post) 이벤트가 발생하므로 수동 fetch 필요 없음
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

// [✨ 추가] '새 커뮤니티 글' 핸들러
async function handleCreateCommunityPost(event) {
    event.preventDefault();
    if (!currentUser) { customAlert("로그인이 필요한 기능입니다."); openLoginModal(); return; }

    const formData = new FormData($communityForm);
    const $submitBtn = $communityForm.querySelector('button[type="submit"]');

    try {
        $submitBtn.disabled = true;
        $submitBtn.textContent = '등록 중...';

        const response = await fetch('/api/community/posts', {
            method: 'POST',
            body: formData, // JSON이 아닌 FormData
        });

        if (response.status === 401) { customAlert("로그인이 필요합니다."); openLoginModal(); return; }
        if (!response.ok) { const data = await response.json(); throw new Error(data.error || '등록 실패'); }

        customAlert('게시글이 등록되었습니다!');
        closeNewCommunityModal();
        fetchCommunityPosts(); // 새 글 등록 후 목록 새로고침

    } catch (error) {
        console.error(error);
        customAlert(error.message);
    } finally {
        $submitBtn.disabled = false;
        $submitBtn.textContent = '등록하기';
    }
}

// [✨ 수정] '커뮤니티 댓글' 작성 핸들러 (댓글 수 업데이트 추가)
async function handleCreateComment(event) {
    event.preventDefault();
    if (!currentUser) { customAlert("로그인이 필요한 기능입니다."); openLoginModal(); return; }
    if (!selectedCommunityPostId) return;

    const content = $commentContent.value.trim();
    if (!content) {
        customAlert("댓글 내용을 입력해주세요.");
        return;
    }

    try {
        const response = await fetch(`/api/community/posts/${selectedCommunityPostId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content }),
        });
        if (response.status === 401) { customAlert("로그인이 필요합니다."); openLoginModal(); return; }
        if (!response.ok) { const data = await response.json(); throw new Error(data.error || '댓글 등록 실패'); }

        $commentContent.value = ''; // 폼 리셋
        const newComment = await response.json();

        // --- 댓글 수 업데이트 로직 ---
        const postIndex = allCommunityPosts.findIndex(p => p.id == selectedCommunityPostId);
        if (postIndex !== -1) {
            allCommunityPosts[postIndex].comment_count += 1;
            renderCommunityPostList(); // 목록 다시 그리기
        }
        // --- --- --- --- --- --- ---

        // 댓글 목록 UI에 새 댓글 추가
        const commentElement = document.createElement('div');
        commentElement.className = "bg-gray-800/50 p-4 rounded-lg border border-gray-700 comment-item"; // class 추가
        commentElement.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="font-bold text-white">${newComment.author_username}</span>
                <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500">${formatTimeAgo(newComment.timestamp)}</span>
                    <button class="delete-comment-btn text-gray-500 hover:text-red-500" data-comment-id="${newComment.id}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <p class="text-gray-300 whitespace-pre-wrap">${newComment.content}</p>
        `;
        // 댓글이 없을 때 표시되는 메시지 제거
        const noCommentMsg = $communityDetailCommentList.querySelector('p.text-gray-500'); // 좀 더 구체적인 셀렉터
        if (noCommentMsg && noCommentMsg.textContent.includes('아직 댓글이 없습니다')) {
             noCommentMsg.remove();
        }


        $communityDetailCommentList.appendChild(commentElement);
        // 새 댓글 삭제 버튼에도 이벤트 리스너 추가
        commentElement.querySelector('.delete-comment-btn').addEventListener('click', (e) => {
            handleDeleteComment(e.currentTarget.dataset.commentId);
        });

        setTimeout(createIconsSafe, 0); // 새 댓글 추가 후 아이콘 생성

    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

// [✨ 수정] '커뮤니티 댓글' 삭제 핸들러 (댓글 수 업데이트 추가)
async function handleDeleteComment(commentId) {
    if (!currentUser) { customAlert("로그인이 필요한 기능입니다."); openLoginModal(); return; }
    if (!customConfirm("정말로 이 댓글을 삭제하시겠습니까?")) return;

    try {
        const response = await fetch(`/api/community/comments/${commentId}`, {
            method: 'DELETE',
        });
        if (response.status === 401) { customAlert("로그인이 필요합니다."); openLoginModal(); return; }
        if (response.status === 403) { customAlert("삭제할 권한이 없습니다."); return; }
        if (!response.ok) { const data = await response.json(); throw new Error(data.error || '댓글 삭제 실패'); }

        customAlert('댓글이 삭제되었습니다.');

        // UI에서 댓글 요소 제거
        const commentElement = $communityDetailCommentList.querySelector(`.comment-item button[data-comment-id="${commentId}"]`)?.closest('.comment-item');
        if (commentElement) {
            commentElement.remove();
        }


        // --- 댓글 수 업데이트 로직 ---
        const postIndex = allCommunityPosts.findIndex(p => p.id == selectedCommunityPostId);
        if (postIndex !== -1 && allCommunityPosts[postIndex].comment_count > 0) {
            allCommunityPosts[postIndex].comment_count -= 1;
            renderCommunityPostList(); // 목록 다시 그리기
        }
        // --- --- --- --- --- --- ---

        // 댓글이 하나도 없으면 메시지 표시
        if ($communityDetailCommentList.children.length === 0) {
            $communityDetailCommentList.innerHTML = '<p class="text-gray-500 text-sm">아직 댓글이 없습니다.</p>';
        }

    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}


// [✨✨✨ 수정] 로그인 핸들러 (커뮤니티 뷰/모달 갱신)
async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData($loginForm);
    const data = Object.fromEntries(formData.entries());
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || '로그인 실패');
        
        customAlert('로그인 성공!');
        closeLoginModal();
        await fetchAllData(); // 상태, 카테고리, 팟목록, 채팅목록 갱신

        // [✨✨✨ 추가] 로그인 버그 수정
        // 현재 커뮤니티 탭을 보고 있었다면, 커뮤니티 목록을 새로고침
        if (selectedGallery === 'community') {
            await fetchCommunityPosts();
        }
        // 만약 커뮤니티 상세 모달이 열려있었다면,
        // 모달을 새로고침하여 '댓글폼'과 '삭제버튼'을 표시
        if (selectedCommunityPostId) {
            await handleOpenCommunityPost(selectedCommunityPostId);
        }
        // 만약 팟 상세 모달이 열려있었다면, 새로고침
        if (selectedPost) {
            await handleOpenPost(selectedPost.id);
        }

    } catch (error) { 
        console.error(error); 
        customAlert(error.message); 
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const $submitBtn = $registerForm.querySelector('button[type="submit"]');
    const formData = new FormData($registerForm);
    const data = Object.fromEntries(formData.entries());
    try {
        $submitBtn.disabled = true;
        $submitBtn.textContent = '이메일 전송 중...';
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || '회원가입 실패');
        customAlert(result.message || '회원가입 성공! 이메일을 확인해주세요.');
        closeRegisterModal();
        openLoginModal();
    } catch (error) { console.error(error); customAlert(error.message); }
    finally { $submitBtn.disabled = false; $submitBtn.textContent = '회원가입'; }
}

// [✨✨✨ 수정] 로그아웃 핸들러 (커뮤니티 뷰/모달 갱신)
async function handleLogout() {
    try {
        const response = await fetch('/logout', { method: 'POST' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || '로그아웃 실패');
        
        customAlert('로그아웃 되었습니다.');
        disconnectSocket();
        currentUser = null;
        renderAuthButtons(); // 인증 버튼 갱신 (로그인 버튼 표시)

        // [✨ 수정] 현재 뷰에 따라 목록 갱신
        if (selectedGallery === 'community') {
            // 목록은 다시 그리기만 해도 됨 (데이터 변경 없음)
            renderCommunityPostList(); 
        } else {
             // 팟 목록은 '좋아요' 표시가 사라져야 하므로 다시 그림
            renderPostList();
        }
        
        // [✨✨✨ 추가] 로그아웃 버그 수정
        // 만약 커뮤니티 상세 모달이 열려있었다면,
        // 모달을 새로고침하여 '댓글폼'과 '삭제버튼'을 숨김
        if (selectedCommunityPostId) {
            await handleOpenCommunityPost(selectedCommunityPostId);
        }
         // 만약 팟 상세 모달이 열려있었다면, 새로고침
        if (selectedPost) {
            await handleOpenPost(selectedPost.id);
        }

        updateChatBadge(0);
    } catch (error) { console.error(error); customAlert(error.message); }
}

// [✨ 수정] 검색 핸들러
function handleSearch(event) {
    searchTerm = event.target.value;
    // [✨ 수정] 현재 뷰에 따라 다른 목록 렌더링
    if (selectedGallery === 'community') {
        renderCommunityPostList();
    } else {
        renderPostList();
    }
}

// [✨ 수정] 카테고리 선택 핸들러
function handleGallerySelect(event) {
    const button = event.target.closest('button[data-gallery-id]');
    if (!button) return;

    const galleryId = button.dataset.galleryId;
    selectedGallery = galleryId === 'null' ? null : galleryId;

    isFirstPostLoad = true; // 로딩 스피너를 다시 표시하기 위해

    // [✨ 수정] '커뮤니티' 선택 시 커뮤니티 목록, 그 외에는 '팟' 목록
    if (selectedGallery === 'community') {
        fetchCommunityPosts();
    } else {
        fetchPosts(); // '전체 보기' (null) 포함
    }

    renderSidebar(); // 선택된 카테고리 하이라이트 및 버튼 텍스트 업데이트
}

// --- 채팅 이벤트 핸들러 ---
// (handleOpenChatDetail, handleSendMessage, refreshChatMessages, handleDeleteChatroom - 기존과 동일)
async function handleOpenChatDetail(chatroomId) {
    try {
        const response = await fetch(`/api/chatrooms/${chatroomId}/messages`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '채팅방 입장에 실패했습니다.');

        selectedChatroom = data.chatroom;
        $chatOtherUserName.textContent = selectedChatroom.other_user_name;
        $chatPostTitle.textContent = selectedChatroom.post_title;
        renderChatMessages(data.messages);
        updateChatInputState();
        closeChatListModal();
        openChatDetailModal();

        if (socket) {
            socket.emit('join_chat', { chatroom_id: chatroomId });
        }
    } catch (error) { console.error(error); customAlert(error.message); }
}
async function handleSendMessage(event) {
    event.preventDefault();
    if (!selectedChatroom || !socket) return;
    const amIUser1 = currentUser.user_id === selectedChatroom.user1_id;
    const otherUserHasLeft = amIUser1 ? selectedChatroom.user2_left : selectedChatroom.user1_left;
    if (otherUserHasLeft) { customAlert("상대방이 채팅방을 나갔습니다. 메시지를 보낼 수 없습니다."); return; }
    const content = $chatMessageInput.value.trim();
    if (!content) return;
    try {
        socket.emit('send_message', {
            chatroom_id: selectedChatroom.id,
            content: content
        });
        $chatMessageInput.value = '';
    } catch (error) { console.error(error); customAlert(error.message); }
}
async function refreshChatMessages() {
    if (!selectedChatroom || !currentUser) return;
    try {
        const response = await fetch(`/api/chatrooms/${selectedChatroom.id}/messages`);
        if (!response.ok) { closeChatDetailModal(); throw new Error('Chat refresh failed, room likely left'); }
        const data = await response.json();
        if ($chatDetailModal.classList.contains('hidden')) return;
        selectedChatroom = data.chatroom;
        renderChatMessages(data.messages);
        updateChatInputState();
    } catch (error) { console.error(error); }
}
async function handleDeleteChatroom(chatroomId) {
    if (!customConfirm("정말로 이 채팅방을 나가시겠습니까?\n상대방에게는 내가 나갔다는 알림이 표시됩니다.")) return;
    try {
        const response = await fetch(`/api/chatrooms/${chatroomId}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '채팅방 나가기 실패');
        customAlert(data.message);
    } catch (error) { console.error(error); customAlert(error.message); }
}


// --- 앱 초기화 ---

function initApp() {
    // ✨ 중요: 앱 초기화 시 Lucide 아이콘 첫 생성
    createIconsSafe();

    // --- 이벤트 리스너 바인딩 ---
    $logo.addEventListener('click', () => window.location.reload());
    $searchInput.addEventListener('input', handleSearch);
    $galleryNav.addEventListener('click', handleGallerySelect);

    // [✨ 수정] 새 콘텐츠 모달 열기 버튼
    $openNewContentModalBtn.addEventListener('click', () => {
        if (!currentUser) { // 로그인 안 했으면 항상 로그인 요청
            customAlert("로그인이 필요한 기능입니다.");
            openLoginModal();
            return;
        }
        if (selectedGallery === 'community') {
            openNewCommunityModal();
        } else {
            openNewPostModal();
        }
    });

    $openChatListBtn.addEventListener('click', openChatListModal);

    // 모달 닫기 버튼
    $closeDetailModalBtn.addEventListener('click', closeDetailModal);
    $closeNewPostModalBtn.addEventListener('click', closeNewPostModal);
    $closeLoginModalBtn.addEventListener('click', closeLoginModal);
    $closeRegisterModalBtn.addEventListener('click', closeRegisterModal);
    $closeChatListModalBtn.addEventListener('click', closeChatListModal);
    $closeChatDetailModalBtn.addEventListener('click', closeChatDetailModal);
    $customAlertCloseBtn.addEventListener('click', closeCustomAlert);
    $closeNewCommunityModalBtn.addEventListener('click', closeNewCommunityModal); // [✨ 추가]
    $closeCommunityDetailModalBtn.addEventListener('click', closeCommunityDetailModal); // [✨ 추가]

    // 폼 제출
    $newPostForm.addEventListener('submit', handleCreatePost);
    $loginForm.addEventListener('submit', handleLogin);
    $registerForm.addEventListener('submit', handleRegister);
    $chatMessageForm.addEventListener('submit', handleSendMessage);
    $communityForm.addEventListener('submit', handleCreateCommunityPost); // [✨ 추가]
    $commentForm.addEventListener('submit', handleCreateComment); // [✨ 추가]

    // 모달 스위칭
    $toggleToRegister.addEventListener('click', openRegisterModal);
    $toggleToLogin.addEventListener('click', openLoginModal);

    // 초기 데이터 로드
    fetchAllData();
}

// DOM이 로드되면 앱 실행
document.addEventListener('DOMContentLoaded', initApp);
