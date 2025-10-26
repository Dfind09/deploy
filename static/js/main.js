// --- ✨ Chart.js 플러그인 등록 ---
Chart.register(ChartDataLabels);

// --- ✨ 스킬 데이터 (API로 곧 덮어씀) ---
let allSkillCategories = {};
let allSkills = [];

// --- ✨ 능력치 데이터 (신규) ---
const abilityCategories = {
    "hackathon": ["웹", "프론트엔드", "백엔드", "모바일", "AI", "디자인", "기획"],

    "ctf": ["웹해킹", "리버싱", "포렌식", "암호학", "시스템해킹"],

    "algorithm": ["그래프", "DP", "수학", "시뮬레이션", "구현"],

    "ai": ["데이터분석", "머신러닝", "딥러닝", "NLP", "통계"],

    "planning": ["기획", "BM설계", "시장조사", "발표", "UX"],

    "design": ["UI/UX", "그래픽", "영상", "로고", "브랜딩"],

    "engineering": ["회로", "임베디드", "CAD", "로봇", "시스템설계"]
};

// --- 전역 상태 변수 ---
let allPosts = [];
let allCommunityPosts = [];
let allGalleries = []; // '팟' 카테고리
let selectedGallery = null; // '팟' 카테고리 선택
let headerSearchTerm = ""; // 헤더 검색어 (팟/커뮤니티용)
let selectedPost = null;
let selectedCommunityPostId = null;
let currentUser = null;
let likedPostIds = new Set();

// ✨ 뷰 상태
let currentView = 'pods'; // 'pods' or 'users'
let userSearchMode = 'skill'; // ✨ 'skill', 'name', or 'recommend' (수정)
let selectedSkill = null; // '유저' 스킬 선택

// 채팅 관련 상태
let allChatrooms = [];
let selectedChatroom = null;
let socket = null;
let isFirstPostLoad = true;

// ✨ 프로필/차트 관련 상태
let profilePreviewTimeout = null;
let currentPreviewUserId = null;
let currentProfileData = null; // 프로필 모달에 표시 중인 사용자 데이터
let currentSkillChart = null; // 현재 활성화된 '주요 스킬' 차트
let abilityChart = null; // ✨ 현재 활성화된 '능력치' 차트

// --- DOM 요소 ---
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const $logo = $("#logo");
const $headerSearchInput = $("#header-search-input");
const $openNewContentModalBtn = $("#open-new-content-modal-btn");
const $newContentBtnText = $("#new-content-btn-text");

// ✨ 메인 뷰
const $podCommunityView = $("#pod-community-view");
const $userSearchView = $("#user-search-view");

// ✨ 메인 탐색 탭
const $navMainPods = $("#nav-main-pods");
const $navMainUsers = $("#nav-main-users");

// 팟/커뮤니티 사이드바
const $galleryNavContainer = $("#gallery-nav-container");
const $galleryNav = $("#gallery-nav");
const $mainContentTitle = $("#main-content-title");
const $postListContainer = $("#post-list-container");
const $loadingPlaceholder = $("#loading-placeholder");

// ✨ 유저 검색 사이드바
const $skillNavContainer = $("#skill-nav-container");
const $skillCategoryList = $("#skill-category-list");

// ✨ 유저 검색 메인
const $userSearchTabSkill = $("#user-search-tab-skill"); // ✨ 탭 버튼
const $userSearchTabName = $("#user-search-tab-name");   // ✨ 탭 버튼
const $userSearchTabRecommend = $("#user-search-tab-recommend"); // ✨ [신규] 팀원 추천 탭 버튼
const $userSearchTitle = $("#user-search-title");
const $userSearchDescription = $("#user-search-description"); // ✨ 설명 추가
const $skillSearchContainer = $("#skill-search-container"); // ✨ 스킬 검색 컨테이너
const $skillSearchInput = $("#skill-search-input");
const $skillAutocompleteList = $("#skill-autocomplete-list");
const $nameSearchContainer = $("#name-search-container");   // ✨ 이름 검색 컨테이너
const $nameSearchInput = $("#name-search-input");         // ✨ 이름 검색 인풋
const $recommendationContainer = $("#recommendation-container"); // ✨ [신규] 팀원 추천 컨테이너
const $recommendationCategorySelect = $("#recommendation-category-select"); // ✨ [신규] 팀원 추천 드롭다운
const $userListContainer = $("#user-list-container");
const $userLoadingPlaceholder = $("#user-loading-placeholder");

// 인증
const $authButtonsContainer = $("#auth-buttons-container");

// 팟 상세 모달
const $postDetailModal = $("#post-detail-modal");
const $closeDetailModalBtn = $("#close-detail-modal-btn");
const $postDetailHeader = $("#post-detail-header");
const $postDetailContent = $("#post-detail-content");
const $postDetailMeta = $("#post-detail-meta");
const $postDetailActions = $("#post-detail-actions");

// 새 팟 모집 모달
const $newPostModal = $("#new-post-modal");
const $newPostForm = $("#new-post-form");
const $closeNewPostModalBtn = $("#close-new-post-modal-btn");
const $newPostGallerySelect = $("#new-post-gallery");

// 커뮤니티 새 글 모달
const $newCommunityModal = $("#new-community-modal");
const $communityForm = $("#community-form");
const $closeNewCommunityModalBtn = $("#close-new-community-modal");

// 커뮤니티 상세 모달
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
const $communityDetailDeleteBtn = $("#community-detail-delete-btn");

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

// 프로필 관련 DOM
const $profileModal = $("#profile-modal");
const $closeProfileModal = $("#close-profile-modal");
const $profileView = $("#profile-view");
const $profileEdit = $("#profile-edit");
const $editProfileBtn = $("#edit-profile-btn");
const $sendDmBtn = $("#send-dm-btn");
const $cancelEditProfileBtn = $("#cancel-edit-profile-btn");
const $profilePictureInput = $("#profile-picture-input");
const $profileEditPicturePreview = $("#profile-edit-picture-preview");
const $profilePreviewPopup = $("#profile-preview-popup");

// ✨ 프로필 - 스킬 차트 DOM
const $skillChartContainer = $("#skill-chart-container");
const $skillChartCanvas = $("#skill-chart");
const $skillChartPlaceholder = $("#skill-chart-placeholder");

// ✨ 프로필 - 스킬 편집 DOM
const $profileEditSkills = $("#profile-edit-skills");

// ✨ 프로필 - 능력치 차트 DOM (신규)
const $abilityCategoryButtons = $("#ability-category-buttons");
const $abilityRadarChart = $("#ability-radar-chart");


// 공용 모달
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
            lucide.createIcons();
        } catch (error) {
            console.error('Error creating lucide icons:', error);
        }
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

// ✨ 스킬 카테고리 색상 매핑 (차트용)
function getSkillCategoryColor(categoryName) {
    const colors = {
        hackathon: 'rgba(236, 72, 153, 0.7)', // Pink
        ctf: 'rgba(239, 68, 68, 0.7)', // Red
        algorithm: 'rgba(59, 130, 246, 0.7)', // Blue
        ai: 'rgba(168, 85, 247, 0.7)', // Purple
        planning: 'rgba(34, 197, 94, 0.7)', // Green
        design: 'rgba(249, 115, 22, 0.7)', // Orange
        engineering: 'rgba(107, 114, 128, 0.7)', // Gray
    };
    return colors[categoryName] || 'rgba(236, 72, 153, 0.7)';
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

function openNewPostModal() {
    if (!currentUser) {
        customAlert("로그인이 필요한 기능입니다.");
        openLoginModal();
        return;
    }
    populateNewPostGalleryOptions(false);
    $newPostModal.classList.remove('hidden');
}
function closeNewPostModal() {
    $newPostModal.classList.add('hidden');
    $newPostForm.reset();
}

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

function closeDetailModal() {
    $postDetailModal.classList.add('hidden');
    selectedPost = null;
}

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

// 프로필 모달 제어
function openProfileModal(userId, isOwnProfile = false) {
    $profileModal.classList.remove('hidden');
    $profileView.classList.remove('hidden');
    $profileEdit.classList.add('hidden');
    
    // ✨ (수정) DM 버튼 및 프로필 수정 버튼 제어
    if (isOwnProfile) {
        $editProfileBtn.classList.remove('hidden');
        $sendDmBtn.classList.add('hidden'); // 자신에게는 DM 버튼 숨김
    } else {
        $editProfileBtn.classList.add('hidden');
        $sendDmBtn.classList.remove('hidden'); // 타인에게는 DM 버튼 표시
    }
    
    loadUserProfile(userId); // 스킬 차트 렌더링 포함
    
    // ✨ 능력치 차트 초기 렌더링 (신규)
    renderAbilityButtons(); // 버튼 생성
    // (데이터 로드는 loadUserProfile에서 처리)
}

function closeProfileModal() {
    $profileModal.classList.add('hidden');
    $profileView.classList.remove('hidden');
    $profileEdit.classList.add('hidden');
    currentProfileData = null; // 데이터 초기화
    
    // 차트 파괴
    if (currentSkillChart) {
        currentSkillChart.destroy();
        currentSkillChart = null;
    }
    // ✨ 능력치 차트 파괴 (신규)
    if (abilityChart) {
        abilityChart.destroy();
        abilityChart = null;
    }
}

function showProfileEditMode() {
    if (!currentProfileData) return; // 데이터 없으면 실행 안 함
    
    $profileView.classList.add('hidden');
    $profileEdit.classList.remove('hidden');
    
    // 현재 프로필 정보로 폼 채우기
    $("#profile-edit-display-name").value = currentProfileData.display_name;
    const currentStudentId = currentProfileData.student_id;
    $("#profile-edit-student-id").value = currentStudentId && !currentStudentId.includes('미설정') ? currentStudentId : '';
    const currentBio = currentProfileData.bio;
    $("#profile-edit-bio").value = currentBio && !currentBio.includes('소개가 없습니다') ? currentBio : '';
    $profileEditPicturePreview.src = currentProfileData.profile_picture;
    
    // ✨ 스킬 편집기 채우기
    renderProfileSkillEditor(currentProfileData.skill_weights);
}

function cancelProfileEdit() {
    $profileView.classList.remove('hidden');
    $profileEdit.classList.add('hidden');
    $profileEdit.reset();
    // 스킬 편집기 내용도 초기화
    $profileEditSkills.innerHTML = '<p class="text-gray-500 text-center">스킬 목록을 불러오는 중...</p>';
}

// 프로필 미리보기 팝업
function showProfilePreview(userId, element) {
    clearTimeout(profilePreviewTimeout);
    currentPreviewUserId = userId;
    
    profilePreviewTimeout = setTimeout(async () => {
        const popup = $profilePreviewPopup; // 팝업 요소
        try {
            const response = await fetch(`/api/profile/${userId}`);
            if (!response.ok) return;
            
            const profile = await response.json();
            
            $("#preview-picture").src = profile.profile_picture;
            $("#preview-display-name").textContent = profile.display_name;
            $("#preview-username").textContent = `@${profile.username}`;
            $("#preview-bio").textContent = profile.bio || '소개가 없습니다.';
            $("#preview-posts").textContent = profile.total_posts || 0;
            $("#preview-community").textContent = profile.total_community_posts || 0;
            $("#preview-comments").textContent = profile.total_comments || 0;
            
            // --- ✨ 위치 계산 로직 수정 ---
            const rect = element.getBoundingClientRect(); // 앵커 요소(마우스 올린 곳)의 뷰포트 기준 위치
            
            // 1. 팝업을 'hidden'에서 'visible'로 바꾸되, 화면 밖으로 보내서 실제 크기를 측정
            popup.style.visibility = 'hidden';
            popup.style.top = '-9999px';
            popup.style.left = '-9999px';
            popup.classList.remove('hidden'); // hidden 클래스 제거 (opacity/transform에 영향)
            
            const popupRect = popup.getBoundingClientRect(); // 팝업의 실제 크기
            const popupWidth = popupRect.width;
            const popupHeight = popupRect.height;
            
            const margin = 10; // 앵커 요소와의 간격
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // 2. Y축(top) 위치 계산
            let newTop;
            // 앵커 요소 아래에 공간이 충분한지 확인
            if (rect.bottom + margin + popupHeight < viewportHeight) {
                newTop = rect.bottom + margin; // 앵커 아래에 표시
            } 
            // 앵커 요소 위에 공간이 충분한지 확인
            else if (rect.top - margin - popupHeight > 0) {
                newTop = rect.top - popupHeight - margin; // 앵커 위에 표시
            } 
            // 위/아래 모두 공간이 부족할 경우 (팝업이 뷰포트보다 클 경우 등)
            else {
                newTop = viewportHeight - popupHeight - margin; // 뷰포트 하단에 고정 (최소한 보이도록)
            }

            // 3. X축(left) 위치 계산
            let newLeft;
            // 앵커 요소 왼쪽에 공간이 충분한지 확인
            if (rect.left + popupWidth < viewportWidth) {
                newLeft = rect.left; // 앵커 왼쪽에 맞춰 표시
            } 
            // 앵커 요소 오른쪽에 공간이 충분한지 확인 (앵커 오른쪽 끝 - 팝업 너비)
            else if (rect.right - popupWidth > 0) {
                newLeft = rect.right - popupWidth; // 앵커 오른쪽에 맞춰 표시
            } 
            // 양쪽 모두 공간이 부족할 경우
            else {
                newLeft = viewportWidth - popupWidth - margin; // 뷰포트 우측에 고정
            }

            // 4. 화면 모서리를 벗어나지 않도록 최종 보정
            if (newTop < margin) newTop = margin;
            if (newLeft < margin) newLeft = margin;

            // 5. 계산된 위치 적용 및 팝업 보이기
            popup.style.top = `${newTop}px`;
            popup.style.left = `${newLeft}px`;
            popup.style.visibility = 'visible'; // 이제 보이도록 설정

        } catch (error) {
            console.error('Profile preview error:', error);
            popup.classList.add('hidden'); // 에러 시 다시 숨김
            popup.style.visibility = ''; // 스타일 초기화
        }
    }, 500); // 0.5초 후 표시
}

function hideProfilePreview() {
    clearTimeout(profilePreviewTimeout);
    currentPreviewUserId = null;
    $profilePreviewPopup.classList.add('hidden');
    
    // ✨ 팝업 위치 및 가시성 스타일 초기화 (다음 'show'에서 크기 측정이 꼬이지 않도록)
    $profilePreviewPopup.style.top = '';
    $profilePreviewPopup.style.left = '';
    $profilePreviewPopup.style.visibility = '';
}

// --- 렌더링 함수 ---

// ✨ (신규) 메인 뷰 전환
function handleMainViewSwitch(event) {
    const viewName = event.currentTarget.dataset.view;
    if (viewName === currentView) return; // 이미 활성화된 뷰

    currentView = viewName;

    // 모든 버튼 비활성화
    $$('.main-nav-btn').forEach(btn => {
        btn.classList.remove('bg-gradient-to-r', 'from-pink-600', 'to-pink-500', 'text-white', 'shadow-lg', 'shadow-pink-600/30');
        btn.classList.add('text-gray-300', 'hover:bg-gray-800/50', 'hover:text-pink-400');
    });

    if (viewName === 'pods') {
        // 팟/커뮤니티 뷰 활성화
        $navMainPods.classList.add('bg-gradient-to-r', 'from-pink-600', 'to-pink-500', 'text-white', 'shadow-lg', 'shadow-pink-600/30');
        $navMainPods.classList.remove('text-gray-300', 'hover:bg-gray-800/50', 'hover:text-pink-400');
        
        $podCommunityView.classList.remove('hidden');
        $galleryNavContainer.classList.remove('hidden');
        $userSearchView.classList.add('hidden');
        $skillNavContainer.classList.add('hidden');
        
        $headerSearchInput.placeholder = "팟/커뮤니티 검색...";
        isFirstPostLoad = true; // 강제 새로고침
        handleNavClick(null, null); // 팟/커뮤니티 뷰의 기본 상태(전체보기)로 로드

    } else if (viewName === 'users') {
        // 유저 찾기 뷰 활성화
        $navMainUsers.classList.add('bg-gradient-to-r', 'from-pink-600', 'to-pink-500', 'text-white', 'shadow-lg', 'shadow-pink-600/30');
        $navMainUsers.classList.remove('text-gray-300', 'hover:bg-gray-800/50', 'hover:text-pink-400');

        $podCommunityView.classList.add('hidden');
        $galleryNavContainer.classList.add('hidden');
        $userSearchView.classList.remove('hidden');
        // $skillNavContainer는 userSearchMode에 따라 제어되므로 여기서 바꾸지 않음

        $headerSearchInput.placeholder = "헤더 검색은 팟/커뮤니티 전용입니다.";
        
        // ✨ 유저 뷰 전환 시 기본 '스킬로 찾기' 모드로 로드 및 데이터 로드
        switchUserSearchMode('skill'); // 기본 모드 설정
        // handleSkillCategoryClick(null, null); // switchUserSearchMode에서 호출됨
    }
}


function renderAuthButtons() {
    let html = '';
    if (currentUser) {
        html = `
            <div class="relative profile-trigger cursor-pointer" data-user-id="${currentUser.user_id}">
                <div class="flex items-center gap-2 hover:bg-gray-800 px-3 py-2 rounded-lg transition">
                    <img src="${currentUser.profile_picture}" alt="프로필" class="w-8 h-8 rounded-full border-2 border-pink-600 object-cover">
                    <span class="text-sm text-gray-300 hidden md:block"><strong>${currentUser.display_name}</strong>님</span>
                </div>
            </div>
            <button id="logout-btn" class="text-gray-400 hover:text-pink-400 font-bold px-3 py-2 rounded-lg hover:bg-gray-800 transition">로그아웃</button>
        `;
        $openChatListBtn.classList.remove('hidden');
        $commentForm.classList.remove('hidden');
    } else {
        html = `
            <button id="open-login-modal-btn" class="text-white hover:text-pink-400 font-bold px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                로그인 / 회원가입
            </button>
        `;
        $openChatListBtn.classList.add('hidden');
        $commentForm.classList.add('hidden');
    }
    $authButtonsContainer.innerHTML = html;

    if (currentUser) {
        $('#logout-btn').addEventListener('click', handleLogout);
        
        const profileTrigger = $('.profile-trigger');
        if (profileTrigger) {
            profileTrigger.addEventListener('mouseenter', (e) => {
                showProfilePreview(currentUser.user_id, e.currentTarget);
            });
            profileTrigger.addEventListener('mouseleave', hideProfilePreview);
            profileTrigger.addEventListener('click', () => {
                hideProfilePreview();
                openProfileModal(currentUser.user_id, true);
            });
        }
    } else {
        $('#open-login-modal-btn').addEventListener('click', openLoginModal);
    }
    
    setTimeout(createIconsSafe, 0);
}

// 팟/커뮤니티 사이드바 렌더링
function renderSidebar() {
    let html = `
        <button
            data-gallery-id="null"
            class="gallery-nav-btn w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 font-bold ${
                selectedGallery === null
                    ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-600/30'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-pink-400'
            }"
        >
            <i data-lucide="layout-grid" class="w-5 h-5"></i>
            전체 보기
        </button>
    `;

    // allGalleries에는 'community'가 포함되어 있음
    allGalleries.forEach(gallery => {
        const isCommunity = gallery.id === 'community';
        const extraClasses = isCommunity ? 'mt-4 pt-4 border-t border-gray-700' : '';
        const isSelected = selectedGallery === gallery.id;

        html += `
            <button
                data-gallery-id="${gallery.id}"
                class="gallery-nav-btn w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 font-bold ${extraClasses} ${
                    isSelected
                        ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-600/30'
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-pink-400'
                }"
            >
                <i data-lucide="${gallery.icon}" class="w-5 h-5"></i>
                ${gallery.name}
            </button>
        `;
    });

    $galleryNav.innerHTML = html;
    updateNewContentButtonText();
    setTimeout(createIconsSafe, 0);
}

// ✨ (신규) 유저 스킬 사이드바 렌더링
function renderSkillCategories() {
    let html = `
        <button
            data-skill="null"
            class="skill-nav-btn w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 font-bold ${
                selectedSkill === null
                    ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-600/30'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-pink-400'
            }"
        >
            <i data-lucide="users" class="w-5 h-5"></i>
            전체 분야
        </button>
    `;
    
    for (const [key, skills] of Object.entries(allSkillCategories)) {
         html += `<h4 class="font-bold text-sm text-pink-400 mt-3 mb-1 px-4 capitalize">${key}</h4>`;
         skills.forEach(skill => {
            const isSelected = selectedSkill === skill;
            html += `
                <button
                    data-skill="${skill}"
                    class="skill-nav-btn w-full text-left px-4 py-2 rounded-lg transition flex items-center gap-3 font-medium text-sm ${
                        isSelected
                            ? 'bg-pink-900/50 text-pink-400'
                            : 'text-gray-400 hover:bg-gray-800/50 hover:text-pink-400'
                    }"
                >
                    ${skill}
                </button>
            `;
         });
    }
    $skillCategoryList.innerHTML = html;
    setTimeout(createIconsSafe, 0);
}


function updateNewContentButtonText() {
    if (currentView === 'users') {
        $newContentBtnText.textContent = "유저 찾기";
        $openNewContentModalBtn.classList.add('hidden'); // 유저 찾기 뷰에서는 새 글쓰기 버튼 숨김
        return;
    }
    
    $openNewContentModalBtn.classList.remove('hidden');
    if (selectedGallery === null) {
        $newContentBtnText.textContent = "새 글쓰기";
    } else if (selectedGallery === 'community') {
        $newContentBtnText.textContent = "글작성";
    } else {
        $newContentBtnText.textContent = "팟 모집";
    }
}

function populateNewPostGalleryOptions(includeCommunity = false) {
     let optionsHtml = '<option value="">카테고리를 선택하세요</option>';
     allGalleries.forEach(gallery => {
        if (!includeCommunity && gallery.id === 'community') {
            return;
        }
        // '팟' 카테고리만 필터링 (커뮤니티 제외)
        if (gallery.id !== 'community') {
            optionsHtml += `<option value="${gallery.id}">${gallery.name}</option>`;
        }
     });
     $newPostGallerySelect.innerHTML = optionsHtml;
}

// ✨ [신규] 팀원 추천 - 대회 분야 드롭다운 채우기
function populateRecommendationCategories() {
    if (!allSkillCategories || Object.keys(allSkillCategories).length === 0) return;
    
    let optionsHtml = '<option value="">분야를 선택하세요</option>';
    for (const category in allSkillCategories) {
        optionsHtml += `<option value="${category}">${category.charAt(0).toUpperCase() + category.slice(1)}</option>`;
    }
    $recommendationCategorySelect.innerHTML = optionsHtml;
}


// 작성자 링크에 프로필 이벤트 추가
function attachProfileEvents() {
    $$('.author-link').forEach(link => {
        const userId = link.dataset.userId;
        if (!userId) return;

        // 기존 이벤트 리스너 제거 (중복 방지)
        link.replaceWith(link.cloneNode(true));
    });

    // 새롭게 복제된 노드에 이벤트 리스너 추가
    $$('.author-link').forEach(link => {
        const userId = link.dataset.userId;
        if (!userId) return;

        link.addEventListener('mouseenter', (e) => {
            showProfilePreview(userId, e.currentTarget);
        });
        link.addEventListener('mouseleave', hideProfilePreview);
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            hideProfilePreview();
            openProfileModal(userId, currentUser && currentUser.user_id == userId);
        });
    });
    
    // ✨ (신규) DM 버튼 이벤트 연결
    $$('.dm-btn').forEach(btn => {
        // 중복 방지 (cloneNode 방식은 버튼에는 부적절할 수 있으므로, 플래그로 확인)
        if (btn.dataset.listenerAttached) return;
        btn.dataset.listenerAttached = 'true';
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const recipientId = e.currentTarget.dataset.userId;
            handleCreateDM(recipientId);
        });
    });
}

// 팟 목록 렌더링
function renderPostList() {
    const filteredPosts = allPosts.filter(post => {
        if (post.gallery === 'community') return false;

        const matchesGallery = !selectedGallery || post.gallery === selectedGallery;
        const matchesSearch = !headerSearchTerm ||
            post.title.toLowerCase().includes(headerSearchTerm.toLowerCase()) ||
            post.content.toLowerCase().includes(headerSearchTerm.toLowerCase()) ||
            post.author_display_name.toLowerCase().includes(headerSearchTerm.toLowerCase());
        return matchesGallery && matchesSearch;
    });

    $mainContentTitle.textContent = selectedGallery
        ? getGalleryById(selectedGallery).name
        : '전체 팟 모집';

    updateNewContentButtonText();

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
                <img src="${post.author_profile_picture}" alt="${post.author_display_name}" 
                    class="w-12 h-12 rounded-full border-2 border-pink-600 object-cover flex-shrink-0 author-link cursor-pointer" data-user-id="${post.user_id}">
                <div class="flex-1 min-w-0">
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
                        <span class="text-xs text-gray-400 author-link hover:text-pink-400 transition cursor-pointer" data-user-id="${post.user_id}">${post.author_display_name}</span>
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
                        <span class="flex items-center gap-1 ${isLiked ? 'text-pink-500 font-bold' : 'text-pink-400'}">
                            <i data-lucide="thumbs-up" class="w-4 h-4 ${isLiked ? 'fill-current' : ''}"></i>
                            ${post.likes}
                        </span>
                    </div>
                </div>
            </div>
        `;

        postElement.addEventListener('click', (e) => {
            if (!e.target.closest('.author-link')) {
                handleOpenPost(post.id);
            }
        });
        $postListContainer.appendChild(postElement);
    });

    setTimeout(() => {
        createIconsSafe();
        attachProfileEvents();
    }, 0);
}

// 커뮤니티 목록 렌더링
function renderCommunityPostList() {
    const filteredPosts = allCommunityPosts.filter(post => {
        const matchesSearch = !headerSearchTerm ||
            post.title.toLowerCase().includes(headerSearchTerm.toLowerCase()) ||
            post.content.toLowerCase().includes(headerSearchTerm.toLowerCase()) ||
            post.author_display_name.toLowerCase().includes(headerSearchTerm.toLowerCase());
        return matchesSearch;
    });

    $mainContentTitle.textContent = "커뮤니티";
    updateNewContentButtonText();

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
        postElement.dataset.communityPostId = post.id;

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
                        <img src="${post.author_profile_picture}" alt="${post.author_display_name}" 
                            class="w-6 h-6 rounded-full border border-pink-600 object-cover author-link cursor-pointer" data-user-id="${post.user_id}">
                        <span class="text-xs text-gray-400 author-link hover:text-pink-400 transition cursor-pointer" data-user-id="${post.user_id}">${post.author_display_name}</span>
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

        postElement.addEventListener('click', (e) => {
            if (!e.target.closest('.author-link')) {
                handleOpenCommunityPost(post.id);
            }
        });
        $postListContainer.appendChild(postElement);
    });

    setTimeout(() => {
        createIconsSafe();
        attachProfileEvents();
    }, 0);
}

// ✨ (수정) 유저 목록 렌더링
function renderUserList(users) {
    if (!users || users.length === 0) {
        // ✨ 모드에 따라 메시지 변경
        const message = userSearchMode === 'recommend' ? '추천할 팀원이 없습니다.' : '검색 결과가 없습니다.';
        $userListContainer.innerHTML = `<div class="p-12 text-center text-gray-500">${message}</div>`;
        return;
    }

    $userListContainer.innerHTML = '';
    
    users.forEach(user => {
        // ✨ (수정) 유저 목록 클릭 시 프로필 모달이 열리도록 .author-link 클래스 추가
        const userElement = document.createElement('div');
        userElement.className = "p-5 hover:bg-gray-800/50 transition cursor-pointer author-link";
        userElement.dataset.userId = user.id;

        // 해당 스킬의 가중치 찾기 (선택된 스킬이 있을 경우)
        let skillValue = 0;
        // ✨ 이름/추천 검색 모드에서는 selectedSkill이 null이므로 스킬 값 표시 안 함
        if (userSearchMode === 'skill' && selectedSkill && user.skill_weights && user.skill_weights[selectedSkill]) {
            skillValue = user.skill_weights[selectedSkill];
        }

        userElement.innerHTML = `
            <div class="flex items-center gap-4">
                <img src="${user.profile_picture}" alt="${user.display_name}" 
                    class="w-16 h-16 rounded-full border-2 border-pink-600 object-cover flex-shrink-0">
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-lg text-white hover:text-pink-400 transition truncate">${user.display_name}</h3>
                    <p class="text-sm text-gray-400 mb-2 truncate">@${user.username}</p>
                    <p class="text-sm text-gray-500 line-clamp-2">${user.bio || '소개가 없습니다.'}</p>
                </div>
                ${userSearchMode === 'skill' && selectedSkill ? `
                    <div class="flex-shrink-0 text-center">
                        <p class="text-xs text-pink-400">${selectedSkill}</p>
                        <p class="text-3xl font-bold text-pink-500">${skillValue}</p>
                    </div>
                ` : `
                    <div class="flex-shrink-0 text-center">
                        ${currentUser && currentUser.user_id !== user.id ? `
                        <button 
                            class="dm-btn bg-gray-800 text-white py-2 px-4 rounded-xl hover:bg-gray-700 transition font-bold text-sm flex items-center justify-center gap-2 border-2 border-gray-700"
                            data-user-id="${user.id}"
                        >
                            <i data-lucide="message-circle" class="w-4 h-4"></i>
                            DM
                        </button>
                        ` : ''}
                    </div>
                `}
            </div>
        `;
        $userListContainer.appendChild(userElement);
    });
    
    // 유저 목록에도 프로필 이벤트 연결 (DM 버튼 포함)
    setTimeout(() => {
        createIconsSafe();
        attachProfileEvents();
    }, 0);
}

// ✨ [신규] 추천 유저 목록 렌더링 (추천 사유 포함)
function renderRecommendedUsers(recommendations) {
     if (!recommendations || recommendations.length === 0) {
        $userListContainer.innerHTML = `<div class="p-12 text-center text-gray-500">추천할 팀원이 없습니다. 스킬을 더 등록해보세요!</div>`;
        return;
    }

    $userListContainer.innerHTML = '';
    
    recommendations.forEach(rec => {
        const user = rec.user_profile;
        const reasons = rec.reasons;
        
        const userElement = document.createElement('div');
        userElement.className = "p-5 hover:bg-gray-800/50 transition cursor-pointer author-link";
        userElement.dataset.userId = user.id;

        // 추천 사유 HTML 생성
        let reasonsHtml = reasons.map(reason => `
            <span class="text-xs px-2 py-1 bg-pink-900/50 text-pink-400 rounded-full border border-pink-600/30">
                ✨ ${reason.skill} (${reason.score})
            </span>
        `).join(' ');

        userElement.innerHTML = `
            <div class="flex items-center gap-4">
                <img src="${user.profile_picture}" alt="${user.display_name}" 
                    class="w-16 h-16 rounded-full border-2 border-pink-600 object-cover flex-shrink-0">
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-lg text-white hover:text-pink-400 transition truncate">${user.display_name}</h3>
                    <p class="text-sm text-gray-400 mb-2 truncate">@${user.username}</p>
                    <p class="text-sm text-gray-500 line-clamp-2">${user.bio || '소개가 없습니다.'}</p>
                    <div class="mt-2 flex flex-wrap gap-2">
                        ${reasonsHtml}
                    </div>
                </div>
                <div class="flex-shrink-0 text-center">
                    ${currentUser && currentUser.user_id !== user.id ? `
                    <button 
                        class="dm-btn bg-gray-800 text-white py-2 px-4 rounded-xl hover:bg-gray-700 transition font-bold text-sm flex items-center justify-center gap-2 border-2 border-gray-700"
                        data-user-id="${user.id}"
                    >
                        <i data-lucide="message-circle" class="w-4 h-4"></i>
                        DM
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        $userListContainer.appendChild(userElement);
    });
    
    // 유저 목록에도 프로필 이벤트 연결 (DM 버튼 포함)
    setTimeout(() => {
        createIconsSafe();
        attachProfileEvents();
    }, 0);
}


// 팟 상세 모달 렌더링
function renderPostDetailModal() {
    if (!selectedPost) return;

    const post = selectedPost;
    const gallery = getGalleryById(post.gallery);
    const isLiked = selectedPost.liked_by_user;
    const hasJoined = selectedPost.has_joined;

    $postDetailHeader.innerHTML = `
        <div class="flex items-center gap-3 mb-3">
            <img src="${post.author_profile_picture}" alt="${post.author_display_name}" 
                class="w-12 h-12 rounded-full border-2 border-pink-600 object-cover author-link cursor-pointer" data-user-id="${post.user_id}">
            <div>
                <span class="author-link text-white hover:text-pink-400 cursor-pointer font-bold" data-user-id="${post.user_id}">${post.author_display_name}</span>
                <p class="text-xs text-gray-400">${formatTimeAgo(post.timestamp)}</p>
            </div>
        </div>
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
                // 참가자 목록에서 본인(작성자)은 제외
                if (p.user_id === post.user_id) return;
                
                actionButtonsHTML += `
                    <li class="flex items-center justify-between p-2 rounded bg-gray-800">
                        <span class="text-white font-medium author-link cursor-pointer" data-user-id="${p.user_id}">${p.username}</span>
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
    
    setTimeout(() => {
        createIconsSafe();
        attachProfileEvents();
    }, 0);

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

// 커뮤니티 상세 모달 렌더링
function renderCommunityDetailModal(post) {
    $communityDetailTitle.textContent = post.title;
    $communityDetailAuthor.innerHTML = `
        <img src="${post.author_profile_picture}" alt="${post.author_display_name}" 
            class="w-6 h-6 rounded-full border border-pink-600 object-cover inline-block mr-2 author-link cursor-pointer" data-user-id="${post.user_id}">
        <span class="author-link cursor-pointer hover:text-pink-400 transition" data-user-id="${post.user_id}">${post.author_display_name}</span>
    `;
    $communityDetailTimestamp.textContent = formatTimeAgo(post.timestamp);
    $communityDetailViews.innerHTML = `<i data-lucide="eye" class="w-4 h-4"></i> ${post.views}`;

    if (post.image_url) {
        $communityDetailImage.src = post.image_url;
        $communityDetailImage.classList.remove('hidden');
    } else {
        $communityDetailImage.classList.add('hidden');
    }

    $communityDetailContent.textContent = post.content;

    renderCommunityComments(post.comments);
    
    if (currentUser && currentUser.user_id === post.user_id) {
        $communityDetailDeleteBtn.classList.remove('hidden');
        $communityDetailDeleteBtn.onclick = () => handleDeleteCommunityPost(post.id);
    } else {
        $communityDetailDeleteBtn.classList.add('hidden');
        $communityDetailDeleteBtn.onclick = null;
    }
    
    if (currentUser) {
        $commentForm.classList.remove('hidden');
    } else {
        $commentForm.classList.add('hidden');
    }

    setTimeout(() => {
        createIconsSafe();
        attachProfileEvents();
    }, 0);
}

// 커뮤니티 댓글 목록 렌더링
function renderCommunityComments(comments) {
    if (!comments || comments.length === 0) {
        $communityDetailCommentList.innerHTML = '<p class="text-gray-500 text-sm">아직 댓글이 없습니다.</p>';
        return;
    }

    $communityDetailCommentList.innerHTML = comments.map(comment => `
        <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700 comment-item">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <img src="${comment.author_profile_picture}" alt="${comment.author_display_name}" 
                        class="w-6 h-6 rounded-full border border-pink-600 object-cover author-link cursor-pointer" data-user-id="${comment.user_id}">
                    <span class="font-bold text-white author-link cursor-pointer hover:text-pink-400 transition" data-user-id="${comment.user_id}">${comment.author_display_name}</span>
                </div>
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

    $$('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const commentId = e.currentTarget.dataset.commentId;
            handleDeleteComment(commentId);
        });
    });

    setTimeout(() => {
        createIconsSafe();
        attachProfileEvents();
    }, 0);
}

// 채팅 관련 렌더링 함수들
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
        
        // ✨ DM일 경우 (post_title == 'Direct Message') 다른 스타일 적용
        const isDM = chatroom.post_title === 'Direct Message';
        
        chatroomElement.innerHTML = `
            <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="font-bold text-white truncate">${chatroom.other_user_name}</h3>
                        ${chatroom.unread_count > 0 ? `<span class="bg-pink-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">${chatroom.unread_count}</span>` : ''}
                    </div>
                    <p class="text-xs ${isDM ? 'text-pink-400' : 'text-gray-400'} mb-2 truncate">
                        ${isDM ? '<i data-lucide="message-circle" class="w-3 h-3 inline-block"></i> Direct Message' : chatroom.post_title}
                    </p>
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
    setTimeout(createIconsSafe, 0);
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
        setTimeout(createIconsSafe, 0);
        return;
    }
    $chatMessagesContainer.innerHTML = '';
    messages.forEach(message => {
        renderSingleMessage(message);
    });
    $chatMessagesContainer.scrollTop = $chatMessagesContainer.scrollHeight;
}

function renderSingleMessage(message) {
    const messageElement = document.createElement('div');
    if (message.is_system_message) {
        messageElement.className = 'flex justify-center';
        messageElement.innerHTML = `<div class="text-center text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full my-2">${message.content}</div>`;
    } else {
        const isMine = message.sender_id === currentUser.user_id;
        messageElement.className = `flex ${isMine ? 'justify-end' : 'justify-start'}`;
        messageElement.innerHTML = `
            <div class="max-w-[70%]">
                ${!isMine ? `<p class="text-xs text-gray-400 mb-1 author-link cursor-pointer" data-user-id="${message.sender_id}">${message.sender_name}</p>` : ''}
                <div class="rounded-lg p-3 ${isMine ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white' : 'bg-gray-800 text-gray-300'}">
                    <p class="text-base whitespace-pre-wrap break-words">${message.content}</p>
                </div>
                <p class="text-xs text-gray-500 mt-1 ${isMine ? 'text-right' : 'text-left'}">${formatChatTime(message.timestamp)}</p>
            </div>
        `;
    }
    $chatMessagesContainer.appendChild(messageElement);
    $chatMessagesContainer.scrollTop = $chatMessagesContainer.scrollHeight;

    if (!message.is_system_message) {
        setTimeout(attachProfileEvents, 0);
    }
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

// ✨ (신규) '주요 스킬' 차트 렌더링
function renderSkillChart(skillWeights) {
    if (currentSkillChart) {
        currentSkillChart.destroy();
        currentSkillChart = null;
    }

    const validSkills = skillWeights ? Object.entries(skillWeights)
        .filter(([, weight]) => weight > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 7) // 상위 7개
        : [];

    if (validSkills.length === 0) {
        $skillChartPlaceholder.classList.remove('hidden');
        $skillChartCanvas.classList.add('hidden');
        return;
    }

    $skillChartPlaceholder.classList.add('hidden');
    $skillChartCanvas.classList.remove('hidden');

    const labels = validSkills.map(([skill]) => skill);
    const data = validSkills.map(([, weight]) => weight);

    const ctx = $skillChartCanvas.getContext('2d');
    currentSkillChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '스킬 숙련도',
                data: data,
                backgroundColor: 'rgba(236, 72, 153, 0.2)', // Pink 500 with alpha
                borderColor: 'rgba(236, 72, 153, 1)', // Pink 500
                borderWidth: 2,
                pointBackgroundColor: 'rgba(236, 72, 153, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(236, 72, 153, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    display: false // 레이더 차트에서는 라벨이 겹칠 수 있으므로 숨김
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${context.raw}`
                    }
                }
            },
            scales: {
                r: {
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.2)' // 그리드 라인 (방사형)
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)' // 그리드 라인 (원형)
                    },
                    pointLabels: {
                        color: '#fff', // 스킬 이름
                        font: {
                            size: 12,
                            family: 'Pretendard, sans-serif'
                        }
                    },
                    ticks: {
                        color: '#000', // 눈금 숫자 (배경색과 동일하게)
                        backdropColor: 'rgba(0, 0, 0, 0)', // 눈금 배경
                        stepSize: 20,
                        font: {
                            size: 10
                        }
                    },
                    min: 0,
                    max: 100
                }
            }
        }
    });
}

// ✨ (신규) '능력치 차트' 버튼 렌더링
function renderAbilityButtons() {
    const container = $abilityCategoryButtons;
    if (!container) return;
    
    let html = "";
    Object.keys(abilityCategories).forEach(cat => {
        html += `
            <button 
                data-category="${cat}" 
                class="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-gray-800 text-gray-300 font-bold hover:bg-pink-600 hover:text-white transition text-xs md:text-sm"> 
                ${cat.toUpperCase()} 
            </button>
        `;
    });
    container.innerHTML = html;

    container.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
            const cat = btn.dataset.category;
            // ✨ (수정) DB의 skill_weights 데이터로 차트 렌더링
            renderAbilityChart(cat, currentProfileData.skill_weights); 
            
            container.querySelectorAll("button").forEach(b => b.classList.remove("bg-pink-600", "text-white"));
            btn.classList.add("bg-pink-600", "text-white");
        });
    });
}

// ✨ (수정) '능력치 차트' 렌더링 (skill_weights 데이터 사용)
function renderAbilityChart(category, skillWeights) {
    const labels = abilityCategories[category]; // 이 카테고리의 스킬 목록 (e.g., ["웹", "프론트엔드", ...])
    
    let values = [];
    
    // DB (skillWeights)에서 현재 카테고리(category)에 속하는 스킬들의 점수를 가져옴
    if (skillWeights) {
        // labels 배열 순서대로 값을 찾아서 매핑 (값이 없으면 0)
        values = labels.map(label => skillWeights[label] || 0);
    } else {
        // DB에 스킬 데이터가 없으면 모두 0으로 표시
        values = labels.map(() => 0);
    }

    const ctx = $abilityRadarChart.getContext("2d");

    if (abilityChart) abilityChart.destroy();

    abilityChart = new Chart(ctx, {
        type: "radar",
        data: {
            labels: labels,
            datasets: [{
                label: `${category.toUpperCase()} 능력치`,
                data: values, // ✨ skill_weights에서 가져온 값 사용
                backgroundColor: "rgba(236, 72, 153, 0.2)",
                borderColor: "rgba(236, 72, 153, 1)",
                borderWidth: 2,
                pointBackgroundColor: "rgba(236, 72, 153, 1)"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // 컨테이너에 맞게 조절
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: { 
                        stepSize: 20, 
                        color: "#aaa", // 눈금 숫자 색상
                        backdropColor: 'rgba(0, 0, 0, 0)' // 눈금 배경 투명
                    },
                    grid: { color: "rgba(255,255,255,0.2)" }, // 그리드 선
                    pointLabels: { 
                        color: "#fff", // 레이블(능력치 이름) 색상
                        font: { size: 12 }
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.2)' // 방사형 선
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}


// ✨ (신규) 프로필 편집 - 스킬 슬라이더 렌더링
function renderProfileSkillEditor(skillWeights) {
    if (!allSkillCategories || Object.keys(allSkillCategories).length === 0) {
        $profileEditSkills.innerHTML = '<p class="text-gray-500 text-center">스킬 목록을 불러오는 데 실패했습니다.</p>';
        return;
    }
    
    let html = '';
    for (const [category, skills] of Object.entries(allSkillCategories)) {
         html += `<div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h5 class="font-bold text-pink-400 mb-3 capitalize">${category}</h5>
                    <div class="space-y-3">`;
        
         skills.forEach(skill => {
            const value = (skillWeights && skillWeights[skill]) ? skillWeights[skill] : 0;
            html += `
                <div class="grid grid-cols-3 items-center gap-3">
                    <label for="skill-${skill}" class="text-sm text-gray-300 col-span-1 truncate">${skill}</label>
                    <input type="range" id="skill-${skill}" name="${skill}" min="0" max="100" value="${value}"
                           class="w-full col-span-2 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-pink"
                           oninput="this.nextElementSibling.textContent = this.value">
                    <span class="text-sm text-pink-500 font-bold -mt-3 text-right col-span-3 mr-1">${value}</span>
                </div>
            `;
         });
         
         html += `   </div>
                 </div>`;
    }
    $profileEditSkills.innerHTML = html;
}

// ✨ (신규) 스킬 검색 자동완성 렌더링
function renderSkillAutocomplete(term) {
    if (!term) {
        $skillAutocompleteList.classList.add('hidden');
        return;
    }
    
    const matchingSkills = allSkills.filter(skill => 
        skill.toLowerCase().includes(term.toLowerCase())
    );
    
    if (matchingSkills.length === 0) {
        $skillAutocompleteList.classList.add('hidden');
        return;
    }
    
    $skillAutocompleteList.innerHTML = matchingSkills.map(skill => `
        <div class="p-3 hover:bg-pink-600 hover:text-white cursor-pointer" data-skill="${skill}">
            ${skill}
        </div>
    `).join('');
    $skillAutocompleteList.classList.remove('hidden');
}


// --- 프로필/데이터 로드 함수 ---
async function loadUserProfile(userId) {
    try {
        const response = await fetch(`/api/profile/${userId}`);
        if (!response.ok) throw new Error('프로필을 불러올 수 없습니다.');
        
        const profile = await response.json();
        currentProfileData = profile; // ✨ 스킬 편집 및 능력치 차트를 위해 데이터 저장
        
        $("#profile-view-picture").src = profile.profile_picture;
        $("#profile-view-display-name").textContent = profile.display_name;
        $("#profile-view-username").textContent = `@${profile.username}`;
        $("#profile-view-student-id").textContent = profile.student_id || '학번 미설정';
        $("#profile-view-bio").textContent = profile.bio || '소개가 없습니다.';
        $("#profile-view-posts").textContent = profile.total_posts || 0;
        $("#profile-view-community-posts").textContent = profile.total_community_posts || 0;
        $("#profile-view-comments").textContent = profile.total_comments || 0;
        
        // ✨ '주요 스킬' 차트 렌더링
        renderSkillChart(profile.skill_weights);
        
        // ✨ (수정) '능력치' 차트 렌더링 (skill_weights 데이터 사용)
        renderAbilityChart("hackathon", profile.skill_weights); // 기본값 렌더링
        // 기본 버튼 활성화
        $$('#ability-category-buttons button').forEach(b => b.classList.remove("bg-pink-600", "text-white"));
        const defaultBtn = $abilityCategoryButtons.querySelector('button[data-category="hackathon"]');
        if(defaultBtn) defaultBtn.classList.add("bg-pink-600", "text-white");
        
    } catch (error) {
        console.error(error);
        customAlert(error.message);
        currentProfileData = null;
    }
}

// ✨ (수정) 프로필 업데이트 (스킬 포함)
async function handleUpdateProfile(event) {
    event.preventDefault();
    
    const formData = new FormData($profileEdit);
    
    // ✨ '주요 스킬' 데이터 수집
    const updatedSkills = {};
    const skillInputs = $profileEditSkills.querySelectorAll('input[type="range"]');
    skillInputs.forEach(input => {
        const skillName = input.name;
        const value = parseInt(input.value, 10);
        if (value >= 0) { // ✨ 0 이상인 값만 저장 (0도 포함)
            updatedSkills[skillName] = value;
        }
    });
    
    // FormData에 JSON 문자열로 추가
    formData.append('skill_weights', JSON.stringify(updatedSkills));
    
    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            body: formData // 사진 + 텍스트 + 스킬 JSON
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '프로필 업데이트 실패');
        }
        
        const result = await response.json();
        customAlert(result.message);
        
        // 현재 사용자 정보 갱신
        await fetchStatus();
        renderAuthButtons();
        
        // 프로필 모달 새로고침
        loadUserProfile(currentUser.user_id);
        cancelProfileEdit();
        
    } catch (error) {
        console.error(error);
        customAlert(error.message);
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

// 팟 카테고리
async function fetchGalleries() {
    try {
        const response = await fetch('/api/galleries');
        if (!response.ok) throw new Error('카테고리 로딩 실패');
        allGalleries = await response.json();
        renderSidebar(); // 팟/커뮤니티 사이드바 렌더링
        populateNewPostGalleryOptions(false);
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

// ✨ (신규) 유저 스킬 카테고리
async function fetchSkills() {
     try {
        const response = await fetch('/api/skills');
        if (!response.ok) throw new Error('스킬 목록 로딩 실패');
        allSkillCategories = await response.json();
        // 모든 스킬 리스트 (검색 자동완성용)
        allSkills = [].concat(...Object.values(allSkillCategories));
        
        renderSkillCategories(); // 유저 스킬 사이드바 렌더링
        populateRecommendationCategories(); // ✨ 팀원 추천 드롭다운 채우기
        
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

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

// ✨ (신규) 전체 유저 목록 로드 (유저 찾기 '전체 분야'용)
async function fetchAllUsers() {
    $userListContainer.innerHTML = `<div class="p-12 text-center text-gray-500" id="user-loading-placeholder">모든 유저 목록을 불러오는 중...</div>`;
    $userSearchTitle.textContent = '전체 유저';
    
    try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('전체 유저 로딩 실패');
        const users = await response.json();
        renderUserList(users);
    } catch (error) {
        console.error(error);
        $userListContainer.innerHTML = `<div class="p-12 text-center text-red-500">유저 목록을 불러오는 데 실패했습니다.</div>`;
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

async function fetchAllData() {
    await fetchStatus();
    
    // ✨ 두 API 동시 호출
    await Promise.all([
        fetchGalleries(), // 팟 카테고리
        fetchSkills()     // 유저 스킬 카테고리
    ]);
    
    // 기본 뷰(팟) 데이터 로드
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

        if (currentView === 'pods' && selectedGallery !== 'community') {
            renderPostList();
        }
    });

    socket.on('new_message', (message) => {
        console.log('Socket event: new_message', message);
        if (selectedChatroom && selectedChatroom.id === message.chatroom_id) {
            renderSingleMessage(message);
            if (message.sender_id !== currentUser.user_id) {
                socket.emit('mark_as_read', { chatroom_id: selectedChatroom.id });
            }
        }
        fetchChatrooms(); // 새 메시지 오면 항상 뱃지/목록 갱신
    });

    socket.on('chatlist_updated', () => {
        console.log('Socket event: chatlist_updated');
        fetchChatrooms();
    });

    socket.on('chat_status_changed', (data) => {
        console.log('Socket event: chat_status_changed', data);
        if (selectedChatroom && selectedChatroom.id === data.chatroom_id) {
            refreshChatMessages();
        }
    });
}

// --- 이벤트 핸들러 ---
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

async function handleOpenCommunityPost(postId) {
    try {
        selectedCommunityPostId = postId;
        const response = await fetch(`/api/community/posts/${postId}`);
        if (!response.ok) throw new Error('게시글을 불러올 수 없습니다.');

        const post = await response.json();
        renderCommunityDetailModal(post);
        $communityDetailModal.classList.remove('hidden');

        const index = allCommunityPosts.findIndex(p => p.id == postId);
        if (index !== -1) {
             allCommunityPosts[index].views = post.views;
             allCommunityPosts[index].comment_count = post.comments.length;
             if (currentView === 'pods' && selectedGallery === 'community') {
                renderCommunityPostList();
             }
        }
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

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

// ✨ (신규) DM (개인 메시지) 생성 핸들러
async function handleCreateDM(recipientId) {
    if (!currentUser) { customAlert("로그인이 필요한 기능입니다."); openLoginModal(); return; }
    if (currentUser.user_id == recipientId) { customAlert("자기 자신에게 메시지를 보낼 수 없습니다."); return; }
    
    try {
        const response = await fetch(`/api/chatrooms/create_dm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient_id: recipientId })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '채팅방 생성에 실패했습니다.');
        
        // DM 생성 후, 프로필 모달이 열려있었다면 닫고 채팅방 열기
        closeProfileModal(); 
        handleOpenChatDetail(data.id);
        
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}


async function handleDeletePost(postId) {
    if (!currentUser || currentUser.user_id !== selectedPost.user_id) { customAlert("삭제할 권한이 없습니다."); return; }
    if (!customConfirm("정말로 이 게시글을 삭제하시겠습니까?")) return;
    try {
        const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '삭제에 실패했습니다.');
        customAlert('게시글이 삭제되었습니다.');
        closeDetailModal();
    } catch (error) { console.error(error); customAlert(error.message); }
}

async function handleDeleteCommunityPost(postId) {
    if (!currentUser) { customAlert("로그인이 필요한 기능입니다."); return; }
    if (!customConfirm("정말로 이 게시글을 삭제하시겠습니까?\n삭제된 글과 이미지는 복구할 수 없습니다.")) return;

    try {
        const response = await fetch(`/api/community/posts/${postId}`, { method: 'DELETE' });
        if (response.status === 401) { customAlert("로그인이 필요합니다."); openLoginModal(); return; }
        if (response.status === 403) { customAlert("삭제할 권한이 없습니다."); return; }
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '삭제 실패');

        customAlert('게시글이 삭제되었습니다.');
        closeCommunityDetailModal();
        await fetchCommunityPosts();
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

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
    if (!data.gallery || data.gallery === 'community') { customAlert("팟 카테고리를 선택해주세요."); return; }

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
        // 팟 등록 후 팟 목록으로 강제 이동/새로고침
        handleNavClick(null, null);
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

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
            body: formData,
        });

        if (response.status === 401) { customAlert("로그인이 필요합니다."); openLoginModal(); return; }
        if (!response.ok) { const data = await response.json(); throw new Error(data.error || '등록 실패'); }

        customAlert('게시글이 등록되었습니다!');
        closeNewCommunityModal();
        handleNavClick(null, 'community'); // 커뮤니티 탭으로 이동/새로고침
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    } finally {
        $submitBtn.disabled = false;
        $submitBtn.textContent = '등록하기';
    }
}

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

        $commentContent.value = '';
        const newComment = await response.json();

        const postIndex = allCommunityPosts.findIndex(p => p.id == selectedCommunityPostId);
        if (postIndex !== -1) {
            allCommunityPosts[postIndex].comment_count += 1;
            renderCommunityPostList();
        }

        const commentElement = document.createElement('div');
        commentElement.className = "bg-gray-800/50 p-4 rounded-lg border border-gray-700 comment-item";
        commentElement.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <img src="${newComment.author_profile_picture}" alt="${newComment.author_display_name}" 
                        class="w-6 h-6 rounded-full border border-pink-600 object-cover author-link cursor-pointer" data-user-id="${newComment.user_id}">
                    <span class="font-bold text-white author-link cursor-pointer hover:text-pink-400 transition" data-user-id="${newComment.user_id}">${newComment.author_display_name}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500">${formatTimeAgo(newComment.timestamp)}</span>
                    <button class="delete-comment-btn text-gray-500 hover:text-red-500" data-comment-id="${newComment.id}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <p class="text-gray-300 whitespace-pre-wrap">${newComment.content}</p>
        `;
        
        const noCommentMsg = $communityDetailCommentList.querySelector('p.text-gray-500');
        if (noCommentMsg && noCommentMsg.textContent.includes('아직 댓글이 없습니다')) {
             noCommentMsg.remove();
        }

        $communityDetailCommentList.appendChild(commentElement);
        commentElement.querySelector('.delete-comment-btn').addEventListener('click', (e) => {
            handleDeleteComment(e.currentTarget.dataset.commentId);
        });

        setTimeout(() => {
            createIconsSafe();
            attachProfileEvents();
        }, 0);
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

async function handleDeleteComment(commentId) {
    if (!currentUser) { customAlert("로그인이 필요한 기능입니다."); openLoginModal(); return; }
    if (!customConfirm("정말로 이 댓글을 삭제하시겠습니까?")) return;

    try {
        const response = await fetch(`/api/community/comments/${commentId}`, { method: 'DELETE' });
        if (response.status === 401) { customAlert("로그인이 필요합니다."); openLoginModal(); return; }
        if (response.status === 403) { customAlert("삭제할 권한이 없습니다."); return; }
        if (!response.ok) { const data = await response.json(); throw new Error(data.error || '댓글 삭제 실패'); }

        customAlert('댓글이 삭제되었습니다.');

        const commentElement = $communityDetailCommentList.querySelector(`.comment-item button[data-comment-id="${commentId}"]`)?.closest('.comment-item');
        if (commentElement) {
            commentElement.remove();
        }

        const postIndex = allCommunityPosts.findIndex(p => p.id == selectedCommunityPostId);
        if (postIndex !== -1 && allCommunityPosts[postIndex].comment_count > 0) {
            allCommunityPosts[postIndex].comment_count -= 1;
            renderCommunityPostList();
        }

        if ($communityDetailCommentList.children.length === 0) {
            $communityDetailCommentList.innerHTML = '<p class="text-gray-500 text-sm">아직 댓글이 없습니다.</p>';
        }
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

async function handleOpenChatDetail(chatroomId) {
    try {
        const response = await fetch(`/api/chatrooms/${chatroomId}/messages`);
        if (response.status === 401) { customAlert("로그인이 필요합니다."); openLoginModal(); return; }
        if (!response.ok) throw new Error('채팅방 입장에 실패했습니다.');

        const data = await response.json();
        selectedChatroom = data.chatroom;
        renderChatMessages(data.messages);

        $chatOtherUserName.textContent = selectedChatroom.other_user_name;
        
        // ✨ (수정) 팟 제목이 DM인지 확인
        if (selectedChatroom.post_title === 'Direct Message') {
            $chatPostTitle.innerHTML = `<i data-lucide="message-circle" class="w-4 h-4 inline-block"></i> Direct Message`;
        } else {
            $chatPostTitle.textContent = selectedChatroom.post_title;
        }
        createIconsSafe(); // 아이콘 생성

        if (socket) {
            socket.emit('join_chat', { chatroom_id: chatroomId });
        }
        
        updateChatInputState();
        closeChatListModal();
        openChatDetailModal();
        fetchChatrooms(); // '읽음' 처리 갱신
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

async function handleSendMessage(event) {
    event.preventDefault();
    if (!socket || !selectedChatroom) return;
    const content = $chatMessageInput.value.trim();
    if (!content) return;

    socket.emit('send_message', {
        chatroom_id: selectedChatroom.id,
        content: content
    });
    $chatMessageInput.value = '';
}

async function refreshChatMessages() {
    if (!selectedChatroom) return;
    try {
        const response = await fetch(`/api/chatrooms/${selectedChatroom.id}/messages`);
        if (!response.ok) throw new Error('메시지 갱신 실패');
        const data = await response.json();
        selectedChatroom = data.chatroom;
        renderChatMessages(data.messages);
        updateChatInputState();
        fetchChatrooms(); // 갱신
    } catch (error) {
        console.error(error);
    }
}

async function handleDeleteChatroom(chatroomId) {
    if (!customConfirm("정말로 이 채팅방을 나가시겠습니까?\n(상대방에게도 알림이 갑니다)")) return;
    try {
        const response = await fetch(`/api/chatrooms/${chatroomId}`, { method: 'DELETE' });
        if (response.status === 401) { customAlert("로그인이 필요합니다."); openLoginModal(); return; }
        if (!response.ok) { const data = await response.json(); throw new Error(data.error || '나가기 실패'); }
        
        customAlert('채팅방을 나갔습니다.');
        fetchChatrooms();
        if (selectedChatroom && selectedChatroom.id === chatroomId) {
            closeChatDetailModal();
        }
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

// 팟/커뮤니티 헤더 검색
function handleHeaderSearch(event) {
    headerSearchTerm = event.target.value;
    if (currentView !== 'pods') return; // 팟/커뮤니티 뷰일 때만 작동

    if (selectedGallery === 'community') {
        renderCommunityPostList();
    } else {
        renderPostList();
    }
}

// 팟/커뮤니티 사이드바 클릭
function handleNavClick(event, forceGalleryId = undefined) {
    let galleryId;
    if (forceGalleryId !== undefined) {
        galleryId = forceGalleryId;
    } else if (event) {
        const button = event.target.closest('button[data-gallery-id]');
        if (!button) return;
        galleryId = button.dataset.galleryId;
    } else {
        galleryId = 'null'; // 기본값 (전체보기)
    }

    selectedGallery = (galleryId === 'null' || galleryId === null) ? null : galleryId;

    renderSidebar(); // 팟/커뮤니티 사이드바 UI 갱신

    isFirstPostLoad = true;
    if (selectedGallery === 'community') {
        fetchCommunityPosts();
    } else {
        fetchPosts(); // 팟 게시글 (선택된 갤러리 포함)
    }
}

// ✨ (수정) 유저 스킬 사이드바 클릭
function handleSkillCategoryClick(event, forceSkill = undefined) {
    // ✨ 이름/추천 검색 모드에서는 스킬 사이드바 클릭 무시
    if (userSearchMode === 'name' || userSearchMode === 'recommend') return;
    
    let skill;
    if (forceSkill !== undefined) {
        skill = forceSkill;
    } else if (event) {
        const button = event.target.closest('button[data-skill]');
        if (!button) return;
        skill = button.dataset.skill === 'null' ? null : button.dataset.skill;
    } else {
        skill = null; // 기본값 (전체 분야)
    }
    
    selectedSkill = skill; // 전역 상태 업데이트
    
    // 사이드바 UI 갱신
    $$('.skill-nav-btn').forEach(btn => {
        btn.classList.remove('bg-gradient-to-r', 'from-pink-600', 'to-pink-500', 'text-white', 'shadow-lg', 'shadow-pink-600/30', 'bg-pink-900/50', 'text-pink-400');
        if (btn.dataset.skill === (skill || 'null')) {
            if (skill === null) {
                 btn.classList.add('bg-gradient-to-r', 'from-pink-600', 'to-pink-500', 'text-white', 'shadow-lg', 'shadow-pink-600/30');
            } else {
                 btn.classList.add('bg-pink-900/50', 'text-pink-400');
            }
        } else {
            btn.classList.add('text-gray-300', 'hover:bg-gray-800/50', 'hover:text-pink-400');
            if (btn.dataset.skill !== 'null') btn.classList.add('text-gray-400'); // 하위 스킬
        }
    });

    if (skill) {
        // 특정 스킬 검색
        $userSearchTitle.textContent = `'${skill}' 스킬 보유자`;
        handleSkillSearch(skill);
    } else {
        // ✨ '전체 분야' - 모든 유저 목록 로드
        fetchAllUsers();
    }
}

// ✨ (신규) 유저 스킬 검색 API 호출
async function handleSkillSearch(skill) {
    if (!skill) {
        // 스킬이 없으면 전체 유저 로드
        fetchAllUsers();
        return;
    }

    selectedSkill = skill; // 검색 시 '선택된 스킬'도 업데이트
    $userListContainer.innerHTML = `<div class="p-12 text-center text-gray-500">유저를 검색하는 중...</div>`;
    $skillSearchInput.value = skill; // 검색창에도 반영
    $skillAutocompleteList.classList.add('hidden');
    
    try {
        const response = await fetch(`/api/search?skill=${encodeURIComponent(skill)}`);
        if (!response.ok) throw new Error('검색 실패');
        const users = await response.json();
        renderUserList(users);
    } catch (error) {
        console.error(error);
        $userListContainer.innerHTML = `<div class="p-12 text-center text-red-500">검색 중 오류가 발생했습니다.</div>`;
    }
}

// ✨ (신규) 유저 이름 검색 API 호출
async function handleNameSearch(name) {
    if (!name || name.trim() === '') {
        $userListContainer.innerHTML = `<div class="p-12 text-center text-gray-500">검색할 이름을 입력하세요.</div>`;
        return;
    }
    
    $userListContainer.innerHTML = `<div class="p-12 text-center text-gray-500">유저를 검색하는 중...</div>`;
    
    try {
        const response = await fetch(`/api/search/username?name=${encodeURIComponent(name.trim())}`);
        if (!response.ok) throw new Error('이름 검색 실패');
        const users = await response.json();
        renderUserList(users);
    } catch (error) {
        console.error(error);
        $userListContainer.innerHTML = `<div class="p-12 text-center text-red-500">검색 중 오류가 발생했습니다.</div>`;
    }
}

// ✨ [신규] 팀원 추천 - 카테고리 변경 시 API 호출
async function handleRecommendationCategoryChange(event) {
    const category = event.target.value;
    if (!category) {
        $userListContainer.innerHTML = `<div class="p-12 text-center text-gray-500">참가할 대회 분야를 선택해주세요.</div>`;
        return;
    }

    $userListContainer.innerHTML = `<div class="p-12 text-center text-gray-500">"${category}" 분야에 맞는 팀원을 추천받는 중...</div>`;

    try {
        const response = await fetch(`/api/recommend/teammates?competition_type=${encodeURIComponent(category)}`);
        if (response.status === 401) {
             customAlert("로그인이 필요한 기능입니다.");
             openLoginModal();
             $userListContainer.innerHTML = `<div class="p-12 text-center text-red-500">로그인이 필요합니다.</div>`;
             return;
        }
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '추천 실패');
        }
        const data = await response.json();
        if (data.message) { // 백엔드에서 '이미 충분하다'는 메시지를 보낸 경우
             $userListContainer.innerHTML = `<div class="p-12 text-center text-green-500">${data.message}</div>`;
        } else {
             renderRecommendedUsers(data.recommendations);
        }
    } catch (error) {
        console.error(error);
        $userListContainer.innerHTML = `<div class="p-12 text-center text-red-500">팀원을 추천받는 중 오류가 발생했습니다: ${error.message}</div>`;
    }
}


// ✨ (수정) 유저 검색 모드 전환 (recommend 추가)
function switchUserSearchMode(mode) {
    userSearchMode = mode;
    selectedSkill = null; // 모드 변경 시 선택된 스킬 초기화
    
    // 모든 탭 비활성화
    [$userSearchTabSkill, $userSearchTabName, $userSearchTabRecommend].forEach(tab => {
         tab.classList.remove('border-pink-500', 'text-pink-400');
         tab.classList.add('border-transparent', 'text-gray-500');
    });
    // 모든 컨테이너 숨기기
    [$skillSearchContainer, $nameSearchContainer, $recommendationContainer].forEach(container => {
        container.classList.add('hidden');
    });
    // 스킬 사이드바 기본 숨김
    $skillNavContainer.classList.add('hidden');

    if (mode === 'skill') {
        // 스킬 모드 UI
        $userSearchTabSkill.classList.add('border-pink-500', 'text-pink-400');
        $userSearchTabSkill.classList.remove('border-transparent', 'text-gray-500');
        
        $userSearchTitle.textContent = '스킬로 유저 찾기';
        $userSearchDescription.textContent = '찾고 싶은 스킬을 선택하거나 검색하세요.';
        $skillSearchContainer.classList.remove('hidden');
        $skillNavContainer.classList.remove('hidden'); // 스킬 사이드바 보이기
        
        // 스킬 모드 기본 상태 (전체 유저) 로드
        handleSkillCategoryClick(null, null); // 이 함수 내부에서 renderUserList 또는 fetchAllUsers 호출
        
    } else if (mode === 'name') {
        // 이름 모드 UI
        $userSearchTabName.classList.add('border-pink-500', 'text-pink-400');
        $userSearchTabName.classList.remove('border-transparent', 'text-gray-500');
        
        $userSearchTitle.textContent = '이름으로 유저 찾기';
        $userSearchDescription.textContent = '찾고 싶은 유저의 이름 또는 표시 이름을 입력하세요.';
        $nameSearchContainer.classList.remove('hidden');
        
        // 이름 모드 기본 상태 (검색창 비우고 결과 없음 표시)
        $nameSearchInput.value = '';
        $userListContainer.innerHTML = `<div class="p-12 text-center text-gray-500">검색할 이름을 입력하세요.</div>`;

    } else if (mode === 'recommend') {
         // ✨ 팀원 추천 모드 UI
        $userSearchTabRecommend.classList.add('border-pink-500', 'text-pink-400');
        $userSearchTabRecommend.classList.remove('border-transparent', 'text-gray-500');

        $userSearchTitle.textContent = '맞춤 팀원 추천';
        $userSearchDescription.textContent = '참가할 대회 분야를 선택하면, 당신의 스킬을 보완해줄 팀원을 추천해 드립니다.';
        $recommendationContainer.classList.remove('hidden');

        // 로그인 상태 확인
        if (!currentUser) {
            $userListContainer.innerHTML = `
                <div class="p-12 text-center text-red-500">
                    팀원 추천 기능은 <button class="text-pink-400 underline font-bold" onclick="openLoginModal()">로그인</button> 후 이용 가능합니다.
                </div>`;
            $recommendationCategorySelect.disabled = true;
        } else {
             $recommendationCategorySelect.disabled = false;
             $recommendationCategorySelect.value = ''; // 드롭다운 초기화
             $userListContainer.innerHTML = `<div class="p-12 text-center text-gray-500">참가할 대회 분야를 선택해주세요.</div>`;
        }
        // 아이콘 다시 그리기 (탭 전환 시 필요할 수 있음)
        setTimeout(createIconsSafe, 0);
    }
}


// '새 글쓰기' (상단) 버튼 클릭
function handleOpenNewContentModal() {
    if (!currentUser) {
        customAlert("로그인이 필요한 기능입니다.");
        openLoginModal();
        return;
    }

    // 현재 '팟/커뮤니티' 뷰일 때만 동작
    if (currentView === 'pods') {
        if (selectedGallery === 'community') {
            openNewCommunityModal();
        } else {
            openNewPostModal();
            // 팟 모집 모달의 카테고리 자동 선택
            if (selectedGallery !== null) {
                $newPostGallerySelect.value = selectedGallery;
            } else {
                $newPostGallerySelect.value = "";
            }
        }
    }
    // '유저 찾기' 뷰에서는 이 버튼이 숨겨져 있어야 함
}

// --- 인증 핸들러 ---
async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData($loginForm);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || '로그인 실패');

        customAlert('로그인 성공! 환영합니다.');
        closeLoginModal();
        await fetchAllData(); // 로그인 성공 후 모든 데이터 새로고침
        
        // ✨ 로그인 후 현재 '팀원 추천' 탭이라면 UI 갱신
        if (currentView === 'users' && userSearchMode === 'recommend') {
            switchUserSearchMode('recommend');
        }

    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData($registerForm);
    const data = Object.fromEntries(formData.entries());

    const $submitBtn = $registerForm.querySelector('button[type="submit"]');

    try {
        $submitBtn.disabled = true;
        $submitBtn.textContent = '가입 중...';

        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || '회원가입 실패');

        customAlert(result.message);
        closeRegisterModal();
        openLoginModal();
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    } finally {
        $submitBtn.disabled = false;
        $submitBtn.textContent = '회원가입';
    }
}

async function handleLogout() {
    try {
        const response = await fetch('/logout', { method: 'POST' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || '로그아웃 실패');

        customAlert(result.message);
        currentUser = null;
        likedPostIds.clear();
        allChatrooms = [];
        disconnectSocket();
        renderAuthButtons();
        updateChatBadge(0);
        // 로그아웃 시 팟/커뮤니티 뷰의 UI 갱신
        if (currentView === 'pods') {
             if (selectedGallery === 'community') {
                renderCommunityPostList();
            } else {
                renderPostList();
            }
        }
        // ✨ (수정) 유저 검색 뷰도 갱신
        if (currentView === 'users') {
             // ✨ 로그아웃 시 '팀원 추천' 탭이라면 UI 갱신
            if (userSearchMode === 'recommend') {
                switchUserSearchMode('recommend');
            } else {
                 // 현재 모드에 따라 다시 로드 (DM 버튼 숨김 처리)
                if (userSearchMode === 'skill') {
                    handleSkillCategoryClick(null, selectedSkill);
                } else {
                    handleNameSearch($nameSearchInput.value);
                }
            }
        }
       
    } catch (error) {
        console.error(error);
        customAlert(error.message);
    }
}

// --- 초기화 함수 ---
function initialize() {
    // 공통
    $logo.addEventListener('click', () => location.reload());
    $customAlertCloseBtn.addEventListener('click', closeCustomAlert);
    $headerSearchInput.addEventListener('input', handleHeaderSearch);
    $openNewContentModalBtn.addEventListener('click', handleOpenNewContentModal);

    // ✨ 메인 뷰 전환
    $navMainPods.addEventListener('click', handleMainViewSwitch);
    $navMainUsers.addEventListener('click', handleMainViewSwitch);

    // 팟/커뮤니티
    $galleryNav.addEventListener('click', (e) => handleNavClick(e));
    $closeDetailModalBtn.addEventListener('click', closeDetailModal);
    $closeNewPostModalBtn.addEventListener('click', closeNewPostModal);
    $newPostForm.addEventListener('submit', handleCreatePost);
    $closeNewCommunityModalBtn.addEventListener('click', closeNewCommunityModal);
    $communityForm.addEventListener('submit', handleCreateCommunityPost);
    $closeCommunityDetailModalBtn.addEventListener('click', closeCommunityDetailModal);
    $commentForm.addEventListener('submit', handleCreateComment);

    // ✨ 유저 검색
    $userSearchTabSkill.addEventListener('click', () => switchUserSearchMode('skill')); // 탭 전환
    $userSearchTabName.addEventListener('click', () => switchUserSearchMode('name'));   // 탭 전환
    $userSearchTabRecommend.addEventListener('click', () => switchUserSearchMode('recommend')); // ✨ [신규] 탭 전환
    $skillCategoryList.addEventListener('click', (e) => handleSkillCategoryClick(e)); // 스킬 사이드바
    $skillSearchInput.addEventListener('input', (e) => { // 스킬 검색 (자동완성)
        renderSkillAutocomplete(e.target.value);
    });
    $skillSearchInput.addEventListener('keydown', (e) => { // 스킬 검색 (엔터)
        if (e.key === 'Enter') {
            handleSkillSearch(e.target.value);
        }
    });
    $skillAutocompleteList.addEventListener('click', (e) => { // 스킬 자동완성 클릭
        const skill = e.target.dataset.skill;
        if (skill) {
            handleSkillSearch(skill);
        }
    });
    $nameSearchInput.addEventListener('keydown', (e) => { // 이름 검색 (엔터)
        if (e.key === 'Enter') {
            handleNameSearch(e.target.value);
        }
    });
    // ✨ [신규] 팀원 추천 드롭다운 변경 이벤트
    $recommendationCategorySelect.addEventListener('change', handleRecommendationCategoryChange);


    // 인증 모달
    $toggleToRegister.addEventListener('click', openRegisterModal);
    $toggleToLogin.addEventListener('click', openLoginModal);
    $closeLoginModalBtn.addEventListener('click', closeLoginModal);
    $closeRegisterModalBtn.addEventListener('click', closeRegisterModal);
    $loginForm.addEventListener('submit', handleLogin);
    $registerForm.addEventListener('submit', handleRegister);

    // 채팅 모달
    $openChatListBtn.addEventListener('click', openChatListModal);
    $closeChatListModalBtn.addEventListener('click', closeChatListModal);
    $closeChatDetailModalBtn.addEventListener('click', closeChatDetailModal);
    $chatMessageForm.addEventListener('submit', handleSendMessage);

    // 프로필 모달
    $closeProfileModal.addEventListener('click', closeProfileModal);
    $editProfileBtn.addEventListener('click', showProfileEditMode);
    $cancelEditProfileBtn.addEventListener('click', cancelProfileEdit);
    $profileEdit.addEventListener('submit', handleUpdateProfile);
    
    // ✨ (신규) 프로필 모달의 DM 버튼
    $sendDmBtn.addEventListener('click', () => {
        if (currentProfileData) {
            handleCreateDM(currentProfileData.id);
        }
    });
    
    // 프로필 수정 시 사진 미리보기
    $profilePictureInput.addEventListener('change', () => {
        const file = $profilePictureInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                $profileEditPicturePreview.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    // 프로필 미리보기 팝업 호버아웃
    $profilePreviewPopup.addEventListener('mouseleave', hideProfilePreview);
}

// --- 앱 시작 ---
document.addEventListener('DOMContentLoaded', () => {
    initialize();
    fetchAllData();
});
