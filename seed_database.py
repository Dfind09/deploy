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
DUMMY_NAMES =[
  [
    "장지호",
    "brave-dev-backend.kwon"
  ],
  [
    "신도윤",
    "vivid.nova.cloud.lim"
  ],
  [
    "안다빈",
    "ByteUxui.oh"
  ],
  [
    "황준호",
    "SoftLoopSystem.oh"
  ],
  [
    "박지성",
    "calmDustRobotics.lim"
  ],
  [
    "김서연",
    "dusty-dream.lim"
  ],
  [
    "장지성",
    "cloud-master-static.lee"
  ],
  [
    "배유진",
    "echo-security.jang"
  ],
  [
    "이유진",
    "golden-path-web.lee"
  ],
  [
    "강수빈",
    "system_wave_artist.jang"
  ],
  [
    "박지우",
    "ctfPathPlayer.kwon"
  ],
  [
    "조수빈",
    "shadow-uxui.park"
  ],
  [
    "황예린",
    "FlareEngineerVivid.lim"
  ],
  [
    "이윤서",
    "CodeEngineerHidden.choi"
  ],
  [
    "배도윤",
    "empty.code.kim"
  ],
  [
    "오서윤",
    "midnight_cloud_embedded.jang"
  ],
  [
    "안지민",
    "CircuitMakerBright.lee"
  ],
  [
    "정다빈",
    "rapid.code.algo.han"
  ],
  [
    "강하늘",
    "PixelHackerRestless.park"
  ],
  [
    "황현서",
    "MidnightCircuitAlgo.kang"
  ],
  [
    "송예린",
    "lazyLoopBrand.bae"
  ],
  [
    "박예린",
    "shift_mystic_path.oh"
  ],
  [
    "김민준",
    "mobile_horizon_hacker.han"
  ],
  [
    "신지호",
    "staticMakerWeb.bae"
  ],
  [
    "최지성",
    "horizonAlgo.lim"
  ],
  [
    "한지우",
    "sing.static.flow.ahn"
  ],
  [
    "서지민",
    "dream_system.ryu"
  ],
  [
    "배다빈",
    "midnight.soul.ahn"
  ],
  [
    "송유진",
    "crimson.player.web.bae"
  ],
  [
    "오도윤",
    "serene_maker_system.lim"
  ],
  [
    "문지성",
    "deepFlowHacker.bae"
  ],
  [
    "윤태윤",
    "shydustweb.kwon"
  ],
  [
    "고예린",
    "gentleflowdeep.kim"
  ],
  [
    "정도윤",
    "rippleplayertiny.lee"
  ],
  [
    "조윤서",
    "StormPlayerGolden.lim"
  ],
  [
    "고지민",
    "systempixellab.lee"
  ],
  [
    "강서연",
    "ColdFrameData.jang"
  ],
  [
    "강도윤",
    "RiseTinyFrame.lee"
  ],
  [
    "배지성",
    "coldDust.yoon"
  ],
  [
    "임하늘",
    "quietengineerembedded.lee"
  ],
  [
    "문하준",
    "wild.lab.algo.ahn"
  ],
  [
    "한다빈",
    "burningDreamCloud.yoon"
  ],
  [
    "정윤서",
    "crashLazySpark.choi"
  ],
  [
    "임수빈",
    "circuit-cloud.kim"
  ],
  [
    "서예린",
    "DiveGentleFlow.jang"
  ],
  [
    "윤윤서",
    "massivedreamerbackend.kwon"
  ],
  [
    "한서연",
    "field.web.lee"
  ],
  [
    "송하늘",
    "sync.calm.field.kim"
  ],
  [
    "조하늘",
    "FrameDevSilver.kwon"
  ],
  [
    "하수빈",
    "memoryMasterBright.ahn"
  ],
  [
    "서도윤",
    "CrimsonShadow.park"
  ],
  [
    "김다빈",
    "dustAlgo.yoon"
  ],
  [
    "하하준",
    "bloom-lazy-mind.kim"
  ],
  [
    "윤지호",
    "golden.mind.embedded.choi"
  ],
  [
    "유유진",
    "flare_lab_hidden.han"
  ],
  [
    "장지민",
    "cosmic-flare.bae"
  ],
  [
    "하하늘",
    "ShySoul.kang"
  ],
  [
    "한서윤",
    "crimsonPlayerEmbedded.kwon"
  ],
  [
    "김서윤",
    "flow_lab_cosmic.kwon"
  ],
  [
    "장예린",
    "sereneDreamerFrontend.kwon"
  ],
  [
    "황다빈",
    "shadow-artist-dusty.lee"
  ],
  [
    "송준호",
    "lazyspark.yoon"
  ],
  [
    "하준호",
    "lazy.lab.algo.kwon"
  ],
  [
    "임현서",
    "rapidDevAi.oh"
  ],
  [
    "신은별",
    "HiddenCircuit.lim"
  ],
  [
    "윤지민",
    "serene-engineer-pm.lim"
  ],
  [
    "김은별",
    "glitch.master.golden.han"
  ],
  [
    "배지호",
    "LoopPlayerShy.ahn"
  ],
  [
    "이준호",
    "dusty_artist_ctf.oh"
  ],
  [
    "한예린",
    "bloom-golden-pixel.ryu"
  ],
  [
    "안수빈",
    "circuit.player.rapid.ryu"
  ],
  [
    "최은별",
    "quiet.storm.backend.kwon"
  ],
  [
    "유서연",
    "SoftWaveMobile.lim"
  ],
  [
    "유은별",
    "clever.memory.oh"
  ],
  [
    "유하준",
    "wander-bright-nova.han"
  ],
  [
    "이서윤",
    "coldnova.choi"
  ],
  [
    "송은별",
    "robotics_echo_engineer.bae"
  ],
  [
    "신다빈",
    "brightfield.lee"
  ],
  [
    "유수빈",
    "vividmemoryai.kim"
  ],
  [
    "권하늘",
    "loop.dreamer.cosmic.park"
  ],
  [
    "안지호",
    "MysticThread.jang"
  ],
  [
    "최하늘",
    "signal-lab-gentle.han"
  ],
  [
    "이지성",
    "crimson.cloud.embedded.oh"
  ],
  [
    "장현서",
    "vivid_byte.kwon"
  ],
  [
    "한하늘",
    "circuit.frontend.kang"
  ],
  [
    "황태윤",
    "crashMassivePath.kwon"
  ],
  [
    "윤도윤",
    "memory-algo.yoon"
  ],
  [
    "오지성",
    "pixeldeep.park"
  ],
  [
    "정하늘",
    "clevercodesecurity.oh"
  ],
  [
    "강지민",
    "pixelDevGolden.kim"
  ],
  [
    "김지민",
    "BackendFrameLab.lee"
  ],
  [
    "김예린",
    "horizon-uxui.kang"
  ],
  [
    "고현우",
    "sereneLabEmbedded.yoon"
  ],
  [
    "서하준",
    "floatsilverhorizon.park"
  ],
  [
    "송윤서",
    "frontend_circuit_hacker.kwon"
  ],
  [
    "오서연",
    "dreamengineerblue.park"
  ],
  [
    "김현우",
    "algo_path_dreamer.kim"
  ],
  [
    "임지호",
    "FloatColdMind.choi"
  ],
  [
    "강지성",
    "storm.dev.silver.lim"
  ],
  [
    "배서윤",
    "flowcloud.ahn"
  ],
  [
    "문은별",
    "ripplebackend.kwon"
  ],
  [
    "강지우",
    "streamMobile.lim"
  ],
  [
    "송수빈",
    "crimson-dev-data.bae"
  ],
  [
    "서다빈",
    "mysticSoulSystem.ryu"
  ],
  [
    "한지민",
    "fadegentlesoul.yoon"
  ],
  [
    "장현우",
    "burnSoftField.lim"
  ],
  [
    "조서윤",
    "crimsonSignal.park"
  ],
  [
    "최서윤",
    "dustyflare.lee"
  ],
  [
    "장서윤",
    "RapidPath.kwon"
  ],
  [
    "황지우",
    "floatclevershadow.lim"
  ],
  [
    "배태윤",
    "signalPlayerCosmic.kwon"
  ],
  [
    "정은별",
    "hiddenframemobile.kim"
  ],
  [
    "박지민",
    "midnightFieldSystem.ryu"
  ],
  [
    "박현우",
    "frameSecurity.ryu"
  ],
  [
    "문현우",
    "goldenstormpm.lim"
  ],
  [
    "하은별",
    "wander_serene_cloud.kang"
  ],
  [
    "신하준",
    "coldsparksecurity.kim"
  ],
  [
    "최준호",
    "flow.midnight.stream.choi"
  ],
  [
    "문지민",
    "lazy_loop.park"
  ],
  [
    "한지성",
    "stream-dreamer-dusty.jang"
  ],
  [
    "신서윤",
    "sing-neon-horizon.choi"
  ],
  [
    "강다빈",
    "web_circuit_dev.han"
  ],
  [
    "신지우",
    "cloud-data.bae"
  ],
  [
    "고지호",
    "vivid.dream.yoon"
  ],
  [
    "장유진",
    "EmptyLabSecurity.lim"
  ],
  [
    "장다빈",
    "brave-cloud-deep.ryu"
  ],
  [
    "오지민",
    "crimson-thread-frontend.han"
  ],
  [
    "고준호",
    "burningArtistSystem.kang"
  ],
  [
    "임하준",
    "blinkMysticFlow.jang"
  ],
  [
    "최유진",
    "tinyLabBrand.ahn"
  ],
  [
    "권민준",
    "softStreamRobotics.park"
  ],
  [
    "임지민",
    "pixeldeep.kwon"
  ],
  [
    "신윤서",
    "matrix-master-static.kim"
  ],
  [
    "유다빈",
    "syncTinySpark.choi"
  ],
  [
    "이민준",
    "frame-embedded.kwon"
  ],
  [
    "권수빈",
    "neon_dev_ai.yoon"
  ],
  [
    "황지민",
    "neon_flow.jang"
  ],
  [
    "권서윤",
    "thread_engineer_dusty.yoon"
  ],
  [
    "배은별",
    "RapidRipple.choi"
  ],
  [
    "윤서연",
    "cloud.lab.golden.kim"
  ],
  [
    "장준호",
    "midnight_maker_data.ryu"
  ],
  [
    "문지우",
    "nova-lab-golden.han"
  ],
  [
    "나도윤",
    "deep_byte_artist.lee"
  ],
  [
    "정민준",
    "web_signal_dreamer.ahn"
  ],
  [
    "신예린",
    "rippleEngineerTiny.han"
  ],
  [
    "김지호",
    "serene.stream.oh"
  ],
  [
    "강은별",
    "braveNovaDeep.lim"
  ],
  [
    "안현서",
    "dust_brand.jang"
  ],
  [
    "이다빈",
    "mobileFlareArtist.lee"
  ],
  [
    "서윤서",
    "GentleEchoBackend.ryu"
  ],
  [
    "강현우",
    "calm-ripple-algo.kim"
  ],
  [
    "김윤서",
    "LazyShadow.ryu"
  ],
  [
    "안서연",
    "mystic.spark.backend.bae"
  ],
  [
    "안태윤",
    "massiveCloud.yoon"
  ],
  [
    "장수빈",
    "bluemasterbrand.choi"
  ],
  [
    "유하늘",
    "DustyLoopDesign.ahn"
  ],
  [
    "이예린",
    "burning_dust_brand.choi"
  ],
  [
    "강준호",
    "cleverhackerdesign.han"
  ],
  [
    "오하준",
    "massive_player_cloud.han"
  ],
  [
    "조도윤",
    "midnightMakerAlgo.lee"
  ],
  [
    "권현우",
    "storm-mobile.bae"
  ],
  [
    "김지우",
    "securityWavePlayer.yoon"
  ],
  [
    "임태윤",
    "stream-dreamer-cosmic.bae"
  ],
  [
    "장지우",
    "burningStormWeb.bae"
  ],
  [
    "송지민",
    "design-pixel-player.ryu"
  ],
  [
    "서태윤",
    "shadow-algo.ahn"
  ],
  [
    "장서연",
    "calmFrame.ahn"
  ],
  [
    "황현우",
    "wild.dream.frontend.ryu"
  ],
  [
    "강현서",
    "silver.field.frontend.kim"
  ],
  [
    "유현우",
    "gentle-lab-deep.han"
  ],
  [
    "안서윤",
    "gentleNovaRobotics.bae"
  ],
  [
    "송지성",
    "StreamHackerDusty.bae"
  ],
  [
    "권은별",
    "rise_serene_soul.han"
  ],
  [
    "안지우",
    "stormCtf.park"
  ],
  [
    "권윤서",
    "blue.dreamer.brand.ryu"
  ],
  [
    "권지우",
    "quiet.wave.kang"
  ],
  [
    "조태윤",
    "webSoulLab.han"
  ],
  [
    "서수빈",
    "uxuicodemaker.jang"
  ],
  [
    "김준호",
    "field.web.park"
  ],
  [
    "임현우",
    "matrix-hacker-neon.ahn"
  ],
  [
    "임서윤",
    "pm.cloud.dev.kwon"
  ],
  [
    "임다빈",
    "designripplemaster.jang"
  ],
  [
    "오태윤",
    "flow.hidden.spark.park"
  ],
  [
    "오수빈",
    "horizon.dev.bright.bae"
  ],
  [
    "나민준",
    "cosmic_pixel.bae"
  ],
  [
    "박은별",
    "burn-hidden-thread.oh"
  ],
  [
    "문현서",
    "matrixmobile.ryu"
  ],
  [
    "나수빈",
    "soulWeb.bae"
  ],
  [
    "나서연",
    "hiddenSparkPm.bae"
  ],
  [
    "김지성",
    "cold_lab_ai.kang"
  ],
  [
    "문윤서",
    "SignalDeep.park"
  ],
  [
    "임도윤",
    "lazy.shadow.embedded.ryu"
  ],
  [
    "신준호",
    "BurningPixel.kang"
  ],
  [
    "한준호",
    "wild-dev-uxui.choi"
  ],
  [
    "안민준",
    "path.engineer.serene.oh"
  ],
  [
    "송다빈",
    "RippleEngineerGentle.lee"
  ],
  [
    "한현서",
    "fade_brave_nova.kang"
  ],
  [
    "배현서",
    "SingNeonHorizon.han"
  ],
  [
    "서지성",
    "wildEcho.lee"
  ],
  [
    "서유진",
    "stream-player-silver.park"
  ],
  [
    "고현서",
    "deep_soul_maker.han"
  ],
  [
    "하서연",
    "soft-core-ai.lim"
  ],
  [
    "장도윤",
    "embedded_stream_maker.kim"
  ],
  [
    "황지성",
    "calm.maker.system.jang"
  ],
  [
    "고은별",
    "ripple_frontend.choi"
  ],
  [
    "임예린",
    "flowwildripple.ahn"
  ],
  [
    "이현우",
    "staticDevBrand.ahn"
  ],
  [
    "나유진",
    "DustyRippleBackend.oh"
  ],
  [
    "정지민",
    "shadowartistserene.ahn"
  ],
  [
    "강유진",
    "RoboticsNovaPlayer.yoon"
  ],
  [
    "이지우",
    "pathWeb.choi"
  ],
  [
    "서준호",
    "dreamartistdusty.kang"
  ],
  [
    "배준호",
    "streamBrand.park"
  ],
  [
    "오현우",
    "quiet_mind_mobile.ahn"
  ],
  [
    "권도윤",
    "braveLabFrontend.bae"
  ],
  [
    "나하늘",
    "WildField.lee"
  ],
  [
    "유서윤",
    "golden_player_deep.kim"
  ],
  [
    "한윤서",
    "code_engineer_burning.ahn"
  ],
  [
    "하윤서",
    "WanderWildEcho.yoon"
  ],
  [
    "문준호",
    "LoopEngineerGolden.oh"
  ],
  [
    "이태윤",
    "stream.ctf.han"
  ],
  [
    "신지민",
    "lazyglitch.kwon"
  ],
  [
    "서현우",
    "rise_wild_glitch.kim"
  ],
  [
    "박수빈",
    "bytecloud.han"
  ],
  [
    "박태윤",
    "wild-player-design.lee"
  ],
  [
    "하지성",
    "fade-rapid-flare.bae"
  ],
  [
    "임유진",
    "vivid.circuit.pm.lee"
  ],
  [
    "강서윤",
    "shy.echo.mobile.park"
  ],
  [
    "정수빈",
    "neon_thread_ctf.bae"
  ],
  [
    "오예린",
    "soulsecurity.lim"
  ],
  [
    "하도윤",
    "BurningFrame.kim"
  ],
  [
    "고지우",
    "burning-storm.bae"
  ],
  [
    "유민준",
    "rapidhackerbrand.ahn"
  ],
  [
    "문하늘",
    "loopDreamerRestless.yoon"
  ],
  [
    "서서연",
    "syncbrightmemory.choi"
  ],
  [
    "박도윤",
    "horizon-frontend.yoon"
  ],
  [
    "배하늘",
    "runmassivesignal.oh"
  ],
  [
    "한은별",
    "softmasterembedded.park"
  ],
  [
    "고서연",
    "SparkDevCosmic.kim"
  ],
  [
    "조지성",
    "designstreamdreamer.kang"
  ],
  [
    "조다빈",
    "cloud-echo-artist.lee"
  ],
  [
    "정현서",
    "MobileSignalMaker.jang"
  ],
  [
    "황하늘",
    "circuitPlayerMidnight.ahn"
  ],
  [
    "이하준",
    "float_dusty_mind.park"
  ],
  [
    "권현서",
    "brave.stream.kim"
  ],
  [
    "배하준",
    "cosmic.artist.ai.kwon"
  ],
  [
    "박다빈",
    "float-blue-echo.kang"
  ],
  [
    "유준호",
    "shy-engineer-web.jang"
  ],
  [
    "황지호",
    "wandercalmdust.jang"
  ],
  [
    "하다빈",
    "crash_rapid_echo.oh"
  ],
  [
    "권지호",
    "StaticPixelEmbedded.park"
  ],
  [
    "신유진",
    "cold-loop-system.han"
  ],
  [
    "오지우",
    "DreamBrand.kim"
  ],
  [
    "문서연",
    "matrix_player_cold.kang"
  ],
  [
    "배수빈",
    "massiveDreamerSecurity.kim"
  ],
  [
    "윤다빈",
    "flare_dev_gentle.ahn"
  ],
  [
    "하예린",
    "webcircuitengineer.choi"
  ],
  [
    "임준호",
    "ai_dream_dreamer.lim"
  ],
  [
    "강지호",
    "emptyengineerbrand.lim"
  ],
  [
    "황서윤",
    "shadow_artist_gentle.kwon"
  ],
  [
    "안유진",
    "loop-ai.han"
  ],
  [
    "오민준",
    "lazysparkbackend.ryu"
  ],
  [
    "최현서",
    "glitchCloud.ryu"
  ],
  [
    "권유진",
    "AiStreamMaker.han"
  ],
  [
    "한지호",
    "sparkEngineerGolden.choi"
  ],
  [
    "박서윤",
    "dust.dreamer.shy.park"
  ],
  [
    "안윤서",
    "BurnCrimsonCircuit.kwon"
  ],
  [
    "배민준",
    "embedded-cloud-artist.oh"
  ],
  [
    "윤하준",
    "ShySignalDeep.han"
  ],
  [
    "한하준",
    "golden-thread-brand.kim"
  ],
  [
    "김유진",
    "wild_player_data.jang"
  ],
  [
    "나태윤",
    "mindctf.han"
  ],
  [
    "강예린",
    "mystic.memory.embedded.kwon"
  ],
  [
    "임은별",
    "circuit_lab_wild.park"
  ],
  [
    "한현우",
    "NeonMind.lee"
  ],
  [
    "황서연",
    "horizon.mobile.yoon"
  ],
  [
    "고태윤",
    "pixel-data.lim"
  ],
  [
    "나현우",
    "MatrixPlayerBright.kang"
  ],
  [
    "정서윤",
    "backendRippleLab.han"
  ],
  [
    "장하준",
    "CrashCosmicStream.jang"
  ],
  [
    "강민준",
    "HorizonEngineerLazy.han"
  ],
  [
    "윤예린",
    "massivewave.oh"
  ],
  [
    "유지성",
    "BurningHorizon.lee"
  ],
  [
    "윤민준",
    "SparkFrontend.park"
  ],
  [
    "문지호",
    "floatlazycore.ryu"
  ],
  [
    "조지민",
    "serene_spark.lim"
  ],
  [
    "신민준",
    "thread_hacker_golden.han"
  ],
  [
    "임서연",
    "byte.algo.bae"
  ],
  [
    "신하늘",
    "glowlazyripple.bae"
  ],
  [
    "서은별",
    "burn_massive_echo.lee"
  ],
  [
    "조민준",
    "TinyMind.yoon"
  ],
  [
    "정서연",
    "quietDevDesign.kwon"
  ],
  [
    "배서연",
    "coldflaresystem.yoon"
  ],
  [
    "김태윤",
    "bloomshymatrix.oh"
  ],
  [
    "하지민",
    "dataLoopEngineer.park"
  ],
  [
    "박민준",
    "corefrontend.jang"
  ],
  [
    "오다빈",
    "restless_artist_security.han"
  ],
  [
    "이은별",
    "CalmCloud.jang"
  ],
  [
    "윤현서",
    "vivid_matrix_embedded.kim"
  ],
  [
    "조서연",
    "shy.artist.embedded.lee"
  ],
  [
    "서하늘",
    "ThreadEngineerSilver.lee"
  ],
  [
    "윤하늘",
    "pixel.dreamer.restless.kim"
  ],
  [
    "윤현우",
    "trace-vivid-frame.kim"
  ],
  [
    "안예린",
    "code.pm.kim"
  ],
  [
    "유윤서",
    "pm_flare_player.oh"
  ],
  [
    "오윤서",
    "wildDust.choi"
  ],
  [
    "이도윤",
    "fade_cold_code.kwon"
  ],
  [
    "고다빈",
    "aiframemaster.park"
  ],
  [
    "송도윤",
    "pathmakershy.kwon"
  ],
  [
    "서민준",
    "serenemasteralgo.han"
  ],
  [
    "조지우",
    "trace-calm-core.han"
  ],
  [
    "나윤서",
    "DesignStormEngineer.ahn"
  ],
  [
    "윤서윤",
    "midnight-nova.kwon"
  ],
  [
    "송서윤",
    "byte.pm.han"
  ],
  [
    "최지민",
    "SyncCrimsonThread.kang"
  ],
  [
    "문다빈",
    "soft.player.cloud.kim"
  ],
  [
    "권다빈",
    "silversignal.ahn"
  ],
  [
    "김수빈",
    "CloudWeb.yoon"
  ],
  [
    "임지우",
    "tiny_dev_security.oh"
  ],
  [
    "김도윤",
    "dustyFrame.oh"
  ],
  [
    "서지호",
    "cosmic.soul.algo.kim"
  ],
  [
    "안하늘",
    "rise_restless_echo.bae"
  ],
  [
    "문태윤",
    "cleverRippleAi.yoon"
  ],
  [
    "유지우",
    "gentle-master-system.han"
  ],
  [
    "정지호",
    "streamdata.choi"
  ],
  [
    "최태윤",
    "SignalData.han"
  ],
  [
    "황윤서",
    "ColdMakerFrontend.kwon"
  ],
  [
    "문예린",
    "GlitchMakerMidnight.ahn"
  ],
  [
    "하민준",
    "FlowSoftShadow.oh"
  ],
  [
    "유지호",
    "dreammobile.park"
  ],
  [
    "조지호",
    "massiveWaveBackend.park"
  ],
  [
    "박하준",
    "cosmicByte.lee"
  ],
  [
    "나은별",
    "FlowUxui.ryu"
  ],
  [
    "이수빈",
    "mindBackend.lee"
  ],
  [
    "권준호",
    "codeUxui.kang"
  ],
  [
    "정예린",
    "empty.dreamer.frontend.oh"
  ],
  [
    "고서윤",
    "mobile_loop_lab.park"
  ],
  [
    "최지호",
    "thread_cloud.bae"
  ],
  [
    "황수빈",
    "flow.artist.bright.ryu"
  ],
  [
    "유도윤",
    "diveCosmicDream.yoon"
  ],
  [
    "최윤서",
    "loop.backend.yoon"
  ],
  [
    "윤유진",
    "tinyEngineerMobile.park"
  ],
  [
    "문유진",
    "massive.cloud.kim"
  ],
  [
    "장민준",
    "wild-dream.park"
  ],
  [
    "신태윤",
    "shadowdevquiet.bae"
  ],
  [
    "최다빈",
    "static_hacker_robotics.kang"
  ],
  [
    "송민준",
    "frontendflaremaker.oh"
  ],
  [
    "유예린",
    "path_master_vivid.ahn"
  ],
  [
    "조현서",
    "wandercosmicnova.jang"
  ],
  [
    "오하늘",
    "flare-player-soft.ryu"
  ],
  [
    "나지우",
    "gentledreamerembedded.yoon"
  ],
  [
    "오현서",
    "restless.horizon.ai.ahn"
  ],
  [
    "윤은별",
    "soul-deep.lee"
  ],
  [
    "이지호",
    "BurningFlare.kwon"
  ],
  [
    "송하준",
    "rapid_thread_uxui.kim"
  ],
  [
    "김현서",
    "backend_soul_dreamer.yoon"
  ],
  [
    "박하늘",
    "BlueDustWeb.bae"
  ],
  [
    "윤지성",
    "wandersilversoul.yoon"
  ],
  [
    "권태윤",
    "MobilePixelDev.ryu"
  ],
  [
    "정태윤",
    "neon-maker-ai.lim"
  ],
  [
    "송태윤",
    "restlesscorefrontend.han"
  ],
  [
    "한태윤",
    "backendPixelMaster.kang"
  ],
  [
    "하현우",
    "mindartistshy.lim"
  ],
  [
    "송지호",
    "spin-soft-signal.jang"
  ],
  [
    "박현서",
    "silver.maker.algo.han"
  ],
  [
    "나서윤",
    "calm-soul-cloud.park"
  ],
  [
    "임윤서",
    "sparkle.clever.dream.ahn"
  ],
  [
    "서현서",
    "matrix_design.yoon"
  ],
  [
    "배지민",
    "RapidArtistWeb.oh"
  ],
  [
    "권하준",
    "dream-web.ryu"
  ],
  [
    "신지성",
    "quiet-dust.kim"
  ],
  [
    "배예린",
    "quiet-thread.kang"
  ],
  [
    "조예린",
    "WebGlitchHacker.ryu"
  ],
  [
    "강윤서",
    "signal_player_empty.oh"
  ],
  [
    "김하늘",
    "path-hacker-lazy.choi"
  ],
  [
    "최수빈",
    "silverMatrixBackend.ahn"
  ],
  [
    "조하준",
    "flowmastermassive.kang"
  ],
  [
    "정현우",
    "design.pixel.maker.lee"
  ],
  [
    "정지우",
    "tinyMakerCtf.bae"
  ],
  [
    "나준호",
    "tiny-frame-brand.lee"
  ],
  [
    "최예린",
    "circuit.frontend.park"
  ],
  [
    "황도윤",
    "quiet_flare.lim"
  ],
  [
    "윤수빈",
    "TinyStream.bae"
  ],
  [
    "권지민",
    "echo.pm.ahn"
  ],
  [
    "문서윤",
    "RestlessLabRobotics.lim"
  ],
  [
    "오은별",
    "dust.maker.static.yoon"
  ],
  [
    "최하준",
    "flow.clever.signal.ryu"
  ],
  [
    "윤지우",
    "softThreadPm.ryu"
  ],
  [
    "한수빈",
    "trace.massive.field.lim"
  ],
  [
    "하서윤",
    "wildcloud.ryu"
  ],
  [
    "정지성",
    "byte.uxui.jang"
  ],
  [
    "나현서",
    "gentleflowsecurity.park"
  ],
  [
    "권지성",
    "DataMindDev.han"
  ],
  [
    "한민준",
    "pmstormdreamer.yoon"
  ],
  [
    "황유진",
    "rapid-loop-algo.ryu"
  ],
  [
    "황민준",
    "RapidPath.ryu"
  ],
  [
    "안하준",
    "glitch_backend.kim"
  ],
  [
    "한도윤",
    "stream_ai.jang"
  ],
  [
    "정유진",
    "goldensoul.yoon"
  ],
  [
    "나예린",
    "soft_artist_ai.lim"
  ]
]

DUMMY_BIOS =[
  "사용자 중심의 디자인을 추구합니다.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "데이터로 세상을 읽는 중입니다.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "미래를 만드는 로봇 공학도.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "해커톤/대회 팀원 구합니다. 함께 성장해요.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "시스템의 심연을 탐구합니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "데이터로 세상을 읽는 중입니다.",
  "미래를 만드는 로봇 공학도.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "데이터로 세상을 읽는 중입니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "사용자 중심의 디자인을 추구합니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "사용자 중심의 디자인을 추구합니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "사용자 중심의 디자인을 추구합니다.",
  "시스템의 심연을 탐구합니다.",
  "미래를 만드는 로봇 공학도.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "데이터로 세상을 읽는 중입니다.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "해커톤/대회 팀원 구합니다. 함께 성장해요.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "클린 코드를 지향하는 백엔드 개발자입니다.",
  "미래를 만드는 로봇 공학도.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "사용자 중심의 디자인을 추구합니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "사용자 중심의 디자인을 추구합니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "해커톤/대회 팀원 구합니다. 함께 성장해요.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "시스템의 심연을 탐구합니다.",
  "미래를 만드는 로봇 공학도.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "클린 코드를 지향하는 백엔드 개발자입니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "클린 코드를 지향하는 백엔드 개발자입니다.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "사용자 중심의 디자인을 추구합니다.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "데이터로 세상을 읽는 중입니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "사용자 중심의 디자인을 추구합니다.",
  "해커톤/대회 팀원 구합니다. 함께 성장해요.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "사용자 중심의 디자인을 추구합니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "데이터로 세상을 읽는 중입니다.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "클린 코드를 지향하는 백엔드 개발자입니다.",
  "미래를 만드는 로봇 공학도.",
  "사용자 중심의 디자인을 추구합니다.",
  "해커톤/대회 팀원 구합니다. 함께 성장해요.",
  "시스템의 심연을 탐구합니다.",
  "해커톤/대회 팀원 구합니다. 함께 성장해요.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "미래를 만드는 로봇 공학도.",
  "사용자 중심의 디자인을 추구합니다.",
  "미래를 만드는 로봇 공학도.",
  "시스템의 심연을 탐구합니다.",
  "데이터로 세상을 읽는 중입니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "미래를 만드는 로봇 공학도.",
  "미래를 만드는 로봇 공학도.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "클린 코드를 지향하는 백엔드 개발자입니다.",
  "클린 코드를 지향하는 백엔드 개발자입니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "사용자 중심의 디자인을 추구합니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "사용자 중심의 디자인을 추구합니다.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "사용자 중심의 디자인을 추구합니다.",
  "해커톤/대회 팀원 구합니다. 함께 성장해요.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "시스템의 심연을 탐구합니다.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "해커톤/대회 팀원 구합니다. 함께 성장해요.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "미래를 만드는 로봇 공학도.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "데이터로 세상을 읽는 중입니다.",
  "사용자 중심의 디자인을 추구합니다.",
  "사용자 중심의 디자인을 추구합니다.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "사용자 중심의 디자인을 추구합니다.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "사용자 중심의 디자인을 추구합니다.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "미래를 만드는 로봇 공학도.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "미래를 만드는 로봇 공학도.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "데이터로 세상을 읽는 중입니다.",
  "해커톤/대회 팀원 구합니다. 함께 성장해요.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "해커톤/대회 팀원 구합니다. 함께 성장해요.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "클린 코드를 지향하는 백엔드 개발자입니다.",
  "미래를 만드는 로봇 공학도.",
  "해커톤/대회 팀원 구합니다. 함께 성장해요.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "클린 코드를 지향하는 백엔드 개발자입니다.",
  "미래를 만드는 로봇 공학도.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "데이터로 세상을 읽는 중입니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "사용자 중심의 디자인을 추구합니다.",
  "사용자 중심의 디자인을 추구합니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "클린 코드를 지향하는 백엔드 개발자입니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "해커톤/대회 팀원 구합니다. 함께 성장해요.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "미래를 만드는 로봇 공학도.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "해커톤/대회 팀원 구합니다. 함께 성장해요.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "사용자 중심의 디자인을 추구합니다.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "데이터로 세상을 읽는 중입니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "데이터로 세상을 읽는 중입니다.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "데이터로 세상을 읽는 중입니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "클린 코드를 지향하는 백엔드 개발자입니다.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "클린 코드를 지향하는 백엔드 개발자입니다.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "사용자 중심의 디자인을 추구합니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "데이터로 세상을 읽는 중입니다.",
  "미래를 만드는 로봇 공학도.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "미래를 만드는 로봇 공학도.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "사용자 중심의 디자인을 추구합니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "미래를 만드는 로봇 공학도.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "사용자 중심의 디자인을 추구합니다.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "미래를 만드는 로봇 공학도.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "사용자 중심의 디자인을 추구합니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "시스템의 심연을 탐구합니다.",
  "시스템의 심연을 탐구합니다.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "미래를 만드는 로봇 공학도.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "해커톤/대회 팀원 구합니다. 함께 성장해요.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "해커톤/대회 팀원 구합니다. 함께 성장해요.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "사용자 중심의 디자인을 추구합니다.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "미래를 만드는 로봇 공학도.",
  "미래를 만드는 로봇 공학도.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "시스템의 심연을 탐구합니다.",
  "데이터로 세상을 읽는 중입니다.",
  "시스템의 심연을 탐구합니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "데이터로 세상을 읽는 중입니다.",
  "데이터로 세상을 읽는 중입니다.",
  "복잡한 문제를 단순하게 푸는 것을 좋아합니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "사람들의 삶을 편하게 만드는 서비스를 기획합니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "새로운 기술을 배우는 것을 좋아합니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "데이터로 세상을 읽는 중입니다.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "디미고에서 최고의 프로젝트를 만들고 싶습니다.",
  "데이터로 세상을 읽는 중입니다.",
  "하드웨어와 소프트웨어를 넘나드는 개발자.",
  "시스템의 심연을 탐구합니다.",
  "픽셀 하나하나에 영혼을 담습니다.",
  "AI로 더 나은 세상을 만들고 싶습니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "아이디어를 현실로 만드는 기획자입니다.",
  "미래를 만드는 로봇 공학도.",
  "협업을 환영합니다! D.Find에서 만나요.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "사용자 중심의 디자인을 추구합니다.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "시스템의 심연을 탐구합니다.",
  "알고리즘 문제 풀이 스터디원 찾아요.",
  "시스템의 심연을 탐구합니다.",
  "사용자 중심의 디자인을 추구합니다.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "보안에 관심이 많습니다. 정보 공유해요.",
  "좋은 브랜딩은 좋은 서비스에서 나옵니다.",
  "사용자 중심의 디자인을 추구합니다.",
  "사용자 중심의 디자인을 추구합니다.",
  "협업을 환영합니다! D.Find에서 만나요."
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
    for i in range(400):
        username = DUMMY_NAMES[i][0]
        display_name = DUMMY_NAMES[i][1]
        login_id = display_name
        email = f"{login_id}@dimigo.hs.kr"

        # '스킬' 데이터 생성 (이것이 유일한 스킬 점수 소스)
        skill_weights = {}
        for skill in ALL_SKILLS:
            # 약 70% 확률로 스킬 보유, 10~100 사이 랜덤 점수
            if random.random() < 7.0:
                skill_weights[skill] = random.randint(10, 1000) // 10
        
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
