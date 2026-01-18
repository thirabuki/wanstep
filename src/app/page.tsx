'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  collection, query, onSnapshot, doc, setDoc, addDoc, serverTimestamp, 
  orderBy, where, limit, getDocs, deleteDoc, Timestamp 
} from 'firebase/firestore';
import { 
  getAuth, onAuthStateChanged, signOut, User,
  signInWithEmailAndPassword, createUserWithEmailAndPassword
} from 'firebase/auth';
import { firestore } from '@/lib/firebase';
import { 
  Plus, Dog, LogOut, ArrowLeft, Utensils, Save, ChevronRight, 
  Camera, Droplets, Footprints, FileText, Trash2, AlertCircle,
  Calendar, Edit3, X, Mail, Lock, Clock, StickyNote, Search, RefreshCcw
} from 'lucide-react';

export default function PetDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [showAddPet, setShowAddPet] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLogConfirm, setDeleteLogConfirm] = useState(false);
  const [userMemo, setUserMemo] = useState('');
  const [petForm, setPetForm] = useState({ name: '', breed: '', weight: '', birthDate: '', photo: '' });
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logForm, setLogForm] = useState<any>({
    meals: { morning: '', lunch: '', dinner: '' },
    poops: { first: '', second: '', third: '' },
    walks: { morning: '', lunch: '', dinner: '' },
    signs: [], memo: '', photo: ''
  });
  
  // 履歴表示用
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const auth = getAuth();
  const petPhotoRef = useRef<HTMLInputElement>(null);
  const logPhotoRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, [auth]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(firestore, 'users', user.uid), (doc) => {
      if (doc.exists()) setUserMemo(doc.data().memo || '');
    });
    return unsub;
  }, [user]);

  const saveUserMemo = async (val: string) => {
    if (!user) return;
    setUserMemo(val);
    await setDoc(doc(firestore, 'users', user.uid), { memo: val }, { merge: true });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLoginView) { await signInWithEmailAndPassword(auth, email, password); showMsg("ログインしました"); }
      else { await createUserWithEmailAndPassword(auth, email, password); showMsg("アカウントを作成しました"); }
    } catch (err: any) { alert("認証エラー: " + err.message); }
  };

  useEffect(() => {
    if (!user) { setPets([]); return; }
    const q = query(collection(firestore, 'pets'), where("userId", "==", user.uid), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (s) => setPets(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const showMsg = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image(); img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else { if (height > MAX_WIDTH) { width *= MAX_WIDTH / height; height = MAX_WIDTH; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  };

  const savePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petForm.name || !user) return;
    try {
      let petPhoto = petForm.photo;
      if (petPhoto && petPhoto.startsWith('data:image')) petPhoto = await compressImage(petPhoto);
      const petData = { ...petForm, photo: petPhoto, userId: user.uid, updatedAt: serverTimestamp() };
      if (editingPetId) { await setDoc(doc(firestore, 'pets', editingPetId), petData, { merge: true }); showMsg("更新しました"); }
      else { await addDoc(collection(firestore, 'pets'), { ...petData, createdAt: serverTimestamp() }); showMsg("登録しました"); }
      resetPetForm();
    } catch (e) { alert("保存失敗"); }
  };

  const resetPetForm = () => { setPetForm({ name: '', breed: '', weight: '', birthDate: '', photo: '' }); setEditingPetId(null); setShowAddPet(false); setDeleteConfirmId(null); };

  const executeDeletePet = async (e: React.MouseEvent, petId: string) => {
    e.stopPropagation();
    try { await deleteDoc(doc(firestore, 'pets', petId)); resetPetForm(); showMsg("ペットを削除しました"); }
    catch (e) { alert("削除エラー"); }
  };

  const loadLog = async (date: string) => {
    if (!selectedPet) return;
    const snap = await getDocs(query(collection(firestore, 'pets', selectedPet.id, 'logs'), where("date", "==", date)));
    if (!snap.empty) {
      const d = snap.docs[0].data();
      setLogForm({
        meals: d.meals || { morning: '', lunch: '', dinner: '' },
        poops: d.poops || { first: '', second: '', third: '' },
        walks: d.walks || { morning: '', lunch: '', dinner: '' },
        signs: d.signs || [], memo: d.memo || '', photo: d.photo || ''
      });
    } else {
      setLogForm({ meals: { morning: '', lunch: '', dinner: '' }, poops: { first: '', second: '', third: '' }, walks: { morning: '', lunch: '', dinner: '' }, signs: [], memo: '', photo: '' });
    }
  };

  const saveLog = async () => {
    if (!selectedPet) return;
    try {
      let finalPhoto = logForm.photo;
      if (finalPhoto && finalPhoto.startsWith('data:image')) finalPhoto = await compressImage(finalPhoto);
      await setDoc(doc(firestore, 'pets', selectedPet.id, 'logs', `${selectedPet.id}_${logDate}`), { ...logForm, photo: finalPhoto, date: logDate, updatedAt: serverTimestamp() }, { merge: true });
      showMsg("ログを保存しました！");
    } catch (e) { alert("保存失敗"); }
  };

  const executeDeleteLog = async () => {
    if (!selectedPet) return;
    try { await deleteDoc(doc(firestore, 'pets', selectedPet.id, 'logs', `${selectedPet.id}_${logDate}`)); loadLog(logDate); setDeleteLogConfirm(false); showMsg("ログを削除しました"); }
    catch (e) { alert("削除失敗"); }
  };

  // 履歴読み込み（デフォルトまたは検索）
  useEffect(() => {
    if (!selectedPet || isSearching) return;
    loadLog(logDate);
    // デフォルト: 最新15件
    const q = query(collection(firestore, 'pets', selectedPet.id, 'logs'), orderBy('date', 'desc'), limit(15));
    return onSnapshot(q, (s) => setRecentLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [selectedPet, logDate, isSearching]);

  const handleSearchLogs = async () => {
    if (!selectedPet || !searchFrom || !searchTo) {
      alert("開始日と終了日を選択してください");
      return;
    }
    setIsSearching(true);
    const q = query(
      collection(firestore, 'pets', selectedPet.id, 'logs'),
      where("date", ">=", searchFrom),
      where("date", "<=", searchTo),
      orderBy('date', 'desc')
    );
    const snap = await getDocs(q);
    setRecentLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const resetSearch = () => {
    setSearchFrom('');
    setSearchTo('');
    setIsSearching(false);
  };

  const scrollToTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth' });

  const walkOptions = ["なし", "5分", "10分", "15分", "20分", "30分", "45分", "1時間", "1.5時間", "2時間"];

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-rose-500 italic">読み込み中...</div>;

  if (!user) {
    return (
      <main className="max-w-md mx-auto min-h-screen bg-rose-50/30 flex flex-col items-center justify-center p-6">
        <div className="w-full space-y-8 bg-white p-8 rounded-[40px] shadow-xl border border-rose-100">
          <div className="text-center">
            <h1 className="text-3xl font-black text-rose-500 italic mb-2">WANSTEP</h1>
            <p className="text-rose-300 text-sm font-bold">愛犬の健康を、一歩ずつ。</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4 text-black">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-200" size={18} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="メールアドレス" className="w-full h-14 pl-12 pr-4 bg-rose-50/50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-rose-400 font-bold" />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-200" size={18} />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="パスワード" className="w-full h-14 pl-12 pr-4 bg-rose-50/50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-rose-400 font-bold" />
            </div>
            <button type="submit" className="w-full h-14 bg-rose-500 text-white rounded-2xl font-black shadow-lg">
              {isLoginView ? 'ログイン' : '新規登録'}
            </button>
          </form>
          <button onClick={() => setIsLoginView(!isLoginView)} className="w-full text-rose-300 text-xs font-bold">{isLoginView ? 'アカウント作成はこちら' : 'ログインはこちら'}</button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto min-h-screen bg-rose-50/30 text-slate-800 pb-32" translate="no">
      <div ref={topRef} />
      {msg && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-rose-500 text-white px-6 py-2 rounded-full shadow-lg text-sm font-bold animate-in fade-in zoom-in">{msg}</div>}
      
      <header className="p-4 flex justify-between items-center bg-white border-b border-rose-100 sticky top-0 z-40">
        <h1 className="text-xl font-black text-rose-500 italic">WANSTEP</h1>
        <div className="flex items-center gap-3">
          {!selectedPet && (
            <button onClick={() => setShowAddPet(true)} className="w-8 h-8 flex items-center justify-center bg-rose-500 text-white rounded-full shadow-md active:scale-90 transition-transform"><Plus size={20}/></button>
          )}
          <button onClick={() => signOut(auth)} className="text-rose-200 hover:text-red-400 transition-colors"><LogOut size={20}/></button>
        </div>
      </header>

      <div className="p-4">
        {!selectedPet ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-black pt-2 text-rose-900">マイペット</h2>
            <div className="grid gap-4 text-black">
              {pets.map(pet => (
                <div key={pet.id} onClick={() => setSelectedPet(pet)} className="relative cursor-pointer shadow-sm rounded-3xl bg-white overflow-hidden active:scale-95 transition-all border border-rose-50 flex items-center">
                  <div className="w-20 h-20 bg-rose-50 flex-shrink-0">
                    {pet.photo ? <img src={pet.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-rose-100"><Dog size={32}/></div>}
                  </div>
                  <div className="p-4 flex-1">
                    <h3 className="text-lg font-black text-rose-700">{pet.name}</h3>
                    <p className="text-[10px] text-rose-300 font-bold uppercase tracking-tight">{pet.breed || '未設定'} / {pet.weight || '0'}kg</p>
                  </div>
                  <div className="pr-4 flex flex-col gap-2">
                    {deleteConfirmId === pet.id ? (
                      <div className="flex gap-1 animate-in slide-in-from-right-2">
                        <button onClick={(e) => executeDeletePet(e, pet.id)} className="bg-red-400 text-white text-[10px] px-3 py-2 rounded-xl font-bold shadow-md">削除</button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} className="bg-rose-50 text-rose-300 p-2 rounded-xl"><X size={16}/></button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setPetForm({ name: pet.name, breed: pet.breed || '', weight: pet.weight || '', birthDate: pet.birthDate || '', photo: pet.photo || '' }); setEditingPetId(pet.id); setShowAddPet(true); }} className="p-2 text-rose-100 hover:text-rose-400"><Edit3 size={18} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(pet.id); }} className="p-2 text-rose-100 hover:text-red-300"><Trash2 size={18} /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <section className="bg-amber-50/50 p-6 rounded-[32px] border border-amber-100 space-y-3">
              <div className="flex items-center gap-2 text-amber-600 font-black"><StickyNote size={18}/> 自分へのメモ</div>
              <textarea value={userMemo} onChange={(e) => saveUserMemo(e.target.value.slice(0, 50))} placeholder="飼い主さんの予定や体調など... (50文字)" className="w-full border-none bg-white rounded-2xl min-h-[80px] text-[14px] p-4 outline-none text-black shadow-inner" />
              <p className="text-right text-[10px] font-bold text-amber-300">{userMemo.length}/50</p>
            </section>
            
            {showAddPet && (
               <div className="p-6 shadow-xl rounded-[32px] bg-white animate-in zoom-in-95 space-y-4 border border-rose-50 text-black">
                <div onClick={() => petPhotoRef.current?.click()} className="w-24 h-24 mx-auto bg-rose-50/30 rounded-full border-2 border-dashed border-rose-100 flex flex-col items-center justify-center overflow-hidden cursor-pointer">
                  {petForm.photo ? <img src={petForm.photo} className="w-full h-full object-cover" /> : <Camera size={24} className="text-rose-100" />}
                  <input type="file" ref={petPhotoRef} className="hidden" accept="image/*" onChange={(e) => {
                    const f = e.target.files?.[0]; if(!f) return;
                    const r = new FileReader(); r.onload = (ev) => setPetForm({...petForm, photo: ev.target?.result as string}); r.readAsDataURL(f);
                  }} />
                </div>
                <input value={petForm.name} onChange={e => setPetForm({...petForm, name: e.target.value})} placeholder="なまえ" required className="w-full h-12 px-4 rounded-xl bg-rose-50/50 outline-none focus:ring-2 focus:ring-rose-400 font-bold" />
                <input value={petForm.breed} onChange={e => setPetForm({...petForm, breed: e.target.value})} placeholder="犬種" className="w-full h-12 px-4 rounded-xl bg-rose-50/50 outline-none focus:ring-2 focus:ring-rose-400 font-bold" />
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[12px] font-black text-rose-500 ml-2">お誕生日</label>
                    <input value={petForm.birthDate} onChange={e => setPetForm({...petForm, birthDate: e.target.value})} type="date" className="w-full h-12 px-4 rounded-xl bg-rose-50/50 outline-none focus:ring-2 focus:ring-rose-400 font-bold" />
                  </div>
                  <div>
                    <label className="text-[12px] font-black text-rose-500 ml-2">体重 (kg)</label>
                    <input value={petForm.weight} onChange={e => setPetForm({...petForm, weight: e.target.value})} placeholder="体重" type="number" step="0.1" className="w-full h-12 px-4 rounded-xl bg-rose-50/50 outline-none focus:ring-2 focus:ring-rose-400 font-bold" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={savePet} className="flex-1 bg-rose-500 text-white h-14 rounded-2xl font-black">保存</button>
                  <button type="button" onClick={resetPetForm} className="px-4 text-rose-300 font-bold">戻る</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center">
              <button onClick={() => setSelectedPet(null)} className="flex items-center text-rose-300 font-bold"><ArrowLeft size={20} className="mr-1"/> 一覧へ</button>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-rose-500" />
                <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="w-auto border-none bg-transparent font-black text-rose-500 p-0 h-auto focus:ring-0 cursor-pointer" />
              </div>
            </div>
            
            <div onClick={() => logPhotoRef.current?.click()} className="aspect-video bg-white rounded-[32px] border-2 border-dashed border-rose-100 flex flex-col items-center justify-center overflow-hidden cursor-pointer shadow-sm active:scale-95 transition-all">
              {logForm.photo ? <img src={logForm.photo} className="w-full h-full object-cover" /> : <><Camera size={32} className="text-rose-100"/><span className="text-[10px] font-bold text-rose-200">今日の写真を記録</span></>}
              <input type="file" ref={logPhotoRef} className="hidden" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0]; if(!f) return;
                const r = new FileReader(); r.onload = (ev) => setLogForm({...logForm, photo: ev.target?.result as string}); r.readAsDataURL(f);
              }} />
            </div>

            <section className="bg-white p-6 rounded-[32px] shadow-sm space-y-4 border border-rose-50">
               <div className="flex items-center gap-2 text-orange-500 font-black text-lg"><Utensils size={22}/> ごはん</div>
               {['morning', 'lunch', 'dinner'].map(t => (
                 <div key={t} className="flex items-center justify-between border-b border-rose-50 pb-2 last:border-none text-black">
                   <span className="text-[14px] font-black text-rose-700 w-8">{t === 'morning' ? '朝' : t === 'lunch' ? '昼' : '夕'}</span>
                   <div className="flex gap-1">
                     {['全部', '半分', '少し', '食べない'].map(opt => (
                       <button key={opt} onClick={() => setLogForm({...logForm, meals: {...logForm.meals, [t]: logForm.meals[t] === opt ? '' : opt}})} className={`px-2.5 py-2 rounded-xl text-[11px] font-bold transition-all ${logForm.meals[t] === opt ? 'bg-orange-400 text-white shadow-sm' : 'bg-rose-50/50 text-rose-300'}`}>{opt}</button>
                     ))}
                   </div>
                 </div>
               ))}
             </section>

             <section className="bg-white p-6 rounded-[32px] shadow-sm space-y-4 border border-rose-50">
               <div className="flex items-center gap-2 text-amber-800 font-black text-lg"><Droplets size={22}/> うんち</div>
               {['first', 'second', 'third'].map((n, i) => (
                 <div key={n} className="flex gap-2 items-center border-b border-rose-50 pb-2 last:border-none">
                   <span className="text-[12px] font-black text-rose-700 min-w-[40px]">{i+1}回目</span>
                   <div className="flex flex-1 gap-1 text-black">
                    {['良好', '柔め', '硬め', '下痢'].map(opt => (
                      <button key={opt} onClick={() => setLogForm({...logForm, poops: {...logForm.poops, [n]: logForm.poops[n] === opt ? '' : opt}})} className={`flex-1 py-2 rounded-xl text-[11px] font-bold border-2 transition-all ${logForm.poops[n] === opt ? 'bg-amber-700 border-amber-700 text-white shadow-sm' : 'bg-rose-50/50 border-rose-50/50 text-rose-300'}`}>{opt}</button>
                    ))}
                   </div>
                 </div>
               ))}
             </section>

             <section className="bg-white p-6 rounded-[32px] shadow-sm space-y-4 border border-rose-50 text-black">
               <div className="flex items-center gap-2 text-emerald-600 font-black text-lg"><Footprints size={22}/> お散歩</div>
               <div className="space-y-3">
                 {['morning', 'lunch', 'dinner'].map(t => (
                   <div key={t} className="flex items-center justify-between border-b border-rose-50 pb-2 last:border-none">
                     <span className="text-[14px] font-black text-rose-700 w-8">{t === 'morning' ? '朝' : t === 'lunch' ? '昼' : '夜'}</span>
                     <div className="flex items-center gap-2 flex-1 ml-4 bg-rose-50/50 rounded-xl px-4 py-1">
                        <Clock size={16} className="text-emerald-500" />
                        <select value={logForm.walks[t] || "なし"} onChange={(e) => setLogForm({...logForm, walks: {...logForm.walks, [t]: e.target.value}})} className="flex-1 bg-transparent border-none text-[14px] font-bold outline-none h-11">
                          {walkOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                     </div>
                   </div>
                 ))}
               </div>
             </section>

             <section className="bg-white p-6 rounded-[32px] shadow-sm space-y-4 border border-rose-50">
               <div className="flex items-center gap-2 text-red-500 font-black text-lg"><AlertCircle size={22}/> サイン</div>
               <div className="flex flex-wrap gap-2">
                 {['かゆみ', '目やに', '咳', '嘔吐', '元気なし'].map(sign => (
                   <button key={sign} onClick={() => {
                     const current = logForm.signs || [];
                     setLogForm({ ...logForm, signs: current.includes(sign) ? current.filter((s:any) => s !== sign) : [...current, sign] });
                   }} className={`px-4 py-2.5 rounded-full text-[12px] font-black transition-all ${(logForm.signs || []).includes(sign) ? 'bg-red-500 text-white shadow-sm' : 'bg-rose-50/50 text-rose-400'}`}>{sign}</button>
                 ))}
               </div>
             </section>

             <section className="bg-white p-6 rounded-[32px] shadow-sm space-y-4 border border-rose-50">
               <div className="flex items-center gap-2 text-rose-600 font-black text-lg"><FileText size={22}/> メモ</div>
               <textarea value={logForm.memo} onChange={(e) => setLogForm({...logForm, memo: e.target.value})} placeholder="今日の様子をメモ..." className="w-full border-none bg-rose-50/50 rounded-2xl min-h-[120px] text-[14px] p-4 outline-none text-black" />
             </section>

            <div className="px-2">
              {deleteLogConfirm ? (
                <div className="flex gap-2 animate-in slide-in-from-bottom-2 duration-200">
                  <button onClick={executeDeleteLog} className="flex-1 bg-red-400 text-white h-14 rounded-2xl font-black shadow-lg text-sm">この日の記録を完全に削除</button>
                  <button onClick={() => setDeleteLogConfirm(false)} className="px-6 bg-rose-50 text-rose-300 rounded-2xl font-bold">戻る</button>
                </div>
              ) : (
                <button onClick={() => setDeleteLogConfirm(true)} className="w-full text-rose-200 text-[10px] font-bold py-2 hover:text-red-300 flex items-center justify-center gap-2 transition-colors">
                  <Trash2 size={12}/> {logDate.replace(/-/g, '/')} の記録を削除する
                </button>
              )}
            </div>

            {/* 履歴リスト & 検索 */}
            <div className="pt-4 space-y-4 text-black">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-black text-rose-300 flex items-center gap-2"><ChevronRight size={18} className="rotate-90"/> {isSearching ? '検索結果' : '最近の履歴'}</h3>
                {isSearching && (
                  <button onClick={resetSearch} className="text-[10px] font-black text-rose-400 flex items-center gap-1 bg-white px-3 py-1.5 rounded-full shadow-sm">
                    <RefreshCcw size={12}/> 最新15件に戻す
                  </button>
                )}
              </div>

              {/* From-To 検索バー */}
              <div className="bg-white/50 p-4 rounded-[24px] border border-rose-100 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[9px] font-black text-rose-400 ml-1 italic">FROM</label>
                    <input type="date" value={searchFrom} onChange={e => setSearchFrom(e.target.value)} className="w-full bg-white border-none rounded-xl h-10 text-[12px] font-bold focus:ring-1 focus:ring-rose-300" />
                  </div>
                  <div className="text-rose-200 pt-4">〜</div>
                  <div className="flex-1">
                    <label className="text-[9px] font-black text-rose-400 ml-1 italic">TO</label>
                    <input type="date" value={searchTo} onChange={e => setSearchTo(e.target.value)} className="w-full bg-white border-none rounded-xl h-10 text-[12px] font-bold focus:ring-1 focus:ring-rose-300" />
                  </div>
                  <button onClick={handleSearchLogs} className="mt-4 w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-transform">
                    <Search size={20}/>
                  </button>
                </div>
              </div>

              <div className="space-y-3 pb-20">
                {recentLogs.length > 0 ? recentLogs.map(log => (
                  <div key={log.id} onClick={() => { setLogDate(log.date); scrollToTop(); }} className={`shadow-sm rounded-2xl p-4 flex justify-between items-center active:scale-95 transition-all cursor-pointer ${logDate === log.date ? 'ring-2 ring-rose-400 bg-rose-50' : 'bg-white'}`}>
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-black text-rose-700">{log.date?.replace(/-/g, '/')}</div>
                      {log.signs && log.signs.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {log.signs.map((s: string) => (
                            <span key={s} className="bg-red-50 text-red-500 text-[9px] px-1.5 py-0.5 rounded-md font-bold border border-red-100 italic">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        {Object.values(log.meals || {}).some(v => v !== '') && <div className="w-2 h-2 rounded-full bg-orange-400" />}
                        {Object.values(log.poops || {}).some(v => v !== '') && <div className="w-2 h-2 rounded-full bg-amber-700" />}
                        {Object.values(log.walks || {}).some(v => v !== '' && v !== 'なし') && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </div>
                      <ChevronRight size={18} className="text-rose-100" />
                    </div>
                  </div>
                )) : <p className="text-center text-xs text-rose-200 py-10 font-bold">該当する履歴がありません</p>}
              </div>
            </div>

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-50">
              <button onClick={saveLog} className="w-full bg-rose-500 h-16 rounded-full shadow-2xl text-white font-black text-xl flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-rose-600"><Save size={24}/> 保存する</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}