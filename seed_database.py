import random
import json
from app import app, db, User, Post # ✨ Pod 대신 Post 모델을 가져옵니다
from werkzeug.security import generate_password_hash

# --- 1. 스킬 카테고리 (통합 앱과 동일) ---
SKILL_CATEGORIES = {
    "hackathon": ["웹", "프론트엔드", "백엔드", "모바일", "AI", "디자인", "기획"],
    "ctf": ["웹해킹", "리버싱", "포렌식", "암호학", "시스템해킹"],
    "algorithm": ["그래프", "DP", "수학", "시뮬레이션", "구현"],
    "ai": ["데이터분석", "머신러닝", "딥러닝", "NLP", "통계"],
    "planning": ["기획", "BM설계", "시장조사", "발표", "UX"],
    "design": ["UI/UX", "그래픽", "영상", "로고", "브랜딩"],
    "engineering": ["회로", "임베디드", "CAD", "로봇", "시스템설계"]
}
ALL_SKILLS = [skill for category in SKILL_CATEGORIES.values() for skill in category]

# --- 2. 유저 더미 데이터 (사람 같은 닉네임) ---
DUMMY_NAMES = [
    ("김철수", "ai_master.kim"), ("이영희", "web_dev.lee"), ("박지성", "reversing_park"), ("최수영", "data_analyst.choi"),
    ("정다빈", "uiux_dabing"), ("강태풍", "algo_storm"), ("윤하늘", "leader.yoon"), ("임바다", "embed_master.lim"),
    ("오서준", "mobile_dev.oh"), ("한유진", "backend_yujin.han"), ("배현우", "secu_dreamer"), ("신지아", "frontend_jia"),
    ("문채원", "video_moon.cw"), ("황준호", "robotics_hwang"), ("송미소", "pm_miso.song"), ("권혁", "ctf_player.kwon"),
    ("안지민", "deep_learner.ahn"), ("고은별", "branding_star"), ("유승호", "math_genius_yoo"), ("나선우", "system_hacker.na")
]

DUMMY_BIOS = [
    "새로운 기술을 배우는 것을 좋아합니다.", "협업을 환영합니다! D.Find에서 만나요.", "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
    "해커톤/대회 팀원 구합니다. 함께 성장해요.", "데이터로 세상을 읽는 중입니다.", "사용자 중심의 디자인을 추구합니다.",
    "알고리즘 문제 풀이 스터디원 찾아요.", "아이디어를 현실로 만드는 기획자입니다.", "하드웨어와 소프트웨어를 넘나드는 개발자.",
    "클린 코드를 지향하는 백엔드 개발자입니다.", "사이드 프로젝트 함께할 분 DM 주세요.", "보안에 관심이 많습니다. 정보 공유해요.",
    "픽셀 하나하나에 영혼을 담습니다.", "미래를 만드는 로봇 공학도.", "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
    "CTF, 같이 공부하실 분?", "AI로 더 나은 세상을 만들고 싶습니다.", "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
    "복잡한 문제를 단순하게 푸는 것을 좋아합니다.", "시스템의 심연을 탐구합니다."
]

# --- 3. 팟 더미 데이터 ---
# ✨ (수정) DUMMY_post_TITLES -> DUMMY_POD_TITLES
DUMMY_POD_TITLES = [
    "D.Find 2025 해커톤 팀원 모집 (웹/AI)", "사이드 프로젝트 '오늘 뭐 먹지?' 함께할 분", "CTF 스터디 및 대회 팀원 구합니다",
    "교내 알고리즘 스터디 (C++/Python)", "AI 기반 교내 소식 챗봇 개발 프로젝트", "디미고인 대상 중고거래 앱 '디미마켓'",
    "신입생을 위한 학교 안내 웹서비스", "Unity 3D 게임 개발 프로젝트 (방과후)", "임베디드/로봇 프로젝트 하실 분",
    "UX/UX 리서치 및 디자인 스터디 모집"
]
# ✨ (수정) DUMMY_post_DESCRIPTIONS -> DUMMY_POD_DESCRIPTIONS
DUMMY_POD_DESCRIPTIONS = [
    "웹/앱/AI 분야 상관없이 아이디어 구현에 열정있는 분들 찾습니다. 기획자, 디자이너 환영!",
    "점심/저녁 메뉴 추천 및 투표 앱입니다. React/Node.js 경험자 우대. 백엔드 1명, 프론트 2명 모집.",
    "주 1회 온라인 스터디 및 주말 대회 참가를 목표로 합니다. 리버싱, 웹해킹 관심있는 분!",
    "BOJ 플래티넘 이상, 혹은 열정 있는 분. 매주 2문제 풀이 및 코드 리뷰. DP, 그래프 위주.",
    "NLP와 챗봇 기술을 이용해 학교 공지사항, 급식 등을 알려주는 봇을 만듭니다. Python/ML 경험자.",
    "기숙사 생활에 필요한 물품을 안전하게 거래할 수 있는 플랫폼. 모바일(Flutter/React Native) 개발자 구해요.",
    "신입생과 방문객을 위한 인터랙티브 맵, 학교 생활 팁을 제공하는 웹. 프론트엔드, 디자이너 급구.",
    "방과후/주말에 함께 3D 횡스크롤 게임 만들고 싶습니다. 기획은 완료. 개발자, 그래픽 디자이너 필요.",
    "아두이노, 라즈베리파이로 재미있는 것 만드실 분. 드론, 스마트홈 등 아이디어 많습니다.",
    "사용자 중심 디자인에 대해 공부하고, 실제 앱/웹 리디자인 프로젝트를 진행할 스터디입니다."
]


# --- 4. 더미 데이터 생성 함수 ---

def create_dummy_users():
    """20명의 가상 사용자를 생성합니다."""
    print("Creating 20 dummy users...")
    users_to_add = []
    for i in range(20):
        username = DUMMY_NAMES[i][0]
        display_name = DUMMY_NAMES[i][1]
        login_id = display_name
        email = f"{login_id}@dimigo.hs.kr"

        # '스킬' 데이터 생성 (이것이 유일한 스킬 점수 소스)
        skill_weights = {}
        for skill in ALL_SKILLS:
            # 약 70% 확률로 스킬 보유, 10~100 사이 랜덤 점수
            if random.random() < 0.7:
                skill_weights[skill] = random.randint(10, 100)
        
        new_user = User(
            username=username,
            email=email,
            display_name=display_name,
            is_verified=True,
            bio=DUMMY_BIOS[i],
            skill_weights=skill_weights, # JSON 스킬 데이터 저장
            student_id=f"20{random.randint(10,25)}{random.randint(1,30):02d}"
        )
        new_user.set_password("1234")
        users_to_add.append(new_user)

    db.session.bulk_save_objects(users_to_add)
    db.session.commit()
    print("Successfully created 20 dummy users.")

# ✨ (수정) 함수 이름 및 내용 수정
def create_dummy_posts(): # 함수 이름은 로그와 맞춤
    """10개의 가상 팟(Post 모델 사용)을 생성합니다."""
    print("Creating 10 dummy posts...") # 로그와 맞춤

    leaders = User.query.filter(User.username != 'admin').limit(10).all()
    if not leaders or len(leaders) < 10:
        print("Not enough users found to create posts.")
        return

    posts_to_add = []
    # ✨ app.py에 정의된 galleries 변수를 config에서 가져옴
    galleries = [g['id'] for g in app.config.get('GALLERIES', []) if g['id'] != 'community']
    if not galleries:
        print("No pod galleries defined in app.py config.")
        galleries = ['competition', 'project'] # 기본값

    for i in range(10):
        leader = leaders[i]
        gallery_id = galleries[i % len(galleries)] # 카테고리 순환

        # ✨ (수정) Post 모델의 실제 필드명과 일치시킴
        new_post = Post( 
            title=DUMMY_POD_TITLES[i],           # 'DUMMY_post_TITLES' -> 'DUMMY_POD_TITLES'
            content=DUMMY_POD_DESCRIPTIONS[i],   # 'description' -> 'content'
            user_id=leader.id,                   # 'leader_id' -> 'user_id'
            gallery=gallery_id,                  # 'category' -> 'gallery'
            totalMembers=random.randint(3, 6), # 'max_members' -> 'totalMembers'
            currentMembers=1,                    # 'currentMembers' 필드 추가
            isCompleted=False                    # 'status' -> 'isCompleted'
            # 'required_skills'는 Post 모델에 없으므로 제거
        )
        posts_to_add.append(new_post)

    db.session.bulk_save_objects(posts_to_add)
    db.session.commit()
    print("Successfully created 10 dummy posts.")


def seed_database():
    """데이터베이스를 초기화하고 모든 가상 데이터를 생성합니다."""
    with app.app_context():
        # ✨ app.py에 정의된 galleries 변수를 config에 추가 (create_dummy_posts에서 사용)
        app.config['GALLERIES'] = [
            {'id': 'competition', 'name': '대회팟', 'desc': '각종 대회 팀원 모집', 'icon': 'Trophy'},
            {'id': 'project', 'name': '프로젝트팟', 'desc': '프로젝트 협업자 찾기', 'icon': 'Palette'},
            # {'id': 'study', 'name': '스터디팟', 'desc': '공부 스터디 모집', 'icon': 'Code'},
            # {'id': 'game', 'name': '게임팟', 'desc': '게임 파티 구인', 'icon': 'Gamepad2'},
        ]

        print("Dropping and recreating database...")
        db.drop_all() # 기존 테이블 모두 삭제
        db.create_all() # 새 테이블 생성
        print("Database recreated.")

        # 관리자 계정 생성
        admin_user = User(
            username="admin",
            email="admin@dimigo.hs.kr",
            display_name="관리자",
            is_verified=True,
            bio="D.Find 관리자입니다.",
            skill_weights={"기획": 100, "웹": 90, "백엔드": 90, "프론트엔드": 80, "시장조사": 80, "발표": 95} # ✨ 통합된 스킬 데이터
        )
        admin_user.set_password("admin")
        db.session.add(admin_user)
        db.session.commit()

        # 20명의 가상 유저 생성
        create_dummy_users()

        # 10개의 가상 팟 생성
        create_dummy_posts() # ✨ 함수 이름 일치

        print("\n--- Database seeding complete! ---")

if __name__ == "__main__":
    seed_database()
