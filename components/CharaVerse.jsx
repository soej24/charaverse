"use client";
import React, { useState, useEffect } from "react";

import {
  Sparkles, User, BookOpen, Shirt, Plus, ArrowLeft, MoreHorizontal,
  Wand2, Check, RefreshCw, Globe, Users, Loader2,
  Smartphone, Sticker, KeyRound, Copy,
} from "lucide-react";

// ── 태그 색상표 ──────────────────────────────────────
const TAG_STYLES = [
  "bg-violet-50 text-violet-700", "bg-pink-50 text-pink-700",
  "bg-emerald-50 text-emerald-700", "bg-amber-50 text-amber-700",
  "bg-sky-50 text-sky-700",
];
function pickStyle(label, arr) {
  let s = 0;
  for (let i = 0; i < label.length; i++) s += label.charCodeAt(i);
  return arr[s % arr.length];
}
const tagStyle = (l) => pickStyle(l, TAG_STYLES);

const AVATAR_STYLES = [
  "bg-violet-100 text-violet-700", "bg-pink-100 text-pink-700",
  "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
];
const avatarStyle = (l) => pickStyle(l || "?", AVATAR_STYLES);

const GENRES = ["로맨스 미스터리", "판타지", "학원물", "액션", "일상물"];
const MOODS = ["여성향", "현대 판타지", "어두운", "밝은", "코믹", "전연령"];

// 브라우저 localStorage 기반 저장소 (배포 환경에서 동작)
const store = {
  async get(key) {
    if (typeof window === "undefined") throw new Error("no window");
    const v = window.localStorage.getItem(key);
    if (v === null) throw new Error("not found");
    return { key, value: v };
  },
  async set(key, value) {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    return { key, value };
  },
  async delete(key) {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
    return { key, deleted: true };
  },
};

const STORAGE_KEY = "charaverse:projects";

// AI를 호출해 JSON 결과를 받는 공용 함수. 실패하면 자동으로 한 번 더 시도한다.
async function requestClaudeJSON({ system, user, maxTokens, attempts = 2 }) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: user }],
        }),
      });
      if (!res.ok) throw new Error("http " + res.status);
      const data = await res.json();
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      if (!text) throw new Error("empty");
      let t = text.replace(/```json|```/g, "").trim();
      const a = t.indexOf("{");
      const b = t.lastIndexOf("}");
      if (a !== -1 && b !== -1 && b > a) t = t.slice(a, b + 1);
      return JSON.parse(t);
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 700)); // 잠깐 쉬고 재시도
    }
  }
  throw lastErr;
}
const DEFAULT_PROJECTS = [
  {
    id: 1, name: "NEXUS",
    tags: ["로맨스 미스터리", "여성향", "현대 판타지"],
    target: "10~20대 여성",
    characters: [
      { id: 11, name: "서이안", oneLineIntro: "냉정한 천재 해커", role: "주인공",
        age: "24세", gender: "남성", job: "화이트해커",
        personality: "냉정하고 분석적, 속은 여림", speech: "짧고 건조, 가끔 비꼼",
        ability: "시스템 침투, 정보 분석", weakness: "사람을 믿지 못함",
        hobby: "새벽 라디오 듣기", secret: "과거에 동료를 잃음",
        signatureLine: "믿음? 그건 코드에 없는 변수야." },
    ],
  },
  {
    id: 2, name: "별빛 아카데미",
    tags: ["학원물", "판타지", "전연령"], target: "전연령",
    characters: [],
  },
];

// ════════════════════════════════════════════════════
//  최상위 앱
// ════════════════════════════════════════════════════
export default function CharaVerse() {
  const [nav, setNav] = useState({ screen: "home", projectId: null });
  const [projects, setProjects] = useState(null); // null = 불러오는 중

  // 시작할 때 저장된 데이터 불러오기
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await store.get(STORAGE_KEY);
        if (alive && r && r.value) {
          setProjects(JSON.parse(r.value));
          return;
        }
      } catch (e) {
        // 저장된 게 없거나 불러오기 실패 → 기본값 사용
      }
      if (alive) setProjects(DEFAULT_PROJECTS);
    })();
    return () => { alive = false; };
  }, []);

  // 변경될 때마다 자동 저장
  useEffect(() => {
    if (projects === null) return; // 아직 불러오기 전이면 저장하지 않음
    store.set(STORAGE_KEY, JSON.stringify(projects)).catch(() => {});
  }, [projects]);

  async function resetAll() {
    if (!window.confirm("모든 프로젝트를 처음 상태로 되돌릴까요? 만든 내용이 사라집니다.")) return;
    try { await store.delete(STORAGE_KEY); } catch (e) {}
    setProjects(DEFAULT_PROJECTS);
    setNav({ screen: "home" });
  }

  const current = projects ? projects.find((p) => p.id === nav.projectId) || null : null;

  function addProject(p) {
    const id = Date.now();
    setProjects((prev) => [...prev, { id, characters: [], ...p }]);
    setNav({ screen: "home" });
  }
  function addCharacter(projectId, char) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, characters: [...p.characters, { id: Date.now(), ...char }] } : p
      )
    );
  }
  function setWorld(projectId, world) {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, world } : p))
    );
  }
  function addContent(projectId, content) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, contents: [...(p.contents || []), { id: Date.now(), ...content }] } : p
      )
    );
  }
  function addGoods(projectId, goods) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, goods: [...(p.goods || []), { id: Date.now(), ...goods }] } : p
      )
    );
  }

  // 아직 저장된 데이터를 불러오는 중
  if (projects === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />불러오는 중…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <div className="mx-auto max-w-4xl px-5 py-6">
        <header className="flex items-center justify-between border-b border-stone-200 pb-4">
          <button onClick={() => setNav({ screen: "home" })} className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            <span className="text-lg font-semibold tracking-tight">CharaVerse</span>
          </button>
          <nav className="flex items-center gap-5 text-sm">
            <button onClick={() => setNav({ screen: "home" })} className={nav.screen === "home" ? "font-medium text-stone-900" : "text-stone-400 hover:text-stone-600"}>홈</button>
            <button onClick={() => setNav({ screen: "gallery" })} className={nav.screen === "gallery" ? "font-medium text-stone-900" : "text-stone-400 hover:text-stone-600"}>캐릭터 갤러리</button>
            <button onClick={() => setNav({ screen: "goods", projectId: null })} className={nav.screen === "goods" ? "font-medium text-stone-900" : "text-stone-400 hover:text-stone-600"}>굿즈 스튜디오</button>
            <button onClick={resetAll} title="모두 초기화" className="text-stone-300 hover:text-stone-500">초기화</button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-medium text-violet-700">나</div>
          </nav>
        </header>

        {nav.screen === "home" && (
          <HomeView
            projects={projects}
            onNew={() => setNav({ screen: "new" })}
            onOpen={(id) => setNav({ screen: "workspace", projectId: id })}
          />
        )}
        {nav.screen === "new" && (
          <NewProjectView onCancel={() => setNav({ screen: "home" })} onCreate={addProject} />
        )}
        {nav.screen === "workspace" && current && (
          <WorkspaceView
            project={current}
            onBack={() => setNav({ screen: "home" })}
            onAddCharacter={(c) => addCharacter(current.id, c)}
            onSetWorld={(w) => setWorld(current.id, w)}
            onAddContent={(c) => addContent(current.id, c)}
            onAddGoods={(g) => addGoods(current.id, g)}
          />
        )}
        {nav.screen === "gallery" && (
          <GalleryView
            projects={projects}
            onOpenProject={(id) => setNav({ screen: "workspace", projectId: id })}
          />
        )}
        {nav.screen === "goods" && !current && (
          <GoodsPicker
            projects={projects}
            onPick={(id) => setNav({ screen: "goods", projectId: id })}
          />
        )}
        {nav.screen === "goods" && current && (
          <GoodsTool
            project={current}
            onBack={() => setNav({ screen: "goods", projectId: null })}
            onAddGoods={(g) => addGoods(current.id, g)}
          />
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
//  홈 화면
// ════════════════════════════════════════════════════
function HomeView({ projects, onNew, onOpen }) {
  return (
    <main className="pt-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-base font-semibold">내 프로젝트</h2>
        <span className="flex items-center gap-1 text-xs text-stone-400"><Check className="h-3.5 w-3.5 text-emerald-500" />자동 저장됨 · 총 {projects.length}개</span>
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <button key={p.id} onClick={() => onOpen(p.id)} className="text-left">
            <ProjectCard project={p} />
          </button>
        ))}
        <button
          onClick={onNew}
          className="flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 text-stone-500 transition hover:border-violet-400 hover:text-violet-600"
        >
          <Plus className="mb-1.5 h-6 w-6" />
          <span className="text-sm">새 프로젝트 만들기</span>
        </button>
      </div>
    </main>
  );
}

function ProjectCard({ project }) {
  return (
    <div className="h-full rounded-xl border border-stone-200 bg-white p-4 transition hover:border-violet-300 hover:shadow-sm">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-base font-semibold">{project.name}</span>
        <MoreHorizontal className="h-[18px] w-[18px] text-stone-300" />
      </div>
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {project.tags.map((t) => (
          <span key={t} className={`rounded-full px-2.5 py-[3px] text-[11px] ${tagStyle(t)}`}>{t}</span>
        ))}
      </div>
      <div className="flex gap-3.5 border-t border-stone-100 pt-3 text-xs text-stone-500">
        <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />캐릭터 {project.characters.length}</span>
        <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />콘텐츠 0</span>
        <span className="flex items-center gap-1"><Shirt className="h-3.5 w-3.5" />굿즈 0</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
//  새 프로젝트 만들기
// ════════════════════════════════════════════════════
function NewProjectView({ onCancel, onCreate }) {
  const [name, setName] = useState("");
  const [genres, setGenres] = useState([]);
  const [moods, setMoods] = useState([]);
  const [target, setTarget] = useState("");

  function submit() {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), tags: [...genres, ...moods], target: target.trim() });
  }
  const ready = name.trim().length > 0;

  return (
    <main className="pt-6">
      <BackBtn onClick={onCancel}>홈</BackBtn>
      <h2 className="text-lg font-semibold">새 프로젝트 만들기</h2>
      <p className="mb-6 mt-1 text-sm leading-relaxed text-stone-500">
        IP의 기본 설정을 정해주세요. 이 설정을 바탕으로 AI가 캐릭터와 세계관을 만듭니다.
      </p>
      <div className="space-y-5 rounded-xl border border-stone-200 bg-white p-6">
        <div>
          <label className="mb-2 block text-[13px] font-medium">프로젝트명</label>
          <TextInput value={name} onChange={setName} placeholder="예: NEXUS" />
        </div>
        <MultiSelect label="장르" hint="(여러 개 선택 가능)" presets={GENRES} selected={genres} setSelected={setGenres} />
        <MultiSelect label="분위기" hint="(여러 개 선택 가능)" presets={MOODS} selected={moods} setSelected={setMoods} />
        <div>
          <label className="mb-2 block text-[13px] font-medium">타깃층</label>
          <TextInput value={target} onChange={setTarget} placeholder="예: 10~20대 여성" />
        </div>
      </div>
      <PrimaryBtn onClick={submit} disabled={!ready}><Check className="h-4 w-4" />프로젝트 만들기</PrimaryBtn>
      <p className="mt-2.5 text-center text-xs text-stone-400">프로젝트명을 입력하면 만들 수 있어요</p>
    </main>
  );
}

// ════════════════════════════════════════════════════
//  프로젝트 작업실
// ════════════════════════════════════════════════════
function WorkspaceView({ project, onBack, onAddCharacter, onSetWorld, onAddContent, onAddGoods }) {
  const [tool, setTool] = useState(null); // null | "character" | "world" | "content" | "goods"

  if (tool === "character") {
    return (
      <CharacterTool
        project={project}
        onBack={() => setTool(null)}
        onAddCharacter={onAddCharacter}
      />
    );
  }
  if (tool === "world") {
    return (
      <WorldTool
        project={project}
        onBack={() => setTool(null)}
        onSetWorld={onSetWorld}
      />
    );
  }
  if (tool === "content") {
    return (
      <ContentTool
        project={project}
        onBack={() => setTool(null)}
        onAddContent={onAddContent}
      />
    );
  }
  if (tool === "goods") {
    return (
      <GoodsTool
        project={project}
        onBack={() => setTool(null)}
        onAddGoods={onAddGoods}
      />
    );
  }

  const menu = [
    { key: "character", icon: User, label: "캐릭터", desc: "AI로 캐릭터 만들기", count: project.characters.length, active: true },
    { key: "world", icon: Globe, label: "세계관", desc: "시대·장소·규칙 설정", count: project.world ? 1 : 0, active: true },
    { key: "content", icon: BookOpen, label: "콘텐츠 파생", desc: "소설·웹툰·숏폼", count: (project.contents || []).length, active: true },
    { key: "goods", icon: Shirt, label: "굿즈 스튜디오", desc: "굿즈 디자인", count: (project.goods || []).length, active: true },
  ];

  return (
    <main className="pt-6">
      <BackBtn onClick={onBack}>홈</BackBtn>
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-lg font-semibold">{project.name}</h2>
        <span className="text-sm text-stone-400">작업실</span>
      </div>
      <div className="mb-6 flex flex-wrap gap-1.5">
        {project.tags.map((t) => (
          <span key={t} className={`rounded-full px-2.5 py-[3px] text-[11px] ${tagStyle(t)}`}>{t}</span>
        ))}
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {menu.map((m) => (
          <button
            key={m.key}
            onClick={() => m.active && setTool(m.key)}
            disabled={!m.active}
            className={`flex items-center gap-3.5 rounded-xl border p-4 text-left transition ${
              m.active
                ? "border-stone-200 bg-white hover:border-violet-300 hover:shadow-sm"
                : "cursor-not-allowed border-stone-200 bg-stone-50"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${m.active ? "bg-violet-50 text-violet-600" : "bg-stone-100 text-stone-400"}`}>
              <m.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${m.active ? "" : "text-stone-400"}`}>{m.label}</span>
                {m.active ? (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500">{m.count}</span>
                ) : (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-400">준비 중</span>
                )}
              </div>
              <p className={`text-xs ${m.active ? "text-stone-500" : "text-stone-400"}`}>{m.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}

// ════════════════════════════════════════════════════
//  캐릭터 도구 (도감 + 생성)
// ════════════════════════════════════════════════════
function CharacterTool({ project, onBack, onAddCharacter }) {
  const [mode, setMode] = useState("dex"); // "dex" | "create"

  return (
    <main className="pt-6">
      <BackBtn onClick={onBack}>{project.name} 작업실</BackBtn>

      {mode === "dex" ? (
        <>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-base font-semibold">캐릭터 도감</h2>
            <span className="text-sm text-stone-400">{project.characters.length}명</span>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-3">
            {project.characters.map((c) => (
              <DexCard key={c.id} c={c} />
            ))}
            <button
              onClick={() => setMode("create")}
              className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 text-stone-500 transition hover:border-violet-400 hover:text-violet-600"
            >
              <Plus className="mb-1.5 h-5 w-5" />
              <span className="text-[13px]">캐릭터 추가</span>
            </button>
          </div>
        </>
      ) : (
        <CharacterCreate
          project={project}
          onCancel={() => setMode("dex")}
          onSave={(c) => { onAddCharacter(c); setMode("dex"); }}
        />
      )}
    </main>
  );
}

function DexCard({ c }) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className={`flex h-20 items-center justify-center ${avatarStyle(c.name)}`}>
        <span className="text-2xl font-semibold">{(c.name || "?")[0]}</span>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium">{c.name}</p>
        <p className="mb-2 mt-0.5 text-xs text-stone-500">{c.oneLineIntro}</p>
        {c.role && <span className={`rounded-full px-2 py-0.5 text-[11px] ${avatarStyle(c.name)}`}>{c.role}</span>}
      </div>
    </div>
  );
}

// ── 캐릭터 생성 (실제 AI 호출) ──────────────────────────
function CharacterCreate({ project, onCancel, onSave }) {
  const [hint, setHint] = useState("");
  const [gender, setGender] = useState("");   // "" = AI에게 맡기기
  const [role, setRole] = useState("");
  const [ageBand, setAgeBand] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const GENDERS = ["남성", "여성"];
  const ROLES = ["주인공", "히로인", "조연", "라이벌", "악역"];
  const AGES = ["10대", "20대", "30대 이상"];

  async function generate() {
    if (!hint.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);

    // 사용자가 고른 조건만 모아서 AI에게 전달 (안 고른 건 AI가 알아서)
    const fixed = [];
    if (gender) fixed.push(`성별: 반드시 ${gender}`);
    if (role) fixed.push(`역할: 반드시 ${role}`);
    if (ageBand) fixed.push(`나이대: 반드시 ${ageBand}`);
    const fixedBlock = fixed.length ? `\n[반드시 지킬 조건]\n${fixed.join("\n")}` : "";

    const sys = `너는 한국 창작자를 돕는 캐릭터 설정 AI다. 사용자의 힌트와 프로젝트 분위기에 맞는 매력적인 캐릭터를 한 명 만들어라.
[반드시 지킬 조건]이 주어지면 그 값은 무슨 일이 있어도 그대로 지켜라. 주어지지 않은 항목만 네가 자유롭게 정해라.
반드시 아래 키를 가진 JSON 객체 하나만 출력해라. 설명, 마크다운, 코드블록 없이 순수 JSON만.
{"name","age","gender","job","oneLineIntro","role","personality","speech","ability","weakness","hobby","secret","signatureLine"}
- name: 한국식 이름
- age: "24세" 형식
- role: 주인공/히로인/조연/라이벌/악역 중 하나
- oneLineIntro: 12자 이내 한 줄 소개
- signatureLine: 캐릭터다운 대표 대사 한 줄
모든 값은 한국어.`;

    const user = `프로젝트: ${project.name}
장르·분위기: ${project.tags.join(", ")}
타깃층: ${project.target || "미설정"}
캐릭터 힌트: ${hint.trim()}${fixedBlock}`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: sys,
          messages: [{ role: "user", content: user }],
        }),
      });
      const data = await res.json();
      const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const char = JSON.parse(clean);
      setResult(char);
    } catch (e) {
      setError("캐릭터를 만드는 중 문제가 생겼어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-base font-semibold">캐릭터 생성</h2>

      <div className="mb-4 space-y-4 rounded-xl bg-stone-100 p-4">
        <div>
          <label className="mb-2 block text-[13px] font-medium">
            어떤 캐릭터인가요? <span className="font-normal text-stone-400">(간단한 힌트만 적어도 돼요)</span>
          </label>
          <TextInput
            value={hint}
            onChange={setHint}
            placeholder="예: 차가운 천재 해커, 사실은 외로움"
            onEnter={generate}
          />
        </div>

        <OptionRow label="성별" options={GENDERS} value={gender} onChange={setGender} />
        <OptionRow label="역할" options={ROLES} value={role} onChange={setRole} />
        <OptionRow label="나이대" options={AGES} value={ageBand} onChange={setAgeBand} />

        <button
          onClick={generate}
          disabled={!hint.trim() || loading}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium transition ${
            !hint.trim() || loading ? "cursor-not-allowed bg-stone-200 text-stone-400" : "bg-violet-600 text-white hover:bg-violet-700"
          }`}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? "생성 중…" : "AI로 생성하기"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
      )}

      {result && (
        <>
          <div className="mb-3 flex items-center gap-1.5 text-[13px] text-stone-500">
            <Check className="h-[15px] w-[15px] text-emerald-600" />
            AI가 캐릭터를 만들었어요. 마음에 들면 저장하세요.
          </div>
          <CharacterCard c={result} />
          <div className="mt-4 flex gap-2.5">
            <button onClick={() => onSave(result)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-2.5 text-[13px] font-medium text-white hover:bg-violet-700">
              <Check className="h-4 w-4" />이 캐릭터 저장
            </button>
            <button onClick={generate} disabled={loading} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-4 py-2.5 text-[13px] hover:bg-stone-50">
              <RefreshCw className="h-4 w-4" />다시 생성
            </button>
          </div>
        </>
      )}

      <button onClick={onCancel} className="mt-5 text-[13px] text-stone-400 hover:text-stone-600">← 도감으로 돌아가기</button>
    </div>
  );
}

// 옵션 한 줄: 고르면 그 값 고정, 'AI에게 맡기기'(기본)면 AI가 정함
function OptionRow({ label, options, value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] text-stone-500">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onChange("")}
          className={`rounded-full border px-3 py-1 text-[12px] transition ${
            value === "" ? "border-violet-300 bg-violet-50 text-violet-700" : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
          }`}
        >
          AI에게 맡기기
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(value === opt ? "" : opt)}
            className={`rounded-full border px-3 py-1 text-[12px] transition ${
              value === opt ? "border-violet-300 bg-violet-50 text-violet-700" : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function CharacterCard({ c }) {
  const attrs = [
    ["성격", c.personality], ["말투", c.speech], ["능력", c.ability],
    ["약점", c.weakness], ["취미", c.hobby], ["비밀", c.secret],
  ];
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-3.5">
        <div className={`flex h-13 w-13 items-center justify-center rounded-full ${avatarStyle(c.name)}`} style={{ width: 52, height: 52 }}>
          <span className="text-lg font-semibold">{(c.name || "?")[0]}</span>
        </div>
        <div>
          <p className="text-[17px] font-semibold">{c.name}</p>
          <p className="mt-0.5 text-[13px] text-stone-500">{[c.age, c.gender, c.job].filter(Boolean).join(" · ")}</p>
        </div>
        {c.role && <span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] ${avatarStyle(c.name)}`}>{c.role}</span>}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-stone-200 bg-stone-200">
        {attrs.map(([k, v]) => (
          <div key={k} className="bg-white p-2.5">
            <p className="mb-0.5 text-[11px] text-stone-400">{k}</p>
            <p className="text-[13px]">{v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-stone-100 px-3.5 py-2.5">
        <p className="mb-1 text-[11px] text-stone-400">대표 대사</p>
        <p className="text-sm italic">“{c.signatureLine}”</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
//  세계관 도구 (실제 AI 호출)
// ════════════════════════════════════════════════════
function WorldTool({ project, onBack, onSetWorld }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(null);   // 아직 저장 안 한 미리보기
  const [era, setEra] = useState("");
  const [tone, setTone] = useState("");
  const [power, setPower] = useState("");
  const [keyword, setKeyword] = useState("");
  const world = project.world;               // 이미 저장된 세계관

  const ERAS = ["과거·고대", "현대", "근미래", "완전 가상 세계"];
  const TONES = ["밝고 따뜻함", "어둡고 무거움", "신비로움", "긴장감"];
  const POWERS = ["능력 없음(현실적)", "초능력", "마법", "기계·기술"];

  async function generate() {
    if (loading) return;
    setLoading(true);
    setError("");

    const fixed = [];
    if (era) fixed.push(`시대 배경: ${era}`);
    if (tone) fixed.push(`전체 분위기: ${tone}`);
    if (power) fixed.push(`능력 체계: ${power}`);
    if (keyword.trim()) fixed.push(`꼭 반영할 키워드: ${keyword.trim()}`);
    const fixedBlock = fixed.length ? `\n[반드시 반영할 조건]\n${fixed.join("\n")}` : "";

    const sys = `너는 한국 창작자를 돕는 세계관 설정 AI다. 프로젝트의 장르와 분위기에 어울리는 매력적인 세계관을 만들어라.
[반드시 반영할 조건]이 주어지면 그 방향을 반드시 따르고, 주어지지 않은 부분만 자유롭게 정해라.
반드시 아래 키를 가진 JSON 객체 하나만 출력해라. 설명, 마크다운, 코드블록 없이 순수 JSON만.
{"era","place","organizations","history","events","rules","mystery","powerSystem"}
- 각 값은 1~2문장의 한국어 설명
- era: 시대 배경 / place: 주요 장소 / organizations: 핵심 조직·세력
- history: 세계의 역사 / events: 주요 사건 / rules: 이 세계의 규칙
- mystery: 풀리지 않은 미스터리 요소 / powerSystem: 능력·힘의 체계`;

    const user = `프로젝트: ${project.name}
장르·분위기: ${project.tags.join(", ")}
타깃층: ${project.target || "미설정"}${fixedBlock}`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1200,
          system: sys,
          messages: [{ role: "user", content: user }],
        }),
      });
      const data = await res.json();
      const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const clean = text.replace(/```json|```/g, "").trim();
      setDraft(JSON.parse(clean)); // 바로 저장하지 않고 미리보기로
    } catch (e) {
      setError("세계관을 만드는 중 문제가 생겼어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function toSections(w) {
    return [
      ["시대", w.era], ["장소", w.place], ["조직·세력", w.organizations],
      ["역사", w.history], ["주요 사건", w.events], ["규칙", w.rules],
      ["미스터리", w.mystery], ["능력 체계", w.powerSystem],
    ];
  }

  return (
    <main className="pt-6">
      <BackBtn onClick={onBack}>{project.name} 작업실</BackBtn>
      <h2 className="mb-4 text-base font-semibold">세계관 설정</h2>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
      )}

      {/* 옵션 패널 */}
      <div className="mb-4 space-y-4 rounded-xl bg-stone-100 p-4">
        <p className="text-[12px] text-stone-500">방향을 정해주면 그대로 반영해요. 비워두면 AI가 알아서 만듭니다.</p>
        <OptionRow label="시대 배경" options={ERAS} value={era} onChange={setEra} />
        <OptionRow label="전체 분위기" options={TONES} value={tone} onChange={setTone} />
        <OptionRow label="능력 체계" options={POWERS} value={power} onChange={setPower} />
        <div>
          <label className="mb-1.5 block text-[12px] text-stone-500">꼭 넣고 싶은 키워드 <span className="text-stone-400">(선택)</span></label>
          <TextInput value={keyword} onChange={setKeyword} placeholder="예: 비 내리는 도시, 잊힌 신화" onEnter={generate} />
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className={`flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-[13px] font-medium transition ${
            loading ? "cursor-not-allowed bg-stone-200 text-stone-400" : "bg-violet-600 text-white hover:bg-violet-700"
          }`}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? "세계관 만드는 중…" : (world || draft) ? "다시 생성" : "AI로 세계관 생성"}
        </button>
      </div>

      {/* 미리보기 (아직 저장 안 함) */}
      {draft && (
        <div className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[13px] text-stone-500">
              <Check className="h-[15px] w-[15px] text-emerald-600" />새 세계관 미리보기 · 저장해야 확정됩니다
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {toSections(draft).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-violet-200 bg-violet-50/40 p-4">
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-violet-600">{k}</p>
                <p className="text-[13px] leading-relaxed text-stone-700">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2.5">
            <button
              onClick={() => { onSetWorld(draft); setDraft(null); }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-2.5 text-[13px] font-medium text-white hover:bg-violet-700"
            >
              <Check className="h-4 w-4" />이 세계관 저장
            </button>
            <button
              onClick={() => setDraft(null)}
              className="rounded-lg border border-stone-300 px-4 py-2.5 text-[13px] hover:bg-stone-50"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 저장된 세계관 */}
      {world ? (
        <div>
          <p className="mb-2 text-[12px] font-medium text-stone-400">저장된 세계관</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {toSections(world).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-stone-200 bg-white p-4">
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-violet-600">{k}</p>
                <p className="text-[13px] leading-relaxed text-stone-700">{v}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !draft && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 px-6 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-violet-600">
              <Globe className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">아직 세계관이 없어요</p>
            <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-stone-500">
              위에서 방향을 고르거나 그냥 생성을 눌러보세요.
            </p>
          </div>
        )
      )}
    </main>
  );
}


// ===== 콘텐츠 파생 도구 (소설 초안 — 실제 AI 호출) =====
function ContentTool({ project, onBack, onAddContent }) {
  const [tab, setTab] = useState("novel");
  const [picked, setPicked] = useState(project.characters.map((c) => c.id));
  const [pov, setPov] = useState("");
  const [length, setLength] = useState("보통");
  const [opening, setOpening] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);

  const chars = project.characters;
  const chosenChars = chars.filter((c) => picked.includes(c.id));

  const POVS = ["1인칭", "3인칭"];
  const LENGTHS = ["짧게", "보통", "길게"];
  const OPENINGS = ["잔잔하게", "긴장감 있게", "설렘"];
  const LEN_SPEC = { "짧게": { chars: "500~700자", tokens: 1200 }, "보통": { chars: "900~1200자", tokens: 2000 }, "길게": { chars: "1500~1800자", tokens: 3200 } };

  function togglePick(id) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  // 응답에서 JSON만 안전하게 뽑아내기 (앞뒤에 군말이 붙어도 살림)
  function extractJSON(text) {
    let t = (text || "").replace(/```json|```/g, "").trim();
    const a = t.indexOf("{");
    const b = t.lastIndexOf("}");
    if (a !== -1 && b !== -1 && b > a) t = t.slice(a, b + 1);
    return JSON.parse(t);
  }

  async function generate() {
    if (loading || chosenChars.length === 0) return;
    setLoading(true); setError(""); setDraft(null); setSaved(false);

    const charLines = chosenChars
      .map((c) => `- ${c.name}(${[c.age, c.job].filter(Boolean).join(", ")}): 성격 ${c.personality}; 말투 ${c.speech}; 대표대사 "${c.signatureLine}"`)
      .join("\n");
    const w = project.world;
    const worldLine = w ? `세계관: ${w.era} / ${w.place} / 규칙 ${w.rules}` : "세계관: 미설정";

    const spec = LEN_SPEC[length] || LEN_SPEC["보통"];
    const opts = [];
    if (pov) opts.push(`시점: ${pov}`);
    if (opening) opts.push(`첫 장면 분위기: ${opening}`);
    opts.push(`분량: 약 ${spec.chars}`);
    const optBlock = opts.length ? `\n[작성 조건]\n${opts.join("\n")}` : "";

    const sys = `너는 한국 웹소설 작가다. 주어진 캐릭터와 세계관을 살려 몰입감 있는 소설 1화 초안을 써라.
[작성 조건]이 있으면 반드시 따르라.
반드시 아래 키를 가진 JSON 객체 하나만 출력해라. 다른 말, 마크다운, 코드블록 없이 순수 JSON만.
{"title","body"}
- title: 1화에 어울리는 짧은 부제
- body: 1화 본문. 문단은 \\n\\n 으로 구분. 캐릭터의 말투와 대표 대사를 자연스럽게 녹일 것.`;

    const user = `프로젝트: ${project.name}
장르·분위기: ${project.tags.join(", ")}
${worldLine}
등장 캐릭터:
${charLines}${optBlock}`;

    try {
      const parsed = await requestClaudeJSON({ system: sys, user, maxTokens: spec.tokens, attempts: 2 });
      if (!parsed || !parsed.body) throw new Error("format");
      setDraft(parsed);
    } catch (e) {
      setError("소설을 만드는 중 문제가 생겼어요. 분량을 '짧게'로 바꾸거나 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!draft) return;
    onAddContent({ type: "novel", title: draft.title, body: draft.body });
    setSaved(true);
  }

  return (
    <main className="pt-6">
      <BackBtn onClick={onBack}>{project.name} 작업실</BackBtn>
      <h2 className="mb-4 text-base font-semibold">콘텐츠 파생</h2>

      <div className="mb-5 flex gap-1 border-b border-stone-200">
        <TabBtn active={tab === "novel"} onClick={() => setTab("novel")}>소설</TabBtn>
        <TabBtn disabled>웹툰 컷</TabBtn>
        <TabBtn disabled>숏폼 대본</TabBtn>
      </div>

      {chars.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 px-6 py-12 text-center text-[13px] text-stone-500">
          먼저 캐릭터를 한 명 이상 만들어 주세요.
        </div>
      ) : (
        <>
          <div className="mb-4 space-y-4 rounded-xl bg-stone-100 p-4">
            <div>
              <label className="mb-2.5 block text-[13px] font-medium">등장 캐릭터</label>
              <div className="flex flex-wrap gap-2">
                {chars.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => togglePick(c.id)}
                    className={`flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[13px] transition ${
                      picked.includes(c.id) ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200" : "bg-white text-stone-500 ring-1 ring-stone-200"
                    }`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${avatarStyle(c.name)}`}>{(c.name || "?")[0]}</span>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <OptionRow label="시점" options={POVS} value={pov} onChange={setPov} />
            <OptionRow label="첫 장면 분위기" options={OPENINGS} value={opening} onChange={setOpening} />
            {/* 분량은 기본값이 '보통'이라 별도 처리 */}
            <div>
              <label className="mb-1.5 block text-[12px] text-stone-500">분량</label>
              <div className="flex flex-wrap gap-1.5">
                {LENGTHS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setLength(opt)}
                    className={`rounded-full border px-3 py-1 text-[12px] transition ${
                      length === opt ? "border-violet-300 bg-violet-50 text-violet-700" : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generate}
              disabled={loading || chosenChars.length === 0}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium transition ${
                loading || chosenChars.length === 0 ? "cursor-not-allowed bg-stone-200 text-stone-400" : "bg-violet-600 text-white hover:bg-violet-700"
              }`}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {loading ? "소설 쓰는 중…" : "소설 1화 생성"}
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
          )}

          {draft && (
            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <div className="mb-3.5 flex items-center justify-between border-b border-stone-100 pb-3">
                <p className="text-[15px] font-semibold">1화 · {draft.title}</p>
                <button
                  onClick={save}
                  disabled={saved}
                  className={`flex items-center gap-1 text-[13px] ${saved ? "text-emerald-600" : "text-violet-600 hover:text-violet-700"}`}
                >
                  <Check className="h-4 w-4" />{saved ? "저장됨" : "저장"}
                </button>
              </div>
              <div className="space-y-3.5 text-[14px] leading-[1.85] text-stone-700">
                {draft.body.split(/\n\n+/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              <button onClick={generate} disabled={loading} className="mt-4 flex items-center gap-1.5 text-[13px] text-stone-400 hover:text-stone-600">
                <RefreshCw className="h-3.5 w-3.5" />다시 생성
              </button>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-stone-400">웹툰 컷·숏폼 대본도 같은 캐릭터로 만들 수 있어요 (다음 단계 예정)</p>
        </>
      )}
    </main>
  );
}

function TabBtn({ active, disabled, onClick, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 pb-2.5 text-sm transition ${
        active ? "border-b-2 border-violet-600 font-medium text-stone-900"
        : disabled ? "cursor-not-allowed text-stone-300"
        : "text-stone-500 hover:text-stone-700"
      }`}
    >
      {children}
    </button>
  );
}

// ===== 굿즈 스튜디오 (인쇄용 프롬프트 + 디자인 가이드 — 실제 AI 호출) =====
const GOODS_TYPES = [
  { key: "tshirt", label: "티셔츠", icon: Shirt },
  { key: "phonecase", label: "폰케이스", icon: Smartphone },
  { key: "sticker", label: "스티커", icon: Sticker },
  { key: "keyring", label: "키링", icon: KeyRound },
];

function GoodsTool({ project, onBack, onAddGoods }) {
  const chars = project.characters;
  const [charId, setCharId] = useState(chars[0]?.id ?? null);
  const [goodsKey, setGoodsKey] = useState("tshirt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const character = chars.find((c) => c.id === charId) || null;
  const goodsType = GOODS_TYPES.find((g) => g.key === goodsKey);
  const GoodsIcon = goodsType.icon;

  async function generate() {
    if (loading || !character) return;
    setLoading(true); setError(""); setResult(null); setCopied(false); setSaved(false);

    const sys = `너는 굿즈 디자인 어시스턴트다. 캐릭터를 ${goodsType.label} 굿즈로 만들기 위한 디자인 설계를 한다.
반드시 아래 키를 가진 JSON 객체 하나만 출력해라. 설명, 마크다운, 코드블록 없이 순수 JSON만.
{"printPrompt","placement","designGuide"}
- printPrompt: 이미지 생성 AI에 넣을 영어 프롬프트 한 줄. 캐릭터 특징을 반영하고, flat vector/print-ready/transparent background 같은 인쇄용 키워드 포함.
- placement: 굿즈 위 배치 설명(한국어 한 줄, 예: "정면 중앙, 가로 22cm")
- designGuide: 한국어 가이드 2~3개의 배열. 각 항목은 "색상 · ...", "여백 · ..." 처럼 짧게.`;

    const user = `굿즈 종류: ${goodsType.label}
캐릭터: ${character.name} (${[character.age, character.job].filter(Boolean).join(", ")})
외형/성격: ${character.personality}
프로젝트 분위기: ${project.tags.join(", ")}`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          system: sys,
          messages: [{ role: "user", content: user }],
        }),
      });
      const data = await res.json();
      const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const r = JSON.parse(clean);
      if (!Array.isArray(r.designGuide)) r.designGuide = [String(r.designGuide || "")];
      setResult(r);
    } catch (e) {
      setError("굿즈 디자인을 만드는 중 문제가 생겼어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function copyPrompt() {
    try { await navigator.clipboard.writeText(result.printPrompt); } catch (e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  function save() {
    if (!result) return;
    onAddGoods({ goodsType: goodsKey, characterId: charId, printPrompt: result.printPrompt, designGuide: result.designGuide, placement: result.placement });
    setSaved(true);
  }

  return (
    <main className="pt-6">
      <BackBtn onClick={onBack}>{project.name} 작업실</BackBtn>
      <h2 className="mb-5 text-base font-semibold">굿즈 스튜디오</h2>

      {chars.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 px-6 py-12 text-center text-[13px] text-stone-500">
          먼저 캐릭터를 한 명 이상 만들어 주세요.
        </div>
      ) : (
        <>
          {/* 1. 캐릭터 선택 */}
          <div className="mb-4">
            <label className="mb-2 block text-[13px] font-medium">1. 캐릭터 선택</label>
            <div className="flex flex-wrap gap-2">
              {chars.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCharId(c.id)}
                  className={`flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[13px] transition ${
                    charId === c.id ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200" : "bg-white text-stone-500 ring-1 ring-stone-200"
                  }`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${avatarStyle(c.name)}`}>{(c.name || "?")[0]}</span>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 굿즈 종류 */}
          <div className="mb-5">
            <label className="mb-2 block text-[13px] font-medium">2. 굿즈 종류</label>
            <div className="flex flex-wrap gap-2">
              {GOODS_TYPES.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setGoodsKey(g.key)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[13px] transition ${
                    goodsKey === g.key ? "border-violet-300 bg-violet-50 text-violet-700" : "border-stone-200 text-stone-500 hover:border-stone-300"
                  }`}
                >
                  <g.icon className="h-[15px] w-[15px]" />{g.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading || !character}
            className={`mb-5 flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-[13px] font-medium transition ${
              loading || !character ? "cursor-not-allowed bg-stone-200 text-stone-400" : "bg-violet-600 text-white hover:bg-violet-700"
            }`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {loading ? "굿즈 디자인 만드는 중…" : "굿즈 디자인 생성"}
          </button>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
          )}

          {result && (
            <>
              <div className="grid gap-3.5 sm:grid-cols-2">
                {/* 시안 미리보기 */}
                <div className="flex flex-col items-center rounded-xl bg-stone-100 p-5">
                  <p className="mb-3 self-start text-[11px] text-stone-400">시안 미리보기</p>
                  <div className="relative flex h-44 w-40 items-center justify-center rounded-lg border border-stone-200 bg-white">
                    <GoodsIcon className="h-28 w-28 text-stone-200" strokeWidth={1} />
                    <div className={`absolute top-12 flex h-14 w-14 items-center justify-center rounded-full ${avatarStyle(character.name)}`}>
                      <span className="text-lg font-semibold">{(character.name || "?")[0]}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-stone-500">{goodsType.label} · {result.placement}</p>
                </div>

                {/* 프롬프트 + 가이드 */}
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-stone-200 bg-white p-4">
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-xs font-medium text-stone-500">인쇄용 이미지 프롬프트</p>
                      <button onClick={copyPrompt} className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700">
                        <Copy className="h-3.5 w-3.5" />{copied ? "복사됨" : "복사"}
                      </button>
                    </div>
                    <p className="font-mono text-[12px] leading-relaxed text-stone-700">{result.printPrompt}</p>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-4">
                    <p className="mb-2 text-xs font-medium text-stone-500">디자인 가이드</p>
                    <div className="space-y-1 text-[12px] leading-relaxed text-stone-700">
                      {result.designGuide.map((g, i) => (<div key={i}>{g}</div>))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2.5">
                <button
                  onClick={save}
                  disabled={saved}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-3 text-sm font-medium transition ${
                    saved ? "bg-emerald-50 text-emerald-700" : "bg-violet-600 text-white hover:bg-violet-700"
                  }`}
                >
                  <Check className="h-4 w-4" />{saved ? "저장됨" : "이 굿즈 디자인 저장"}
                </button>
                <button disabled className="flex cursor-not-allowed items-center gap-1.5 rounded-lg px-4 py-3 text-sm text-stone-300">
                  판매 연결 (준비 중)
                </button>
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}

// ===== 캐릭터 갤러리: 모든 프로젝트의 캐릭터를 한곳에 모아 보기 =====
function GalleryView({ projects, onOpenProject }) {
  // 모든 프로젝트의 캐릭터를 펼쳐서 한 목록으로
  const all = [];
  projects.forEach((p) => {
    (p.characters || []).forEach((c) => all.push({ ...c, projectId: p.id, projectName: p.name }));
  });

  return (
    <main className="pt-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-base font-semibold">캐릭터 갤러리</h2>
        <span className="text-sm text-stone-400">전체 {all.length}명</span>
      </div>

      {all.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 px-6 py-14 text-center text-[13px] text-stone-500">
          아직 만든 캐릭터가 없어요. 프로젝트에 들어가 캐릭터를 만들어보세요.
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {all.map((c) => (
            <button key={`${c.projectId}-${c.id}`} onClick={() => onOpenProject(c.projectId)} className="overflow-hidden rounded-xl border border-stone-200 bg-white text-left transition hover:border-violet-300 hover:shadow-sm">
              <div className={`flex h-20 items-center justify-center ${avatarStyle(c.name)}`}>
                <span className="text-2xl font-semibold">{(c.name || "?")[0]}</span>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="mb-2 mt-0.5 truncate text-xs text-stone-500">{c.oneLineIntro}</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500">
                  <Sparkles className="h-3 w-3" />{c.projectName}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}

// ===== 굿즈 스튜디오로 바로 들어갈 때: 어느 프로젝트의 캐릭터로 만들지 먼저 선택 =====
function GoodsPicker({ projects, onPick }) {
  return (
    <main className="pt-6">
      <h2 className="mb-1 text-base font-semibold">굿즈 스튜디오</h2>
      <p className="mb-5 text-[13px] text-stone-500">어느 프로젝트의 캐릭터로 굿즈를 만들까요?</p>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <button key={p.id} onClick={() => onPick(p.id)} className="rounded-xl border border-stone-200 bg-white p-4 text-left transition hover:border-violet-300 hover:shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-base font-semibold">{p.name}</span>
              <Shirt className="h-[18px] w-[18px] text-stone-300" />
            </div>
            <p className="text-xs text-stone-500">캐릭터 {(p.characters || []).length}명 · 굿즈 {(p.goods || []).length}개</p>
          </button>
        ))}
      </div>
    </main>
  );
}

function BackBtn({ onClick, children }) {
  return (
    <button onClick={onClick} className="mb-4 flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
      <ArrowLeft className="h-[15px] w-[15px]" />{children}
    </button>
  );
}
function TextInput({ value, onChange, placeholder, onEnter }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onEnter && (e.preventDefault(), onEnter())}
      placeholder={placeholder}
      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
    />
  );
}
function PrimaryBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg py-3 text-sm font-medium transition ${
        disabled ? "cursor-not-allowed bg-stone-200 text-stone-400" : "bg-violet-600 text-white hover:bg-violet-700"
      }`}
    >
      {children}
    </button>
  );
}
function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-[13px] transition ${
        active ? "border-violet-300 bg-violet-50 text-violet-700" : "border-stone-200 text-stone-500 hover:border-stone-300"
      }`}
    >
      {children}
    </button>
  );
}
function MultiSelect({ label, hint, presets, selected, setSelected }) {
  const [custom, setCustom] = useState("");
  function toggle(item) {
    setSelected((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  }
  function addCustom() {
    const v = custom.trim();
    if (!v || selected.includes(v)) { setCustom(""); return; }
    setSelected((prev) => [...prev, v]);
    setCustom("");
  }
  const extras = selected.filter((s) => !presets.includes(s));
  return (
    <div>
      <label className="mb-2 block text-[13px] font-medium">
        {label} <span className="font-normal text-stone-400">{hint}</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {presets.map((item) => (
          <Chip key={item} active={selected.includes(item)} onClick={() => toggle(item)}>{item}</Chip>
        ))}
        {extras.map((item) => (
          <Chip key={item} active onClick={() => toggle(item)}>{item}</Chip>
        ))}
        <span className="flex items-center gap-1 rounded-full border border-stone-200 py-1 pl-3 pr-1">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
            placeholder="직접 입력"
            className="w-20 bg-transparent text-[13px] text-stone-600 outline-none placeholder:text-stone-400"
          />
          <button onClick={addCustom} className="flex h-6 w-6 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-violet-600" aria-label="추가">
            <Plus className="h-4 w-4" />
          </button>
        </span>
      </div>
    </div>
  );
}
