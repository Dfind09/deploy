import os
import time
import random
from flask import Flask, jsonify, request, render_template, abort, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature
from email_validator import validate_email, EmailNotValidError
from datetime import datetime
from dotenv import load_dotenv

# --- 1. 앱 설정 (Configuration) ---
load_dotenv()  # .env 파일에서 환경 변수 로드
app = Flask(__name__, template_folder='templates')

# !! 중요 !!: 보안을 위해 이 키를 아무도 모르게 변경하세요!
app.config['SECRET_KEY'] = '{SECRET_KEY}' 

# 데이터베이스 설정 (SQLite)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dfind.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 이메일 설정 (사용자 요청 기반)
# !! 중요 !!: 실제 사용 시, 이 값들은 환경 변수로 설정하세요!
# (테스트용으로만 임시로 하드코딩)
# 예: os.environ.get('MAIL_USERNAME', 'your-email@gmail.com')
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'True').lower() in ['true', 'on', '1']
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', 'YOUR_GMAIL@gmail.com') # <-- !! 실제 이메일 입력 !!
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', 'YOUR_GMAIL_APP_PASSWORD') # <-- !! 실제 앱 비밀번호 입력 !!
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', app.config['MAIL_USERNAME'])

# --- 2. 확장 초기화 ---
db = SQLAlchemy(app)
mail = Mail(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login' # @login_required 시 리다렉션 (JS로 처리)
login_manager.session_protection = "strong"

# 이메일 인증 토큰 생성기
ts = URLSafeTimedSerializer(app.config["SECRET_KEY"])

# --- 3. 데이터베이스 모델 ---

# [수정] '좋아요'를 위한 연관 테이블(모델)
class Like(db.Model):
    __tablename__ = 'like'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)

    # 한 사용자가 한 게시글에 한 번만 좋아요 누를 수 있도록 unique 제약조건
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='_user_post_like_uc'),)
    
    # [수정] Like 모델에서 User/Post로의 관계 정의
    user = db.relationship('User', back_populates='likes')
    post = db.relationship('Post', back_populates='liked_by')


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    
    posts = db.relationship('Post', back_populates='author', lazy=True)
    # [수정] 사용자가 누른 '좋아요' 목록
    likes = db.relationship('Like', back_populates='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    gallery = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.BigInteger, nullable=False, default=lambda: int(time.time() * 1000))
    views = db.Column(db.Integer, default=0)
    # [삭제] likes = db.Column(db.Integer, default=0) -> 'liked_by' 관계로 대체
    currentMembers = db.Column(db.Integer, default=0)
    totalMembers = db.Column(db.Integer, nullable=False)
    isCompleted = db.Column(db.Boolean, default=False)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    author = db.relationship('User', back_populates='posts')
    
    # [수정] 이 게시글에 '좋아요' 누른 목록
    liked_by = db.relationship('Like', back_populates='post', lazy=True, cascade='all, delete-orphan')


    def to_dict(self):
        """Post 객체를 JSON 직렬화 가능한 dict로 변환"""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'gallery': self.gallery,
            'timestamp': self.timestamp,
            'views': self.views,
            'likes': len(self.liked_by), # [수정] '좋아요' 수를 동적으로 계산
            'currentMembers': self.currentMembers,
            'totalMembers': self.totalMembers,
            'isCompleted': self.isCompleted,
            'user_id': self.user_id,
            'author_username': self.author.username # 작성자 이름 추가
        }

# 갤러리 정보 (이전과 동일, DB에 넣지 않음)
galleries = [
    {'id': 'competition', 'name': '대회팟', 'desc': '각종 대회 팀원 모집', 'icon': 'Trophy'},
    # ... (이전과 동일한 갤러리 목록) ...
    {'id': 'sports', 'name': '스포츠팟', 'desc': '운동 함께할 사람 찾기', 'icon': 'Users'},
    {'id': 'study', 'name': '스터디팟', 'desc': '공부 스터디 모집', 'icon': 'Code'},
    {'id': 'game', 'name': '게임팟', 'desc': '게임 파티 구인', 'icon': 'Gamepad2'},
    {'id': 'music', 'name': '음악팟', 'desc': '밴드/공연 팀원 모집', 'icon': 'Music'},
    {'id': 'project', 'name': '프로젝트팟', 'desc': '프로젝트 협업자 찾기', 'icon': 'Palette'},
]

# --- 4. Flask-Login 설정 ---

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- 5. 이메일 인증 헬퍼 ---

def send_verification_email(user):
    token = ts.dumps(user.email, salt='email-verify-salt')
    verify_url = url_for('verify_email', token=token, _external=True)
    
    subject = "[D.Find] 이메일 인증을 완료해주세요."
    html = f"""
    <p>D.Find에 가입해주셔서 감사합니다!</p>
    <p>아래 링크를 클릭하여 이메일 인증을 완료해주세요. (1시간 동안 유효)</p>
    <a href="{verify_url}" style="padding: 10px 20px; background-color: #E53E85; color: white; text-decoration: none; border-radius: 5px;">
        이메일 인증하기
    </a>
    <br><br>
    <p>또는 다음 링크를 주소창에 붙여넣으세요: {verify_url}</p>
    """
    
    try:
        msg = Message(subject=subject, recipients=[user.email], html=html)
        mail.send(msg)
        return True
    except Exception as e:
        print(f"이메일 전송 실패: {e}")
        app.logger.error(f"Failed to send email: {e}")
        return False

# --- 6. 인증 라우트 (API) ---

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not all([username, email, password]):
        return jsonify({'error': '모든 항목을 입력해주세요.'}), 400

    # 1. 이메일 형식 및 도메인 검증
    if not email.endswith('@dimigo.hs.kr'):
        return jsonify({'error': '디미고 이메일(@dimigo.hs.kr)만 가입할 수 있습니다.'}), 400
    try:
        validate_email(email)
    except EmailNotValidError:
        return jsonify({'error': '유효하지 않은 이메일 형식입니다.'}), 400

    # 2. 중복 검사
    if User.query.filter_by(email=email).first():
        return jsonify({'error': '이미 가입된 이메일입니다.'}), 409
    if User.query.filter_by(username=username).first():
        return jsonify({'error': '이미 사용 중인 이름입니다.'}), 409

    # 3. 새 사용자 생성 (아직 미인증)
    new_user = User(username=username, email=email, is_verified=False)
    new_user.set_password(password)
    
    try:
        db.session.add(new_user)
        db.session.commit()
        
        # 4. 인증 이메일 발송
        if not send_verification_email(new_user):
             db.session.delete(new_user) # 이메일 발송 실패 시 롤백
             db.session.commit()
             return jsonify({'error': '이메일 전송에 실패했습니다. 메일 설정을 확인하세요.'}), 500

        return jsonify({'message': '회원가입 성공! 이메일을 확인하여 인증을 완료해주세요.'}), 201

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Register error: {e}")
        return jsonify({'error': 'DB 저장 중 오류가 발생했습니다.'}), 500

@app.route('/verify_email/<token>')
def verify_email(token):
    try:
        email = ts.loads(token, salt='email-verify-salt', max_age=3600) # 1시간 유효
    except SignatureExpired:
        return "인증 링크가 만료되었습니다. 다시 시도해주세요.", 400
    except (BadTimeSignature, Exception):
        return "유효하지 않은 인증 링크입니다.", 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return "사용자를 찾을 수 없습니다.", 404
    
    if user.is_verified:
         return render_template('message.html', title="인증 완료", message="이미 인증된 계정입니다. 로그인해주세요.")

    user.is_verified = True
    db.session.commit()
    
    return render_template('message.html', title="인증 성공", message="이메일 인증이 완료되었습니다! 앱으로 돌아가 로그인해주세요.")


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({'error': '이메일 또는 비밀번호가 일치하지 않습니다.'}), 401

    if not user.is_verified:
        # (선택) 미인증 사용자를 위해 인증 메일 재전송 로직 추가 가능
        return jsonify({'error': '이메일 인증이 필요합니다. 메일함을 확인해주세요.'}), 403

    login_user(user, remember=True)
    return jsonify({'message': '로그인 성공!', 'username': user.username}), 200

@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': '로그아웃 되었습니다.'}), 200

# --- 7. 기존 API 라우트 (DB 연동 및 인증 적용) ---

@app.route('/api/status', methods=['GET'])
def get_status():
    """페이지 로드 시 로그인 상태 확인"""
    if current_user.is_authenticated:
        return jsonify({
            'logged_in': True,
            'user_id': current_user.id, # [수정] user_id 추가 (삭제 권한 확인용)
            'username': current_user.username,
            'is_verified': current_user.is_verified
        })
    return jsonify({'logged_in': False})

@app.route('/api/galleries', methods=['GET'])
def get_galleries():
    """갤러리 목록 반환"""
    return jsonify(galleries)

@app.route('/api/posts', methods=['GET'])
def get_posts():
    """게시글 목록 반환 (DB에서 조회)"""
    all_posts = Post.query.order_by(Post.timestamp.desc()).all()
    posts_list = [post.to_dict() for post in all_posts]
    
    # [수정] 로그인한 경우, 사용자가 좋아요 누른 게시글 ID 목록도 함께 전송
    liked_post_ids = set()
    if current_user.is_authenticated:
        liked_post_ids = {like.post_id for like in current_user.likes}

    return jsonify({
        'posts': posts_list,
        'liked_by_user': list(liked_post_ids)
    })

@app.route('/api/posts', methods=['POST'])
@login_required
def create_post():
    """새 게시글 생성 (로그인 필요)"""
    if not current_user.is_verified:
        return jsonify({'error': '이메일 인증이 필요한 기능입니다.'}), 403

    data = request.json
    if not all(k in data for k in ['title', 'content', 'gallery', 'totalMembers']):
        abort(400, description="필수 항목이 누락되었습니다.")

    try:
        # [수정] 현재 인원은 1(작성자)부터 시작
        current_members = int(data.get('currentMembers', 1)) 
        total_members = int(data.get('totalMembers', 2))
    except ValueError:
        abort(400, description="인원수는 숫자여야 합니다.")
        
    # [수정] 인원수 유효성 검사 (현원 < 목표)
    if current_members < 1:
         abort(400, description="현재 인원은 1명 이상이어야 합니다.")
    if total_members <= current_members:
         abort(400, description="목표 인원은 현재 인원보다 많아야 합니다.")


    new_post = Post(
        title=data['title'],
        content=data['content'],
        gallery=data['gallery'],
        currentMembers=current_members,
        totalMembers=total_members,
        isCompleted=False, # [수정] 생성 시점에는 항상 '모집중'
        user_id=current_user.id # 작성자 ID 저장
    )
    
    db.session.add(new_post)
    db.session.commit()

    return jsonify(new_post.to_dict()), 201

# [추가] 게시글 삭제 API
@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
@login_required
def delete_post(post_id):
    """게시글 삭제 (작성자 본인만 가능)"""
    post = Post.query.get_or_404(post_id)
    
    # 권한 확인 (작성자인지)
    if post.user_id != current_user.id:
        abort(403, description="게시글을 삭제할 권한이 없습니다.")
        
    try:
        db.session.delete(post)
        db.session.commit()
        return jsonify({'message': '게시글이 삭제되었습니다.'}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting post: {e}")
        return jsonify({'error': '삭제 중 오류가 발생했습니다.'}), 500


@app.route('/api/posts/<int:post_id>/view', methods=['POST'])
def view_post(post_id):
    """게시글 조회수 증가 및 정보 반환"""
    post = Post.query.get_or_404(post_id)
    post.views += 1
    db.session.commit()
    
    # [수정] 게시글 정보와 함께 '현재 사용자의 좋아요 여부' 전송
    data = post.to_dict()
    data['liked_by_user'] = False
    if current_user.is_authenticated:
        data['liked_by_user'] = Like.query.filter_by(
            user_id=current_user.id, 
            post_id=post.id
        ).first() is not None
        
    return jsonify(data)

@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
@login_required
def like_post(post_id):
    """[수정] 게시글 좋아요 토글 (로그인 필요)"""
    post = Post.query.get_or_404(post_id)
    
    # 이미 '좋아요'를 눌렀는지 확인
    existing_like = Like.query.filter_by(
        user_id=current_user.id,
        post_id=post_id
    ).first()
    
    liked_by_user = False
    
    if existing_like:
        # 이미 좋아요 눌렀으면 -> 좋아요 취소 (삭제)
        db.session.delete(existing_like)
        liked_by_user = False
    else:
        # 좋아요 누르지 않았으면 -> 좋아요 (추가)
        new_like = Like(user_id=current_user.id, post_id=post_id)
        db.session.add(new_like)
        liked_by_user = True

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error toggling like: {e}")
        return jsonify({'error': '좋아요 처리 중 오류가 발생했습니다.'}), 500

    # [수정] 최신 게시글 정보 + 좋아요 상태 반환
    updated_data = post.to_dict()
    updated_data['liked_by_user'] = liked_by_user
    
    return jsonify(updated_data)


@app.route('/api/posts/<int:post_id>/join', methods=['POST'])
@login_required
def join_post(post_id):
    """팟 참가 신청 (로그인 필요)"""
    post = Post.query.get_or_404(post_id)

    if post.isCompleted:
        return jsonify({'error': '이미 모집이 완료되었습니다!'}), 400
    
    if post.user_id == current_user.id:
        return jsonify({'error': '자신이 개설한 팟에는 참가 신청할 수 없습니다.'}), 400
    
    # (개선) TODO: 사용자가 이미 참가했는지 체크 (별도 테이블 필요)
    
    post.currentMembers += 1
    if post.currentMembers >= post.totalMembers:
        post.isCompleted = True
    
    db.session.commit()
    return jsonify(post.to_dict())

# --- 8. 프론트엔드 서빙 ---

@app.route('/')
def index():
    """메인 HTML 페이지 렌더링"""
    # current_user는 Jinja2 템플릿에 자동으로 전달됨
    return render_template('index.html')

if __name__ == '__main__':
    # 앱 컨텍스트 내에서 데이터베이스 테이블 생성
    # (DB 파일이 없으면 'dfind.db' 파일이 생성됨)
    with app.app_context():
        db.create_all()
        print("Database tables created.")
        
    app.run(debug=True, port=5000, use_reloader=False,host='0.0.0.0')
