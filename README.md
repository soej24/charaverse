# CharaVerse

AI로 캐릭터를 만들고, 세계관·소설을 거쳐, 굿즈 디자인까지 만드는 개인용 IP 제작 스튜디오.

## 이게 어떻게 안전한가요?
- AI를 부르는 진짜 키(API key)는 **코드에 들어있지 않습니다.**
- 키는 Vercel의 **환경변수(ANTHROPIC_API_KEY)** 에만 저장됩니다.
- 그래서 이 코드는 공개(Public) 저장소에 올려도 키가 노출되지 않습니다.

---

## 배포 방법 (처음 하는 사람용, 순서대로)

### 1단계 · GitHub에 올리기
1. github.com 에서 **New**(새 저장소) 클릭 → 이름은 `charaverse` 정도로, **Public** 선택 → Create.
2. 만들어진 저장소 화면에서 **uploading an existing file**(또는 Add file → Upload files) 클릭.
3. 이 폴더 안의 **모든 파일/폴더를 통째로** 끌어다 놓고 **Commit changes**.
   - (node_modules 폴더는 올리지 않아도 됩니다. 없으면 그대로 두세요.)

### 2단계 · Vercel에 연결하기
1. vercel.com 접속 → **Continue with GitHub** 로 로그인.
2. **Add New → Project** → 방금 만든 `charaverse` 저장소 **Import**.
3. 설정은 기본값 그대로 두고 **Deploy** (Next.js를 자동 인식합니다).

### 3단계 · API 키 연결하기 (가장 중요)
1. Anthropic 콘솔(console.anthropic.com)에서 **API 키**를 발급받습니다.
2. Vercel 프로젝트 → **Settings → Environment Variables** 로 이동.
3. 다음을 추가:
   - Name: `ANTHROPIC_API_KEY`
   - Value: (발급받은 키 붙여넣기)
4. 저장 후 **Deployments** 탭에서 **Redeploy**(다시 배포)를 한 번 눌러주세요.
   - (환경변수는 다시 배포해야 적용됩니다.)

완료되면 `https://charaverse-xxxx.vercel.app` 같은 주소가 생기고, 그 주소로 어디서든 접속할 수 있습니다.

---

## 내 컴퓨터에서 직접 실행해보려면 (선택)
```bash
npm install
# 프로젝트 루트에 .env.local 파일을 만들고 아래 한 줄 추가:
# ANTHROPIC_API_KEY=발급받은키
npm run dev
```
그다음 브라우저에서 http://localhost:3000 접속.
