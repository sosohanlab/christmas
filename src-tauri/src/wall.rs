// 마을을 바탕화면 아이콘 "밑"에 까는 기능 (윈도우 전용).
// 월페이퍼 엔진처럼 바탕화면 그림이 그려지는 자리(WorkerW)에 마을 창을 넣어요.
// 그러면 아이콘이 항상 마을 위에 보이고, 다른 창을 열면 마을은 그 뒤로 가요.

#[cfg(windows)]
mod imp {
    use windows::core::{w, Interface, BOOL, PCWSTR};
    use windows::Win32::Foundation::{HWND, LPARAM, POINT, WPARAM};
    use windows::Win32::Graphics::Gdi::{ClientToScreen, MapWindowPoints};
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CoTaskMemFree, IServiceProvider, CLSCTX_ALL,
        COINIT_APARTMENTTHREADED,
    };
    use windows::Win32::System::Variant::{VARIANT, VARIANT_0, VARIANT_0_0, VARIANT_0_0_0, VT_I4};
    use windows::Win32::UI::Input::KeyboardAndMouse::GetAsyncKeyState;
    use windows::Win32::UI::Shell::{
        IFolderView, IShellBrowser, IShellWindows, ShellWindows, SID_STopLevelBrowser,
        SVGIO_ALLVIEW, SWC_DESKTOP, SWFO_NEEDDISPATCH,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, FindWindowExW, GetAncestor, GA_PARENT, FindWindowW, SendMessageTimeoutW, SetParent, SetWindowPos,
        HWND_TOP, SMTO_NORMAL, SWP_NOACTIVATE, SWP_NOCOPYBITS, SWP_SHOWWINDOW, SWP_FRAMECHANGED, SWP_NOMOVE, SWP_NOSIZE, SWP_NOZORDER,
        GetWindowLongPtrW, SetWindowLongPtrW, GWL_STYLE, SystemParametersInfoW, SPI_GETDESKWALLPAPER, SYSTEM_PARAMETERS_INFO_UPDATE_FLAGS,
    };
    use windows::Win32::Graphics::Gdi::GetSysColor;
    use windows::Win32::Graphics::Gdi::COLOR_DESKTOP;
    use std::sync::atomic::{AtomicIsize, Ordering};
    static SAVED_STYLE: AtomicIsize = AtomicIsize::new(0);

    /// 아이콘 밑에 넣으면 윈도우가 옛날식 제목줄을 그려서, 테두리·제목줄 표시를 떼어 냄 (꺼낼 때 되돌림)
    fn frame(win: isize, under: bool) {
        unsafe {
            let cur = GetWindowLongPtrW(h(win), GWL_STYLE);
            if under {
                if SAVED_STYLE.load(Ordering::Relaxed) == 0 { SAVED_STYLE.store(cur, Ordering::Relaxed); }
                let strip: isize = 0x00C00000 | 0x00040000 | 0x00080000 | 0x00020000 | 0x00010000; // 제목줄·굵은 테두리·창 메뉴·최소/최대 버튼
                SetWindowLongPtrW(h(win), GWL_STYLE, cur & !strip);
            } else {
                let sv = SAVED_STYLE.swap(0, Ordering::Relaxed);
                if sv != 0 { SetWindowLongPtrW(h(win), GWL_STYLE, sv); }
            }
            let _ = SetWindowPos(h(win), None, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED);
        }
    }

    /// 지금 윈도우 배경화면 그림 파일 경로와 바탕색 (#rrggbb)
    pub fn desk_wallpaper() -> (String, String) {
        unsafe {
            let mut buf = [0u16; 520];
            let _ = SystemParametersInfoW(SPI_GETDESKWALLPAPER, buf.len() as u32, Some(buf.as_mut_ptr() as *mut core::ffi::c_void), SYSTEM_PARAMETERS_INFO_UPDATE_FLAGS(0));
            let n = buf.iter().position(|&c| c == 0).unwrap_or(0);
            let path = String::from_utf16_lossy(&buf[..n]);
            let c = GetSysColor(COLOR_DESKTOP);
            let col = format!("#{:02x}{:02x}{:02x}", c & 0xff, (c >> 8) & 0xff, (c >> 16) & 0xff);
            (path, col)
        }
    }

    fn h(v: isize) -> HWND {
        HWND(v as _)
    }
    fn raw(v: HWND) -> isize {
        v.0 as isize
    }

    #[repr(C)]
    struct Found {
        worker: HWND,
        defview: HWND,
    }

    unsafe extern "system" fn each_top(top: HWND, lp: LPARAM) -> BOOL {
        let f = unsafe { &mut *(lp.0 as *mut Found) };
        if let Ok(dv) = unsafe { FindWindowExW(Some(top), None, w!("SHELLDLL_DefView"), PCWSTR::null()) } {
            if !dv.is_invalid() {
                f.defview = dv;
                if let Ok(ww) = unsafe { FindWindowExW(None, Some(top), w!("WorkerW"), PCWSTR::null()) } {
                    if !ww.is_invalid() {
                        f.worker = ww;
                    }
                }
            }
        }
        BOOL(1)
    }

    /// 마을을 넣을 자리(WorkerW)와 아이콘 목록 창을 찾음
    pub fn find() -> Option<(isize, isize)> {
        unsafe {
            let progman = FindWindowW(w!("Progman"), PCWSTR::null()).ok()?;
            let mut r: usize = 0;
            // 바탕화면 그림 자리를 따로 만들어 달라고 요청 (월페이퍼 엔진도 쓰는 방법)
            let _ = SendMessageTimeoutW(progman, 0x052C, WPARAM(0xD), LPARAM(1), SMTO_NORMAL, 1000, Some(&mut r as *mut usize));
            let mut f = Found { worker: HWND::default(), defview: HWND::default() };
            // 윈도우 11 최신판: 아이콘(DefView)과 그림 자리(WorkerW)가 둘 다 Progman 안에 있음
            if let Ok(dv) = FindWindowExW(Some(progman), None, w!("SHELLDLL_DefView"), PCWSTR::null()) {
                if !dv.is_invalid() {
                    f.defview = dv;
                    if let Ok(ww) = FindWindowExW(Some(progman), None, w!("WorkerW"), PCWSTR::null()) {
                        if !ww.is_invalid() {
                            f.worker = ww;
                        }
                    }
                }
            }
            // 예전 윈도우: 아이콘이 든 WorkerW 바로 뒤의 WorkerW가 그림 자리
            if f.worker.is_invalid() {
                let _ = EnumWindows(Some(each_top), LPARAM(&mut f as *mut Found as isize));
            }
            if f.worker.is_invalid() || f.defview.is_invalid() {
                return None;
            }
            let lv = FindWindowExW(Some(f.defview), None, w!("SysListView32"), PCWSTR::null()).unwrap_or_default();
            Some((raw(f.worker), raw(lv)))
        }
    }

    /// 마을 창을 아이콘 밑(그림 자리)에 넣음. x, y, w, ht는 화면 기준 실제 픽셀
    pub fn attach(win: isize, worker: isize, x: i32, y: i32, wd: i32, ht: i32) -> bool {
        unsafe {
            // 돌려주는 값(이전 부모)은 보통 창이면 비어 있을 수 있어서 결과는 보지 않음
            frame(win, true);
            let _ = SetParent(h(win), Some(h(worker)));
            let mut pts = [POINT { x, y }];
            MapWindowPoints(None, Some(h(worker)), &mut pts);
            // 이미 그 자리면 다시 그리지 않음 (배경 깜빡임 줄이기)
            SetWindowPos(h(win), Some(HWND_TOP), pts[0].x, pts[0].y, wd, ht, SWP_NOACTIVATE | SWP_NOCOPYBITS).is_ok()
        }
    }

    /// 아이콘 밑에서 꺼내 보통 창으로 되돌림
    pub fn detach(win: isize, x: i32, y: i32, wd: i32, ht: i32) {
        unsafe {
            let _ = SetParent(h(win), None);
            frame(win, false);
            let _ = SetWindowPos(h(win), Some(HWND_TOP), x, y, wd, ht, SWP_NOACTIVATE | SWP_SHOWWINDOW);
        }
    }

    /// 그림 자리에 마을 말고 다른 창(월페이퍼 엔진 등)이 있는지: 있으면 그 배경이 보이게 둠
    pub fn other_wallpaper(worker: isize, win: isize) -> bool {
        unsafe {
            let mut cur: Option<HWND> = None;
            for _ in 0..32 {
                match FindWindowExW(Some(h(worker)), cur, PCWSTR::null(), PCWSTR::null()) {
                    Ok(c) if !c.is_invalid() => {
                        if raw(c) != win && windows::Win32::UI::WindowsAndMessaging::IsWindowVisible(c).as_bool() { return true; }
                        cur = Some(c);
                    }
                    _ => break,
                }
            }
            false
        }
    }

    /// 지금 마을 창이 어느 창 안에 들어가 있는지
    pub fn parent_of(win: isize) -> isize {
        unsafe { raw(GetAncestor(h(win), GA_PARENT)) }
    }

    pub fn mouse_down() -> bool {
        unsafe { (GetAsyncKeyState(0x01) as u16 & 0x8000) != 0 }
    }

    /// 바탕화면 아이콘 위치 알아내기
    pub struct Icons {
        fv: Option<IFolderView>,
    }
    impl Icons {
        pub fn new() -> Self {
            unsafe {
                let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
            }
            Icons { fv: None }
        }
        fn view() -> Option<IFolderView> {
            unsafe {
                let sw: IShellWindows = CoCreateInstance(&ShellWindows, None, CLSCTX_ALL).ok()?;
                let loc = VARIANT {
                    Anonymous: VARIANT_0 {
                        Anonymous: core::mem::ManuallyDrop::new(VARIANT_0_0 {
                            vt: VT_I4,
                            wReserved1: 0,
                            wReserved2: 0,
                            wReserved3: 0,
                            Anonymous: VARIANT_0_0_0 { lVal: 0 },
                        }),
                    },
                };
                let empty = VARIANT::default();
                let mut hw: i32 = 0;
                let disp = sw.FindWindowSW(&loc, &empty, SWC_DESKTOP, &mut hw, SWFO_NEEDDISPATCH).ok()?;
                let sp: IServiceProvider = disp.cast().ok()?;
                let br: IShellBrowser = sp.QueryService(&SID_STopLevelBrowser).ok()?;
                let v = br.QueryActiveShellView().ok()?;
                v.cast::<IFolderView>().ok()
            }
        }
        /// 아이콘마다 (왼, 위, 오른, 아래) 화면 기준 실제 픽셀
        pub fn rects(&mut self, listview: isize) -> Vec<(i32, i32, i32, i32)> {
            let mut out = Vec::new();
            if self.fv.is_none() {
                self.fv = Self::view();
            }
            let Some(fv) = self.fv.as_ref() else { return out };
            unsafe {
                let n = match fv.ItemCount(SVGIO_ALLVIEW) {
                    Ok(n) => n,
                    Err(_) => {
                        self.fv = None;
                        return out;
                    }
                };
                let mut sp = POINT::default();
                let _ = fv.GetSpacing(&mut sp);
                for i in 0..n.min(500) {
                    if let Ok(pidl) = fv.Item(i) {
                        if let Ok(pt) = fv.GetItemPosition(pidl) {
                            let mut s = pt;
                            if listview != 0 {
                                let _ = ClientToScreen(h(listview), &mut s);
                            }
                            out.push((s.x, s.y, s.x + sp.x, s.y + sp.y));
                        }
                        CoTaskMemFree(Some(pidl as *const core::ffi::c_void));
                    }
                }
            }
            out
        }
    }
}

#[cfg(not(windows))]
mod imp {
    // 윈도우가 아니면 아이콘 밑에 까는 기능 없음 (보통 창으로 동작)
    pub fn find() -> Option<(isize, isize)> {
        None
    }
    pub fn attach(_: isize, _: isize, _: i32, _: i32, _: i32, _: i32) -> bool {
        false
    }
    pub fn detach(_: isize, _: i32, _: i32, _: i32, _: i32) {}
    pub fn parent_of(_: isize) -> isize {
        0
    }
    pub fn mouse_down() -> bool {
        false
    }
    pub fn desk_wallpaper() -> (String, String) {
        (String::new(), "#000000".into())
    }
    pub fn other_wallpaper(_: isize, _: isize) -> bool {
        false
    }
    pub struct Icons;
    impl Icons {
        pub fn new() -> Self {
            Icons
        }
        pub fn rects(&mut self, _: isize) -> Vec<(i32, i32, i32, i32)> {
            Vec::new()
        }
    }
}

pub use imp::*;
