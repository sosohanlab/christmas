// 크리스마스 어드벤트 마을 — 타우리 껍데기.
// 작업표시줄 위 화면 전체에 투명한 창을 띄우고, 그림이 없는 곳은 클릭이 바탕화면으로 그대로 통과하게 합니다.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    fs,
    path::PathBuf,
    sync::atomic::{AtomicBool, Ordering},
    thread,
    time::Duration,
};
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

mod wall;

static IGNORING: AtomicBool = AtomicBool::new(true); // 화면이 "클릭 통과" 상태인지 (그림 없는 곳 위)
static WALL: AtomicBool = AtomicBool::new(true); // 아이콘 밑에 깔기 설정
static TOP: AtomicBool = AtomicBool::new(false); // 다른 창 위에 항상 표시 설정
static UNDER: AtomicBool = AtomicBool::new(false); // 지금 아이콘 밑에 깔려 있는지
static FRONT: AtomicBool = AtomicBool::new(false); // 놀이 창·도구가 열려 있어서 마을이 앞에 있어야 하는지

fn win_handle(w: &WebviewWindow) -> isize {
    #[cfg(windows)]
    {
        return w.hwnd().map(|h| h.0 as isize).unwrap_or(0);
    }
    #[cfg(not(windows))]
    {
        let _ = w;
        0
    }
}

// 작업표시줄을 뺀 화면 영역 (실제 픽셀)
fn work_rect(w: &WebviewWindow) -> Option<(i32, i32, i32, i32)> {
    let m = w.primary_monitor().ok()??;
    let wa = m.work_area();
    Some((wa.position.x, wa.position.y, wa.size.width as i32, wa.size.height as i32))
}

fn save_wall(app: &AppHandle, on: bool) {
    let d = data_dir(app);
    let _ = fs::create_dir_all(&d);
    let _ = fs::write(d.join("wall.json"), if on { "{\"on\":true}" } else { "{\"on\":false}" });
}
fn load_wall(app: &AppHandle) -> bool {
    fs::read_to_string(data_dir(app).join("wall.json"))
        .map(|t| !t.contains("false"))
        .unwrap_or(true)
}

fn data_dir(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .unwrap_or_else(|_| std::env::temp_dir().join("AdventVillage"))
}

// 저장한 진행 상황 읽기: 정상본이 깨졌으면 직전 정상본(.bak)을 씀
fn load_state(app: &AppHandle) -> Option<String> {
    let d = data_dir(app);
    for name in ["progress.json", "progress.json.bak"] {
        if let Ok(raw) = fs::read_to_string(d.join(name)) {
            if serde_json::from_str::<serde_json::Value>(&raw).is_ok() {
                return Some(raw);
            }
        }
    }
    None
}

// 저장: 임시 파일에 쓴 뒤 바꿔치기, 직전 정상본은 .bak으로 보관
#[tauri::command]
fn save_state(app: AppHandle, raw: String) {
    if raw.len() > 6_000_000 || serde_json::from_str::<serde_json::Value>(&raw).is_err() {
        return;
    }
    let d = data_dir(&app);
    let _ = fs::create_dir_all(&d);
    let f = d.join("progress.json");
    let tmp = d.join("progress.json.tmp");
    if fs::write(&tmp, &raw).is_ok() {
        if f.exists() {
            let _ = fs::copy(&f, d.join("progress.json.bak"));
        }
        let _ = fs::rename(&tmp, &f);
    }
}

#[tauri::command]
fn set_ignore(window: WebviewWindow, on: bool) {
    IGNORING.store(on, Ordering::Relaxed);
    // 아이콘 밑에 있을 때는 어차피 마우스를 직접 못 받으니 창 설정을 건드리지 않음 (건드리면 깜빡거림)
    if !UNDER.load(Ordering::Relaxed) {
        let _ = window.set_ignore_cursor_events(on);
    }
}

#[tauri::command]
fn set_top(window: WebviewWindow, on: bool) {
    TOP.store(on, Ordering::Relaxed);
    let _ = window.set_always_on_top(on);
}

#[tauri::command]
fn set_front(on: bool) {
    FRONT.store(on, Ordering::Relaxed);
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

// 작업표시줄을 뺀 화면 크기에 창을 맞춤
fn fit(w: &WebviewWindow) {
    if let Ok(Some(m)) = w.primary_monitor() {
        let wa = m.work_area();
        let _ = w.set_position(wa.position);
        let _ = w.set_size(wa.size);
    }
}

fn show_quiet(w: &WebviewWindow) {
    let _ = w.show();
    let _ = w.set_ignore_cursor_events(IGNORING.load(Ordering::Relaxed));
}


// 아이콘 밑에 깔리면 원래 배경화면이 가려져서(검게 보임), 배경화면 그림을 마을 화면 뒤에 직접 깔아 줌
fn desk_bg_key() -> String {
    let (p, c) = wall::desk_wallpaper();
    let m = std::fs::metadata(&p).and_then(|m| m.modified()).map(|t| format!("{:?}", t)).unwrap_or_default();
    format!("{}|{}|{}", p, c, m)
}
fn desk_bg_file() -> Option<(Vec<u8>, &'static str)> {
    let (p, _) = wall::desk_wallpaper();
    let mut path = std::path::PathBuf::from(&p);
    if p.is_empty() || !path.exists() {
        // 스포트라이트 등으로 원본이 없으면 윈도우가 만들어 둔 사본을 씀
        if let Ok(ad) = std::env::var("APPDATA") { path = std::path::PathBuf::from(ad).join("Microsoft\\Windows\\Themes\\TranscodedWallpaper"); }
    }
    let d = std::fs::read(&path).ok()?;
    if d.is_empty() { return None; }
    let mime = if d.starts_with(&[0x89, b'P']) { "image/png" } else if d.starts_with(b"BM") { "image/bmp" } else if d.starts_with(b"RIFF") { "image/webp" } else { "image/jpeg" };
    Some((d, mime))
}
fn desk_log(msg: &str) {
    // 개발용 기록: 개발 폴더가 있는 PC에서만 남김
    if let Ok(up) = std::env::var("USERPROFILE") {
        let dir = std::path::PathBuf::from(up).join("Downloads\\AdventVillage-tauri\\advent");
        if dir.exists() { let _ = std::fs::write(dir.join("deskbg-log.txt"), msg); }
    }
}
fn desk_bg_js() -> String {
    let (p, c) = wall::desk_wallpaper();
    let ok = desk_bg_file().is_some();
    desk_log(&format!("wallpaper path: {}\ncolor: {}\nfile read ok: {}\n", p, c, ok));
    let url = if ok { format!("http://deskbg.localhost/w?t={}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_millis()).unwrap_or(0)) } else { String::new() };
    format!("window.__deskBg && window.__deskBg({}, {});", serde_json::to_string(&url).unwrap_or("\"\"".into()), serde_json::to_string(&c).unwrap_or("\"#000\"".into()))
}

fn main() {
    tauri::Builder::default()
        // 배경화면 그림을 마을 화면에 건네주는 주소 (http://deskbg.localhost/)
        .register_uri_scheme_protocol("deskbg", |_ctx, _req| {
            match desk_bg_file() {
                Some((d, mime)) => tauri::http::Response::builder().header("Content-Type", mime).header("Cache-Control", "no-store").body(d).unwrap(),
                None => tauri::http::Response::builder().status(404).body(Vec::new()).unwrap(),
            }
        })
        // 두 번 켜면 새로 띄우지 않고 기존 마을을 다시 보이게 함
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                show_quiet(&w);
            }
        }))
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .invoke_handler(tauri::generate_handler![save_state, set_ignore, set_top, set_front, quit_app])
        .setup(|app| {
            let handle = app.handle().clone();
            WALL.store(load_wall(&handle), Ordering::Relaxed);

            // 처음 설치해서 켰을 때 한 번만: 윈도우를 켤 때 마을도 같이 켜지게 (트레이 메뉴에서 끌 수 있음)
            let d = data_dir(&handle);
            let first = d.join("firstrun.json");
            if !first.exists() {
                if !cfg!(debug_assertions) {
                    let _ = handle.autolaunch().enable();
                }
                let _ = fs::create_dir_all(&d);
                let _ = fs::write(&first, "{\"done\":1}");
            }

            // 저장된 진행 상황을 화면이 뜨기 전에 미리 넣어 둠
            let state = load_state(&handle)
                .map(|raw| serde_json::to_string(&raw).unwrap_or_else(|_| "null".into()))
                .unwrap_or_else(|| "null".into());
            let init = format!(
                "window.__ADVENT_STATE__ = {};\n{}",
                state,
                include_str!("shim.js")
            );

            let w = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .title("크리스마스 어드벤트 마을")
                .transparent(true)
                .decorations(false)
                .shadow(false)
                .resizable(false)
                .maximizable(false)
                .minimizable(false)
                .skip_taskbar(true)
                .focused(false)
                .visible(false)
                .initialization_script(&init)
                .build()?;
            fit(&w);
            show_quiet(&w); // 보인 다음에 클릭 통과를 켬

            // 창 닫기를 눌러도 끄지 않고 숨김 (트레이에 남아 있음)
            {
                let w2 = w.clone();
                w.on_window_event(move |e| {
                    if let WindowEvent::CloseRequested { api, .. } = e {
                        api.prevent_close();
                        let _ = w2.hide();
                    }
                });
            }

            // 트레이 아이콘과 메뉴
            let toggle = MenuItem::with_id(app, "toggle", "마을 잠깐 숨기기", true, None::<&str>)?;
            let top = CheckMenuItem::with_id(app, "top", "다른 창 위에 항상 표시", true, false, None::<&str>)?;
            let auto_on = handle.autolaunch().is_enabled().unwrap_or(false);
            let auto = CheckMenuItem::with_id(app, "auto", "윈도우 시작할 때 자동 실행", true, auto_on, None::<&str>)?;
            let wallm = CheckMenuItem::with_id(app, "wall", "아이콘 밑에 깔기 (배경화면처럼)", true, WALL.load(Ordering::Relaxed), None::<&str>)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let quit = MenuItem::with_id(app, "quit", "종료", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle, &wallm, &top, &auto, &sep, &quit])?;

            let toggle_vis = {
                let toggle = toggle.clone();
                move |app: &AppHandle| {
                    if let Some(w) = app.get_webview_window("main") {
                        if w.is_visible().unwrap_or(true) {
                            let _ = w.hide();
                            let _ = toggle.set_text("마을 다시 보이기");
                        } else {
                            show_quiet(&w);
                            let _ = toggle.set_text("마을 잠깐 숨기기");
                        }
                    }
                }
            };
            let toggle_vis2 = toggle_vis.clone();

            let mut tray = TrayIconBuilder::with_id("main")
                .tooltip("크리스마스 어드벤트 마을")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, e| match e.id().as_ref() {
                    "toggle" => toggle_vis(app),
                    "top" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let on = top.is_checked().unwrap_or(false);
                            TOP.store(on, Ordering::Relaxed);
                            let _ = w.set_always_on_top(on);
                        }
                    }
                    "auto" => {
                        let al = app.autolaunch();
                        if auto.is_checked().unwrap_or(false) {
                            let _ = al.enable();
                        } else {
                            let _ = al.disable();
                        }
                    }
                    "wall" => {
                        let on = wallm.is_checked().unwrap_or(true);
                        WALL.store(on, Ordering::Relaxed);
                        save_wall(app, on);
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(move |tray, e| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = e
                    {
                        toggle_vis2(tray.app_handle());
                    }
                });
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.build(app)?;

            // 마우스 위치 알려 주기, 화면 크기 맞추기, 아이콘 밑에 깔기/꺼내기
            let h2 = handle.clone();
            thread::spawn(move || {
                #[derive(Clone, Copy, PartialEq)]
                enum Mode {
                    Normal,
                    Under(isize, isize), // 아이콘 밑 (그림 자리, 아이콘 목록 창)
                    Lifted,              // 마을을 눌러서 잠깐 앞으로 나온 상태
                }
                let mut mode = Mode::Normal;
                let mut icons = wall::Icons::new();
                let mut icon_rects: Vec<(i32, i32, i32, i32)> = Vec::new();
                let mut rect: Option<(i32, i32, i32, i32)> = None;
                let mut placed = (0, 0, 0, 0);
                let mut bg_key = String::new();
                let mut last = (f64::NAN, f64::NAN);
                let (mut tick, mut retry_at, mut quiet): (u32, u32, u32) = (0, 0, 0);
                let (mut was_down, mut down_ok, mut was_inside) = (false, false, false);
                let eval = |w: &WebviewWindow, js: &str| {
                    let _ = w.eval(js);
                };
                loop {
                    thread::sleep(Duration::from_millis(33));
                    tick = tick.wrapping_add(1);
                    let Some(w) = h2.get_webview_window("main") else { continue };
                    let visible = w.is_visible().unwrap_or(false);
                    if rect.is_none() || tick % 30 == 0 {
                        rect = work_rect(&w);
                    }
                    let Some((rx0, ry0, rw, rh)) = rect else { continue };
                    let hwnd = win_handle(&w);
                    let want_under = WALL.load(Ordering::Relaxed) && !TOP.load(Ordering::Relaxed) && visible && hwnd != 0;

                    match mode {
                        Mode::Normal => {
                            if want_under && tick >= retry_at {
                                match wall::find() {
                                    Some((wk, lv)) if wall::attach(hwnd, wk, rx0, ry0, rw, rh) => {
                                        mode = Mode::Under(wk, lv);
                                        placed = (rx0, ry0, rw, rh);
                                        icon_rects = icons.rects(lv);
                                        UNDER.store(true, Ordering::Relaxed);
                                        eval(&w, "window.__adventWall = true;");
                                        let k = format!("{}|{}", desk_bg_key(), wall::other_wallpaper(wk, hwnd));
                                        if wall::other_wallpaper(wk, hwnd) { bg_key = k; desk_log("other wallpaper program found: using it"); eval(&w, "window.__deskBg && window.__deskBg(null);"); } else if k == bg_key { eval(&w, "window.__deskBg && window.__deskBg('keep');"); } else { bg_key = k; eval(&w, &desk_bg_js()); }
                                    }
                                    _ => retry_at = tick + 300, // 못 찾으면 10초 뒤 다시
                                }
                            } else if tick % 90 == 0 {
                                let w3 = w.clone();
                                let _ = w.run_on_main_thread(move || fit(&w3));
                            }
                        }
                        Mode::Under(wk, lv) => {
                            if !want_under {
                                wall::detach(hwnd, rx0, ry0, rw, rh);
                                mode = Mode::Normal;
                                eval(&w, "window.__adventWall = false; window.__deskBg && window.__deskBg(null);");
                                let _ = w.set_ignore_cursor_events(IGNORING.load(Ordering::Relaxed));
                            } else if tick % 30 == 0 {
                                // 화면 크기·작업표시줄이 바뀌었거나, 윈도우가 마을을 빼냈을 때만 다시 넣음 (매번 넣으면 깜빡거림)
                                let cur = (rx0, ry0, rw, rh);
                                if cur != placed || wall::parent_of(hwnd) != wk {
                                    if wall::attach(hwnd, wk, rx0, ry0, rw, rh) {
                                        placed = cur;
                                    } else {
                                        mode = Mode::Normal;
                                        eval(&w, "window.__adventWall = false;");
                                    }
                                }
                                if tick % 90 == 0 {
                                    icon_rects = icons.rects(lv);
                                }
                                if tick % 300 == 0 {
                                    // 배경화면을 바꿨거나 슬라이드쇼로 넘어갔으면 다시 깔기
                                    let other = wall::other_wallpaper(wk, hwnd);
                                    let k = format!("{}|{}", desk_bg_key(), other);
                                    if k != bg_key { bg_key = k; eval(&w, if other { "window.__deskBg && window.__deskBg(null);".to_string() } else { desk_bg_js() }.as_str()); }
                                }
                            }
                        }
                        Mode::Lifted => {
                            if !want_under {
                                mode = Mode::Normal;
                            } else if !FRONT.load(Ordering::Relaxed) && !wall::mouse_down() {
                                // 놀이 창을 다 닫으면 0.3초 뒤 다시 아이콘 밑으로
                                quiet += 1;
                                if quiet > 9 {
                                    quiet = 0;
                                    mode = Mode::Normal;
                                    retry_at = 0;
                                }
                            } else {
                                quiet = 0;
                            }
                        }
                    }
                    let under = matches!(mode, Mode::Under(..));
                    UNDER.store(under, Ordering::Relaxed);
                    let Ok(c) = h2.cursor_position() else { continue };
                    let sf = w.scale_factor().unwrap_or(1.0);
                    let (px, py) = (c.x - rx0 as f64, c.y - ry0 as f64);
                    let inside = px >= 0.0 && py >= 0.0 && px < rw as f64 && py < rh as f64;
                    let (x, y) = (px / sf, py / sf);

                    // 아이콘 밑에 있을 때: 마을 그림을 누르면(아이콘이 아닌 곳) 마을을 앞으로 꺼내고 그 클릭을 전달
                    if under {
                        let down = wall::mouse_down();
                        if down && !was_down {
                            let (cx, cy) = (c.x as i32, c.y as i32);
                            let on_icon = icon_rects.iter().any(|r| cx >= r.0 && cx < r.2 && cy >= r.1 && cy < r.3);
                            down_ok = inside && !IGNORING.load(Ordering::Relaxed) && !on_icon;
                        }
                        if !down && was_down && down_ok {
                            // 아이콘 밑에 있는 채로 그 자리를 대신 눌러 줌. 놀이 창이 열리면 그때 앞으로 나옴
                            down_ok = false;
                            eval(&w, &format!(
                                "window.__adventClick && window.__adventClick({:.1}, {:.1});",
                                x, y
                            ));
                        }
                        if FRONT.load(Ordering::Relaxed) {
                            // 화면보다 1픽셀 작게 꺼냄: 월페이퍼 엔진이 "다른 프로그램이 화면을 꽉 채웠다"고 보고 배경을 멈추지 않게
                            wall::detach(hwnd, rx0, ry0, rw - 1, rh - 1);
                            mode = Mode::Lifted;
                            quiet = 0;
                            let _ = w.set_ignore_cursor_events(IGNORING.load(Ordering::Relaxed));
                            eval(&w, "window.__adventWall = false; window.__deskBg && window.__deskBg(null);");
                        }
                        was_down = down;
                    } else {
                        was_down = false;
                    }

                    // 창이 마우스를 직접 못 받는 동안에는 마우스 위치를 알려 줌
                    let forward = IGNORING.load(Ordering::Relaxed) || matches!(mode, Mode::Under(..));
                    if forward && visible && !inside && was_inside {
                        // 마을 밖으로 나가면 마우스 올림 표시를 지움
                        was_inside = false;
                        last = (f64::NAN, f64::NAN);
                        eval(&w, "window.__adventCursor && window.__adventCursor(-9999, -9999);");
                    }
                    if !forward || !visible || !inside {
                        continue;
                    }
                    was_inside = true;
                    if (x - last.0).abs() < 0.5 && (y - last.1).abs() < 0.5 {
                        continue;
                    }
                    last = (x, y);
                    eval(&w, &format!(
                        "window.__adventCursor && window.__adventCursor({:.1}, {:.1});",
                        x, y
                    ));
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("마을을 켜지 못했어요");
}
