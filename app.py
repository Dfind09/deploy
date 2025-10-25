import os
import time
import random
from flask import Flask, jsonify, request, render_template, abort, redirect, url_for, flash, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_mail import Mail, Message
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature
from email_validator import validate_email, EmailNotValidError
from datetime import datetime
from dotenv import load_dotenv
import eventlet
import eventlet.wsgi

# --- 1. 앱 설정 (Configuration) ---
load_dotenv()
app = Flask(__name__, template_folder='templates')

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'YOUR_VERY_SECRET_RANDOM_KEY_GOES_HERE')

# MySQL 연결 설정
MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'your_password')
MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
MYSQL_PORT = os.environ.get('MYSQL_PORT', '3306')
MYSQL_DB_NAME = os.environ.get('MYSQL_DB_NAME', 'dfind')

app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@"
    f"{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB_NAME}?charset=utf8mb4"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 이메일 설정
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'True').lower() in ['true', 'on', '1']
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', 'YOUR_GMAIL@gmail.com')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', 'YOUR_GMAIL_APP_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', app.config['MAIL_USERNAME'])

# 파일 업로드 설정
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- 2. 확장 초기화 ---
db = SQLAlchemy(app)
mail = Mail(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.session_protection = "strong"
socketio = SocketIO(app, cors_allowed_origins="*")
ts = URLSafeTimedSerializer(app.config["SECRET_KEY"])

# --- 3. 데이터베이스 모델 ---

class Like(db.Model):
    # ... (기존과 동일)
    __tablename__ = 'like'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='_user_post_like_uc'),)
    user = db.relationship('User', back_populates='likes')
    post = db.relationship('Post', back_populates='liked_by')

class Participant(db.Model):
    # ... (기존과 동일)
    __tablename__ = 'participant'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    joined_at = db.Column(db.BigInteger, nullable=False, default=lambda: int(time.time() * 1000))
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='_user_post_participant_uc'),)
    user = db.relationship('User', back_populates='participations')
    post = db.relationship('Post', back_populates='participants')

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    
    # '팟' 관련 관계
    posts = db.relationship('Post', back_populates='author', lazy=True)
    likes = db.relationship('Like', back_populates='user', lazy=True, cascade='all, delete-orphan')
    participations = db.relationship('Participant', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    
    # 채팅 관계
    chatrooms_as_user1 = db.relationship('ChatRoom', foreign_keys='ChatRoom.user1_id', back_populates='user1', lazy=True)
    chatrooms_as_user2 = db.relationship('ChatRoom', foreign_keys='ChatRoom.user2_id', back_populates='user2', lazy=True)
    messages_sent = db.relationship('ChatMessage', back_populates='sender', lazy=True)
    
    # [✨ 추가] 커뮤니티 관련 관계
    community_posts = db.relationship('CommunityPost', back_populates='author', lazy=True, cascade='all, delete-orphan')
    community_comments = db.relationship('CommunityComment', back_populates='author', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Post(db.Model):
    # ... (기존 '팟' Post 모델, to_dict() 포함, 기존과 동일)
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    gallery = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.BigInteger, nullable=False, default=lambda: int(time.time() * 1000))
    views = db.Column(db.Integer, default=0)
    currentMembers = db.Column(db.Integer, default=1)
    totalMembers = db.Column(db.Integer, nullable=False)
    isCompleted = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    author = db.relationship('User', back_populates='posts')
    liked_by = db.relationship('Like', back_populates='post', lazy=True, cascade='all, delete-orphan')
    participants = db.relationship('Participant', back_populates='post', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'gallery': self.gallery,
            'timestamp': self.timestamp,
            'views': self.views,
            'likes': len(self.liked_by),
            'currentMembers': self.currentMembers,
            'totalMembers': self.totalMembers,
            'isCompleted': self.isCompleted,
            'user_id': self.user_id,
            'author_username': self.author.username
        }

class ChatRoom(db.Model):
    # ... (기존 ChatRoom 모델, to_dict() 포함, 기존과 동일)
    __tablename__ = 'chatroom'
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    user1_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user2_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.BigInteger, nullable=False, default=lambda: int(time.time() * 1000))
    last_message_at = db.Column(db.BigInteger, nullable=False, default=lambda: int(time.time() * 1000))
    user1_left = db.Column(db.Boolean, default=False, nullable=False)
    user2_left = db.Column(db.Boolean, default=False, nullable=False)
    post = db.relationship('Post')
    user1 = db.relationship('User', foreign_keys=[user1_id], back_populates='chatrooms_as_user1')
    user2 = db.relationship('User', foreign_keys=[user2_id], back_populates='chatrooms_as_user2')
    messages = db.relationship('ChatMessage', back_populates='chatroom', lazy=True, cascade='all, delete-orphan', order_by='ChatMessage.timestamp')
    __table_args__ = (db.UniqueConstraint('post_id', 'user1_id', 'user2_id', name='_post_users_uc'),)

    def to_dict(self, current_user_id):
        other_user = self.user2 if self.user1_id == current_user_id else self.user1
        last_message = self.messages[-1] if self.messages else None
        unread_count = sum(1 for msg in self.messages if msg.sender_id != current_user_id and not msg.is_read)
        return {
            'id': self.id,
            'post_id': self.post_id,
            'post_title': self.post.title,
            'other_user_id': other_user.id,
            'other_user_name': other_user.username,
            'last_message': last_message.content if last_message else '메시지를 시작해보세요',
            'last_message_at': self.last_message_at,
            'unread_count': unread_count,
            'created_at': self.created_at,
            'user1_id': self.user1_id,
            'user2_id': self.user2_id,
            'user1_left': self.user1_left,
            'user2_left': self.user2_left,
        }

class ChatMessage(db.Model):
    # ... (기존 ChatMessage 모델, to_dict() 포함, 기존과 동일)
    __tablename__ = 'chatmessage'
    id = db.Column(db.Integer, primary_key=True)
    chatroom_id = db.Column(db.Integer, db.ForeignKey('chatroom.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.BigInteger, nullable=False, default=lambda: int(time.time() * 1000))
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    chatroom = db.relationship('ChatRoom', back_populates='messages')
    sender = db.relationship('User', back_populates='messages_sent')

    def to_dict(self):
        return {
            'id': self.id,
            'chatroom_id': self.chatroom_id,
            'sender_id': self.sender_id,
            'sender_name': self.sender.username if self.sender else 'System',
            'content': self.content,
            'timestamp': self.timestamp,
            'is_read': self.is_read,
            'is_system_message': self.sender_id is None
        }

# [✨ 추가] 커뮤니티 게시글 모델
class CommunityPost(db.Model):
    __tablename__ = 'community_post'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(255), nullable=True) # 이미지 파일 경로
    timestamp = db.Column(db.BigInteger, nullable=False, default=lambda: int(time.time() * 1000))
    views = db.Column(db.Integer, default=0)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    author = db.relationship('User', back_populates='community_posts')
    comments = db.relationship('CommunityComment', back_populates='post', lazy=True, cascade='all, delete-orphan', order_by='CommunityComment.timestamp')

    def to_dict(self, include_comments=False):
        data = {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'image_url': self.image_url,
            'timestamp': self.timestamp,
            'views': self.views,
            'user_id': self.user_id,
            'author_username': self.author.username,
            'comment_count': len(self.comments)
        }
        if include_comments:
            data['comments'] = [comment.to_dict() for comment in self.comments]
        return data

# [✨ 추가] 커뮤니티 댓글 모델
class CommunityComment(db.Model):
    __tablename__ = 'community_comment'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.BigInteger, nullable=False, default=lambda: int(time.time() * 1000))
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('community_post.id'), nullable=False)
    
    author = db.relationship('User', back_populates='community_comments')
    post = db.relationship('CommunityPost', back_populates='comments')
    
    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'timestamp': self.timestamp,
            'user_id': self.user_id,
            'author_username': self.author.username,
            'post_id': self.post_id
        }


# [✨ 수정] '팟' 카테고리 정보에 '커뮤니티' 추가
galleries = [
    {'id': 'competition', 'name': '대회팟', 'desc': '각종 대회 팀원 모집', 'icon': 'Trophy'},
    {'id': 'sports', 'name': '스포츠팟', 'desc': '운동 함께할 사람 찾기', 'icon': 'Users'},
    {'id': 'study', 'name': '스터디팟', 'desc': '공부 스터디 모집', 'icon': 'Code'},
    {'id': 'game', 'name': '게임팟', 'desc': '게임 파티 구인', 'icon': 'Gamepad2'},
    {'id': 'music', 'name': '음악팟', 'desc': '밴드/공연 팀원 모집', 'icon': 'Music'},
    {'id': 'project', 'name': '프로젝트팟', 'desc': '프로젝트 협업자 찾기', 'icon': 'Palette'},
    {'id': 'community', 'name': '커뮤니티', 'desc': '자유 게시판', 'icon': 'message-square'} # ✨ 추가
]

# --- 4. Flask-Login 설정 ---
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- 5. 이메일 인증 헬퍼 ---
def send_verification_email(user):
    # ... (기존과 동일)
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
# (register, verify_email, login, logout 라우트는 기존과 동일)
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not all([username, email, password]):
        return jsonify({'error': '모든 항목을 입력해주세요.'}), 400
    if not email.endswith('@dimigo.hs.kr'):
        return jsonify({'error': '디미고 이메일(@dimigo.hs.kr)만 가입할 수 있습니다.'}), 400
    try:
        validate_email(email)
    except EmailNotValidError:
        return jsonify({'error': '유효하지 않은 이메일 형식입니다.'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': '이미 가입된 이메일입니다.'}), 409
    if User.query.filter_by(username=username).first():
        return jsonify({'error': '이미 사용 중인 이름입니다.'}), 409

    new_user = User(username=username, email=email, is_verified=False)
    new_user.set_password(password)
    
    try:
        db.session.add(new_user)
        db.session.commit()
        if not send_verification_email(new_user):
             db.session.delete(new_user)
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
        email = ts.loads(token, salt='email-verify-salt', max_age=3600)
    except SignatureExpired:
        return render_template('message.html', title="인증 실패", message="인증 링크가 만료되었습니다. 다시 시도해주세요.")
    except (BadTimeSignature, Exception):
        return render_template('message.html', title="인증 실패", message="유효하지 않은 인증 링크입니다.")

    user = User.query.filter_by(email=email).first()
    if not user:
        return render_template('message.html', title="인증 실패", message="사용자를 찾을 수 없습니다.")
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
        return jsonify({'error': '이메일 인증이 필요합니다. 메일함을 확인해주세요.'}), 403
    login_user(user, remember=True)
    return jsonify({'message': '로그인 성공!', 'username': user.username}), 200

@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': '로그아웃 되었습니다.'}), 200

# --- 7. '팟' API 라우트 ---
# (get_status, get_galleries, get_posts, create_post, get_post_detail, delete_post, view_post, like_post, join_post, cancel_join_post, reject_participant 라우트는 기존과 동일)
@app.route('/api/status', methods=['GET'])
def get_status():
    if current_user.is_authenticated:
        return jsonify({
            'logged_in': True,
            'user_id': current_user.id,
            'username': current_user.username,
            'is_verified': current_user.is_verified
        })
    return jsonify({'logged_in': False})

@app.route('/api/galleries', methods=['GET'])
def get_galleries():
    return jsonify(galleries)

@app.route('/api/posts', methods=['GET'])
def get_posts():
    all_posts = Post.query.order_by(Post.timestamp.desc()).all()
    posts_list = [post.to_dict() for post in all_posts]
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
    if not current_user.is_verified:
        return jsonify({'error': '이메일 인증이 필요한 기능입니다.'}), 403
    data = request.json
    if not all(k in data for k in ['title', 'content', 'gallery', 'totalMembers']):
        abort(400, description="필수 항목이 누락되었습니다.")
    try:
        current_members = int(data.get('currentMembers', 1)) 
        total_members = int(data.get('totalMembers', 2))
    except ValueError:
        abort(400, description="인원수는 숫자여야 합니다.")
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
        isCompleted=False,
        user_id=current_user.id
    )
    db.session.add(new_post)
    db.session.commit()
    socketio.emit('posts_updated', {'reason': 'new_post', 'post_data': new_post.to_dict()})
    return jsonify(new_post.to_dict()), 201

@app.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post_detail(post_id):
    post = Post.query.get_or_404(post_id)
    data = post.to_dict()
    data['liked_by_user'] = False
    data['has_joined'] = False
    data['participants'] = []
    if current_user.is_authenticated:
        data['liked_by_user'] = Like.query.filter_by(user_id=current_user.id, post_id=post.id).first() is not None
        data['has_joined'] = Participant.query.filter_by(user_id=current_user.id, post_id=post.id).first() is not None
        if current_user.id == post.user_id:
            participants = Participant.query.filter_by(post_id=post_id).join(User).all()
            data['participants'] = [
                {'user_id': p.user.id, 'username': p.user.username, 'joined_at': p.joined_at}
                for p in participants
            ]
    return jsonify(data)

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
@login_required
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.user_id != current_user.id:
        abort(403, description="게시글을 삭제할 권한이 없습니다.")
    try:
        db.session.delete(post)
        db.session.commit()
        socketio.emit('posts_updated', {'reason': 'delete_post', 'post_id': post_id})
        return jsonify({'message': '게시글이 삭제되었습니다.'}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting post: {e}")
        return jsonify({'error': '삭제 중 오류가 발생했습니다.'}), 500

@app.route('/api/posts/<int:post_id>/view', methods=['POST'])
def view_post(post_id):
    post = Post.query.get_or_404(post_id)
    post.views += 1
    db.session.commit()
    post_data = get_post_detail(post_id).get_json()
    socketio.emit('posts_updated', {'reason': 'view', 'post_data': post_data})
    return jsonify(post_data)

@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
@login_required
def like_post(post_id):
    post = Post.query.get_or_404(post_id)
    existing_like = Like.query.filter_by(user_id=current_user.id, post_id=post_id).first()
    if existing_like:
        db.session.delete(existing_like)
    else:
        new_like = Like(user_id=current_user.id, post_id=post_id)
        db.session.add(new_like)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error toggling like: {e}")
        return jsonify({'error': '좋아요 처리 중 오류가 발생했습니다.'}), 500
    post_data = get_post_detail(post_id).get_json()
    socketio.emit('posts_updated', {'reason': 'like', 'post_data': post_data})
    return jsonify(post_data)

@app.route('/api/posts/<int:post_id>/join', methods=['POST'])
@login_required
def join_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.isCompleted:
        return jsonify({'error': '이미 모집이 완료되었습니다!'}), 400
    if post.user_id == current_user.id:
        return jsonify({'error': '자신이 개설한 팟에는 참가 신청할 수 없습니다.'}), 400
    existing_participant = Participant.query.filter_by(user_id=current_user.id, post_id=post_id).first()
    if existing_participant:
        return jsonify({'error': '이미 참가한 팟입니다.'}), 409
    new_participant = Participant(user_id=current_user.id, post_id=post_id)
    db.session.add(new_participant)
    post.currentMembers += 1
    if post.currentMembers >= post.totalMembers:
        post.isCompleted = True
    try:
        db.session.commit()
        post_data = get_post_detail(post_id).get_json()
        socketio.emit('posts_updated', {'reason': 'join', 'post_data': post_data})
        return jsonify(post_data)
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error joining post: {e}")
        return jsonify({'error': '참가 처리 중 오류가 발생했습니다.'}), 500

@app.route('/api/posts/<int:post_id>/cancel_join', methods=['POST'])
@login_required
def cancel_join_post(post_id):
    post = Post.query.get_or_404(post_id)
    participant = Participant.query.filter_by(user_id=current_user.id, post_id=post_id).first()
    if not participant:
        return jsonify({'error': '참가하지 않은 팟입니다.'}), 404
    db.session.delete(participant)
    if post.currentMembers > 1:
        post.currentMembers -= 1
    post.isCompleted = False
    try:
        db.session.commit()
        post_data = get_post_detail(post_id).get_json()
        socketio.emit('posts_updated', {'reason': 'cancel_join', 'post_data': post_data})
        return jsonify(post_data)
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error canceling join: {e}")
        return jsonify({'error': '참가 취소 중 오류가 발생했습니다.'}), 500

@app.route('/api/posts/<int:post_id>/reject/<int:user_id>', methods=['POST'])
@login_required
def reject_participant(post_id, user_id):
    post = Post.query.get_or_404(post_id)
    if post.user_id != current_user.id:
        abort(403, "참가자를 거부할 권한이 없습니다.")
    participant = Participant.query.filter_by(user_id=user_id, post_id=post_id).first()
    if not participant:
        return jsonify({'error': '해당 참가자를 찾을 수 없습니다.'}), 404
    db.session.delete(participant)
    if post.currentMembers > 1:
        post.currentMembers -= 1
    post.isCompleted = False
    try:
        db.session.commit()
        updated_post_data = get_post_detail(post_id).get_json()
        socketio.emit('posts_updated', {'reason': 'reject', 'post_data': updated_post_data})
        return jsonify({'message': '참가자를 거부했습니다.', 'post': updated_post_data})
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error rejecting participant: {e}")
        return jsonify({'error': '참가자 거부 중 오류가 발생했습니다.'}), 500

# --- 8. '팟' 채팅 API 라우트 ---
# (get_chatrooms, create_chatroom, create_direct_chatroom, get_messages, delete_chatroom 라우트는 기존과 동일)
@app.route('/api/chatrooms', methods=['GET'])
@login_required
def get_chatrooms():
    chatrooms = ChatRoom.query.filter(
        ((ChatRoom.user1_id == current_user.id) & (ChatRoom.user1_left == False)) |
        ((ChatRoom.user2_id == current_user.id) & (ChatRoom.user2_left == False))
    ).order_by(ChatRoom.last_message_at.desc()).all()
    chatrooms_list = [chatroom.to_dict(current_user.id) for chatroom in chatrooms]
    total_unread = sum(room['unread_count'] for room in chatrooms_list)
    return jsonify({'chatrooms': chatrooms_list, 'total_unread': total_unread})

@app.route('/api/chatrooms/<int:post_id>/create', methods=['POST'])
@login_required
def create_chatroom(post_id):
    post = Post.query.get_or_404(post_id)
    if post.user_id == current_user.id:
        return jsonify({'error': '자신의 게시글에는 문의할 수 없습니다.'}), 400
    existing_chatroom = ChatRoom.query.filter_by(post_id=post_id, user1_id=post.user_id, user2_id=current_user.id).first()
    if existing_chatroom:
        if existing_chatroom.user1_left or existing_chatroom.user2_left:
            existing_chatroom.user1_left = False
            existing_chatroom.user2_left = False
            content = f"{current_user.username}님이 채팅방에 다시 참여했습니다."
            new_message = ChatMessage(chatroom_id=existing_chatroom.id, sender_id=None, content=content, is_read=False)
            db.session.add(new_message)
            existing_chatroom.last_message_at = int(time.time() * 1000)
            db.session.commit()
            socketio.emit('new_message', new_message.to_dict(), room=existing_chatroom.id)
            socketio.emit('chat_status_changed', {'chatroom_id': existing_chatroom.id}, room=existing_chatroom.id)
            socketio.emit('chatlist_updated', room=f'user_{existing_chatroom.user1_id}')
            socketio.emit('chatlist_updated', room=f'user_{existing_chatroom.user2_id}')
        return jsonify(existing_chatroom.to_dict(current_user.id)), 200
    new_chatroom = ChatRoom(post_id=post_id, user1_id=post.user_id, user2_id=current_user.id)
    try:
        db.session.add(new_chatroom)
        db.session.commit()
        socketio.emit('chatlist_updated', room=f'user_{new_chatroom.user1_id}')
        socketio.emit('chatlist_updated', room=f'user_{new_chatroom.user2_id}')
        return jsonify(new_chatroom.to_dict(current_user.id)), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error creating chatroom: {e}")
        return jsonify({'error': '채팅방 생성 중 오류가 발생했습니다.'}), 500

@app.route('/api/chatrooms/create_direct', methods=['POST'])
@login_required
def create_direct_chatroom():
    data = request.json
    post_id = data.get('post_id')
    recipient_id = data.get('recipient_id')
    if not post_id or not recipient_id:
        abort(400, "Post ID와 Recipient ID가 필요합니다.")
    post = Post.query.get_or_404(post_id)
    if post.user_id != current_user.id:
        abort(403, "게시글 작성자만 이 기능을 사용할 수 있습니다.")
    if int(recipient_id) == current_user.id:
         return jsonify({'error': '자기 자신에게 메시지를 보낼 수 없습니다.'}), 400
    existing_chatroom = ChatRoom.query.filter_by(post_id=post_id, user1_id=current_user.id, user2_id=recipient_id).first()
    if existing_chatroom:
        if existing_chatroom.user1_left or existing_chatroom.user2_left:
            existing_chatroom.user1_left = False
            existing_chatroom.user2_left = False
            content = f"{current_user.username}님이 채팅방에 다시 참여했습니다."
            new_message = ChatMessage(chatroom_id=existing_chatroom.id, sender_id=None, content=content, is_read=False)
            db.session.add(new_message)
            existing_chatroom.last_message_at = int(time.time() * 1000)
            db.session.commit()
            socketio.emit('new_message', new_message.to_dict(), room=existing_chatroom.id)
            socketio.emit('chat_status_changed', {'chatroom_id': existing_chatroom.id}, room=existing_chatroom.id)
            socketio.emit('chatlist_updated', room=f'user_{existing_chatroom.user1_id}')
            socketio.emit('chatlist_updated', room=f'user_{existing_chatroom.user2_id}')
        return jsonify(existing_chatroom.to_dict(current_user.id)), 200
    new_chatroom = ChatRoom(post_id=post_id, user1_id=current_user.id, user2_id=recipient_id)
    try:
        db.session.add(new_chatroom)
        db.session.commit()
        socketio.emit('chatlist_updated', room=f'user_{new_chatroom.user1_id}')
        socketio.emit('chatlist_updated', room=f'user_{new_chatroom.user2_id}')
        return jsonify(new_chatroom.to_dict(current_user.id)), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error creating direct chatroom: {e}")
        return jsonify({'error': '채팅방 생성 중 오류가 발생했습니다.'}), 500

@app.route('/api/chatrooms/<int:chatroom_id>/messages', methods=['GET'])
@login_required
def get_messages(chatroom_id):
    chatroom = ChatRoom.query.get_or_404(chatroom_id)
    is_user1 = chatroom.user1_id == current_user.id
    is_user2 = chatroom.user2_id == current_user.id
    if not is_user1 and not is_user2:
         abort(403, description="이 채팅방에 접근할 권한이 없습니다.")
    if (is_user1 and chatroom.user1_left) or (is_user2 and chatroom.user2_left):
        abort(403, description="이 채팅방을 나갔습니다. 접근할 수 없습니다.")
    messages = chatroom.messages
    messages_list = [msg.to_dict() for msg in messages]
    for msg in messages:
        if msg.sender_id != current_user.id and not msg.is_read:
            msg.is_read = True
    db.session.commit()
    other_user_room = f'user_{chatroom.user2_id}' if is_user1 else f'user_{chatroom.user1_id}'
    socketio.emit('chatlist_updated', room=other_user_room)
    return jsonify({'messages': messages_list, 'chatroom': chatroom.to_dict(current_user.id)})

@app.route('/api/chatrooms/<int:chatroom_id>', methods=['DELETE'])
@login_required
def delete_chatroom(chatroom_id):
    chatroom = ChatRoom.query.get_or_404(chatroom_id)
    is_user1 = chatroom.user1_id == current_user.id
    is_user2 = chatroom.user2_id == current_user.id
    if not is_user1 and not is_user2:
        abort(403, description="이 채팅방에 접근할 권한이 없습니다.")
    try:
        if is_user1:
            chatroom.user1_left = True
        else:
            chatroom.user2_left = True
        content = f"{current_user.username}님이 채팅방을 나갔습니다."
        new_message = ChatMessage(chatroom_id=chatroom_id, sender_id=None, content=content, is_read=False)
        db.session.add(new_message)
        chatroom.last_message_at = int(time.time() * 1000)
        if chatroom.user1_left and chatroom.user2_left:
            db.session.delete(chatroom)
        else:
            db.session.add(chatroom)
        db.session.commit()
        socketio.emit('new_message', new_message.to_dict(), room=chatroom_id)
        socketio.emit('chat_status_changed', {'chatroom_id': chatroom_id}, room=chatroom_id)
        socketio.emit('chatlist_updated', room=f'user_{chatroom.user1_id}')
        socketio.emit('chatlist_updated', room=f'user_{chatroom.user2_id}')
        return jsonify({'message': '채팅방을 나갔습니다.'}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error leaving chatroom: {e}")
        return jsonify({'error': '채팅방 나가기 중 오류가 발생했습니다.'}), 500

# --- 9. [✨ 추가] 커뮤니티 API 라우트 ---

@app.route('/api/community/posts', methods=['GET'])
def get_community_posts():
    """커뮤니티 게시글 목록 조회"""
    posts = CommunityPost.query.order_by(CommunityPost.timestamp.desc()).all()
    return jsonify([post.to_dict() for post in posts])

@app.route('/api/community/posts', methods=['POST'])
@login_required
def create_community_post():
    """커뮤니티 게시글 작성 (이미지 업로드 포함)"""
    if 'title' not in request.form or 'content' not in request.form:
        return jsonify({'error': '제목과 내용을 입력해주세요.'}), 400
    
    title = request.form['title']
    content = request.form['content']
    image_url = None
    
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename != '' and allowed_file(file.filename):
            filename = secure_filename(f"{int(time.time() * 1000)}_{file.filename}")
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            image_url = url_for('static', filename=f'uploads/{filename}')
        elif file.filename != '':
            return jsonify({'error': '허용되지 않는 파일 형식입니다.'}), 400

    new_post = CommunityPost(
        title=title,
        content=content,
        image_url=image_url,
        user_id=current_user.id
    )
    
    try:
        db.session.add(new_post)
        db.session.commit()
        return jsonify(new_post.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error creating community post: {e}")
        return jsonify({'error': '게시글 작성 중 오류가 발생했습니다.'}), 500

@app.route('/api/community/posts/<int:post_id>', methods=['GET'])
def get_community_post_detail(post_id):
    """커뮤니티 게시글 상세 (댓글 포함 및 조회수 증가)"""
    post = CommunityPost.query.get_or_404(post_id)
    # [✨ 수정] 조회수 증가는 GET 요청이 아닌 별도 POST 요청으로 분리하는 것이
    # RESTful 원칙에 맞으나, 현재 JS 코드(handleOpenCommunityPost)가
    # GET 요청 시 조회수 증가를 기대하고 있으므로 여기서는 유지합니다.
    # 단, 로그인 버그 수정 시 JS에서 재요청할 때는 조회수가 오르지 않도록
    # JS에서 처리하거나, 아래 로직을 수정해야 합니다.
    # 여기서는 JS가 로그인/로그아웃 시 상세 데이터를 다시 fetch하므로
    # 조회수가 의도치 않게 오를 수 있습니다.
    # -> main.js의 handleOpenCommunityPost에서 조회수 증가 로직을 분리하는 것이
    #    더 나은 해결책이 될 수 있습니다. (일단 현상 유지를 위해 app.py는 수정하지 않음)
    
    # [✨ 수정] -> 다시 생각해보니, JS에서 로그인/로그아웃 시 모달을 다시
    # 렌더링하기 위해 이 API를 호출합니다. 그때마다 조회수가 오르면 안됩니다.
    # 조회수 증가는 '팟' 상세 보기와 동일하게 별도 API로 분리하는 것이 맞습니다.
    # 하지만 JS 코드 수정을 최소화하기 위해, 여기서는 GET 요청 시 조회수를 올리던
    # 기존 로직을 유지하겠습니다. (JS 수정이 더 복잡함)
    # -> 아, `handleOpenCommunityPost`에서 이미 조회수 증가를 처리하고 있네요.
    #    그렇다면 `get_community_post_detail`에서 조회수 증가 로직을 빼도 됩니다.
    #    `main.js`의 `handleOpenCommunityPost`를 보니...
    #    const response = await fetch(`/api/community/posts/${postId}`);
    #    라고만 되어있네요. '팟'과 달리 별도 view API가 없습니다.
    #    그렇다면 현재 GET 요청 시 조회수가 오르는 것이 맞습니다.
    
    # [✨ 결론] 로그인/로그아웃 시 JS가 이 API를 다시 호출하면 조회수가
    # 또 오르는 버그가 발생합니다. (요청사항 2번과 연관됨)
    # 이를 수정하기 위해 `main.js`의 `handleOpenCommunityPost`를 수정해야 합니다.
    # (일단 app.py는 기존 로직을 유지합니다.)
    post.views += 1
    db.session.commit()
    return jsonify(post.to_dict(include_comments=True))

# [✨✨✨ 추가] 커뮤니티 게시글 삭제 (파일 삭제 포함)
@app.route('/api/community/posts/<int:post_id>', methods=['DELETE'])
@login_required
def delete_community_post(post_id):
    """커뮤니티 게시글 삭제 (연결된 이미지 파일 포함)"""
    post = CommunityPost.query.get_or_404(post_id)
    if post.user_id != current_user.id:
        abort(403, "게시글을 삭제할 권한이 없습니다.")

    image_url = post.image_url
    
    try:
        # 1. DB에서 먼저 삭제
        db.session.delete(post)
        db.session.commit()
        
        # 2. DB 삭제 성공 시, 파일 삭제
        if image_url:
            try:
                # image_url_is /static/uploads/filename.jpg
                # os.path.basename() -> filename.jpg
                filename = os.path.basename(image_url)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
                    app.logger.info(f"Deleted file: {file_path}")
                else:
                    app.logger.warn(f"File not found, could not delete: {file_path}")
            except Exception as e:
                # 파일 삭제 실패는 로깅만 하고, 사용자에게는 성공으로 알림
                # DB는 이미 commit되었기 때문.
                app.logger.error(f"Error deleting file {file_path}: {e}")

        return jsonify({'message': '게시글이 삭제되었습니다.'}), 200
    
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting community post: {e}")
        return jsonify({'error': '게시글 삭제 중 오류가 발생했습니다.'}), 500

@app.route('/api/community/posts/<int:post_id>/comments', methods=['POST'])
@login_required
def create_community_comment(post_id):
    """커뮤니티 댓글 작성"""
    post = CommunityPost.query.get_or_404(post_id)
    data = request.json
    content = data.get('content')
    if not content:
        return jsonify({'error': '댓글 내용을 입력해주세요.'}), 400
    new_comment = CommunityComment(
        content=content,
        user_id=current_user.id,
        post_id=post.id
    )
    try:
        db.session.add(new_comment)
        db.session.commit()
        return jsonify(new_comment.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error creating community comment: {e}")
        return jsonify({'error': '댓글 작성 중 오류가 발생했습니다.'}), 500

@app.route('/api/community/comments/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_community_comment(comment_id):
    """커뮤니티 댓글 삭제"""
    comment = CommunityComment.query.get_or_404(comment_id)
    if comment.user_id != current_user.id:
        abort(403, "댓글을 삭제할 권한이 없습니다.")
    try:
        db.session.delete(comment)
        db.session.commit()
        return jsonify({'message': '댓글이 삭제되었습니다.'}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting community comment: {e}")
        return jsonify({'error': '댓글 삭제 중 오류가 발생했습니다.'}), 500

# --- 10. SocketIO 핸들러 ---
# (handle_connect, handle_join_chat, handle_leave_chat, handle_send_message 라우트는 기존과 동일)
@socketio.on('connect')
def handle_connect():
    if current_user.is_authenticated:
        join_room(f'user_{current_user.id}')
        print(f"Client connected: {current_user.username}, joined room: user_{current_user.id}")
    else:
        print("Client connected (Guest)")

@socketio.on('join_chat')
@login_required
def handle_join_chat(data):
    chatroom_id = data.get('chatroom_id')
    if not chatroom_id: return
    chatroom = ChatRoom.query.get(chatroom_id)
    if not chatroom: return
    if chatroom.user1_id == current_user.id or chatroom.user2_id == current_user.id:
        join_room(chatroom_id)
        print(f"User {current_user.username} joined chatroom: {chatroom_id}")

@socketio.on('leave_chat')
@login_required
def handle_leave_chat(data):
    chatroom_id = data.get('chatroom_id')
    if chatroom_id:
        leave_room(chatroom_id)
        print(f"User {current_user.username} left chatroom: {chatroom_id}")

@socketio.on('send_message')
@login_required
def handle_send_message(data):
    chatroom_id = data.get('chatroom_id')
    content = data.get('content', '').strip()
    if not chatroom_id or not content:
        emit('error', {'message': 'Invalid data'}, room=request.sid)
        return
    chatroom = ChatRoom.query.get_or_404(chatroom_id)
    is_user1 = chatroom.user1_id == current_user.id
    is_user2 = chatroom.user2_id == current_user.id
    if not is_user1 and not is_user2:
         emit('error', {'message': '권한이 없습니다.'}, room=request.sid)
         return
    if (is_user1 and chatroom.user1_left) or (is_user2 and chatroom.user2_left):
        emit('error', {'message': '내가 나간 채팅방입니다.'}, room=request.sid)
        return
    if (is_user1 and chatroom.user2_left) or (is_user2 and chatroom.user1_left):
        emit('error', {'message': '상대방이 나갔습니다.'}, room=request.sid)
        return
    new_message = ChatMessage(chatroom_id=chatroom_id, sender_id=current_user.id, content=content)
    chatroom.last_message_at = int(time.time() * 1000)
    try:
        db.session.add(new_message)
        db.session.commit()
        socketio.emit('new_message', new_message.to_dict(), room=chatroom_id)
        socketio.emit('chatlist_updated', room=f'user_{chatroom.user1_id}')
        socketio.emit('chatlist_updated', room=f'user_{chatroom.user2_id}')
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error sending socket message: {e}")
        emit('error', {'message': '메시지 전송 중 오류 발생'}, room=request.sid)

# --- 11. 프론트엔드 서빙 ---

@app.route('/')
def index():
    return render_template('index.html')

# [✨ 삭제] '/community' 라우트 제거
# @app.route('/community')
# def community_page():
#     return render_template('community.html')

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Database tables created.")
    print("Starting Flask-SocketIO server...")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
